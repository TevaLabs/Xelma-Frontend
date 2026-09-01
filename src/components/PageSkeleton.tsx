import React from 'react';

/**
 * Reusable skeleton UI displayed while a lazy‑loaded page is being fetched.
 * The `type` prop determines the height/shape to best match the target page.
 * Adjust the styling to align with the app's design system.
 */
interface PageSkeletonProps {
  /**
   * Name of the page type – used to apply different placeholder dimensions.
   * Supported values: 'dashboard' | 'legacy' | 'leaderboard' | 'learn'.
   */
  type: 'dashboard' | 'legacy' | 'leaderboard' | 'learn' | 'settings' | 'tournament';
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ type }) => {
  const heightMap: Record<string, string> = {
    dashboard: 'h-96',
    legacy: 'h-80',
    leaderboard: 'h-64',
    learn: 'h-72',
    settings: 'h-80',
    tournament: 'h-72',
  };

  return (
    <div className="xelma-grid-bg min-h-screen flex items-center justify-center">
      <div className={`glass-card rounded-xl p-8 flex flex-col items-center gap-4 w-full max-w-3xl mx-4 ${heightMap[type]}`}>
        <div
          className="h-12 w-12 rounded-full border-4 border-[#2C4BFD] border-t-transparent motion-safe:animate-spin"
          role="status"
          aria-label="Loading page"
        />
        <p className="text-sm font-medium text-gray-500 tracking-wide">Loading {type}…</p>
      </div>
    </div>
  );
};

export default PageSkeleton;
