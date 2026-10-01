import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MaskedBalance from './MaskedBalance';
import { useProfileStore } from '../store/useProfileStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/useSettingsStore';

const VALUE = '1,234.56';

/**
 * The exact accessible-name templates the component builds. These are asserted
 * verbatim (not paraphrased) so a wording change in the component surfaces as a
 * failing test rather than silently drifting from what screen readers announce.
 *
 * - unmasked: `${label}: ${value}`
 * - masked:   `${label} hidden because streamer mode is enabled`
 */
const UNMASKED_LABEL = `Balance: ${VALUE}`;
const MASKED_LABEL = 'Balance hidden because streamer mode is enabled';
const DEFAULT_MASKED_TEXT = '••••••';

function resetStores() {
  useSettingsStore.setState({ ...DEFAULT_SETTINGS });
  useProfileStore.setState({ profile: null, isLoading: false, error: null });
}

function enableSettingsStreamerMode() {
  useSettingsStore.setState({ streamerMode: true });
}

function enableProfileStreamerMode() {
  useProfileStore.setState({
    profile: {
      avatarUrl: null,
      name: 'Test User',
      bio: '',
      twitterLink: '',
      streamerMode: true,
    },
  });
}

describe('<MaskedBalance />', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  afterEach(() => cleanup());

  it('shows the raw value as text content when neither source enables streamer mode', () => {
    render(<MaskedBalance value={VALUE} label="Balance" />);

    // The real balance is rendered, not a masked placeholder.
    expect(screen.getByText(VALUE)).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_MASKED_TEXT)).not.toBeInTheDocument();
  });

  it('gives the unmasked balance an accessible name of "<label>: <value>"', () => {
    render(<MaskedBalance value={VALUE} label="Balance" />);

    const balance = screen.getByLabelText(UNMASKED_LABEL);

    expect(balance).toBeInTheDocument();
    expect(balance).toHaveAttribute('aria-label', UNMASKED_LABEL);
    // The unmasked accessible name must NOT leak the hide reason.
    expect(balance).not.toHaveAttribute(
      'aria-label',
      expect.stringContaining('streamer mode'),
    );
  });

  it('hides the value when only the settings streamer toggle is enabled', () => {
    enableSettingsStreamerMode();

    render(<MaskedBalance value={VALUE} label="Balance" />);

    expect(screen.getByLabelText(MASKED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MASKED_TEXT)).toBeInTheDocument();
  });

  it('hides the value when only the persisted profile flag is enabled', () => {
    enableProfileStreamerMode();

    render(<MaskedBalance value={VALUE} label="Balance" />);

    expect(screen.getByLabelText(MASKED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MASKED_TEXT)).toBeInTheDocument();
  });

  it('hides the value when both the settings toggle and profile flag are enabled', () => {
    enableSettingsStreamerMode();
    enableProfileStreamerMode();

    render(<MaskedBalance value={VALUE} label="Balance" />);

    expect(screen.getByLabelText(MASKED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MASKED_TEXT)).toBeInTheDocument();
  });

  it('never renders the real balance anywhere in the output when masked', () => {
    enableSettingsStreamerMode();

    const { container } = render(<MaskedBalance value={VALUE} label="Balance" />);

    // The masking is the privacy guarantee, so assert the absence of the
    // value across the whole subtree, not just as a visible text node.
    expect(screen.queryByText(VALUE)).not.toBeInTheDocument();
    expect(container.textContent).not.toContain(VALUE);
  });

  it('announces the hide reason in the accessible name when masked', () => {
    enableSettingsStreamerMode();

    render(<MaskedBalance value={VALUE} label="Balance" />);

    // The accessible name must state *why* the balance is hidden, not just
    // that it is: `${label} hidden because streamer mode is enabled`.
    const balance = screen.getByLabelText(MASKED_LABEL);

    expect(balance).toHaveAttribute('aria-label', MASKED_LABEL);
    expect(balance.getAttribute('aria-label')).toContain(
      'hidden because streamer mode is enabled',
    );
    expect(balance.getAttribute('aria-label')).not.toContain(VALUE);
  });

  it('applies the blur/select-none classes to the masked text only', () => {
    const { container: unmasked, unmount } = render(<MaskedBalance value={VALUE} />);
    expect(unmasked.querySelector('[aria-hidden]')?.className).toBe('');
    // Unmount before flipping the store so the state change happens with no
    // mounted subscriber (avoids an act() warning).
    unmount();

    enableSettingsStreamerMode();
    const { container: masked } = render(<MaskedBalance value={VALUE} />);

    // Blur is a CSS class, so jsdom can only assert the class hook itself —
    // the visual blur is covered by the a11y/E2E suites, not here.
    const maskedText = masked.querySelector('[aria-hidden]');
    expect(maskedText?.className).toContain('blur-sm');
    expect(maskedText?.className).toContain('select-none');
  });

  it('hides the inner text from the accessibility tree via aria-hidden', () => {
    enableSettingsStreamerMode();

    render(<MaskedBalance value={VALUE} label="Balance" />);

    // The masking placeholder must not be double-announced on top of the
    // outer span's aria-label.
    expect(screen.getByText(DEFAULT_MASKED_TEXT)).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('uses a custom label in the accessible name in both states', () => {
    const { unmount } = render(<MaskedBalance value={VALUE} label="Stake size" />);
    expect(
      screen.getByLabelText(`Stake size: ${VALUE}`),
    ).toBeInTheDocument();
    unmount();

    enableSettingsStreamerMode();
    render(<MaskedBalance value={VALUE} label="Stake size" />);
    expect(
      screen.getByLabelText('Stake size hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
  });

  it('uses a custom masked placeholder when provided', () => {
    enableSettingsStreamerMode();

    render(<MaskedBalance value={VALUE} maskedText="••••" />);

    expect(screen.getByText('••••')).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_MASKED_TEXT)).not.toBeInTheDocument();
  });
});
