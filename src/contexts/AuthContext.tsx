import React, { createContext, useContext, useState, useCallback } from 'react';
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
  login: (walletAddress: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback((walletAddress: string) => {
    const demoUser: AuthUser = {
      id: '1',
      walletAddress,
      name: 'Demo User',
      balance: '0.00',
      totalEarned: '0.00',
      totalInvested: '0.00',
      totalWithdrawn: '0.00',
      status: 'active',
    };
    setUser(demoUser);
    setToken('demo-token');
    toast.success('Wallet connected!');
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
