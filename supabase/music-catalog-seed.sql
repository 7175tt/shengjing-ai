-- Generated from public/music-catalog.json. Do not hand-edit track metadata here.
grant usage on schema public to anon, authenticated;
grant select on table public.music_tracks to anon, authenticated;

insert into public.music_tracks (
  id, title, author, object_url, object_key, storage_provider,
  moods, tags, license, source_url, published, sort_order
)
values
(
  'calm', 'Calm Loop', 'wipics', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/calm.mp3',
  'cc0/calm.mp3', 'supabase', array['calm']::text[], array['平靜', '環境', '留白', '日常']::text[],
  'CC0', 'https://opengameart.org/content/calm-loop', true, 1
),
(
  'remembrance', 'Remembrance Loop', 'beardalaxy', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/remembrance.ogg',
  'cc0/remembrance.ogg', 'supabase', array['sorrow']::text[], array['低谷', '回憶', '沉鬱', '離別']::text[],
  'CC0', 'https://opengameart.org/content/remembrance-loop', true, 2
),
(
  'dark', 'Dark Things Loop', 'iamoneabe', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/dark.mp3',
  'cc0/dark.mp3', 'supabase', array['dark']::text[], array['陰影', '威脅', '懸念', '秘密']::text[],
  'CC0', 'https://opengameart.org/content/dark-things-loop', true, 3
),
(
  'march', 'Epic March Loop', 'Eldritch Grim', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/epic-march.wav',
  'cc0/epic-march.wav', 'supabase', array['crisis']::text[], array['戰鬥', '逼近', '高張力', '軍隊']::text[],
  'CC0', 'https://opengameart.org/content/epic-march-loop', true, 4
),
(
  'legend', 'A Legend Will Rise', 'CodeManu', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/legend-will-rise.mp3',
  'cc0/legend-will-rise.mp3', 'supabase', array['rise', 'triumph']::text[], array['覺醒', '英雄', '再起', '希望']::text[],
  'CC0', 'https://opengameart.org/content/a-legend-will-rise-orchestral', true, 5
),
(
  'doomed', 'Doomed', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/doomed.mp3',
  'cc0/doomed.mp3', 'supabase', array['dark', 'sorrow', 'crisis']::text[], array['命運', '絕望', '崩塌', '悲劇']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 6
),
(
  'flags', 'Flags', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/flags.mp3',
  'cc0/flags.mp3', 'supabase', array['rise', 'triumph']::text[], array['希望', '使命', '勝利', '凱旋']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 7
),
(
  'great-mission', 'Great Mission', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/great-mission.mp3',
  'cc0/great-mission.mp3', 'supabase', array['rise', 'crisis', 'triumph']::text[], array['冒險', '任務', '遠征', '勇氣']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 8
),
(
  'spacetime', 'Spacetime', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/spacetime.mp3',
  'cc0/spacetime.mp3', 'supabase', array['calm', 'dark']::text[], array['科幻', '宇宙', '神秘', '時間']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 9
),
(
  'twists', 'Twists', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/twists.mp3',
  'cc0/twists.mp3', 'supabase', array['dark', 'crisis']::text[], array['反轉', '陰謀', '懸疑', '追查']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 10
),
(
  'waking-devil', 'Waking the Devil', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/waking-the-devil.mp3',
  'cc0/waking-the-devil.mp3', 'supabase', array['dark', 'crisis']::text[], array['恐怖', '惡兆', '怪物', '逼近']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 11
),
(
  'warped', 'Warped', 'Alexander Ehlers', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/warped.mp3',
  'cc0/warped.mp3', 'supabase', array['dark', 'crisis']::text[], array['扭曲', '失序', '瘋狂', '危機']::text[],
  'CC0', 'https://opengameart.org/content/free-music-pack', true, 12
),
(
  'ascended-nostalgia', 'Ascended Nostalgia', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/ascended-nostalgia.mp3',
  'cc0/ascended-nostalgia.mp3', 'supabase', array['sorrow', 'rise', 'calm']::text[], array['懷舊', '回憶', '成長', '釋懷']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 13
),
(
  'augmented-pathway', 'Augmented Pathway', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/augmented-pathway.mp3',
  'cc0/augmented-pathway.mp3', 'supabase', array['dark', 'rise']::text[], array['異境', '轉折', '探索', '不安']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 14
),
(
  'benny-record', 'Benny, Where Is My Record?', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/benny-where-is-my-record.mp3',
  'cc0/benny-where-is-my-record.mp3', 'supabase', array['calm', 'triumph']::text[], array['俏皮', '日常', '對話', '幽默']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 15
),
(
  'colorless-machine', 'Colorless Machine', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/colorless-machine.mp3',
  'cc0/colorless-machine.mp3', 'supabase', array['dark']::text[], array['機械', '冷冽', '空洞', '科技']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 16
),
(
  'diminished-man', 'Diminished Man', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/diminished-man.mp3',
  'cc0/diminished-man.mp3', 'supabase', array['dark', 'crisis']::text[], array['壓迫', '失衡', '危機', '焦躁']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 17
),
(
  'exotic-dome', 'Exotic Dome', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/exotic-dome.mp3',
  'cc0/exotic-dome.mp3', 'supabase', array['dark', 'calm']::text[], array['異域', '神秘', '古老', '探索']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 18
),
(
  'husband-ragtime', 'Husband of Ragtime', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/husband-of-ragtime.mp3',
  'cc0/husband-of-ragtime.mp3', 'supabase', array['calm', 'triumph']::text[], array['喜劇', '輕快', '復古', '熱鬧']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 19
),
(
  'chocolate-monument', 'The Monument of Chocolate Jack', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/monument-of-chocolate-jack.mp3',
  'cc0/monument-of-chocolate-jack.mp3', 'supabase', array['sorrow', 'dark']::text[], array['孤獨', '遺憾', '哀傷', '回望']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 20
),
(
  'yellow-goof', 'Yellow Goof', 'Trinity Paradox', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/yellow-goof.mp3',
  'cc0/yellow-goof.mp3', 'supabase', array['calm', 'triumph']::text[], array['古怪', '童趣', '幽默', '歡樂']::text[],
  'CC0', 'https://opengameart.org/content/a-music-collection', true, 21
),
(
  'broken-arm', 'Broken Arm', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/broken-arm.mp3',
  'cc0/broken-arm.mp3', 'supabase', array['crisis', 'sorrow']::text[], array['意外', '疼痛', '焦慮', '失落']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 22
),
(
  'casual-afternoon', 'Casual Afternoon', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/casual-afternoon.mp3',
  'cc0/casual-afternoon.mp3', 'supabase', array['calm']::text[], array['午後', '咖啡', '日常', '溫暖']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 23
),
(
  'icy-garden', 'Icy Garden', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/icy-garden.mp3',
  'cc0/icy-garden.mp3', 'supabase', array['calm', 'dark']::text[], array['冬日', '孤寂', '花園', '神秘']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 24
),
(
  'journey-forgotten', 'Journey Forgotten', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/journey-forgotten.mp3',
  'cc0/journey-forgotten.mp3', 'supabase', array['sorrow', 'rise']::text[], array['旅行', '遺忘', '回憶', '遠方']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 25
),
(
  'standardized-anxiety', 'Standardized Anxiety', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/standardized-anxiety.mp3',
  'cc0/standardized-anxiety.mp3', 'supabase', array['crisis', 'dark']::text[], array['城市', '焦慮', '匆忙', '壓力']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 26
),
(
  'without-time', 'Without Time', 'Roppy Chop Studios', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/without-time.mp3',
  'cc0/without-time.mp3', 'supabase', array['sorrow', 'dark']::text[], array['時間', '離別', '懸念', '追憶']::text[],
  'CC0', 'https://opengameart.org/content/original-midi-album', true, 27
),
(
  'brand-new-wisdom', 'A Brand New Wisdom', 'hernandack', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/a-brand-new-wisdom.ogg',
  'cc0/a-brand-new-wisdom.ogg', 'supabase', array['calm', 'rise']::text[], array['領悟', '沉思', '智慧', '新生']::text[],
  'CC0', 'https://opengameart.org/content/short-loops-background-music-pack', true, 28
),
(
  'just-saying-tho', 'Just Saying Tho', 'hernandack', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/just-saying-tho.ogg',
  'cc0/just-saying-tho.ogg', 'supabase', array['calm', 'triumph']::text[], array['對話', '機智', '輕鬆', '日常']::text[],
  'CC0', 'https://opengameart.org/content/short-loops-background-music-pack', true, 29
),
(
  'swinging-sweet', 'Swinging Sweet', 'hernandack', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/swinging-sweet.ogg',
  'cc0/swinging-sweet.ogg', 'supabase', array['calm', 'triumph']::text[], array['浪漫', '甜蜜', '約會', '輕快']::text[],
  'CC0', 'https://opengameart.org/content/short-loops-background-music-pack', true, 30
),
(
  'winter-dust', 'Winter Dust', 'hernandack', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/winter-dust.ogg',
  'cc0/winter-dust.ogg', 'supabase', array['sorrow', 'calm']::text[], array['冬日', '回憶', '寧靜', '淡淡哀傷']::text[],
  'CC0', 'https://opengameart.org/content/short-loops-background-music-pack', true, 31
),
(
  'sci-fi-airy', 'Airy', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-airy.ogg',
  'cc0/sci-fi-airy.ogg', 'supabase', array['calm', 'dark']::text[], array['失重', '空靈', '宇宙', '詭異']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 32
),
(
  'sci-fi-pulse', 'Pulse', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-pulse.ogg',
  'cc0/sci-fi-pulse.ogg', 'supabase', array['dark', 'crisis']::text[], array['心跳', '懸疑', '外星', '脈動']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 33
),
(
  'sci-fi-sector', 'Sector', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-sector.ogg',
  'cc0/sci-fi-sector.ogg', 'supabase', array['dark', 'calm']::text[], array['未知', '探索', '外星', '寂靜']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 34
),
(
  'sci-fi-title', 'Dark Sci-Fi Title', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-title.ogg',
  'cc0/sci-fi-title.ogg', 'supabase', array['dark', 'rise']::text[], array['主題', '未知', '科幻', '開場']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 35
),
(
  'sci-fi-transmission', 'Transmission', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-transmission.ogg',
  'cc0/sci-fi-transmission.ogg', 'supabase', array['dark', 'sorrow', 'crisis']::text[], array['訊號', '終局', '不祥', '釋放']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 36
),
(
  'sci-fi-urgent', 'Urgent', 'SRG774', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/sci-fi-urgent.ogg',
  'cc0/sci-fi-urgent.ogg', 'supabase', array['crisis']::text[], array['緊急', '倒數', '追逐', '高風險']::text[],
  'CC0', 'https://opengameart.org/content/dark-sci-fi-audio-pack', true, 37
),
(
  'dumus', 'Dumus', 'pauliuw', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/dumus.mp3',
  'cc0/dumus.mp3', 'supabase', array['calm', 'dark']::text[], array['謎題', '推理', '神秘', '思考']::text[],
  'CC0', 'https://opengameart.org/content/music-loops', true, 38
),
(
  'fast-background', 'Fast Background', 'pauliuw', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/fast-background.mp3',
  'cc0/fast-background.mp3', 'supabase', array['crisis', 'triumph']::text[], array['行動', '追逐', '輕快', '推進']::text[],
  'CC0', 'https://opengameart.org/content/music-loops', true, 39
),
(
  'four-loop', 'Four Loop', 'pauliuw', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/four-loop.mp3',
  'cc0/four-loop.mp3', 'supabase', array['calm']::text[], array['謎題', '輕盈', '專注', '好奇']::text[],
  'CC0', 'https://opengameart.org/content/music-loops', true, 40
),
(
  'tempo', 'Tempo', 'pauliuw', 'https://bydlhkzwvhykjttilwtr.supabase.co/storage/v1/object/public/music-library/cc0/tempo.mp3',
  'cc0/tempo.mp3', 'supabase', array['rise', 'crisis']::text[], array['節奏', '前進', '計畫', '加速']::text[],
  'CC0', 'https://opengameart.org/content/music-loops', true, 41
)
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
