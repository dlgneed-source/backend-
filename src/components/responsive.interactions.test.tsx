import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import ReferralEngine from './ReferralEngine';
import AdminPanel from './AdminPanel';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
  }),
}));

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  fireEvent(window, new Event('resize'));
};

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('responsive interactions', () => {
  it('closes dashboard menu drawer on desktop resize', async () => {
    setViewportWidth(375);
    render(<Dashboard />);

    fireEvent.click(screen.getByLabelText('Open dashboard menu'));
    expect(screen.getByLabelText('Close dashboard menu')).toBeTruthy();

    setViewportWidth(1280);

    await waitFor(() => {
      expect(screen.queryByLabelText('Close dashboard menu')).toBeNull();
    });
  });

  it('supports referral modal escape close and transaction hash copy interaction', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<ReferralEngine />);

    fireEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(screen.getByText('Withdraw Funds')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Withdraw Funds')).toBeNull();
    });

    const expectedTransactionHash = '0xa3f...12b4';
    fireEvent.click(screen.getByRole('button', { name: /Copy transaction hash 0xa3f\.\.\.12b4/i }));
    expect(writeText).toHaveBeenCalledWith(expectedTransactionHash);
  });

  it('closes admin mobile sidebar on escape and desktop resize', async () => {
    setViewportWidth(375);
    sessionStorage.setItem('ea_admin_token', 'test-admin-token');
    render(<AdminPanel />);

    fireEvent.click(screen.getByLabelText('Open admin menu'));
    expect(screen.getByLabelText('Close admin menu')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByLabelText('Close admin menu')).toBeNull();
    });

    fireEvent.click(screen.getByLabelText('Open admin menu'));
    expect(screen.getByLabelText('Close admin menu')).toBeTruthy();

    setViewportWidth(1366);
    await waitFor(() => {
      expect(screen.queryByLabelText('Close admin menu')).toBeNull();
    });
  });
});
