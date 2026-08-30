import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import XdrPreviewDrawer from './XdrPreviewDrawer';

const XDR = 'AAAAAgAAAABexampleXDRpayloadForTests==';
const HASH = 'abc123def456';
const PASSPHRASE = 'Test SDF Network ; September 2015';

function renderDrawer() {
  return render(<XdrPreviewDrawer xdr={XDR} hash={HASH} networkPassphrase={PASSPHRASE} />);
}

function expand() {
  fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
}

describe('XdrPreviewDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is collapsed by default so it does not block casual users', () => {
    renderDrawer();

    expect(screen.getByRole('button', { name: /advanced/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText(XDR)).not.toBeInTheDocument();
  });

  it('reveals the XDR, hash, and network once expanded', () => {
    renderDrawer();

    expand();

    expect(screen.getByRole('button', { name: /advanced/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText(XDR)).toBeInTheDocument();
    expect(screen.getByText(HASH)).toBeInTheDocument();
    expect(screen.getByText(PASSPHRASE)).toBeInTheDocument();
  });

  it('collapses again when toggled a second time', () => {
    renderDrawer();

    expand();
    expand();

    expect(screen.getByRole('button', { name: /advanced/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText(XDR)).not.toBeInTheDocument();
  });

  it('copies the XDR to the clipboard and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderDrawer();
    expand();
    fireEvent.click(screen.getByRole('button', { name: /copy transaction xdr/i }));

    expect(writeText).toHaveBeenCalledWith(XDR);
    await waitFor(() => {
      expect(screen.getByText(/xdr copied to clipboard/i)).toBeInTheDocument();
    });
  });

  it('tells the user to copy manually when the clipboard is unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    renderDrawer();
    expand();
    fireEvent.click(screen.getByRole('button', { name: /copy transaction xdr/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not access the clipboard/i)).toBeInTheDocument();
    });
  });
});
