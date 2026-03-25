import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('../WalletConnect', () => ({
  default: () => <div data-testid="wallet-mock">Wallet</div>,
}));

vi.mock('../NotificationsBell', () => ({
  default: () => <div data-testid="bell-mock">Bell</div>,
}));

vi.mock('../store/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe('Header accessibility', () => {
  it('exposes a labeled primary navigation landmark', () => {
    renderHeader();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('provides a skip link to main content', () => {
    renderHeader();
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
  });

  it('exposes the home control with an accessible name', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /xelma home/i })).toBeInTheDocument();
  });
});
