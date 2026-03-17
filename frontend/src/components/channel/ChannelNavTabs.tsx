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
  showIf?: (tabs: string[]) => boolean;
}

const TABS: TabItem[] = [
  { value: "home", label: "Home" },
  { value: "videos", label: "Videos" },
  { value: "shorts", label: "Shorts", showIf: (tabs) => tabs.includes("shorts") },
  { value: "live", label: "Live", showIf: (tabs) => tabs.includes("live") },
  { value: "podcasts", label: "Podcasts", showIf: (tabs) => tabs.includes("podcasts") },
  { value: "playlists", label: "Playlists", showIf: (tabs) => tabs.includes("playlists") },
  { value: "posts", label: "Posts", showIf: (tabs) => tabs.includes("posts") || tabs.includes("community") },
  { value: "about", label: "About" },
];

interface ChannelNavTabsProps {
  activeTab: ChannelTab;
  onTabChange: (tab: ChannelTab) => void;
  availableTabs?: string[];
}

export function ChannelNavTabs({ activeTab, onTabChange, availableTabs }: ChannelNavTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const visibleTabs = React.useMemo(() => {
    return TABS.filter((tab) => {
      if (!tab.showIf) return true;
      return tab.showIf(availableTabs || []);
    });
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

  // Open search: focus input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div className="sticky top-[56px] z-30 bg-[#0f0f0f] border-b border-white/[0.08]">
      <div className="px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex items-center gap-2">

          {/* Tabs — hidden when search is open on mobile */}
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
              {/* Animated underline */}
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
                    ref={isActive ? activeButtonRef : undefined}
                    onClick={() => onTabChange(tab.value)}
                    className={cn(
                      "relative px-4 py-3 text-[13px] font-medium whitespace-nowrap",
                      "transition-colors duration-150",
                      "hover:bg-white/[0.06] rounded-sm",
                      isActive
                        ? "text-white"
                        : "text-[#aaaaaa] hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search expand area */}
          {searchOpen && (
            <div className="flex-1 sm:flex-none sm:w-64 flex items-center gap-2 py-1.5">
              <Search className="h-4 w-4 text-[#aaa] flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search channel"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#aaa] outline-none border-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-[#aaa] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Search icon button */}
          {!searchOpen && (
            <button
              type="button"
              aria-label="Search channel"
              onClick={() => setSearchOpen(true)}
              className="flex-shrink-0 h-9 w-9 rounded-full border border-white/[0.12] bg-white/[0.06] text-white/80 hover:bg-white/[0.12] hover:text-white transition-colors flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
