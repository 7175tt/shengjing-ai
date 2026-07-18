import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { normalizeStoryStyle, type MusicTrack, type NarrativeMood, type NarrationProvider, type OpenAIVoice, type SceneCue, type StoryProject, type StoryStyle } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);
export const supabase: SupabaseClient | null = isCloudConfigured ? createClient(url!, anonKey!) : null;

export async function getCloudUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error("尚未設定 Supabase");
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function analyzeInCloud(body: string, style: StoryStyle, openAiApiKey?: string): Promise<{ scenes: SceneCue[]; model?: string }> {
  if (!supabase) throw new Error("尚未設定雲端 AI");
  const suppliedKey = openAiApiKey?.trim();
  const { data, error } = await supabase.functions.invoke("analyze-story", {
    body: { story: body, style, ...(suppliedKey ? { openAiApiKey: suppliedKey } : {}) },
  });
  if (error) throw error;
  if (!Array.isArray(data?.scenes)) throw new Error("AI 回傳格式不完整");
  return { scenes: data.scenes as SceneCue[], model: typeof data.model === "string" ? data.model : undefined };
}

export interface NarrationResult {
  url: string;
  provider: Exclude<NarrationProvider, "system">;
  model: string;
  voice: string;
  cacheHit: boolean;
}

export async function generateNarration(input: {
  text: string;
  projectId: string;
  sceneId: string;
  provider: Exclude<NarrationProvider, "system">;
  mood: NarrativeMood;
  style: StoryStyle;
  narrationRate: number;
  openAiVoice: OpenAIVoice;
  openAiApiKey?: string;
  previousText?: string;
  nextText?: string;
}): Promise<NarrationResult> {
  if (!supabase) throw new Error("尚未設定自然語音服務");
  const user = await getCloudUser();
  if (!user) throw new Error("自然語音需要先登入雲端工作區");
  const { data, error } = await supabase.functions.invoke("narrate-scene", { body: input });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error ?? "語音服務沒有回傳音檔");
  return data as NarrationResult;
}

export async function loadRemoteMusicTracks(): Promise<MusicTrack[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("music_tracks").select("*").eq("published", true).order("sort_order");
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    file: row.object_url,
    moods: row.moods,
    tags: row.tags,
    license: row.license,
    sourceUrl: row.source_url,
    storageProvider: row.storage_provider,
    objectKey: row.object_key,
    durationSeconds: row.duration_seconds ?? undefined,
  })) as MusicTrack[];
}

export async function pullCloudProjects(): Promise<StoryProject[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("story_projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id, title: row.title, body: row.body, style: normalizeStoryStyle(row.style),
    cues: row.cue_sheet ?? [], createdAt: row.created_at, updatedAt: row.updated_at, source: "cloud",
  }));
}

export async function pushCloudProject(project: StoryProject): Promise<void> {
  if (!supabase) throw new Error("尚未設定 Supabase");
  const user = await getCloudUser();
  if (!user) throw new Error("請先登入再同步");
  const { error } = await supabase.from("story_projects").upsert({
    id: project.id, owner_id: user.id, title: project.title, body: project.body,
    style: project.style, cue_sheet: project.cues, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
