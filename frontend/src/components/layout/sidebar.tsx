"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Flame,
  Compass,
  History,
  Clock,
  Heart,
  Video,
  Music,
  Gamepad2,
  Code2,
  Film,
  Brain,
  Settings,
  LogOut,
  Menu,
  Upload,
  ChevronDown,
  X,
  ListVideo,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { usePlayerStore, type QueueItem as QueueItemType } from "@/store/playerStore";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const mainNavSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/explore", label: "Explore", icon: Compass },
      { href: "/trending", label: "Trending", icon: Flame },
    ],
  },
];

// These sections are only shown when user is logged in
const authRequiredSections: NavSection[] = [
  {
    title: "Library",
    items: [
      { href: "/history", label: "Watch History", icon: History },
      { href: "/watch-later", label: "Watch Later", icon: Clock },
      { href: "/liked-videos", label: "Liked Videos", icon: Heart },
      { href: "/my-videos", label: "My Videos", icon: Video },
    ],
  },
  {
    title: "Subscriptions",
    items: [{ href: "/subscriptions", label: "Subscriptions", icon: Heart }],
  },
];

const categoryItems: NavItem[] = [
  { href: "/category/music", label: "Music", icon: Music },
  { href: "/category/gaming", label: "Gaming", icon: Gamepad2 },
  { href: "/category/programming", label: "Coding", icon: Code2 },
  { href: "/category/film", label: "Films & TV", icon: Film },
  { href: "/category/ai", label: "AI & Tech", icon: Brain },
];

function NavItemComponent({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed?: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg transition-all duration-200",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
        )}
      >
        <item.icon className={cn("h-[1.15rem] w-[1.15rem]", collapsed ? "h-5 w-5" : "")} />
        {isActive && <span className="absolute -left-3 h-1.5 w-1.5 rounded-full bg-primary" />}
      </span>
      {!collapsed && (
        <span className="flex flex-1 items-center justify-between">
          <span className="truncate text-[13px] font-medium">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
              {item.badge}
            </Badge>
          )}
        </span>
      )}
    </Link>
  );
}

