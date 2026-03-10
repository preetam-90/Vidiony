import Link from "next/link";

export default function SettingsIndexPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3">
          <nav className="rounded-xl border border-white/10 bg-card/95 p-4">
            <Link href="/settings/profile" className="block py-2 px-3 rounded hover:bg-white/5">Profile</Link>
            <Link href="/settings/security" className="block py-2 px-3 rounded hover:bg-white/5">Security</Link>
            <Link href="/settings/notifications" className="block py-2 px-3 rounded hover:bg-white/5">Notifications</Link>
          </nav>
        </div>
        <div className="col-span-2 rounded-xl border border-white/10 bg-card/95 p-6">
          <h2 className="text-lg font-semibold">Welcome to settings</h2>
          <p className="text-sm text-muted-foreground mt-2">Choose a category from the left to manage your account.</p>
        </div>
      </div>
    </div>
  );
}
