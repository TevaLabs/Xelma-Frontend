import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WAITLIST_STORAGE_KEY = 'xelma:tournament-waitlist';

const ROADMAP_CARDS = [
  { title: 'tournament.seasonsTitle', description: 'tournament.seasonsDescription', icon: CalendarDays },
  { title: 'tournament.prizesTitle', description: 'tournament.prizesDescription', icon: Gift },
  { title: 'tournament.eligibilityTitle', description: 'tournament.eligibilityDescription', icon: ShieldCheck },
] as const;

function saveWaitlistEmail(email: string): 'saved' | 'duplicate' | 'error' {
  try {
    const stored = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    let emails: string[] = [];

    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          emails = parsed.filter((entry): entry is string => typeof entry === 'string');
        }
      } catch {
        // Replace invalid local data with a clean waitlist on the next signup.
      }
    }

    if (emails.some((entry) => entry.toLowerCase() === email.toLowerCase())) {
      return 'duplicate';
    }

    window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify([...emails, email]));
    return 'saved';
  } catch {
    return 'error';
  }
}

export default function Tournament() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'saved' | 'duplicate' | 'error' | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupStatus(saveWaitlistEmail(email.trim()));
  }

  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <section className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16" aria-labelledby="tournament-title">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-xelma-teal/30 bg-xelma-teal/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
            <span className="status-dot status-dot-green" aria-hidden="true" />
            {t('tournament.pageEyebrow')}
          </div>
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-xelma-blue/30 bg-xelma-blue/10 text-cyan-200 shadow-[0_0_32px_rgba(44,75,253,0.18)]">
            <Trophy className="size-7" aria-hidden="true" />
          </div>
          <h1 id="tournament-title" className="hero-headline text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {t('tournament.heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
            {t('tournament.heroDescription')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm text-gray-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <CalendarDays className="size-4 text-cyan-300" aria-hidden="true" />
              {t('tournament.seasonsTitle')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <Gift className="size-4 text-cyan-300" aria-hidden="true" />
              {t('tournament.prizesTitle')}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-xelma-blue/15 text-cyan-200">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('tournament.waitlistTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{t('tournament.waitlistDescription')}</p>

          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <label htmlFor="tournament-email" className="block text-sm font-medium text-gray-200">
              {t('tournament.emailLabel')}
            </label>
            <input
              id="tournament-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSignupStatus(null);
              }}
              placeholder={t('tournament.emailPlaceholder')}
              className="w-full rounded-xl border border-white/15 bg-[#0A0F1A]/80 px-4 py-3 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              type="submit"
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold"
            >
              {t('tournament.submitCta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-gray-500">{t('tournament.localStorageNote')}</p>
          <div aria-live="polite" className="mt-4 min-h-6">
            {signupStatus === 'saved' && (
              <p role="status" className="flex items-start gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{t('tournament.confirmation', { email: email.trim() })}</span>
              </p>
            )}
            {signupStatus === 'duplicate' && (
              <p role="status" className="text-sm text-cyan-200">{t('tournament.duplicateConfirmation')}</p>
            )}
            {signupStatus === 'error' && (
              <p role="alert" className="text-sm text-rose-300">{t('tournament.storageError')}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="tournament-roadmap-title">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{t('tournament.roadmapEyebrow')}</p>
          <h2 id="tournament-roadmap-title" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('tournament.roadmapTitle')}
          </h2>
          <p className="mt-3 leading-relaxed text-gray-400">{t('tournament.roadmapDescription')}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROADMAP_CARDS.map(({ title, description, icon: Icon }, index) => (
            <article key={title} className="glass-card relative overflow-hidden rounded-2xl p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-xelma-blue/80 to-transparent" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                  {t('tournament.roadmapStep', { number: index + 1 })}
                </span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-cyan-200">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{t(description)}</p>
            </article>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <UsersRound className="size-4 text-cyan-300" aria-hidden="true" />
          {t('tournament.roadmapNote')}
        </p>
      </section>
    </main>
  );
}