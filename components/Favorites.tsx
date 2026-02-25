"use client";

import { Button } from "./ui/button";
import { MoreVertical, Play, Shuffle, Trash, Share2, Flag, MoveUp, MoveDown, ListPlus, Copy, X, ChevronLeft, ChevronRight, GripVertical, Menu } from "lucide-react";
import { useLikedVideos } from "@/contexts/liked-videos-context";
import type { Video } from "@/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { ReportDialog } from "@/components/report-dialog"
import { useToast } from "@/components/ui/use-toast";

// Helper function to format views
function formatViews(views: string | number): string {
  const viewCount = typeof views === 'number' ? views : parseInt(views);
  if (isNaN(viewCount)) return `${views} views`;
  
  if (viewCount >= 1000000) {
    return `${(viewCount / 1000000).toFixed(1)}M views`;
  } else if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K views`;
  }
  return `${viewCount} views`;
}

interface SocialShareButton {
  name: string;
  icon: string;
  backgroundColor: string;
  shareUrl: (url: string, title: string) => string;
}

const socialButtons: SocialShareButton[] = [
  {
    name: "WhatsApp",
    icon: "/social/whatsapp.svg",
    backgroundColor: "#25D366",
    shareUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Telegram",
    icon: "/social/telegram.svg",
    backgroundColor: "#0088cc",
    shareUrl: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Instagram",
    icon: "/social/instagram.svg",
    backgroundColor: "#E4405F",
    shareUrl: (url) => url, // Instagram doesn't support direct sharing, will copy to clipboard
  },
  {
    name: "X",
    icon: "/social/x.svg",
    backgroundColor: "#000000",
    shareUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Facebook",
    icon: "/social/facebook.svg",
    backgroundColor: "#1877f2",
    shareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

// Update the truncateUrl function to show simpler format
const truncateUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Only show domain and first part of the path
    const path = urlObj.pathname.split('/').filter(Boolean).slice(0, 2).join('/');
    return `${domain}/file/${path}...`;
  } catch (e) {
    // If URL parsing fails, just truncate
    return url.substring(0, 30) + '...';
  }
};

// Add color extraction function
function getDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!context) {
        resolve("#000000");
        return;
      }

      context.drawImage(img, 0, 0, img.width, img.height);
      
      try {
        const imageData = context.getImageData(0, 0, img.width, img.height).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (error) {
        resolve("#000000");
      }
    };
    
    img.onerror = () => resolve("#000000");
    img.src = imageSrc;
  });
}

interface ReportedVideo {
  videoId: string;
  reason: string;
  timestamp: string;
}

export default function Favorites() {
  const router = useRouter();
  const { likedVideos, removeFromLiked, updateLikedOrder } = useLikedVideos();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof likedVideos[0] | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [expandedVideoId, setExpandedVideoId] = useState<string | number | null>(null);
  const [dominantColor, setDominantColor] = useState<string>("#000000");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, []);

  // Check scroll position to show/hide arrows
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  // Add scroll event listener when dialog opens
  useEffect(() => {
    if (shareDialogOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', checkScrollButtons);
      // Initial check
      checkScrollButtons();
      
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
      };
    }
  }, [shareDialogOpen]);

  // Effect to extract dominant color when first video changes
  useEffect(() => {
    if (likedVideos.length > 0 && likedVideos[0]?.thumbnail) {
      getDominantColor(likedVideos[0].thumbnail)
        .then(color => setDominantColor(color))
        .catch(() => setDominantColor("#000000"));
    }
  }, [likedVideos.length, likedVideos[0]?.thumbnail]);

  // Function to move video to top
  const moveToTop = (videoId: string | number) => {
    const videoIndex = likedVideos.findIndex(v => v.id === videoId);
    if (videoIndex > 0) {
      const newVideos = [...likedVideos];
      const [video] = newVideos.splice(videoIndex, 1);
      newVideos.unshift(video);
      // Update using context function directly
      updateLikedOrder(newVideos);
    }
  };

  // Function to move video to bottom
  const moveToBottom = (videoId: string | number) => {
    const videoIndex = likedVideos.findIndex(v => v.id === videoId);
    if (videoIndex < likedVideos.length - 1) {
      const newVideos = [...likedVideos];
      const [video] = newVideos.splice(videoIndex, 1);
      newVideos.push(video);
      // Update using context function directly
      updateLikedOrder(newVideos);
    }
  };

  // Function to handle social media sharing
  const handleShare = (socialButton: SocialShareButton) => {
    if (!selectedVideo) return;

    if (socialButton.name === "Instagram") {
      // For Instagram, copy to clipboard and show message
      navigator.clipboard.writeText(selectedVideo.url || `https://example.com/video/${selectedVideo.id}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        description: "Link copied to clipboard. Open Instagram and paste to share.",
      });
      return;
    }

    // Open share URL in new window
    const videoUrl = selectedVideo.url || `https://example.com/video/${selectedVideo.id}`;
    const shareUrl = socialButton.shareUrl(videoUrl, selectedVideo.title);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({
        left: -containerWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({
        left: containerWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  const handlePlayAll = () => {
    if (likedVideos.length > 0) {
      setCurrentPlayingIndex(0);
      setPlayedIndices([0]);
      setIsShuffleMode(false);
      
      // Navigate to first video
      router.push(`/video/${likedVideos[0].id}`);
    }
  };

  const handleShuffle = () => {
    if (likedVideos.length > 0) {
      setIsShuffleMode(true);
      const randomIndex = Math.floor(Math.random() * likedVideos.length);
      setCurrentPlayingIndex(randomIndex);
      setPlayedIndices([randomIndex]);
      
      // Navigate to random video
      router.push(`/video/${likedVideos[randomIndex].id}`);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = [...likedVideos];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the order using the context function
    updateLikedOrder(items);
  };

  const toggleVideoExpansion = (videoId: string | number) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  const handleReport = async (videoId: string, reason: string) => {
    if (!isClient) return
    try {
      const reportedVideos: ReportedVideo[] = JSON.parse(localStorage.getItem("reportedVideos") || "[]");
      
      reportedVideos.push({
        videoId,
        reason,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem("reportedVideos", JSON.stringify(reportedVideos));
      
      // Remove from liked videos
      removeFromLiked(videoId);
      
      toast({
        description: "Video reported and removed from favorites",
      });
      
      setIsReportOpen(false);
    } catch (error) {
      console.error("Error reporting video:", error);
      toast({
        description: "Error reporting video",
        variant: "destructive"
      });
    }
  };

  const ShareDialog = () => (
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Video</DialogTitle>
          <DialogDescription>
            Share this video to your social networks or copy the link
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative flex overflow-x-hidden mt-4">
          {showLeftArrow && (
            <Button
              onClick={scrollLeft}
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 shadow-sm rounded-full p-2 hidden sm:flex">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="flex space-x-2 overflow-x-auto py-1 px-2 scrollbar-hide"
          >
            {socialButtons.map((button) => (
              <button
                key={button.name}
                className="flex-shrink-0 rounded-full p-2 flex flex-col items-center justify-center gap-2 hover:bg-accent transition-colors"
                style={{ 
                  width: "5rem", 
                  height: "5rem"
                }}
                onClick={() => handleShare(button)}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: button.backgroundColor }}
                >
                  <Image 
                    src={button.icon} 
                    alt={button.name} 
                    width={20} 
                    height={20} 
                  />
                </div>
                <span className="text-xs">{button.name}</span>
              </button>
            ))}
          </div>
          
          {showRightArrow && (
            <Button
              onClick={scrollRight}
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 shadow-sm rounded-full p-2 hidden sm:flex">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={selectedVideo ? (selectedVideo.url || `https://example.com/video/${selectedVideo.id}`) : ""}
              readOnly
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className={cn(copySuccess && "bg-green-600 hover:bg-green-700")}
            onClick={() => {
              if (selectedVideo) {
                navigator.clipboard.writeText(selectedVideo.url || `https://example.com/video/${selectedVideo.id}`);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              }
            }}
          >
            {copySuccess ? (
              <div className="flex items-center">
                <Copy className="h-4 w-4 mr-1" />
                Copied
              </div>
            ) : (
              <div className="flex items-center">
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </div>
            )}
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-start mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  if (likedVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-2xl font-semibold mb-2">No Liked Videos</h1>
        <p className="text-muted-foreground text-center">
          Videos you like will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "max-h-12 overflow-hidden" : "max-h-[1000px]"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">Liked Videos</h1>
            <span className="ml-2 text-muted-foreground">({likedVideos.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={handlePlayAll}
            >
              <Play className="h-4 w-4 mr-2" />
              Play All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={handleShuffle}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center gap-2 md:hidden mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handlePlayAll}
          >
            <Play className="h-4 w-4 mr-2" />
            Play All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleShuffle}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="favorites-list">
          {(provided: DroppableProvided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef} 
              className="space-y-4"
            >
              {likedVideos.map((video, index) => (
                <Draggable 
                  key={String(video.id)} 
                  draggableId={String(video.id)} 
                  index={index}
                >
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "flex items-start bg-accent/10 rounded-lg overflow-hidden transition-all",
                        expandedVideoId === video.id ? "max-h-96" : "max-h-32",
                        snapshot.isDragging && "shadow-lg"
                      )}
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="flex items-center px-2 h-full self-stretch"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div 
                        className="flex flex-col sm:flex-row items-start flex-1 py-2 pr-2 gap-3"
                        onClick={() => router.push(`/video/${video.id}`)}
                      >
                        <div className="relative aspect-video w-full sm:w-48 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-10 w-10 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium line-clamp-2">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">{video.uploader}</p>
                          <p className="text-xs text-muted-foreground">{formatViews(video.views || "0")}</p>
                          
                          <div className={cn(
                            "mt-2 text-sm text-muted-foreground transition-all",
                            expandedVideoId === video.id ? "line-clamp-none" : "line-clamp-2 md:line-clamp-1"
                          )}>
                            {video.description}
                          </div>
                          
                          {video.description && video.description.length > 100 && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-xs mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoExpansion(video.id);
                              }}
                            >
                              {expandedVideoId === video.id ? "Show less" : "Show more"}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="py-2 pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => {
                              setSelectedVideo(video);
                              setShareDialogOpen(true);
                            }}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => moveToTop(video.id)}>
                              <MoveUp className="mr-2 h-4 w-4" />
                              Move to top
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => moveToBottom(video.id)}>
                              <MoveDown className="mr-2 h-4 w-4" />
                              Move to bottom
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => removeFromLiked(video.id)} className="text-red-500 focus:text-red-500">
                              <Trash className="mr-2 h-4 w-4" />
                              Remove from favorites
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedVideoId(String(video.id));
                                setIsReportOpen(true);
                              }}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {ShareDialog()}
      
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(reason) => {
          if (selectedVideoId) {
            handleReport(selectedVideoId, reason);
          }
        }}
      />
    </div>
  );
} 