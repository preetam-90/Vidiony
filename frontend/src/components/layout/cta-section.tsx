"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, ChevronRight, Users, Video } from "lucide-react";

interface CtaSectionProps {
  title?: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
}

export function CtaSection({ 
  title = "Ready to Get Started?",
  description = "Join millions of creators and viewers on Vidion. Start your journey today.",
  primaryCta = {
    text: "Start Creating",
    href: "/upload"
  },
  secondaryCta = {
    text: "Learn More",
    href: "/about"
  }
}: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-white/10">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container relative mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Join the Community
            </span>
          </div>
          
          {/* Title */}
          <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h2>
          
          {/* Description */}
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
          
          {/* Stats */}
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Users className="h-3 w-3" />
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">10M+</span> Creators
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Video className="h-3 w-3" />
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">5M+</span> Videos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1B+</span> Views
              </span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link href={primaryCta.href}>
              <Button 
                size="lg" 
                className="btn-cta gap-3 text-white hover:shadow-lg transition-all duration-200"
              >
                <Play className="h-4 w-4 fill-current" />
                {primaryCta.text}
              </Button>
            </Link>
            <Link href={secondaryCta.href}>
              <Button 
                size="lg" 
                variant="outline" 
                className="btn-secondary gap-3 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
              >
                {secondaryCta.text}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-8 flex justify-center items-center gap-6 text-xs text-muted-foreground">
            <span>🔒 Secure & Private</span>
            <span>•</span>
            <span>⚡ Lightning Fast</span>
            <span>•</span>
            <span>🌍 Global CDN</span>
          </div>
        </div>
      </div>
    </section>
  );
}