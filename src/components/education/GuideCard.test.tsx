import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuideCard } from './GuideCard';
import type { Guide } from '../../types/education';

const mockGuide: Guide = {
  id: '1',
  title: 'Getting Started with Stellar',
  description: 'Learn the basics of Stellar network',
  category: 'Basics',
  imageUrl: 'https://example.com/guide.jpg',
  readTime: '5 min read',
};

describe('GuideCard', () => {
  it('renders guide with image when imageUrl is provided', () => {
    render(<GuideCard guide={mockGuide} />);
    
    const img = screen.getByAltText('');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/guide.jpg');
  });

  it('displays gradient fallback when image fails to load', async () => {
    render(<GuideCard guide={mockGuide} />);
    
    const img = screen.getByAltText('') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    
    // Trigger image load error by calling the onError handler
    fireEvent.error(img);
    
    // Wait for the gradient fallback (div with aria-hidden) to appear
    await waitFor(() => {
      const fallbackDiv = document.querySelector('div[aria-hidden="true"]');
      expect(fallbackDiv).toBeInTheDocument();
    });
  });

  it('displays gradient fallback when imageUrl is not provided', () => {
    render(<GuideCard guide={{ ...mockGuide, imageUrl: '' }} />);
    
    // The gradient fallback div should be present
    const fallbackDiv = document.querySelector('div[aria-hidden="true"]');
    expect(fallbackDiv).toBeInTheDocument();
  });

  it('preserves focus-ring styling on the article element', () => {
    render(<GuideCard guide={mockGuide} />);
    
    const article = screen.getByRole('article');
    expect(article).toHaveClass('focus-visible:ring-2');
    expect(article).toHaveClass('focus-visible:ring-xelma-teal');
  });

  it('has proper accessibility attributes', () => {
    render(<GuideCard guide={mockGuide} />);
    
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby', 'guide-title-1');
    
    const title = screen.getByText('Getting Started with Stellar');
    expect(title).toHaveAttribute('id', 'guide-title-1');
  });

  it('renders all guide metadata', () => {
    render(<GuideCard guide={mockGuide} />);
    
    expect(screen.getByText('Getting Started with Stellar')).toBeInTheDocument();
    expect(screen.getByText('Learn the basics of Stellar network')).toBeInTheDocument();
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<GuideCard guide={mockGuide} className="custom-class" />);
    
    const article = screen.getByRole('article');
    expect(article).toHaveClass('custom-class');
  });
});
