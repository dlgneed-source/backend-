import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const ADDRESS_1 = '0x1111111111111111111111111111111111111111';
const ADDRESS_2 = '0x2222222222222222222222222222222222222222';
const DEFAULT_USER_AGENT = window.navigator.userAgent;

type Listener = (...args: unknown[]) => void;
type ProviderEvents = Record<string, Listener[]>;

class ProviderRejectedError extends Error {
  code = 4001;

  constructor(message: string) {
    super(message);
    this.name = 'ProviderRejectedError';
  }
}

function createProvider(requestHandler: (method: string, params?: unknown[] | object) => unknown) {
  const events: ProviderEvents = {};

  return {
    request: vi.fn(({ method, params }: { method: string; params?: unknown[] | object }) =>
      Promise.resolve(requestHandler(method, params))
    ),
    on: (event: string, listener: Listener) => {
      events[event] = events[event] || [];
      events[event].push(listener);
    },
    removeListener: (event: string, listener: Listener) => {
      events[event] = (events[event] || []).filter((entry) => entry !== listener);
    },
    emit: (event: string, ...args: unknown[]) => {
      for (const listener of events[event] || []) {
        listener(...args);
      }
    },
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function TestHarness() {
  const { login, logout, isAuthenticated, walletError, walletAddress } = useAuth();

  return (
    <div>
      <button onClick={() => void login()}>connect</button>
      <button onClick={logout}>logout</button>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="wallet-error">{walletError || ''}</span>
      <span data-testid="wallet-address">{walletAddress || ''}</span>
    </div>
  );
}

describe('AuthContext wallet flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: DEFAULT_USER_AGENT,
    });
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it('redirects mobile users to MetaMask app when provider is missing', async () => {
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    });
    global.fetch = vi.fn() as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => {
      expect(screen.getByTestId('wallet-error')).toHaveTextContent('Redirecting to MetaMask app');
    });
    expect(assignSpy).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/metamask\.app\.link\/dapp\//));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalled();
  });

  it('wallet connect success', async () => {
    const provider = createProvider((method) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x38';
      if (method === 'eth_requestAccounts') return [ADDRESS_1];
      if (method === 'personal_sign') return '0xsignature';
      return null;
    });
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/auth/nonce')) {
        return jsonResponse(200, { success: true, nonce: 'nonce-1', message: 'sign-message' });
      }
      if (url.includes('/api/auth/verify')) {
        return jsonResponse(200, {
          success: true,
          token: 'jwt-token',
          user: { id: 'u1', walletAddress: ADDRESS_1, status: 'ACTIVE', referralCode: 'EA123' },
        });
      }
      if (url.includes('/api/users/profile')) {
        return jsonResponse(200, {
          success: true,
          user: { id: 'u1', walletAddress: ADDRESS_1, status: 'ACTIVE', _count: { referrals: 1 } },
        });
      }
      if (url.includes('/api/users/balance')) {
        return jsonResponse(200, {
          success: true,
          balance: { totalEarned: 10, totalWithdrawn: 2, availableBalance: 8 },
        });
      }
      if (url.includes('/api/users/referral-link')) {
        return jsonResponse(200, {
          success: true,
          referralCode: 'EA123',
          referralLink: 'https://example.test/r/EA123',
        });
      }
      if (url.includes('/api/team/stats')) {
        return jsonResponse(200, { success: true, stats: { totalMembers: 2 } });
      }
      if (url.includes('/api/team/commissions')) {
        return jsonResponse(200, { success: true, commissions: [], totalEarned: 5 });
      }
      return jsonResponse(404, { success: false, message: 'not found' });
    }) as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('wallet-address')).toHaveTextContent(ADDRESS_1.toLowerCase());
    expect(sessionStorage.getItem('ea_auth_token')).toBe('jwt-token');
  });

  it('user reject flow', async () => {
    const provider = createProvider((method) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x38';
      if (method === 'eth_requestAccounts') throw new ProviderRejectedError('Rejected');
      return null;
    });
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });
    global.fetch = vi.fn() as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('wallet-error').textContent).toContain('rejected');
    });
  });

  it('wrong network', async () => {
    const provider = createProvider((method) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x1';
      return null;
    });
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });
    global.fetch = vi.fn() as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => {
      expect(screen.getByTestId('wallet-error').textContent).toContain('Wrong network');
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('signature verification fail', async () => {
    const provider = createProvider((method) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x38';
      if (method === 'eth_requestAccounts') return [ADDRESS_1];
      if (method === 'personal_sign') return '0xbadsignature';
      return null;
    });
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/nonce')) {
        return jsonResponse(200, { success: true, nonce: 'nonce-1', message: 'sign-message' });
      }
      if (url.includes('/api/auth/verify')) {
        return jsonResponse(401, { success: false, message: 'Invalid signature' });
      }
      return jsonResponse(404, { success: false, message: 'not found' });
    }) as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => {
      expect(screen.getByTestId('wallet-error')).toHaveTextContent('Invalid signature');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('logout and account change handling', async () => {
    const provider = createProvider((method) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x38';
      if (method === 'eth_requestAccounts') return [ADDRESS_1];
      if (method === 'personal_sign') return '0xsignature';
      return null;
    });
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/nonce')) {
        return jsonResponse(200, { success: true, nonce: 'nonce-1', message: 'sign-message' });
      }
      if (url.includes('/api/auth/verify')) {
        return jsonResponse(200, {
          success: true,
          token: 'jwt-token',
          user: { id: 'u1', walletAddress: ADDRESS_1, status: 'ACTIVE', referralCode: 'EA123' },
        });
      }
      if (url.includes('/api/users/profile')) {
        return jsonResponse(200, {
          success: true,
          user: { id: 'u1', walletAddress: ADDRESS_1, status: 'ACTIVE', _count: { referrals: 1 } },
        });
      }
      if (url.includes('/api/users/balance')) {
        return jsonResponse(200, {
          success: true,
          balance: { totalEarned: 10, totalWithdrawn: 2, availableBalance: 8 },
        });
      }
      if (url.includes('/api/users/referral-link')) {
        return jsonResponse(200, {
          success: true,
          referralCode: 'EA123',
          referralLink: 'https://example.test/r/EA123',
        });
      }
      if (url.includes('/api/team/stats')) {
        return jsonResponse(200, { success: true, stats: { totalMembers: 2 } });
      }
      if (url.includes('/api/team/commissions')) {
        return jsonResponse(200, { success: true, commissions: [], totalEarned: 5 });
      }
      return jsonResponse(404, { success: false, message: 'not found' });
    }) as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    await act(async () => {
      provider.emit('accountsChanged', [ADDRESS_2]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('wallet-error')).toHaveTextContent('account changed');
    });

    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => {
      expect(sessionStorage.getItem('ea_auth_token')).toBeNull();
    });
  });
});
