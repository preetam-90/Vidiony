"use client"
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Share, 
  Volume2, 
  VolumeX, 
  MoreHorizontal, 
  ChevronUp, 
  ChevronDown,
  Music,
  User,
  Bookmark,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface Video {
  id: string;
  title: string;
  platform: 'youtube' | 'googleDrive';
  url?: string;
  channelTitle?: string;
  viewCount?: string;
  publishedAt?: string;
  isShort?: boolean;
  likeCount?: string;
  description?: string;
  avatar?: string;
}

interface ImmersiveShortsPlayerProps {
  videos: Video[];
  initialIndex?: number;
  autoAdvance?: boolean;
}

export default function ImmersiveShortsPlayer({ 
  videos, 
  initialIndex = 0,
  autoAdvance = true 
}: ImmersiveShortsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [liked, setLiked] = useState<{[key: string]: boolean}>({});
  const [saved, setSaved] = useState<{[key: string]: boolean}>({});
  const [isClient, setIsClient] = useState(false);
  
  const videoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = videos[currentIndex];

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle autoplay and video switching
  useEffect(() => {
    if (!currentVideo) return;

    const videoId = currentVideo.id;
    const videoElement = videoRefs.current[videoId];
    
    // Pause all videos
    Object.values(videoRefs.current).forEach(ref => {
      if (ref && !ref.paused) {
        ref.pause();
      }
    });

    // YouTube videos are handled via iframe API, non-YouTube through video element
    if (currentVideo.platform !== 'youtube' && videoElement) {
      if (isPlaying) {
        videoElement.currentTime = 0;
        videoElement.muted = isMuted;
        videoElement.play().catch(err => console.error('Error playing video:', err));
        
        // Start progress tracking
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        
        progressInterval.current = setInterval(() => {
          if (videoElement) {
            const percent = (videoElement.currentTime / videoElement.duration) * 100;
            setProgress(percent);
            
            // If video ended and autoAdvance is enabled, go to next video
            if (percent >= 99.5 && autoAdvance) {
              goToNextVideo();
            }
          }
        }, 100);
      } else {
        videoElement.pause();
      }
    } else {
      // For YouTube videos, tracking is approximate since we can't directly access the video
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      // Start a timer that increments progress for YouTube videos (approximate)
      // Most shorts are around 15-60 seconds, so we'll use 30 seconds as a standard duration
      if (isPlaying) {
        const estimatedDuration = 30; // seconds
        let elapsedTime = 0;
        
        progressInterval.current = setInterval(() => {
          if (isPlaying) {
            elapsedTime += 0.1; // 0.1 seconds per interval
            const percent = Math.min((elapsedTime / estimatedDuration) * 100, 99.9);
            setProgress(percent);
            
            // Auto advance after estimatedDuration
            if (percent >= 99.5 && autoAdvance) {
              goToNextVideo();
              elapsedTime = 0;
            }
          }
        }, 100);
      }
    }

    // Cleanup
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPlaying, isMuted, autoAdvance]);

  // Add video to watch history when it changes
  useEffect(() => {
    if (!currentVideo || !isClient) return;
    
    const addToHistory = () => {
      try {
        const history = localStorage.getItem('watchHistory') || '[]';
        const parsedHistory = JSON.parse(history);
        
        // Remove duplicate if exists
        const filteredHistory = parsedHistory.filter((v: any) => v.id !== currentVideo.id);
        
        // Add current video to the beginning
        const updatedHistory = [currentVideo, ...filteredHistory].slice(0, 50);
        
        localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error updating watch history:', error);
      }
    };
    
    addToHistory();
  }, [currentVideo, isClient]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNextVideo();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPreviousVideo();
      } else if (e.key === ' ' || e.key === 'p') {
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'l') {
        toggleLike();
      } else if (e.key === 'i') {
        setShowInfo(!showInfo);
      } else if (e.key === 'c') {
        setShowComments(!showComments);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying, isMuted, showComments, showInfo]);

  // Handle touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      
      // If vertical swipe is more significant than horizontal
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
        if (diffY > 0) {
          // Swiped up
          goToNextVideo();
        } else {
          // Swiped down
          goToPreviousVideo();
        }
      } 
      // Handle horizontal swipe for other actions (could be to toggle info)
      else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swiped left - show comments
          setShowComments(true);
        } else {
          // Swiped right - show video info
          setShowInfo(true);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const goToNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
      setShowInfo(false);
    }
  };

  const goToPreviousVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
      setShowInfo(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLike = () => {
    if (!currentVideo) return;
    const videoId = currentVideo.id;
    setLiked(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const toggleSave = () => {
    if (!currentVideo) return;
    const videoId = currentVideo.id;
    setSaved(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  // Get count display for views, likes, etc.
  const formatCount = (count?: string) => {
    if (!count) return '0';
    const num = parseInt(count.replace(/[^0-9]/g, ''), 10);
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return `${Math.floor(diffSeconds / 2592000)}mo ago`;
  };

  // If we have no videos
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>No shorts available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
    >
      {/* Videos */}
      <div className="relative h-full w-full">
        {videos.map((video, index) => (
          <AnimatePresence key={video.id}>
            {index === currentIndex && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Video Element */}
                {video.platform !== 'youtube' && video.url ? (
                  <video
                    ref={el => {
                      videoRefs.current[video.id] = el;
                    }}
                    src={video.url}
                    className="h-full w-full object-cover"
                    loop
                    playsInline
                    autoPlay
                    muted={isMuted}
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${video.id}`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                      frameBorder="0"
                    />
                    {/* Transparent overlay to handle click events for play/pause */}
                    <div 
                      className="absolute inset-0 z-10"
                      onClick={togglePlay}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Play/Pause Indicator */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 ml-2 border-l-[25px] border-l-white border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <Progress value={progress} className="h-1 bg-neutral-700 rounded-none" />
        </div>

        {/* Navigation Indicators */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
          {videos.map((_, idx) => (
            <div 
              key={idx}
              className={`w-1 h-5 rounded-full cursor-pointer ${
                idx === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>

        {/* Right Side Controls */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 text-white z-20">
          {/* Comments Button */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="group flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/40">
              <MessageSquare size={26} />
            </div>
            <span className="text-sm mt-1">Comments</span>
          </button>
          
          {/* Save Button */}
          <button 
            onClick={toggleSave}
            className="group flex flex-col items-center"
          >
            <div className={`w-12 h-12 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/40 ${saved[currentVideo?.id] ? 'text-blue-500' : ''}`}>
              <Bookmark className={`${saved[currentVideo?.id] ? 'fill-current' : ''}`} size={28} />
            </div>
            <span className="text-sm mt-1">Save</span>
          </button>
          
          {/* Share Button */}
          <button className="group flex flex-col items-center">
            <div className="w-12 h-12 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/40">
              <Share size={26} />
            </div>
            <span className="text-sm mt-1">Share</span>
          </button>
          
          {/* More Button */}
          <button className="group flex flex-col items-center">
            <div className="w-12 h-12 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/40">
              <MoreHorizontal size={26} />
            </div>
            <span className="text-sm mt-1">More</span>
          </button>
        </div>

        {/* Bottom Info Area */}
        <div className="absolute left-4 right-20 bottom-6 text-white z-20">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{currentVideo?.title}</h3>
          
          {/* Channel Info */}
          <div className="flex items-center gap-3 mb-3">
            <Link 
              href={`/channel/${currentVideo?.channelTitle}`} 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {currentVideo?.avatar ? (
                <img 
                  src={currentVideo.avatar} 
                  alt={currentVideo.channelTitle} 
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
              <span className="font-medium">{currentVideo?.channelTitle}</span>
            </Link>
            <button className="ml-2 py-1.5 px-5 bg-white text-black font-medium text-sm rounded-full">
              Subscribe
            </button>
          </div>
          
          {/* Show More Info Button */}
          <button 
            className="flex items-center gap-1 text-sm text-gray-300"
            onClick={() => setShowInfo(!showInfo)}
          >
            <span>{showInfo ? 'Show less' : 'Show more'}</span>
            {showInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Mute/Unmute Button */}
        <button 
          onClick={toggleMute}
          className="absolute left-4 top-4 w-10 h-10 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center z-20 text-white"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Navigation Arrows */}
        <button 
          className="absolute top-1/2 left-4 transform -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center z-20 text-white"
          onClick={goToPreviousVideo}
          disabled={currentIndex === 0}
        >
          <ChevronUp size={24} />
        </button>
        <button 
          className="absolute bottom-28 left-4 w-10 h-10 rounded-full backdrop-blur-sm bg-black/20 flex items-center justify-center z-20 text-white"
          onClick={goToNextVideo}
          disabled={currentIndex === videos.length - 1}
        >
          <ChevronDown size={24} />
        </button>

        {/* Music Info - TikTok style */}
        <div className="absolute left-4 bottom-28 flex items-center gap-2 text-white z-20 max-w-[60%]">
          <div className="flex items-center gap-2 backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full">
            <Music size={14} />
            <p className="text-sm line-clamp-1">
              {currentVideo?.title?.split('-')[1] || 'Original sound'}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Panel (slides up from bottom) */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 top-20 bg-neutral-900 rounded-t-3xl z-30 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">Comments</h3>
              <button 
                onClick={() => setShowComments(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white"
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="h-full overflow-y-auto p-4 pt-2">
              {/* Comment items would go here - showing placeholder */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium text-sm">Username</p>
                    <p className="text-neutral-500 text-xs">2h ago</p>
                  </div>
                  <p className="text-white text-sm mt-1">This is an amazing video! Really enjoyed watching it.</p>
                  <div className="flex items-center gap-4 mt-2 text-neutral-400">
                    <button className="flex items-center gap-1 text-xs">
                      <ThumbsUp size={14} />
                      <span>24</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs">
                      <ThumbsDown size={14} />
                    </button>
                    <button className="text-xs">Reply</button>
                  </div>
                </div>
              </div>

              {/* More comment placeholders */}
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium text-sm">Viewer {i + 1}</p>
                      <p className="text-neutral-500 text-xs">{i + 1}d ago</p>
                    </div>
                    <p className="text-white text-sm mt-1">
                      {["Great content!", "Thanks for sharing!", "This is incredible", "Can't wait for more!", "First time seeing this!"][i % 5]}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-neutral-400">
                      <button className="flex items-center gap-1 text-xs">
                        <ThumbsUp size={14} />
                        <span>{(i + 1) * 5}</span>
                      </button>
                      <button className="flex items-center gap-1 text-xs">
                        <ThumbsDown size={14} />
                      </button>
                      <button className="text-xs">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-6"
            onClick={() => setShowInfo(false)}
          >
            <div 
              className="bg-neutral-900 rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-white font-bold text-xl mb-4">{currentVideo?.title}</h2>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Heart size={16} />
                    <span className="text-sm">{formatCount(currentVideo?.likeCount)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <MessageSquare size={16} />
                    <span className="text-sm">143</span>
                  </div>
                </div>
                <div className="text-neutral-400 text-sm">
                  {formatRelativeTime(currentVideo?.publishedAt)}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-800">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex-shrink-0 overflow-hidden">
                  {currentVideo?.avatar ? (
                    <img src={currentVideo.avatar} alt={currentVideo.channelTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{currentVideo?.channelTitle}</p>
                  <p className="text-neutral-400 text-sm">{formatCount(currentVideo?.viewCount)} views</p>
                </div>
                <button className="bg-white text-black font-medium text-sm rounded-full py-1.5 px-5">
                  Subscribe
                </button>
              </div>
              
              <div className="text-white text-sm">
                <p className="whitespace-pre-line">
                  {currentVideo?.description || 'No description available.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 