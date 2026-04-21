"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HistoryVideoCard } from "./HistoryVideoCard";
import type { WatchHistoryItem } from "@/lib/api";

interface HistoryGridSectionProps {
  title: string;
  accentColor?: string;
  items: WatchHistoryItem[];
  onRemove: (videoId: string) => void;
}

export function HistoryGridSection({
  title,
  accentColor = "from-violet-500 to-indigo-500",
  items,
  onRemove,
}: HistoryGridSectionProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title={title}
        accentColor={accentColor}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <HistoryVideoCard
            key={item.id}
            item={item}
            onRemove={onRemove}
            isInHistory={true}
          />
        ))}
      </div>
    </section>
  );
}