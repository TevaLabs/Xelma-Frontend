import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MaskedBalance from './MaskedBalance';
import { useProfileStore } from '../store/useProfileStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/useSettingsStore';

function resetStores() {
  useSettingsStore.setState({ ...DEFAULT_SETTINGS });
  useProfileStore.setState({ profile: null, isLoading: false, error: null });
}

describe('<MaskedBalance />', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  afterEach(() => cleanup());

  it('shows the raw value when neither source enables streamer mode', () => {
    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(screen.getByLabelText('Balance: 1,234.56')).toBeInTheDocument();
    expect(screen.queryByText('••••••')).not.toBeInTheDocument();
  });

  it('hides the value when only the settings streamer toggle is enabled', () => {
    useSettingsStore.setState({ streamerMode: true });

    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(
      screen.getByLabelText('Balance hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('hides the value when only the persisted profile flag is enabled', () => {
    useProfileStore.setState({
      profile: {
        avatarUrl: null,
        name: 'Test User',
        bio: '',
        twitterLink: '',
        streamerMode: true,
      },
    });

    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(
      screen.getByLabelText('Balance hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('hides the value when both the settings toggle and profile flag are enabled', () => {
    useSettingsStore.setState({ streamerMode: true });
    useProfileStore.setState({
      profile: {
        avatarUrl: null,
        name: 'Test User',
        bio: '',
        twitterLink: '',
        streamerMode: true,
      },
    });

    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(
      screen.getByLabelText('Balance hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('masks the balance immediately when the settings streamer toggle flips on after mount', () => {
    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(screen.getByLabelText('Balance: 1,234.56')).toBeInTheDocument();
    expect(screen.queryByText('••••••')).not.toBeInTheDocument();

    // Same store action the Settings page toggle calls — no remount, no
    // reload, no profile save.
    act(() => {
      useSettingsStore.getState().setStreamerMode(true);
    });

    expect(
      screen.getByLabelText('Balance hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
    expect(screen.queryByText('1,234.56')).not.toBeInTheDocument();

    // Toggling back off reveals the value again.
    act(() => {
      useSettingsStore.getState().setStreamerMode(false);
    });

    expect(screen.getByLabelText('Balance: 1,234.56')).toBeInTheDocument();
    expect(screen.getByText('1,234.56')).toBeInTheDocument();
    expect(screen.queryByText('••••••')).not.toBeInTheDocument();
  });

  it('describes the visible balance in its accessible label', () => {
    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(
      screen.queryByLabelText('Balance hidden because streamer mode is enabled'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Balance: 1,234.56')).toBeInTheDocument();
  });

  it('does not claim the balance is visible in its accessible label while masked', () => {
    useSettingsStore.setState({ streamerMode: true });

    render(<MaskedBalance value="1,234.56" label="Balance" />);

    expect(
      screen.queryByLabelText('Balance: 1,234.56'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Balance hidden because streamer mode is enabled'),
    ).toBeInTheDocument();
  });

  it('uses a custom masked placeholder when provided', () => {
    useSettingsStore.setState({ streamerMode: true });

    render(<MaskedBalance value="1,234.56" maskedText="••••" />);

    expect(screen.getByText('••••')).toBeInTheDocument();
  });
});
