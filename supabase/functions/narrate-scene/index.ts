import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mood = "calm" | "sorrow" | "dark" | "crisis" | "rise" | "triumph";
type Provider = "openai" | "elevenlabs" | "minimax";

const openAiVoices = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);

// Public showcase audio is deliberately allow-listed. The landing page can
// request these fixed passages without receiving or sending an API key, while
// arbitrary user text still requires an authenticated workspace session.
const demoNarrations: Record<string, { text: string; mood: Mood; narrationRate: number }> = {
  "demo-scene-1": {
    text: "北境的雨下了整整七日。昔日被稱為「白狼」的將軍陸沉，如今披著破舊斗篷，獨自走回焚毀的故城。三年前，他在黑石谷敗給帝國鐵騎，部眾死傷殆盡，連佩劍也折在敵將腳下。城門邊的孩子不認得他，老人卻低下眼睛，像看見一段不願提起的往事。",
    mood: "sorrow",
    narrationRate: 0.84,
  },
  "demo-scene-2": {
    text: "夜裡，帝國的號角再次從山外傳來。斥候帶回消息，敵軍天亮前就會抵達，而城中只剩數百名疲憊的守衛。議事廳裡沒有人敢看陸沉，眾人記得他的失敗，也記得那場失敗帶走多少親人。有人勸他趁黑離開，至少還能保住性命。",
    mood: "dark",
    narrationRate: 0.88,
  },
  "demo-scene-3": {
    text: "陸沉走進廢棄的鑄劍房，在灰燼裡找到老師留下的半截劍柄。牆上仍刻著少年時的誓言：劍可以折，守護之心不能。爐火早已熄滅，他卻彷彿聽見昔日同袍的笑聲。良久，他抬起頭，把斷劍重新綁在手上。",
    mood: "rise",
    narrationRate: 0.94,
  },
  "demo-scene-4": {
    text: "黎明前，陸沉登上城牆。他沒有許諾勝利，只說自己會站在第一個倒下的位置。沉默的守衛一個接一個舉起長槍，鐵匠帶來剛鑄好的箭頭，連城門邊的老人也敲響戰鼓。第一道晨光越過山脊時，整座城像從漫長的冬眠中醒來。",
    mood: "rise",
    narrationRate: 0.96,
  },
  "demo-scene-5": {
    text: "敵軍撞開外門，黑色洪流湧進狹道。陸沉迎著箭雨衝下石階，以斷劍架住敵將的長刀。那一瞬間，他不再是等待原諒的敗軍之將，而是替身後每一個人爭取明天的守門者。戰鼓越來越快，城牆上的旗幟在風中重新展開。",
    mood: "crisis",
    narrationRate: 1.02,
  },
  "demo-scene-6": {
    text: "正午鐘聲響起時，帝國軍開始後退。陸沉沒有追擊，只站在城門前，看著雲層裂開，陽光落在滿地泥水與殘甲之上。孩子們第一次喊出「白狼」之名。這一次，他明白英雄不是從未倒下的人，而是在眾人最需要希望時，仍願意再站起來的人。",
    mood: "triumph",
    narrationRate: 0.9,
  },
};

const moodDirections: Record<Mood, string> = {
  calm: "平靜、親近，保留日常說話的自然呼吸與停頓。",
  sorrow: "低沉克制，讓悲傷藏在句尾，不哭腔、不灑狗血，保留人物尊嚴。",
  dark: "稍慢而警覺，壓低音量，營造未知威脅，但每個字仍清楚。",
  crisis: "節奏明快、壓力上升，保持敘事清晰，不要吼叫或過度急促。",
  rise: "從克制逐步轉為明確，關鍵句有力量，但不預設人物一定英雄化。",
  triumph: "開闊、明亮、篤定，有情緒釋放卻不吶喊，結尾留下餘韻。",
};

const styleDirections: Record<string, string> = {
  "自動判讀": "先理解段落的題材、人物關係與敘事功能，再決定演繹，不套用英雄或逆境公式。",
  "忠實原文": "情緒只來自原文，不額外煽情、不自行補充人物態度。",
  "電影感": "擴大關鍵轉折與畫面感，平淡段落仍要自然，不要全程高張力。",
  "溫柔細膩": "注意細微的遲疑、呼吸與句尾，不甜膩、不造作。",
  "克制敘事": "降低表演痕跡，以節奏、停頓和輕微重音傳達情緒。",
};

