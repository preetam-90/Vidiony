import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const CATEGORY_QUERIES: Record<string, string> = {
  programming: "programming tutorial coding 2025",
  ai: "artificial intelligence machine learning deep learning",
  engineering: "software engineering best practices",
  hardware: "hardware engineering electronics computer build",
  startups: "startup founder tech entrepreneurship venture",
  cybersecurity: "cybersecurity ethical hacking network security defense",
  cloud: "cloud computing aws azure kubernetes devops",
  "system-design": "system design interview architecture scalability",
  "tech-news": "tech news latest technology update 2025",
  "data-science": "data science analytics python pandas numpy",
  devops: "devops ci cd docker kubernetes infrastructure automation",
  shorts: "programming shorts coding tutorial quick tips",
};

export function useCategoryVideos(category: string) {
  const query = CATEGORY_QUERIES[category] ?? category;

  return useQuery({
    queryKey: ["category-videos", category],
    queryFn: () => api.search(query),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.videos,
    enabled: !!category,
  });
}
