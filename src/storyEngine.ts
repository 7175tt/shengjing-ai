import type { MusicTrack, NarrativeMood, SceneCue, StoryStyle } from "./types";

export const DEMO_STORY = `北境的雨下了整整七日。昔日被稱為「白狼」的將軍陸沉，如今披著破舊斗篷，獨自走回焚毀的故城。三年前，他在黑石谷敗給帝國鐵騎，部眾死傷殆盡，連佩劍也折在敵將腳下。城門邊的孩子不認得他，老人卻低下眼睛，像看見一段不願提起的往事。

夜裡，帝國的號角再次從山外傳來。斥候帶回消息，敵軍天亮前就會抵達，而城中只剩數百名疲憊的守衛。議事廳裡沒有人敢看陸沉，眾人記得他的失敗，也記得那場失敗帶走多少親人。有人勸他趁黑離開，至少還能保住性命。

陸沉走進廢棄的鑄劍房，在灰燼裡找到老師留下的半截劍柄。牆上仍刻著少年時的誓言：劍可以折，守護之心不能。爐火早已熄滅，他卻彷彿聽見昔日同袍的笑聲。良久，他抬起頭，把斷劍重新綁在手上。

黎明前，陸沉登上城牆。他沒有許諾勝利，只說自己會站在第一個倒下的位置。沉默的守衛一個接一個舉起長槍，鐵匠帶來剛鑄好的箭頭，連城門邊的老人也敲響戰鼓。第一道晨光越過山脊時，整座城像從漫長的冬眠中醒來。

敵軍撞開外門，黑色洪流湧進狹道。陸沉迎著箭雨衝下石階，以斷劍架住敵將的長刀。那一瞬間，他不再是等待原諒的敗軍之將，而是替身後每一個人爭取明天的守門者。戰鼓越來越快，城牆上的旗幟在風中重新展開。

正午鐘聲響起時，帝國軍開始後退。陸沉沒有追擊，只站在城門前，看著雲層裂開，陽光落在滿地泥水與殘甲之上。孩子們第一次喊出「白狼」之名。這一次，他明白英雄不是從未倒下的人，而是在眾人最需要希望時，仍願意再站起來的人。`;

export const MUSIC_LIBRARY: MusicTrack[] = [
  { id: "calm", title: "Calm Loop", author: "wipics", file: "./audio/calm.mp3", moods: ["calm"], tags: ["平靜", "環境", "留白"], license: "CC0", sourceUrl: "https://opengameart.org/content/calm-loop" },
  { id: "remembrance", title: "Remembrance Loop", author: "beardalaxy", file: "./audio/remembrance.ogg", moods: ["sorrow"], tags: ["低谷", "回憶", "沉鬱"], license: "CC0", sourceUrl: "https://opengameart.org/content/remembrance-loop" },
  { id: "dark", title: "Dark Things Loop", author: "iamoneabe", file: "./audio/dark.mp3", moods: ["dark"], tags: ["陰影", "威脅", "懸念"], license: "CC0", sourceUrl: "https://opengameart.org/content/dark-things-loop" },
  { id: "march", title: "Epic March Loop", author: "Eldritch Grim", file: "./audio/epic-march.wav", moods: ["crisis"], tags: ["戰鬥", "逼近", "高張力"], license: "CC0", sourceUrl: "https://opengameart.org/content/epic-march-loop" },
  { id: "legend", title: "A Legend Will Rise", author: "CodeManu", file: "./audio/legend-will-rise.mp3", moods: ["rise", "triumph"], tags: ["覺醒", "英雄", "再起"], license: "CC0", sourceUrl: "https://opengameart.org/content/a-legend-will-rise-orchestral" },
];

