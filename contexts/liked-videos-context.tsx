"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { Video } from "@/data"

interface LikedVideosContextType {
  likedVideos: Video[]
  addToLiked: (video: Video) => void
  removeFromLiked: (videoId: string | number) => void
  isLiked: (videoId: string | number) => boolean
  updateLikedOrder: (newOrder: Video[]) => void
}

const LikedVideosContext = createContext<LikedVideosContextType | undefined>(undefined)

export function LikedVideosProvider({ children }: { children: React.ReactNode }) {
  const [likedVideos, setLikedVideos] = useState<Video[]>([])
  const [isClient, setIsClient] = useState(false)

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load liked videos from localStorage on mount
  useEffect(() => {
    if (!isClient) return
    try {
      const savedVideos = localStorage.getItem("likedVideos")
      if (savedVideos) {
        setLikedVideos(JSON.parse(savedVideos))
      }
    } catch (error) {
      console.error("Error loading liked videos:", error)
    }
  }, [isClient])

  // Save to localStorage whenever likedVideos changes
  useEffect(() => {
    if (!isClient) return
    try {
      localStorage.setItem("likedVideos", JSON.stringify(likedVideos))
    } catch (error) {
      console.error("Error saving liked videos:", error)
    }
  }, [likedVideos, isClient])

  const addToLiked = (video: Video) => {
    if (!isClient) return
    setLikedVideos(prev => {
      if (prev.some(v => v.id === video.id)) {
        return prev
      }
      // Increment the like count
      const videoToAdd = {
        ...video,
        likes: typeof video.likes === 'string' 
          ? (parseInt(video.likes.replace(/[^0-9]/g, '')) + 1).toString()
          : (video.likes || 0) + 1
      };
      const newList = [videoToAdd, ...prev]
      try {
        localStorage.setItem("likedVideos", JSON.stringify(newList))
      } catch (error) {
        console.error("Error saving liked video:", error)
      }
      return newList
    })
  }

  const removeFromLiked = (videoId: string | number) => {
    if (!isClient) return
    setLikedVideos(prev => {
      const newList = prev.filter(video => video.id !== videoId)
      try {
        localStorage.setItem("likedVideos", JSON.stringify(newList))
      } catch (error) {
        console.error("Error removing liked video:", error)
      }
      return newList
    })
  }

  const isLiked = (videoId: string | number) => {
    return likedVideos.some(video => video.id === videoId)
  }

  const updateLikedOrder = (newOrder: Video[]) => {
    if (!isClient) return
    setLikedVideos(newOrder)
    try {
      localStorage.setItem("likedVideos", JSON.stringify(newOrder))
    } catch (error) {
      console.error("Error updating liked videos order:", error)
    }
  }

  return (
    <LikedVideosContext.Provider 
      value={{ 
        likedVideos, 
        addToLiked, 
        removeFromLiked, 
        isLiked,
        updateLikedOrder
      }}
    >
      {children}
    </LikedVideosContext.Provider>
  )
}

export function useLikedVideos() {
  const context = useContext(LikedVideosContext)
  if (context === undefined) {
    throw new Error("useLikedVideos must be used within a LikedVideosProvider")
  }
  return context
}
