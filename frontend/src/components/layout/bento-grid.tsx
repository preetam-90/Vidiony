"use client";

import { 
  Play, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Globe, 
  Sparkles, 
  Camera, 
  Code, 
  Heart, 
  Video, 
  Mic, 
  Gamepad2 
} from "lucide-react";

interface BentoGridProps {
  features?: Feature[];
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  size: 'small' | 'medium' | 'large';
  gradient?: string;
}

const defaultFeatures: Feature[] = [
  {
    id: 'ai-powered',
    title: 'AI-Powered Discovery',
    description: 'Smart recommendations powered by advanced machine learning algorithms to help you discover content you love.',
    icon: <Sparkles className="h-8 w-8" />,
    color: 'from-emerald-500 to-teal-400',
    size: 'large',
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-400/20'
  },
  {
    id: 'lightning-fast',
    title: 'Lightning Fast',
    description: 'Stream videos with zero buffering using our optimized CDN and adaptive streaming technology.',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-blue-500 to-cyan-400',
    size: 'medium',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-400/20'
  },
  {
    id: 'secure',
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade encryption and privacy controls.',
    icon: <Shield className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-400',
    size: 'medium',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-400/20'
  },
  {
    id: 'community',
    title: 'Community First',
    description: 'Connect with creators, comment, like, and build your audience in our vibrant community.',
    icon: <Users className="h-8 w-8" />,
    color: 'from-orange-500 to-red-400',
    size: 'small',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-red-400/20'
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Get detailed insights into your content performance with comprehensive analytics tools.',
    icon: <TrendingUp className="h-8 w-8" />,
    color: 'from-indigo-500 to-blue-400',
    size: 'small',
    gradient: 'bg-gradient-to-br from-indigo-500/20 to-blue-400/20'
  },
  {
    id: 'global',
    title: 'Global Reach',
    description: 'Reach audiences worldwide with our global content delivery network.',
    icon: <Globe className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-400',
    size: 'medium',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-400/20'
  },
  {
    id: 'creative-tools',
    title: 'Creative Tools',
    description: 'Built-in editing tools and effects to help you create stunning content.',
    icon: <Camera className="h-8 w-8" />,
    color: 'from-violet-500 to-purple-400',
    size: 'small',
    gradient: 'bg-gradient-to-br from-violet-500/20 to-purple-400/20'
  },
  {
    id: 'developer-friendly',
    title: 'Developer Friendly',
    description: 'Comprehensive APIs and SDKs for seamless integration with your applications.',
    icon: <Code className="h-8 w-8" />,
    color: 'from-sky-500 to-blue-400',
    size: 'small',
    gradient: 'bg-gradient-to-br from-sky-500/20 to-blue-400/20'
  }
];

export function BentoGrid({ features = defaultFeatures }: BentoGridProps) {
  const getGridClass = (size: string) => {
    switch (size) {
      case 'large': return 'lg:col-span-2 lg:row-span-2';
      case 'medium': return 'lg:col-span-1 lg:row-span-1';
      case 'small': return 'lg:col-span-1 lg:row-span-1';
      default: return 'lg:col-span-1 lg:row-span-1';
    }
  };

  const getAspectRatio = (size: string) => {
    switch (size) {
      case 'large': return 'aspect-[2/1]';
      case 'medium': return 'aspect-square';
      case 'small': return 'aspect-square';
      default: return 'aspect-square';
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Why Choose Vidion?</h2>
        <p className="mt-2 text-muted-foreground">
          Experience the future of video streaming
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className={`bento-card group relative overflow-hidden rounded-2xl border border-white/10 bg-card/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20 ${getGridClass(feature.size)} ${getAspectRatio(feature.size)}`}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Floating elements */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} opacity-20 blur-xl`}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-all duration-300 delay-${i * 100}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="relative mt-4">
                <div className={`w-full h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}