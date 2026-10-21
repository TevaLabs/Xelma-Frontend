import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import ComingSoonPage from './ComingSoonPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ComingSoonPage icon={Rocket} title="Coming soon" description="This feature is on its way." />
    </MemoryRouter>,
  );
}

describe('ComingSoonPage', () => {
  it('renders the main landmark with the skip-link target id', () => {
    renderPage();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('renders the title and description', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Coming soon' })).toBeInTheDocument();
    expect(screen.getByText('This feature is on its way.')).toBeInTheDocument();
  });

  it('navigates back one entry when "Go back" is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('links Home to the landing route', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  it('links Dashboard to the dashboard route', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
