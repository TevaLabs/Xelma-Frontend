import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HowItWorks from '../components/HowItWorks';
import ModeCards from '../components/ModeCards';
import GlassCard from '../components/ui/GlassCard';
import StatusPill from '../components/ui/StatusPill';
import { useNetworkStats } from '../hooks/useNetworkStats';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Count-up animation for metric values.
 *
 * When prefers-reduced-motion is active, displays the target value immediately
 * without animation per WCAG guidelines. Otherwise animates over durationMs with
 * eased cubic out curve for smooth visual feedback.
 *
 * Preserves intermediate counter state during stats updates (mock -> live) so
 * the animation always begins from the currently displayed value, not zero.
 */
function useCountUp(target: number, durationMs = 1800) {
  const [value, setValue] = useState(target);
  // Track the last displayed value so re-targeting (mock -> live stats) animates
  // smoothly from where it is rather than snapping back to zero.
  const latestRef = useRef(target);
  const { reduced } = useReducedMotion();

  useEffect(() => {
    // Under reduced motion, jump immediately to the target value.
    if (reduced) {
      latestRef.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    const startValue = latestRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.floor(startValue + (target - startValue) * eased);
      latestRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return value;
}

function formatStat(value: number, type: 'rounds' | 'vxlm' | 'players') {
  if (type === 'vxlm') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    return value.toLocaleString();
  }
  return value.toLocaleString();
}

export default function Landing() {
  const { t } = useTranslation();
  const { stats, isStale } = useNetworkStats();
  const rounds = useCountUp(stats.totalRounds);
  const vxlm = useCountUp(stats.vXlmDistributed);
  const players = useCountUp(stats.activePlayers);

  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen text-[#F3F4F6]">
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.18),_transparent_60%)]" />
        <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-16 h-96 w-96 rounded-full bg-[#2C4BFD]/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <StatusPill as="p" tone="brand" className="mb-5 gap-2 px-4 py-1.5 text-sm font-medium">
            {t('landing.badge')}
          </StatusPill>

          <h1 className="hero-headline text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t('landing.headline1')}
            <br />
            <span className="hero-headline-accent">{t('landing.headline2')}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
            {t('landing.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard" className="btn-primary rounded-xl px-8 py-4 text-base font-bold">
              {t('landing.enterTerminal')}
            </Link>
            <a href="#how-it-works" className="btn-ghost rounded-xl px-8 py-4 text-base font-semibold">
              {t('landing.howItWorks')}
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-300">
            {t('landing.starterNote')}
          </p>

          {/* Reserved-height row so the badge never shifts the layout on load. */}
          <div className="mx-auto mt-12 flex h-6 max-w-3xl items-center justify-center">
            {isStale && (
              <StatusPill
                tone="amber"
                dot
                dotClassName="bg-amber-400"
                className="px-3 py-1 text-xs font-medium"
                role="status"
                title={t('landing.cachedMetricsDescription')}
              >
                {t('landing.cachedMetrics')}
              </StatusPill>
            )}
          </div>

          {/* Metrics Strip: glass tokens with responsive spacing */}
          <div className="mx-auto mt-8 w-full max-w-4xl px-4 sm:px-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Rounds Resolved */}
              <GlassCard className="rounded-2xl p-6 sm:p-7 text-left transition-all hover:border-xelma-blue/30">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {t('landing.roundsResolved')}
                </p>
                <p className="mt-3 text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {formatStat(rounds, 'rounds')}
                </p>
              </GlassCard>

              {/* Practice Volume */}
              <GlassCard className="rounded-2xl p-6 sm:p-7 text-left transition-all hover:border-xelma-teal/30">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {t('landing.practiceVolume')}
                </p>
                <p className="mt-3 text-3xl sm:text-4xl font-black text-cyan-300 tabular-nums">
                  {formatStat(vxlm, 'vxlm')}
                </p>
                <p className="mt-1 text-xs font-medium text-cyan-400/60">vXLM</p>
              </GlassCard>

              {/* Active Predictors */}
              <GlassCard className="rounded-2xl p-6 sm:p-7 text-left transition-all hover:border-xelma-blue/30">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {t('landing.activePredictors')}
                </p>
                <p className="mt-3 text-3xl sm:text-4xl font-black text-[#BEC7FE] tabular-nums">
                  {formatStat(players, 'players')}
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      <div id="how-it-works">
        <HowItWorks />
      </div>
      <ModeCards />

      <footer className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-white">Xelma</p>
            <p className="mt-1 text-sm text-gray-300">
              {t('footer.description')}
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <span>MIT License</span>
            <a
              href="https://github.com/TevaLabs/Xelma-Frontend"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
