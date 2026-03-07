"use client";

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#181818]">
      <div className="aspect-video animate-pulse bg-white/5" />
      <div className="flex gap-3 p-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/5" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#181818]">
      <div className="aspect-[21/9] animate-pulse bg-white/5" />
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-white/5" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[280px] shrink-0">
            <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
            <div className="mt-2 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-[#181818] p-5">
      <div className="h-16 w-16 animate-pulse rounded-full bg-white/5" />
      <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
      <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
      <div className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
    </div>
  );
}
