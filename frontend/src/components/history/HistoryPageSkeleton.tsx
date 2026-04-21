"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function HistoryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      {/* Continue Watching skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="relative h-[180px] w-[260px] shrink-0 sm:w-[280px] rounded-xl bg-white/[0.02]"
            />
          ))}
        </div>
      </div>

      {/* Grid sections skeletons */}
      <div className="space-y-6">
        {/* Today section */}
        <div>
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                className="relative h-[220px] w-full rounded-xl bg-white/[0.02]"
              />
            ))}
          </div>
        </div>

        {/* Yesterday section */}
        <div>
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className="relative h-[220px] w-full rounded-xl bg-white/[0.02]"
              />
            ))}
          </div>
        </div>

        {/* This Week section */}
        <div>
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="relative h-[220px] w-full rounded-xl bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}