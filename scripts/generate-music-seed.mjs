import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "music-catalog.json");
const outputPath = path.join(root, "supabase", "music-catalog-seed.sql");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const retiredTrackIds = [
  "broken-arm",
  "casual-afternoon",
  "icy-garden",
  "journey-forgotten",
  "standardized-anxiety",
  "without-time",
];
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const textArray = (values) => `array[${values.map(quote).join(", ")}]::text[]`;

const rows = catalog.map((track, index) => `(
  ${quote(track.id)}, ${quote(track.title)}, ${quote(track.author)}, ${quote(track.file)},
  ${quote(track.objectKey)}, 'supabase', ${textArray(track.moods)}, ${textArray(track.tags)},
  ${quote(track.license)}, ${quote(track.sourceUrl)}, true, ${index + 1}
)`);

const sql = `-- Generated from public/music-catalog.json. Do not hand-edit track metadata here.
grant usage on schema public to anon, authenticated;
grant select on table public.music_tracks to anon, authenticated;

-- MIDI 衍生曲目保留稽核紀錄，但不得再進入公開曲庫或自動選曲。
update public.music_tracks
set published = false, updated_at = now()
where id in (${retiredTrackIds.map(quote).join(", ")});

insert into public.music_tracks (
  id, title, author, object_url, object_key, storage_provider,
  moods, tags, license, source_url, published, sort_order
)
values
${rows.join(",\n")}
on conflict (id) do update set
  title = excluded.title,
  author = excluded.author,
  object_url = excluded.object_url,
  object_key = excluded.object_key,
  storage_provider = excluded.storage_provider,
  moods = excluded.moods,
  tags = excluded.tags,
  license = excluded.license,
  source_url = excluded.source_url,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();
`;

await writeFile(outputPath, sql, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} with ${catalog.length} tracks.`);
