"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string | null;
}

export default function SecuritySettingsPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.auth.getSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const deviceFromUA = (ua?: string | null) => {
    if (!ua) return "Unknown device";
    if (/mobile/i.test(ua)) return "Mobile";
    if (/tablet/i.test(ua)) return "Tablet";
    if (/Windows|Macintosh|Linux/.test(ua)) return "Desktop";
    return ua.split(" ").slice(0,3).join(" ");
  };

  const handleRevoke = async (id: string) => {
    setActionLoading(id);
    try {
      await api.auth.revokeSession(id);
      await fetchSessions();
    } catch (err) {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    setActionLoading("all");
    try {
      await api.auth.revokeAllSessions();
      // After revoking all, the current session is also cleared; redirect to home
      window.location.href = "/";
    } catch (err) {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4", sidebarPadding)}>
        <h1 className="text-2xl font-semibold mb-6">Security</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="col-span-1">
          <nav className="rounded-xl border border-white/10 bg-card/95 p-4">
            <a className="block py-2 px-3 rounded bg-muted/5 font-medium">Active Sessions</a>
            <a className="block py-2 px-3 rounded hover:bg-white/5">Password</a>
            <a className="block py-2 px-3 rounded hover:bg-white/5">Two-Factor</a>
          </nav>
        </aside>
        <main className="col-span-2">
          <div className="rounded-xl border border-white/10 bg-card/95 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Active Sessions</h2>
                <p className="text-sm text-muted-foreground">Manage devices that have access to your Vidion account.</p>
              </div>
              <div>
                <Button variant="destructive" onClick={handleRevokeAll} disabled={actionLoading === "all"}>
                  {actionLoading === "all" ? "Signing out…" : "Sign out of all sessions"}
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions found.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 p-4">
                    <div>
                      <div className="text-sm font-medium">{deviceFromUA(s.userAgent)}</div>
                      <div className="text-xs text-muted-foreground">{s.userAgent ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground mt-2">IP: {s.ipAddress ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Last active</div>
                      <div className="text-xs text-muted-foreground">{s.lastUsedAt ? formatDistanceToNow(new Date(s.lastUsedAt), { addSuffix: true }) : formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</div>
                      <div className="mt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleRevoke(s.id)} disabled={!!actionLoading}>
                          {actionLoading === s.id ? "Revoking…" : "Revoke"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
