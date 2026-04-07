import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GiftCodeManagement, SecurityLogs } from './AdminPanel';

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
    fireEvent.click(screen.getByRole('button', { name: 'Disable Code' }));

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
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '0' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create Code' })[1]);

    await screen.findByText('Valid for days must be between 1 and 365.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
