import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GiftCodeManagement, RewardsManagement, SecurityLogs, Settings } from './AdminPanel';

type MockResponse = {
  ok: boolean;
  status: number;
  body: unknown;
};

function queueFetchResponses(responses: MockResponse[]) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce({
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AdminPanel gift code and audit integrations', () => {
  it('handles gift code list/create/update status flow from backend', async () => {
    const fetchMock = queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-1',
              code: 'WELCOME50',
              planId: 1,
              planName: 'Plan 1',
              amount: 5,
              status: 'ACTIVE',
              expiresAt: '2030-01-01T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      },
      {
        ok: true,
        status: 201,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-2',
              code: 'NEWCODE',
              planId: 1,
              planName: 'Plan 1',
              amount: 5,
              status: 'ACTIVE',
              expiresAt: '2030-01-02T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-2',
              code: 'NEWCODE',
              planId: 1,
              planName: 'Plan 1',
              amount: 5,
              status: 'ACTIVE',
              expiresAt: '2030-01-02T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          message: 'updated',
          giftCode: {
            id: 'gc-2',
            code: 'NEWCODE',
            planId: 1,
            planName: 'Plan 1',
            amount: 5,
            status: 'DISABLED',
            expiresAt: '2030-01-02T00:00:00.000Z',
            createdAt: '2030-01-01T00:00:00.000Z',
            usedCount: 0,
            maxUses: 1,
          },
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-2',
              code: 'NEWCODE',
              planId: 1,
              planName: 'Plan 1',
              amount: 5,
              status: 'DISABLED',
              expiresAt: '2030-01-02T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      },
    ]);

    render(<GiftCodeManagement token="admin-token" />);

    await screen.findByText('WELCOME50');

    fireEvent.click(screen.getByText('Create Code'));
    fireEvent.change(screen.getByPlaceholderText('e.g. WELCOME50'), { target: { value: 'NEWCODE' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create Code' })[1]);

    await screen.findByText('NEWCODE');

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/gift-codes/gc-2/status'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
    await screen.findByText('DISABLED');
  });

  it('shows permission denied on backend 403', async () => {
    queueFetchResponses([
      {
        ok: false,
        status: 403,
        body: {
          success: false,
          message: 'Admin permission denied',
        },
      },
    ]);

    render(<GiftCodeManagement token="non-admin-token" />);

    await screen.findByText('Admin permission denied');
  });

  it('blocks invalid create payload in UI validation', async () => {
    const fetchMock = queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [],
          pagination: { page: 1, limit: 100, total: 0, pages: 0 },
        },
      },
    ]);

    render(<GiftCodeManagement token="admin-token" />);
    await screen.findByText('No gift codes found.');

    fireEvent.click(screen.getByText('Create Code'));
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '0' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create Code' })[1]);

    await screen.findByText('Valid for days must be between 1 and 365.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('creates custom-amount gift code and blocks non-numeric days', async () => {
    const fetchMock = queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [],
          pagination: { page: 1, limit: 100, total: 0, pages: 0 },
        },
      },
      {
        ok: true,
        status: 201,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-custom',
              code: 'SEASONAL1',
              planId: 1,
              planName: 'Plan 1',
              amount: 1,
              status: 'ACTIVE',
              expiresAt: '2030-01-02T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [
            {
              id: 'gc-custom',
              code: 'SEASONAL1',
              planId: 1,
              planName: 'Plan 1',
              amount: 1,
              status: 'ACTIVE',
              expiresAt: '2030-01-02T00:00:00.000Z',
              createdAt: '2030-01-01T00:00:00.000Z',
              usedCount: 0,
              maxUses: 1,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      },
    ]);

    render(<GiftCodeManagement token="admin-token" />);
    await screen.findByText('No gift codes found.');

    fireEvent.click(screen.getByText('Create Code'));
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '3a' } });
    await screen.findByText('Valid for days must contain numbers only.');

    fireEvent.click(screen.getByRole('button', { name: 'Custom Amount' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WELCOME50'), { target: { value: 'SEASONAL1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 1'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '30' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create Code' })[1]);

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('/api/admin/gift-codes') && call[1]?.method === 'POST');
      expect(postCall).toBeTruthy();
      const rawBody = postCall?.[1]?.body;
      expect(typeof rawBody).toBe('string');
      const payload = JSON.parse(String(rawBody));
      expect(payload).toMatchObject({ customAmount: 1, expiryDays: 30, code: 'SEASONAL1' });
    });
    await screen.findByText('SEASONAL1');
  });

  it('renders empty list state for gift codes', async () => {
    queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          giftCodes: [],
          pagination: { page: 1, limit: 100, total: 0, pages: 0 },
        },
      },
    ]);

    render(<GiftCodeManagement token="admin-token" />);
    await screen.findByText('No gift codes found.');
  });

  it('renders audit logs from backend', async () => {
    queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          logs: [
            {
              id: 'log-1',
              action: 'GIFT_CODE_CREATED',
              description: 'Created 1 gift code(s) for Plan 1',
              createdAt: '2030-01-01T00:00:00.000Z',
              admin: { walletAddress: '0xadmin' },
              user: null,
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, pages: 1 },
        },
      },
    ]);

    render(<SecurityLogs token="admin-token" />);

    await screen.findByText('GIFT_CODE_CREATED');
    await screen.findByText('Created 1 gift code(s) for Plan 1');
    await screen.findByText('0xadmin');
  });
});

