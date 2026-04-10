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

// --- Wagmi + Web3Modal mocks ---

const mockOpen = vi.fn<() => Promise<void>>();
const mockSignMessageAsync = vi.fn<(args: { message: string }) => Promise<string>>();
const mockDisconnect = vi.fn();

let mockAddress: string | undefined = undefined;
let mockIsConnected = false;

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAddress, isConnected: mockIsConnected }),
  useSignMessage: () => ({ signMessageAsync: mockSignMessageAsync }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
}));

vi.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: () => ({ open: mockOpen }),
  useWeb3ModalEvents: () => ({ data: { event: '' } }),
}));

// --- Helpers ---

const ADDRESS_1 = '0x1111111111111111111111111111111111111111';
const ADDRESS_2 = '0x2222222222222222222222222222222222222222';

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
    mockAddress = undefined;
    mockIsConnected = false;
    mockOpen.mockResolvedValue(undefined);
    mockSignMessageAsync.mockResolvedValue('0xsignature');
    mockDisconnect.mockReturnValue(undefined);
  });

  it('opens Web3Modal when login is called', async () => {
    global.fetch = vi.fn() as typeof fetch;

    render(<AuthProvider><TestHarness /></AuthProvider>);
    fireEvent.click(screen.getByText('connect'));

    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('wallet connect success', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
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

    const { rerender } = render(<AuthProvider><TestHarness /></AuthProvider>);

    // Click login — opens the modal
    fireEvent.click(screen.getByText('connect'));
    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));

    // Simulate user selecting wallet and connecting
    await act(async () => {
      mockAddress = ADDRESS_1;
      mockIsConnected = true;
      rerender(<AuthProvider><TestHarness /></AuthProvider>);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('wallet-address')).toHaveTextContent(ADDRESS_1.toLowerCase());
    expect(sessionStorage.getItem('ea_auth_token')).toBe('jwt-token');
  });

  it('user rejects signature', async () => {
    const rejectedError = Object.assign(new Error('User rejected'), { code: 4001 });
    mockSignMessageAsync.mockRejectedValue(rejectedError);

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/nonce')) {
        return jsonResponse(200, { success: true, nonce: 'nonce-1', message: 'sign-message' });
      }
      return jsonResponse(404, { success: false, message: 'not found' });
    }) as typeof fetch;

    const { rerender } = render(<AuthProvider><TestHarness /></AuthProvider>);

    fireEvent.click(screen.getByText('connect'));
    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockAddress = ADDRESS_1;
      mockIsConnected = true;
      rerender(<AuthProvider><TestHarness /></AuthProvider>);
    });

    await waitFor(() => {
      expect(screen.getByTestId('wallet-error').textContent).toContain('rejected');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('signature verification fail', async () => {
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

    const { rerender } = render(<AuthProvider><TestHarness /></AuthProvider>);

    fireEvent.click(screen.getByText('connect'));
    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockAddress = ADDRESS_1;
      mockIsConnected = true;
      rerender(<AuthProvider><TestHarness /></AuthProvider>);
    });

    await waitFor(() => {
      expect(screen.getByTestId('wallet-error')).toHaveTextContent('Invalid signature');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('logout and account change handling', async () => {
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

    const { rerender } = render(<AuthProvider><TestHarness /></AuthProvider>);

    fireEvent.click(screen.getByText('connect'));
    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockAddress = ADDRESS_1;
      mockIsConnected = true;
      rerender(<AuthProvider><TestHarness /></AuthProvider>);
    });

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    // Simulate account change to a different address
    await act(async () => {
      mockAddress = ADDRESS_2;
      mockIsConnected = true;
      rerender(<AuthProvider><TestHarness /></AuthProvider>);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('wallet-error')).toHaveTextContent('account changed');
    });

    // Logout clears session
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => {
      expect(sessionStorage.getItem('ea_auth_token')).toBeNull();
    });
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
