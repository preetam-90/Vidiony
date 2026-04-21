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
    })
    : null;

  return (
    <div className={cn("mx-auto max-w-[1280px]", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

        {/* LEFT — Description */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Description</h2>
          <div className="text-sm text-[#aaa] whitespace-pre-wrap leading-relaxed">
            {displayedDesc || "No description provided."}
            {shouldTruncate && (
              <>
                {!expanded && <span>…</span>}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-white font-medium hover:underline mt-2"
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
        <div className="space-y-8">

          {/* Stats */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Stats</h2>
            <ul className="space-y-2.5">
              {about.subscriberCount && (
                <li className="flex items-center gap-2.5 text-sm text-[#aaa]">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span><span className="text-white font-medium">{formatNumber(about.subscriberCount)}</span> subscribers</span>
                </li>
              )}
              {about.videoCount && (
                <li className="flex items-center gap-2.5 text-sm text-[#aaa]">
                  <Video className="h-4 w-4 flex-shrink-0" />
                  <span><span className="text-white font-medium">{about.videoCount}</span> videos</span>
                </li>
              )}
              {about.totalViewCount && (
                <li className="flex items-center gap-2.5 text-sm text-[#aaa]">
                  <Eye className="h-4 w-4 flex-shrink-0" />
                  <span><span className="text-white font-medium">{formatNumber(about.totalViewCount)}</span> views</span>
                </li>
              )}
              {joinedFormatted && (
                <li className="flex items-center gap-2.5 text-sm text-[#aaa]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Joined <span className="text-white font-medium">{joinedFormatted}</span></span>
                </li>
              )}
              {about.country && (
                <li className="flex items-center gap-2.5 text-sm text-[#aaa]">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-white font-medium">{about.country}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Links */}
          {about.links.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-white mb-3">Links</h2>
              <ul className="space-y-2.5">
                {about.links.map((link, index) => {
                  let hostname = link.url;
                  try { hostname = new URL(link.url).hostname.replace(/^www\./, ""); } catch { }
                  return (
                    <li key={index}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#3ea6ff] hover:underline group"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-[#aaa]" />
                        <span className="truncate">{link.title || hostname}</span>
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

function formatNumber(val: string): string {
  if (/[kmb]/i.test(val)) return val;
  const n = parseInt(val.replace(/,/g, ""), 10);
  if (isNaN(n)) return val;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}
