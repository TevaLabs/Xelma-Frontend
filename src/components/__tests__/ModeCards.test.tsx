import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ModeCards from '../ModeCards';

describe('ModeCards', () => {
  const renderCards = () =>
    render(
      <MemoryRouter>
        <ModeCards />
      </MemoryRouter>,
    );

  it('renders the section title', () => {
    renderCards();
    expect(
      screen.getByRole('heading', { name: /two prediction modes/i }),
    ).toBeInTheDocument();
  });

  it('renders the Directional card with UP / DOWN subtitle', () => {
    renderCards();
    expect(
      screen.getByRole('heading', { name: /directional trading/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('UP / DOWN'),
    ).toBeInTheDocument();
  });

  it('renders the Precision card with Narrow Range subtitle', () => {
    renderCards();
    expect(
      screen.getByRole('heading', { name: /precision trading/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Narrow Range'),
    ).toBeInTheDocument();
  });

  it('renders directional feature bullets', () => {
    renderCards();
    expect(screen.getByText(/binary price prediction/i)).toBeInTheDocument();
    expect(screen.getByText(/real-time market data/i)).toBeInTheDocument();
    expect(screen.getByText(/instant settlement/i)).toBeInTheDocument();
  });

  it('renders precision feature bullets', () => {
    renderCards();
    // "Tighter price windows" also appears in the description text, so it matches twice
    const tighterPriceMatches = screen.getAllByText(/tighter price windows/i);
    expect(tighterPriceMatches.length).toBeGreaterThanOrEqual(1);
    expect(tighterPriceMatches[0]).toBeInTheDocument();

    expect(screen.getByText(/higher payout multipliers/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced strategy mode/i)).toBeInTheDocument();
  });

  it('has both CTA links pointing to /dashboard', () => {
    renderCards();
    const links = screen.getAllByRole('link', { name: /start predicting/i });
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });

  it('labels each card by its heading', () => {
    renderCards();
    expect(
      screen.getByRole('article', { name: /directional trading/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: /precision trading/i }),
    ).toBeInTheDocument();
  });

  it('gives each CTA a distinct accessible name inside its own card', () => {
    renderCards();
    const directional = screen.getByRole('article', {
      name: /directional trading/i,
    });
    const precision = screen.getByRole('article', {
      name: /precision trading/i,
    });
    expect(
      within(directional).getByRole('link', {
        name: 'Start predicting in Directional Trading mode',
      }),
    ).toHaveAttribute('href', '/dashboard');
    expect(
      within(precision).getByRole('link', {
        name: 'Start predicting in Precision Trading mode',
      }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('renders exactly two glass cards with distinct accents', () => {
    renderCards();
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    cards.forEach((card) => expect(card).toHaveClass('glass-card'));
    expect(cards[0].className).toContain('xelma-blue');
    expect(cards[1].className).toContain('xelma-teal');
  });
});
