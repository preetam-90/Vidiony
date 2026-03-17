"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
  href?: string;
  action?: React.ReactNode;
  badge?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  accentColor = "from-violet-500 to-indigo-500",
  href,
  action,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${accentColor}`}
          >
            {/* Soft glow behind icon */}
            <div
              className={`absolute inset-0 rounded-[14px] bg-gradient-to-br ${accentColor} opacity-40 blur-lg`}
            />
            <span className="relative">{icon}</span>
          </div>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2
              className="text-[17px] font-extrabold tracking-tight text-white sm:text-xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </h2>
            {badge && (
              <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/40 ring-1 ring-white/[0.06]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] font-medium text-white/30">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {action}
        {href && !action && (
          <Link
            href={href}
            className="group flex items-center gap-1.5 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/40 ring-1 ring-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:text-white/70 hover:ring-white/[0.12] hover:shadow-lg hover:shadow-white/[0.02]"
          >
            See all
            <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
