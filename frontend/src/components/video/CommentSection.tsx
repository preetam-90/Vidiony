"use client";

import { useComments } from "@/hooks/useYoutube";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, MessageCircle } from "lucide-react";

interface CommentSectionProps {
  videoId: string;
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const { data: comments, isLoading, error } = useComments(videoId);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-sm text-muted-foreground">
        Comments unavailable for this video.
      </div>
    );
  }

  if (!comments?.length) {
    return (
      <div className="mt-6 text-sm text-muted-foreground">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        {comments.length} Comments
      </h2>

      <div className="mt-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              {comment.authorThumbnail && (
                <AvatarImage src={comment.authorThumbnail.url} />
              )}
              <AvatarFallback>
                {comment.authorName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {comment.authorName}
                </span>
                {comment.isCreator && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    Creator
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {comment.publishedAt}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line break-words">
                {comment.text}
              </p>
              <div className="flex items-center gap-4 pt-1">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {comment.likeCount > 0 && comment.likeCount}
                </button>
                {comment.replyCount > 0 && (
                  <span className="text-xs text-primary">
                    {comment.replyCount} replies
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
