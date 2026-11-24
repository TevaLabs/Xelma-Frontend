import { useRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from '../useFocusTrap';

/**
 * Lightweight DOM fixture that exercises `useFocusTrap` in isolation — no
 * modal components involved. The trap container holds three focusable
 * buttons; an "Outside" button sits outside the trap.
 */
function FocusTrapHarness({
  active,
  onEscape,
  restoreFocus = true,
  restoreFocusRef,
}: {
  active: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, {
    active,
    onEscape,
    restoreFocus,
    restoreFocusRef,
  });

  return (
    <>
      <button type="button">Outside</button>
      <div ref={containerRef} data-testid="trap-container">
        <button type="button">First</button>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </div>
    </>
  );
}

function pressKey(key: string, options: { shiftKey?: boolean } = {}) {
  fireEvent.keyDown(document, { key, shiftKey: options.shiftKey ?? false });
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', async () => {
    render(<FocusTrapHarness active />);

    await waitFor(() => expect(screen.getByText('First')).toHaveFocus());
  });

  describe('Tab key wrapping', () => {
    it('wraps focus from the last element back to the first on Tab', async () => {
      render(<FocusTrapHarness active />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      screen.getByText('Last').focus();
      pressKey('Tab');

      expect(screen.getByText('First')).toHaveFocus();
    });

    it('wraps focus from the first element to the last on Shift+Tab', async () => {
      render(<FocusTrapHarness active />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      screen.getByText('First').focus();
      pressKey('Tab', { shiftKey: true });

      expect(screen.getByText('Last')).toHaveFocus();
    });

    it('leaves mid-trap Tab presses untouched while focus stays inside the container', async () => {
      render(<FocusTrapHarness active />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      screen.getByText('Middle').focus();
      pressKey('Tab');

      // jsdom does not implement native Tab navigation, so the trap must not
      // hijack mid-trap presses — focus simply remains on the focused element.
      expect(screen.getByText('Middle')).toHaveFocus();
      expect(
        screen.getByText('Middle').closest('[data-testid="trap-container"]'),
      ).not.toBeNull();
    });

    it('pulls focus into the trap when Tab is pressed while focus is outside', async () => {
      render(<FocusTrapHarness active />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      screen.getByText('Outside').focus();
      pressKey('Tab');

      expect(screen.getByText('First')).toHaveFocus();
    });
  });

  describe('Escape key handling', () => {
    it('invokes the onEscape callback on Escape', async () => {
      const onEscape = vi.fn();
      render(<FocusTrapHarness active onEscape={onEscape} />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      pressKey('Escape');

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onEscape for unrelated keys', async () => {
      const onEscape = vi.fn();
      render(<FocusTrapHarness active onEscape={onEscape} />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      pressKey('a');
      pressKey('Enter');
      pressKey('F2');

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('focus restoration', () => {
    it('returns focus to the previously focused element when deactivated', async () => {
      const { rerender } = render(<FocusTrapHarness active={false} />);
      screen.getByText('Outside').focus();

      rerender(<FocusTrapHarness active />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      rerender(<FocusTrapHarness active={false} />);

      await waitFor(() => expect(screen.getByText('Outside')).toHaveFocus());
    });

    it('does not restore focus when restoreFocus is disabled', async () => {
      const { rerender } = render(<FocusTrapHarness active={false} restoreFocus={false} />);
      screen.getByText('Outside').focus();

      rerender(<FocusTrapHarness active restoreFocus={false} />);
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      rerender(<FocusTrapHarness active={false} restoreFocus={false} />);

      expect(screen.getByText('Outside')).not.toHaveFocus();
    });

    it('restores focus to restoreFocusRef when provided', async () => {
      const restoreTargetRef = { current: null } as React.RefObject<HTMLElement | null>;
      const { rerender } = render(
        <FocusTrapHarness
          active={false}
          restoreFocusRef={restoreTargetRef as React.RefObject<HTMLElement | null>}
        />,
      );
      const restoreTarget = screen.getByText('Outside');
      restoreTargetRef.current = restoreTarget;

      rerender(
        <FocusTrapHarness
          active
          restoreFocusRef={restoreTargetRef as React.RefObject<HTMLElement | null>}
        />,
      );
      await waitFor(() => expect(screen.getByText('First')).toHaveFocus());

      rerender(
        <FocusTrapHarness
          active={false}
          restoreFocusRef={restoreTargetRef as React.RefObject<HTMLElement | null>}
        />,
      );

      await waitFor(() => expect(restoreTarget).toHaveFocus());
    });
  });
});
