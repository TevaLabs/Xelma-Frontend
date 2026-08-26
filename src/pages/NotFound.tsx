import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="xelma-grid-bg flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      {/* Ambient glows matching Landing page */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#2C4BFD]/8 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        {/* Branded illustration — terminal-style 404 */}
        <div className="glass-card mb-8 flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-2xl sm:h-44 sm:w-44">
          <span
            className="text-6xl font-black tracking-tight text-[#2C4BFD] sm:text-7xl"
            style={{
              textShadow: '0 0 40px rgba(44,75,253,0.45), 0 0 80px rgba(6,182,212,0.18)',
            }}
          >
            404
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            <span className="status-dot status-dot-yellow" aria-hidden="true" />
            Signal lost
          </span>
        </div>

        {/* Badge */}
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#BEC7FE]/20 bg-[#2C4BFD]/10 px-4 py-1.5 text-sm font-medium text-cyan-200">
          Unknown route
        </p>

        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          This path doesn&apos;t exist
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-gray-400">
          The route you navigated to has no matching endpoint in the prediction terminal. It may
          have been moved or never existed.
        </p>

        {/* Info banner */}
        <div className="mt-6 w-full rounded-xl border border-[#2C4BFD]/25 bg-[#2C4BFD]/10 px-4 py-3 text-left text-sm text-[#BEC7FE]">
          <span className="font-semibold text-white">Tip:</span> Head back to the dashboard to
          browse active rounds and pools.
        </div>

        {/* CTAs */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="btn-primary rounded-xl px-8 py-3.5 text-sm font-bold text-center"
          >
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="btn-ghost rounded-xl px-8 py-3.5 text-sm font-semibold text-center"
          >
            Open Terminal
          </Link>
        </div>
      </div>
    </main>
  );
}
