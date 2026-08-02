import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Check, Headphones, Mail, Pause, Play, Sparkles, Users, WandSparkles } from "lucide-react";
import { generateDemoNarration, submitMarketLead } from "./cloud";

type MarketRole = "reader" | "creator";
type SubmissionMode = "cloud" | "local" | null;

interface MarketValidationProps {
  onOpenWorkspace: () => void;
  onNotify: (message: string, tone?: "good" | "warn") => void;
}

const roleContent: Record<MarketRole, {
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  unit: string;
  bullets: string[];
}> = {
  reader: {
    eyebrow: "讀者創始體驗 · 測試價格",
    title: "每月 5 章，讓腦內的戲有自己的配樂。",
    description: "貼上一章小說，聲境 AI 會依場景切換朗讀聲音與配樂。先用一章試聽，再決定這種閱讀方式值不值得留下來。",
    price: "NT$199",
    unit: "/ 月",
    bullets: ["每月 5 章小說配樂朗讀", "OpenAI 自然語音與音色選擇", "可調整場景轉場與音樂音量"],
  },
  creator: {
    eyebrow: "作者／工作室創始測試 · 測試價格",
    title: "把作品變成讀者願意戴上耳機的體驗。",
    description: "用同一套導演台處理章節、情緒與配樂，先從 10 章的創作測試開始，找出讀者真正願意付費的聲音版本。",
    price: "NT$499",
    unit: "/ 月",
    bullets: ["每月 10 章配樂朗讀測試額度", "可匯出每章的配樂設計表", "優先回饋與作品展示機會"],
  },
};

const getConfiguredUrl = (role: MarketRole) => role === "reader"
  ? (import.meta.env.VITE_MARKET_READER_CHECKOUT_URL as string | undefined)
  : (import.meta.env.VITE_MARKET_CREATOR_CHECKOUT_URL as string | undefined);

