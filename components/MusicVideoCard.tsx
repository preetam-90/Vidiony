'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { MusicVideoOptionsDropdown } from '../app/music/components/MusicVideoOptionsDropdown';
import SharePopup from '@/components/share-popup';
import { ReportDialog } from '@/components/report-dialog';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { useToast } from '@/components/ui/use-toast';

interface MusicVideoProps {
  title: string;
  thumbnail: string;
  artist: string;
  views: string;
  videoId: string;
  onClick?: () => void;
}

const MusicVideoCard = ({ title, thumbnail, artist, views, videoId, onClick }: MusicVideoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true)
  }, []);

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer group relative"
        onClick={onClick}
      >
        <div className="relative aspect-video">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadingComplete={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          <MusicVideoOptionsDropdown
            video={{
              id: videoId,
              title: title,
              thumbnail: thumbnail,
              artist: artist,
              views: views
            }}
            onShare={() => setIsShareOpen(true)}
            onFeedback={() => setIsFeedbackOpen(true)}
            onReport={() => setIsReportOpen(true)}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300">{artist}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{views} views</p>
        </div>
      </div>

      {/* Modals */}
      <SharePopup
        isOpen={isShareOpen}
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/video/${videoId}`}
        title={title}
        onClose={() => setIsShareOpen(false)}
      />

      {isReportOpen && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          onSubmit={(reason) => {
            toast({
              description: "Thanks for reporting this video",
              duration: 3000,
            });
            setIsReportOpen(false);
            
            if (!isClient) return
            try {
              const reportedVideos = JSON.parse(localStorage.getItem("reportedVideos") || "[]") as string[];
              if (!reportedVideos.includes(videoId)) {
                reportedVideos.push(videoId);
                localStorage.setItem("reportedVideos", JSON.stringify(reportedVideos));
              }
            } catch (error) {
              console.error('Error storing reported video:', error);
            }
          }}
        />
      )}

      {isFeedbackOpen && (
        <FeedbackDialog
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSubmit={(reason) => {
            toast({
              description: "Thanks for your feedback",
              duration: 3000,
            });
            setIsFeedbackOpen(false);
            
            if (!isClient) return
            try {
              const hiddenVideos = JSON.parse(localStorage.getItem("hiddenVideos") || "[]") as string[];
              if (!hiddenVideos.includes(videoId)) {
                hiddenVideos.push(videoId);
                localStorage.setItem("hiddenVideos", JSON.stringify(hiddenVideos));
              }
            } catch (error) {
              console.error('Error storing hidden video:', error);
            }
          }}
        />
      )}
    </>
  );
};

export default MusicVideoCard;