import { NextResponse } from "next/server"

const PEERTUBE_INSTANCES = [
  { url: "https://framatube.org", name: "FramaTube" },
  { url: "https://tilvids.com", name: "TILvids" },
  { url: "https://peertube.fdn.fr", name: "FDN" },
  { url: "https://video.blender.org", name: "Blender" },
  { url: "https://dalek.zone", name: "Dalek Zone" },
  { url: "https://video.causa-arcana.com", name: "Causa Arcana" },
  { url: "https://peertube.cif.su", name: "CiF" },
  { url: "https://video.pizza.ynh.fr", name: "PizzaTube" },
  { url: "https://peer.adalta.social", name: "Ad Alta" },
  { url: "https://tube.fediverse.games", name: "Fediverse Games" },
  { url: "https://peertube.tv", name: "PeerTube.TV" },
]

const normalizeInstanceName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    || "default"

const formatPeerTubeDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const convertPeerTubeVideoToVideo = (video: any, instance: { url: string; name: string }) => {
  const thumbnail =
    video.thumbnailUrl ||
    video.previewUrl ||
    (video.thumbnailPath ? `${instance.url}${video.thumbnailPath}` : null) ||
    (video.previewPath ? `${instance.url}${video.previewPath}` : null)

  return {
    id: `peertube-${normalizeInstanceName(instance.name)}-${video.uuid}`,
    title: video.name,
    description: video.description || "",
    thumbnail: thumbnail || "/images/placeholder-poster.jpg",
    uploader: video.channel?.displayName || video.account?.displayName || "PeerTube",
    views: video.views ?? 0,
    likes: video.likes ?? 0,
    comments: video.comments ?? 0,
    uploadDate: video.publishedAt || video.createdAt || "",
    platform: `PeerTube - ${instance.name}`,
    category: "Videos",
    url: `/peertube/${video.uuid}?instance=${encodeURIComponent(instance.url)}`,
    duration:
      typeof video.duration === "number"
        ? formatPeerTubeDuration(video.duration)
        : video.duration || "0:00",
  }
}

const buildSearchUrl = (instanceUrl: string, query: string) =>
  `${instanceUrl}/api/v1/search/videos?search=${encodeURIComponent(query)}&limit=10`

export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.searchParams.get("q")?.trim()

  if (!query) {
    return NextResponse.json(
      {
        videos: [],
        total: 0,
        instancesQueried: 0,
        instancesSucceeded: 0,
      },
      { status: 400 },
    )
  }

  const results: any[] = []
  let instancesSucceeded = 0

  const responses = await Promise.allSettled(
    PEERTUBE_INSTANCES.map(async (instance) => {
      const res = await fetch(buildSearchUrl(instance.url, query), {
        headers: { Accept: "application/json" },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${instance.name}`)
      }

      const data = await res.json()
      const videos = (data.data || []).map((video: any) =>
        convertPeerTubeVideoToVideo(video, instance),
      )
      instancesSucceeded += 1

      results.push(...videos)
    }),
  )

  responses.forEach((result) => {
    if (result.status === "rejected") {
      console.error("PeerTube proxy error", result.reason)
    }
  })

  return NextResponse.json({
    videos: results,
    total: results.length,
    instancesQueried: PEERTUBE_INSTANCES.length,
    instancesSucceeded,
  })
}
