// Browser APIs that TypeScript's DOM library does not include yet.

interface EyeDropperResult {
  sRGBHex: string;
}

declare class EyeDropper {
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
}

interface Window {
  /** Present in Chromium-based browsers only. */
  EyeDropper?: typeof EyeDropper;
}
