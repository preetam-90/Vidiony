import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VideoCardData } from "@/lib/api";

// ── Rotating query pools ─────────────────────────────────────────────────────
// Each "page" fires ONE of these queries.  A fresh search hits YouTube and
// returns up to 20 videos we haven't seen yet.

const ALL_QUERIES = [
  "trending technology 2025",
  "artificial intelligence deep learning tutorial",
  "programming best practices modern development",
  "cloud computing kubernetes devops 2025",
  "web development react typescript nextjs",
  "machine learning neural networks python",
  "devops ci cd pipelines automation",
  "cybersecurity penetration testing 2025",
  "system design microservices architecture",
  "data science analytics visualization python",
  "software engineering patterns principles",
  "open source projects javascript 2025",
  "database postgresql optimization indexing",
  "api design rest graphql grpc",
  "linux terminal bash scripting tips",
  "performance optimization web frontend",
  "network security zero trust model",
  "deep learning computer vision pytorch",
  "backend nodejs fastify express 2025",
  "frontend svelte vue angular frameworks",
  "rust systems programming tutorial",
  "golang concurrency microservices",
  "docker container orchestration",
  "aws azure gcp cloud services 2025",
  "computer science algorithms data structures",
];

const CATEGORY_QUERIES: Record<string, string[]> = {
  ai: [
    "artificial intelligence 2025 tutorial",
    "machine learning python tensorflow",
    "deep learning neural networks explained",
    "large language models GPT transformers",
    "computer vision object detection yolo",
    "natural language processing nlp 2025",
    "reinforcement learning game AI",
    "AI ethics responsible development",
  ],
  programming: [
    "programming tutorial beginner 2025",
    "clean code best practices refactoring",
    "design patterns software engineering",
    "functional programming javascript",
    "test driven development tdd bdd",
    "code review techniques productivity",
    "algorithms problem solving leetcode",
    "open source contributing github",
  ],
  "system-design": [
    "system design interview preparation",
    "microservices architecture patterns",
    "distributed systems scalability",
    "event driven architecture kafka",
    "database sharding replication",
    "load balancing caching strategies",
    "API gateway design patterns",
    "high availability fault tolerance",
  ],
  cybersecurity: [
    "cybersecurity ethical hacking 2025",
    "penetration testing tools techniques",
    "network security monitoring detection",
    "web application security OWASP",
    "incident response forensics",
    "zero trust security model",
    "vulnerability assessment scanning",
    "security automation DevSecOps",
  ],
  cloud: [
    "cloud computing aws tutorial 2025",
    "kubernetes container orchestration",
    "terraform infrastructure as code",
    "serverless functions lambda azure",
    "cloud cost optimization strategies",
    "multi cloud hybrid architecture",
    "cloud native microservices deployment",
    "GCP BigQuery data engineering",
  ],
  "data-science": [
    "data science python pandas tutorial",
    "machine learning scikit-learn 2025",
    "data visualization matplotlib seaborn",
    "SQL analytics data warehousing",
    "apache spark big data processing",
    "statistics probability data analysis",
    "feature engineering model selection",
    "data pipeline ETL workflow",
  ],
  devops: [
    "devops practices automation 2025",
    "CI CD pipeline github actions",
    "docker kubernetes deployment",
    "monitoring observability prometheus grafana",
    "ansible terraform configuration management",
    "SRE reliability engineering practices",
    "gitops flux argocd deployment",
    "platform engineering developer experience",
  ],
  gaming: [
    "gaming highlights best moments 2025",
    "esports tournament competitive gaming",
    "game review walkthrough gameplay",
    "indie games hidden gems 2025",
    "gaming setup PC build guide",
    "speedrun world record gaming",
    "game development unity unreal",
    "retro gaming classic consoles",
  ],
  music: [
    "music hits trending songs 2025",
    "music production beat making tutorial",
    "live concert performance 2025",
    "guitar piano lessons tutorial",
    "music theory composition tips",
    "album review music analysis",
    "indie music discovery 2025",
    "hip hop electronic music production",
  ],
  podcasts: [
    "podcast interview technology 2025",
    "podcast startup business growth",
    "podcast science discovery",
    "podcast philosophy debate",
    "podcast comedy entertainment",
    "podcast true crime mystery",
  ],
  news: [
    "breaking news world today 2025",
    "technology news AI updates",
    "science news discovery 2025",
    "business news economy update",
    "geopolitics world affairs analysis",
    "climate environment news 2025",
  ],
  live: [
    "live stream coding programming",
    "live stream gaming esports",
    "live music concert performance",
    "live news broadcast 2025",
    "live tutorial workshop learning",
  ],
  science: [
    "science discovery space exploration 2025",
    "physics quantum mechanics explained",
    "biology evolution genetics",
    "chemistry experiments lab",
    "astronomy planets universe",
    "engineering innovation technology",
  ],
  sports: [
    "sports highlights best plays 2025",
    "football soccer goals highlights",
    "basketball NBA highlights",
    "combat sports MMA boxing",
    "extreme sports adventure",
    "sports analysis tactics",
  ],
  cooking: [
    "cooking recipe tutorial easy 2025",
    "baking dessert recipe homemade",
    "chef professional technique",
    "world cuisine international food",
    "healthy meal prep ideas",
    "street food tour travel",
  ],
  film: [
    "movie trailer review 2025",
    "filmmaking cinematography technique",
    "film analysis movie essay",
    "documentary best 2025",
    "animation studio behind scenes",
    "TV series review recommendation",
  ],
  education: [
    "education online learning 2025",
    "mathematics explained tutorial",
    "history documentary civilization",
    "language learning tips technique",
    "study productivity tips students",
    "science experiment education kids",
  ],
  fitness: [
    "fitness workout routine 2025",
    "strength training muscle building",
    "yoga meditation mindfulness",
    "running marathon training",
    "home workout no equipment",
    "nutrition diet health tips",
  ],
  travel: [
    "travel vlog adventure 2025",
    "travel guide best destinations",
    "budget travel tips backpacking",
    "food travel tour world",
    "luxury travel resort hotel",
    "van life digital nomad",
  ],
  design: [
    "graphic design tutorial 2025",
    "UI UX design figma",
    "web design trends modern",
    "logo branding identity design",
    "3D design blender tutorial",
    "motion graphics animation",
  ],
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useInfiniteFeed(category = "all") {
  const queries = category === "all" ? ALL_QUERIES : (CATEGORY_QUERIES[category] ?? [
    // Generic fallback for unknown categories
    `${category} tutorial 2025`,
    `${category} best practices`,
    `${category} advanced techniques`,
    `${category} projects examples`,
  ]);

  return useInfiniteQuery({
    queryKey: ["infinite-feed", category],
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0, // index into `queries` array

    queryFn: async ({ pageParam }): Promise<{ videos: VideoCardData[]; nextIndex: number }> => {
      const idx = pageParam as number;
      const query = queries[idx];

      if (!query) return { videos: [], nextIndex: -1 };

      const result = await api.search(query);
      return { videos: result.videos ?? [], nextIndex: idx + 1 };
    },

    getNextPageParam: (lastPage) => {
      // Stop if the last fetch had no videos, or we've exhausted all queries
      if (!lastPage.videos.length) return undefined;
      if (lastPage.nextIndex >= queries.length) return undefined;
      return lastPage.nextIndex;
    },
  });
}
