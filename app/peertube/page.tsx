'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Globe, 
  Search, 
  Play, 
  Clock, 
  Eye, 
  ThumbsUp, 
  MessageCircle,
  Settings,
  RefreshCw,
  ChevronRight,
  Video,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PeerTubeVideo {
  id: number;
  uuid: string;
  name: string;
  thumbnailPath?: string;
  previewPath?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  embedUrl: string;
  description: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  duration: number;
  publishedAt: string;
  account: {
    name: string;
    displayName: string;
    avatarUrl?: string;
    avatar?: string;
  };
  channel: {
    id: number;
    name: string;
    displayName: string;
    avatar?: string;
  };
}

function getThumbnailUrl(video: PeerTubeVideo, instanceUrl: string): string {
  if (!instanceUrl) return '/placeholder.svg?height=240&width=400';
  
  try {
    let url = '';
    if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
      url = video.thumbnailUrl;
    } else if (video.previewUrl && video.previewUrl.startsWith('http')) {
      url = video.previewUrl;
    } else if (video.thumbnailPath) {
      url = `${instanceUrl.replace(/\/$/, '')}${video.thumbnailPath}`;
    } else if (video.previewPath) {
      url = `${instanceUrl.replace(/\/$/, '')}${video.previewPath}`;
    }
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      new URL(url);
      return url;
    }
  } catch {
    return '/placeholder.svg?height=240&width=400';
  }
  return '/placeholder.svg?height=240&width=400';
}

interface PeerTubeInstance {
  url: string;
  name: string;
  default: boolean;
}

const DEFAULT_INSTANCES: PeerTubeInstance[] = [
  { url: 'https://framatube.org', name: 'FramaTube (20K videos)', default: true },
  { url: 'https://tilvids.com', name: 'TILvids (10K videos)', default: false },
  { url: 'https://peertube.fdn.fr', name: 'FDN', default: false },
  { url: 'https://video.blender.org', name: 'Blender', default: false },
  { url: 'https://dalek.zone', name: 'Dalek Zone (719K videos)', default: false },
  { url: 'https://video.causa-arcana.com', name: 'Causa Arcana (483K)', default: false },
  { url: 'https://peertube.cif.su', name: 'CiF (431K videos)', default: false },
  { url: 'https://video.pizza.ynh.fr', name: 'PizzaTube (404K videos)', default: false },
  { url: 'https://peer.adalta.social', name: 'Ad Alta (216K videos)', default: false },
  { url: 'https://tube.fediverse.games', name: 'Fediverse Games', default: false },
  { url: 'https://peertube.tv', name: 'PeerTube.TV', default: false },
];

