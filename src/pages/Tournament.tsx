import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Gift, CheckCircle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

const WAITLIST_KEY = 'xelma_tournament_waitlist';

interface RoadmapCard {
  icon: typeof Trophy;
  title: string;
  description: string;
  highlights: string[];
  color: string;
}

const roadmapCards: RoadmapCard[] = [
  {
    icon: Calendar,
    title: 'Competitive Seasons',
    description: 'Tournaments run in structured seasons, each lasting several weeks with increasing stakes.',
    highlights: [
      'Monthly season resets',
      'Leaderboard-based matchmaking',
      'Season-exclusive badges',
    ],
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Gift,
    title: 'Prize Pools',
    description: 'Compete for a share of growing prize pools funded by platform fees and special events.',
    highlights: [
      'vXLM prize distribution',
      'Bonus rewards for top performers',
      'Special event jackpots',
    ],
    color: 'from-amber-500 to-orange-400',
  },
  {
    icon: ShieldCheck,
    title: 'Eligibility & Rules',
    description: 'Open to all connected wallet holders. Fair play is enforced through on-chain verification.',
    highlights: [
      'Minimum 100 vXLM balance required',
      'One entry per wallet per round',
      'Verified random round generation',
    ],
    color: 'from-emerald-500 to-teal-400',
  },
];

export default function Tournament() {
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(() => {
    try {
      return localStorage.getItem(WAITLIST_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isSubscribed) {
      try {
        localStorage.setItem(WAITLIST_KEY, 'true');
      } catch {
        /* storage unavailable */
      }
    }
  }, [isSubscribed]);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !wallet.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubscribed(true);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <main className="xelma-grid-bg min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2C4BFD]/20 to-cyan-500/20 ring-1 ring-[#2C4BFD]/30">
            <Trophy className="h-8 w-8 text-[#BEC7FE]" aria-hidden />
          </div>
          <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl">
            Tournament
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400">
            Competitive tournament mode is coming to Xelma. Climb the leaderboard,
            earn rewards, and prove your prediction skills.
          </p>
        </div>

        {/* Roadmap Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roadmapCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:border-[#2C4BFD]/30 hover:shadow-[0_0_32px_rgba(44,75,253,0.08)]"
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  {card.title}
                </h3>
                <p className="mb-4 text-sm leading-6 text-gray-400">
                  {card.description}
                </p>
                <ul className="space-y-2">
                  {card.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2C4BFD]" aria-hidden />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Waitlist Section */}
        <div className="glass-card mx-auto mb-12 max-w-2xl rounded-2xl p-8 text-center sm:p-10">
          {isSubscribed ? (
            <div className="py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-7 w-7 text-emerald-400" aria-hidden />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">You&apos;re on the list!</h2>
              <p className="text-sm text-gray-400">
                We&apos;ll notify you when tournament mode launches.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-xl font-bold text-white">Get notified</h2>
              <p className="mb-6 text-sm text-gray-400">
                Be the first to know when tournaments go live.
              </p>
              <form onSubmit={handleWaitlistSubmit} className="mx-auto max-w-md space-y-4">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#2C4BFD]/50 focus:bg-white/10"
                    aria-label="Email address"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Or your Stellar wallet address (optional)"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#2C4BFD]/50 focus:bg-white/10 font-mono"
                  aria-label="Stellar wallet address"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || (!email.trim() && !wallet.trim())}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Notify me'}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="btn-ghost inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold"
          >
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
