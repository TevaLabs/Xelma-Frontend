import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, type LucideIcon } from 'lucide-react';

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoonPage({ icon: Icon, title, description }: ComingSoonPageProps) {
  const navigate = useNavigate();

  return (
    <main id="main-content" className="xelma-grid-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card mx-auto max-w-md rounded-2xl p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2C4CFD]/15">
          <Icon className="h-8 w-8 text-[#BC7FE]" aria-hidden />
        </div>

        <h1 className="mb-3 text-2xl font-black text-white">{title}</h1>

        <p className="mb-8 text-sm leading-6 text-gray-400">{description}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to"/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2C4CFD] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2C4BFD]/90"
          >
            <Home className="h-4 w-4" aria-hidden />
            Back to Home
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 px-5 py-3 text-sm font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Go back
          </button>
        </div>
      </div>
    </main>
  );
}
