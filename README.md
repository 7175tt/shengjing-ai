# 聲境 AI｜小說配樂導演台

把一篇小說轉成「朗讀 + 動態配樂」的完整網頁工具。系統會辨識場景、情緒、張力與敘事功能，建立逐幕配樂表，朗讀時以雙音軌交叉淡化切換音樂。

## 已完成的正式版功能

- 作品庫：建立、匯入 `.txt` / `.md`、自動保存與切換作品。
- 場景導演：本機零設定分析；設定 Supabase 後可使用 OpenAI 結構化輸出分析。
- 朗讀混音：瀏覽器繁中語音、場景同步、暫停／續播／跳幕與主音量。
- 平滑轉場：漸入、交叉淡化、主題延續漸強、情節切點；每幕可人工微調。
- 安全曲庫：內建 5 首 CC0 配樂，來源與作者完整揭露於 `public/audio/CREDITS.md`。
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

1. GitHub Pages：公開前端與 CC0 音樂。
2. Supabase Auth + Postgres：Email magic link 與私人作品庫（RLS 隔離）。
3. Supabase Edge Function：代管 OpenAI 金鑰並呼叫 Responses API。

## 啟用 Supabase（選配）

1. 建立一個免費 Supabase project。
2. 在 SQL Editor 執行 `supabase/schema.sql`。
3. 安裝 Supabase CLI 並登入，從專案根目錄執行：

   ```powershell
   supabase link --project-ref <PROJECT_REF>
   supabase secrets set OPENAI_API_KEY=<YOUR_KEY> OPENAI_MODEL=gpt-5.6-luna
   supabase functions deploy analyze-story
   ```

4. 在 GitHub Repository → Settings → Secrets and variables → Actions → Variables 加入：

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. 在 Supabase Auth URL Configuration 加入正式 GitHub Pages URL 作為 Redirect URL。

> `OPENAI_API_KEY` 只放在 Supabase secret，絕對不要命名為 `VITE_OPENAI_API_KEY` 或提交到 Git。

## 發布

`.github/workflows/pages.yml` 會在 `main` 更新時自動執行型別檢查、建置到 `site/` 並發布 GitHub Pages。Vite 使用相對資源路徑，可部署在 GitHub project site。

## 授權與資料來源

- 網頁程式：MIT License。
- 音樂：各曲目皆為 CC0，詳見 `public/audio/CREDITS.md`。
- 參考研究：[jaidevshriram/auto-book-soundtrack](https://github.com/jaidevshriram/auto-book-soundtrack/) 的文本／影像配樂對位概念。正式版未使用該專案程式碼、資料集或電影原聲。
