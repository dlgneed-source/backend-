import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { authApi, teamApi, usersApi } from '@/lib/api';

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
}

type EthereumWindow = Window & {
  ethereum?: EthereumProvider;
};

interface AuthUser {
  id: string;
  walletAddress: string;
  name?: string;
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
}

const AUTH_TOKEN_KEY = 'ea_auth_token';
const DEFAULT_BSC_CHAIN_ID = '0x38';
const EXPECTED_CHAIN_ID = normalizeChainId(import.meta.env.VITE_CHAIN_ID || DEFAULT_BSC_CHAIN_ID);
const METAMASK_MOBILE_APP_LINK_BASE = 'https://metamask.app.link/dapp/';
const AuthContext = createContext<AuthContextType | null>(null);

function getProvider(): EthereumProvider | null {
  return (window as EthereumWindow).ethereum || null;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(userAgent);
}

function buildMetaMaskMobileAppLink(): string {
  const dappUrl = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${METAMASK_MOBILE_APP_LINK_BASE}${encodeURIComponent(dappUrl)}`;
}

function redirectToMetaMaskMobileApp(): void {
  if (import.meta.env.MODE === 'test') return;
  window.location.assign(buildMetaMaskMobileAppLink());
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(address) ? address : null;
}

function normalizeChainId(chainId: string | undefined): string | null {
  if (!chainId) return null;
  if (chainId.startsWith('0x')) {
    if (!/^0x[0-9a-f]+$/i.test(chainId)) {
      return null;
    }
    return chainId.toLowerCase();
  }

  const asNumber = Number(chainId);
  if (!Number.isFinite(asNumber) || asNumber < 0) return null;
  return `0x${asNumber.toString(16)}`.toLowerCase();
}

function formatExpectedChain(chainId: string | null): string {
  if (!chainId) return 'configured network';
  return `${chainId} (decimal ${parseInt(chainId, 16)})`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const userRef = useRef<AuthUser | null>(user);

  useEffect(() => { userRef.current = user; }, [user]);

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
      walletAddress: normalizedWalletAddress,
      name: profile?.name || fallbackUser?.name || undefined,
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

  const login = useCallback(async (): Promise<boolean> => {
    const provider = getProvider();
    if (!provider) {
      if (isMobileDevice()) {
        const message = 'MetaMask not found. Redirecting to MetaMask app...';
        setWalletError(null);
        toast.info(message);
        redirectToMetaMaskMobileApp();
        return false;
      }

      const message = 'MetaMask not detected. Please install MetaMask to continue.';
      setWalletError(message);
      toast.error(message);
      return false;
    }

    setIsLoading(true);
    setWalletError(null);

    try {
      const currentChainRaw = await provider.request({ method: 'eth_chainId' });
      const currentChain = normalizeChainId(typeof currentChainRaw === 'string' ? currentChainRaw : undefined);
      if (EXPECTED_CHAIN_ID && currentChain && currentChain !== EXPECTED_CHAIN_ID) {
        const message = `Wrong network. Switch to ${formatExpectedChain(EXPECTED_CHAIN_ID)}.`;
        setWalletError(message);
        toast.error(message);
        return false;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      const connectedAddress = normalizeAddress(accounts?.[0]);
      if (!connectedAddress) {
        const message = 'Wallet connection failed. No valid account received.';
        setWalletError(message);
        toast.error(message);
        return false;
      }

      const nonceResponse = await authApi.getNonce(connectedAddress);

      let signature: string;
      try {
        const signed = await provider.request({
          method: 'personal_sign',
          params: [nonceResponse.message, connectedAddress],
        });
        if (typeof signed !== 'string' || !signed) {
          throw new Error('Empty signature received');
        }
        signature = signed;
      } catch (error) {
        const maybeError = error as { code?: number; message?: string };
        const message = maybeError?.code === 4001
          ? 'Signature request was rejected.'
          : (maybeError?.message || 'Signature failed.');
        setWalletError(message);
        toast.error(message);
        return false;
      }

      const verifyResponse = await authApi.verify(connectedAddress, signature);
      const authenticatedUser = await buildAuthenticatedUser(verifyResponse.token, verifyResponse.user);

      sessionStorage.setItem(AUTH_TOKEN_KEY, verifyResponse.token);
      setToken(verifyResponse.token);
      setUser(authenticatedUser);
      setWalletAddress(authenticatedUser.walletAddress);
      setWalletError(null);
      toast.success('Wallet connected');
      return true;
    } catch (error) {
      const maybeError = error as { code?: number; message?: string };
      const message = maybeError?.code === 4001
        ? 'Wallet connection request was rejected.'
        : (maybeError?.message || 'Wallet login failed');
      setWalletError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [buildAuthenticatedUser]);

  const logout = useCallback(() => {
    clearSession();
    setWalletError(null);
    toast.info('Disconnected');
  }, [clearSession]);

  const clearWalletError = useCallback(() => {
    setWalletError(null);
  }, []);

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

  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const [accountsRaw, chainRaw] = await Promise.all([
          provider.request({ method: 'eth_accounts' }),
          provider.request({ method: 'eth_chainId' }),
        ]);

        if (!mounted) return;
        const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
        setWalletAddress(normalizeAddress(accounts[0]));

        const chain = normalizeChainId(typeof chainRaw === 'string' ? chainRaw : undefined);
        if (EXPECTED_CHAIN_ID && chain && chain !== EXPECTED_CHAIN_ID) {
          setWalletError(`Wrong network. Switch to ${formatExpectedChain(EXPECTED_CHAIN_ID)}.`);
        }
      } catch {
        if (import.meta.env.DEV) {
          console.warn('Failed to read wallet provider state');
        }
      }
    })();

    const handleAccountsChanged = (accountsValue: unknown) => {
      const accounts = Array.isArray(accountsValue) ? accountsValue : [];
      const nextAddress = normalizeAddress(accounts[0]);
      setWalletAddress(nextAddress);

      if (!nextAddress) {
        clearSession();
        setWalletError('Wallet disconnected.');
        return;
      }

      const activeUser = userRef.current;
      if (activeUser && activeUser.walletAddress !== nextAddress) {
        clearSession();
        setWalletError('Wallet account changed. Please reconnect.');
        toast.info('Wallet account changed. Please reconnect.');
      }
    };

    const handleChainChanged = (chainValue: unknown) => {
      const chain = normalizeChainId(typeof chainValue === 'string' ? chainValue : undefined);
      if (EXPECTED_CHAIN_ID && chain && chain !== EXPECTED_CHAIN_ID) {
        clearSession();
        setWalletError(`Wrong network. Switch to ${formatExpectedChain(EXPECTED_CHAIN_ID)}.`);
      } else {
        setWalletError((prev) => (prev?.startsWith('Wrong network.') ? null : prev));
      }
    };

    const handleDisconnect = () => {
      clearSession();
      setWalletAddress(null);
      setWalletError('Wallet disconnected.');
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    return () => {
      mounted = false;
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, [clearSession]);

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
  }), [clearWalletError, isLoading, login, logout, token, user, walletAddress, walletError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
