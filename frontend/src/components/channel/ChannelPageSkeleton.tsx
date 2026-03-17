"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChannelPageSkeletonProps {
  className?: string;
}

export function ChannelPageSkeleton({ className }: ChannelPageSkeletonProps) {
  return (
    <div className={cn("", className)}>
      {/* Banner skeleton — matches new banner height */}
      <Skeleton className="h-[120px] sm:h-[170px] md:h-[220px] w-full rounded-none" />

      {/* Info row skeleton */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-10 sm:-mt-12 pb-4 sm:pb-5">
            {/* Avatar */}
            <Skeleton className="w-20 h-20 sm:w-28 sm:h-28 md:w-[112px] md:h-[112px] rounded-full flex-shrink-0" />

            {/* Channel details */}
            <div className="flex-1 space-y-2.5 pb-1">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2.5 pt-1">
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="px-3 sm:px-6 lg:px-8 border-b border-white/[0.08]">
        <div className="mx-auto max-w-6xl flex items-center gap-2">
          <div className="flex gap-1 flex-1 py-1">
            {[80, 72, 68, 90, 72, 64].map((w, i) => (
              <Skeleton key={i} className="h-9 rounded-sm" style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-6xl">
          {/* Featured video skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Skeleton className="aspect-video sm:w-[340px] md:w-[400px] lg:w-[480px] rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
          </div>

          <Skeleton className="h-5 w-24 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
