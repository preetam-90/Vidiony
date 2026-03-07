"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, ChevronRight } from "lucide-react";

interface HeroSectionProps {
  featuredVideo?: {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    author: {
      name: string;
      avatar: string;
      verified?: boolean;
    };
    category?: string;
  };
}

export function HeroSection({ featuredVideo }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent animate-grid-drift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(34,197,94,0.1),transparent_50%)] animate-pulse-glow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.1),transparent_40%)] animate-float"></div>
      </div>
      
      <div className="container relative mx-auto px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Next Generation Video Platform
              </span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discover & Share{" "}
              <span className="gradient-text">
                Amazing Videos
              </span>
            </h1>
            
            <p className="max-w-lg text-lg text-muted-foreground">
              Join millions of creators and viewers on Vidion. Stream, share, and discover 
              content in the most beautiful video experience.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/upload">
                <Button 
                  size="lg" 
                  className="btn-cta gap-2 text-white hover:shadow-lg transition-all duration-200"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Watching
                </Button>
              </Link>
              <Link href="/explore">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="btn-secondary gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                >
                  Explore
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">10M+</span> Users
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.625 7.589c-.293-.455-.857-.642-1.362-.463l-4.375 1.562a1.326 1.326 0 0 1-.988-.003L12.407 5.84c-.506-.193-1.099.028-1.385.494-.287.466-.263 1.074.057 1.488l2.857 3.694c.16.207.38.36.62.433l4.375 1.562c.506.18 1.099-.028 1.385-.494.287-.466.263-1.074-.057-1.488l-2.857-3.694a1.326 1.326 0 0 1-.245-.356z" />
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">5M+</span> Videos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">1B+</span> Views
                </span>
              </div>
            </div>
          </div>
          
          {/* Featured Video Card */}
          <div className="relative">
            {featuredVideo ? (
              <Link href={`/video/${featuredVideo.id}`} className="group">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/50 p-1 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20">
                  <div className="relative aspect-video overflow-hidden rounded-xl">
                    <Image
                      src={featuredVideo.thumbnail}
                      alt={featuredVideo.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-sm font-medium text-white hover:bg-primary">
                        {featuredVideo.category || 'Featured'}
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">
                        {featuredVideo.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          {featuredVideo.author.name}
                        </span>
                        {featuredVideo.author.verified && (
                          <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span>•</span>
                        <span>{featuredVideo.duration}</span>
                      </div>
                    </div>
                    <div className="absolute right-4 top-4">
                      <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-white/90 hover:bg-white transition-all duration-200"
                      >
                        <Play className="ml-1 h-5 w-5 fill-primary text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="aspect-video animate-pulse rounded-2xl bg-muted"></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}