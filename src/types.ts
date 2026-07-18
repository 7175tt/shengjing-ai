export const STORY_STYLES = ["自動判讀", "忠實原文", "電影感", "溫柔細膩", "克制敘事"] as const;

export type StoryStyle = typeof STORY_STYLES[number];

export function normalizeStoryStyle(value: unknown): StoryStyle {
  return STORY_STYLES.includes(value as StoryStyle) ? value as StoryStyle : "自動判讀";
}

export type NarrativeMood = "calm" | "sorrow" | "dark" | "crisis" | "rise" | "triumph";

export type NarrationProvider = "system" | "openai" | "elevenlabs" | "minimax";

export interface NarrationSettings {
  provider: NarrationProvider;
  autoFallback: boolean;
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
