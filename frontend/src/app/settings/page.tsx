"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { User, Lock, Bell, Palette, Globe, Play, Eye, Link2, Camera } from "lucide-react";

const settingsSections = [
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/settings/profile", icon: User },
      { label: "Password", href: "/settings/password", icon: Lock },
      { label: "Security", href: "/settings/security", icon: Shield02 },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Appearance", href: "/settings/appearance", icon: Palette },
      { label: "Language", href: "/settings/language", icon: Globe },
      { label: "Playback", href: "/settings/playback", icon: Play },
    ],
  },
  {
    title: "Privacy & Data",
    items: [
      { label: "Privacy", href: "/settings/privacy", icon: Eye },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Connected",
    items: [
      { label: "Connected Accounts", href: "/settings/accounts", icon: Link2 },
    ],
  },
];

// Custom Shield icon since it's not in lucide-react
function Shield02({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function SettingsIndexPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4", sidebarPadding)}>
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-6">
              {settingsSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 md:p-12">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold mb-4">Welcome to Settings</h2>
                <p className="text-muted-foreground mb-8">
                  Choose a category from the navigation to manage your account settings.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settingsSections[0].items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">
                            Manage your {item.label.toLowerCase()}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}