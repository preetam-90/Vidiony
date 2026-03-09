"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api, type CommentData } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ThumbsUp, MessageCircle, ChevronDown, ChevronUp,
  ArrowUpDown, Clock, Flame, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Individual comment with expand-long-text ─────────────────────────────────

const COMMENT_CLAMP = 5; // lines before "read more"

function CommentRow({ comment }: { comment: CommentData }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Detect if text is actually clamped
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 2);
  }, []);

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        {comment.authorThumbnail && <AvatarImage src={comment.authorThumbnail.url} />}
        <AvatarFallback className="text-xs bg-white/10">
          {comment.authorName?.charAt(0)?.toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Author + timestamp */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-sm font-semibold leading-none",
            comment.isCreator ? "text-primary" : ""
          )}>
            {comment.authorName}
          </span>
          {comment.isCreator && (
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
              Creator
            </span>
          )}
          <span className="text-xs text-muted-foreground">{comment.publishedAt}</span>
        </div>

        {/* Comment text */}
        <p
          ref={textRef}
          className={cn(
            "text-sm whitespace-pre-line break-words leading-relaxed text-white/85",
            !expanded && `line-clamp-${COMMENT_CLAMP}`
          )}
          style={{ WebkitLineClamp: expanded ? "unset" : COMMENT_CLAMP }}
        >
          {comment.text}
        </p>

        {/* Read more / less */}
        {(isClamped || expanded) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-white transition-colors font-medium"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-0.5">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.likeCount > 0 && (
              <span>{comment.likeCount >= 1000
                ? `${(comment.likeCount / 1000).toFixed(1)}K`
                : comment.likeCount}
              </span>
            )}
          </button>
          {comment.replyCount > 0 && (
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <ChevronDown className="h-3.5 w-3.5" />
              {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="flex gap-2">
          <Skeleton className="h-3.5 w-28 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-12 rounded-full mt-1" />
      </div>
    </div>
  );
}

// ─── Main CommentSection ──────────────────────────────────────────────────────

interface CommentSectionProps {
  videoId: string;
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const [sort, setSort] = useState<"top" | "new">("top");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["comments", videoId, sort],
    queryFn: ({ pageParam = 0 }) => api.getComments(videoId, pageParam as number, sort),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length; // next page index
    },
    staleTime: 3 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry expired continuations — user needs to re-fetch from page 0
      if (error?.message?.includes("CONTINUATION_EXPIRED")) return false;
      return failureCount < 2;
    },
  });

  // Flatten all loaded pages into one array
  const allComments = data?.pages.flatMap((p) => p.comments) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? null;

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" } // start loading 400px before hitting bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-5 mt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <CommentSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-4 text-sm text-muted-foreground text-center">
        Comments unavailable for this video.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Header + sort toggle */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          {totalCount
            ? <span>{totalCount}</span>
            : allComments.length > 0
              ? <span>{allComments.length.toLocaleString()} comments</span>
              : <span>Comments</span>
          }
        </h2>

        <div className="flex items-center rounded-full border border-white/10 overflow-hidden text-xs">
          <button
            onClick={() => setSort("top")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              sort === "top"
                ? "bg-white/10 text-white font-medium"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <Flame className="h-3.5 w-3.5" /> Top
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => setSort("new")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              sort === "new"
                ? "bg-white/10 text-white font-medium"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <Clock className="h-3.5 w-3.5" /> Newest
          </button>
        </div>
      </div>

      {/* Comments */}
      {allComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet.</p>
      ) : (
        <div className="space-y-5">
          {allComments.map((comment, i) => (
            <CommentRow key={`${comment.id}-${i}`} comment={comment} />
          ))}
        </div>
      )}

      {/* Sentinel div — triggers next page load when visible */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading spinner */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more comments…
        </div>
      )}

      {/* End of comments */}
      {!hasNextPage && allComments.length > 20 && (
        <p className="text-center text-xs text-muted-foreground/50 pb-2">
          — {allComments.length.toLocaleString()} comments loaded —
        </p>
      )}
    </div>
  );
}
