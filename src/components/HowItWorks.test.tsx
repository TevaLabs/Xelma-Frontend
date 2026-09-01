import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HowItWorks from './HowItWorks';
import '../i18n';

describe('HowItWorks Component', () => {
  it('renders section with proper landmark aria-labelledby and section title', () => {
    render(<HowItWorks />);

    const sectionHeading = screen.getByRole('heading', { level: 2, name: /how it works/i });
    expect(sectionHeading).toBeInTheDocument();
    expect(sectionHeading).toHaveAttribute('id', 'how-it-works-title');

    const section = sectionHeading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'how-it-works-title');
  });

  it('renders all 3 steps with titles and descriptions', () => {
    render(<HowItWorks />);

    expect(screen.getByRole('heading', { level: 3, name: /connect freighter/i })).toBeInTheDocument();
    expect(screen.getByText(/link your stellar freighter wallet/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /practice vxlm/i })).toBeInTheDocument();
    expect(screen.getByText(/receive 1,000 practice vxlm/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /submit prediction/i })).toBeInTheDocument();
    expect(screen.getByText(/choose directional or precision mode/i)).toBeInTheDocument();
  });

  it('renders step numbering badges (01, 02, 03)', () => {
    render(<HowItWorks />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('does not contain any contributor task placeholder', () => {
    const { container } = render(<HowItWorks />);

    expect(screen.queryByText(/contributor task/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rebuild how it works steps/i)).not.toBeInTheDocument();
    expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
  });
});
