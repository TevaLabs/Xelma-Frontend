import { useState, type FormEvent } from 'react';
import { Shield, Trophy, Zap, Users } from 'lucide-react';

const WAITLIST_STORAGE_KEY = 'xelma_tournament_waitlist';

const ROADMAP_ITEMS = [
  {
    phase: 'Phase 1',
    title: 'Tournament Infrastructure',
    description: 'Backend tournament engine, matchmaking, and scoring system.',
    icon: Shield,
  },
  {
    phase: 'Phase 2',
    title: 'Ranked Seasons',
    description: 'Seasonal leaderboard resets with tier-based rewards and exclusive badges.',
    icon: Trophy,
  },
  {
    phase: 'Phase 3',
    title: 'Live Tournaments',
    description: 'Real-time competitive events with entry limits and escalating prize pools.',
    icon: Zap,
  },
  {
    phase: 'Phase 4',
    title: 'Custom Tournaments',
    description: 'Create private tournaments with friends or community groups.',
    icon: Users,
  },
] as const;

function addToWaitlist(email: string): boolean {
  const stored = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
  const parsed: unknown = stored ? JSON.parse(stored) : [];

  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
    throw new Error('Stored waitlist data is invalid.');
  }

  if (parsed.includes(email)) return false;

  window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify([...parsed, email]));
  return true;
}

function Roadmap() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="roadmap-title">
      <div className="mx-auto max-w-5xl">
        <h2 id="roadmap-title" className="text-center text-3xl font-bold tracking-tight text-white">
          Development Roadmap
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
          Here&apos;s what we&apos;re building to bring competitive tournaments to Xelma.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {ROADMAP_ITEMS.map(({ phase, title, description, icon: Icon }) => (
            <article key={phase} className="glass-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {phase}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
                  <span className="mt-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Upcoming
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const added = addToWaitlist(normalizedEmail);
      setMessage(
        added
          ? 'You’re on the tournament waitlist!'
          : 'This email is already on the waitlist.',
      );
      setHasError(false);
    } catch {
      setMessage('We couldn’t save your email on this device. Please try again.');
      setHasError(true);
    }
  }

  return (
    <section className="px-4 py-8 pb-16 sm:px-6 lg:px-8" aria-labelledby="waitlist-title">
      <div className="glass-card mx-auto max-w-2xl rounded-2xl p-7 text-center sm:p-9">
        <h2 id="waitlist-title" className="text-2xl font-bold text-white">
          Get notified when tournaments launch
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
          Join the local waitlist to save your interest on this device. No account or backend
          required.
        </p>
        <form
          className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="tournament-waitlist-email">
            Email address
          </label>
          <input
            id="tournament-waitlist-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage('');
            }}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-xelma-blue focus:outline-none focus:ring-2 focus:ring-xelma-blue/30"
          />
          <button
            type="submit"
            className="btn-primary inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Join waitlist
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-sm ${hasError ? 'text-red-400' : 'text-emerald-400'}`}
            role={hasError ? 'alert' : 'status'}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Tournament() {
  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen">
      <section className="px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-[#2C4BFD]/15">
            <Trophy className="size-10 text-[#BEC7FE]" aria-hidden="true" />
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <span className="status-dot status-dot-yellow" aria-hidden="true" />
            Coming Soon
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Tournament mode is on the way
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-400">
            Compete against other predictors, climb the rankings, and earn rewards. We’re building
            the tournament experience now.
          </p>
        </div>
      </section>
      <Roadmap />
      <Waitlist />
    </main>
  );
}
