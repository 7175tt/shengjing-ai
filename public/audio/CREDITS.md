# 聲境 AI 音樂來源與授權

所有曲目的作品頁面均標示為 Creative Commons Zero（CC0），用於聲境 AI 正式版的動態配樂功能。網站內建五首離線保底曲目；正式遠端曲庫另收錄 35 首非 MIDI 衍生曲目並放在 Supabase Storage。

| 本機檔案 | 曲名 | 作者 | 情境用途 | 來源 |
|---|---|---|---|---|
| `calm.mp3` | Calm Loop | wipics | 平靜、留白 | <https://opengameart.org/content/calm-loop> |
| `remembrance.ogg` | Remembrance Loop | beardalaxy | 失落、回憶 | <https://opengameart.org/content/remembrance-loop> |
| `dark.mp3` | Dark Things Loop | iamoneabe | 陰影、威脅 | <https://opengameart.org/content/dark-things-loop> |
| `epic-march.wav` | Epic March Loop | Eldritch Grim | 戰鬥、危機 | <https://opengameart.org/content/epic-march-loop> |
| `legend-will-rise.mp3` | A Legend Will Rise (Orchestral) | CodeManu | 覺醒、英雄、再起 | <https://opengameart.org/content/a-legend-will-rise-orchestral> |

CC0 不要求署名，但仍保留作者與來源，方便日後查核素材沿革。正式產品擴充曲庫時，仍應保存各來源頁的授權證據，並維護曲目級權利資料表。

## Supabase 遠端曲庫（35 首）

遠端曲庫由下列 CC0 素材包整理而成；每首曲目的實際檔名、作者、來源、授權、情緒標籤與 Storage object key，完整記錄在 `public/music-catalog.json` 及 `supabase/music-catalog-seed.sql`。

| 素材包 | 收錄數 | 來源 |
|---|---:|---|
| 原有離線曲目 | 5 | 上表各曲目來源 |
| Free Music Pack | 7 | <https://opengameart.org/content/free-music-pack> |
| A Music Collection | 9 | <https://opengameart.org/content/a-music-collection> |
| Short Loops Background Music Pack | 4 | <https://opengameart.org/content/short-loops-background-music-pack> |
| Dark Sci-Fi Audio Pack | 6 | <https://opengameart.org/content/dark-sci-fi-audio-pack> |
| Music Loops | 4 | <https://opengameart.org/content/music-loops> |

正式曲庫總計 35 首（原有 5 首亦納入遠端目錄），可依平靜、溫暖、希望、孤獨、悲傷、懸疑、恐懼、危機、戰鬥、奇幻、科幻、覺醒、勝利等情緒與敘事情境進行選曲。原先 6 首 Original MIDI Album 衍生曲目已退役，不會載入、顯示或參與自動選曲。
