'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, Filter, Grid3X3, List, Trash2, Clock, Eye, TrendingUp, Calendar, SortAsc, SortDesc, Settings, Sparkles, Database, RotateCcw, Activity, Heart, Share, Play } from 'lucide-react';
import type { Video } from '@/data';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'timeline';
type SortOption = 'recent' | 'oldest' | 'mostWatched' | 'alphabetical';
type FilterOption = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth';

interface WatchHistoryData extends Video {
  watchedAt: string;
  watchCount: number;
  completionRate?: number;
}

export default function HistoryPage() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryData[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<WatchHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);
  const [isClient, setIsClient] = useState(false);

  usePageTitle("Watch History");

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-refresh analytics every 5 seconds for frequent updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsRefresh(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Load watch history from localStorage
  useEffect(() => {
    if (!isClient) return
    setIsLoading(true);
    try {
      const history = localStorage.getItem('watchHistory');
      if (history) {
        const parsedHistory: Video[] = JSON.parse(history);
        const enhancedHistory: WatchHistoryData[] = parsedHistory.map((video, index) => ({
          ...video,
          watchedAt: video.watchDate || new Date(Date.now() - index * 86400000).toISOString(),
          watchCount: Math.floor(Math.random() * 5) + 1,
          completionRate: Math.floor(Math.random() * 100),
        }));
        setWatchHistory(enhancedHistory);
        setFilteredHistory(enhancedHistory);
      }
    } catch (error) {
      console.error('Error loading watch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Filter and sort history
  useEffect(() => {
    let results = [...watchHistory];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(video =>
        video.title?.toLowerCase().includes(query) ||
        video.uploader?.toLowerCase().includes(query)
      );
    }
    
    // Apply date filter
    if (filterBy !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      results = results.filter(video => {
        const watchDate = new Date(video.watchedAt);
        
        switch (filterBy) {
          case 'today':
            return watchDate >= today;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return watchDate >= yesterday && watchDate < today;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            return watchDate >= weekStart;
          case 'thisMonth':
            const monthStart = new Date(today);
            monthStart.setDate(1);
            return watchDate >= monthStart;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
          break;
        case 'oldest':
          comparison = new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime();
          break;
        case 'mostWatched':
          comparison = b.watchCount - a.watchCount;
          break;
        case 'alphabetical':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    setFilteredHistory(results);
  }, [watchHistory, searchQuery, sortBy, sortOrder, filterBy]);

  const handleRemoveFromHistory = useCallback((videoId: string | number) => {
    if (!isClient) return
    const updatedHistory = watchHistory.filter((video) => video.id !== videoId);
    setWatchHistory(updatedHistory);
    try {
      localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error removing from history:', error)
    }
  }, [watchHistory, isClient]);

  const handleClearAll = useCallback(() => {
    if (!isClient) return
    if (confirm('Are you sure you want to clear all watch history? This action cannot be undone.')) {
      setWatchHistory([]);
      setFilteredHistory([]);
      try {
        localStorage.removeItem('watchHistory');
      } catch (error) {
        console.error('Error clearing history:', error)
      }
      setSelectedVideos(new Set());
    }
  }, [isClient]);

  const handleBatchDelete = useCallback(() => {
    if (!isClient) return
    const updatedHistory = watchHistory.filter(video => !selectedVideos.has(video.id.toString()));
    setWatchHistory(updatedHistory);
    try {
      localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error batch deleting:', error)
    }
    setSelectedVideos(new Set());
    setIsSelectionMode(false);
  }, [watchHistory, selectedVideos, isClient]);

  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Calculate real watch time based on video duration and completion rate
    const totalWatchTimeMinutes = watchHistory.reduce((acc, video) => {
      const durationStr = video.duration || '10:23';
      const [minutes, seconds] = durationStr.split(':').map(Number);
      const totalMinutes = minutes + (seconds / 60);
      const watchedMinutes = (totalMinutes * (video.completionRate || 0)) / 100;
      return acc + (watchedMinutes * video.watchCount);
    }, 0);

    const avgCompletionRate = watchHistory.length > 0
      ? watchHistory.reduce((acc, video) => acc + (video.completionRate || 0), 0) / watchHistory.length
      : 0;

    // Today's activity
    const todayVideos = watchHistory.filter(video =>
      new Date(video.watchedAt) >= today
    );

    // This week's activity
    const weekVideos = watchHistory.filter(video =>
      new Date(video.watchedAt) >= weekAgo
    );

    // Most watched category
    const categoryCount = watchHistory.reduce((acc, video) => {
      const category = video.category || 'Programming';
      acc[category] = (acc[category] || 0) + video.watchCount;
      return acc;
    }, {} as Record<string, number>);

    const mostWatchedCategory = Object.entries(categoryCount).reduce(
      (max, [category, count]) => count > max.count ? { category, count } : max,
      { category: 'Programming', count: 0 }
    );

    // Average session length
    const avgSessionLength = watchHistory.length > 0
      ? totalWatchTimeMinutes / watchHistory.reduce((acc, video) => acc + video.watchCount, 0)
      : 0;

    // Streak calculation
    const sortedDates = Array.from(new Set(watchHistory.map(v =>
      new Date(v.watchedAt).toDateString()
    ))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    let expectedDate = new Date(today);
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const expectedDateStr = expectedDate.toDateString();
      
      if (date.toDateString() === expectedDateStr) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalVideos: watchHistory.length,
      totalWatchTime: Math.round(totalWatchTimeMinutes / 60 * 10) / 10, // in hours, 1 decimal
      avgCompletionRate: Math.round(avgCompletionRate),
      todayVideos: todayVideos.length,
      weekVideos: weekVideos.length,
      mostWatchedCategory: mostWatchedCategory.category,
      avgSessionLength: Math.round(avgSessionLength),
      currentStreak,
      totalWatchSessions: watchHistory.reduce((acc, video) => acc + video.watchCount, 0),
    };
  }, [watchHistory, analyticsRefresh]);

  // Modern video card similar to YouTube/DailyMotion/Rumble
  // Format duration similar to the main VideoCard component
  const formatDuration = (duration?: string) => {
    if (!duration) return '';
    
    // If already formatted as HH:MM:SS, return as is
    if (/^\d+:\d+(?::\d+)?$/.test(duration)) {
      return duration;
    }
    
    // Parse ISO 8601 duration format (PT1H30M15S)
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
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

  const HistoryVideoCard = ({ video }: { video: WatchHistoryData }) => {
    const isSelected = selectedVideos.has(video.id.toString());
    
    return (
      <Link href={`/video/${video.id}`} className="block">
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ y: -2 }}
          className={cn(
            "group relative bg-card rounded-lg overflow-hidden transition-all duration-200 cursor-pointer h-full flex flex-col",
            "hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/10",
            "border border-border/50 hover:border-border",
            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          {/* Selection overlay */}
          {isSelectionMode && (
            <div
              className="absolute top-2 left-2 z-20 w-5 h-5 rounded-full border-2 border-white bg-black/80 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleVideoSelection(video.id.toString());
              }}
            >
              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          )}

          {/* Video thumbnail */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            <img
              src={video.thumbnail || '/placeholder-video.jpg'}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Progress bar at bottom of thumbnail */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${video.completionRate || 0}%` }}
              />
            </div>

            {/* Duration badge */}
            {formatDuration(video.duration) && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
            )}

            {/* Watch count badge */}
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.watchCount}
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>

          {/* Video info */}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex-1">
              <h3 className="font-medium text-sm line-clamp-2 mb-1 leading-tight group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {video.uploader}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(video.watchedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{video.completionRate}% watched</span>
              </div>
            </div>

            {/* Action buttons - only show on hover */}
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Heart className="w-3 h-3 mr-1" />
                Like
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Share className="w-3 h-3 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1 text-xs text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveFromHistory(video.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg animate-pulse w-2/3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-video bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (watchHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Database className="w-16 h-16 text-purple-400" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-32 h-32 mx-auto border-2 border-transparent border-t-purple-500 rounded-full"
            />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Your watch history is empty
            </h1>
            <p className="text-muted-foreground">
              Start watching videos to build your personalized history experience
            </p>
          </div>
          
          <Button 
            asChild 
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0"
          >
            <a href="/">
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Videos
            </a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
      {/* Futuristic background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Watch History
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>{analytics.totalVideos} videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{analytics.totalWatchTime} hours watched</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{analytics.avgCompletionRate}% avg completion</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="border-purple-500/20 hover:border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className="border-blue-500/20 hover:border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Select
              </Button>
              
              {isSelectionMode && selectedVideos.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedVideos.size})
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your history with AI-powered intelligence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-white/10 focus:border-purple-500/50 transition-all duration-300"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                  <SelectTrigger className="w-40 bg-background/50 backdrop-blur-sm border-white/10">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-background/50 backdrop-blur-sm border-white/10">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="mostWatched">Most Watched</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-background/50 backdrop-blur-sm border-white/10 hover:border-purple-500/30"
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* View mode selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "transition-all duration-300",
                    viewMode === 'grid'
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 border-0"
                      : "bg-background/50 backdrop-blur-sm border-white/10 hover:border-purple-500/30"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "transition-all duration-300",
                    viewMode === 'list'
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 border-0"
                      : "bg-background/50 backdrop-blur-sm border-white/10 hover:border-purple-500/30"
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className={cn(
                    "transition-all duration-300",
                    viewMode === 'timeline'
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 border-0"
                      : "bg-background/50 backdrop-blur-sm border-white/10 hover:border-purple-500/30"
                  )}
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Analytics panel */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 p-4 sm:p-6"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Your Viewing Analytics
              </h3>
              
              {/* Primary metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-lg bg-background/30">
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">{analytics.totalVideos}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Videos</div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-lg bg-background/30">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">{analytics.totalWatchTime}h</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Watch Time</div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-lg bg-background/30">
                  <div className="text-lg sm:text-2xl font-bold text-indigo-400">{analytics.avgCompletionRate}%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg Completion</div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-lg bg-background/30">
                  <div className="text-lg sm:text-2xl font-bold text-green-400">{analytics.currentStreak}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold">{analytics.todayVideos}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold">{analytics.weekVideos}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold">{analytics.mostWatchedCategory}</div>
                    <div className="text-xs text-muted-foreground">Top Category</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold">{analytics.avgSessionLength}m</div>
                    <div className="text-xs text-muted-foreground">Avg Session</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-300",
              viewMode === 'grid' && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4",
              viewMode === 'list' && "grid grid-cols-1 gap-3",
              viewMode === 'timeline' && "space-y-6"
            )}>
              {filteredHistory.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HistoryVideoCard video={video} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
