import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  describe('default state', () => {
    it('renders an empty container when no props provided', () => {
      const { container } = render(<EmptyState />);

      // The component renders a flex container with center alignment
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('h3')).not.toBeInTheDocument();
      expect(container.querySelector('p')).not.toBeInTheDocument();
    });

    it('applies default centering and padding classes', () => {
      const { container } = render(<EmptyState />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('flex');
      expect(root).toHaveClass('flex-col');
      expect(root).toHaveClass('items-center');
      expect(root).toHaveClass('justify-center');
      expect(root).toHaveClass('p-8');
    });
  });

  describe('title slot', () => {
    it('renders title as an h3 with semantic heading role', () => {
      render(<EmptyState title="No Predictions Yet" />);

      const heading = screen.getByRole('heading', { name: 'No Predictions Yet', level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-lg');
      expect(heading).toHaveClass('font-semibold');
      expect(heading).toHaveClass('mb-2');
    });

    it('does not render heading when title is empty string', () => {
      render(<EmptyState title="" />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('does not render heading when title is undefined', () => {
      render(<EmptyState />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('description slot', () => {
    it('renders description as a paragraph with muted text styling', () => {
      render(<EmptyState description="Place your first prediction to get started." />);

      const paragraph = screen.getByText('Place your first prediction to get started.');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveClass('text-sm');
      expect(paragraph).toHaveClass('text-gray-500');
      expect(paragraph).toHaveClass('mb-4');
    });

    it('does not render paragraph when description is empty string', () => {
      render(<EmptyState description="" />);

      // Empty string should not create a paragraph element
      expect(document.querySelector('p')).not.toBeInTheDocument();
    });

    it('does not render paragraph when description is undefined', () => {
      render(<EmptyState />);

      expect(document.querySelector('p')).not.toBeInTheDocument();
    });
  });

  describe('icon slot', () => {
    it('renders custom icon when provided', () => {
      render(
        <EmptyState
          title="Test"
          icon={<span data-testid="custom-icon" role="img" aria-label="test">★</span>}
        />,
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders icon in a wrapper div with mb-4 margin', () => {
      const { container } = render(
        <EmptyState icon={<span data-testid="custom-icon">★</span>} />,
      );

      const iconWrapper = container.querySelector('[data-testid="custom-icon"]')?.parentElement;
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveClass('mb-4');
    });

    it('does not render icon wrapper when icon is not provided', () => {
      const { container } = render(<EmptyState title="Test" />);

      // No icon wrapper should exist
      const children = container.firstChild?.children;
      if (children) {
        // First child should be h3 (title), not icon wrapper
        expect(children[0].tagName.toLowerCase()).toBe('h3');
      }
    });

    it('accepts any ReactNode as icon (SVG, component, etc.)', () => {
      render(
        <EmptyState
          title="Test"
          icon={<svg data-testid="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
        />,
      );

      expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
    });
  });

  describe('action slot', () => {
    it('renders action button when provided', () => {
      render(
        <EmptyState
          title="No Data"
          action={<button data-testid="retry-btn" type="button">Retry</button>}
        />,
      );

      expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders action as the last child in the flex column', () => {
      const { container } = render(
        <EmptyState
          title="Title"
          description="Description"
          action={<button data-testid="action-btn">Action</button>}
        />,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);
      const actionBtn = screen.getByTestId('action-btn');

      // Action should be the last child
      expect(children[children.length - 1]).toContain(actionBtn);
    });

    it('does not render anything when action is not provided', () => {
      render(<EmptyState title="Test" description="Desc" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('accepts any ReactNode as action (Link, Button, etc.)', () => {
      render(
        <EmptyState
          title="Test"
          action={<a href="/action" data-testid="action-link">Link Action</a>}
        />,
      );

      expect(screen.getByTestId('action-link')).toBeInTheDocument();
    });
  });

  describe('combined slots', () => {
    it('renders title, description, and action in correct order', () => {
      const { container } = render(
        <EmptyState
          title="No Rounds"
          description="Check back later"
          action={<button data-testid="btn">Refresh</button>}
        />,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      // Order: title (h3), description (p), action (button)
      expect(children[0].tagName.toLowerCase()).toBe('h3');
      expect(children[1].tagName.toLowerCase()).toBe('p');
      expect(children[2]).toContain(screen.getByTestId('btn'));
    });

    it('renders icon, title, description, action in correct order', () => {
      const { container } = render(
        <EmptyState
          title="No Rounds"
          description="Check back later"
          icon={<span data-testid="icon">📭</span>}
          action={<button data-testid="btn">Refresh</button>}
        />,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      // Order: icon wrapper (div), title (h3), description (p), action (button)
      expect(children[0].tagName.toLowerCase()).toBe('div'); // icon wrapper
      expect(children[0]).toContain(screen.getByTestId('icon'));
      expect(children[1].tagName.toLowerCase()).toBe('h3');
      expect(children[2].tagName.toLowerCase()).toBe('p');
      expect(children[3]).toContain(screen.getByTestId('btn'));
    });

    it('renders only title and action when description is omitted', () => {
      const { container } = render(
        <EmptyState
          title="No Rounds"
          action={<button data-testid="btn">Refresh</button>}
        />,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      expect(children[0].tagName.toLowerCase()).toBe('h3');
      expect(children[1]).toContain(screen.getByTestId('btn'));
      // No p tag should exist
      expect(root.querySelector('p')).not.toBeInTheDocument();
    });

    it('renders only icon and title when description and action omitted', () => {
      const { container } = render(
        <EmptyState
          title="No Rounds"
          icon={<span data-testid="icon">📭</span>}
        />,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      expect(children[0].tagName.toLowerCase()).toBe('div'); // icon wrapper
      expect(children[1].tagName.toLowerCase()).toBe('h3');
      expect(root.querySelector('p')).not.toBeInTheDocument();
      expect(root.querySelector('button')).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to root container', () => {
      const { container } = render(<EmptyState className="custom-empty-class" />);

      expect(container.firstChild).toHaveClass('custom-empty-class');
    });

    it('combines custom className with default classes', () => {
      const { container } = render(<EmptyState className="my-custom-class" />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('my-custom-class');
      expect(root).toHaveClass('flex');
      expect(root).toHaveClass('items-center');
      expect(root).toHaveClass('justify-center');
    });
  });

  describe('accessibility', () => {
    it('provides proper heading hierarchy with h3 for title', () => {
      render(<EmptyState title="Section Title" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Section Title');
    });

    it('does not create empty heading elements', () => {
      render(<EmptyState title="" />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('action button is accessible when provided', () => {
      render(
        <EmptyState
          title="Error"
          action={<button type="button" aria-label="Retry action">Retry</button>}
        />,
      );

      const button = screen.getByRole('button', { name: /retry action/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('real-world usage patterns', () => {
    it('matches ChatSidebar usage: icon + title + description + custom className', () => {
      render(
        <EmptyState
          icon={<span data-testid="icon">💬</span>}
          title="No messages yet"
          description="Be the first to say something in the chat."
          className="min-h-[160px] border-none bg-transparent backdrop-blur-none"
        />,
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'No messages yet' })).toBeInTheDocument();
      expect(screen.getByText('Be the first to say something in the chat.')).toBeInTheDocument();
      expect(screen.getByText('Be the first to say something in the chat.').closest('div')).toHaveClass('min-h-[160px]');
    });

    it('matches Pools.tsx error usage: title + description + action (retry button)', () => {
      render(
        <EmptyState
          className="mt-10"
          title="Couldn't load pools"
          description="Network error occurred"
          action={
            <button type="button" className="btn-primary" data-testid="retry-btn">
              Retry
            </button>
          }
        />,
      );

      expect(screen.getByRole('heading', { name: 'Couldn\'t load pools' })).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred').closest('div')).toHaveClass('mt-10');
    });

    it('matches Pools.tsx empty usage: title + description only', () => {
      render(
        <EmptyState
          className="mt-10"
          title="No pools available"
          description="There are no active round pools right now. Check back once a round opens."
        />,
      );

      expect(screen.getByRole('heading', { name: 'No pools available' })).toBeInTheDocument();
      expect(screen.getByText('There are no active round pools right now. Check back once a round opens.')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('matches Dashboard.tsx usage: title + description + icon + action', () => {
      render(
        <EmptyState
          title="No BTC Rounds Available"
          description="There are currently no active rounds for Bitcoin. Try selecting a different asset or check back later."
          icon={<span data-testid="illustration">📊</span>}
          action={
            <button type="button" className="btn-primary" data-testid="refresh-btn">
              Refresh
            </button>
          }
        />,
      );

      expect(screen.getByRole('heading', { name: 'No BTC Rounds Available' })).toBeInTheDocument();
      expect(screen.getByText('There are currently no active rounds for Bitcoin. Try selecting a different asset or check back later.')).toBeInTheDocument();
      expect(screen.getByTestId('illustration')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });
  });
});