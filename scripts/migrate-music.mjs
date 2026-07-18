import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const manifest = JSON.parse(await readFile(join(here, "music-manifest.json"), "utf8"));
const target = process.env.TARGET_STORAGE ?? "r2";
const mime = (name) => name.endsWith(".ogg") ? "audio/ogg" : name.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
const publicObjectUrl = (base, key) => `${base.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

let r2 = null;
if (target === "r2") {
  const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`R2 缺少環境變數：${missing.join(", ")}`);
  r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
} else if (target === "supabase" && !supabase) {
  throw new Error("Supabase 遷移需要 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
}

const catalog = [];
for (const item of manifest) {
  const bytes = await readFile(join(root, "public", "audio", item.fileName));
  const objectKey = `music/${item.fileName}`;
  let objectUrl;
  if (target === "r2") {
    await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey, Body: bytes, ContentType: mime(item.fileName), CacheControl: "public, max-age=31536000, immutable" }));
    objectUrl = publicObjectUrl(process.env.R2_PUBLIC_BASE_URL, objectKey);
  } else {
    const { error } = await supabase.storage.from("music-library").upload(objectKey, bytes, { contentType: mime(item.fileName), cacheControl: "31536000", upsert: true });
    if (error) throw error;
    objectUrl = supabase.storage.from("music-library").getPublicUrl(objectKey).data.publicUrl;
  }
  catalog.push({
    id: item.id, title: item.title, author: item.author, file: objectUrl, moods: item.moods, tags: item.tags,
    license: item.license, sourceUrl: item.sourceUrl, storageProvider: target, objectKey,
  });
  console.log(`uploaded ${item.id} -> ${objectKey}`);
}

if (supabase) {
  const rows = catalog.map((track, index) => ({
    id: track.id, title: track.title, author: track.author, object_url: track.file, object_key: track.objectKey,
    storage_provider: track.storageProvider, moods: track.moods, tags: track.tags, license: track.license,
    source_url: track.sourceUrl, published: true, sort_order: manifest[index].sortOrder,
  }));
  const { error } = await supabase.from("music_tracks").upsert(rows);
  if (error) throw error;
  console.log(`seeded ${rows.length} music_tracks rows`);
}

await writeFile(join(root, "public", "music-catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`wrote public/music-catalog.json with ${catalog.length} tracks`);
