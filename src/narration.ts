import type { NarrativeMood, NarrationProvider, NarrationSettings, OpenAIVoice } from "./types";

const SETTINGS_KEY = "shengjing-ai-narration-v3";

export const NARRATION_PROVIDERS: Array<{
  id: NarrationProvider;
  name: string;
  model: string;
  note: string;
  accent: string;
  cloud: boolean;
}> = [
  { id: "openai", name: "OpenAI", model: "GPT-4o mini TTS", note: "可精準指揮語氣、節奏與情緒", accent: "可指示台灣華語", cloud: true },
  { id: "system", name: "裝置語音", model: "瀏覽器內建", note: "免設定的保底聲音", accent: "依裝置而定", cloud: false },
  { id: "elevenlabs", name: "ElevenLabs", model: "Eleven v3", note: "戲劇張力與多語情緒表現", accent: "多語中文", cloud: true },
  { id: "minimax", name: "MiniMax", model: "Speech 2.8 HD", note: "中文韻律與讀音控制完整", accent: "標準華語", cloud: true },
];

export const OPENAI_VOICE_OPTIONS: Array<{
  id: OpenAIVoice;
  name: string;
  tone: string;
  recommended?: boolean;
}> = [
  { id: "cedar", name: "Cedar", tone: "偏低沉 · 沉穩厚實", recommended: true },
  { id: "marin", name: "Marin", tone: "偏明亮 · 自然柔和", recommended: true },
  { id: "onyx", name: "Onyx", tone: "偏低沉 · 深厚有力" },
  { id: "ash", name: "Ash", tone: "偏低沉 · 清楚直接" },
  { id: "echo", name: "Echo", tone: "偏低沉 · 溫暖敘事" },
  { id: "ballad", name: "Ballad", tone: "偏低沉 · 柔和抒情" },
  { id: "coral", name: "Coral", tone: "偏明亮 · 親切鮮明" },
  { id: "nova", name: "Nova", tone: "偏明亮 · 活潑清楚" },
  { id: "shimmer", name: "Shimmer", tone: "偏明亮 · 輕柔細膩" },
  { id: "alloy", name: "Alloy", tone: "中性 · 平衡自然" },
  { id: "sage", name: "Sage", tone: "中性 · 沉著清晰" },
  { id: "fable", name: "Fable", tone: "中性 · 故事感" },
  { id: "verse", name: "Verse", tone: "中性 · 節奏清楚" },
];

export const VOICE_LAB_SAMPLES: Array<{ id: string; title: string; function: string; mood: NarrativeMood; text: string }> = [
  {
    id: "everyday", title: "日常對話", function: "自然、親近，保留說話節奏", mood: "calm",
    text: "午後的咖啡店只剩幾張空桌。她把窗邊的位置讓給剛進門的老先生，笑著說：「我其實也正想起來走走。」窗外的雨還在下，店裡卻忽然暖了一些。",
  },
  {
    id: "suspense", title: "懸疑", function: "克制而緊繃，不靠吼叫", mood: "dark",
    text: "電梯停在十三樓，門開了，外面卻一盞燈也沒有。林安明明記得這棟大樓只有十二層。她沒有走出去，只聽見長廊深處傳來第二個人的呼吸聲。",
  },
  {
    id: "emotion", title: "細膩情感", function: "溫柔克制，讓情緒留在句尾", mood: "sorrow",
    text: "整理外婆的房間時，她在抽屜裡找到一張沒寄出的明信片。上面只寫了一句話：等你回來，我們就去看海。她讀了很久，然後把明信片放進自己的口袋。",
  },
  {
    id: "action", title: "快速行動", function: "節奏加快，仍保持清晰", mood: "crisis",
    text: "警鈴響起的同時，封鎖門開始下降。陳欣把資料碟拋給隊友，轉身滑過最後一道縫隙。身後傳來金屬撞擊的巨響，他們沒有停下，因為倒數只剩十二秒。",
  },
];

export function loadNarrationSettings(): NarrationSettings {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as NarrationSettings | null;
    if (value && NARRATION_PROVIDERS.some((provider) => provider.id === value.provider)) {
      const openAiVoice = OPENAI_VOICE_OPTIONS.some((voice) => voice.id === value.openAiVoice) ? value.openAiVoice : "cedar";
      const parsedSpeed = Number(value.speed ?? 1);
      const speed = Number.isFinite(parsedSpeed) ? Math.min(1.3, Math.max(0.7, parsedSpeed)) : 1;
      return { provider: value.provider, autoFallback: value.autoFallback !== false, openAiVoice, speed };
    }
  } catch { /* use safe defaults */ }
  return { provider: "openai", autoFallback: true, openAiVoice: "cedar", speed: 1 };
}

export function saveNarrationSettings(settings: NarrationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function providerLabel(provider: NarrationProvider) {
  return NARRATION_PROVIDERS.find((item) => item.id === provider)?.name ?? provider;
}
