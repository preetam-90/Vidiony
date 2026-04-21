"use client";

import { memo, useEffect, useState, useMemo, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass,
  History,
  Home,
  Library,
  Radio,
  TrendingUp,
  Clock,
  ThumbsUp,
  Video as VideoIcon,
  Settings,
  ChevronRight,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useYouTubeGuide, getIcon } from "@/hooks/useYouTubeGuide";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
  thumbnail?: string;
};

const DESKTOP_WIDTH_EXPANDED = 248;
const DESKTOP_WIDTH_COLLAPSED = 72;

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/trending",
    label: "Trending",
    icon: TrendingUp,
    match: (pathname) => pathname.startsWith("/trending"),
  },
  {
    href: "/subscriptions",
    label: "Subscriptions",
    icon: Radio,
    match: (pathname) => pathname.startsWith("/subscriptions"),
  },
];

const FALLBACK_NAV: NavItem[] = [
  {
    href: "/library",
    label: "Library",
    icon: Library,
    match: (pathname) => pathname.startsWith("/library"),
  },
  {
    href: "/history",
    label: "History",
    icon: History,
    match: (pathname) => pathname.startsWith("/history"),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (pathname) => pathname.startsWith("/explore") || pathname.startsWith("/category"),
  },
];

const PERSONAL_NAV: NavItem[] = [
  {
    href: "/watch-later",
    label: "Watch Later",
    icon: Clock,
    match: (pathname) => pathname.startsWith("/watch-later"),
  },
  {
    href: "/liked-videos",
    label: "Liked Videos",
    icon: ThumbsUp,
    match: (pathname) => pathname.startsWith("/liked-videos"),
  },
  {
    href: "/my-videos",
    label: "My Videos",
    icon: VideoIcon,
    match: (pathname) => pathname.startsWith("/my-videos"),
  },
];

const FOOTER_NAV: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/settings"),
  },
];

const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[2],
  FALLBACK_NAV[0],
];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const SidebarNavLink = memo(function SidebarNavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(item, pathname);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-11 items-center rounded-xl px-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        collapsed ? "justify-center px-0" : "justify-start gap-3",
        active
          ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.1)]"
          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="shrink-0"
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.label} className={cn("h-6 w-6 rounded-full", !active && "grayscale opacity-80")} />
        ) : (
          <Icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-foreground/60 group-hover:text-foreground")} />
        )}
      </motion.div>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="truncate font-medium"
        >
          {item.label}
        </motion.span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
});

