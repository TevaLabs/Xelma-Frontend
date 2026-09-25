import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  CalendarDays,
  Check,
  Eye,
  Link as LinkIcon,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import IdenticonAvatar from '../components/IdenticonAvatar';

/**
 * Read-only public profile share card.
 *
 * The route intentionally renders without a connected wallet and without any
 * auth: the profile is derived deterministically from the route param so
 * `/u/:handle` and `/profile/:id` both resolve to a stable, shareable card.
 * Swap `buildMockPublicProfile` for a real public-profile fetch once the
 * backend exposes one.
 */

// Handles that resolve to a not-found state instead of a mock card, so the
// 404 path is easy to demo and test.
const NOT_FOUND_HANDLES = new Set([
  'missing',
  'not-found',
  'notfound',
  'unknown',
  'deleted',
  '404',
]);

const BIO_POOL = [
  'Reading the market one round at a time. Stellar prediction enthusiast.',
  'Directional-mode regular — here for the charts, staying for the settlement.',
  'Collective intelligence believer, in since the very first testnet round.',
  'Precision-mode specialist quietly climbing the leaderboard.',
  'Learning the mechanics of on-chain prediction markets, one call at a time.',
];

const BADGE_POOL = [
  'Early Adopter',
  'Top Predictor',
  'Streak Master',
  'Pool Veteran',
  'Sharp Mind',
  'Community Pillar',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type PublicProfileData = {
  handle: string;
  displayName: string;
  bio: string;
  joined: string;
  link: string;
  badges: string[];
  predictions: number;
  winRate: number;
  followers: number;
  following: number;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function titleCase(value: string): string {
  return value
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildMockPublicProfile(identifier: string): PublicProfileData {
  const handle = (identifier.startsWith('@') ? identifier.slice(1) : identifier).trim();
  const seed = hashString(handle.toLowerCase());
  const isNumericId = /^\d+$/.test(handle);
  const displayName = isNumericId ? `Player ${handle}` : titleCase(handle) || 'Xelma Player';

  const badges: string[] = [];
  const badgeCount = 2 + (seed % 2);
  for (let i = 0; i < badgeCount; i += 1) {
    const badge = BADGE_POOL[(seed + i * 3) % BADGE_POOL.length];
    if (!badges.includes(badge)) badges.push(badge);
  }

  const joinedYear = 2024 + (seed % 3);
  const joinedMonth = MONTHS[seed % MONTHS.length];

  return {
    handle,
    displayName,
    bio: BIO_POOL[seed % BIO_POOL.length],
    joined: `${joinedMonth} ${joinedYear}`,
    link: `https://x.com/${handle}`,
    badges,
    predictions: 40 + (seed % 960),
    winRate: 41 + (seed % 39),
    followers: 120 + (seed % 48_000),
    following: 8 + (seed % 320),
  };
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function PublicProfile() {
  const { handle, id } = useParams<{ handle?: string; id?: string }>();
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);

  const identifier = (handle ?? id ?? '').trim();
  const isNotFound = identifier.length === 0 || NOT_FOUND_HANDLES.has(identifier.toLowerCase());

  const profile = useMemo(
    () => (isNotFound ? null : buildMockPublicProfile(identifier)),
    [identifier, isNotFound],
  );

  const profileUrl =
    typeof window === 'undefined' ? pathname : `${window.location.origin}${pathname}`;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleShare = useCallback(async () => {
    const ok = await copyToClipboard(profileUrl);

    if (ok) {
      setCopied(true);
      toast.success('Profile link copied to clipboard');
      return;
    }

    toast.error('Could not copy link', {
      description: 'Your browser may be blocking clipboard access.',
    });
  }, [profileUrl]);

  if (!profile) {
    return (
      <main
        id="main-content"
        className="xelma-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
      >
        <section
          className="glass-card w-full max-w-lg rounded-2xl p-8 text-center"
          aria-labelledby="public-profile-missing-title"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2C4BFD]/10 text-[#BEC7FE]">
            <AlertCircle className="h-8 w-8" aria-hidden />
          </div>
          <h1
            id="public-profile-missing-title"
            className="mt-6 text-2xl font-black tracking-tight text-white sm:text-3xl"
          >
            Profile not found
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400">
            No public profile matches this handle. The account may have been removed, or the
            shared link may be incomplete.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary rounded-xl px-6 py-3 text-center text-sm font-bold">
              Back to Home
            </Link>
            <Link
              to="/leaderboard"
              className="btn-ghost rounded-xl px-6 py-3 text-center text-sm font-semibold"
            >
              Browse Leaderboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const stats = [
    { label: 'Predictions', value: profile.predictions.toLocaleString('en-US'), icon: TrendingUp },
    { label: 'Win rate', value: `${profile.winRate}%`, icon: Trophy },
    { label: 'Followers', value: profile.followers.toLocaleString('en-US'), icon: Users },
    { label: 'Following', value: profile.following.toLocaleString('en-US'), icon: UserRound },
  ];

  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#A5F3FC]">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Public profile
          </span>
        </div>

        <section
          className="glass-card relative overflow-hidden rounded-2xl p-6 sm:p-8"
          aria-labelledby="public-profile-name"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[#2C4BFD]/25 via-[#22D3EE]/10 to-transparent"
            aria-hidden
          />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#BEC7FE]/20 bg-[#111827] shadow-lg shadow-[#2C4BFD]/10 sm:h-28 sm:w-28">
                  <IdenticonAvatar
                    address={profile.handle}
                    name={profile.displayName}
                    className="h-full w-full"
                  />
                </div>

                <div className="min-w-0">
                  <h1
                    id="public-profile-name"
                    className="break-words text-2xl font-black text-white sm:text-3xl"
                  >
                    {profile.displayName}
                  </h1>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#BEC7FE]">
                    <AtSign className="h-4 w-4" aria-hidden />
                    {profile.handle}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2C4BFD]/25 bg-[#2C4BFD]/10 px-2.5 py-1 text-xs font-bold text-[#BEC7FE]"
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleShare()}
                className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                aria-label="Copy profile share link"
                data-testid="public-profile-share"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Share2 className="h-4 w-4" aria-hidden />
                )}
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>

            <p className="mt-8 text-sm leading-6 text-gray-300 sm:text-base">{profile.bio}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Joined {profile.joined}
              </span>
              <a
                href={profile.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#BEC7FE] transition-colors hover:text-white"
              >
                <LinkIcon className="h-3.5 w-3.5" aria-hidden />
                x.com/{profile.handle}
              </a>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[#BEC7FE]/10 pt-6 sm:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#BEC7FE]/10 bg-white/[0.03] p-4"
                >
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </dt>
                  <dd className="mt-2 text-xl font-black text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-[#2C4BFD]/20 bg-[#2C4BFD]/5 p-4 text-xs leading-5 text-[#BEC7FE]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Read-only view. This public card is a mock preview and does not require a connected
          wallet.
        </p>
      </div>
    </main>
  );
}
