export interface ExtractedContent {
  text: string;
  isProcessing: boolean;
  error?: string;
}

export interface AudioContent {
  url: string; // Blob URL
  isGenerating: boolean;
  error?: string;
}

export enum ProcessingMode {
  PRECISION = 'PRECISION', // Uses Gemini 3 Pro (Thinking)
  FAST = 'FAST', // Uses Flash Lite (Hypothetical fallback or for summaries)
}

export interface AppState {
  imageSrc: string | null;
  extraction: ExtractedContent;
  audio: AudioContent;
  summary: string | null;
  isSummarizing: boolean;
}