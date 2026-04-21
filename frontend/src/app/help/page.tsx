import Link from "next/link";
import { Metadata } from "next";
import { 
  Search, Upload, Play, MessageCircle, ThumbsUp, User, 
  Settings, Shield, Video, CreditCard, Mail, ChevronRight,
  HelpCircle, Book, MessageSquare, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Help Center - Vidiony",
  description: "Get help with Vidiony -FAQs, guides, and support",
};

const helpCategories = [
  {
    icon: User,
    title: "Account & Profile",
    description: "Managing your account, profile settings, password",
    articles: [
      { title: "How to create an account", slug: "create-account" },
      { title: "Changing your username", slug: "change-username" },
      { title: "Resetting your password", slug: "reset-password" },
      { title: "Profile visibility settings", slug: "profile-visibility" },
    ],
  },
  {
    icon: Upload,
    title: "Uploading Videos",
    description: "Upload, edit, and publish your videos",
    articles: [
      { title: "Upload your first video", slug: "upload-video" },
      { title: "Video format requirements", slug: "video-formats" },
      { title: "Adding thumbnails", slug: "thumbnails" },
      { title: "Video descriptions & tags", slug: "descriptions-tags" },
    ],
  },
  {
    icon: Play,
    title: "Watching Videos",
    description: "Playback, quality, and viewing features",
    articles: [
      { title: "Changing video quality", slug: "video-quality" },
      { title: "Using the mini player", slug: "mini-player" },
      { title: "Caption settings", slug: "captions" },
      { title: "Playback speed control", slug: "playback-speed" },
    ],
  },
  {
    icon: ThumbsUp,
    title: "Interactions",
    description: "Likes, comments, and community features",
    articles: [
      { title: "Liking and disliking videos", slug: "likes" },
      { title: "Leaving comments", slug: "comments" },
      { title: "Subscribing to channels", slug: "subscriptions" },
      { title: "Creating playlists", slug: "playlists" },
    ],
  },
  {
    icon: Settings,
    title: "Settings & Preferences",
    description: "Customize your Vidiony experience",
    articles: [
      { title: "Notification settings", slug: "notifications" },
      { title: "Privacy controls", slug: "privacy-settings" },
      { title: "Language preferences", slug: "language" },
      { title: "Playback settings", slug: "playback-settings" },
    ],
  },
  {
    icon: Shield,
    title: "Safety & Privacy",
    description: "Staying safe and protecting your data",
    articles: [
      { title: "Reporting inappropriate content", slug: "report-content" },
      { title: "Blocked users", slug: "blocked-users" },
      { title: "Two-factor authentication", slug: "2fa" },
      { title: "Data deletion requests", slug: "delete-data" },
    ],
  },
];

const faqs = [
  {
    question: "How do I upload a video?",
    answer: "Click the upload button in the navigation or visit /upload. Select your video file, add a title and description, choose a thumbnail, and click publish. Your video will be available within a few minutes.",
  },
  {
    question: "What video formats are supported?",
    answer: "We support MP4, WebM, MOV, and AVI formats. Maximum file size is 10GB. For best quality, upload in 1080p or higher using H.264 encoding.",
  },
  {
    question: "How do I change my profile picture?",
    answer: "Go to Settings > Profile. Click on your avatar and select a new image from your device or use a Gravatar linked to your email.",
  },
  {
    question: "Can I download my videos?",
    answer: "Yes, go to Video Manager > Your Videos. Click the more options (⋮) on any video and select Download.",
  },
  {
    question: "How do I report a video for harassment?",
    answer: "Click the three dots below any video > Report. Select the reason and provide additional details. Our team reviews all reports within 24 hours.",
  },
  {
    question: "Is Vidiony free to use?",
    answer: "Yes, Vidiony is completely free for viewers and creators. We offer optional premium features for supporters.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">How can we help?</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Search our knowledge base or browse categories below
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:bg-white/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">Browse by Topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpCategories.map((category) => (
              <Link
                key={category.title}
                href={`/help/${category.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <category.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <div className="flex items-center text-sm text-violet-400 group-hover:text-violet-300">
                  <span>{category.articles.length} articles</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/help/contact"
            className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground">Can't find what you need? We're here to help.</p>
          </Link>
          
          <Link
            href="/community"
            className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Community Forum</h3>
            <p className="text-sm text-muted-foreground">Connect with other Vidiony users.</p>
          </Link>
          
          <Link
            href="/creator-guide"
            className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-4">
              <Book className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Creator Guide</h3>
            <p className="text-sm text-muted-foreground">Tips for building your channel.</p>
          </Link>
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-white/10 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
              <p className="text-muted-foreground">Our support team typically responds within 24 hours.</p>
            </div>
            <Button asChild>
              <Link href="mailto:support@vidiony.com">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}