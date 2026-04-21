"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Save, Play, Subtitles, Gauge } from "lucide-react";

type VideoQuality = "auto" | "720p" | "1080p" | "1440p" | "2160p";
type PlaybackSpeed = "0.5" | "0.75" | "1" | "1.25" | "1.5" | "2";

export default function PlaybackSettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [autoPlay, setAutoPlay] = useState(true);
  const [quality, setQuality] = useState<VideoQuality>("auto");
  const [captions, setCaptions] = useState(true);
  const [speed, setSpeed] = useState<PlaybackSpeed>("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vidion-playback");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAutoPlay(data.autoPlay ?? true);
        setQuality(data.quality || "auto");
        setCaptions(data.captions ?? true);
        setSpeed(data.speed || "1");
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem(
        "vidion-playback",
        JSON.stringify({ autoPlay, quality, captions, speed })
      );
      toast.success("Playback settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const qualityOptions: { value: VideoQuality; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "720p", label: "720p" },
    { value: "1080p", label: "1080p" },
    { value: "1440p", label: "1440p (2K)" },
    { value: "2160p", label: "2160p (4K)" },
  ];

  const speedOptions: { value: PlaybackSpeed; label: string }[] = [
    { value: "0.5", label: "0.5x" },
    { value: "0.75", label: "0.75x" },
    { value: "1", label: "1x (Normal)" },
    { value: "1.25", label: "1.25x" },
    { value: "1.5", label: "1.5x" },
    { value: "2", label: "2x" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4", sidebarPadding)}>
        <h1 className="text-3xl font-bold mb-8">Playback</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-6 sticky top-8">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Preferences
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
                    href="/settings/appearance"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    Appearance
                  </a>
                  <a
                    href="/settings/language"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M2 12h22M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Language
                  </a>
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                    <Play className="w-4 h-4" />
                    Playback
                  </a>
                </div>
              </div>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 space-y-8">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Play className="w-4 h-4" />Auto-play Videos
                  </div>
                  <div className="text-xs text-muted-foreground">Automatically play next video</div>
                </div>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative", autoPlay ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", autoPlay ? "left-7" : "left-1")} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />Default Quality
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {qualityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQuality(opt.value)}
                        className={cn("py-2 px-3 rounded-lg text-sm border transition-all", quality === opt.value ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Subtitles className="w-4 h-4" />Show Captions
                  </div>
                  <div className="text-xs text-muted-foreground">Display subtitles by default</div>
                </div>
                <button
                  onClick={() => setCaptions(!captions)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative", captions ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", captions ? "left-7" : "left-1")} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Default Playback Speed</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {speedOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSpeed(opt.value)}
                        className={cn("py-2 px-2 rounded-lg text-sm border transition-all", speed === opt.value ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
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