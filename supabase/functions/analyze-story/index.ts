import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const moods = ["calm", "sorrow", "dark", "crisis", "rise", "triumph"];
const tracks = ["calm", "remembrance", "dark", "march", "legend"];

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "text", "mood", "moodLabel", "narrativeFunction", "valence", "arousal", "tension", "musicTrackId", "musicLevel", "transitionType", "transitionLabel", "transitionSeconds", "narrationRate", "reason", "matchedKeywords"],
        properties: {
          title: { type: "string" },
          text: { type: "string" },
          mood: { type: "string", enum: moods },
          moodLabel: { type: "string" },
          narrativeFunction: { type: "string" },
          valence: { type: "number", minimum: -1, maximum: 1 },
          arousal: { type: "number", minimum: 0, maximum: 1 },
          tension: { type: "number", minimum: 0, maximum: 1 },
          musicTrackId: { type: "string", enum: tracks },
          musicLevel: { type: "number", minimum: 0.08, maximum: 0.35 },
          transitionType: { type: "string", enum: ["fade", "crossfade", "swell", "cut"] },
          transitionLabel: { type: "string" },
          transitionSeconds: { type: "number", minimum: 1, maximum: 8 },
          narrationRate: { type: "number", minimum: 0.75, maximum: 1.15 },
          reason: { type: "string" },
          matchedKeywords: { type: "array", maxItems: 5, items: { type: "string" } },
        },
      },
    },
  },
};

function outputText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output as Array<Record<string, unknown>>) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content as Array<Record<string, unknown>>) {
      if (part.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  throw new Error("OpenAI response did not contain output text");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    const { story, style = "自動判讀" } = await request.json();
    if (typeof story !== "string" || story.trim().length < 80) throw new Error("故事至少需要 80 字");
    if (story.length > 8000) throw new Error("單次分析上限為 8,000 字");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5.6-luna",
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: [{ type: "input_text", text: "你是通用的文章聲音導演。來文可能是愛情、日常、喜劇、懸疑、恐怖、科幻、歷史、兒童、療癒、散文、紀實或任何題材，不得預設為英雄或逆境故事。將全文依真正的敘事轉折切成 3 至 8 幕，必須原文完整、不重複、不遺漏。曲庫只有 calm、remembrance、dark、march、legend，這些只是音樂氣質，不是故事類型。不要每幕都換歌；重要主題應延續，轉場需依情節選擇漸入、交疊、漸強或切點。輸出繁體中文。" }] },
          { role: "user", content: [{ type: "input_text", text: `演繹方式：${style}\n\n文章全文：\n${story}` }] },
        ],
        text: { format: { type: "json_schema", name: "story_cue_sheet", strict: true, schema } },
      }),
    });
    const raw = await response.json();
    if (!response.ok) throw new Error(raw?.error?.message ?? `OpenAI API error ${response.status}`);
    const parsed = JSON.parse(outputText(raw));
    let cursor = 0;
    const scenes = parsed.scenes.map((scene: Record<string, unknown>, index: number) => {
      const text = String(scene.text ?? "");
      const found = story.indexOf(text, cursor);
      const startOffset = found >= 0 ? found : cursor;
      cursor = startOffset + text.length;
      return { ...scene, id: `scene-${index + 1}`, index, startOffset, endOffset: cursor };
    });
    return new Response(JSON.stringify({ scenes }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
