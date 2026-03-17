"use client";

import { Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  useWatchLaterCheck,
  useAddToWatchLater,
  useRemoveFromWatchLater,
} from "@/hooks/useWatchLater";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WatchLaterButtonProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  channelName?: string;
  channelId?: string;
  duration?: string;
  /** "full" = text + icon (watch page), "icon" = icon only (card overlay) */
  variant?: "full" | "icon";
  className?: string;
}

export function WatchLaterButton({
  videoId,
  title,
  thumbnail,
  channelName,
  channelId,
  duration,
  variant = "full",
  className,
}: WatchLaterButtonProps) {
  const { isAuthenticated } = useAuth();
  const { data: isSaved, isLoading: checking } = useWatchLaterCheck(videoId);
  const addMutation = useAddToWatchLater();
  const removeMutation = useRemoveFromWatchLater();

  const isPending = addMutation.isPending || removeMutation.isPending;
  const saved = isSaved === true;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Sign in to save videos");
      return;
    }

    if (isPending) return;

    if (saved) {
      removeMutation.mutate(videoId);
    } else {
      addMutation.mutate({ videoId, title, thumbnail, channelName, channelId, duration });
    }
  };

  // ── Icon-only variant (video card thumbnail overlay) ──────────────────────

  if (variant === "icon") {
    return (
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
          saved
            ? "bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm",
          isPending && "opacity-60 cursor-not-allowed",
          className,
        )}
        title={saved ? "Remove from Watch Later" : "Save to Watch Later"}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </button>
    );
  }

  // ── Full variant (watch page action bar) ──────────────────────────────────

  return (
    <Button
      variant={saved ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2 rounded-full transition-all duration-200",
        saved && "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
        className,
      )}
      onClick={handleClick}
      disabled={isPending || checking}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      {saved ? "Saved" : "Watch Later"}
    </Button>
  );
}
