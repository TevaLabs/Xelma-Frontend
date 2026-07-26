import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Landing from './Landing';

vi.mock('../components/HowItWorks', () => ({
  default: () => <div data-testid="how-it-works-mock">How It Works Mock</div>
}));

vi.mock('../components/ModeCards', () => ({
  default: () => <div data-testid="mode-cards-mock">Mode Cards Mock</div>
}));

describe('Landing Page', () => {
  it('renders hero section with headline and subtitle', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveTextContent(/read the market/i);
    expect(heroHeading).toHaveTextContent(/prove your call/i);
    expect(screen.getByText(/stellar prediction infrastructure/i)).toBeInTheDocument();
  });

  it('renders primary CTA linking to dashboard with proper a11y', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const primaryCta = screen.getByRole('link', { name: /enter prediction terminal/i });
    expect(primaryCta).toBeInTheDocument();
    expect(primaryCta).toHaveAttribute('href', '/dashboard');
  });

  it('renders secondary CTA linking to how it works section with proper a11y', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const secondaryCta = screen.getByRole('link', { name: /how it works/i });
    expect(secondaryCta).toBeInTheDocument();
    expect(secondaryCta).toHaveAttribute('href', '#how-it-works');
  });

  it('renders stats section with expected metric labels', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByText(/rounds resolved/i)).toBeInTheDocument();
    expect(screen.getByText(/practice volume/i)).toBeInTheDocument();
    expect(screen.getByText(/active predictors/i)).toBeInTheDocument();
  });

  it('renders HowItWorks and ModeCards components', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByTestId('how-it-works-mock')).toBeInTheDocument();
    expect(screen.getByTestId('mode-cards-mock')).toBeInTheDocument();
  });
  
  it('includes proper a11y section anchors', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    // Check if the #how-it-works anchor exists
    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
  });
});
