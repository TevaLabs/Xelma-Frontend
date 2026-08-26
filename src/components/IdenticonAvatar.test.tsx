import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IdenticonAvatar from './IdenticonAvatar';

describe('IdenticonAvatar', () => {
  it('renders initials when no address is provided', () => {
    render(<IdenticonAvatar name="Satoshi Nakamoto" />);
    expect(screen.getByText('SN')).toBeInTheDocument();
  });

  it('renders deterministic SVG identicon when valid Stellar G-address is provided', () => {
    const address = 'GAAZI4TCR3TY5OJHCTJC2A4AFLGFFL6VIP4SBGY6RXVO532LBW4DAZ4Q';
    render(<IdenticonAvatar address={address} name="Satoshi Nakamoto" />);

    const svg = screen.getByRole('img', { name: `Identicon for address ${address}` });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('generates consistent SVG output for the same address', () => {
    const address = 'GCXH6R45Z3VD7V4C333Z6C6A43XJ4T35';
    const { container: first } = render(<IdenticonAvatar address={address} />);
    const { container: second } = render(<IdenticonAvatar address={address} />);

    expect(first.innerHTML).toEqual(second.innerHTML);
  });
});
