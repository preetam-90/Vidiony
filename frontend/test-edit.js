const fs = require('fs');

const path = 'src/app/explore/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Add imports
content = content.replace('import { useState } from "react";', 'import { useState, useRef } from "react";\nimport Autoplay from "embla-carousel-autoplay";\nimport {\n  Carousel,\n  CarouselContent,\n  CarouselItem,\n  CarouselNext,\n  CarouselPrevious,\n} from "@/components/ui/carousel";');

// Replace trending section
const trendingStart = content.indexOf('<section className="mb-10">');
// Find the end of the "More Trending" section. Wait, there are two sections.
// First section is trending (lines 81 to 140). Second is "More Trending" (142 to 175).
const categoryStart = content.indexOf('{CATEGORIES.map((category) => (');

const newTrending = `        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Trending Now
            </h2>
          </div>

          {trendingLoading ? (
            <HeroSkeleton />
          ) : trendingVideos.length > 0 ? (
            <TrendingCarousel videos={trendingVideos.slice(0, 10)} />
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-2xl bg-[#181818] text-white/40">
              No trending videos available
            </div>
          )}
        </section>

        `;

content = content.slice(0, trendingStart) + newTrending + content.slice(categoryStart);

// Add the TrendingCarousel component
const componentStart = content.indexOf('function CategorySection');

const trendingCarouselComp = `function TrendingCarousel({ videos }: { videos: any[] }) {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full relative group"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent className="-ml-4">
        {videos.map((video, index) => (
          <CarouselItem 
            key={video.videoId} 
            className="pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <div className="p-1">
              <Link
                href={\`/watch/\${video.videoId}\`}
                className="group/card relative block overflow-hidden rounded-2xl bg-[#181818] aspect-video"
              >
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/80 text-white font-bold px-3 py-1 rounded-full text-sm">
                  #{index + 1}
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                  <Play className="w-12 h-12 text-white fill-white drop-shadow-md" />
                </div>

                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title || "Video"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-indigo-900/50" />
                )}
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(video.duration)}
                  </div>
                )}
                
                {/* Gradient overlay for text legibility */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm lg:text-base">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="truncate">{video.channelName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="shrink-0">{formatViewCount(video.viewCount)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      
      <CarouselPrevious className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 -left-4 lg:-left-12 bg-[#181818] border-white/10 hover:bg-[#282828] hover:text-white text-white/70" />
      <CarouselNext className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 -right-4 lg:-right-12 bg-[#181818] border-white/10 hover:bg-[#282828] hover:text-white text-white/70" />
    </Carousel>
  );
}

`;

content = content.slice(0, componentStart) + trendingCarouselComp + content.slice(componentStart);

fs.writeFileSync(path, content);
