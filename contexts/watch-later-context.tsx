"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { Video } from "@/types/data"

interface WatchLaterContextType {
  watchLaterVideos: Video[]
  addToWatchLater: (video: Video) => void
  removeFromWatchLater: (videoId: string | number) => void
  isInWatchLater: (videoId: string | number) => boolean
  updateWatchLaterOrder: (newOrder: Video[]) => void
}

const WatchLaterContext = createContext<WatchLaterContextType | undefined>(undefined)

export function WatchLaterProvider({ children }: { children: React.ReactNode }) {
  const [watchLaterVideos, setWatchLaterVideos] = useState<Video[]>([])
  const [isClient, setIsClient] = useState(false)

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load watch later videos from localStorage on mount
  useEffect(() => {
    if (!isClient) return
    try {
      const savedVideos = localStorage.getItem("watchLater")
      if (savedVideos) {
        const parsedVideos = JSON.parse(savedVideos)
        setWatchLaterVideos(Array.isArray(parsedVideos) ? parsedVideos : [])
      }
    } catch (error) {
      console.error("Error loading watch later videos:", error)
      setWatchLaterVideos([])
    }
  }, [isClient])

  // Save to localStorage whenever watchLaterVideos changes
  useEffect(() => {
    if (!isClient) return
    try {
      localStorage.setItem("watchLater", JSON.stringify(watchLaterVideos))
    } catch (error) {
      console.error("Error saving watch later videos:", error)
    }
  }, [watchLaterVideos, isClient])

  const addToWatchLater = (video: Video) => {
    if (!isClient) return
    setWatchLaterVideos(prev => {
      if (prev.some(v => v.id === video.id)) {
        return prev
      }
      const newList = [video, ...prev]
      try {
        localStorage.setItem("watchLater", JSON.stringify(newList))
      } catch (error) {
        console.error("Error saving watch later video:", error)
      }
      return newList
    })
  }

  const removeFromWatchLater = (videoId: string | number) => {
    if (!isClient) return
    setWatchLaterVideos(prev => {
      const newList = prev.filter(video => video.id !== videoId)
      try {
        localStorage.setItem("watchLater", JSON.stringify(newList))
      } catch (error) {
        console.error("Error removing watch later video:", error)
      }
      return newList
    })
  }

  const isInWatchLater = (videoId: string | number) => {
    return watchLaterVideos.some(video => video.id === videoId)
  }

  const updateWatchLaterOrder = (newOrder: Video[]) => {
    if (!isClient) return
    setWatchLaterVideos(newOrder)
    try {
      localStorage.setItem("watchLater", JSON.stringify(newOrder))
    } catch (error) {
      console.error("Error updating watch later order:", error)
    }
  }

  return (
    <WatchLaterContext.Provider 
      value={{ 
        watchLaterVideos, 
        addToWatchLater, 
        removeFromWatchLater, 
        isInWatchLater,
        updateWatchLaterOrder
      }}
    >
      {children}
    </WatchLaterContext.Provider>
  )
}

export function useWatchLater() {
  const context = useContext(WatchLaterContext)
  if (context === undefined) {
    throw new Error("useWatchLater must be used within a WatchLaterProvider")
  }
  return context
}
