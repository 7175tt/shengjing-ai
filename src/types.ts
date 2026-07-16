export type StoryStyle = "逆境再起" | "英雄征途" | "懸疑暗湧" | "克制敘事";

export type NarrativeMood = "calm" | "sorrow" | "dark" | "crisis" | "rise" | "triumph";

export interface MusicTrack {
  id: string;
  title: string;
  author: string;
  file: string;
  moods: NarrativeMood[];
  tags: string[];
  license: "CC0";
  sourceUrl: string;
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
