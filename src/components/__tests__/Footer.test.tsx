import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

function renderFooter(props: React.ComponentProps<typeof Footer> = {}) {
  return render(
    <MemoryRouter>
      <Footer {...props} />
    </MemoryRouter>
  );
}

describe('Footer', () => {
  it('renders a contentinfo landmark with an accessible label', () => {
    renderFooter();
    const footer = screen.getByRole('contentinfo', { name: /site footer/i });
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
  });

  it('exposes GitHub, learn, leaderboard, and docs links', () => {
    renderFooter();

    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/TevaLabs/Xelma-Frontend'
    );
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    const learnLink = screen.getByRole('link', { name: /learn & docs/i });
    expect(learnLink).toHaveAttribute('href', '/learn');

    const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i });
    expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');

    const docsLink = screen.getByRole('link', { name: /documentation/i });
    expect(docsLink).toHaveAttribute('href', expect.stringContaining('README.md'));
    expect(docsLink).toHaveAttribute('target', '_blank');
  });

  it('shows the Stellar Testnet badge by default', () => {
    renderFooter();
    expect(screen.getByText(/stellar testnet/i)).toBeInTheDocument();
  });

  it('falls back to Stellar Mainnet when overridden', () => {
    renderFooter({ network: 'PUBLIC' });
    expect(screen.getByText(/stellar mainnet/i)).toBeInTheDocument();
  });

  it('groups related links inside a labeled nav region', () => {
    renderFooter();
    const region = screen.getByRole('navigation', { name: /footer resources/i });
    const { getByRole } = within(region);
    expect(getByRole('link', { name: /learn & docs/i })).toBeInTheDocument();
    expect(getByRole('link', { name: /github/i })).toBeInTheDocument();
  });

  it('is keyboard accessible — every link renders a visible focus ring', () => {
    renderFooter();
    const focusableLinks = screen.getAllByRole('link');
    expect(focusableLinks.length).toBeGreaterThan(0);
    for (const link of focusableLinks) {
      const className = link.getAttribute('class') ?? '';
      expect(className).toMatch(/focus-visible:ring/);
    }
  });

  it('renders the compact variant without the multi-column grid', () => {
    const { container } = renderFooter({ variant: 'compact' });
    // Compact variant should omit the grid of section columns.
    expect(container.querySelector('footer .grid')).not.toBeInTheDocument();
    // But still renders the bottom legal row links.
    expect(screen.getByRole('link', { name: /powered by stellar/i })).toBeInTheDocument();
  });
});
