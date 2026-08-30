import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssetIcon } from './AssetIcon';

describe('<AssetIcon />', () => {
  it('renders an SVG with role="img" and an aria-label for BTC', () => {
    render(<AssetIcon asset="BTC" />);
    const img = screen.getByRole('img', { name: 'BTC icon' });
    expect(img).toBeInTheDocument();
    expect(img.tagName.toLowerCase()).toBe('svg');
    expect(img).toHaveAttribute('data-asset', 'BTC');
  });

  it.each(['ETH', 'XLM'] as const)(
    'renders an accessible SVG for %s',
    (asset) => {
      render(<AssetIcon asset={asset} />);
      const img = screen.getByRole('img', { name: `${asset} icon` });
      expect(img).toBeInTheDocument();
      expect(img.querySelector('title')?.textContent).toBe(asset);
    },
  );

  it('normalizes lowercase tickers', () => {
    render(<AssetIcon asset="btc" />);
    expect(screen.getByRole('img', { name: 'BTC icon' })).toBeInTheDocument();
  });

  it('falls back to the unknown glyph for unsupported tickers', () => {
    render(<AssetIcon asset="DOGE" />);
    const img = screen.getByRole('img', { name: 'DOGE icon' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('data-asset', 'DOGE');
    // Path / circle output should still be present so the glyph renders.
    expect(img.querySelectorAll('path, circle').length).toBeGreaterThan(0);
  });

  it('renders a <title> child for tooltip + screen readers', () => {
    render(<AssetIcon asset="XLM" />);
    const svg = screen.getByRole('img', { name: 'XLM icon' });
    const title = svg.querySelector('title');
    expect(title).not.toBeNull();
    expect(title?.textContent).toBe('XLM');
  });

  it('inherits currentColor so the parent text color drives the stroke', () => {
    render(
      <div className="text-[#BEC7FE]">
        <AssetIcon asset="ETH" />
      </div>,
    );
    const svg = screen.getByRole('img', { name: 'ETH icon' });
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('honors the `size` prop by setting width and height', () => {
    render(<AssetIcon asset="BTC" size={32} />);
    const svg = screen.getByRole('img', { name: 'BTC icon' });
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('lets a custom `title` override the accessible name in both aria-label and <title>', () => {
    render(<AssetIcon asset="BTC" title="Bitcoin ticker" />);
    const svg = screen.getByRole('img', { name: 'Bitcoin ticker icon' });
    expect(svg).toBeInTheDocument();
    expect(svg.querySelector('title')?.textContent).toBe('Bitcoin ticker');
  });

  it('uses a sensible default when asset is empty', () => {
    render(<AssetIcon asset="" />);
    const svg = screen.getByRole('img', { name: 'Asset icon' });
    expect(svg).toBeInTheDocument();
    expect(svg.querySelector('title')?.textContent).toBe('Asset');
  });
});
