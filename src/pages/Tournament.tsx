import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';

const roadmapCards = [
  {
    title: 'Seasons',
    eyebrow: 'Season 01',
    description:
      'Weekly prediction sprints with qualifier windows, live standings, and a finals bracket for the sharpest market readers.',
    icon: CalendarDays,
  },
  {
    title: 'Prizes',
    eyebrow: 'Rewards pool',
    description:
      'Planned XLM prize pools, profile badges, and tournament-only multipliers for players who finish in the top tiers.',
    icon: Gift,
  },
  {
    title: 'Eligibility',
    eyebrow: 'Fair play',
    description:
      'Freighter-connected accounts with verified Stellar addresses will be eligible once the first tournament season opens.',
    icon: ShieldCheck,
  },
];

const highlights = [
  'Season roadmap publishing before registration opens',
  'Leaderboard snapshots for every qualifier round',
  'Wallet-based registration with no duplicate entries',
];

export default function Tournament() {
  const [waitlistValue, setWaitlistValue] = useState('');
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!waitlistValue.trim()) {
      return;
    }

    setJoinedWaitlist(true);
  };

  return (
    <main className="xelma-grid-bg relative min-h-screen overflow-hidden px-4 py-8 text-[#F3F4F6] sm:px-6 lg:px-8 lg:py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.22),_transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase text-cyan-200">
              <Trophy className="h-4 w-4" aria-hidden />
              Tournament mode
            </div>

            <div className="max-w-3xl">
              <h1 className="hero-headline text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Xelma Tournament
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                A branded competitive shell for seasonal prediction runs, prize milestones, and eligibility updates before the first public bracket opens.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2C4BFD] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2C4BFD]/20 transition-colors hover:bg-[#4F6BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Back to dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#tournament-waitlist"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Join waitlist
                <Users className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <aside className="glass-card rounded-2xl p-6 shadow-2xl shadow-[#2C4BFD]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">Current phase</p>
                <h2 className="mt-1 text-2xl font-black text-white">Roadmap buildout</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200">
                <Medal className="h-7 w-7" aria-hidden />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex gap-3 rounded-xl bg-white/5 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  <p className="text-sm leading-6 text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-12" aria-labelledby="tournament-roadmap-heading">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Roadmap</p>
              <h2 id="tournament-roadmap-heading" className="mt-2 text-2xl font-black text-white">
                Seasons, prizes, and eligibility
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-400">
              Tournament details will tighten as backend registration support lands. Until then, this page gives players a useful launch map.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {roadmapCards.map(({ title, eyebrow, description, icon: Icon }) => (
              <article key={title} className="glass-card rounded-2xl p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
                <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="tournament-waitlist"
          className="mt-12 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)] md:p-8"
          aria-labelledby="tournament-waitlist-heading"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Waitlist</p>
            <h2 id="tournament-waitlist-heading" className="mt-2 text-2xl font-black text-white">
              Get notified before qualifiers open
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Drop an email or Stellar G-address. This stays local for now and can connect to a backend endpoint when registration is ready.
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label htmlFor="tournament-waitlist-entry" className="sr-only">
              Email or Stellar wallet address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="tournament-waitlist-entry"
                type="text"
                value={waitlistValue}
                onChange={(event) => {
                  setWaitlistValue(event.target.value);
                  setJoinedWaitlist(false);
                }}
                placeholder="Email or Stellar G-address"
                className="min-h-12 flex-1 rounded-xl border border-white/10 bg-[#0A0F1A]/80 px-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-black text-[#0A0F1A] transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Notify me
              </button>
            </div>
            {joinedWaitlist && (
              <p className="text-sm font-semibold text-emerald-300" role="status">
                You are on the tournament waitlist.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
