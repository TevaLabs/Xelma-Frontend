import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

function renderFooter(props: React.ComponentProps<typeof Footer> = {}) {
  return render(
    <MemoryRouter>
      <Footer network="TESTNET" {...props} />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('renders the full footer by default', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo', { name: 'Site footer' });
    expect(footer).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Footer resources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /settlement network/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xelma home' })).toBeInTheDocument();
  });

  describe('compact variant', () => {
    it('hides the brand, resources and network sections', () => {
      renderFooter({ variant: 'compact' });

      expect(screen.getByRole('contentinfo', { name: 'Site footer' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Footer resources' })).toBeNull();
      expect(screen.queryByRole('heading', { name: /settlement network/i })).toBeNull();
      expect(screen.queryByRole('link', { name: 'Xelma home' })).toBeNull();
    });

    it('keeps the essential bottom row links', () => {
      renderFooter({ variant: 'compact' });

      expect(screen.getByText(/built open-source for the stellar community/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /powered by stellar/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view license/i })).toBeInTheDocument();
    });

    it('uses slimmer padding than the default variant', () => {
      const { unmount } = renderFooter({ variant: 'compact' });
      const compactClass = screen.getByRole('contentinfo').className;
      unmount();
      renderFooter();
      const defaultClass = screen.getByRole('contentinfo').className;

      expect(compactClass).toContain('py-6');
      expect(defaultClass).toContain('py-8');
    });
  });
});
