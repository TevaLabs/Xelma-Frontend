import { cn } from "../lib/utils";

interface SkeletonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function SkeletonBlock({ className, style, ...rest }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.03] motion-safe:animate-pulse",
        className
      )}
      style={style}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div
      className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Card Skeleton (left sidebar) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-5">
              <SkeletonBlock className="h-7 w-3/4 mb-6 mx-auto" />
              <SkeletonBlock className="h-6 w-1/2 mb-4 mx-auto" />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <SkeletonBlock className="h-20 rounded-xl" />
                <SkeletonBlock className="h-20 rounded-xl" />
              </div>

              <SkeletonBlock className="h-4 w-1/3 mb-3" />
              <SkeletonBlock className="h-12 w-full mb-4 rounded-lg" />

              <SkeletonBlock className="h-4 w-1/2 mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <SkeletonBlock className="h-6 w-11 rounded-full" />
                <SkeletonBlock className="h-4 w-24" />
              </div>

              <SkeletonBlock className="h-5 w-2/3 mb-4" />
              <SkeletonBlock className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* Right Column: Price Chart + Activity Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Price Chart Skeleton */}
            <div className="glass-card rounded-xl min-h-[350px] p-6 border border-gray-100 dark:border-gray-700">
              <SkeletonBlock className="h-5 w-32 mb-4" />
              <div className="flex items-end gap-1 h-[280px]">
                {[18, 28, 22, 55, 38, 62, 45, 72, 35, 58, 48, 82, 52, 68, 42, 78, 55, 88, 38, 65, 48, 72, 58, 42].map((pct, i) => (
                  <SkeletonBlock
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ height: `${pct}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Activity Feed Skeleton */}
            <div className="glass-card rounded-2xl p-5">
              <SkeletonBlock className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex-1 space-y-1.5">
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="h-3 w-12" />
                    </div>
                    <div className="text-right space-y-1.5">
                      <SkeletonBlock className="h-4 w-16 ml-auto" />
                      <SkeletonBlock className="h-3 w-20 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
