"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  ThumbsUp,
  ThumbsDown,
  Share2,
  MoreHorizontal,
  Flag,
  Clock,
  Eye,
  MessageCircle,
  ChevronLeft,
  Check,
  UserPlus,
  Bell,
  BellOff
} from "lucide-react";

// Mock video data
const mockVideo = {
  id: "1",
  title: "Building a Modern Video Platform with Next.js 15",
  description: "Learn how to build a high-performance video streaming platform using Next.js 15, TypeScript, and Tailwind CSS. We'll cover everything from the frontend UI to the backend API with Fastify and PostgreSQL.\n\nTimestamps:\n00:00 - Introduction\n02:30 - Project Setup\n10:00 - Frontend Development\n25:00 - Backend API\n45:00 - Database Schema\n55:00 - Deployment\n\nSubscribe for more tutorials!",
  thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1280&h=720&fit=crop",
  videoUrl: "/sample-video.mp4",
  duration: "24:35",
  views: 125000,
  likes: 8500,
  dislikes: 120,
  comments: 432,
  createdAt: "2 days ago",
  updatedAt: "1 day ago",
  author: {
    id: "user-1",
    name: "Tech Creator",
    username: "@techcreator",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    verified: true,
    subscribers: 250000,
    description: "Building amazing things with code. Full-stack developer sharing tutorials on modern web technologies.",
    joinedDate: "Jan 2020",
    totalViews: "15M"
  },
  category: "Technology",
  tags: ["Next.js", "TypeScript", "React", "Web Development", "Tutorial"]
};

const mockComments = [
  {
    id: "c1",
    author: {
      name: "John Developer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
      verified: false
    },
    content: "Great tutorial! I've been waiting for a Next.js 15 course like this. The UI design is beautiful.",
    likes: 245,
    createdAt: "1 day ago",
    replies: 12
  },
  {
    id: "c2",
    author: {
      name: "Sarah Code",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop",
      verified: true
    },
    content: "Can you do a follow-up video on implementing the video upload feature with progress bars?",
    likes: 189,
    createdAt: "1 day ago",
    replies: 8
  },
  {
    id: "c3",
    author: {
      name: "Mike Tech",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
      verified: false
    },
    content: "The glassmorphism design is on point! Love the dark theme.",
    likes: 156,
    createdAt: "2 days ago",
    replies: 4
  }
];

export default function VideoPage() {
  const params = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-4 gap-2"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Player */}
              <div 
                className="relative aspect-video overflow-hidden rounded-xl bg-black"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Video Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <img 
                    src={mockVideo.thumbnail} 
                    alt={mockVideo.title}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                  />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <Button 
                      size="icon" 
                      className="h-20 w-20 rounded-full bg-white/90 hover:bg-white"
                      onClick={() => setIsPlaying(true)}
                    >
                      <Play className="h-8 w-8 fill-primary text-primary ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Video Controls */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Progress Bar */}
                  <div className="relative mb-3 h-1 cursor-pointer rounded-full bg-white/30">
                    <div 
                      className="absolute h-full rounded-full bg-primary"
                      style={{ width: `${(currentTime / (24 * 60 + 35)) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-white hover:bg-white/20"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-white hover:bg-white/20"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="w-20 h-1 accent-white"
                        />
                      </div>
                      
                      <span className="text-sm text-white">
                        {formatTime(currentTime)} / {mockVideo.duration}
                      </span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-white hover:bg-white/20"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div>
                <h1 className="text-2xl font-bold">{mockVideo.title}</h1>
                
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(mockVideo.views)} views</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{mockVideo.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={isLiked ? "default" : "outline"} 
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setIsLiked(!isLiked);
                        if (isDisliked) setIsDisliked(false);
                      }}
                    >
                      <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      {formatNumber(mockVideo.likes + (isLiked ? 1 : 0))}
                    </Button>
                    <Button 
                      variant={isDisliked ? "default" : "outline"} 
                      size="sm"
                      onClick={() => {
                        setIsDisliked(!isDisliked);
                        if (isLiked) setIsLiked(false);
                      }}
                    >
                      <ThumbsDown className={`h-4 w-4 ${isDisliked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {mockVideo.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <div className="mt-4 rounded-xl bg-card p-4">
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {mockVideo.description}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {formatNumber(mockVideo.comments)} Comments
                  </h2>
                </div>

                {/* Comment Input */}
                <div className="mt-4 flex gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setCommentText("")}>
                        Cancel
                      </Button>
                      <Button disabled={!commentText.trim()}>
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="mt-6 space-y-4">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{comment.author.name}</span>
                          {comment.author.verified && (
                            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span className="text-sm text-muted-foreground">{comment.createdAt}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center gap-4 pt-1">
                          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ThumbsUp className="h-4 w-4" />
                            {comment.likes}
                          </button>
                          <button className="text-sm text-muted-foreground hover:text-foreground">
                            Reply
                          </button>
                          {comment.replies > 0 && (
                            <button className="text-sm text-primary hover:underline">
                              {comment.replies} replies
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Author Card */}
              <div className="rounded-xl bg-card p-4">
                <div className="flex items-start justify-between">
                  <Link href={`/channel/${mockVideo.author.id}`} className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={mockVideo.author.avatar} />
                      <AvatarFallback>{mockVideo.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{mockVideo.author.name}</span>
                        {mockVideo.author.verified && (
                          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{mockVideo.author.username}</span>
                    </div>
                  </Link>
                </div>
                
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {mockVideo.author.description}
                </p>
                
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatNumber(mockVideo.author.subscribers)} subscribers</span>
                  <span>•</span>
                  <span>{mockVideo.author.totalViews} views</span>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    className="flex-1 gap-2" 
                    variant={isSubscribed ? "outline" : "default"}
                    onClick={() => setIsSubscribed(!isSubscribed)}
                  >
                    {isSubscribed ? (
                      <>
                        <Check className="h-4 w-4" />
                        Subscribed
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setNotificationsOn(!notificationsOn)}
                  >
                    {notificationsOn ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Related Videos */}
              <div>
                <h3 className="mb-3 font-semibold">Related Videos</h3>
                <div className="space-y-3">
                  {[
                    { title: "TypeScript Advanced Types Tutorial", views: "45K", time: "1 week ago", duration: "18:30" },
                    { title: "React Server Components Deep Dive", views: "89K", time: "5 days ago", duration: "22:15" },
                    { title: "Building a REST API with Fastify", views: "120K", time: "2 weeks ago", duration: "35:00" },
                    { title: "Tailwind CSS v4 - Complete Guide", views: "200K", time: "3 days ago", duration: "28:45" },
                    { title: "PostgreSQL for Beginners", views: "75K", time: "1 month ago", duration: "45:20" },
                    { title: "Next.js 15 Authentication", views: "56K", time: "6 days ago", duration: "20:10" },
                  ].map((video, i) => (
                    <Link key={i} href="#" className="flex gap-2 group">
                      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg">
                        <img 
                          src={`https://images.unsplash.com/photo-${1611162617474 + i * 1000}?w=320&h=180&fit=crop`} 
                          alt={video.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
                          {video.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary transition-colors">
                          {video.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">{video.views} views</p>
                        <p className="text-xs text-muted-foreground">{video.time}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
