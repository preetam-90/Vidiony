"use client";

import React from "react";

interface VideoHoverPreviewProps {
  videoId: string;
  thumbnail: string;
  title?: string;
  className?: string;
  previewQuality?: string;
  children?: React.ReactNode;
}

// Legacy placeholder: autoplay previews have been removed. This component
// now renders a static thumbnail and any children overlays. Kept so
// imports don't break if other files still reference it.
export default function VideoHoverPreview({ thumbnail, title, className = "", children }: VideoHoverPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      <img src={thumbnail} alt={title ?? ""} className="object-cover w-full h-full" draggable={false} />
      {children}
    </div>
  );
}
