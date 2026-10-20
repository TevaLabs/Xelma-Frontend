import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

function FocusTrapHarness({
  active = true,
  onEscape = vi.fn(),
}: {
  active?: boolean;
  onEscape?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(containerRef, {
    active,
    onEscape,
    initialFocusRef,
    restoreFocusRef,
  });

  return (
    <>
      <button ref={restoreFocusRef}>Open focus trap</button>
      <div ref={containerRef} tabIndex={-1} aria-label="Focus trap">
        <button ref={initialFocusRef}>First</button>
        <button>Last</button>
      </div>
    </>
  );
}

describe('useFocusTrap', () => {
  it('wraps Tab focus from the last element to the first and back', async () => {
    render(<FocusTrapHarness />);

    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    await waitFor(() => expect(first).toHaveFocus());

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('moves focus into the trap when Tab is pressed outside it', async () => {
    render(<FocusTrapHarness />);

    const trigger = screen.getByRole('button', { name: 'Open focus trap' });
    const first = screen.getByRole('button', { name: 'First' });
    await waitFor(() => expect(first).toHaveFocus());

    trigger.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('calls the Escape handler and prevents the default action', () => {
    const onEscape = vi.fn();
    render(<FocusTrapHarness onEscape={onEscape} />);

    const escapeEvent = createEvent.keyDown(document, { key: 'Escape', cancelable: true });
    document.dispatchEvent(escapeEvent);

    expect(onEscape).toHaveBeenCalledOnce();
    expect(escapeEvent.defaultPrevented).toBe(true);
  });

  it('restores focus to restoreFocusRef when the trap is deactivated', async () => {
    const previouslyFocused = document.createElement('button');
    document.body.appendChild(previouslyFocused);
    previouslyFocused.focus();

    const { rerender } = render(<FocusTrapHarness />);
    const trigger = screen.getByRole('button', { name: 'Open focus trap' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'First' })).toHaveFocus());

    rerender(<FocusTrapHarness active={false} />);

    expect(trigger).toHaveFocus();
    previouslyFocused.remove();
  });
});
