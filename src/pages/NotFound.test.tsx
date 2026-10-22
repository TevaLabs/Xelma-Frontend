import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import NotFound from './NotFound';

describe('NotFound Page', () => {
  it('renders 404 heading and link to home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/This path doesn't exist/i);
    expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
  });

  it('renders exactly one main element with id="main-content" and tabIndex={-1}', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    const mainElements = document.querySelectorAll('main');
    expect(mainElements).toHaveLength(1);
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toBe(mainElements[0]);
    expect(mainContent).toHaveAttribute('tabindex', '-1');
  });
});