const keywordSets: Record<NarrativeMood, string[]> = {
  calm: ["平靜", "安靜", "微風", "溫柔", "日常", "咖啡", "笑", "家", "朋友", "喜歡", "擁抱", "旅行", "午後", "孩子"],
  sorrow: ["失去", "死", "傷", "離別", "遺憾", "思念", "雨", "灰燼", "孤單", "往事", "眼淚", "再見"],
  dark: ["黑", "夜", "威脅", "恐懼", "廢棄", "陰影", "秘密", "陌生", "腳步", "門後", "真相", "失蹤"],
  crisis: ["戰", "箭", "刀", "劍", "衝", "撞", "危險", "追趕", "爆炸", "警鈴", "倒數", "下降", "火災"],
  rise: ["卻", "抬起頭", "重新", "不再", "理解", "原來", "終於", "醒來", "站起", "決定", "希望", "開始"],
  triumph: ["勝利", "成功", "完成", "團聚", "釋然", "歡呼", "凱旋", "陽光", "明天", "真相大白", "自由"],
};

type Defaults = Pick<SceneCue, "moodLabel" | "narrativeFunction" | "valence" | "arousal" | "tension" | "musicTrackId" | "musicLevel" | "narrationRate">;

const moodDefaults: Record<NarrativeMood, Defaults> = {
  calm: { moodLabel: "靜候", narrativeFunction: "建立世界", valence: 0.15, arousal: 0.22, tension: 0.18, musicTrackId: "calm", musicLevel: 0.16, narrationRate: 0.9 },
  sorrow: { moodLabel: "沉澱", narrativeFunction: "承接情感", valence: -0.72, arousal: 0.28, tension: 0.42, musicTrackId: "remembrance", musicLevel: 0.15, narrationRate: 0.84 },
  dark: { moodLabel: "陰影逼近", narrativeFunction: "累積威脅", valence: -0.58, arousal: 0.48, tension: 0.72, musicTrackId: "dark", musicLevel: 0.18, narrationRate: 0.88 },
  crisis: { moodLabel: "高張力", narrativeFunction: "推進行動", valence: -0.08, arousal: 0.9, tension: 0.92, musicTrackId: "march", musicLevel: 0.2, narrationRate: 1.02 },
  rise: { moodLabel: "轉折", narrativeFunction: "情緒轉向", valence: 0.48, arousal: 0.68, tension: 0.62, musicTrackId: "legend", musicLevel: 0.19, narrationRate: 0.94 },
  triumph: { moodLabel: "明亮釋放", narrativeFunction: "收束情緒", valence: 0.86, arousal: 0.76, tension: 0.24, musicTrackId: "legend", musicLevel: 0.22, narrationRate: 0.9 },
};

const styleProfiles: Record<StoryStyle, {
  arousal: number;
  tension: number;
  musicLevel: number;
  narrationRate: number;
  transitionSeconds: number;
  restrainedTransitions?: boolean;
}> = {
  "自動判讀": { arousal: 0, tension: 0, musicLevel: 0, narrationRate: 0, transitionSeconds: 0 },
  "忠實原文": { arousal: -0.02, tension: -0.02, musicLevel: -0.01, narrationRate: 0, transitionSeconds: 0.3 },
  "電影感": { arousal: 0.1, tension: 0.08, musicLevel: 0.035, narrationRate: 0.025, transitionSeconds: -0.35 },
  "溫柔細膩": { arousal: -0.08, tension: -0.05, musicLevel: -0.025, narrationRate: -0.055, transitionSeconds: 0.9, restrainedTransitions: true },
  "克制敘事": { arousal: -0.11, tension: -0.09, musicLevel: -0.04, narrationRate: -0.025, transitionSeconds: 1.1, restrainedTransitions: true },
};

const styleTrackTags: Record<StoryStyle, string[]> = {
  "自動判讀": [],
  "忠實原文": ["平靜", "環境", "留白", "日常", "對話", "沉思", "寧靜"],
  "電影感": ["高張力", "戰鬥", "冒險", "使命", "遠征", "反轉", "倒數", "追逐", "主題", "危機", "勝利"],
  "溫柔細膩": ["回憶", "懷舊", "浪漫", "甜蜜", "輕盈", "寧靜", "釋懷", "日常", "空靈"],
  "克制敘事": ["留白", "冷冽", "空洞", "寂靜", "沉思", "神秘", "淡淡哀傷", "環境", "思考"],
};

export const MIDI_DERIVED_TRACK_IDS = new Set([
  "broken-arm",
  "casual-afternoon",
  "icy-garden",
  "journey-forgotten",
  "standardized-anxiety",
  "without-time",
]);