// Queue item component for sidebar
function QueueNavItem({
  item,
  index,
  collapsed,
  isPlaying,
}: {
  item: QueueItemType;
  index: number;
  collapsed?: boolean;
  isPlaying: boolean;
}) {
  const { removeFromQueue, playFromQueue } = usePlayerStore();
  const router = useRouter();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const queueItem = playFromQueue(index);
    if (queueItem) {
      router.push(`/watch/${queueItem.videoId}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromQueue(item.videoId);
  };

  if (collapsed) {
    return (
      <div
        className="group relative flex cursor-pointer items-center justify-center rounded-lg p-2 hover:bg-accent"
        title={item.title}
      >
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent",
        isPlaying && "bg-primary/10"
      )}
    >
      <div className="h-10 w-[60px] shrink-0 overflow-hidden rounded bg-muted">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("truncate text-[12px] font-medium", isPlaying ? "text-primary" : "text-foreground")}>
          {item.title || "Untitled"}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {item.channelName || "Unknown channel"}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={handlePlay}
          className="rounded p-1 hover:bg-background/80"
          title="Play"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleRemove}
          className="rounded p-1 hover:bg-background/80"
          title="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { queue, currentQueueIndex, clearQueue } = usePlayerStore();

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() ?? "U";

  const handleLogout = async () => {
    await logout();
    router.push("/");
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border/40",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5" onClick={handleLinkClick}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-md shadow-primary/20">
              <svg viewBox="0 0 40 40" className="h-4 w-4" fill="none">
                <path d="M10 30V10L20 22L30 10V30" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-foreground">Vidion</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-md bg-primary" onClick={handleLinkClick}>
            <svg viewBox="0 0 40 40" className="h-4 w-4" fill="none">
              <path d="M10 30V10L20 22L30 10V30" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      <ScrollArea className="flex-1 py-3">
        <div className={cn("space-y-4", collapsed ? "px-2" : "px-3")}>
          {/* Public navigation - shown to everyone */}
          {mainNavSections.map((section, sectionIndex) => (
            <div key={section.title || sectionIndex}>
              {!collapsed && section.title && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Auth required sections - only shown when logged in */}
          {isAuthenticated && authRequiredSections.map((section, sectionIndex) => (
            <div key={section.title || sectionIndex}>
              {!collapsed && section.title && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Queue Section - Only show when queue has items */}
          {queue.length > 0 && (
            <>
              {!collapsed && (
                <div className="flex items-center justify-between px-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Queue ({queue.length})
                  </p>
                  <button
                    onClick={() => clearQueue()}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              )}
              <div className={cn("space-y-0.5", collapsed ? "" : "px-2")}>
                {queue.slice(0, 5).map((item, index) => (
                  <QueueNavItem
                    key={item.videoId}
                    item={item}
                    index={index}
                    collapsed={collapsed}
                    isPlaying={currentQueueIndex === index}
                  />
                ))}
                {queue.length > 5 && !collapsed && (
                  <p className="px-3 py-1 text-[10px] text-muted-foreground">
                    +{queue.length - 5} more in queue
                  </p>
                )}
              </div>
              <Separator className="my-3 bg-border/40" />
            </>
          )}

          {!collapsed && (
            <>
              <Separator className="my-3 bg-border/40" />
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Categories
              </p>
            </>
          )}
          <div className="space-y-0.5">
            {categoryItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={pathname === item.href || (pathname.startsWith("/category") && pathname.includes(item.label.toLowerCase()))}
              />
            ))}
          </div>

          {/* Queue section - collapsed indicator */}
          {queue.length > 0 && collapsed && (
            <div className="mb-2 flex justify-center">
              <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-accent" title={`Queue (${queue.length})`}>
                <ListVideo className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {queue.length > 9 ? "9+" : queue.length}
                </span>
              </div>
            </div>
          )}

          <Separator className="my-3 bg-border/40" />

          {!collapsed ? (
            <div className="space-y-0.5">
              <Link href="/upload" onClick={handleLinkClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <Upload className="h-[1.15rem] w-[1.15rem]" />
                <span className="text-[13px] font-medium">Upload</span>
              </Link>
              <Link href="/settings" onClick={handleLinkClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <Settings className="h-[1.15rem] w-[1.15rem]" />
                <span className="text-[13px] font-medium">Settings</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              <Link href="/upload" onClick={handleLinkClick} className="flex items-center justify-center rounded-lg py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground" title="Upload">
                <Upload className="h-5 w-5" />
              </Link>
              <Link href="/settings" onClick={handleLinkClick} className="flex items-center justify-center rounded-lg py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground" title="Settings">
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          )}

          {isAuthenticated ? (
            <div className="pt-2">
              {!collapsed && (
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Account</span>
                </div>
              )}
              <button onClick={handleLogout} className={cn("flex w-full items-center gap-3 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground", collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2")} title={collapsed ? "Sign Out" : undefined}>
                <LogOut className="h-[1.15rem] w-[1.15rem] shrink-0" />
                {!collapsed && <span className="text-[13px] font-medium">Sign Out</span>}
              </button>
            </div>
          ) : (
            !collapsed && (
              <div className="rounded-lg bg-accent/50 p-4">
                <p className="mb-3 text-[13px] text-muted-foreground">Sign in to access your personalized library</p>
                <Button asChild className="w-full" size="sm">
                  <Link href="/auth/login" onClick={handleLinkClick}>Sign In</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {isAuthenticated && !collapsed && (
        <div className="border-t border-border/40 p-3">
          <button onClick={() => { router.push("/settings"); onClose?.(); }} className="flex w-full items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar ?? ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start overflow-hidden">
              <p className="truncate text-[13px] font-medium text-foreground">{user?.name ?? user?.username}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { isCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Mobile: Don't render anything here, Navbar handles it
  // Desktop only
  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 lg:block",
          isCollapsed ? "w-[68px]" : "w-[240px]",
          className
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>
    </>
  );
}

export { SidebarContent };
