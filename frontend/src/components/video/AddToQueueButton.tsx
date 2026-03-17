"use client";

import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToQueueButtonProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  channelName?: string;
  duration?: string;
  className?: string;
}

export function AddToQueueButton({
  videoId,
  title,
  thumbnail,
  channelName,
  duration,
  className
}: AddToQueueButtonProps) {
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const queue = usePlayerStore((s) => s.queue);
  const isInQueue = queue.some((item) => item.videoId === videoId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInQueue) {
      toast.info("Already in queue");
      return;
    }

    addToQueue({
      videoId,
      title,
      thumbnail,
      channelName,
      duration,
    });
    toast.success("Added to queue");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
        isInQueue
          ? "bg-primary/90 text-primary-foreground"
          : "bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm",
        className
      )}
      title={isInQueue ? "Already in queue" : "Add to queue"}
      aria-label={isInQueue ? "Already in queue" : "Add to queue"}
    >
      <ListPlus className="h-4 w-4" />
    </button>
  );
}
