"use client";

import { useState } from "react";
import {
  MoreVertical,
  ListPlus,
  FolderPlus,
  Share,
  ThumbsUp,
  UserMinus,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WatchLaterButton } from "./WatchLaterButton";
import { usePlayerStore } from "@/store/playerStore";
import PlaylistModal from "./PlaylistModal";
import { toast } from "sonner";

interface VideoOptionsMenuProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  channelName?: string;
  channelId?: string;
  duration?: string;
}

export function VideoOptionsMenu({
  videoId,
  title,
  thumbnail,
  channelName,
  channelId,
  duration,
}: VideoOptionsMenuProps) {
  const { addToQueue } = usePlayerStore();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/watch/${videoId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard");
    }
  };

  const menuItems = [
    {
      icon: ListPlus,
      label: "Add to queue",
      onClick: () => {
        addToQueue({
          videoId,
          title,
          thumbnail,
          channelName,
          duration,
        });
        toast.success("Added to queue");
      },
    },
    {
      icon: FolderPlus,
      label: "Save to playlist",
      onClick: () => setIsPlaylistModalOpen(true),
    },
    {
      icon: ThumbsUp,
      label: "Not interested",
      onClick: () => toast.info("Not interested (simulated)"),
    },
    {
      icon: UserMinus,
      label: "Don't recommend channel",
      onClick: () => toast.info(`Don't recommend ${channelName || "channel"} (simulated)`),
    },
    {
      icon: Flag,
      label: "Report",
      onClick: () => toast.info("Report submitted (simulated)"),
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            onClick={(e) => e.preventDefault()}
            aria-label="Video options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-white/10 bg-[#1a1a1a] text-white/90 shadow-xl"
        >
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm focus:bg-white/10"
            onClick={(e) => e.preventDefault()}
          >
            <div onClick={(e) => e.preventDefault()}>
              <WatchLaterButton
                videoId={videoId}
                title={title}
                thumbnail={thumbnail}
                channelName={channelName}
                channelId={channelId}
                duration={duration}
                variant="full"
                className="justify-start gap-2 w-full hover:bg-transparent border-none shadow-none bg-transparent text-white/90 hover:text-white"
              />
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/10" />

          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm focus:bg-white/10"
            onClick={(e) => {
              e.preventDefault();
              handleShare();
            }}
          >
            <Share className="h-4 w-4" />
            Share
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/10" />

          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm focus:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        videoId={videoId}
        videoTitle={title}
        videoThumbnail={thumbnail}
      />
    </>
  );
}
