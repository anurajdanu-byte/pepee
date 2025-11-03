
export interface ImageResult {
  base64: string;
  mimeType: string;
  url: string;
}

export type ProcessOperation = 'resketch' | 'enhance' | 'upscale' | 'thinkingResketch' | 'edit';
