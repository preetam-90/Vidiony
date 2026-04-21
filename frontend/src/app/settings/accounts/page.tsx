"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Link2, Unlink, Youtube, CheckCircle, XCircle } from "lucide-react";

export default function AccountsSettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeChannelName, setYoutubeChannelName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchYoutubeStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/auth/me", { credentials: "include" });
      const data = await res.json();
      const account = data?.user;
      setYoutubeConnected(!!account?.youtubeChannelId);
      setYoutubeChannelName(account?.youtubeHandle || null);
    } catch {
      setYoutubeConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYoutubeStatus();
  }, []);

  const handleConnectYoutube = () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

  const handleDisconnectYoutube = () => {
    toast.info("YouTube disconnect is no longer a separate action. Sign out to end session.");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4", sidebarPadding)}>
        <h1 className="text-3xl font-bold mb-8">Connected Accounts</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-6 sticky top-8">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Connected
                </h3>
                <div className="space-y-1">
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                    <Link2 className="w-4 h-4" />
                    Connected Accounts
                  </a>
                </div>
              </div>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 space-y-6">
              <div className="p-6 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <Youtube className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">YouTube</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your YouTube account to like, comment, and subscribe
                    </p>
                  </div>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : youtubeConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {youtubeConnected && youtubeChannelName && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-sm text-green-400">
                      Connected as {youtubeChannelName}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  {youtubeConnected ? (
                    <Button
                      variant="outline"
                      onClick={handleDisconnectYoutube}
                      className="gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
                    >
                      <Unlink className="w-4 h-4" />
                      Disconnect YouTube
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnectYoutube}
                      className="gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <Link2 className="w-4 h-4" />
                      Connect YouTube
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/20">
                <h4 className="font-medium mb-2">Why connect YouTube?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Like and dislike videos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Comment on videos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Subscribe to channels
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Access your YouTube library
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
