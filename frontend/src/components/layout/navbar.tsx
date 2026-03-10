"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, Menu, User, LogIn,
  Home, TrendingUp, Clock, Library, LogOut,
  Youtube, ChevronDown, History, BookMarked,
  CheckCircle, X, Settings,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/subscriptions", label: "Subscriptions", icon: Clock },
  { href: "/library", label: "Library", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [ytStatus, setYtStatus] = useState<{ connected: boolean; channelName: string | null } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Pre-fill search from URL query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const q = new URLSearchParams(window.location.search).get("q") ?? "";
      if (window.location.pathname === "/search") setSearchQuery(q);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);

  // Fetch YouTube status when user changes
  useEffect(() => {
    if (isAuthenticated) {
      api.auth.youtubeStatus().then(setYtStatus).catch(() => {});
    } else {
      setYtStatus(null);
    }
  }, [isAuthenticated]);

  // Autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { suggestions: s } = await api.searchSuggestions(searchQuery);
        setSuggestions(s.slice(0, 8));
      } catch { setSuggestions([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const pickSuggestion = (s: string) => {
    setSearchQuery(s);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(s)}`);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleYouTubeConnect = async () => {
    try {
      const { url } = await api.auth.youtubeConnectUrl();
      window.location.href = url;
    } catch {}
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Search with autocomplete */}
        <div ref={searchRef} className="relative hidden flex-1 md:flex md:max-w-md md:px-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full rounded-full bg-secondary/50 pl-10 pr-4 placeholder:text-muted-foreground focus:bg-secondary/80"
                autoComplete="off"
              />
            </div>
          </form>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 z-50 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                  onClick={() => pickSuggestion(s)}
                >
                  <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar ?? ""} />
                      <AvatarFallback className="bg-violet-600/30 text-violet-300 text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-white/10 bg-card/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{user?.name ?? user?.username}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />

                  {/* YouTube connection status */}
                  {ytStatus?.connected ? (
                    <DropdownMenuItem className="gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="text-xs font-medium">YouTube Connected</div>
                        {ytStatus.channelName && (
                          <div className="text-xs text-muted-foreground">{ytStatus.channelName}</div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="gap-2 text-muted-foreground" onClick={handleYouTubeConnect}>
                      <Youtube className="h-4 w-4 text-red-500" />
                      Connect YouTube account
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem asChild>
                    <Link href="/library" className="gap-2">
                      <History className="h-4 w-4" /> Watch History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscriptions" className="gap-2">
                      <BookMarked className="h-4 w-4" /> Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/security" className="gap-2">
                      <Settings className="h-4 w-4" /> Security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link href="/search"><Search className="h-5 w-5" /></Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/10 bg-card/95 backdrop-blur-xl">
              <div className="flex flex-col gap-1 pt-4">
                {isAuthenticated ? (
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar ?? ""} />
                      <AvatarFallback className="bg-violet-600/30 text-violet-300 text-sm font-bold">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm">{user?.name ?? user?.username}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex flex-col gap-2">
                    <Button asChild><Link href="/auth/login"><LogIn className="mr-2 h-4 w-4" /> Sign In</Link></Button>
                    <Button variant="outline" asChild><Link href="/auth/register">Create Account</Link></Button>
                  </div>
                )}

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                      <Icon className="h-4 w-4" /> {link.label}
                    </Link>
                  );
                })}

                {isAuthenticated && (
                  <>
                    <div className="my-2 h-px bg-white/10" />
                    {ytStatus && !ytStatus.connected && (
                      <button onClick={handleYouTubeConnect}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                        <Youtube className="h-4 w-4 text-red-500" /> Connect YouTube
                      </button>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
