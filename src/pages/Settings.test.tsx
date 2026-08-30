import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from '../store/useSettingsStore';
import Settings from './Settings';

// Stub lucide icons to keep noisy SVG output out of the diff (and avoid the
// jsdom canvas / sizing complications when icons render at fixed sizes).
vi.mock('lucide-react', () => ({
  Bell: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-bell" {...props} />,
  CheckCircle2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-check" {...props} />
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-eye" {...props} />,
  Gauge: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-gauge" {...props} />,
  RefreshCw: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-refresh" {...props} />
  ),
  Settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-settings" {...props} />
  ),
  Sliders: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-sliders" {...props} />
  ),
  Volume2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-volume" {...props} />
  ),
}));

vi.mock('../utils/audioController', () => ({
  bindSoundPreference: vi.fn(),
  clearSoundPreferenceBinding: vi.fn(),
  playTestTone: vi.fn(() => true),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderSettings = () =>
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <Settings />
    </MemoryRouter>,
  );

function resetStore() {
  const actions = {
    setShowNetworkBadge: useSettingsStore.getState().setShowNetworkBadge,
    setSoundEnabled: useSettingsStore.getState().setSoundEnabled,
    setStreamerMode: useSettingsStore.getState().setStreamerMode,
    setMotionPreference: useSettingsStore.getState().setMotionPreference,
    resetToDefaults: useSettingsStore.getState().resetToDefaults,
  };
  useSettingsStore.setState({ ...DEFAULT_SETTINGS, ...actions });
}

describe('<Settings />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSettingsStore.persist.clearStorage();
    resetStore();
  });

  afterEach(() => cleanup());

  it('renders the four preference sections with their headings', () => {
    renderSettings();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Network' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sound' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Streamer mode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Motion' })).toBeInTheDocument();
  });

  it('shows the live NetworkBadge when the pref is enabled (default)', () => {
    renderSettings();
    expect(screen.getByTestId('network-badge')).toBeInTheDocument();
  });

  it('hides the NetworkBadge preview when the toggle is off', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-toggle-network-badge'));
    expect(screen.queryByTestId('network-badge')).not.toBeInTheDocument();
    expect(useSettingsStore.getState().showNetworkBadge).toBe(false);
  });

  it('toggles sound and stores result', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-toggle-sound'));
    expect(useSettingsStore.getState().soundEnabled).toBe(true);
  });

  it('toggles streamer mode and stores result', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-toggle-streamer'));
    expect(useSettingsStore.getState().streamerMode).toBe(true);
  });

  it('renders all three motion-presence radio options', () => {
    renderSettings();
    expect(screen.getByTestId('settings-motion-option-system')).toBeInTheDocument();
    expect(screen.getByTestId('settings-motion-option-reduce')).toBeInTheDocument();
    expect(screen.getByTestId('settings-motion-option-no-preference')).toBeInTheDocument();
  });

  it('switches the motion preference when a radio is selected', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-motion-option-reduce'));
    expect(useSettingsStore.getState().motionPreference).toBe('reduce');

    fireEvent.click(screen.getByTestId('settings-motion-option-no-preference'));
    expect(useSettingsStore.getState().motionPreference).toBe('no-preference');
  });

  it('resets every preference to defaults and dispatches a toast', async () => {
    const { toast } = await import('sonner');
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-toggle-network-badge'));
    fireEvent.click(screen.getByTestId('settings-toggle-sound'));
    fireEvent.click(screen.getByTestId('settings-toggle-streamer'));

    fireEvent.click(screen.getByTestId('settings-reset'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Settings reset',
        expect.objectContaining({ description: expect.any(String) }),
      );
    });

    const state = useSettingsStore.getState();
    expect(state.showNetworkBadge).toBe(DEFAULT_SETTINGS.showNetworkBadge);
    expect(state.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
    expect(state.streamerMode).toBe(DEFAULT_SETTINGS.streamerMode);
    expect(state.motionPreference).toBe(DEFAULT_SETTINGS.motionPreference);
  });

  it('persists toggled preferences to the settings storage key', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-toggle-sound'));
    fireEvent.click(screen.getByTestId('settings-toggle-streamer'));
    fireEvent.click(screen.getByTestId('settings-motion-option-reduce'));

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.soundEnabled).toBe(true);
    expect(parsed.state.streamerMode).toBe(true);
    expect(parsed.state.motionPreference).toBe('reduce');
  });

  it('plays a test tone when the user presses Test sound (and sound is on)', async () => {
    const { playTestTone } = await import('../utils/audioController');
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-toggle-sound'));
    fireEvent.click(screen.getByTestId('settings-test-sound'));
    expect(playTestTone).toHaveBeenCalled();
  });
});
