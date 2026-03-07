"use client";

interface ChannelCardProps {
  name: string;
  avatar: string;
  subscribers: string;
}

export function ChannelCard({ name, avatar, subscribers }: ChannelCardProps) {
  return (
    <div className="group flex flex-col items-center gap-3 rounded-xl bg-[#181818] p-5 transition-all duration-300 hover:bg-[#222] hover:translate-y-[-2px] hover:shadow-lg hover:shadow-violet-500/5">
      {/* Avatar */}
      <div className="relative">
        <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/10 transition-all group-hover:ring-violet-500/50">
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-violet-500/20 text-lg font-bold text-violet-300">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 ring-2 ring-[#181818] flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-white/90 text-center line-clamp-1">{name}</h3>

      {/* Subscribers */}
      <p className="text-xs text-white/40">{subscribers}</p>

      {/* Subscribe button */}
      <button className="rounded-full bg-violet-600 px-5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20">
        Subscribe
      </button>
    </div>
  );
}
