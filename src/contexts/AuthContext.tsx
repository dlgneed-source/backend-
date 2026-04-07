import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  walletAddress: string;
  name?: string;
  balance: string;
  totalEarned: string;
  totalInvested: string;
  totalWithdrawn: string;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, signature: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eakhuwat_token'));
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      // Token might be expired
      localStorage.removeItem('eakhuwat_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) refreshProfile();
  }, [token, refreshProfile]);

  const login = async (walletAddress: string, signature: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(walletAddress, signature);
      localStorage.setItem('eakhuwat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success('Wallet connected successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('eakhuwat_token');
    setToken(null);
    setUser(null);
    toast.info('Disconnected');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