function SidebarSection({
  title,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <section className="space-y-1.5" aria-label={title ?? "Primary navigation"}>
      {!collapsed && title ? (
        <h2 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/45">
          {title}
        </h2>
      ) : null}
      {items.map((item) => (
        <SidebarNavLink
          key={item.href + item.label}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </section>
  );
}

function SidebarSkeletonItem({ collapsed }: { collapsed: boolean }) {
  const item = (
    <div
      className={cn(
        "group relative flex h-11 items-center rounded-xl px-3 transition-all duration-200",
        collapsed ? "justify-center px-0" : "justify-start gap-3"
      )}
    >
      <div className="shrink-0">
        <Skeleton className="h-5 w-5 rounded-md bg-white/10" />
      </div>
      {!collapsed && (
        <Skeleton className="h-4 w-24 rounded bg-white/10" />
      )}
    </div>
  );

  if (!collapsed) return item;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        <Skeleton className="h-4 w-16 bg-white/10" />
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarSkeletonSection({ 
  hasTitle, 
  itemCount, 
  collapsed 
}: { 
  hasTitle?: boolean;
  itemCount: number;
  collapsed: boolean;
}) {
  return (
    <section className="space-y-1.5">
      {!collapsed && hasTitle ? (
        <Skeleton className="mx-3 mb-2 h-3 w-16 rounded bg-white/10" />
      ) : null}
      {Array.from({ length: itemCount }).map((_, i) => (
        <SidebarSkeletonItem key={i} collapsed={collapsed} />
      ))}
    </section>
  );
}

function SidebarSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <div>
        <SidebarSkeletonSection itemCount={3} collapsed={collapsed} />
      </div>
      <div>
        <div className="mx-2 mb-7 h-px bg-white/5" />
        <SidebarSkeletonSection hasTitle itemCount={4} collapsed={collapsed} />
      </div>
      <div>
        <div className="mx-2 mb-7 h-px bg-white/5" />
        <SidebarSkeletonSection hasTitle itemCount={3} collapsed={collapsed} />
      </div>
    </>
  );
}

function SidebarDesktop() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const { data: guide, isLoading, error } = useYouTubeGuide();
  


  // Width is expanded if (not collapsed) OR (collapsed AND hovered)
  const isEffectivelyExpanded = !isCollapsed || isHovered;

  // Fallback to hardcoded nav if API fails or returns no data
  const shouldUseFallback = error || (!isLoading && (!guide?.sections || guide.sections.length === 0));
  
  if (shouldUseFallback && process.env.NODE_ENV === "development") {
    console.warn("[Sidebar] API error or empty data, using fallback nav items", error);
  }

  const dynamicSections = useMemo(() => {
    return shouldUseFallback
      ? [
          { title: undefined, items: PRIMARY_NAV },
          { title: "Explore", items: FALLBACK_NAV },
          { title: "Personal", items: PERSONAL_NAV },
        ]
      : guide?.sections
          ?.map(section => ({
            title: section.title ?? undefined,
            items: section.items
              .filter(item => item.title && item.title.trim() !== "")
              .map(item => ({
                href: item.url,
                label: item.title,
                icon: getIcon(item.iconType, item.title),
                thumbnail: item.thumbnail
              }))
          }))
          .filter(section => section.items.length > 0) || [];
  }, [shouldUseFallback, guide]);

  useEffect(() => {
    (window as any).SIDEBAR_LOG = { guide, isLoading, error, dynamicSections, shouldUseFallback };
  }, [guide, isLoading, error, dynamicSections, shouldUseFallback]);

  return (
    <motion.aside
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isEffectivelyExpanded ? DESKTOP_WIDTH_EXPANDED : DESKTOP_WIDTH_COLLAPSED }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 hidden h-screen border-r border-white/10 bg-background/70 backdrop-blur-xl lg:flex lg:flex-col"
      aria-label="Desktop navigation"
    >
      <div className={cn("flex h-16 items-center", !isEffectivelyExpanded ? "justify-center px-2" : "justify-between px-4") }>
        <Link
          href="/"
          className={cn(
            "group flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            !isEffectivelyExpanded ? "justify-center" : "gap-2.5"
          )}
          aria-label="Go to homepage"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
            <svg viewBox="0 0 40 40" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M10 30V10L20 22L30 10V30"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {isEffectivelyExpanded ? <span className="text-base font-semibold tracking-tight">Vidiony</span> : null}
        </Link>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-2 pb-4 pt-3 scrollbar-none" aria-label="Main navigation links">
        {isLoading ? (
          <SidebarSkeleton collapsed={!isEffectivelyExpanded} />
        ) : (
          dynamicSections.map((section, idx) => (
            <div key={idx + (section.title || "main")}>
              {idx > 0 && <div className="mx-2 mb-7 h-px bg-white/5" />}
              <SidebarSection title={section.title} items={section.items} pathname={pathname} collapsed={!isEffectivelyExpanded} />
            </div>
          ))
        )}
      </nav>

      <div className="mt-auto border-t border-white/5 p-2">
        <SidebarSection items={FOOTER_NAV} pathname={pathname} collapsed={!isEffectivelyExpanded} />
      </div>
    </motion.aside>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Mobile bottom navigation"
    >
      <ul className="grid grid-cols-4">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 py-2 text-[11px]"
              >
                <motion.span
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                    active ? "bg-primary/20 text-primary" : "text-foreground/65 group-hover:text-foreground"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </motion.span>
                <span className={cn("font-medium transition-colors", active ? "text-primary" : "text-foreground/65 group-hover:text-foreground")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function useSidebarShortcuts(toggle: () => void, navigate: (path: string) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }

      if (event.key.toLowerCase() === "g") {
        const onSecondKey = (second: KeyboardEvent) => {
          const key = second.key.toLowerCase();
          if (key === "h") navigate("/");
          if (key === "t") navigate("/trending");
          if (key === "s") navigate("/subscriptions");
          if (key === "l") navigate("/library");
          window.removeEventListener("keydown", onSecondKey, true);
        };

        window.addEventListener("keydown", onSecondKey, true);
        window.setTimeout(() => {
          window.removeEventListener("keydown", onSecondKey, true);
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [navigate, toggle]);
}

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const { toggle } = useSidebar();

  useSidebarShortcuts(toggle, (path) => router.push(path));

  return (
    <div className={className}>
      <SidebarDesktop />
      <MobileBottomNav />
    </div>
  );
}

export function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: guide, isLoading, error } = useYouTubeGuide();

  // Fallback to hardcoded nav if API fails or returns no data
  const shouldUseFallback = error || (!isLoading && (!guide?.sections || guide.sections.length === 0));
  
  if (shouldUseFallback && process.env.NODE_ENV === "development") {
    console.warn("[SidebarContent] API error or empty data, using fallback nav items", error);
  }

  const dynamicSections = useMemo(() => {
    return shouldUseFallback
      ? [
          { title: undefined, items: PRIMARY_NAV },
          { title: "Explore", items: FALLBACK_NAV },
          { title: "Personal", items: PERSONAL_NAV },
        ]
      : guide?.sections
          ?.map(section => ({
            title: section.title ?? undefined,
            items: section.items
              .filter(item => item.title && item.title.trim() !== "")
              .map(item => ({
                href: item.url,
                label: item.title,
                icon: getIcon(item.iconType, item.title),
                thumbnail: item.thumbnail
              }))
          }))
          .filter(section => section.items.length > 0) || [];
  }, [shouldUseFallback, guide]);

  return (
    <div className="h-full overflow-y-auto bg-background/95 p-3">
      <div className="mb-3 flex h-12 items-center px-2">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <svg viewBox="0 0 40 40" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M10 30V10L20 22L30 10V30"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Vidiony</span>
        </Link>
      </div>

      <nav className="space-y-6" aria-label="Mobile menu">
        {isLoading ? (
          <SidebarSkeleton collapsed={false} />
        ) : (
          dynamicSections.map((section, idx) => (
            <div key={idx + (section.title || "main")}>
              {idx > 0 && <div className="mx-2 mb-6 h-px bg-white/5" />}
              <SidebarSection title={section.title} items={section.items} pathname={pathname} collapsed={false} onNavigate={onClose} />
            </div>
          ))
        )}
        <div className="mx-2 h-px bg-white/5" />
        <SidebarSection items={FOOTER_NAV} pathname={pathname} collapsed={false} onNavigate={onClose} />
      </nav>
    </div>
  );
}
