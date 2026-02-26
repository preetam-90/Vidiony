'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Play, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Bell,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  embedUrl?: string;
  embedPath?: string;
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
    url: string;
  };
  channel: {
    id: number;
    name: string;
    displayName: string;
    url: string;
    avatarUrl?: string;
    avatar?: string;
  };
  tags: string[];
  category: {
    id: number;
    label: string;
  };
  license: {
    id: number;
    label: string;
  };
  language: {
    id: string;
    label: string;
  };
}

async function fetchPeerTubeVideo(instanceUrl: string, uuid: string): Promise<PeerTubeVideo> {
  const apiUrl = `${instanceUrl}/api/v1/videos/${uuid}`;
  
  const res = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch video: ${res.status}`);
  }

  return res.json();
}

async function fetchRelatedVideos(instanceUrl: string, uuid: string): Promise<PeerTubeVideo[]> {
  try {
    const apiUrl = `${instanceUrl}/api/v1/videos/${uuid}`;
    
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return [];
    }

    const video = await res.json();
    
    if (video.tags && video.tags.length > 0) {
      const searchRes = await fetch(
        `${instanceUrl}/api/v1/search/videos?search=${encodeURIComponent(video.tags[0])}&limit=12`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (searchRes.ok) {
        const data = await searchRes.json();
        return (data.data || []).filter((v: PeerTubeVideo) => v.uuid !== uuid);
      }
    }
    
    return [];
  } catch {
    return [];
  }
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const RelatedVideoCard = ({ 
  video, 
  instanceUrl,
  onClick 
}: { 
  video: PeerTubeVideo; 
  instanceUrl: string;
  onClick: () => void;
}) => {
  const getThumbnailUrl = (v: PeerTubeVideo, iu: string) => {
    if (v.thumbnailUrl) return v.thumbnailUrl;
    if (v.previewUrl) return v.previewUrl;
    if (v.thumbnailPath) return `${iu.replace(/\/$/, '')}${v.thumbnailPath}`;
    if (v.previewPath) return `${iu.replace(/\/$/, '')}${v.previewPath}`;
    return '/placeholder.svg?height=240&width=400';
  };
  
  const thumbnailUrl = getThumbnailUrl(video, instanceUrl);
  
  return (
    <div 
      className="flex gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={thumbnailUrl}
          alt={video.name}
          fill
          unoptimized
          loading="lazy"
          className="object-cover"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white rounded">
          {formatDuration(video.duration)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-2 mb-1">{video.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {video.channel.displayName || video.account.displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatViewCount(video.views)}
        </p>
      </div>
    </div>
  );
};

function PeerTubeVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { toast } = useToast();
  
  const instanceUrl = searchParams.get('instance') || '';
  const uuid = params.id as string || '';
  
  const [video, setVideo] = useState<PeerTubeVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<PeerTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('comments');
  
  useEffect(() => {
    if (!instanceUrl || !uuid) {
      setError('Missing video or instance information');
      setLoading(false);
      return;
    }
    
    const loadVideo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const videoData = await fetchPeerTubeVideo(instanceUrl, uuid);
        const related = await fetchRelatedVideos(instanceUrl, uuid);
        
        setVideo(videoData);
        setRelatedVideos(related);
      } catch (err) {
        console.error('Error loading video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
  }, [instanceUrl, uuid]);

  const handleShare = () => {
    const url = `${window.location.origin}/peertube/${uuid}?instance=${encodeURIComponent(instanceUrl)}`;
    navigator.clipboard.writeText(url);
    toast({
      description: 'Link copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/peertube')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to PeerTube
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive font-medium mb-2">Failed to load video</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/peertube')}>
            Go to PeerTube
          </Button>
        </div>
      </div>
    );
  }

  const getEmbedUrl = () => {
    if (video.embedUrl) return video.embedUrl;
    if (video.embedPath) return `${instanceUrl.replace(/\/$/, '')}${video.embedPath}`;
    return `${instanceUrl.replace(/\/$/, '')}/videos/embed/${video.uuid}`;
  };
  
  const embedUrl = getEmbedUrl();

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4 sm:py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/peertube')}
        className="mb-4 ml-2 sm:ml-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="aspect-video relative bg-black rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              title={video.name}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 hidden" id="embed-fallback">
              <div className="text-center">
                <p className="text-white mb-4">Unable to load video player</p>
                <a
                  href={`${instanceUrl.replace(/\/$/, '')}/videos/watch/${video.uuid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Watch on PeerTube
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 px-2 sm:px-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">{video.name}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(video.views)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{formatViewCount(video.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{video.comments}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  {video.channel.avatarUrl ? (
                    <Image
                      src={video.channel.avatarUrl}
                      alt={video.channel.displayName}
                      width={40}
                      height={40}
                      unoptimized
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{video.channel.displayName || video.account.displayName}</p>
                    <a
                      href={video.channel.url || video.account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      View Channel
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                
                {video.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {video.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="comments">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comments ({video.comments})
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Globe className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="mt-4">
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p>Comments are loaded directly from the PeerTube instance</p>
                  <a
                    href={`${instanceUrl}/videos/watch/${video.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mt-2"
                  >
                    View on PeerTube
                  </a>
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span>{video.category?.label || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span>{video.language?.label || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License</span>
                      <span>{video.license?.label || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Likes</span>
                      <span>{formatViewCount(video.likes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dislikes</span>
                      <span>{formatViewCount(video.dislikes)}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <a
                        href={`${instanceUrl}/videos/watch/${video.uuid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-primary hover:underline"
                      >
                        View on PeerTube
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-3 px-2">Related Videos</h3>
          <div className="space-y-2">
            {relatedVideos.map((relatedVideo) => (
              <RelatedVideoCard
                key={relatedVideo.uuid}
                video={relatedVideo}
                instanceUrl={instanceUrl}
                onClick={() => router.push(`/peertube/${relatedVideo.uuid}?instance=${encodeURIComponent(instanceUrl)}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PeerTubeVideoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PeerTubeVideoContent />
    </Suspense>
  );
}
