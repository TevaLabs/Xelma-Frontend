import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound routing integration', () => {
  it('renders NotFound component when navigating to an unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify the 404 content renders
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/signal lost/i)).toBeInTheDocument();
    expect(screen.getByText(/this path doesn't exist/i)).toBeInTheDocument();
  });

  it('includes CTAs linking back to home and dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    // Check Back to Home CTA
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');

    // Check Open Terminal CTA
    const dashboardLink = screen.getByRole('link', { name: /open terminal/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('renders the unknown route badge', () => {
    render(
      <MemoryRouter initialEntries={['/some/random/path']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/unknown route/i)).toBeInTheDocument();
  });
});