const elevenTags: Record<Mood, string> = {
  calm: "[calmly]", sorrow: "[sad, restrained]", dark: "[cautiously]",
  crisis: "[urgently]", rise: "[determined]", triumph: "[triumphantly]",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function adminKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, string>;
    return keys.default;
  } catch { return undefined; }
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexBytes(hex: string) {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

function direction(mood: Mood, style: string, narrationRate: number) {
  const pace = narrationRate < 0.88 ? "語速略慢" : narrationRate > 1 ? "語速略快" : "語速自然";
  const styleDirection = styleDirections[style] ?? styleDirections["自動判讀"];
  return `使用自然的繁體中文小說旁白，口音以台灣華語為目標。${styleDirection}${moodDirections[mood]}${pace}。依標點保留合理停頓，對話與旁白要有細微差異。避免客服、新聞播報、過度字正腔圓或夸張配音。`;
}

async function openAiSpeech(text: string, instructions: string, narrationRate: number, voice: string, suppliedKey?: string) {
  const key = suppliedKey || Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OpenAI 自然語音尚未設定");
  const model = Deno.env.get("OPENAI_TTS_MODEL") ?? "gpt-4o-mini-tts";
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, voice, input: text, instructions, response_format: "mp3",
      speed: Math.min(1.5, Math.max(0.5, narrationRate)),
    }),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.error?.message ?? `OpenAI TTS error ${response.status}`);
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), model, voice };
}

async function serveDemoNarration(demoId: string, url: string, secret: string) {
  const demo = demoNarrations[demoId];
  if (!demo) throw new Error("不支援的展示旁白");
  const admin = createClient(url, secret);
  const storagePath = `demo-narration/${demoId}.mp3`;
  const bucket = admin.storage.from("music-library");
  const publicUrl = bucket.getPublicUrl(storagePath).data.publicUrl;
  const { data: existing } = await bucket.list("demo-narration", { search: `${demoId}.mp3`, limit: 1 });
  if (existing?.some((item) => item.name === `${demoId}.mp3`)) {
    return json({ url: publicUrl, provider: "openai", model: Deno.env.get("OPENAI_TTS_MODEL") ?? "gpt-4o-mini-tts", voice: "cedar", cacheHit: true });
  }

  const generated = await openAiSpeech(demo.text, direction(demo.mood, "電影感", demo.narrationRate), demo.narrationRate, "cedar");
  const { error: uploadError } = await bucket.upload(storagePath, generated.bytes, {
    contentType: "audio/mpeg", cacheControl: "31536000", upsert: false,
  });
  if (uploadError && !/already exists/i.test(uploadError.message)) throw uploadError;
  return json({ url: publicUrl, provider: "openai", model: generated.model, voice: generated.voice, cacheHit: false });
}

async function elevenLabsSpeech(text: string, mood: Mood, previousText?: string, nextText?: string) {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  const voice = Deno.env.get("ELEVENLABS_VOICE_ID");
  if (!key || !voice) throw new Error("ElevenLabs 自然語音尚未設定");
  const model = Deno.env.get("ELEVENLABS_MODEL") ?? "eleven_v3";
  const expressiveText = model.includes("v3") ? `${elevenTags[mood]} ${text}` : text;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text: expressiveText, model_id: model, previous_text: previousText, next_text: nextText }),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail?.message ?? problem?.detail ?? `ElevenLabs TTS error ${response.status}`);
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), model, voice };
}

