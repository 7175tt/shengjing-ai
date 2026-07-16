import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, ChevronDown, CircleUserRound, Cloud, CloudOff, Download, FileAudio,
  FilePlus2, Headphones, Library, LoaderCircle, LogIn, LogOut, Menu, Music2,
  Pause, Play, Plus, Save, Settings2, SkipBack, SkipForward, Sparkles, Square,
  Upload, Volume2, WandSparkles, X,
} from "lucide-react";
import { SoundtrackMixer } from "./audioEngine";
import { analyzeInCloud, getCloudUser, isCloudConfigured, pullCloudProjects, pushCloudProject, signInWithEmail, signOut } from "./cloud";
import { getTrack, moodColor, MUSIC_LIBRARY } from "./storyEngine";
import { exportCueSheet, loadCurrentProjectId, loadProjects, newProject, saveCurrentProjectId, saveProjects } from "./storage";
import type { AnalysisMode, SceneCue, StoryProject, StoryStyle } from "./types";
import { analyzeStory } from "./storyEngine";

type Toast = { message: string; tone?: "good" | "warn" } | null;
const styles: StoryStyle[] = ["逆境再起", "英雄征途", "懸疑暗湧", "克制敘事"];
const formatDate = (date: string) => new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(date));

function App() {
  const [projects, setProjects] = useState<StoryProject[]>(() => loadProjects());
  const [currentId, setCurrentId] = useState(() => loadCurrentProjectId() ?? loadProjects()[0].id);
  const [selectedScene, setSelectedScene] = useState(0);
  const [view, setView] = useState<"script" | "library">("script");
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(isCloudConfigured ? "cloud" : "local");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.82);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const mixerRef = useRef<SoundtrackMixer | null>(null);
  const projectRef = useRef<StoryProject | null>(null);
  const stoppedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = projects.find((project) => project.id === currentId) ?? projects[0];
  const cue = current?.cues[selectedScene] ?? current?.cues[0];
  projectRef.current = current ?? null;

  const notify = useCallback((message: string, tone: "good" | "warn" = "good") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const mixer = new SoundtrackMixer();
    mixerRef.current = mixer;
    void getCloudUser().then((user) => setUserEmail(user?.email ?? null));
    return () => {
      stoppedRef.current = true;
      speechSynthesis.cancel();
      mixer.destroy();
    };
  }, []);

  useEffect(() => {
    saveProjects(projects);
    if (currentId) saveCurrentProjectId(currentId);
  }, [projects, currentId]);

  const updateCurrent = useCallback((patch: Partial<StoryProject>) => {
    setProjects((items) => items.map((project) => project.id === currentId
      ? { ...project, ...patch, updatedAt: new Date().toISOString() }
      : project));
  }, [currentId]);

  const selectProject = (id: string) => {
    stopPlayback();
    setCurrentId(id);
    setSelectedScene(0);
    setEditing(false);
    setDirty(false);
    setMobileNav(false);
  };

  const createProject = () => {
    const project = newProject("未命名作品", "", "逆境再起");
    setProjects((items) => [project, ...items]);
    setCurrentId(project.id);
    setSelectedScene(0);
    setEditing(true);
    setDirty(true);
    setMobileNav(false);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const body = await file.text();
    if (!body.trim()) return notify("檔案內沒有可讀取的文字", "warn");
    const title = file.name.replace(/\.(txt|md)$/i, "");
    const project = newProject(title, body, "逆境再起");
    setProjects((items) => [project, ...items]);
    setCurrentId(project.id);
    setSelectedScene(0);
    setEditing(false);
    setDirty(false);
    notify(`已匯入「${title}」`);
  };

  const runAnalysis = async () => {
    if (!current.body.trim()) return notify("請先貼上或匯入小說文字", "warn");
    setAnalyzing(true);
    try {
      let cues: SceneCue[];
      if (analysisMode === "cloud") {
        if (!isCloudConfigured || !userEmail) throw new Error("請先完成雲端設定並登入");
        cues = await analyzeInCloud(current.body, current.style);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 520));
        cues = analyzeStory(current.body, current.style);
      }
      updateCurrent({ cues });
      setSelectedScene(0);
      setEditing(false);
      setDirty(false);
      notify(`${cues.length} 個場景已完成配樂設計`);
    } catch (error) {
      if (analysisMode === "cloud") {
        const cues = analyzeStory(current.body, current.style);
        updateCurrent({ cues });
        setAnalysisMode("local");
        setDirty(false);
        notify(`雲端暫不可用，已改用本機分析：${error instanceof Error ? error.message : "連線失敗"}`, "warn");
      } else notify(error instanceof Error ? error.message : "分析失敗", "warn");
    } finally { setAnalyzing(false); }
  };

  const updateCue = (patch: Partial<SceneCue>) => {
    const cues = current.cues.map((item, index) => index === selectedScene ? { ...item, ...patch } : item);
    updateCurrent({ cues });
  };

  const stopPlayback = () => {
    stoppedRef.current = true;
    speechSynthesis.cancel();
    mixerRef.current?.stop(0.8);
    setPlaying(false);
    setPaused(false);
    setSceneProgress(0);
  };

  const speakScene = useCallback(async (index: number) => {
    const project = projectRef.current;
    const scene = project?.cues[index];
    if (!scene || stoppedRef.current) {
      setPlaying(false);
      mixerRef.current?.stop(1.4);
      return;
    }
    setSelectedScene(index);
    setSceneProgress(0);
    const track = getTrack(scene.musicTrackId);
    try { await mixerRef.current?.transition(track, scene.transitionSeconds, scene.musicLevel); }
    catch { notify("瀏覽器阻擋了自動播放，請再按一次播放", "warn"); setPlaying(false); return; }
    const utterance = new SpeechSynthesisUtterance(scene.text);
    utterance.lang = "zh-TW";
    utterance.rate = scene.narrationRate;
    const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().includes("zh-tw"))
      ?? speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    utterance.onboundary = (event) => setSceneProgress(Math.min(1, event.charIndex / Math.max(1, scene.text.length)));
    utterance.onend = () => {
      setSceneProgress(1);
      if (!stoppedRef.current) void speakScene(index + 1);
    };
    utterance.onerror = () => {
      if (!stoppedRef.current) { setPlaying(false); mixerRef.current?.stop(); notify("朗讀被瀏覽器中斷", "warn"); }
    };
    speechSynthesis.speak(utterance);
  }, [notify]);

  const playFrom = (index = selectedScene) => {
    if (!current.cues.length) return notify("請先分析故事，建立場景配樂", "warn");
    stoppedRef.current = false;
    speechSynthesis.cancel();
    setPlaying(true);
    setPaused(false);
    void speakScene(index);
  };

  const togglePause = () => {
    if (!playing) return playFrom();
    if (paused) {
      speechSynthesis.resume(); mixerRef.current?.resume(); setPaused(false);
    } else {
      speechSynthesis.pause(); mixerRef.current?.pause(); setPaused(true);
    }
  };

  const previewScene = async (index: number) => {
    stopPlayback();
    setSelectedScene(index);
    const selected = current.cues[index];
    if (!selected) return;
    try { await mixerRef.current?.transition(getTrack(selected.musicTrackId), selected.transitionSeconds, selected.musicLevel); }
    catch { notify("按播放即可啟用聲音", "warn"); }
  };

  const sendMagicLink = async () => {
    if (!email.includes("@")) return notify("請輸入有效的 Email", "warn");
    setCloudBusy(true);
    try { await signInWithEmail(email); notify("登入連結已寄出，請到信箱確認"); }
    catch (error) { notify(error instanceof Error ? error.message : "寄送失敗", "warn"); }
    finally { setCloudBusy(false); }
  };

  const syncCloud = async () => {
    setCloudBusy(true);
    try {
      await pushCloudProject(current);
      const remote = await pullCloudProjects();
      setProjects((local) => {
        const remoteIds = new Set(remote.map((project) => project.id));
        return [...remote, ...local.filter((project) => !remoteIds.has(project.id))];
      });
      notify("作品已同步到雲端");
    } catch (error) { notify(error instanceof Error ? error.message : "同步失敗", "warn"); }
    finally { setCloudBusy(false); }
  };

  const wordCount = current?.body.replace(/\s/g, "").length ?? 0;
  const globalProgress = useMemo(() => {
    if (!current?.cues.length) return 0;
    return ((selectedScene + sceneProgress) / current.cues.length) * 100;
  }, [current?.cues.length, selectedScene, sceneProgress]);

  if (!current) return null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setMobileNav(true)} aria-label="開啟作品庫"><Menu size={19} /></button>
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        <div className="brand-copy"><b>聲境 AI</b><small>小說配樂導演台</small></div>
        <div className="topbar-center">
          <span className={`status-dot ${analysisMode}`} />
          {analysisMode === "cloud" ? "AI 導演" : "本機導演"}
          <span className="autosave"><Save size={13} /> 已自動保存</span>
        </div>
        <div className="topbar-actions">
          <button className="quiet-button" onClick={() => exportCueSheet(current)}><Download size={16} /><span>匯出配樂表</span></button>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="設定"><Settings2 size={18} /></button>
        </div>
      </header>

      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-mobile-head"><b>作品庫</b><button className="icon-button" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="workspace-label"><Library size={15} /> 我的作品 <span>{projects.length}</span></div>
        <div className="project-list">
          {projects.map((project) => (
            <button key={project.id} className={`project-row ${project.id === current.id ? "active" : ""}`} onClick={() => selectProject(project.id)}>
              <span className="project-symbol"><BookOpen size={16} /></span>
              <span><b>{project.title || "未命名作品"}</b><small>{project.cues.length} 場景 · {formatDate(project.updatedAt)}</small></span>
              {project.source === "cloud" && <Cloud size={13} />}
            </button>
          ))}
        </div>
        <div className="sidebar-actions">
          <button onClick={createProject}><Plus size={16} /> 新作品</button>
          <button onClick={() => fileInputRef.current?.click()}><Upload size={16} /> 匯入文字</button>
          <input ref={fileInputRef} hidden type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => void handleImport(event.target.files?.[0])} />
        </div>
        <div className="cloud-state">
          {userEmail ? <Cloud size={16} /> : <CloudOff size={16} />}
          <span><b>{userEmail ? "雲端已連線" : "儲存在這台裝置"}</b><small>{userEmail ?? "可隨時啟用跨裝置同步"}</small></span>
          <button onClick={() => setSettingsOpen(true)}>{userEmail ? "管理" : "啟用"}</button>
        </div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="關閉導覽" />}

      <main className="studio">
        <section className="manuscript-panel">
          <div className="manuscript-head">
            <div className="title-stack">
              <input aria-label="作品名稱" value={current.title} onChange={(event) => updateCurrent({ title: event.target.value })} />
              <span>{wordCount.toLocaleString()} 字 · {current.cues.length} 個場景</span>
            </div>
            <div className="view-switch">
              <button className={view === "script" ? "active" : ""} onClick={() => setView("script")}><BookOpen size={15} /> 手稿</button>
              <button className={view === "library" ? "active" : ""} onClick={() => setView("library")}><Music2 size={15} /> 音樂庫</button>
            </div>
          </div>

          {view === "script" ? (
            <>
              <div className="director-bar">
                <div className="style-select">
                  <span>敘事情緒</span>
                  <select value={current.style} onChange={(event) => { updateCurrent({ style: event.target.value as StoryStyle }); setDirty(true); }}>
                    {styles.map((style) => <option key={style}>{style}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </div>
                <div className="mode-choice" title="雲端未設定時會自動使用本機分析">
                  <button className={analysisMode === "local" ? "active" : ""} onClick={() => setAnalysisMode("local")}>本機</button>
                  <button disabled={!isCloudConfigured || !userEmail} className={analysisMode === "cloud" ? "active" : ""} onClick={() => setAnalysisMode("cloud")}>雲端 AI</button>
                </div>
                <button className="analyze-button" disabled={analyzing} onClick={() => void runAnalysis()}>
                  {analyzing ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}
                  {analyzing ? "正在讀懂情節…" : dirty ? "重新設計配樂" : "分析並設計配樂"}
                </button>
              </div>
              <div className="editor-toolbar">
                <span>{dirty ? "文字已變更，建議重新分析" : "場景與配樂已同步"}</span>
                <button onClick={() => setEditing((value) => !value)}>{editing ? "完成編輯" : "編輯全文"}</button>
              </div>
              {editing ? (
                <textarea className="story-editor" aria-label="小說全文" value={current.body} placeholder="在這裡貼上小說章節，或從左側匯入 .txt / .md…" onChange={(event) => { updateCurrent({ body: event.target.value }); setDirty(true); }} />
              ) : (
                <article className="manuscript" aria-label="小說場景">
                  {current.cues.length ? current.cues.map((scene, index) => (
                    <button key={scene.id} className={`scene-text ${index === selectedScene ? "active" : ""} ${playing && index === selectedScene ? "speaking" : ""}`} onClick={() => void previewScene(index)}>
                      <span className="scene-gutter"><i style={{ background: moodColor[scene.mood] }} /><small>{String(index + 1).padStart(2, "0")}</small></span>
                      <span className="scene-copy"><em>{scene.narrativeFunction}</em>{scene.text}</span>
                    </button>
                  )) : (
                    <button className="empty-manuscript" onClick={() => setEditing(true)}><FilePlus2 size={24} /><b>開始一個故事</b><span>貼上小說文字，聲境 AI 會替你規劃每一幕的聲音。</span></button>
                  )}
                </article>
              )}
            </>
          ) : (
            <div className="music-library">
              <div className="library-intro"><span>內建曲庫</span><h2>可安心發表的 CC0 配樂</h2><p>正式版只使用可再利用的公開授權音樂。每首曲目都保留作者、來源與情緒標籤。</p></div>
              {MUSIC_LIBRARY.map((track) => (
                <div className="track-row" key={track.id}>
                  <button onClick={() => void mixerRef.current?.transition(track, 1.2, 0.2)} aria-label={`試聽 ${track.title}`}><Play size={15} fill="currentColor" /></button>
                  <span className="track-wave" aria-hidden="true">▂▅▃▇▄▆▂▅▇▃▆▄▂</span>
                  <span><b>{track.title}</b><small>{track.author} · CC0</small></span>
                  <div className="tags">{track.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
                  <a href={track.sourceUrl} target="_blank" rel="noreferrer">來源</a>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="inspector">
          <div className="inspector-head"><span>場景導演</span><small>{cue ? `${selectedScene + 1} / ${current.cues.length}` : "尚未分析"}</small></div>
          {cue ? (
            <div className="inspector-content">
              <div className="scene-identity"><i style={{ background: moodColor[cue.mood] }} /><span><small>{cue.narrativeFunction}</small><b>{cue.title}</b></span></div>
              <p className="reason">{cue.reason}</p>
              <div className="meter-block">
                <div><span>張力</span><b>{Math.round(cue.tension * 100)}</b></div>
                <div className="meter"><i style={{ width: `${cue.tension * 100}%` }} /></div>
                <div><span>動態</span><b>{Math.round(cue.arousal * 100)}</b></div>
                <div className="meter"><i style={{ width: `${cue.arousal * 100}%` }} /></div>
              </div>
              <label className="field-label">配樂</label>
              <select className="field" value={cue.musicTrackId} onChange={(event) => updateCue({ musicTrackId: event.target.value })}>
                {MUSIC_LIBRARY.map((track) => <option value={track.id} key={track.id}>{track.title}</option>)}
              </select>
              <div className="track-detail"><FileAudio size={17} /><span><b>{getTrack(cue.musicTrackId).author}</b><small>{getTrack(cue.musicTrackId).tags.join(" · ")} · CC0</small></span></div>
              <label className="field-label">轉場方式</label>
              <select className="field" value={cue.transitionType} onChange={(event) => updateCue({ transitionType: event.target.value as SceneCue["transitionType"] })}>
                <option value="fade">漸入／漸出</option><option value="crossfade">交叉淡化</option><option value="swell">延續並漸強</option><option value="cut">情節切點</option>
              </select>
              <div className="range-field"><span>轉場時間 <b>{cue.transitionSeconds.toFixed(1)} 秒</b></span><input type="range" min="1" max="8" step="0.2" value={cue.transitionSeconds} onChange={(event) => updateCue({ transitionSeconds: Number(event.target.value) })} /></div>
              <div className="range-field"><span>場景音量 <b>{Math.round(cue.musicLevel * 100)}%</b></span><input type="range" min="0.08" max="0.35" step="0.01" value={cue.musicLevel} onChange={(event) => updateCue({ musicLevel: Number(event.target.value) })} /></div>
              <div className="keywords"><span>判斷線索</span><div>{cue.matchedKeywords.length ? cue.matchedKeywords.map((keyword) => <i key={keyword}>{keyword}</i>) : <i>情緒弧線</i>}</div></div>
            </div>
          ) : <div className="inspector-empty"><Sparkles size={24} /><b>等待第一幕</b><span>分析完成後，可在這裡微調每個場景。</span></div>}
        </aside>
      </main>

      <footer className="transport">
        <div className="now-playing">
          <span className="album-mark"><Headphones size={18} /></span>
          <span><small>現在場景</small><b>{cue?.title ?? "等待配樂"}</b></span>
        </div>
        <div className="transport-center">
          <div className="transport-buttons">
            <button disabled={selectedScene === 0} onClick={() => playFrom(Math.max(0, selectedScene - 1))}><SkipBack size={17} fill="currentColor" /></button>
            <button className="play-main" onClick={togglePause}>{playing && !paused ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button>
            <button onClick={stopPlayback}><Square size={14} fill="currentColor" /></button>
            <button disabled={selectedScene >= current.cues.length - 1} onClick={() => playFrom(Math.min(current.cues.length - 1, selectedScene + 1))}><SkipForward size={17} fill="currentColor" /></button>
          </div>
          <div className="progress-row"><span>{String(selectedScene + 1).padStart(2, "0")}</span><div className="progress"><i style={{ width: `${globalProgress}%` }} /></div><span>{String(current.cues.length).padStart(2, "0")}</span></div>
        </div>
        <div className="master-volume"><Volume2 size={17} /><input aria-label="主音量" type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(event) => { const value = Number(event.target.value); setMasterVolume(value); mixerRef.current?.setMasterVolume(value); }} /><span>{Math.round(masterVolume * 100)}</span></div>
      </footer>

      {settingsOpen && (
        <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="settings-modal" role="dialog" aria-modal="true" aria-label="雲端與 AI 設定">
            <div className="modal-head"><div><span>工作區設定</span><h2>雲端與 AI</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)}><X size={18} /></button></div>
            <div className="setting-status">
              <span className={`cloud-orb ${userEmail ? "connected" : ""}`}>{userEmail ? <Cloud size={22} /> : <CloudOff size={22} />}</span>
              <span><b>{userEmail ? "已啟用雲端作品庫" : isCloudConfigured ? "雲端服務已就緒" : "目前使用本機工作區"}</b><small>{userEmail ? userEmail : "你的故事會留在這台裝置，所有核心功能仍可使用。"}</small></span>
            </div>
            {!isCloudConfigured ? (
              <div className="setup-note"><b>部署者設定</b><p>在 GitHub 儲存庫加入 <code>VITE_SUPABASE_URL</code> 與 <code>VITE_SUPABASE_ANON_KEY</code>，即可開啟登入、跨裝置同步與雲端 AI 導演。</p></div>
            ) : userEmail ? (
              <div className="signed-actions"><button className="primary-action" disabled={cloudBusy} onClick={() => void syncCloud()}>{cloudBusy ? <LoaderCircle className="spin" size={16} /> : <Cloud size={16} />} 同步目前作品</button><button onClick={() => void signOut().then(() => { setUserEmail(null); setAnalysisMode("local"); notify("已登出雲端工作區"); })}><LogOut size={16} /> 登出</button></div>
            ) : (
              <div className="login-form"><label>Email 登入連結</label><div><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button disabled={cloudBusy} onClick={() => void sendMagicLink()}>{cloudBusy ? <LoaderCircle className="spin" size={16} /> : <LogIn size={16} />} 寄送</button></div><small>免密碼登入。點擊信件連結後即可同步作品。</small></div>
            )}
            <div className="privacy-row"><CircleUserRound size={17} /><span><b>金鑰隔離</b><small>AI 金鑰只存放在後端 Edge Function，不會下載到瀏覽器。</small></span></div>
          </section>
        </div>
      )}

      {toast && <div className={`toast ${toast.tone ?? "good"}`}>{toast.tone === "warn" ? "注意" : "完成"}<span>{toast.message}</span></div>}
    </div>
  );
}

export default App;
