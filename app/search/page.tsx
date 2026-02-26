"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { videos } from "@/data"
import SearchResults from "@/components/search-results"
import { searchVideos, convertYouTubeVideoToVideo } from "@/lib/youtube-api"
import type { Video } from "@/data"
import { Loader2, Youtube, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

const PEERTUBE_SEARCH_API = "/api/peertube/search"

const parseNumericValue = (value: string | number) => {
  if (typeof value === "string") {
    const cleanValue = value.replace(/[^0-9.]/g, "")
    return Number.parseFloat(cleanValue) || 0
  }
  return value || 0
}

const sortVideos = (videos: Video[], sortOption: string) => {
  if (sortOption === "relevance") {
    return videos
  }

  const sorted = [...videos]

  switch (sortOption) {
    case "date":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.uploadDate).getTime()
        const dateB = new Date(b.uploadDate).getTime()
        return dateB - dateA
      })
    case "views":
      return sorted.sort((a, b) => parseNumericValue(b.views) - parseNumericValue(a.views))
    case "rating":
      return sorted.sort((a, b) => parseNumericValue(b.likes) - parseNumericValue(a.likes))
    default:
      return videos
  }
}
export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const sortParam = searchParams.get("sort") || "relevance"

  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [sort, setSort] = useState(sortParam)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showYouTube, setShowYouTube] = useState(false)
  const [showPeerTube, setShowPeerTube] = useState(false)
  const [youtubeResults, setYoutubeResults] = useState<Video[]>([])
  const [peertubeResults, setPeerTubeResults] = useState<Video[]>([])
  const [localResults, setLocalResults] = useState<Video[]>([])
  const [loadingYoutube, setLoadingYoutube] = useState(false)
  const [loadingPeerTube, setLoadingPeerTube] = useState(false)

  const combineResults = (options?: {
    includeYouTube?: boolean
    includePeerTube?: boolean
  }) => {
    const includeYouTube = options?.includeYouTube ?? showYouTube
    const includePeerTube = options?.includePeerTube ?? showPeerTube
    const combined: Video[] = [...localResults]

    if (includePeerTube && peertubeResults.length > 0) {
      combined.push(...peertubeResults)
    }

    if (includeYouTube && youtubeResults.length > 0) {
      combined.push(...youtubeResults)
    }

    return combined
  }

  const refreshFilteredResults = (options?: {
    sortOption?: string
    includeYouTube?: boolean
    includePeerTube?: boolean
  }) => {
    const combined = combineResults({
      includeYouTube: options?.includeYouTube,
      includePeerTube: options?.includePeerTube,
    })
    const sorted = sortVideos(combined, options?.sortOption || sort)
    setFilteredVideos(sorted)
  }

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      setError(null)

      try {
        // First filter local videos from data.ts and prefix their IDs with 'local-'
        const localResults = videos.filter(
          (video) =>
            video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.description.toLowerCase().includes(query.toLowerCase()) ||
            video.uploader.toLowerCase().includes(query.toLowerCase()),
        ).map(video => ({
          ...video,
          id: `local-${video.id}` // Prefix local video IDs to make them unique
        }))

        setLocalResults(localResults)
        
        // If no local results or very few relevant results, automatically fetch from YouTube
        if (localResults.length === 0 || (localResults.length < 3 && query.length > 2)) {
          setShowYouTube(true)
          setShowPeerTube(true)
          await Promise.all([fetchYouTubeResults(), fetchPeerTubeResults()])
          return
        }

        setFilteredVideos(sortVideos(localResults, sort))
      } catch (error) {
        console.error("Error fetching videos:", error)
        setError("An error occurred while fetching videos. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [query, sort])

  const fetchYouTubeResults = async () => {
    if (!query) return

    setLoadingYoutube(true)
    try {
      const ytVideos = await searchVideos(query)
      if (!ytVideos?.items) {
        throw new Error('Invalid YouTube API response')
      }
      const results = ytVideos.items.map(convertYouTubeVideoToVideo)
      setYoutubeResults(results)
      refreshFilteredResults()
    } catch (error) {
      console.error("Error searching YouTube videos:", error)
      setError("Failed to fetch YouTube videos. Showing local results only.")
      setShowYouTube(false)
      setFilteredVideos(localResults)
    } finally {
      setLoadingYoutube(false)
    }
  }

  const fetchPeerTubeResults = async () => {
    if (!query) return

    setLoadingPeerTube(true)

    try {
      const res = await fetch(`${PEERTUBE_SEARCH_API}?q=${encodeURIComponent(query)}`)

      if (!res.ok) {
        throw new Error(`PeerTube proxy responded with status ${res.status}`)
      }

      const data = await res.json()

      if (Array.isArray(data.videos)) {
        setPeerTubeResults(data.videos)
        refreshFilteredResults()
      } else {
        setError("Invalid PeerTube proxy response.")
      }
    } catch (err) {
      console.error("PeerTube proxy error", err)
      setError("Failed to fetch PeerTube results.")
    }

    setLoadingPeerTube(false)
  }

  const handleResultsToggle = async (type: "youtube" | "peertube") => {
    if (type === "youtube") {
      const newShowYouTube = !showYouTube
      setShowYouTube(newShowYouTube)
      if (newShowYouTube && youtubeResults.length === 0) {
        await fetchYouTubeResults()
      }
      refreshFilteredResults({ includeYouTube: newShowYouTube })
    } else if (type === "peertube") {
      const newShowPeerTube = !showPeerTube
      setShowPeerTube(newShowPeerTube)
      if (newShowPeerTube && peertubeResults.length === 0) {
        await fetchPeerTubeResults()
      }
      refreshFilteredResults({ includePeerTube: newShowPeerTube })
    }
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    refreshFilteredResults({ sortOption: newSort })

    // Update URL without full page reload
    const url = new URL(window.location.href)
    url.searchParams.set("sort", newSort)
    window.history.pushState({}, "", url.toString())
  }

  // Keep filtered list in sync when local data changes
  useEffect(() => {
    refreshFilteredResults()
  }, [localResults, youtubeResults, peertubeResults, showYouTube, showPeerTube])

  return (
    <div className="container mx-auto px-4 py-6 scrollbar-hide overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 scrollbar-hide">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{query ? `Search results for "${query}"` : "All Videos"}</h1>
          {query && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showYouTube ? "default" : "outline"}
                size="sm"
                onClick={() => handleResultsToggle("youtube")}
                disabled={loadingYoutube}
                className="flex items-center gap-2"
              >
                <Youtube className="h-4 w-4" />
                {showYouTube ? "Hide YouTube" : "Show YouTube"}
              </Button>
              <Button
                variant={showPeerTube ? "default" : "outline"}
                size="sm"
                onClick={() => handleResultsToggle("peertube")}
                disabled={loadingPeerTube}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {showPeerTube ? "Hide PeerTube" : "Show PeerTube"}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <span className="mr-2">Sort by:</span>
          <select
            className="bg-background border rounded-md p-2 scrollbar-hide"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Upload Date</option>
            <option value="views">View Count</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 scrollbar-hide">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Searching videos...</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="relative w-40 h-24 bg-muted rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <SearchResults videos={filteredVideos} query={query} />
          {loadingYoutube && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading YouTube results...</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
