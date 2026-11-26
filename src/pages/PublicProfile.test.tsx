import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublicProfile from './PublicProfile';

describe('PublicProfile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  function renderWithHandle(handle: string) {
    return render(
      <MemoryRouter initialEntries={[`/u/${handle}`]}>
        <Routes>
          <Route path="/u/:handle" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders public profile card with handle and display name', () => {
    renderWithHandle('stellar_trader');

    expect(screen.getByTestId('public-profile-card')).toBeInTheDocument();
    expect(screen.getByTestId('profile-handle')).toHaveTextContent('@stellar_trader');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Stellar_trader');
    expect(screen.getByText(/Public Trader Card/i)).toBeInTheDocument();
  });

  it('strips leading @ symbol if present in handle param', () => {
    renderWithHandle('@cryptoking');

    expect(screen.getByTestId('profile-handle')).toHaveTextContent('@cryptoking');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cryptoking');
  });

  it('copies URL to clipboard and updates button text when Copy URL is clicked', async () => {
    renderWithHandle('stellar_trader');

    const copyBtn = screen.getByTestId('copy-profile-url');
    expect(copyBtn).toHaveTextContent('Copy Profile Link');

    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);

    await waitFor(() => {
      expect(screen.getByTestId('copy-profile-url')).toHaveTextContent('URL Copied!');
    });
  });

  it('provides navigation link back to the prediction terminal', () => {
    renderWithHandle('stellar_trader');

    const tradeLink = screen.getByRole('link', { name: /trade on xelma terminal/i });
    expect(tradeLink).toHaveAttribute('href', '/dashboard');
  });
});
