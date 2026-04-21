"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Save, Mail, Bell, Users, MessageSquare, Video } from "lucide-react";

export default function NotificationsSettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(true);
  const [newSubs, setNewSubs] = useState(true);
  const [comments, setComments] = useState(true);
  const [uploads, setUploads] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vidion-notifications");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setEmail(data.email ?? true);
        setPush(data.push ?? true);
        setNewSubs(data.newSubs ?? true);
        setComments(data.comments ?? true);
        setUploads(data.uploads ?? true);
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem(
        "vidion-notifications",
        JSON.stringify({ email, push, newSubs, comments, uploads })
      );
      toast.success("Notification settings saved");
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
        <h1 className="text-3xl font-bold mb-8">Notifications</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-6 sticky top-8">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Notifications
                </h3>
                <div className="space-y-1">
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </a>
                </div>
              </div>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-xs text-muted-foreground">Receive notifications via email</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmail(!email)}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", email ? "bg-primary" : "bg-white/20")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", email ? "left-7" : "left-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Push Notifications</div>
                        <div className="text-xs text-muted-foreground">Receive push notifications</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setPush(!push)}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", push ? "bg-primary" : "bg-white/20")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", push ? "left-7" : "left-1")} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Activity Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">New Subscribers</div>
                        <div className="text-xs text-muted-foreground">When someone subscribes to you</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewSubs(!newSubs)}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", newSubs ? "bg-primary" : "bg-white/20")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", newSubs ? "left-7" : "left-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Comment Replies</div>
                        <div className="text-xs text-muted-foreground">When someone replies to your comment</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setComments(!comments)}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", comments ? "bg-primary" : "bg-white/20")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", comments ? "left-7" : "left-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Video Uploads</div>
                        <div className="text-xs text-muted-foreground">From subscribed channels</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploads(!uploads)}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", uploads ? "bg-primary" : "bg-white/20")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", uploads ? "left-7" : "left-1")} />
                    </button>
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