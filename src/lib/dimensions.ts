/**
 * Shared image dimensions — aligned with imagefree.net public UI.
 * Multiples of 64 where practical for DiT models.
 */

export const DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
} as const;

export const VALID_RATIOS = Object.keys(DIMENSIONS) as AspectRatio[];
export type AspectRatio = keyof typeof DIMENSIONS;

export function ratioLabel(ratio: AspectRatio): string {
  const d = DIMENSIONS[ratio];
  return `${ratio} · ${d.width}×${d.height}`;
}
