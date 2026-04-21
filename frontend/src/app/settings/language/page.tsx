"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Save, Globe } from "lucide-react";

interface Language {
  code: string;
  name: string;
  native: string;
}

const languages: Language[] = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ar", name: "Arabic", native: "العربية" },
];

export default function LanguageSettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [contentLang, setContentLang] = useState("en");
  const [playbackLang, setPlaybackLang] = useState("en");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vidion-language");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContentLang(data.contentLang || "en");
        setPlaybackLang(data.playbackLang || "en");
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem(
        "vidion-language",
        JSON.stringify({ contentLang, playbackLang })
      );
      toast.success("Language settings saved");
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
        <h1 className="text-3xl font-bold mb-8">Language</h1>

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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </a>
                  <a
                    href="/settings/appearance"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    Appearance
                  </a>
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                    <Globe className="w-4 h-4" />
                    Language
                  </a>
                  <a
                    href="/settings/playback"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Playback
                  </a>
                </div>
              </div>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 space-y-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Content Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Language for menus and descriptions
                  </p>
                </div>
                <select
                  value={contentLang}
                  onChange={(e) => setContentLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Playback Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Preferred language for video captions
                  </p>
                </div>
                <select
                  value={playbackLang}
                  onChange={(e) => setPlaybackLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
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