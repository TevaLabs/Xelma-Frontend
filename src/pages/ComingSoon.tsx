import { Link } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="xelma-grid-bg min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(44,75,253,0.15),_transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-40 h-96 w-96 rounded-full bg-[#2C4BFD]/10 blur-3xl" />

        <div className="relative">
          {/* Icon */}
          {icon ? (
            <div className="mb-6 flex justify-center text-6xl">{icon}</div>
          ) : (
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#2C4BFD]/20 p-6">
              <svg
                className="h-16 w-16 text-cyan-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {/* Title and Description */}
          <h1 className="text-4xl font-black text-white sm:text-5xl">{title}</h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">{description}</p>

          {/* Waitlist Info */}
          <div className="mt-12 rounded-2xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">
              Launch Timeline
            </p>
            <p className="text-base text-gray-300">
              We're building something special. Check back soon for updates.
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary rounded-xl px-8 py-4 text-base font-bold">
              Back to Home
            </Link>
            <a href="#" className="btn-ghost rounded-xl px-8 py-4 text-base font-semibold">
              Notify Me
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
