"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePreload } from "@/contexts/PreloadContext";

interface LinkItem {
  name: string;
  path: string;
}

// Main navigation pages 
const mainPages: LinkItem[] = [
  { name: 'All', path: '/home' },
  { name: 'Trending', path: '/trending' },
  { name: 'Music', path: '/music' },
  { name: 'Movies', path: '/tmdb-movies' },
  { name: 'Shorts', path: '/immersive-shorts' },
  { name: 'Liked Videos', path: '/liked-videos' },
  { name: 'History', path: '/history' },
  { name: 'Watch Later', path: '/watch-later' },
];

// Video categories extracted from data
const categories: string[] = [
  'Music', 'Gaming', 'Movies', 'Flowcharts', 'Programming Patterns', 
  'Number Systems', 'Math Problems', 'News', 'Bit Manipulation', 
  'Complexity Analysis', 'Arrays', 'Array Algorithms', 'Matrix Algorithms',
  'Large Numbers', 'Data Structures', 'Search Algorithms',
  'Algorithm Problems', 'Strings', 'String Algorithms', 'String Conversion',
  'Pointers', 'Recursion', 'C++ Concepts', 'Linked Lists', 'Stacks', 'Stack Problems',
  'Education'
];

// Combine main pages and category pages
const allLinks: LinkItem[] = [...mainPages, ...categories.filter(c => c !== 'Music' && c !== 'Movies').map(c => ({
  name: c,
  path: `/category/${c.toLowerCase()}`
}))];

export default function CategoryBar() {
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isPagePreloaded } = usePreload();

  // Determine active category based on current path
  const getActiveItem = () => {
    // Check for exact path match first
    const mainPageMatch = mainPages.find(page => page.path === pathname);
    if (mainPageMatch) return mainPageMatch.name;
    
    // For category pages like /category/[category]
    const match = pathname.match(/\/category\/([^/]+)/);
    if (match) {
      const categorySlug = decodeURIComponent(match[1]).toLowerCase();
      // Find matching category (case insensitive)
      const matchedCategory = categories.find(
        cat => cat.toLowerCase() === categorySlug
      );
      return matchedCategory || null;
    }
    
    return null;
  };
  
  const activeItem = getActiveItem();

  // Check if arrows should be displayed
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // Handle scroll buttons
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 300; // Adjust as needed
    const container = scrollContainerRef.current;
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Add scroll event listener
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  return (
    <div className="relative w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center py-1 -mt-1">
      {showLeftArrow && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-background/80 shadow-sm h-7 w-7 sm:h-8 sm:w-8" 
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="flex items-center overflow-x-auto scrollbar-hide px-2 sm:px-4 md:px-6 gap-1.5 sm:gap-2 max-w-full h-full"
      >
        {allLinks.map((item, index) => {
          const isActive = item.name === activeItem;
          const isPreloaded = isPagePreloaded(item.path);
          
          return (
            <Link 
              key={index}
              href={item.path}
              data-item={item.name}
            >
              <Button 
                variant={isActive ? "default" : "secondary"} 
                size="sm" 
                className={`whitespace-nowrap text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1 h-7 sm:h-8 rounded-lg hover:bg-gray-700 ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100/10 text-gray-200'
                } ${
                  isPreloaded ? 'after:content-["✓"] after:ml-1 after:text-green-500 after:text-[10px] sm:after:text-xs' : ''
                }`}
              >
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
      
      {showRightArrow && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-background/80 shadow-sm h-7 w-7 sm:h-8 sm:w-8" 
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
} 
