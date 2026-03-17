"use client";

import { useState } from "react";
import { ChannelAbout as ChannelAboutType } from "@/lib/api";
import {
  Users, Video, Eye, Calendar, ExternalLink,
  ChevronDown, ChevronUp, MapPin, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelAboutProps {
  about: ChannelAboutType;
  className?: string;
}

function formatLargeNumber(val?: string): string {
  if (!val) return "—";
  // If already formatted (e.g. "1.2M") return as-is
  if (/[kmb]/i.test(val)) return val;
  const n = parseInt(val.replace(/,/g, ""), 10);
  if (isNaN(n)) return val;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

export function ChannelAbout({ about, className }: ChannelAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const truncateAt = 500;
  const shouldTruncate = about.description?.length > truncateAt;
  const displayedDesc = shouldTruncate && !expanded
    ? about.description.slice(0, truncateAt)
    : about.description;

  const joinedFormatted = about.joinedDate
    ? new Date(about.joinedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  return (
    <div className={cn("max-w-5xl mx-auto", className)}>
      {/* Two-column layout — matches YouTube */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

        {/* LEFT — Description */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Description</h2>
          <div className="text-sm text-[#aaaaaa] whitespace-pre-wrap leading-relaxed">
            {displayedDesc || "No description provided."}
            {shouldTruncate && (
              <>
                {!expanded && <span>…</span>}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-white font-medium hover:underline mt-3"
                >
                  {expanded ? (
                    <><ChevronUp className="h-4 w-4" /> Show less</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" /> Show more</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Stats + Links */}
        <div className="space-y-6">

          {/* Channel stats */}
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Stats</h2>
            <ul className="space-y-3">
              {about.subscriberCount && (
                <li className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span><span className="text-white font-medium">{about.subscriberCount}</span> subscribers</span>
                </li>
              )}
              {about.videoCount && (
                <li className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <Video className="h-4 w-4 flex-shrink-0" />
                  <span className="text-white font-medium">{about.videoCount}</span>
                  <span className="-ml-2 text-[#aaaaaa]">videos</span>
                </li>
              )}
              {about.totalViewCount && (
                <li className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <Eye className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <span className="text-white font-medium">
                      {formatLargeNumber(about.totalViewCount)}
                    </span>{" "}
                    views
                  </span>
                </li>
              )}
              {joinedFormatted && (
                <li className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Joined <span className="text-white font-medium">{joinedFormatted}</span></span>
                </li>
              )}
              {about.country && (
                <li className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-white font-medium">{about.country}</span>
                </li>
              )}
            </ul>
          </div>

          {/* External links */}
          {about.links.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Links</h2>
              <ul className="space-y-3">
                {about.links.map((link, index) => {
                  let hostname = link.url;
                  try { hostname = new URL(link.url).hostname.replace(/^www\./, ""); } catch { }
                  return (
                    <li key={index}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-[#3ea6ff] hover:underline group"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0 text-[#aaaaaa] group-hover:text-[#3ea6ff] transition-colors" />
                        <span className="truncate">{link.title || hostname}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ml-auto" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