async function fetchPeerTubeVideos(
  instanceUrl: string, 
  search: string = '', 
  page: number = 1,
  sort: string = '-trending'
): Promise<{ videos: PeerTubeVideo[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '24',
  });
  
  let apiUrl: string;
  
  if (search) {
    params.set('search', search);
    apiUrl = `${instanceUrl}/api/v1/search/videos?${params.toString()}`;
  } else {
    params.set('sort', sort);
    apiUrl = `${instanceUrl}/api/v1/videos?${params.toString()}`;
  }
  
  const res = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch videos: ${res.status}`);
  }

  const data = await res.json();
  
  return {
    videos: data.data || [],
    total: data.total || 0,
  };
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateString;
  }
}

const PeerTubeCard = ({ video, instanceUrl }: { video: PeerTubeVideo; instanceUrl: string }) => {
  const router = useRouter();
  const safeInstanceUrl = instanceUrl || '';
  const thumbnailUrl = getThumbnailUrl(video, safeInstanceUrl);
  
  const getAvatarUrl = (account: PeerTubeVideo['account'], instanceUrl: string): string | null => {
    if (!instanceUrl) return null;
    try {
      let url = '';
      if (account.avatarUrl && account.avatarUrl.startsWith('http')) {
        url = account.avatarUrl;
      } else if (account.avatar) {
        url = `${instanceUrl.replace(/\/$/, '')}${account.avatar}`;
      }
      
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        new URL(url);
        return url;
      }
    } catch {
      return null;
    }
    return null;
  };
  
  const avatarUrl = getAvatarUrl(video.account, safeInstanceUrl);
  
  return (
    <div 
      className="group cursor-pointer overflow-hidden rounded-lg border border-border/30 bg-card transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={() => router.push(`/peertube/${video.uuid}?instance=${encodeURIComponent(safeInstanceUrl)}`)}
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={video.name}
          fill
          unoptimized
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white rounded">
          {formatDuration(video.duration)}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      
      <div className="p-2.5 sm:p-3">
        <h3 className="line-clamp-2 text-sm sm:text-base font-medium leading-tight mb-1.5">
          {video.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={video.account.displayName}
              width={20}
              height={20}
              unoptimized
              className="rounded-full"
            />
          )}
          <p className="text-xs sm:text-sm font-medium text-foreground/80 line-clamp-1">
            {video.channel.displayName || video.account.displayName}
          </p>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground gap-3">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground/70" />
            <span>{formatViewCount(video.views)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3 text-muted-foreground/70" />
            <span>{formatViewCount(video.likes)}</span>
          </div>
          
          <span className="text-muted-foreground/50">•</span>
          
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default function PeerTubePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [instanceUrl, setInstanceUrl] = useState<string>('');
  const [videos, setVideos] = useState<PeerTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedInstance = localStorage.getItem('peertubeInstance');
    if (savedInstance) {
      setInstanceUrl(savedInstance);
    } else {
      const defaultInstance = DEFAULT_INSTANCES.find(i => i.default);
      if (defaultInstance) {
        setInstanceUrl(defaultInstance.url);
      }
    }
  }, []);

  useEffect(() => {
    if (instanceUrl) {
      localStorage.setItem('peertubeInstance', instanceUrl);
      loadVideos(true);
    }
  }, [instanceUrl]);

  const loadVideos = async (reset: boolean = false) => {
    if (!instanceUrl) return;
    
    const currentPage = reset ? 1 : page;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPeerTubeVideos(
        instanceUrl, 
        searchQuery, 
        currentPage,
        sortBy
      );
      
      if (reset) {
        setVideos(result.videos);
        setPage(2);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
        setPage(prev => prev + 1);
      }
      
      setTotalVideos(result.total);
      setHasMore(result.videos.length > 0 && videos.length + result.videos.length < result.total);
    } catch (err) {
      console.error('Error fetching PeerTube videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVideos(true);
  };

  const handleInstanceChange = (url: string) => {
    if (url === 'custom') {
      setShowSettings(true);
    } else {
      setInstanceUrl(url);
    }
  };

  const handleCustomInstanceSubmit = () => {
    let url = customUrl.trim();
    if (!url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      new URL(url);
      setInstanceUrl(url);
      setShowSettings(false);
      setCustomUrl('');
    } catch {
      toast({
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
    }
  };

  const selectedInstance = DEFAULT_INSTANCES.find(i => i.url === instanceUrl) || { 
    url: instanceUrl, 
    name: instanceUrl ? (() => { try { return new URL(instanceUrl).hostname; } catch { return instanceUrl; } })() : 'Custom Instance'
  };

  if (!instanceUrl) {
    return (
      <div className="container mx-auto px-0 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            PeerTube
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse videos from decentralized PeerTube instances
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={instanceUrl} onValueChange={handleInstanceChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select instance" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_INSTANCES.map((instance) => (
                <SelectItem key={instance.url} value={instance.url}>
                  {instance.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Custom Instance</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadVideos(true)}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="mb-6 px-2 sm:px-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-trending">Trending</SelectItem>
              <SelectItem value="-publishedAt">Recent</SelectItem>
              <SelectItem value="-views">Most Viewed</SelectItem>
              <SelectItem value="-likes">Most Liked</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 px-2 sm:px-0"
          >
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Enter Custom PeerTube Instance</h3>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., peertube.example.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCustomInstanceSubmit}>
                    Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSettings(false);
                      setCustomUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure the instance has CORS enabled for API access
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-2 sm:px-0 mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalVideos > 0 && (
            <span>{formatViewCount(totalVideos)} videos from {selectedInstance.name}</span>
          )}
        </p>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">Failed to load videos</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => loadVideos(true)}>
            Try Again
          </Button>
        </div>
      )}

      {!error && videos.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Video className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No videos found</p>
          <Button onClick={() => loadVideos(true)}>
            Load Videos
          </Button>
        </div>
      )}

      {loading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
            {videos.filter(v => v && v.uuid).map((video, index) => (
              <PeerTubeCard 
                key={`${video.uuid}-${index}`} 
                video={video} 
                instanceUrl={instanceUrl} 
              />
            ))}
          </div>

          {hasMore && videos.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => loadVideos(false)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {!loading && videos.length > 0 && (
        <div className="mt-8 px-2 sm:px-0">
          <Card>
            <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Connected to: <span className="font-medium text-foreground">{selectedInstance.name}</span>
                </span>
              </div>
              <a
                href={instanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Visit Instance
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
