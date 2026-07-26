/**
 * Temporary shell used when a UI surface is intentionally stubbed for
 * Stellar Wave / hackathon contributor issues. Replace this body when
 * completing the linked GitHub issue — do not ship placeholders long-term.
 */
interface ContributorTaskPlaceholderProps {
  title: string;
  issueHint: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ContributorTaskPlaceholder({
  title,
  issueHint,
  className = '',
  children,
}: ContributorTaskPlaceholderProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-cyan-500/40 bg-cyan-500/5 p-6 text-center ${className}`}
      role="status"
      aria-label={`${title} — contributor task`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
        Contributor task
      </p>
      <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{issueHint}</p>
      {children}
    </div>
  );
}