export function MarketValidation({ onOpenWorkspace, onNotify }: MarketValidationProps) {
  const [role, setRole] = useState<MarketRole>("reader");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmissionMode>(null);
  const [demoAudioState, setDemoAudioState] = useState<"idle" | "loading" | "playing">("idle");
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);
  const offer = roleContent[role];
  const checkoutUrl = getConfiguredUrl(role);
  const bars = useMemo(() => [22, 38, 28, 56, 44, 78, 63, 89, 51, 70, 36, 62, 45, 31, 54, 41, 67, 35], []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onended = () => setDemoAudioState("idle");
    audio.onerror = () => setDemoAudioState("idle");
    demoAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      demoAudioRef.current = null;
    };
  }, []);

  const toggleDemoAudio = async () => {
    const audio = demoAudioRef.current;
    if (!audio) return;
    if (demoAudioState === "playing") {
      audio.pause();
      setDemoAudioState("idle");
      return;
    }
    try {
      setDemoAudioState("loading");
      if (!audio.src) {
        const result = await generateDemoNarration("demo-scene-1");
        audio.src = result.url;
      }
      await audio.play();
      setDemoAudioState("playing");
    } catch {
      setDemoAudioState("idle");
      onNotify("展示旁白暫時無法載入，請稍後再試。", "warn");
    }
  };

  const focusForm = (nextRole = role) => {
    setRole(nextRole);
    window.requestAnimationFrame(() => document.querySelector("#founding-form")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handlePaidIntent = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      return;
    }
    focusForm(role);
    onNotify("付款連結尚未設定，先留下付費意願即可。", "warn");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      onNotify("請填寫可收信的 Email。", "warn");
      return;
    }
    if (!consent) {
      onNotify("請勾選同意接收創始測試通知。", "warn");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitMarketLead({ email: email.trim(), role, note: note.trim() || undefined });
      setSubmitted("cloud");
      if (result.duplicate) {
        onNotify("這個 Email 已在創始測試名單中。", "good");
      } else if (result.notificationSent) {
        onNotify("已收到名單，通知已寄給產品負責人。", "good");
      } else {
        onNotify("名單已保存，但通知信服務尚未完成設定。", "warn");
      }
    } catch {
      const key = "shengjing-market-leads";
      const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
      window.localStorage.setItem(key, JSON.stringify([...existing, { email: email.trim(), role, note: note.trim(), createdAt: new Date().toISOString() }]));
      setSubmitted("local");
      onNotify("雲端名單尚未啟用，已先保存在這台裝置。", "warn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="market-landing">
      <nav className="market-nav" aria-label="創始測試導覽">
        <div className="market-wordmark"><span className="market-wordmark-mark"><i /><i /><i /><i /><i /></span><span><b>聲境 AI</b><small>創始測試版</small></span></div>
        <div className="market-nav-links"><a href="#how-it-works">怎麼運作</a><a href="#offers">測試方案</a><a href="#founding-form">加入名單</a></div>
        <button className="market-nav-cta" onClick={onOpenWorkspace}>進入工作台 <ArrowRight size={15} /></button>
      </nav>

      <section className="market-hero">
        <div className="market-hero-copy">
          <span className="market-eyebrow"><span className="market-live-dot" />小說配樂朗讀的早期測試</span>
          <h1>讓故事有聲音，<em>也有自己的情緒弧線。</em></h1>
          <p>聲境 AI 把一章小說拆成場景、情緒與張力，搭配自然語音和可平滑轉場的配樂。你不用學剪輯，只要貼上文字，先聽一遍。</p>
          <div className="market-hero-actions"><button className="market-primary" onClick={() => focusForm("reader")}><Headphones size={17} /> 我想試聽並加入名單</button><button className="market-secondary" onClick={onOpenWorkspace}><Play size={15} fill="currentColor" /> 直接開啟工作台</button></div>
          <div className="market-proof"><span><Check size={13} /> 先用一章驗證</span><span><Check size={13} /> 自備 OpenAI Key</span><span><Check size={13} /> 不收小說全文</span></div>
        </div>
        <div className="soundscape-stage" aria-label="小說從文字轉為聲音的示意">
          <div className="stage-topline"><span>CHAPTER 01 · AUDIO DIRECTOR</span><span>01:42</span></div>
          <div className="stage-title"><span className="stage-scene-dot" /><b>逆風之後</b><small>場景 03 · 再起</small></div>
          <div className="stage-wave" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ "--bar-height": `${height}%`, "--bar-delay": `${index * -0.09}s` } as CSSProperties} />)}</div>
          <div className="stage-timeline"><span>文字</span><i /><span>情緒分析</span><i /><span>朗讀</span><i /><span>配樂</span></div>
          <div className="stage-cue"><span><WandSparkles size={14} /> AI 導演提示</span><b>低頻漸強 · 交叉淡化 3.2s</b><small>不是硬切，是讓情緒先抵達。</small><button className="stage-audio-button" type="button" onClick={() => void toggleDemoAudio()} disabled={demoAudioState === "loading"}>{demoAudioState === "playing" ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{demoAudioState === "loading" ? "正在載入 OpenAI 旁白…" : demoAudioState === "playing" ? "暫停 OpenAI 展示旁白" : "試聽 OpenAI 展示旁白"}</button><small className="stage-ai-disclosure">展示旁白由 OpenAI AI 生成，並非真人聲音。</small></div>
        </div>
      </section>

      <section className="market-signal" aria-label="早期測試訊號"><span>正在找第一批真實使用者</span><b>讀者想要更沉浸的閱讀，作者想要更有記憶點的作品。</b><span>你只需要用一次耳朵回答。</span></section>

      <section className="market-how" id="how-it-works">
        <div className="market-section-intro"><span className="market-eyebrow">三個步驟</span><h2>從文字到聲境，不需要學會做音樂。</h2><p>每個決定都能回到小說原文：哪裡轉場、哪裡留白、哪裡讓聲音站到最前面。</p></div>
        <div className="market-flow">
          <article><span>01</span><h3>貼上一章</h3><p>匯入 TXT、Markdown，或直接貼上 2,000 字內的章節。</p></article>
          <article><span>02</span><h3>AI 找出情緒弧線</h3><p>分析場景、張力與節奏，選出適合的音樂與轉場方式。</p></article>
          <article><span>03</span><h3>戴上耳機播放</h3><p>自然語音與配樂同步前進，點選時間軸就能跳到想聽的段落。</p></article>
        </div>
      </section>

      <section className="market-offers" id="offers">
        <div className="market-section-intro"><span className="market-eyebrow">創始測試方案</span><h2>先驗證「值得付費」的那一刻。</h2><p>以下金額是市場測試假設，不是既定定價。你的選擇會直接影響產品下一版。</p></div>
        <div className="market-role-switch" role="tablist" aria-label="選擇使用身分">
          <button className={role === "reader" ? "active" : ""} onClick={() => setRole("reader")} role="tab" aria-selected={role === "reader"}><Users size={16} /> 我是讀者</button>
          <button className={role === "creator" ? "active" : ""} onClick={() => setRole("creator")} role="tab" aria-selected={role === "creator"}><Sparkles size={16} /> 我是作者／工作室</button>
        </div>
        <div className="market-offer-detail">
          <div><span className="market-eyebrow">{offer.eyebrow}</span><h3>{offer.title}</h3><p>{offer.description}</p><ul>{offer.bullets.map((bullet) => <li key={bullet}><Check size={15} />{bullet}</li>)}</ul></div>
          <div className="market-price"><span>測試價格</span><strong>{offer.price}</strong><small>{offer.unit}</small><button className="market-primary" onClick={handlePaidIntent}>我願意為此付費 <ArrowRight size={15} /></button><button className="market-text-button" onClick={() => focusForm(role)}>先加入候補名單</button></div>
        </div>
      </section>

      <section className="market-form-section" id="founding-form">
        <div className="market-form-copy"><span className="market-eyebrow">加入第一批測試</span><h2>把你的閱讀習慣，交給一個小小的實驗。</h2><p>留下 Email 與身分，我會寄出試聽邀請、測試價格與後續更新。只收必要資訊，不要求上傳小說全文。</p><div className="market-form-note"><Mail size={16} /><span><b>資料用途很單純</b><small>只用於創始測試聯絡與回饋，不會把你的 Email 當成公開名單。</small></span></div></div>
        <form className="market-form" onSubmit={(event) => void handleSubmit(event)}>
          {submitted ? <div className="market-form-success"><span><Check size={19} /></span><h3>{submitted === "cloud" ? "已收到，名單已同步。" : "已收到，暫存於這台裝置。"}</h3><p>{submitted === "cloud" ? "創始測試開放時，我會依你選的身分寄出邀請。" : "目前雲端名單尚未完成部署；你可以先保留這個頁面，之後再重新送出。"}</p><button type="button" className="market-text-button" onClick={() => { setSubmitted(null); setEmail(""); setNote(""); setConsent(false); }}>再填一位</button></div> : <>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
            <label>你是哪一種使用者<select value={role} onChange={(event) => setRole(event.target.value as MarketRole)}><option value="reader">讀者：想要更沉浸地讀小說</option><option value="creator">作者／工作室：想把作品做成聲音體驗</option></select></label>
            <label>一句話告訴我你想怎麼用（選填）<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：我每週讀三章，想在通勤時聽。" rows={3} /></label>
            <label className="market-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>我同意接收創始測試通知，並理解這不是立即購買。</span></label>
            <button className="market-primary market-form-submit" disabled={submitting} type="submit">{submitting ? "送出中…" : "加入創始測試名單"} <ArrowRight size={15} /></button>
          </>}
        </form>
      </section>

      <footer className="market-footer"><span>聲境 AI · 讓文字被聽見</span><button onClick={onOpenWorkspace}>回到工作台 <ArrowRight size={14} /></button><small>創始測試頁 · 2026</small></footer>
    </div>
  );
}
