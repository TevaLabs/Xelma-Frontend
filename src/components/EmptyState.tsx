import { Link } from 'react-router-dom';

export default function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl bg-gradient-to-br from-[#1e1e2f] to-[#3a3a5c] text-white shadow-lg">
      <h2 className="text-2xl font-bold">No Active Rounds</h2>
      <p className="text-center max-w-md">
        There are currently no active rounds. Learn how the game works or refresh to check for new rounds.
      </p>
      <div className="flex gap-4">
        <Link
          to="/learn"
          className="px-4 py-2 rounded-lg bg-[#2C4BFD]/30 hover:bg-[#2C4BFD]/50 transition"
        >
          Learn More
        </Link>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg bg-[#2C4BFD]/30 hover:bg-[#2C4BFD]/50 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
