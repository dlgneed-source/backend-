import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { authApi, teamApi, usersApi } from '@/lib/api';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useWeb3Modal, useWeb3ModalEvents } from '@web3modal/wagmi/react';

interface AuthUser {
  id: string;
  memberId?: string | null;
  walletAddress: string;
  name?: string;
  avatarUrl?: string | null;
  balance: string;
  totalEarned: string;
  totalInvested: string;
  totalWithdrawn: string;
  status: string;
  referralCode?: string;
  referralLink?: string;
  directReferrals?: number;
  totalTeam?: number;
  directReferralIncome?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  walletError: string | null;
  login: () => Promise<boolean>;
  logout: () => void;
  clearWalletError: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AUTH_TOKEN_KEY = 'ea_auth_token';
const AuthContext = createContext<AuthContextType | null>(null);

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(address) ? address : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const userRef = useRef<AuthUser | null>(user);
  const loginPendingRef = useRef(false);

  useEffect(() => { userRef.current = user; }, [user]);

  const { open, close } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const modalEvents = useWeb3ModalEvents();

  // Keep a ref to the latest Wagmi address for use inside async callbacks
  const addressRef = useRef<string | undefined>(address);
  useEffect(() => { addressRef.current = address; }, [address]);

  // Reset pending flag if the modal is closed before the user connects
  useEffect(() => {
    if (modalEvents.data.event === 'MODAL_CLOSE' && loginPendingRef.current && !isConnected) {
      loginPendingRef.current = false;
    }
  }, [modalEvents.data.event, isConnected]);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }, []);

  const buildAuthenticatedUser = useCallback(async (
    authToken: string,
    fallbackUser?: { id: string; walletAddress: string; name?: string | null; referralCode?: string; status: string }
  ): Promise<AuthUser> => {
    const [profileResult, balanceResult, referralResult, teamStatsResult, teamCommissionsResult] = await Promise.allSettled([
      usersApi.getProfile(authToken),
      usersApi.getBalance(authToken),
      usersApi.getReferralLink(authToken),
      teamApi.getStats(authToken),
      teamApi.getCommissions(authToken, 1),
    ]);

    const profile = profileResult.status === 'fulfilled' ? profileResult.value.user : undefined;
    const balance = balanceResult.status === 'fulfilled' ? balanceResult.value.balance : undefined;
    const referral = referralResult.status === 'fulfilled' ? referralResult.value : undefined;
    const teamStats = teamStatsResult.status === 'fulfilled' ? teamStatsResult.value.stats : undefined;
    const teamCommissions = teamCommissionsResult.status === 'fulfilled' ? teamCommissionsResult.value : undefined;

    const finalWalletAddress = profile?.walletAddress || fallbackUser?.walletAddress || '';
    const normalizedWalletAddress = normalizeAddress(finalWalletAddress);
    if (!normalizedWalletAddress) {
      throw new Error('Invalid wallet returned by server');
    }

    return {
      id: profile?.id || fallbackUser?.id || '',
      memberId: profile?.memberId ?? null,
      walletAddress: normalizedWalletAddress,
      name: profile?.name || fallbackUser?.name || undefined,
      avatarUrl: profile?.avatarUrl ?? null,
      balance: String(balance?.availableBalance ?? 0),
      totalEarned: String(balance?.totalEarned ?? 0),
      totalInvested: String(profile?.totalInvested ?? 0),
      totalWithdrawn: String(balance?.totalWithdrawn ?? 0),
      status: String(profile?.status || fallbackUser?.status || 'ACTIVE'),
      referralCode: referral?.referralCode || profile?.referralCode || fallbackUser?.referralCode,
      referralLink: referral?.referralLink,
      directReferrals: profile?._count?.referrals || 0,
      totalTeam: teamStats?.totalMembers || 0,
      directReferralIncome: String(teamCommissions?.totalEarned ?? 0),
    };
  }, []);

  const runAuthFlow = useCallback(async (walletAddr: string) => {
    const normalizedAddress = normalizeAddress(walletAddr);
    if (!normalizedAddress) {
      setWalletError('Wallet connection failed. No valid account received.');
      toast.error('Wallet connection failed. No valid account received.');
      return;
    }

    console.log('[AuthFlow] Starting auth flow for address:', normalizedAddress);
    setIsLoading(true);
    setWalletError(null);

    // Capture the connected address so we can verify it hasn't changed by the time we commit
    const addressAtStart = normalizedAddress;

    try {
      console.log('[AuthFlow] Requesting nonce from backend…');
      const nonceResponse = await authApi.getNonce(addressAtStart);
      console.log('[AuthFlow] Nonce received, requesting wallet signature…');

      let signature: string;
      try {
        signature = await signMessageAsync({ message: nonceResponse.message });
        console.log('[AuthFlow] Signature obtained successfully.');
      } catch (error) {
        const maybeError = error as { code?: number; message?: string };
        const message = maybeError?.code === 4001
          ? 'Signature request was rejected.'
          : (maybeError?.message || 'Signature failed.');
        console.warn('[AuthFlow] Signature step failed:', message);
        setWalletError(message);
        toast.error(message);
        disconnect();
        return;
      }

      console.log('[AuthFlow] Sending signature to backend for verification…');
      const verifyResponse = await authApi.verify(addressAtStart, signature);
      console.log('[AuthFlow] Verification successful, building user session…');
      const authenticatedUser = await buildAuthenticatedUser(verifyResponse.token, verifyResponse.user);

      // Guard: ensure the wallet is still connected with the same address before committing session
      if (normalizeAddress(addressRef.current) !== addressAtStart) {
        console.warn('[AuthFlow] Address changed during auth flow, aborting session commit.');
        return;
      }

      sessionStorage.setItem(AUTH_TOKEN_KEY, verifyResponse.token);
      setToken(verifyResponse.token);
      setUser(authenticatedUser);
      setWalletAddress(authenticatedUser.walletAddress);
      setWalletError(null);
      console.log('[AuthFlow] Auth flow complete. User logged in:', authenticatedUser.walletAddress);
      toast.success('Wallet connected');
    } catch (error) {
      const maybeError = error as { code?: number; message?: string };
      const rawMessage = maybeError?.message || 'Wallet login failed';
      const message = maybeError?.code === 4001
        ? 'Wallet connection request was rejected.'
        : rawMessage;
      console.error('[AuthFlow] Auth flow error:', maybeError);
      setWalletError(message);
      toast.error(message);
      disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [signMessageAsync, buildAuthenticatedUser, disconnect]);

  const login = useCallback(async (): Promise<boolean> => {
    setWalletError(null);
    if (isLoading || loginPendingRef.current) {
      return false;
    }

    // If wallet is already connected at the Wagmi level but the JWT session is missing,
    // skip opening the modal and run the auth flow directly.
    if (isConnected && address) {
      void runAuthFlow(address);
      return true;
    }

    loginPendingRef.current = true;
    try {
      await open();
    } catch (error) {
      loginPendingRef.current = false;
      const message = (error as { message?: string })?.message || 'Failed to open wallet selector.';
      setWalletError(message);
      toast.error(message);
      return false;
    }
    return true;
  }, [open, isConnected, address, runAuthFlow, isLoading]);

  // Run auth flow whenever wallet gets connected without an authenticated session
  useEffect(() => {
    if (!address || !isConnected || token) return;
    loginPendingRef.current = false;

    // Close the modal so the wallet signature prompt is clearly visible
    void close();

    void runAuthFlow(address);
  }, [address, isConnected, token, close, runAuthFlow]);

  const logout = useCallback(() => {
    disconnect();
    clearSession();
    setWalletError(null);
    toast.info('Disconnected');
  }, [clearSession, disconnect]);

  const clearWalletError = useCallback(() => {
    setWalletError(null);
  }, []);

  // Restore session from existing token on mount
  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void buildAuthenticatedUser(token)
      .then((authenticatedUser) => {
        if (cancelled) return;
        setUser(authenticatedUser);
        setWalletAddress(authenticatedUser.walletAddress);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setWalletError('Session expired. Please reconnect your wallet.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildAuthenticatedUser, clearSession, token]);

  // Track wallet address changes from Wagmi
  useEffect(() => {
    const normalizedAddress = address ? normalizeAddress(address) : null;
    setWalletAddress(normalizedAddress);

    if (!normalizedAddress && !isConnected) {
      // Wallet disconnected externally
      if (userRef.current) {
        clearSession();
        setWalletError('Wallet disconnected.');
      }
      return;
    }

    const activeUser = userRef.current;
    if (activeUser && normalizedAddress && activeUser.walletAddress !== normalizedAddress) {
      clearSession();
      setWalletError('Wallet account changed. Please reconnect.');
      toast.info('Wallet account changed. Please reconnect.');
    }
  }, [address, isConnected, clearSession]);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    walletAddress,
    walletError,
    login,
    logout,
    clearWalletError,
    updateUser,
  }), [clearWalletError, isLoading, login, logout, token, user, walletAddress, walletError, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
