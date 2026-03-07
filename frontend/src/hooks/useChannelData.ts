import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useChannelData(channelId: string) {
  return useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => api.getChannel(channelId),
    staleTime: 10 * 60 * 1000,
    enabled: !!channelId,
    select: (data) => data.channel,
  });
}
