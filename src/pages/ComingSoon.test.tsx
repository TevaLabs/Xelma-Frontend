import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import ComingSoon from './ComingSoon';
import ComingSoonPage from './ComingSoonPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ComingSoon & ComingSoonPage consolidation', () => {
  it('renders title and description properly', () => {
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments Coming Soon"
          description="Competitive predictions and leaderboards are underway."
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Tournaments Coming Soon/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Competitive predictions and leaderboards are underway./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('renders with LucideIcon correctly', () => {
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments"
          description="Bracket predictions"
          icon={Trophy}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Tournaments' })).toBeInTheDocument();
  });

  it('renders launch timeline when provided', () => {
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments"
          description="Bracket predictions"
          timeline="Q4 2026 after mainnet launch"
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Launch Timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Q4 2026 after mainnet launch/i)).toBeInTheDocument();
  });

  it('triggers navigate(-1) on back button click by default', () => {
    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments"
          description="Bracket predictions"
        />
      </MemoryRouter>
    );

    const backBtn = screen.getByRole('button', { name: /Go back/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('renders a Link to backUrl when backUrl is provided', () => {
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments"
          description="Bracket predictions"
          backUrl="/dashboard"
          backLabel="Return to Dashboard"
        />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Return to Dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('handles notify button and callbacks', () => {
    const handleNotify = vi.fn();
    render(
      <MemoryRouter>
        <ComingSoon
          title="Tournaments"
          description="Bracket predictions"
          showNotify={true}
          onNotify={handleNotify}
        />
      </MemoryRouter>
    );

    const notifyBtn = screen.getByRole('button', { name: /Notify Me/i });
    fireEvent.click(notifyBtn);
    expect(handleNotify).toHaveBeenCalledTimes(1);
  });

  it('renders identically through ComingSoonPage wrapper', () => {
    render(
      <MemoryRouter>
        <ComingSoonPage
          title="Page Wrapped Feature"
          description="Ensuring backwards-compatibility"
          icon={Trophy}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Page Wrapped Feature' })).toBeInTheDocument();
    expect(screen.getByText(/Ensuring backwards-compatibility/i)).toBeInTheDocument();
  });
});
