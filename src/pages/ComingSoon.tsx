import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, type LucideIcon } from 'lucide-react';

export interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon | React.ReactNode;
  backUrl?: string;
  backLabel?: string;
  timeline?: string;
  showNotify?: boolean;
  onNotify?: () => void;
}

function isLucideIcon(icon: LucideIcon | React.ReactNode): icon is LucideIcon {
  return typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon);
}

export default function ComingSoon({
  title,
  description,
  icon,
  backUrl,
  backLabel = 'Go back',
  timeline,
  showNotify = false,
  onNotify,
}: ComingSoonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const renderIcon = () => {
    if (!icon) {
      return <Clock className="h-8 w-8 text-[#BEC7FE]" aria-hidden="true" />;
    }
    if (isLucideIcon(icon)) {
      const IconComponent = icon;
      return <IconComponent className="h-8 w-8 text-[#BEC7FE]" aria-hidden="true" />;
    }
    return icon;
  };

  return (
    <main
      id="main-content"
      className="xelma-grid-bg flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
      role="main"
      aria-labelledby="coming-soon-title"
    >
      <div className="glass-card mx-auto max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/15 text-[#BEC7FE]">
          {renderIcon()}
        </div>

        <h1 id="coming-soon-title" className="mb-3 text-2xl font-black text-white sm:text-3xl">
          {title}
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-gray-400 sm:text-base">
          {description}
        </p>

        {timeline && (
          <div className="mb-6 rounded-xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Launch Timeline
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {timeline}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {backUrl ? (
            <Link
              to={backUrl}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </button>
          )}

          {showNotify && (
            <button
              type="button"
              onClick={onNotify}
              className="btn-primary inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white sm:w-auto"
            >
              Notify Me
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
