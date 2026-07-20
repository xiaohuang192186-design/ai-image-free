/**
 * Shared image dimensions for AI generation.
 * Single source of truth — used by both hf.ts and page.tsx.
 * All dimensions are multiples of 64 (DiT/UNet requirement).
 */

export const DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "16:9": { width: 1152, height: 648 },
  "9:16": { width: 648,  height: 1152 },
  "4:3":  { width: 1024, height: 768 },
  "3:4":  { width: 768,  height: 1024 },
} as const;

export const VALID_RATIOS = Object.keys(DIMENSIONS) as AspectRatio[];
export type AspectRatio = keyof typeof DIMENSIONS;

/** Get display label for a ratio */
export function ratioLabel(ratio: AspectRatio): string {
  return ratio;
}
