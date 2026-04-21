"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Save, Eye, User, History, Heart } from "lucide-react";

export default function PrivacySettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [showHistory, setShowHistory] = useState(true);
  const [showLiked, setShowLiked] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vidion-privacy");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProfileVisibility(data.profileVisibility || "public");
        setShowHistory(data.showHistory ?? true);
        setShowLiked(data.showLiked ?? true);
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem(
        "vidion-privacy",
        JSON.stringify({ profileVisibility, showHistory, showLiked })
      );
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4", sidebarPadding)}>
        <h1 className="text-3xl font-bold mb-8">Privacy</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-6 sticky top-8">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Privacy & Data
                </h3>
                <div className="space-y-1">
                  <a
                    href="/settings/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </a>
                  <a
                    href="/settings/password"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Password
                  </a>
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                    <Eye className="w-4 h-4" />
                    Privacy
                  </a>
                </div>
              </div>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />Profile Visibility
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setProfileVisibility("public")}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        profileVisibility === "public"
                          ? "border-primary bg-primary/10"
                          : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can view your profile</div>
                    </button>
                    <button
                      onClick={() => setProfileVisibility("private")}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        profileVisibility === "private"
                          ? "border-primary bg-primary/10"
                          : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can view your profile</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <History className="w-4 h-4" />Show Watch History
                  </div>
                  <div className="text-xs text-muted-foreground">Allow others to see your watch history</div>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative", showHistory ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", showHistory ? "left-7" : "left-1")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4" />Show Liked Videos
                  </div>
                  <div className="text-xs text-muted-foreground">Allow others to see your liked videos</div>
                </div>
                <button
                  onClick={() => setShowLiked(!showLiked)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative", showLiked ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", showLiked ? "left-7" : "left-1")} />
                </button>
              </div>

              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}