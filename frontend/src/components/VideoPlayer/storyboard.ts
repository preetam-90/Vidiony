import type { StoryboardData } from "@/lib/api";

export interface StoryboardLevel {
  index: number;
  baseUrl: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  columns: number;
  rows: number;
  intervalMs: number;
  name: string;
  signature: string;
}

export interface StoryboardPreviewSprite {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  backgroundPosition: string;
  backgroundSize: string;
  alt: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function parseStoryboardSpec(spec: string | null | undefined): StoryboardLevel[] {
  if (!spec) return [];

  const segments = spec.split("|").map((part) => part.trim()).filter(Boolean);
  if (segments.length < 2) return [];

  const baseTemplate = segments[0];

  return segments.slice(1).flatMap((segment, index) => {
    const [dimensions, signature = ""] = segment.split("#M$");
    const [width, height, frameCount, columns, rows, intervalMs, name = "default"] = dimensions.split("#");

    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    const parsedFrameCount = Number(frameCount);
    const parsedColumns = Number(columns);
    const parsedRows = Number(rows);
    const parsedIntervalMs = Number(intervalMs);

    if (
      !Number.isFinite(parsedWidth) ||
      !Number.isFinite(parsedHeight) ||
      !Number.isFinite(parsedFrameCount) ||
      !Number.isFinite(parsedColumns) ||
      !Number.isFinite(parsedRows) ||
      !Number.isFinite(parsedIntervalMs) ||
      parsedWidth <= 0 ||
      parsedHeight <= 0 ||
      parsedFrameCount <= 0 ||
      parsedColumns <= 0 ||
      parsedRows <= 0
    ) {
      return [];
    }

    return [{
      index,
      baseUrl: baseTemplate,
      frameWidth: parsedWidth,
      frameHeight: parsedHeight,
      frameCount: parsedFrameCount,
      columns: parsedColumns,
      rows: parsedRows,
      intervalMs: parsedIntervalMs,
      name,
      signature,
    } satisfies StoryboardLevel];
  });
}

function levelsFromStoryboardData(
  storyboard: StoryboardData | null | undefined,
  duration: number
): StoryboardLevel[] {
  if (!storyboard?.templateUrl) return [];

  const derivedInterval = storyboard.thumbnailCount > 0
    ? Math.max(1000, Math.floor((duration * 1000) / storyboard.thumbnailCount))
    : 1000;

  return [{
    index: 0,
    baseUrl: storyboard.templateUrl,
    frameWidth: storyboard.thumbnailWidth,
    frameHeight: storyboard.thumbnailHeight,
    frameCount: storyboard.thumbnailCount,
    columns: storyboard.columns,
    rows: storyboard.rows,
    intervalMs: storyboard.interval > 0 ? storyboard.interval : derivedInterval,
    name: "default",
    signature: "",
  }];
}

export function createStoryboardPreviewResolver(
  spec: string | null | undefined,
  duration: number,
  storyboard?: StoryboardData | null
) {
  const levels = parseStoryboardSpec(spec);
  const fallbackLevels = levels.length > 0 ? levels : levelsFromStoryboardData(storyboard, duration);
  if (fallbackLevels.length === 0 || !Number.isFinite(duration) || duration <= 0) {
    return () => null;
  }

  const level = [...fallbackLevels]
    .sort((a, b) => (b.frameWidth * b.frameHeight) - (a.frameWidth * a.frameHeight))
    .find((candidate) => candidate.frameWidth <= 320 && candidate.frameHeight <= 180)
    ?? levels[0];

  const framesPerSheet = level.columns * level.rows;

  return (time: number): StoryboardPreviewSprite | null => {
    const clampedTime = clamp(time, 0, duration);
    const frameIndex = clamp(
      Math.floor((clampedTime * 1000) / Math.max(level.intervalMs, 1)),
      0,
      Math.max(level.frameCount - 1, 0)
    );

    const sheetIndex = Math.floor(frameIndex / framesPerSheet);
    const frameWithinSheet = frameIndex % framesPerSheet;
    const column = frameWithinSheet % level.columns;
    const row = Math.floor(frameWithinSheet / level.columns);
    const imageUrl = level.baseUrl
      .replace(/\$L/g, String(level.index))
      .replace(/\$N/g, String(sheetIndex))
      .replace(/\$M/g, level.signature);

    return {
      imageUrl,
      frameWidth: level.frameWidth,
      frameHeight: level.frameHeight,
      backgroundPosition: `${(-column * level.frameWidth)}px ${(-row * level.frameHeight)}px`,
      backgroundSize: `${level.columns * level.frameWidth}px ${level.rows * level.frameHeight}px`,
      alt: `Preview at ${formatTime(clampedTime)}`,
    };
  };
}