describe('AdminPanel rewards integrations', () => {
  it('renders backend-driven rewards metrics and distribution date', async () => {
    queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          nextDistributionAt: '2030-01-31T00:00:00.000Z',
          summary: {
            totalClaims: 10,
            pendingClaims: 3,
            approvedClaims: 2,
            paidClaims: 4,
            rejectedClaims: 1,
            totalClaimedAmount: 150,
            totalPaidAmount: 100,
          },
          clubIncentives: [
            {
              id: 'club-1',
              rank: 'Bronze Club',
              plan1: 25,
              plan2: 18,
              plan3: 14,
              plan4: 4,
              plan5: 2,
              plan6: 1,
              reward: 30,
            },
          ],
          individualIncentives: [
            { id: 'ind-1', plan: 'Plan 1', target: 100, reward: 20 },
          ],
        },
      },
    ]);

    render(<RewardsManagement token="admin-token" />);

    await screen.findByText('Bronze Club');
    await screen.findByText('$30.00');
    await screen.findByText('$100.00');
    expect(screen.queryByText('March 30, 2026')).not.toBeInTheDocument();
  });

  it('renders rewards empty state when no backend config exists', async () => {
    queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          nextDistributionAt: null,
          summary: {
            totalClaims: 0,
            pendingClaims: 0,
            approvedClaims: 0,
            paidClaims: 0,
            rejectedClaims: 0,
            totalClaimedAmount: 0,
            totalPaidAmount: 0,
          },
          clubIncentives: [],
          individualIncentives: [],
        },
      },
    ]);

    render(<RewardsManagement token="admin-token" />);

    await screen.findByText('No rewards configuration found.');
    await screen.findByText('No club incentives configured.');
  });
});

describe('AdminPanel settings integrations', () => {
  it('loads backend system config and updates a toggle', async () => {
    const fetchMock = queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          configs: [
            { id: '1', key: 'MAINTENANCE_MODE', value: 'false', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
            { id: '2', key: 'FLUSHOUT_ENABLED', value: 'true', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
            { id: '3', key: 'KILL_SWITCH_WALLET_ADDRESS', value: '0x1111111111111111111111111111111111111111', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
          ],
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          config: {
            id: '1',
            key: 'MAINTENANCE_MODE',
            value: 'true',
            createdAt: '2030-01-01T00:00:00.000Z',
            updatedAt: '2030-01-01T00:00:00.000Z',
          },
        },
      },
    ]);

    render(<Settings token="admin-token" />);

    await screen.findByDisplayValue('0x1111111111111111111111111111111111111111');

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Maintenance Mode' }));

    await waitFor(() => {
      const updateCall = fetchMock.mock.calls.find(
        (call) => String(call[0]).includes('/api/admin/config/MAINTENANCE_MODE') && call[1]?.method === 'PUT',
      );
      expect(updateCall).toBeTruthy();
    });
    await screen.findByText('Updated MAINTENANCE_MODE');
  });

  it('triggers kill switch using backend endpoint', async () => {
    const fetchMock = queueFetchResponses([
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          configs: [
            { id: '1', key: 'KILL_SWITCH_WALLET_ADDRESS', value: '0x2222222222222222222222222222222222222222', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
            { id: '2', key: 'KILL_SWITCH_ACTIVE', value: 'false', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
          ],
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          message: 'Kill switch transfer initiated',
          transfer: {
            destinationWallet: '0x2222222222222222222222222222222222222222',
            amount: 123.45,
            initiatedAt: '2030-01-01T00:00:00.000Z',
            affectedPools: [],
          },
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          success: true,
          configs: [
            { id: '1', key: 'KILL_SWITCH_WALLET_ADDRESS', value: '0x2222222222222222222222222222222222222222', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
            { id: '2', key: 'KILL_SWITCH_ACTIVE', value: 'true', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
          ],
        },
      },
    ]);

    render(<Settings token="admin-token" />);

    await screen.findByDisplayValue('0x2222222222222222222222222222222222222222');
    fireEvent.click(screen.getByRole('button', { name: /Trigger Kill Switch/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Override/i }));

    await waitFor(() => {
      const triggerCall = fetchMock.mock.calls.find(
        (call) => String(call[0]).includes('/api/admin/kill-switch/trigger') && call[1]?.method === 'POST',
      );
      expect(triggerCall).toBeTruthy();
    });
    await screen.findByText(/Transfer initiated to/i);
  });
});
