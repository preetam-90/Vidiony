"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Search, TrendingUp, PlayCircle, X } from "lucide-react";

const API_BASE = "http://localhost:4000/api/youtube";

function getText(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (val.text) return val.text;
    if (Array.isArray(val.runs)) return val.runs.map((run: any) => run.text).join("");
  }
  return String(val || "");
}

export default function YoutubeFeatures() {
  const [hasMounted, setHasMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string; url: string } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [features, setFeatures] = useState([
    {
      title: "Trending Videos",
      description: "Browse trending videos across countries.",
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />, 
      loading: true,
      data: [] as any[],
      error: ""
    }
  ]);

  // Prevent Hydration Mismatch
  useEffect(() => {
    setHasMounted(true);
    
    async function fetchTrending() {
      try {
        const res = await fetch(`${API_BASE}/trending`);
        if (!res.ok) throw new Error("Backend unreachable");
        const json = await res.json();
        setFeatures([{
          title: "Trending Videos",
          description: "Browse trending videos across countries.",
          icon: <TrendingUp className="h-8 w-8 text-blue-600" />, 
          loading: false, 
          data: (json.videos || []).slice(0, 4),
          error: ""
        }]);
      } catch (err) {
        setFeatures([{
          title: "Trending Videos",
          description: "Browse trending videos across countries.",
          icon: <TrendingUp className="h-8 w-8 text-blue-600" />, 
          loading: false, 
          data: [], 
          error: "Ensure backend is running on port 4000" 
        }]);
      }
    }
    fetchTrending();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setSearchResults(json.results || []);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (video: any) => {
    // Extensive search for video ID in YouTube.js result objects
    let videoId = null;

    if (typeof video === 'string') {
      videoId = video;
    } else if (video) {
      videoId = video.id || 
                video.videoId || 
                (video.id && typeof video.id === 'object' && video.id.videoId) ||
                (video.video && video.video.id) ||
                (video.endpoint && video.endpoint.payload && video.endpoint.payload.videoId) ||
                (video.navigation_endpoint && video.navigation_endpoint.payload && video.navigation_endpoint.payload.videoId);
    }
    
    // If it's an object (like from some YouTube.js versions), try to stringify it or get the property
    if (videoId && typeof videoId === 'object' && videoId.toString) {
      videoId = videoId.toString();
    }

    if (!videoId || typeof videoId !== 'string' || videoId === "[object Object]") {
      console.error("Failed to extract videoId from object:", video);
      alert("Could not identify a valid video ID. Please try another video.");
      return;
    }

    const idStr = String(videoId);
    setLoading(true);
    setSelectedVideo(null);

    try {
      const res = await fetch(`${API_BASE}/stream?id=${encodeURIComponent(idStr)}`);
      const json = await res.json();
      
      if (!res.ok) {
        alert(json.error || "Failed to fetch stream. This video might be restricted.");
        return;
      }

      if (json.url) {
        setSelectedVideo({ 
          id: idStr, 
          title: getText(video.title), 
          url: json.url 
        });
      } else {
        alert("No playable stream URL was found.");
      }
    } catch (err) {
      console.error("Playback error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getThumbnail = (item: any) => {
    if (!item) return null;
    const thumbs = item.thumbnails || item.thumbnail || (item.video && item.video.thumbnails);
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      return thumbs[thumbs.length - 1].url || thumbs[0].url;
    }
    if (thumbs && typeof thumbs === 'object' && thumbs.url) {
      return thumbs.url;
    }
    return null;
  };

  if (!hasMounted) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold">YouTube.js Features Demo</h2>
        <p className="mt-2 text-muted-foreground">Native playback powered by YouTube.js & Fastify</p>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10">
          <div className="relative w-full max-w-5xl bg-card rounded-3xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => { setSelectedVideo(null); setVideoError(null); }}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="aspect-video w-full bg-black relative">
              <video
                ref={videoRef}
                key={selectedVideo.url}
                src={selectedVideo.url}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                onError={(e) => {
                  console.error('Video element error', e);
                  setVideoError('Media failed to play. Check console/network for details.');
                }}
                onLoadedMetadata={() => {
                  setVideoError(null);
                  console.log('Video metadata loaded, attempting play');
                  const v = videoRef.current;
                  if (v) {
                    v.play().catch(err => {
                      console.warn('Autoplay blocked or play failed:', err);
                      setVideoError('Playback blocked or failed. Click play in the player controls.');
                    });
                  }
                }}
              />
              {/* Debug: show returned URL and any media error */}
              <div className="absolute left-3 bottom-3 bg-black/60 text-xs text-white p-2 rounded-md">
                <div className="mb-1">URL: <span className="break-all">{selectedVideo.url}</span></div>
                {videoError && <div className="text-rose-400">Error: {videoError}</div>}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{selectedVideo.title}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex items-center justify-center gap-2 mb-12 w-full max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-card/50 pl-10 pr-4 py-3 text-lg text-white placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Search and play YouTube videos..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Search"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {searchResults.map((item, idx) => {
            const thumbUrl = getThumbnail(item);
            return (
              <Card key={item.id || idx} className="group overflow-hidden rounded-2xl border-white/5 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Preview</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handlePlay(item)} className="p-3 bg-primary rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform">
                      <PlayCircle className="h-8 w-8" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm line-clamp-2 mb-2 text-white/90">{getText(item.title)}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">{getText(item.author?.name)}</span>
                    {item.duration && <Badge variant="secondary" className="text-[10px]">{getText(item.duration)}</Badge>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="rounded-2xl p-6 border-white/5 bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">{feature.icon}</div>
              <h3 className="font-bold">{feature.title}</h3>
            </div>
            
            {feature.loading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : feature.error ? (
              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">{feature.error}</div>
            ) : (
              <div className="space-y-4">
                {feature.data.map((video, vidx) => {
                  const thumbUrl = getThumbnail(video);
                  return (
                    <div key={video.id || vidx} className="group relative flex flex-col gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handlePlay(video)}>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">No Preview</div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs font-medium line-clamp-1">{getText(video.title)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
