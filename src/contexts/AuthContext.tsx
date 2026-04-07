import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { authApi, usersApi } from '@/lib/api';

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
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (walletAddress: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loginResponse = await authApi.devLogin(walletAddress, 'Wallet User');

      const [profileResult, balanceResult, referralResult] = await Promise.allSettled([
        usersApi.getProfile(loginResponse.token),
        usersApi.getBalance(loginResponse.token),
        usersApi.getReferralLink(loginResponse.token),
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.user : undefined;
      const balance = balanceResult.status === 'fulfilled' ? balanceResult.value.balance : undefined;
      const referral = referralResult.status === 'fulfilled' ? referralResult.value : undefined;

      const authenticatedUser: AuthUser = {
        id: loginResponse.user.id,
        walletAddress: loginResponse.user.walletAddress,
        name: profile?.name || loginResponse.user.name || undefined,
        balance: String(balance?.availableBalance ?? 0),
        totalEarned: String(balance?.totalEarned ?? 0),
        totalInvested: '0.00',
        totalWithdrawn: String(balance?.totalWithdrawn ?? 0),
        status: String(profile?.status || loginResponse.user.status || 'ACTIVE'),
        referralCode: referral?.referralCode || profile?.referralCode,
        referralLink: referral?.referralLink,
        directReferrals: profile?._count?.referrals || 0,
      };

      setToken(loginResponse.token);
      setUser(authenticatedUser);
      toast.success('Wallet connected with backend');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    toast.info('Disconnected');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
