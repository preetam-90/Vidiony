/**
 * playerFunctions — module-level mutable ref for non-serializable player callbacks.
 *
 * These cannot live inside Zustand because they are functions/closures, not
 * plain data.  The watch page writes to this object and GlobalPlayer reads
 * from it when it needs storyboard preview sprites, etc.
 */

import type { PreviewSprite } from "@/components/VideoPlayer/ProgressBar";

export const playerFunctions: {
  getPreviewSprite: ((time: number) => PreviewSprite | null) | null;
} = {
  getPreviewSprite: null,
};
