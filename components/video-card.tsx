"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MoreVertical, Share, Clock, Flag, Ban, Trash2, ThumbsUp, Eye } from "lucide-react"
import type { Video } from "@/data"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import SharePopup from "./share-popup"
import { useWatchLater } from "@/contexts/watch-later-context"
import { ReportDialog } from "./report-dialog"
import { FeedbackDialog } from "./feedback-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useLikedVideos } from "@/contexts/liked-videos-context"
import Image from "next/image"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import { useRouter } from "next/navigation"

interface VideoCardProps {
  video: Video
  layout?: "grid" | "list"
  context?: 'history' | 'favorites' | string;
  onRemoveFromHistory?: (videoId: string | number) => void;
  onClick?: () => void;
}

export default function VideoCard({ video, layout = "grid", context, onRemoveFromHistory, onClick }: VideoCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isJustHidden, setIsJustHidden] = useState(false)
  const [isReported, setIsReported] = useState(false)
  const [isJustReported, setIsJustReported] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater()
  const { isLiked, removeFromLiked, addToLiked } = useLikedVideos()
  const { toast } = useToast()

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load hidden/reported status from localStorage on mount
  useEffect(() => {
    if (!isClient) return
    try {
      const hiddenVideos = JSON.parse(localStorage.getItem("hiddenVideos") || "[]") as string[]
      const reportedVideos = JSON.parse(localStorage.getItem("reportedVideos") || "[]") as string[]
      setIsHidden(hiddenVideos.includes(String(video?.id || '')))
      setIsReported(reportedVideos.includes(String(video?.id || '')))
    } catch (error) {
      console.error('Error checking video status:', error)
    }
  }, [video?.id, isClient])

  const handleWatchLater = () => {
    if (!video) return
    if (isInWatchLater(video.id)) {
      removeFromWatchLater(video.id)
    } else {
      addToWatchLater(video)
    }
  }

  const handleNotInterested = () => {
    if (!video?.id) return
    try {
      const hiddenVideos = JSON.parse(localStorage.getItem("hiddenVideos") || "[]") as string[]
      hiddenVideos.push(String(video.id))
      localStorage.setItem("hiddenVideos", JSON.stringify(hiddenVideos))
      setIsHidden(true)
      setIsJustHidden(true)
    } catch (error) {
      console.error('Error handling not interested:', error)
    }
  }

  const handleUndo = () => {
    if (!video?.id) return
    try {
      const hiddenVideos = JSON.parse(localStorage.getItem("hiddenVideos") || "[]") as string[]
      const index = hiddenVideos.indexOf(String(video.id))
      if (index > -1) {
        hiddenVideos.splice(index, 1)
        localStorage.setItem("hiddenVideos", JSON.stringify(hiddenVideos))
      }
      setIsHidden(false)
      setIsJustHidden(false)
    } catch (error) {
      console.error('Error handling undo:', error)
    }
  }

  const handleFeedbackSubmit = (reason: string) => {
    if (!video?.id) return
    console.log(`Feedback submitted for video ${video.id}: ${reason}`)
    setIsJustHidden(false)
  }

  const handleReport = (reason: string) => {
    if (!video?.id) return
    try {
      const reportedVideos = JSON.parse(localStorage.getItem("reportedVideos") || "[]") as string[]
      reportedVideos.push(String(video.id))
      localStorage.setItem("reportedVideos", JSON.stringify(reportedVideos))
      
      toast({
        description: "Thanks for reporting",
        className: "bg-background border absolute bottom-4 left-4 rounded-lg",
        duration: 3000,
      })
      
      setIsReported(true)
      setIsJustReported(true)
    } catch (error) {
      console.error('Error handling report:', error)
    }
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked(video.id)) {
      removeFromLiked(video.id);
      toast({ description: "Removed from Favorites", duration: 2000 });
    } else {
      const videoToAdd = {
        ...video,
        likes: typeof video.likes === 'string' 
          ? (parseInt(video.likes.replace(/[^0-9]/g, '')) + 1).toString()
          : (video.likes || 0) + 1
      };
      addToLiked(videoToAdd);
      toast({ description: "Added to Favorites", duration: 2000 });
    }
  };

  // Format view count with K, M, B suffixes
  const formatViewCount = (viewCount?: string | number) => {
    if (!viewCount) return '0 views'
    
    let numCount: number
    if (typeof viewCount === 'string') {
      numCount = parseInt(viewCount.replace(/[^0-9]/g, ''))
      if (isNaN(numCount)) return '0 views'
    } else {
      numCount = viewCount
    }
    
    if (numCount >= 1000000000) {
      return `${(numCount / 1000000000).toFixed(1).replace(/\.0$/, '')}B views`
    } else if (numCount >= 1000000) {
      return `${(numCount / 1000000).toFixed(1).replace(/\.0$/, '')}M views`
    } else if (numCount >= 1000) {
      return `${(numCount / 1000).toFixed(1).replace(/\.0$/, '')}K views`
    } else {
      return `${numCount} views`
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ""
    try {
      // Robust date parsing
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      // Fallback for invalid date formats
      return dateString
    }
  }
  
  // Get video duration in formatted form
  const formatDuration = () => {
    if (!video.duration) return '';
    
    // If already formatted as HH:MM:SS, return as is
    if (/^\d+:\d+(?::\d+)?$/.test(video.duration)) {
      return video.duration;
    }
    
    // Parse ISO 8601 duration format (PT1H30M15S)
    try {
      const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '';
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const seconds = match[3] ? parseInt(match[3]) : 0;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (err) {
      console.error("Error formatting duration:", err);
      return '';
    }
  };

  if (isReported && !isJustReported) return null
  if (isHidden && !isJustHidden) return null

  if (isJustReported) {
    return (
      <div className={layout === "list" ? "p-4" : "aspect-video"}>
        <div className="w-full h-full flex items-center justify-center bg-background border rounded-lg p-6">
          <p className="text-muted-foreground text-center">Thanks for reporting</p>
        </div>
      </div>
    )
  }

  if (isJustHidden) {
    return (
      <div className={layout === "list" ? "p-4" : "aspect-video"}>
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#282828] rounded-lg p-6 gap-4">
          <p className="text-sm text-neutral-400">Video removed</p>
          <div className="flex gap-4">
            <Button
              variant="link"
              className="text-blue-500 hover:text-blue-400 p-0 h-auto"
              onClick={handleUndo}
            >
              Undo
            </Button>
            <Button
              variant="link"
              className="text-blue-500 hover:text-blue-400 p-0 h-auto"
              onClick={() => setIsFeedbackOpen(true)}
            >
              Tell us why
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const videoId = video?.id ? String(video.id).replace('local-', '') : ''
  const getVideoUrl = () => {
    if (video?.url) return video.url
    return `/video/${videoId}`
  }

  const getShareUrl = () => {
    const url = getVideoUrl()
    if (typeof window === 'undefined') return url
    if (url.startsWith('http')) return url
    return `${window.location.origin}${url}`
  }
  const thumbnailUrl = video?.thumbnail && video.thumbnail.trim() !== "" ? video.thumbnail : "/placeholder.svg?height=240&width=400"
  const isGoogleDrive = video?.thumbnail?.startsWith("https://drive.google.com") ?? false

  if (!video) {
    return null;
  }

  const handleCardNavigation = () => {
    const url = video?.url ?? ""
    if (url.startsWith("/peertube/")) {
      router.push(url)
      return
    }

    if (url.startsWith("http")) {
      window.location.href = url
      return
    }

    router.push(`/video/${videoId}`)
  }

  const videoCardContent = (
    <div className={`group relative ${layout === "list" ? "" : "aspect-video"} rounded-t-lg overflow-hidden`}>
      <Image
        src={imageError ? "/placeholder.svg?height=240&width=400" : thumbnailUrl}
        alt={video?.title || "Video thumbnail"}
        fill
        unoptimized
        loading="lazy"
        placeholder="blur"
        blurDataURL="/placeholder.svg?height=10&width=10"
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        onError={() => {
          setImageError(true);
        }}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Duration badge */}
      {formatDuration() && (
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white rounded">
          {formatDuration()}
        </div>
      )}
    </div>
  )

  return (
    <>
      {layout === "list" ? (
        <div className="flex gap-4 hover:bg-accent/10 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => onClick ? onClick() : handleCardNavigation()}>
          <Link href={getVideoUrl()} className="aspect-video w-40 relative rounded-md overflow-hidden flex-shrink-0" onClick={(e) => onClick && e.preventDefault()}>
            {videoCardContent}
          </Link>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium line-clamp-2">{video?.title}</h3>
            <p className="text-sm font-medium text-foreground/80 mt-1">{video?.uploader}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-muted-foreground/70" />
                <span>{formatViewCount(video?.views)}</span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                <span>{formatDate(video?.uploadDate)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video?.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWatchLater() }}>
                <Clock className="mr-2 h-4 w-4" />
                <span>{isInWatchLater(video.id) ? "Remove from Watch Later" : "Watch Later"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsShareOpen(true) }}>
                <Share className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleNotInterested() }}>
                <Ban className="mr-2 h-4 w-4" />
                <span>Not interested</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsReportOpen(true) }}>
                <Flag className="mr-2 h-4 w-4" />
                <span>Report</span>
              </DropdownMenuItem>
              {context === 'history' && onRemoveFromHistory && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRemoveFromHistory(video.id) }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove from history</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLikeClick(e) }}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                <span>{isLiked(video.id) ? "Remove from favorites" : "Add to favorites"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="group w-full overflow-hidden rounded-lg border border-border/30 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer bg-card"
          onClick={() => onClick ? onClick() : handleCardNavigation()}
        >
          <Link href={getVideoUrl()} onClick={(e) => onClick && e.preventDefault()}>
            {videoCardContent}
          </Link>
          <div className="p-2.5 sm:p-3">
            <h3 className="line-clamp-2 text-sm sm:text-base font-medium leading-tight mb-1.5">
              {video?.title}
            </h3>
            
            <div className="flex flex-col gap-1">
              <p className="text-xs sm:text-sm font-medium text-foreground/80 line-clamp-1">
                {video?.uploader}
              </p>
              
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground/70" />
                  <span>{formatViewCount(video?.views)}</span>
                </div>
                
                <span className="text-muted-foreground/50">•</span>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground/70" />
                  <span>{formatDate(video?.uploadDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        <SharePopup 
          isOpen={isShareOpen} 
          onClose={() => setIsShareOpen(false)} 
          url={getShareUrl()}
          title={video?.title || ''}
        />
      <ReportDialog 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReport}
      />
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}
