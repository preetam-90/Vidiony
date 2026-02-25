"use client"
import { Video } from '@/data'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Image from 'next/image'
import { Clock, Eye } from 'lucide-react'
import { useState } from 'react'

export default function VideoCard({ video, onClick }: { video: Video; onClick?: () => void }) {
  const [imageError, setImageError] = useState(false)

  // Format view count to display in K, M, or B format
  const formatViewCount = (viewCount: string | number | undefined): string => {
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

  // Format published date to relative time
  const formatPublishedDate = (dateString: string | undefined): string => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 1) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      return `${Math.floor(diffDays / 365)} years ago`
    } catch (e) {
      return ''
    }
  }

  return (
    <Card 
      className="overflow-hidden h-full transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-full aspect-video bg-muted">
        <Image
          src={imageError ? '/placeholder-thumbnail.jpg' : (video.thumbnail || '/placeholder-thumbnail.jpg')}
          alt={video.title}
          fill
          className="object-cover transition-opacity duration-300"
          onError={() => setImageError(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{video.uploader}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViewCount(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatPublishedDate(video.uploadDate)}
          </span>
        </div>
      </div>
    </Card>
  )
}