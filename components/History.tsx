"use client"
import { useState, useEffect } from "react"
import { ReportDialog } from "./report-dialog"
import { useToast } from "@/components/ui/use-toast"

export default function History() {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleReport = (reason: string) => {
    if (!isClient || !selectedVideoId) return
    try {
      const reportedVideos = JSON.parse(localStorage.getItem("reportedVideos") || "[]") as string[]
      reportedVideos.push(selectedVideoId)
      localStorage.setItem("reportedVideos", JSON.stringify(reportedVideos))
      
      toast({
        description: "Thanks for reporting",
        className: "bg-background border absolute bottom-4 left-4 rounded-lg",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error reporting video:', error)
    }
    setIsReportOpen(false)
  }

  return (
    <>
      {/* ... existing JSX ... */}
      {isReportOpen && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          onSubmit={handleReport}
        />
      )}
    </>
  )
} 