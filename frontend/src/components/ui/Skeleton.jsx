import { cn } from '@/lib/utils';

/**
 * Skeleton — Loading placeholder with shimmer animation.
 * Replaces react-shimmer-effects with a lightweight Tailwind-based solution.
 * Inspired by Vercel's clean loading states.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-[var(--surface-border)]/60 rounded-[var(--radius-md)]',
        'animate-pulse',
        className
      )}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton compositions for common patterns.
 */
function SkeletonCard({ className }) {
  return (
    <div className={cn(
      'bg-[var(--surface-primary)] rounded-[var(--radius-lg)]',
      'border border-[var(--surface-border)] overflow-hidden',
      className
    )}>
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1 rounded-[var(--radius-sm)]" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface-primary)] p-6 rounded-[var(--radius-lg)] border border-[var(--surface-border)]"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface-primary)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[var(--surface-border)]">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="p-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonDashboard };
export default Skeleton;