async function miniMaxSpeech(text: string, narrationRate: number) {
  const key = Deno.env.get("MINIMAX_API_KEY");
  if (!key) throw new Error("MiniMax 自然語音尚未設定");
  const model = Deno.env.get("MINIMAX_TTS_MODEL") ?? "speech-2.8-hd";
  const voice = Deno.env.get("MINIMAX_VOICE_ID") ?? "Chinese (Mandarin)_Reliable_Executive";
  const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, text, stream: false, language_boost: "Chinese", output_format: "hex",
      voice_setting: { voice_id: voice, speed: Math.min(1.2, Math.max(0.75, narrationRate)), vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3", channel: 1 },
      subtitle_enable: false,
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload?.base_resp?.status_code !== 0 || typeof payload?.data?.audio !== "string") {
    throw new Error(payload?.base_resp?.status_msg ?? `MiniMax TTS error ${response.status}`);
  }
  return { bytes: hexBytes(payload.data.audio), model, voice };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const input = await request.json();
    const demoId = typeof input.demoId === "string" ? input.demoId : "";
    const authHeader = request.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const secret = adminKey();
    if (demoId) {
      if (!url || !secret) throw new Error("展示旁白服務尚未完成設定");
      return await serveDemoNarration(demoId, url, secret);
    }
    if (!authHeader || !url || !anonKey || !secret) throw new Error("Supabase 語音後端尚未完成設定");

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "請先登入再使用自然語音" }, 401);

    const text = typeof input.text === "string" ? input.text.trim() : "";
    const provider = input.provider as Provider;
    const mood = input.mood as Mood;
    const style = typeof input.style === "string" ? input.style : "自動判讀";
    const narrationRate = Number(input.narrationRate ?? 0.92);
    if (!text || text.length > 1600) throw new Error("單一場景必須介於 1 至 1,600 字");
    if (!["openai", "elevenlabs", "minimax"].includes(provider)) throw new Error("不支援的語音引擎");
    if (!Object.hasOwn(moodDirections, mood)) throw new Error("不支援的場景情緒");

    const suppliedKey = provider === "openai" && typeof input.openAiApiKey === "string" ? input.openAiApiKey.trim() : "";
    if (suppliedKey && (suppliedKey.length < 20 || suppliedKey.length > 512 || /\s/.test(suppliedKey))) {
      throw new Error("自備 OpenAI API Key 格式不正確");
    }
    const configuredVoice = typeof input.openAiVoice === "string"
      ? input.openAiVoice
      : Deno.env.get("OPENAI_TTS_VOICE") ?? "cedar";
    const openAiVoice = openAiVoices.has(configuredVoice) ? configuredVoice : "cedar";

    const instructions = direction(mood, style, narrationRate);
    const providerConfig = provider === "openai"
      ? `${Deno.env.get("OPENAI_TTS_MODEL") ?? "gpt-4o-mini-tts"}:${openAiVoice}:${narrationRate.toFixed(2)}`
      : provider === "elevenlabs"
        ? `${Deno.env.get("ELEVENLABS_MODEL") ?? "eleven_v3"}:${Deno.env.get("ELEVENLABS_VOICE_ID") ?? "unset"}`
        : `${Deno.env.get("MINIMAX_TTS_MODEL") ?? "speech-2.8-hd"}:${Deno.env.get("MINIMAX_VOICE_ID") ?? "Chinese (Mandarin)_Reliable_Executive"}`;
    const cacheKey = await digest([provider, providerConfig, text, instructions].join("\n"));
    const admin = createClient(url, secret);
    const { data: cached } = await admin.from("narration_assets")
      .select("storage_path, model, voice").eq("owner_id", user.id).eq("cache_key", cacheKey).maybeSingle();
    if (cached?.storage_path) {
      const { data: signed } = await admin.storage.from("narration-cache").createSignedUrl(cached.storage_path, 21600);
      if (signed?.signedUrl) return json({ url: signed.signedUrl, provider, model: cached.model, voice: cached.voice, cacheHit: true });
    }

    const generated = provider === "openai"
      ? await openAiSpeech(text, instructions, narrationRate, openAiVoice, suppliedKey || undefined)
      : provider === "elevenlabs"
        ? await elevenLabsSpeech(text, mood, input.previousText, input.nextText)
        : await miniMaxSpeech(text, narrationRate);
    const storagePath = `${user.id}/${cacheKey}.mp3`;
    const { error: uploadError } = await admin.storage.from("narration-cache").upload(storagePath, generated.bytes, {
      contentType: "audio/mpeg", cacheControl: "31536000", upsert: true,
    });
    if (uploadError) throw uploadError;
    const { error: assetError } = await admin.from("narration_assets").upsert({
      owner_id: user.id, cache_key: cacheKey, provider, model: generated.model, voice: generated.voice,
      storage_path: storagePath, source_chars: text.length,
    }, { onConflict: "owner_id,cache_key" });
    if (assetError) throw assetError;
    const { data: signed, error: signError } = await admin.storage.from("narration-cache").createSignedUrl(storagePath, 21600);
    if (signError || !signed?.signedUrl) throw signError ?? new Error("無法建立語音播放網址");
    return json({ url: signed.signedUrl, provider, model: generated.model, voice: generated.voice, cacheHit: false });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "語音生成失敗" }, 400);
  }
});
