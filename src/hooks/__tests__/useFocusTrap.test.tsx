import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from '../useFocusTrap';

type HarnessProps = {
  active?: boolean;
  onEscape?: () => void;
  useInitialFocus?: boolean;
  useRestoreRef?: boolean;
};

function Harness({
  active = true,
  onEscape,
  useInitialFocus = false,
  useRestoreRef = false,
}: HarnessProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(containerRef, {
    active,
    onEscape,
    initialFocusRef: useInitialFocus ? initialFocusRef : undefined,
    restoreFocusRef: useRestoreRef ? restoreFocusRef : undefined,
  });

  return (
    <>
      <button ref={restoreFocusRef}>Trigger</button>
      <div ref={containerRef} tabIndex={-1} data-testid="trap">
        <button>First</button>
        <button ref={initialFocusRef}>Initial</button>
        <button>Last</button>
      </div>
    </>
  );
}

describe('useFocusTrap', () => {
  it('focuses the first focusable element when activated', async () => {
    const { getByRole } = render(<Harness />);

    await waitFor(() => expect(getByRole('button', { name: 'First' })).toHaveFocus());
  });

  it('uses initialFocusRef when provided', async () => {
    const { getByRole } = render(<Harness useInitialFocus />);

    await waitFor(() => expect(getByRole('button', { name: 'Initial' })).toHaveFocus());
  });

  it('invokes onEscape only while active', () => {
    const onEscape = vi.fn();
    const { rerender } = render(<Harness active onEscape={onEscape} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);

    rerender(<Harness active={false} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('wraps Tab and Shift+Tab inside the container', async () => {
    const { getByRole } = render(<Harness />);
    const first = getByRole('button', { name: 'First' });
    const last = getByRole('button', { name: 'Last' });

    await waitFor(() => expect(first).toHaveFocus());

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('moves focus back into the trap when Tab starts outside it', async () => {
    const { getByRole } = render(<Harness />);
    const first = getByRole('button', { name: 'First' });
    const trigger = getByRole('button', { name: 'Trigger' });

    await waitFor(() => expect(first).toHaveFocus());

    trigger.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('restores focus to restoreFocusRef when the trap deactivates', async () => {
    const { getByRole, rerender } = render(<Harness active useRestoreRef />);
    const first = getByRole('button', { name: 'First' });
    const trigger = getByRole('button', { name: 'Trigger' });

    await waitFor(() => expect(first).toHaveFocus());

    rerender(<Harness active={false} useRestoreRef />);
    expect(trigger).toHaveFocus();
  });
});
