"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { videos } from "@/data"
import { searchVideos, convertYouTubeVideoToVideo } from "@/lib/youtube-api"
import { searchMovies, getImageUrl } from "@/lib/tmdb-api"
import type { Video } from "@/data"
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const PEERTUBE_INSTANCE = 'https://framatube.org'

// Convert TMDB movie to Video format
const convertTMDBMovieToVideo = (movie: any): Video => ({
  id: `tmdb-${movie.id}`,
  title: movie.title,
  description: movie.overview || 'No description available',
  thumbnail: getImageUrl(movie.poster_path, 'w185') || '/images/placeholder-poster.jpg',
  uploader: 'TMDB',
  views: movie.vote_count ? `${movie.vote_count} votes` : 'N/A',
  likes: movie.vote_average ? `${movie.vote_average}/10` : 'N/A',
  comments: '0',
  uploadDate: movie.release_date || 'Unknown',
  platform: 'TMDB',
  category: 'Movies',
  url: `/tmdb-movies/${movie.id}`,
  duration: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A'
})

// Convert PeerTube video to Video format
const convertPeerTubeVideoToVideo = (video: any): Video => {
  const thumbnail = video.thumbnailUrl || video.previewUrl || 
    (video.thumbnailPath ? `${PEERTUBE_INSTANCE}${video.thumbnailPath}` : null) ||
    (video.previewPath ? `${PEERTUBE_INSTANCE}${video.previewPath}` : null);
  
  return {
    id: `peertube-${video.uuid}`,
    title: video.name,
    description: video.description || '',
    thumbnail: thumbnail || '/images/placeholder-poster.jpg',
    uploader: video.channel?.displayName || video.account?.displayName || 'PeerTube',
    views: video.views || 0,
    likes: video.likes || 0,
    comments: video.comments || 0,
    uploadDate: video.publishedAt || '',
    platform: 'PeerTube',
    category: 'Videos',
    url: `/peertube/${video.uuid}?instance=${encodeURIComponent(PEERTUBE_INSTANCE)}`,
    duration: video.duration ? formatDuration(video.duration) : '0:00'
  };
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

// Search PeerTube videos
async function searchPeerTubeVideos(searchTerm: string): Promise<Video[]> {
  try {
    const res = await fetch(
      `${PEERTUBE_INSTANCE}/api/v1/search/videos?search=${encodeURIComponent(searchTerm)}&limit=3`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.data || []).map(convertPeerTubeVideoToVideo);
  } catch (err) {
    console.error("PeerTube search error:", err);
    return [];
  }
}

// Add closeSearchBar prop
interface ModernSearchBarProps {
  closeSearchBar?: () => void;
}

const ModernSearchBar = ({ closeSearchBar }: ModernSearchBarProps) => {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Video[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Debounced search function
  const debouncedSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First show local results immediately
      const localResults = videos
        .filter(video =>
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 3)
        .map(video => ({ ...video, id: `local-${video.id}` }))

      setSuggestions(localResults)
      
      // Search TMDB movies
      try {
        const moviesResponse = await searchMovies(searchTerm)
        const tmdbResults = moviesResponse.results
          .slice(0, 3)
          .map(convertTMDBMovieToVideo)
        
        setSuggestions(prev => [...prev, ...tmdbResults])
      } catch (err) {
        console.error("TMDB API error:", err)
      }

      // Then fetch YouTube results if needed
      if (localResults.length < 3) {
        try {
          const ytResults = await searchVideos(searchTerm)
          // Check if ytResults is an array or an object with items property
          const items = Array.isArray(ytResults) ? ytResults : ytResults?.items || []
          
          const formattedResults = items
            .map(convertYouTubeVideoToVideo)
            .slice(0, 3 - localResults.length)
            
          setSuggestions(prev => [...prev, ...formattedResults])
        } catch (err) {
          console.error("YouTube API error:", err)
          setError("Couldn't fetch online results")
        }
      }
      
      // Fetch PeerTube results
      try {
        const peertubeResults = await searchPeerTubeVideos(searchTerm)
        if (peertubeResults.length > 0) {
          setSuggestions(prev => [...prev, ...peertubeResults])
        }
      } catch (err) {
        console.error("PeerTube API error:", err)
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("Search failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsFocused(false)
      // Call closeSearchBar prop if provided
      if (closeSearchBar) {
        closeSearchBar()
      }
    }
  }

  const handleClear = () => {
    setQuery("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  // Handle suggestion click
  const handleSuggestionClick = (video: Video) => {
    // Route to different pages based on result type
    if (String(video.id).startsWith('tmdb-')) {
      const tmdbId = String(video.id).replace('tmdb-', '');
      router.push(`/tmdb-movies/${tmdbId}`);
    } else if (String(video.id).startsWith('peertube-')) {
      const videoId = String(video.id).replace('peertube-', '');
      router.push(`/peertube/${videoId}?instance=${encodeURIComponent(PEERTUBE_INSTANCE)}`);
    } else if (String(video.id).startsWith('local-')) {
      const videoId = String(video.id).replace('local-', '');
      router.push(`/video/${videoId}`);
    } else {
      // YouTube videos
      const videoId = video.id;
      router.push(`/video/${videoId}`);
    }
    setIsFocused(false)
    
    // Call closeSearchBar prop if provided
    if (closeSearchBar) {
      closeSearchBar()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return

      switch (e.key) {
        case 'ArrowDown':
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
          e.preventDefault()
          break
        case 'ArrowUp':
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          e.preventDefault()
          break
        case 'Enter':
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            const video = suggestions[selectedIndex]
            setQuery(video.title)
            handleSuggestionClick(video)
          }
          break
        case 'Escape':
          setIsFocused(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocused, selectedIndex, suggestions, router])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative">
        <motion.div
          className={`relative flex items-center h-12 bg-white dark:bg-black rounded-lg shadow-md ${
            isFocused ? "ring-2 ring-gray-400 dark:ring-gray-700" : ""
          }`}
          initial={false}
          animate={{
            boxShadow: isFocused
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search videos, channels..."
            className="w-full h-full pl-4 pr-20 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
            aria-label="Search"
            aria-autocomplete="list"
            aria-expanded={isFocused && (suggestions.length > 0 || isLoading)}
          />

          {query && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="absolute right-14 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              aria-label="Clear search"
            >
              <X className="h-6 w-6" />
            </motion.button>
          )}

          <button
            type="submit"
            className={`absolute right-0 h-12 px-4 rounded-r-lg flex items-center justify-center ${
              query.trim()
                ? "bg-gray-800 dark:bg-gray-900 text-white"
                : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-white"
            } transition-all duration-200 ease-in-out`}
            aria-label="Search"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Search className="h-5 w-5" strokeWidth={2.5} />
            </motion.div>
          </button>
        </motion.div>
      </form>

      <AnimatePresence>
        {isFocused && (suggestions.length > 0 || isLoading || error) && (
          <motion.div
            className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500 dark:text-red-400">{error}</div>
            ) : (
              <ul className="py-2 divide-y divide-gray-100 dark:divide-gray-700">
                {suggestions.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      className={`w-full px-4 py-3 text-left flex items-center gap-4 transition-colors ${
                        selectedIndex === index
                          ? "bg-blue-50 dark:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setQuery(item.title)
                        handleSuggestionClick(item)
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-16 h-10 object-cover rounded-md"
                        />
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                          {String(item.id).startsWith('local-') 
                            ? 'Local' 
                            : String(item.id).startsWith('tmdb-') 
                              ? 'TMDB' 
                              : 'YT'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description.substring(0, 60)}...
                        </p>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModernSearchBar