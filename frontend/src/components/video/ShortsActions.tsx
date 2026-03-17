"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ShortsActionsProps {
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onRemix?: () => void;
}

function formatCount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function ShortsActions({
  likes = 0,
  comments = 0,
  isLiked = false,
  isDisliked = false,
  onLike,
  onDislike,
  onComment,
  onShare,
  onRemix,
}: ShortsActionsProps) {
  const [showMore, setShowMore] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
    onShare?.();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <ActionButton
        icon={<Heart className={`h-7 w-7 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />}
        label={formatCount(likes)}
        isActive={isLiked}
        onClick={onLike}
      />
      
      <ActionButton
        icon={<MessageCircle className="h-7 w-7 text-white" />}
        label={formatCount(comments)}
        onClick={onComment}
      />
      
      <ActionButton
        icon={<Repeat className="h-7 w-7 text-white" />}
        label="Remix"
        onClick={onRemix}
      />
      
      <ActionButton
        icon={<Share2 className="h-7 w-7 text-white" />}
        label="Share"
        onClick={handleShare}
      />
      
      <div className="relative">
        <ActionButton
          icon={<MoreHorizontal className="h-7 w-7 text-white" />}
          onClick={() => setShowMore(!showMore)}
        />
        
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-full top-0 mr-2 w-40 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 py-2"
            >
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors">
                <Repeat className="h-4 w-4" />
                Remix
              </button>
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors">
                Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
}

function ActionButton({ icon, label, isActive, onClick }: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className={`flex items-center justify-center rounded-full p-2 transition-all ${
          isActive
            ? "bg-red-500/20"
            : "bg-white/10 group-hover:bg-white/20"
        }`}
      >
        {icon}
      </div>
      {label && (
        <span className="text-xs font-medium text-white/90">{label}</span>
      )}
    </motion.button>
  );
}
