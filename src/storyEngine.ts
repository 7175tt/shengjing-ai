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
  calm: ["平靜", "安靜", "月", "星", "微風", "溫柔", "沉默", "等待", "遠方", "清晨"],
  sorrow: ["敗", "失去", "死", "傷", "雨", "灰燼", "孤", "破舊", "往事", "倒下", "眼淚"],
  dark: ["黑", "夜", "威脅", "逼近", "恐懼", "逃", "廢棄", "熄滅", "陰影", "敵軍", "秘密"],
  crisis: ["戰", "箭", "刀", "劍", "衝", "湧", "撞", "危", "追", "火", "號角", "鐵騎"],
  rise: ["但是", "卻", "抬起頭", "重新", "不再", "誓言", "守護", "醒來", "站起", "決定", "晨光"],
  triumph: ["勝利", "後退", "英雄", "希望", "陽光", "凱旋", "旗幟", "明天", "鐘聲", "喊出"],
};

type Defaults = Pick<SceneCue, "moodLabel" | "narrativeFunction" | "valence" | "arousal" | "tension" | "musicTrackId" | "musicLevel" | "narrationRate">;

const moodDefaults: Record<NarrativeMood, Defaults> = {
  calm: { moodLabel: "靜候", narrativeFunction: "建立世界", valence: 0.15, arousal: 0.22, tension: 0.18, musicTrackId: "calm", musicLevel: 0.16, narrationRate: 0.9 },
  sorrow: { moodLabel: "低谷", narrativeFunction: "揭露創傷", valence: -0.72, arousal: 0.28, tension: 0.42, musicTrackId: "remembrance", musicLevel: 0.15, narrationRate: 0.84 },
  dark: { moodLabel: "陰影逼近", narrativeFunction: "累積威脅", valence: -0.58, arousal: 0.48, tension: 0.72, musicTrackId: "dark", musicLevel: 0.18, narrationRate: 0.88 },
  crisis: { moodLabel: "迎戰", narrativeFunction: "正面衝突", valence: -0.08, arousal: 0.9, tension: 0.92, musicTrackId: "march", musicLevel: 0.2, narrationRate: 1.02 },
  rise: { moodLabel: "覺醒", narrativeFunction: "意志轉折", valence: 0.48, arousal: 0.68, tension: 0.62, musicTrackId: "legend", musicLevel: 0.19, narrationRate: 0.94 },
  triumph: { moodLabel: "英雄再起", narrativeFunction: "情緒兌現", valence: 0.86, arousal: 0.76, tension: 0.24, musicTrackId: "legend", musicLevel: 0.22, narrationRate: 0.9 },
};

const arcs: Record<StoryStyle, NarrativeMood[]> = {
  "逆境再起": ["sorrow", "dark", "crisis", "rise", "crisis", "triumph"],
  "英雄征途": ["calm", "rise", "crisis", "crisis", "triumph", "triumph"],
  "懸疑暗湧": ["calm", "dark", "dark", "crisis", "dark", "rise"],
  "克制敘事": ["calm", "sorrow", "dark", "rise", "calm", "triumph"],
};

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

function inferMood(text: string, index: number, count: number, style: StoryStyle) {
  const arc = arcs[style];
  const arcIndex = count === 1 ? 0 : Math.round((index / (count - 1)) * (arc.length - 1));
  const prior = arc[arcIndex];
  const scores = (Object.keys(keywordSets) as NarrativeMood[]).map((mood) => ({ mood, count: keywordMatches(text, mood).length }));
  const strongest = scores.sort((a, b) => b.count - a.count)[0];
  return strongest.count >= 3 || (strongest.count >= 2 && strongest.mood !== "calm") ? strongest.mood : prior;
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
  let cursor = 0;
  return segments.map((text, index) => {
    const startOffset = source.indexOf(text, cursor);
    const safeStart = startOffset >= 0 ? startOffset : cursor;
    cursor = safeStart + text.length;
    const mood = inferMood(text, index, segments.length, style);
    const previousMood = index > 0 ? inferMood(segments[index - 1], index - 1, segments.length, style) : undefined;
    const defaults = moodDefaults[mood];
    const transition = transitionFor(mood, previousMood);
    const matchedKeywords = keywordMatches(text, mood).slice(0, 5);
    const first = sentences(text)[0]?.replace(/[「」『』]/g, "") ?? text;
    const excerpt = first.length > 15 ? `${first.slice(0, 15)}…` : first;
    const reason = matchedKeywords.length
      ? `偵測到「${matchedKeywords.join("、")}」等敘事線索，安排${defaults.moodLabel}的聲音方向。`
      : `依照「${style}」的情緒弧線與本段位置，安排${defaults.moodLabel}的聲音方向。`;
    return {
      id: `scene-${index + 1}`,
      index,
      title: `${defaults.moodLabel}｜${excerpt}`,
      text,
      startOffset: safeStart,
      endOffset: cursor,
      mood,
      ...defaults,
      arousal: clamp(defaults.arousal + Math.min(0.08, matchedKeywords.length * 0.02), 0, 1),
      tension: clamp(defaults.tension + (mood === "crisis" ? 0.05 : 0), 0, 1),
      ...transition,
      reason,
      matchedKeywords,
    };
  });
}

export const getTrack = (trackId: string) => MUSIC_LIBRARY.find((track) => track.id === trackId) ?? MUSIC_LIBRARY[0];

export const moodColor: Record<NarrativeMood, string> = {
  calm: "#85a8a0", sorrow: "#9294a5", dark: "#716f7e", crisis: "#c67554", rise: "#d6a54b", triumph: "#edbf5e",
};
