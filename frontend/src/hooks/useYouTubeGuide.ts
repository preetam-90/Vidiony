import { useQuery } from "@tanstack/react-query";
import { api, type GuideData } from "@/lib/api";
import { 
  Home, 
  TrendingUp, 
  PlaySquare, 
  Library, 
  History, 
  ThumbsUp, 
  Clock, 
  Music, 
  Gamepad2, 
  Film, 
  Newspaper,
  Compass,
  PlayCircle,
  Users,
  Layout,
  Flame,
  Gamepad,
  Trophy,
  ShoppingBag,
  Heart,
  Video,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "WHAT_TO_WATCH": Home,
  "TRENDING": Flame,
  "SUBSCRIPTIONS": Users,
  "VIDEO_LIBRARY_DEFAULT": Library,
  "HISTORY": History,
  "WATCH_LATER": Clock,
  "LIKE": ThumbsUp,
  "PLAYLISTS": Layout,
  "EXPLORE": Compass,
  "MUSIC": Music,
  "GAMING": Gamepad2,
  "SPORTS": Trophy,
  "MOVIES": Film,
  "NEWS": Newspaper,
  "SHOPPING": ShoppingBag,
  "LEARNING": Layout,
  "FASHION_AND_BEAUTY": Heart,
  "Home": Home,
  "Trending": Flame,
  "Subscriptions": Users,
  "Library": Library,
  "History": History,
  "Music": Music,
  "Gaming": Gamepad2,
  "Movies": Film,
  "News": Newspaper,
  "TAB_HOME_CAIRO": Home,
  "TAB_SHORTS_CAIRO": Video,
  "TAB_SUBSCRIPTIONS_CAIRO": Users,
  "ACCOUNT_CIRCLE_CAIRO": Library,
  "WATCH_HISTORY_CAIRO": History,
  "SHOPPING_BAG_CAIRO": ShoppingBag,
  "MUSIC_CAIRO": Music,
  "CLAPPERBOARD_CAIRO": Film,
  "YOUTUBE_ROUND": PlayCircle,
  "YOUTUBE_MUSIC": Music,
  "YOUTUBE_KIDS_ROUND": Layout,
  "FLAG_CAIRO": Bell,
};

export function useYouTubeGuide() {
  return useQuery<GuideData>({
    queryKey: ["youtube-guide"],
    queryFn: () => api.getGuide(),
    staleTime: 5 * 60 * 1000,
  });
}

export function getIcon(iconType: string, title: string): LucideIcon {
  return ICON_MAP[iconType] || ICON_MAP[title] || PlayCircle;
}
