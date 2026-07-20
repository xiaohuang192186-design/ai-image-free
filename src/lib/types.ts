/** Shared generation result across providers */
export interface GenerationResult {
  imageBytes: Buffer;
  seed: number;
  /** which backend produced the image */
  provider?: "hf" | "dashscope";
  /** model id when known */
  model?: string;
}
