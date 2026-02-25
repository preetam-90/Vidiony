"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, ThumbsUp } from "lucide-react"
import { useLikedVideos } from "@/contexts/liked-videos-context"
import { useToast } from "@/components/ui/use-toast"

interface VideoPlayerProps {
  video: {
    id: string | number
    title: string
    url: string
    platform: string
    thumbnail?: string
  }
  onEnded?: () => void
}

export default function VideoPlayer({ video, onEnded }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addToLiked, removeFromLiked, isLiked } = useLikedVideos()
  const { toast } = useToast()

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle video URL based on platform
  const getVideoSource = () => {
    const platform = video.platform.toLowerCase();
    // Fallback raw URL if undefined
    const rawUrl = video.url || '';
    switch (platform) {
      case 'youtube':
        // Accept both embed and watch URLs
        if (rawUrl.includes('youtube.com/embed/')) {
          return rawUrl;
        }
        if (rawUrl.includes('youtube.com/watch?v=')) {
          const videoId = rawUrl.split('v=')[1].split('&')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        }
        return rawUrl;
      case 'google drive':
      case 'googledrive':
        // Accept both preview and view URLs
        if (rawUrl.includes('drive.google.com/file/d/')) {
          const pattern = /\/d\/([^\/]+)/;
          const match = rawUrl.match(pattern);
          if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
          }
        }
        return rawUrl;
      default:
        return rawUrl;
    }
  }

  const videoSrc = getVideoSource()

  // Check if using iframe or direct video
  const isIframe = ['youtube', 'google drive', 'googledrive', 'vimeo', 'dailymotion', 'bitchute', 'odysee'].includes(video.platform.toLowerCase())

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`
  }

  // Save video to watch history
  const saveToWatchHistory = () => {
    if (!isClient || savedToHistory) return;
    
    try {
      // Get existing history
      const existingHistory = localStorage.getItem('watchHistory');
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Remove this video if it exists (to reorder it to the top)
      history = history.filter((v: any) => v.id !== video.id);
      
      // Add the current video to the beginning
      history.unshift({
        ...video,
        lastWatched: new Date().toISOString(),
      });
      
      // Save back to localStorage
      localStorage.setItem('watchHistory', JSON.stringify(history));
      setSavedToHistory(true);
    } catch (error) {
      console.error('Error saving to watch history:', error);
    }
  };

  // Video control handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
        saveToWatchHistory()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      setCurrentTime(currentTime)
      setProgress((currentTime / duration) * 100)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (parseInt(e.target.value) / 100) * videoRef.current.duration
      videoRef.current.currentTime = newTime
      setProgress(parseInt(e.target.value))
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleLike = () => {
    if (isLiked(video.id)) {
      removeFromLiked(video.id)
      toast({
        description: "Removed from Liked Videos",
        duration: 2000,
      })
    } else {
      addToLiked({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || '',
        uploader: '',
        views: 0,
        uploadDate: new Date().toISOString(),
        platform: video.platform,
        category: 'video',
        url: video.url,
        duration: '',
        description: '',
        likes: 0,
        comments: 0
      })
      toast({
        description: "Added to Liked Videos",
        duration: 2000,
      })
    }
  }

  useEffect(() => {
    if (videoRef.current) {
      // Add event listeners
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate)
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0)
      })
      videoRef.current.addEventListener('play', () => {
        setIsPlaying(true)
        saveToWatchHistory()
      })
      videoRef.current.addEventListener('pause', () => setIsPlaying(false))
      if (onEnded) {
        videoRef.current.addEventListener('ended', onEnded)
      }
    }

    return () => {
      if (videoRef.current) {
        // Remove event listeners
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        videoRef.current.removeEventListener('loadedmetadata', () => {})
        videoRef.current.removeEventListener('play', () => {})
        videoRef.current.removeEventListener('pause', () => {})
        if (onEnded) {
          videoRef.current.removeEventListener('ended', onEnded)
        }
      }
    }
  }, [onEnded])

  // Save to history on component mount for iframe videos
  useEffect(() => {
    if (isIframe) {
      saveToWatchHistory();
    }
  }, [isIframe, video.id]);

  return (
    <div ref={containerRef} className="relative w-full video-player-container bg-black rounded-lg overflow-hidden">
      {!videoSrc && (
        <div className="flex items-center justify-center w-full aspect-video bg-black text-white">
          Invalid video URL
        </div>
      )}
      {videoSrc && (
        isIframe ? (
          <iframe
            title={video.title}
            src={videoSrc}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full aspect-video border-0"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={video.thumbnail}
            controls
            autoPlay
            className="w-full aspect-video"
            onEnded={onEnded}
          />
        )
      )}
      {/* Custom controls (only shown for direct video, not iframes) */}
      {videoSrc && !isIframe && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* Progress bar */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
            }}
          />
          {/* Controls row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="text-white p-1 rounded-full hover:bg-white/20">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={toggleMute} className="text-white p-1 rounded-full hover:bg-white/20">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button 
                onClick={handleLike} 
                className={`text-white p-1 rounded-full hover:bg-white/20 ${isLiked(video.id) ? 'text-red-500' : ''}`}
              >
                <ThumbsUp size={20} />
              </button>
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div>
              <button onClick={toggleFullscreen} className="text-white p-1 rounded-full hover:bg-white/20">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 