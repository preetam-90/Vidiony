"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChannelTab =
  | "home"
  | "videos"
  | "shorts"
  | "live"
  | "podcasts"
  | "playlists"
  | "posts"
  | "about";

interface TabItem {
  value: ChannelTab;
  label: string;
}

const TABS: TabItem[] = [
  { value: "home", label: "Home" },
  { value: "videos", label: "Videos" },
  { value: "shorts", label: "Shorts" },
  { value: "live", label: "Live" },
  { value: "podcasts", label: "Podcasts" },
  { value: "playlists", label: "Playlists" },
  { value: "posts", label: "Posts" },
  { value: "about", label: "About" },
];

const TAB_ALIASES: Record<ChannelTab, string[]> = {
  home: ["home", "featured"],
  videos: ["videos"],
  shorts: ["shorts"],
  live: ["live", "streams"],
  podcasts: ["podcasts"],
  playlists: ["playlists"],
  posts: ["posts", "community"],
  about: ["about"],
};

export function getVisibleChannelTabs(availableTabs?: string[]): ChannelTab[] {
  const normalizedTabs = new Set(
    (availableTabs ?? [])
      .map((tab) => tab.trim().toLowerCase())
      .filter(Boolean)
  );

  return TABS.filter(({ value }) => {
    if (value === "home" || value === "about") return true;
    if (normalizedTabs.size === 0) return value === "videos";

    return TAB_ALIASES[value].some((alias) => normalizedTabs.has(alias));
  }).map((tab) => tab.value);
}

interface ChannelNavTabsProps {
  activeTab: ChannelTab;
  onTabChange: (tab: ChannelTab) => void;
  availableTabs?: string[];
  onSearch?: (query: string) => void;
}

export function ChannelNavTabs({ activeTab, onTabChange, availableTabs, onSearch }: ChannelNavTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const visibleTabs = React.useMemo(() => {
    const visibleValues = new Set(getVisibleChannelTabs(availableTabs));
    return TABS.filter((tab) => visibleValues.has(tab.value));
  }, [availableTabs]);

  const updateIndicator = useCallback(() => {
    if (!tabsRef.current) return;
    const tabButtons = tabsRef.current.querySelectorAll<HTMLButtonElement>("[data-tab]");
    const activeIndex = visibleTabs.findIndex((t) => t.value === activeTab);
    if (activeIndex === -1) return;
    const activeButton = tabButtons[activeIndex];
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
    }
  }, [searchQuery, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      setSearchOpen(false);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="sticky top-[56px] z-30 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/[0.08]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] flex items-center gap-2">

          {/* Tabs scrollable area */}
          <div
            className={cn(
              "flex-1 transition-all duration-200",
              searchOpen ? "hidden sm:block" : "block"
            )}
          >
            <div
              ref={tabsRef}
              className="relative flex overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Animated underline indicator */}
              <div
                className="absolute bottom-0 h-[2px] bg-white transition-all duration-200 ease-out rounded-full"
                style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
              />

              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    data-tab={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={cn(
                      "relative px-3 py-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150",
                      "hover:bg-white/[0.06]",
                      isActive
                        ? "text-white"
                        : "text-[#aaa] hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

           {/* Inline channel search */}
           {searchOpen && (
             <div className="flex-1 sm:flex-none sm:w-64 flex items-center gap-2 py-1.5">
               <Search className="h-4 w-4 text-[#aaa] flex-shrink-0" />
               <input
                 ref={searchInputRef}
                 type="text"
                 placeholder="Search channel"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
                 className="flex-1 bg-transparent text-sm text-white placeholder:text-[#aaa] outline-none border-none"
               />
               <button
                 onClick={() => {
                   setSearchOpen(false);
                   setSearchQuery("");
                 }}
                 className="text-[#aaa] hover:text-white transition-colors"
               >
                 <X className="h-4 w-4" />
               </button>
             </div>
           )}

          {/* Search toggle */}
          {!searchOpen && (
            <button
              type="button"
              aria-label="Search channel"
              onClick={() => setSearchOpen(true)}
              className="flex-shrink-0 h-9 w-9 rounded-full hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors flex items-center justify-center"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
