"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Menu,
  User,
  LogIn,
  Library,
  X,
  ArrowLeft,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";

// ── Recent searches (persisted in localStorage) ─────────────────────────
function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("vidion-searches") ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}

function saveSearch(query: string) {
  if (typeof window === "undefined") return;
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem("vidion-searches", JSON.stringify(searches.slice(0, 6)));
}

// ── Trending suggestions (static for now) ───────────────────────────────
const TRENDING_SUGGESTIONS = [
  "React 19 new features",
  "Rust vs Go 2025",
  "AI coding agents",
  "Next.js 16 app router",
  "system design interview",
  "kubernetes tutorial",
];

// ═════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═════════════════════════════════════════════════════════════════════════
export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recentSearches = getRecentSearches();
  const { isAuthenticated, user, logout } = useAuth();

  const showDropdown = focused && query.length === 0;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    saveSearch(q);
    setQuery(q);
    setFocused(false);
    setMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur-xl">
      {/* ── Main bar ────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-4 px-4 lg:px-6">
        {/* Left — hamburger + logo */}
        <div className="flex shrink-0 items-center gap-2">
          {mounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/50 hover:text-white lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0f0f0f] border-white/10">
                <nav className="mt-8 space-y-1">
                  {["Home", "Trending", "Subscriptions", "Library"].map((item) => (
                    <Link
                      key={item}
                      href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <Logo size="md" />
        </div>

        {/* Center — search bar (desktop) */}
        <div className="relative hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="flex">
              {/* Input */}
              <div
                className={`relative flex flex-1 items-center overflow-hidden rounded-l-full border transition-all duration-300 ${
                  focused
                    ? "border-violet-500/60 bg-[#181818] shadow-lg shadow-violet-500/5"
                    : "border-white/[0.08] bg-[#121212] hover:border-white/[0.15]"
                }`}
              >
                {focused && (
                  <Search className="ml-4 h-4 w-4 shrink-0 text-white/40" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  placeholder="Search videos, channels, topics..."
                  className={`h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 ${
                    focused ? "pl-3 pr-2" : "pl-5 pr-2"
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />

                {/* Clear button */}
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="flex h-10 w-16 shrink-0 items-center justify-center rounded-r-full border border-l-0 border-white/[0.08] bg-[#222] text-white/50 transition-all hover:bg-[#333] hover:text-white active:bg-[#444]"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            </form>

            {/* ── Search dropdown ─────────────────────────────────────── */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a1a1a] py-3 shadow-2xl shadow-black/60"
              >
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-2">
                    <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/25">
                      Recent
                    </p>
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider */}
                {recentSearches.length > 0 && (
                  <div className="mx-4 my-1 h-px bg-white/[0.06]" />
                )}

                {/* Trending suggestions */}
                <div>
                  <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/25">
                    Trending
                  </p>
                  {TRENDING_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearch(s)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Mobile search trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/50 hover:text-white md:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* If user is authenticated show avatar dropdown, otherwise show Sign In button */}
          {isAuthenticated ? (
            mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-white/10 transition hover:ring-violet-500/40">
                      <AvatarImage src={user?.avatar ?? ""} />
                      <AvatarFallback className="bg-violet-600 text-xs font-bold text-white">{user?.name?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
                  <DropdownMenuItem className="text-white/80 focus:text-white focus:bg-white/5">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white/80 focus:text-white focus:bg-white/5">
                    <Library className="mr-2 h-4 w-4" />
                    My Videos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={async () => { await logout(); router.push('/'); }} className="text-white/80 focus:text-white focus:bg-white/5">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-white/10 transition hover:ring-violet-500/40">
                  <AvatarImage src={user?.avatar ?? ""} />
                  <AvatarFallback className="bg-violet-600 text-xs font-bold text-white">{user?.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
              </Button>
            )
          ) : (
            <Button asChild variant="ghost" size="sm" className="ml-2 hidden sm:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Mobile fullscreen search ──────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0f0f0f]">
          {/* Top bar */}
          <div className="flex h-14 items-center gap-3 border-b border-white/[0.06] px-3">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
              <div className="relative flex flex-1 items-center rounded-full border border-white/[0.1] bg-[#181818]">
                <Search className="ml-3 h-4 w-4 shrink-0 text-white/30" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="h-10 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/25"
                  autoComplete="off"
                />
                {query.length > 0 && (
                  <button type="button" onClick={clearSearch} className="mr-2 text-white/40">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Mobile suggestions */}
          <div className="p-4 space-y-4">
            {recentSearches.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/25">Recent</p>
                <div className="space-y-1">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearch(s)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
                    >
                      <Clock className="h-4 w-4 text-white/30" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/25">Trending</p>
              <div className="space-y-1">
                {TRENDING_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
                  >
                    <TrendingUp className="h-4 w-4 text-violet-400/60" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
