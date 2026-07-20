import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const moods = ["calm", "sorrow", "dark", "crisis", "rise", "triumph"] as const;
const tagTaxonomy = [
  "平靜", "溫暖", "療癒", "日常", "輕鬆", "浪漫", "甜蜜", "希望", "勇氣", "成長", "再起", "勝利",
  "凱旋", "英雄", "使命", "冒險", "探索", "前進", "行動", "戰鬥", "追逐", "危機", "緊張", "懸疑",
  "神秘", "未知", "不安", "壓迫", "恐怖", "陰影", "黑暗", "孤獨", "哀傷", "離別", "回憶", "懷舊",
  "沉思", "空靈", "宇宙", "科幻", "科技", "機械", "奇幻", "古典", "史詩", "夢境", "童趣", "幽默",
  "輕快", "歡樂", "節奏", "脈動", "漸強", "轉折", "釋放", "寂靜", "自然", "城市", "夜晚", "雨天",
] as const;

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

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(bytes.length, index + 32768)));
  }
  return btoa(binary);
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = request.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const secret = adminKey();
    if (!authHeader || !url || !anonKey || !secret) throw new Error("Supabase 音樂分析後端尚未完成設定");

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "請先登入再分析音樂" }, 401);

    const input = await request.json();
    const storagePath = typeof input.storagePath === "string" ? input.storagePath : "";
    const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
    const suppliedKey = typeof input.openAiApiKey === "string" ? input.openAiApiKey.trim() : "";
    if (!storagePath.startsWith(`${user.id}/`)) return json({ error: "無權存取這個音檔" }, 403);
    if (!title) throw new Error("音樂名稱不可空白");
    if (suppliedKey && (suppliedKey.length < 20 || suppliedKey.length > 512 || /\s/.test(suppliedKey))) {
      throw new Error("自備 OpenAI API Key 格式不正確");
    }
    const apiKey = suppliedKey || Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OpenAI 音樂分析尚未設定");

    const extension = storagePath.split(".").pop()?.toLowerCase();
    if (extension !== "mp3" && extension !== "wav") throw new Error("AI 分析目前支援 MP3 與 WAV");

    const admin = createClient(url, secret);
    const { data: audioBlob, error: downloadError } = await admin.storage.from("user-music").download(storagePath);
    if (downloadError || !audioBlob) throw downloadError ?? new Error("讀取上傳音檔失敗");
    if (audioBlob.size > 20 * 1024 * 1024) throw new Error("單一音檔上限為 20 MB");
    const audioData = bytesToBase64(new Uint8Array(await audioBlob.arrayBuffer()));

    const model = Deno.env.get("OPENAI_AUDIO_MODEL") ?? "gpt-audio-mini";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "請聆聽這首無歌詞或含環境聲的配樂，辨識情緒、能量、明暗、敘事用途與適合的小說場景。只根據真正聽到的音訊判斷，不猜測曲名、作者或來源。請呼叫 record_music_analysis，以繁體中文輸出 3 至 6 個不重複標籤。",
            },
            { type: "input_audio", input_audio: { data: audioData, format: extension } },
          ],
        }],
        tools: [{
          type: "function",
          function: {
            name: "record_music_analysis",
            description: "保存音樂的標準化情緒與情境標籤",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                moods: { type: "array", minItems: 1, maxItems: 3, items: { type: "string", enum: moods } },
                tags: { type: "array", minItems: 3, maxItems: 6, items: { type: "string", enum: tagTaxonomy } },
                summary: { type: "string", description: "80 字內說明聽感與適合場景" },
                energy: { type: "number", minimum: 0, maximum: 1 },
                valence: { type: "number", minimum: -1, maximum: 1 },
              },
              required: ["moods", "tags", "summary", "energy", "valence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_music_analysis" } },
        max_completion_tokens: 600,
      }),
    });
    const raw = await response.json();
    if (!response.ok) throw new Error(raw?.error?.message ?? `OpenAI API error ${response.status}`);
    const argumentsText = raw?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (typeof argumentsText !== "string") throw new Error("GPT Audio 沒有回傳音樂標籤");
    const analysis = JSON.parse(argumentsText) as Record<string, unknown>;
    const analyzedMoods = Array.isArray(analysis.moods)
      ? [...new Set(analysis.moods.filter((mood: unknown) => typeof mood === "string" && (moods as readonly string[]).includes(mood)))]
      : [];
    const analyzedTags = Array.isArray(analysis.tags)
      ? [...new Set(analysis.tags.filter((tag: unknown) => typeof tag === "string" && (tagTaxonomy as readonly string[]).includes(tag)))]
      : [];
    if (!analyzedMoods.length || analyzedTags.length < 3) throw new Error("GPT Audio 回傳的標籤不完整");

    const id = `user-${crypto.randomUUID()}`;
    const row = {
      id,
      owner_id: user.id,
      title,
      author: user.email?.split("@")[0] || "我的上傳",
      object_url: "",
      object_key: storagePath,
      storage_provider: "supabase",
      moods: analyzedMoods,
      tags: analyzedTags,
      license: "使用者自有／已授權",
      source_url: "user-upload",
      duration_seconds: clamp(input.durationSeconds, 0, 7200, 0) || null,
      published: false,
      sort_order: 10,
      analysis_model: model,
      analysis_summary: typeof analysis.summary === "string" ? analysis.summary.trim().slice(0, 180) : "",
      analysis_status: "ready",
      energy: clamp(analysis.energy, 0, 1, 0.5),
      valence: clamp(analysis.valence, -1, 1, 0),
    };
    const { data: signed, error: signError } = await admin.storage.from("user-music").createSignedUrl(storagePath, 21600);
    if (signError || !signed?.signedUrl) throw signError ?? new Error("無法建立音樂播放網址");
    const { error: insertError } = await admin.from("music_tracks").insert(row);
    if (insertError) throw insertError;

    return json({
      track: {
        id,
        title: row.title,
        author: row.author,
        file: signed.signedUrl,
        moods: row.moods,
        tags: row.tags,
        license: row.license,
        sourceUrl: row.source_url,
        storageProvider: row.storage_provider,
        objectKey: row.object_key,
        durationSeconds: row.duration_seconds ?? undefined,
        ownerId: user.id,
        analysisModel: model,
        analysisSummary: row.analysis_summary,
        userUploaded: true,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "音樂分析失敗" }, 400);
  }
});
