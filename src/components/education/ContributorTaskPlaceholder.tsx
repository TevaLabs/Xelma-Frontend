interface ContributorTaskPlaceholderProps {
  title: string;
  issueHint?: string;
}

export default function ContributorTaskPlaceholder({ title, issueHint }: ContributorTaskPlaceholderProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-600 p-4 text-center text-sm text-gray-500">
      <p className="font-semibold">{title}</p>
      {issueHint && <p className="mt-1 text-xs">{issueHint}</p>}
    </div>
  );
}