export function isMidiDerivedTrack(track: MusicTrack) {
  const provenance = `${track.id} ${track.title} ${track.author} ${track.sourceUrl} ${track.objectKey ?? ""}`.toLowerCase();
  return MIDI_DERIVED_TRACK_IDS.has(track.id)
    || provenance.includes("original-midi-album")
    || /(^|[^a-z])midi([^a-z]|$)/.test(provenance);
}

export const supportedMusicTracks = (tracks: MusicTrack[]) => tracks.filter((track) => !isMidiDerivedTrack(track));

const clamp = (value: number, minimum = -1, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const sentences = (text: string) => (text.match(/[^。！？!?]+[。！？!?」]?/g) ?? [text]).map((part) => part.trim()).filter(Boolean);

function segmentStory(source: string) {
  const normalized = source.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
  const paragraphs = normalized.split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
  const targetCount = clamp(Math.round(normalized.length / 360), 3, 7);
  if (paragraphs.length >= 3 && paragraphs.length <= 8) return paragraphs;

  const parts = sentences(normalized);
  const targetLength = Math.max(100, Math.ceil(normalized.length / targetCount));
  const segments: string[] = [];
  let buffer = "";
  parts.forEach((sentence, index) => {
    buffer += sentence;
    const remaining = parts.length - index - 1;
    const slots = targetCount - segments.length - 1;
    if (buffer.length >= targetLength && remaining >= slots) {
      segments.push(buffer.trim());
      buffer = "";
    }
  });
  if (buffer.trim()) segments.push(buffer.trim());
  while (segments.length > 8) {
    const tail = segments.pop()!;
    segments[segments.length - 1] += tail;
  }
  return segments;
}

const keywordMatches = (text: string, mood: NarrativeMood) => keywordSets[mood].filter((keyword) => text.includes(keyword));

function inferMood(text: string) {
  const scores = (Object.keys(keywordSets) as NarrativeMood[]).map((mood) => ({ mood, count: keywordMatches(text, mood).length }));
  const strongest = scores.sort((a, b) => b.count - a.count)[0];
  return strongest.count > 0 ? strongest.mood : "calm";
}

function transitionFor(current: NarrativeMood, previous?: NarrativeMood): Pick<SceneCue, "transitionType" | "transitionLabel" | "transitionSeconds"> {
  if (!previous) return { transitionType: "fade", transitionLabel: "由寂靜慢速漸入", transitionSeconds: 4.2 };
  if (current === previous || (current === "triumph" && previous === "rise")) return { transitionType: "swell", transitionLabel: "延續主題，音量漸強", transitionSeconds: 4.8 };
  if (current === "crisis") return { transitionType: "crossfade", transitionLabel: "短交疊後快速推進", transitionSeconds: 2.2 };
  if (moodDefaults[current].valence - moodDefaults[previous].valence > 0.55) return { transitionType: "swell", transitionLabel: "長交疊並逐步抬升", transitionSeconds: 4.6 };
  if (moodDefaults[current].arousal < moodDefaults[previous].arousal - 0.25) return { transitionType: "fade", transitionLabel: "緩慢釋放，保留尾韻", transitionSeconds: 5.2 };
  return { transitionType: "crossfade", transitionLabel: "平滑交叉淡化", transitionSeconds: 3.4 };
}

export function analyzeStory(source: string, style: StoryStyle): SceneCue[] {
  const segments = segmentStory(source);
  const styleProfile = styleProfiles[style];
  let cursor = 0;
  return segments.map((text, index) => {
    const startOffset = source.indexOf(text, cursor);
    const safeStart = startOffset >= 0 ? startOffset : cursor;
    cursor = safeStart + text.length;
    const mood = inferMood(text);
    const previousMood = index > 0 ? inferMood(segments[index - 1]) : undefined;
    const defaults = moodDefaults[mood];
    const transition = transitionFor(mood, previousMood);
    const restrainedTransition = styleProfile.restrainedTransitions && transition.transitionType === "swell"
      ? { ...transition, transitionType: "crossfade" as const, transitionLabel: "保留尾韻，克制地交叉淡化" }
      : transition;
    const matchedKeywords = keywordMatches(text, mood).slice(0, 5);
    const first = sentences(text)[0]?.replace(/[「」『』]/g, "") ?? text;
    const excerpt = first.length > 15 ? `${first.slice(0, 15)}…` : first;
    const baseReason = matchedKeywords.length
      ? `偵測到「${matchedKeywords.join("、")}」等敘事線索，安排${defaults.moodLabel}的聲音方向。`
      : `本段沒有強制套用類型公式，以「${style}」的中性聲音方向忠實處理。`;
    const reason = `${baseReason} 導演風格採「${style}」，同步調整旁白節奏、配樂音量與轉場幅度。`;
    return {
      id: `scene-${index + 1}`,
      index,
      title: `${defaults.moodLabel}｜${excerpt}`,
      text,
      startOffset: safeStart,
      endOffset: cursor,
      mood,
      ...defaults,
      arousal: clamp(defaults.arousal + Math.min(0.08, matchedKeywords.length * 0.02) + styleProfile.arousal, 0, 1),
      tension: clamp(defaults.tension + (mood === "crisis" ? 0.05 : 0) + styleProfile.tension, 0, 1),
      musicLevel: clamp(defaults.musicLevel + styleProfile.musicLevel, 0.08, 0.35),
      narrationRate: clamp(defaults.narrationRate + styleProfile.narrationRate, 0.75, 1.15),
      ...restrainedTransition,
      transitionSeconds: clamp(restrainedTransition.transitionSeconds + styleProfile.transitionSeconds, 1, 8),
      reason,
      matchedKeywords,
    };
  });
}

function stableVariation(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function assignMusicTracks(cues: SceneCue[], tracks: MusicTrack[], style: StoryStyle = "自動判讀") {
  const eligibleTracks = supportedMusicTracks(tracks);
  if (!eligibleTracks.length) return cues;
  const storySeed = cues.map((cue) => cue.text).join("\u241e");
  const usage = new Map<string, number>();
  const authorUsage = new Map<string, number>();
  let previousId = "";
  let previousMood: NarrativeMood | "" = "";
  return cues.map((cue) => {
    const candidates = eligibleTracks.filter((track) => track.moods.includes(cue.mood));
    const pool = candidates.length ? candidates : eligibleTracks;
    const scored = pool.map((track) => ({
      track,
      score: track.tags.reduce((score, tag) => {
        const keywordHit = cue.matchedKeywords.some((keyword) => keyword.includes(tag) || tag.includes(keyword));
        const styleHit = styleTrackTags[style].includes(tag);
        return score + (cue.text.includes(tag) ? 5 : 0) + (keywordHit ? 4 : 0) + (styleHit ? 2.1 : 0);
      }, track.moods.includes(cue.mood) ? 8 : 0)
        - (usage.get(track.id) ?? 0) * 1.8
        - (authorUsage.get(track.author) ?? 0) * 0.35
        - (track.id === previousId ? (cue.mood === previousMood && cue.transitionType === "swell" ? 0.6 : 3.2) : 0)
        + stableVariation(`${storySeed}|${style}|${cue.index}|${track.id}`) * 1.6,
    })).sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title));
    const selected = scored[0]?.track;
    previousId = selected?.id ?? cue.musicTrackId;
    previousMood = cue.mood;
    if (selected) {
      usage.set(selected.id, (usage.get(selected.id) ?? 0) + 1);
      authorUsage.set(selected.author, (authorUsage.get(selected.author) ?? 0) + 1);
    }
    return selected ? { ...cue, musicTrackId: selected.id } : cue;
  });
}

export const getTrack = (trackId: string, tracks: MusicTrack[] = MUSIC_LIBRARY) => {
  const eligibleTracks = supportedMusicTracks(tracks);
  return eligibleTracks.find((track) => track.id === trackId) ?? eligibleTracks[0] ?? MUSIC_LIBRARY[0];
};

export const moodColor: Record<NarrativeMood, string> = {
  calm: "#85a8a0", sorrow: "#9294a5", dark: "#716f7e", crisis: "#c67554", rise: "#d6a54b", triumph: "#edbf5e",
};
