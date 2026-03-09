"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSED_HEIGHT = 80; // px — roughly 4 lines

interface VideoDescriptionProps {
  description: string;
  publishedAt?: string;
  viewCount?: number;
}

export function VideoDescription({ description, publishedAt, viewCount }: VideoDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > COLLAPSED_HEIGHT + 8);
  }, [description]);

  return (
    <div
      className={cn(
        "relative px-4 pb-1 cursor-pointer select-none",
        !expanded && overflows && "cursor-pointer"
      )}
      onClick={() => { if (!expanded && overflows) setExpanded(true); }}
    >
      {/* Meta row — views + date shown only when collapsed */}
      {!expanded && (viewCount || publishedAt) && (
        <div className="flex items-center gap-3 mb-1.5 text-xs font-medium text-white/80">
          {viewCount !== undefined && viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {viewCount >= 1_000_000
                ? `${(viewCount / 1_000_000).toFixed(1)}M views`
                : viewCount >= 1_000
                  ? `${(viewCount / 1_000).toFixed(1)}K views`
                  : `${viewCount} views`}
            </span>
          )}
          {publishedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {publishedAt}
            </span>
          )}
        </div>
      )}

      {/* Description text */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: expanded ? `${contentRef.current?.scrollHeight ?? 9999}px` : `${COLLAPSED_HEIGHT}px` }}
      >
        <p className="text-sm text-white/75 whitespace-pre-line break-words leading-relaxed">
          {description}
        </p>
      </div>

      {/* Gradient fade when collapsed */}
      {!expanded && overflows && (
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, rgb(20 20 20 / 0.95))",
          }}
        />
      )}

      {/* Show more / Show less button */}
      {overflows && (
        <button
          className={cn(
            "relative z-10 flex items-center gap-1 text-xs font-semibold mt-1 transition-colors",
            expanded
              ? "text-muted-foreground hover:text-white mt-2"
              : "text-white hover:text-white/80"
          )}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Show more</>
          )}
        </button>
      )}

      {/* Bottom padding */}
      <div className="pb-3" />
    </div>
  );
}
