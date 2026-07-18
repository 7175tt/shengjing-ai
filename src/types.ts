export const STORY_STYLES = ["自動判讀", "忠實原文", "電影感", "溫柔細膩", "克制敘事"] as const;

export type StoryStyle = typeof STORY_STYLES[number];

export const STORY_STYLE_DESCRIPTIONS: Record<StoryStyle, string> = {
  "自動判讀": "依原文情緒自動決定分幕、張力、轉場與旁白節奏。",
  "忠實原文": "降低額外渲染，讓文字與對話本身主導聲音表現。",
  "電影感": "放大戲劇轉折、動態與配樂起伏，重要場景更有推進感。",
  "溫柔細膩": "放慢語速與轉場，降低配樂侵入感，保留情感呼吸。",
  "克制敘事": "收斂情緒與音樂音量，以冷靜、留白的方式呈現。",
};

export function normalizeStoryStyle(value: unknown): StoryStyle {
  return STORY_STYLES.includes(value as StoryStyle) ? value as StoryStyle : "自動判讀";
}

export type NarrativeMood = "calm" | "sorrow" | "dark" | "crisis" | "rise" | "triumph";

export type NarrationProvider = "system" | "openai" | "elevenlabs" | "minimax";

export type OpenAIVoice = "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer" | "verse" | "marin" | "cedar";

export interface NarrationSettings {
  provider: NarrationProvider;
  autoFallback: boolean;
  openAiVoice: OpenAIVoice;
  speed: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  author: string;
  file: string;
  moods: NarrativeMood[];
  tags: string[];
  license: string;
  sourceUrl: string;
  storageProvider?: "local" | "supabase" | "r2";
  objectKey?: string;
  durationSeconds?: number;
}

export interface SceneCue {
  id: string;
  index: number;
  title: string;
  text: string;
  startOffset: number;
  endOffset: number;
  mood: NarrativeMood;
  moodLabel: string;
  narrativeFunction: string;
  valence: number;
  arousal: number;
  tension: number;
  musicTrackId: string;
  musicLevel: number;
  transitionType: "fade" | "crossfade" | "swell" | "cut";
  transitionLabel: string;
  transitionSeconds: number;
  narrationRate: number;
  reason: string;
  matchedKeywords: string[];
}

export interface StoryProject {
  id: string;
  title: string;
  body: string;
  style: StoryStyle;
  cues: SceneCue[];
  createdAt: string;
  updatedAt: string;
  source: "local" | "cloud";
}

export type AnalysisMode = "local" | "cloud";
