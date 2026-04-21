"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { 
  User, Shield, Paintbrush, Languages, PlayCircle, 
  Lock, Bell, Link as LinkIcon 
} from "lucide-react";

const NAV_ITEMS = [
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/settings/profile", icon: User },
      { title: "Security", href: "/settings/security", icon: Shield },
      { title: "Password", href: "/settings/password", icon: Lock },
    ]
  },
  {
    title: "Preferences",
    items: [
      { title: "Appearance", href: "/settings/appearance", icon: Paintbrush },
      { title: "Language", href: "/settings/language", icon: Languages },
      { title: "Playback", href: "/settings/playback", icon: PlayCircle },
    ]
  },
  {
    title: "Data & Privacy",
    items: [
      { title: "Privacy", href: "/settings/privacy", icon: Lock },
    ]
  },
  {
    title: "Connections",
    items: [
      { title: "Connected Accounts", href: "/settings/accounts", icon: LinkIcon },
      { title: "Notifications", href: "/settings/notifications", icon: Bell },
    ]
  }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <div className={cn("container mx-auto py-12 px-4 transition-all duration-300", sidebarPadding)}>
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="col-span-1">
            <nav className="space-y-6">
              {NAV_ITEMS.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
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
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive 
                              ? "bg-white/10 text-white" 
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
          
          <main className="col-span-1 md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
