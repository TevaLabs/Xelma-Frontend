import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Code,
  Eye,
  Gauge,
  RefreshCw,
  Settings as SettingsIcon,
  Sliders,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useSettingsStore,
  DEFAULT_SETTINGS,
  type MotionPreference,
} from '../store/useSettingsStore';
import {
  bindSoundPreference,
  clearSoundPreferenceBinding,
  playTestTone,
} from '../utils/audioController';
import NetworkBadge from '../components/NetworkBadge';
import DevSettingsDrawer from '../components/DevSettingsDrawer';
import { SHOW_DEV_SETTINGS } from '../lib/stellarConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface ToggleRowProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /**
   * Test handle. Forwarded to the underlying `<button role="switch">` so
   * testing-library clicks fire the real `onClick` instead of bubbling
   * through the wrapper div.
   */
  testId?: string;
}

function ToggleRow({
  title,
  description,
  icon,
  checked,
  onToggle,
  disabled,
  testId,
}: ToggleRowProps) {
  return (
    <div
      className={cx(
        'flex items-start justify-between gap-6 rounded-2xl bg-white/[0.04] border border-[#BEC7FE]/15 px-5 py-4',
        'sm:px-6 sm:py-5',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2C4BFD]/15 text-[#BEC7FE]"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        data-testid={testId}
        onClick={onToggle}
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]',
          checked ? 'bg-[#2C4BFD]' : 'bg-gray-700/70',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-150',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  );
}

const MOTION_OPTIONS: ReadonlyArray<{
  value: MotionPreference;
  label: string;
  description: string;
}> = [
  {
    value: 'system',
    label: 'Match system',
    description: 'Use whatever your operating system / browser is currently set to.',
  },
  {
    value: 'reduce',
    label: 'Always reduce',
    description: 'Force quieter, calmer motion even if your system allows it.',
  },
  {
    value: 'no-preference',
    label: 'Never reduce',
    description: 'Always play full motion, ignoring the OS reduced-motion setting.',
  },
];

export default function Settings() {
  const showNetworkBadge = useSettingsStore((s) => s.showNetworkBadge);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const streamerMode = useSettingsStore((s) => s.streamerMode);
  const motionPreference = useSettingsStore((s) => s.motionPreference);

  const setShowNetworkBadge = useSettingsStore((s) => s.setShowNetworkBadge);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setStreamerMode = useSettingsStore((s) => s.setStreamerMode);
  const setMotionPreference = useSettingsStore((s) => s.setMotionPreference);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  const [isDevDrawerOpen, setIsDevDrawerOpen] = useState(false);

  const { reduced, systemPreference, override } = useReducedMotion();

  // Wire the audio controller to read the live store value.
  useEffect(() => {
    bindSoundPreference(() => useSettingsStore.getState().soundEnabled);
    return () => clearSoundPreferenceBinding();
  }, []);

  const hasChanged = useMemo(
    () =>
      showNetworkBadge !== DEFAULT_SETTINGS.showNetworkBadge ||
      soundEnabled !== DEFAULT_SETTINGS.soundEnabled ||
      streamerMode !== DEFAULT_SETTINGS.streamerMode ||
      motionPreference !== DEFAULT_SETTINGS.motionPreference,
    [showNetworkBadge, soundEnabled, streamerMode, motionPreference],
  );

  const handleReset = () => {
    resetToDefaults();
    toast.success('Settings reset', {
      description: 'All preferences are back to their defaults.',
    });
  };

  const handleTestSound = () => {
    const played = playTestTone();
    if (!played) {
      toast.error('Could not play test sound', {
        description: 'Your browser may be blocking audio, or sound is disabled.',
      });
      return;
    }
    toast.success('Played test sound', {
      description: 'Enable / disable in the toggle above.',
      duration: 1800,
    });
  };

  return (
    <main className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#22D3EE]">
              Preferences
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white sm:text-4xl">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]"
                aria-hidden
              >
                <SettingsIcon className="h-5 w-5" />
              </span>
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Tweak Xelma to your liking. All preferences are saved locally in this
              browser and never sent to the server.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanged}
            className={cx(
              'btn-ghost inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            data-testid="settings-reset"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reset to defaults
          </button>
        </div>

        {/* Live status banner */}
        <section
          aria-live="polite"
          aria-atomic="true"
          className="mb-6 rounded-xl border border-[#BEC7FE]/15 bg-white/[0.03] p-4 sm:p-5"
          data-testid="settings-status"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#22D3EE]/10 px-2 py-1 font-bold uppercase tracking-wide text-[#22D3EE]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Auto-saved
            </span>
            <span>Motion is currently {reduced ? 'reduced' : 'in full effect'}.</span>
            <span aria-hidden className="text-gray-700">·</span>
            <span>
              System prefers-reduced-motion:{' '}
              <span className="font-semibold text-gray-300">
                {systemPreference ? 'reduce' : 'no-preference'}
              </span>
            </span>
            <span aria-hidden className="text-gray-700">·</span>
            <span>
              Override:{' '}
              <span className="font-semibold text-gray-300">{override}</span>
            </span>
          </div>
        </section>

        {/* Network badge */}
        <section
          aria-labelledby="settings-network-heading"
          className="glass-card mb-6 rounded-xl p-6 sm:p-8"
          data-testid="settings-section-network"
        >
          <header className="mb-6 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]/15 text-[#22D3EE]"
              aria-hidden
            >
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-network-heading"
                className="text-lg font-bold text-white"
              >
                Network
              </h2>
              <p className="text-xs text-gray-500">
                Decide whether Xelma shows a settlement-network badge in the navbar.
              </p>
            </div>
          </header>

          <ToggleRow
            title="Show network badge"
            description="Display a Mainnet / Testnet pill next to the wallet controls. Useful when juggling multiple Stellar deployments."
            icon={<Gauge className="h-5 w-5" />}
            checked={showNetworkBadge}
            onToggle={() => setShowNetworkBadge(!showNetworkBadge)}
            testId="settings-toggle-network-badge"
          />

          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-[#BEC7FE]/10 bg-[#0A0F1A]/40 p-4">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Preview
            </span>
            {showNetworkBadge ? (
              <NetworkBadge />
            ) : (
              <span className="text-xs italic text-gray-500">
                Badge hidden by current preference.
              </span>
            )}
            <span className="ml-auto text-xs text-gray-500">
              {showNetworkBadge
                ? 'The badge appears next to the wallet controls in the navbar.'
                : 'The badge is hidden — only your wallet controls show in the navbar.'}
            </span>
          </div>
        </section>

        {/* Sound */}
        <section
          aria-labelledby="settings-sound-heading"
          className="glass-card mb-6 rounded-xl p-6 sm:p-8"
          data-testid="settings-section-sound"
        >
          <header className="mb-6 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C4BFD]/15 text-[#BEC7FE]"
              aria-hidden
            >
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-sound-heading"
                className="text-lg font-bold text-white"
              >
                Sound
              </h2>
              <p className="text-xs text-gray-500">
                Master toggle for UI sound effects (round alerts, bet confirms, …).
              </p>
            </div>
          </header>

          <ToggleRow
            title="Enable sound effects"
            description="When disabled, Xelma plays no audio no matter what individual round events fire. Sound is muted by default until you opt in."
            icon={<Bell className="h-5 w-5" />}
            checked={soundEnabled}
            onToggle={() => setSoundEnabled(!soundEnabled)}
            testId="settings-toggle-sound"
          />

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#BEC7FE]/10 bg-[#0A0F1A]/40 p-4">
            <span className="text-xs text-gray-400">
              Want to confirm what this sounds like? Press the test button — it plays
              a short confirmation tone.
            </span>
            <button
              type="button"
              onClick={handleTestSound}
              disabled={!soundEnabled}
              className={cx(
                'btn-ghost ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              data-testid="settings-test-sound"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
              Test sound
            </button>
          </div>
        </section>

        {/* Streamer mode */}
        <section
          aria-labelledby="settings-streamer-heading"
          className="glass-card mb-6 rounded-xl p-6 sm:p-8"
          data-testid="settings-section-streamer"
        >
          <header className="mb-6 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]/10 text-[#22D3EE]"
              aria-hidden
            >
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-streamer-heading"
                className="text-lg font-bold text-white"
              >
                Streamer mode
              </h2>
              <p className="text-xs text-gray-500">
                Mirror of the public profile flag. Use this as a quick toggle without
                opening the profile modal.
              </p>
            </div>
          </header>

          <ToggleRow
            title="Streamer mode"
            description="Highlight that you're a streamer on your public profile. This mirrors the toggle inside the Profile → Edit profile modal, so you don't need to dig into profile settings to flip it."
            icon={<Eye className="h-5 w-5" />}
            checked={streamerMode}
            onToggle={() => setStreamerMode(!streamerMode)}
            testId="settings-toggle-streamer"
          />
        </section>

        {/* Reduced motion */}
        <section
          aria-labelledby="settings-motion-heading"
          className="glass-card mb-6 rounded-xl p-6 sm:p-8"
          data-testid="settings-section-motion"
        >
          <header className="mb-6 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C4BFD]/15 text-[#BEC7FE]"
              aria-hidden
            >
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-motion-heading"
                className="text-lg font-bold text-white"
              >
                Motion
              </h2>
              <p className="text-xs text-gray-500">
                Override the browser / operating system <code>prefers-reduced-motion</code>{' '}
                preference for Xelma.
              </p>
            </div>
          </header>

          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Motion preference</legend>
            {MOTION_OPTIONS.map((option, index) => {
              const isChecked = motionPreference === option.value;
              const inputId = `settings-motion-${index}`;
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cx(
                    'flex cursor-pointer items-start gap-4 rounded-2xl border px-5 py-4 transition-colors',
                    'focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2C4BFD] focus-within:ring-offset-2 focus-within:ring-offset-[#0A0F1A]',
                    isChecked
                      ? 'border-[#2C4BFD]/55 bg-[#2C4BFD]/10'
                      : 'border-[#BEC7FE]/15 bg-white/[0.04] hover:bg-white/[0.06]',
                  )}
                  data-testid={`settings-motion-option-${option.value}`}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name="motion-preference"
                    value={option.value}
                    checked={isChecked}
                    onChange={() => setMotionPreference(option.value)}
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#2C4BFD]"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-bold text-white">{option.label}</span>
                    <span className="mt-1 text-xs leading-relaxed text-gray-400">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <p className="mt-5 rounded-xl border border-[#BEC7FE]/10 bg-[#0A0F1A]/40 p-4 text-xs leading-relaxed text-gray-400">
            <span className="font-semibold text-gray-200">Note:</span> Xelma already
            honors the system setting globally via CSS.{' '}
            {systemPreference ? (
              <>
                Your operating system is currently asking for{' '}
                <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-gray-200">
                  reduce
                </code>{' '}
                motion.
              </>
            ) : (
              <>
                Your operating system is currently allowing{' '}
                <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-gray-200">
                  no-preference
                </code>{' '}
                motion.
              </>
            )}{' '}
            Use these controls only if you want to override that.
          </p>
        </section>

        {/* Developer settings (dev/testnet only) */}
        {SHOW_DEV_SETTINGS && (
          <section
            aria-labelledby="settings-dev-heading"
            className="glass-card mb-6 rounded-xl p-6 sm:p-8"
            data-testid="settings-section-dev"
          >
            <header className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]/10 text-[#22D3EE]"
                aria-hidden
              >
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="settings-dev-heading"
                  className="text-lg font-bold text-white"
                >
                  Developer
                </h2>
                <p className="text-xs text-gray-500">
                  Inspect the on-chain configuration this build is connected to.
                </p>
              </div>
            </header>

            <button
              type="button"
              onClick={() => setIsDevDrawerOpen(true)}
              className="btn-ghost inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold"
              data-testid="settings-open-dev-drawer"
            >
              <Code className="h-4 w-4" aria-hidden />
              View contract config
            </button>
          </section>
        )}

        <DevSettingsDrawer
          isOpen={isDevDrawerOpen}
          onClose={() => setIsDevDrawerOpen(false)}
        />

        {/* Footer note */}
        <p className="mt-2 text-center text-xs text-gray-500">
          Preferences live in <code>localStorage</code> under{' '}
          <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-gray-300">
            xelma-settings-v1
          </code>
          .
        </p>
      </div>
    </main>
  );
}
