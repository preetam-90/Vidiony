"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ChannelVideoItem } from "@/lib/api";
import { ChevronLeft, ChevronRight, MessageSquare, ThumbsUp } from "lucide-react";

interface ChannelPostCardProps {
  item: ChannelVideoItem;
}

function formatCompactCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

export function ChannelPostCard({ item }: ChannelPostCardProps) {
  const images = useMemo(() => (item.mediaImages ?? []).filter(Boolean), [item.mediaImages]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const contentText = item.content || item.title;
  const avatarSrc = item.authorAvatar || item.thumbnail;

  const hasCarousel = images.length > 0;
  const activeImage = hasCarousel ? images[currentImageIndex % images.length] : null;

  const goPrev = () => {
    if (images.length < 2) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (images.length < 2) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#272727]">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={item.authorName ?? item.title}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-white">{item.authorName || item.title}</span>
            {item.publishedAt ? <span className="text-[#aaa]">{item.publishedAt}</span> : null}
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/90 line-clamp-6">
            {contentText}
          </p>

          {activeImage ? (
            <div className="mt-3">
              <div className="relative overflow-hidden rounded-xl bg-[#1b1b1b] aspect-[16/10]">
                <Image
                  src={activeImage}
                  alt={`Post image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover transition-transform duration-300"
                  sizes="(max-width: 1024px) 100vw, 720px"
                  unoptimized
                />

                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                      {currentImageIndex + 1}/{images.length}
                    </div>
                  </>
                ) : null}
              </div>

              {images.length > 1 ? (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {images.map((src, index) => (
                    <button
                      type="button"
                      key={`${item.id}-thumb-${index}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border ${index === currentImageIndex ? "border-white/70" : "border-white/15"}`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={src}
                        alt={`Post image thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-4 text-xs text-[#aaa]">
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5" />
              {formatCompactCount(item.likeCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {formatCompactCount(item.commentCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
