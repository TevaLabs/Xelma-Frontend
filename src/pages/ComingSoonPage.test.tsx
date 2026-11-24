import { fireEvent, render, screen } from '@testing-library/react';
import { House } from 'lucide-react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ComingSoonPage from './ComingSoonPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <div data-testid="current-path">{pathname}</div>;
}

function renderComingSoonPage(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route
          path="/coming-soon"
          element={
            <ComingSoonPage icon={House} title="Coming soon" description="More to come." />
          }
        />
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ComingSoonPage', () => {
  it('navigates back one history entry when Go back is clicked', () => {
    renderComingSoonPage(['/previous', '/coming-soon']);

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/previous');
  });

  it('provides Home and Dashboard links', () => {
    renderComingSoonPage(['/coming-soon']);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('renders the skip-to-content landmark', () => {
    renderComingSoonPage(['/coming-soon']);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});
