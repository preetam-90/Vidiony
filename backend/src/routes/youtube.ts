import { FastifyPluginAsync } from "fastify";
import { Innertube, UniversalCache } from "youtubei.js";

const youtubeRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  let yt: any = null;
  const getYt = async () => {
    if (!yt) {
      console.log("Initializing Innertube instance...");
      yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true
      });
    }
    return yt;
  };

  // Health check
  fastify.get("/", async () => {
    return { status: "youtube api active" };
  });

  fastify.get("/search", async (request, reply) => {
    const { q } = request.query as { q: string };
    if (!q) return reply.status(400).send({ error: "Missing query" });
    console.log("Searching for:", q);
    try {
      const client = await getYt();
      const results = await client.search(q);
      
      // Map and extract IDs carefully
      const mapped = results.results.map((item: any) => {
        const id = item.id || item.videoId || (item.video && item.video.id) || (item.id && typeof item.id === 'object' ? item.id.videoId : null);
        return {
          ...item,
          id: id
        };
      });
      
      reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return reply.send({ results: mapped.slice(0, 12) });
    } catch (err: any) {
      console.error("Search Error:", err);
      return reply.status(500).send({ error: "Search failed", details: err?.message });
    }
  });

  fastify.get("/trending", async (_request, reply) => {
    try {
      const client = await getYt();
      const trending = await client.getTrending();
      const mapped = trending.videos.map((v: any) => ({
        ...v,
        id: v.id || v.videoId
      }));
      reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
      return reply.send({ videos: mapped.slice(0, 10) });
    } catch (err: any) {
      console.error("Trending Error:", err);
      return reply.status(500).send({ error: "Trending failed", details: err?.message });
    }
  });

  fastify.get("/stream", async (request, reply) => {
    const { id } = request.query as { id: string };
    console.log("Stream request received for ID:", id);
    
    if (!id) return reply.status(400).send({ error: "Missing id parameter" });
    
    try {
      const client = await getYt();
      // Use getInfo for more detailed data including streaming formats
      const info = await client.getInfo(id);
      
      if (!info.playability_status || info.playability_status.status !== 'OK') {
        console.error("Playability check failed:", info.playability_status);
        return reply.status(403).send({ 
          error: `Video restricted: ${info.playability_status?.reason || 'Unknown reason'}` 
        });
      }

      // Try to find a format that has both video and audio
      // prioritize mp4 for best compatibility with <video> tag
      const format = info.chooseFormat({ 
        type: 'video+audio', 
        format: 'mp4',
        quality: 'best' 
      });
      
      if (!format || !format.url) {
        console.warn("No direct combined format found, trying any video+audio...");
        const fallbackFormat = info.chooseFormat({ type: 'video+audio' });
        if (!fallbackFormat || !fallbackFormat.url) {
          return reply.status(404).send({ error: "No direct streamable URL found for this video. It may require a DASH/HLS player." });
        }
        return reply.send({ url: fallbackFormat.url });
      }
      
      console.log("Success! Stream URL found.");
      return reply.send({ url: format.url });
    } catch (err: any) {
      console.error("Stream Route Error:", err);
      return reply.status(500).send({ error: "Stream fetch failed", details: err?.message });
    }
  });
};

export default youtubeRoutes;
