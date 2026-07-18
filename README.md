# 聲境 AI｜小說配樂導演台

把任意題材的文章轉成「自然朗讀 + 動態配樂」的完整網頁工具。系統會辨識場景、情緒、張力與敘事功能，不預設英雄或逆境主題，建立逐幕聲音與配樂表。

## 已完成的正式版功能

- 作品庫：建立、匯入 `.txt` / `.md`、自動保存與切換作品。
- 場景導演：本機零設定分析；登入後可由 Supabase Edge Function 安全呼叫 OpenAI，分析分幕、情緒、張力、轉場與選曲線索。
- 導演風格：控制分析與演繹的整體傾向，會實際影響情緒強度、張力、朗讀速度、配樂音量與轉場秒數。
- 自然朗讀：優先使用 OpenAI GPT-4o mini TTS，依場景調整語氣、節奏與停頓；失敗時可回退瀏覽器繁中語音。
- 朗讀混音：場景同步、暫停／續播／跳幕、可點選與拖曳的故事時間軸、主音量與下一幕預先生成。
- 平滑轉場：漸入、交叉淡化、主題延續漸強、情節切點；每幕可人工微調。
- 安全曲庫：Supabase Storage 擴充至 41 首 CC0 配樂，每首保留作者、來源、授權、情緒與情境標籤；另有 5 首內建離線保底曲目。
- 可攜資料：匯出帶場景、情緒與混音參數的 JSON 配樂表。
- 漸進式雲端：沒有後端也能完整使用；登入後加入跨裝置保存與 AI 導演。

## 本機執行

```powershell
npm install
npm run dev
```

正式建置：

```powershell
npm run build
npm run preview
```

## 為什麼不是只有靜態網頁

朗讀、音樂混音、本機分析與瀏覽器作品庫都能在 GitHub Pages 靜態執行；但 OpenAI 金鑰不能安全地放在前端，跨裝置資料也需要登入與資料庫。因此採用：

1. GitHub Pages：公開前端與 5 首離線保底曲目。
2. Supabase Auth + Postgres：Email magic link 與私人作品庫（RLS 隔離）。
3. Supabase Storage + Postgres 曲目表：存放 41 首 CC0 曲目與曲目級標籤、授權資訊。
4. Supabase Edge Function：代管 OpenAI 金鑰，呼叫 Responses API 與 Audio Speech API，並將私人旁白快取存入 Storage。

## 啟用 Supabase（選配）

1. 建立一個免費 Supabase project。
2. 在 SQL Editor 執行 `supabase/schema.sql`。
3. 安裝 Supabase CLI 並登入，從專案根目錄執行：

   ```powershell
   supabase link --project-ref <PROJECT_REF>
   supabase secrets set OPENAI_API_KEY=<YOUR_KEY> OPENAI_MODEL=gpt-5-mini OPENAI_TTS_MODEL=gpt-4o-mini-tts OPENAI_TTS_VOICE=cedar
   supabase functions deploy analyze-story
   supabase functions deploy narrate-scene
   ```

   `OPENAI_MODEL` 可換成其他文字分析模型；若未設定，`analyze-story` 目前以 `gpt-5.6-luna` 作為程式預設值。

4. 在 GitHub Repository → Settings → Secrets and variables → Actions → Variables 加入：

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. 在 Supabase Auth URL Configuration 加入正式 GitHub Pages URL 作為 Redirect URL。

> `OPENAI_API_KEY` 只放在 Supabase secret，絕對不要命名為 `VITE_OPENAI_API_KEY` 或提交到 Git。

> OpenAI 合成聲音在介面中會明確標示為 AI 生成。正式朗讀須先以 Email magic link 登入，避免公開網頁被濫用產生 API 費用。

## 發布

`.github/workflows/pages.yml` 會在 `main` 更新時自動執行型別檢查、建置到 `site/` 並發布 GitHub Pages。Vite 使用相對資源路徑，可部署在 GitHub project site。

## 授權與資料來源

- 網頁程式：MIT License。
- 音樂：41 首遠端曲目與 5 首離線保底曲目皆為 CC0，詳見 `public/audio/CREDITS.md` 與 `public/music-catalog.json`。
- 參考研究：[jaidevshriram/auto-book-soundtrack](https://github.com/jaidevshriram/auto-book-soundtrack/) 的文本／影像配樂對位概念。正式版未使用該專案程式碼、資料集或電影原聲。
