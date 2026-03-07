"use client";

import { Users, Video, Heart, Globe, TrendingUp, Sparkles } from "lucide-react";

interface StatsBarProps {
  stats?: Stat[];
}

interface Stat {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const defaultStats: Stat[] = [
  {
    id: 'users',
    label: 'Active Users',
    value: '10M+',
    icon: <Users className="h-6 w-6" />,
    color: 'text-emerald-400'
  },
  {
    id: 'videos',
    label: 'Videos Uploaded',
    value: '5M+',
    icon: <Video className="h-6 w-6" />,
    color: 'text-blue-400'
  },
  {
    id: 'views',
    label: 'Total Views',
    value: '1B+',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'text-purple-400'
  },
  {
    id: 'countries',
    label: 'Countries',
    value: '190+',
    icon: <Globe className="h-6 w-6" />,
    color: 'text-cyan-400'
  },
  {
    id: 'likes',
    label: 'Likes Given',
    value: '50M+',
    icon: <Heart className="h-6 w-6" />,
    color: 'text-pink-400'
  }
];

export function StatsBar({ stats = defaultStats }: StatsBarProps) {
  return (
    <section className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border border-white/10">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="group text-center space-y-2"
            >
              {/* Animated icon */}
              <div className={`flex justify-center items-center w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`}>
                <div className={`p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              
              {/* Value with animation */}
              <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
              
              {/* Bottom accent */}
              <div className={`h-1 w-16 mx-auto bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full`}></div>
            </div>
          ))}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-4 left-4 w-2 h-2 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-0 animate-pulse"></div>
          <div className="absolute top-8 right-8 w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-4 left-1/2 w-1 h-1 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-0 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </section>
  );
}