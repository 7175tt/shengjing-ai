import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines, BookOpen, Check, ChevronDown, CircleUserRound, Cloud, CloudOff, Download, Eye, EyeOff, FileAudio,
  FilePlus2, Headphones, Library, LoaderCircle, LogIn, LogOut, Menu, Music2,
  KeyRound, Mic2, Pause, Play, Plus, Save, Server, Settings2, SkipBack, SkipForward, Sparkles, Square,
  Upload, Volume2, WandSparkles, X,
} from "lucide-react";
import { SoundtrackMixer } from "./audioEngine";
import { analyzeInCloud, generateNarration, getCloudUser, isCloudConfigured, loadRemoteMusicTracks, pullCloudProjects, pushCloudProject, signInWithEmail, signOut, type NarrationResult } from "./cloud";
import { assignMusicTracks, getTrack, moodColor, MUSIC_LIBRARY } from "./storyEngine";
import { loadNarrationSettings, NARRATION_PROVIDERS, OPENAI_VOICE_OPTIONS, providerLabel, saveNarrationSettings, VOICE_LAB_SAMPLES } from "./narration";
import { exportCueSheet, loadCurrentProjectId, loadProjects, newProject, saveCurrentProjectId, saveProjects } from "./storage";
import { STORY_STYLES, STORY_STYLE_DESCRIPTIONS, type AnalysisMode, type MusicTrack, type NarrationProvider, type NarrationSettings, type OpenAIVoice, type SceneCue, type StoryProject, type StoryStyle } from "./types";
import { analyzeStory } from "./storyEngine";

type Toast = { message: string; tone?: "good" | "warn" } | null;
const styles: readonly StoryStyle[] = STORY_STYLES;
const formatDate = (date: string) => new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
const effectiveNarrationRate = (sceneRate: number, speed: number) => Math.min(1.5, Math.max(0.5, sceneRate * speed));
const estimateCueSeconds = (scene: SceneCue, speed = 1) => Math.max(4, scene.text.replace(/\s/g, "").length / Math.max(2.8, 4.15 * effectiveNarrationRate(scene.narrationRate, speed)));
const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
};

function App() {
  const [projects, setProjects] = useState<StoryProject[]>(() => loadProjects());
  const [currentId, setCurrentId] = useState(() => loadCurrentProjectId() ?? loadProjects()[0].id);
  const [selectedScene, setSelectedScene] = useState(0);
  const [view, setView] = useState<"script" | "voices" | "library">("script");
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("local");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.82);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(MUSIC_LIBRARY);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(() => loadNarrationSettings());
  const [narrationBusy, setNarrationBusy] = useState(false);
  const [narrationStage, setNarrationStage] = useState("等待播放");
  const [labProvider, setLabProvider] = useState<NarrationProvider>(() => loadNarrationSettings().provider);
  const [labVoice, setLabVoice] = useState<OpenAIVoice>(() => loadNarrationSettings().openAiVoice);
  const [labSpeed, setLabSpeed] = useState(() => loadNarrationSettings().speed);
  const [labSampleId, setLabSampleId] = useState(VOICE_LAB_SAMPLES[0].id);
  const [labPlaying, setLabPlaying] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [showOpenAiApiKey, setShowOpenAiApiKey] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const mixerRef = useRef<SoundtrackMixer | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const narrationCacheRef = useRef(new Map<string, Promise<NarrationResult>>());
  const activeNarrationRef = useRef<"system" | "cloud">("system");
  const playbackTokenRef = useRef(0);
  const projectRef = useRef<StoryProject | null>(null);
  const tracksRef = useRef<MusicTrack[]>(MUSIC_LIBRARY);
  const narrationSettingsRef = useRef<NarrationSettings>(narrationSettings);
  const openAiApiKeyRef = useRef(openAiApiKey);
  const stoppedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = projects.find((project) => project.id === currentId) ?? projects[0];
  const cue = current?.cues[selectedScene] ?? current?.cues[0];
  projectRef.current = current ?? null;
  tracksRef.current = musicTracks;
  narrationSettingsRef.current = narrationSettings;
  openAiApiKeyRef.current = openAiApiKey;

  const notify = useCallback((message: string, tone: "good" | "warn" = "good") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const mixer = new SoundtrackMixer();
    const narrationAudio = new Audio();
    narrationAudio.preload = "auto";
    mixerRef.current = mixer;
    narrationAudioRef.current = narrationAudio;
    void getCloudUser().then((user) => {
      setUserEmail(user?.email ?? null);
      if (user) setAnalysisMode("cloud");
    });
    void (async () => {
      const remote = await loadRemoteMusicTracks();
      let catalog = remote;
      const catalogUrl = (import.meta.env.VITE_MUSIC_CATALOG_URL as string | undefined) ?? "./music-catalog.json";
      if (!catalog.length && catalogUrl) {
        try {
          const response = await fetch(catalogUrl);
          if (response.ok) catalog = await response.json() as MusicTrack[];
        } catch { /* keep bundled fallback */ }
      }
      if (catalog.length) {
        const merged = new Map(MUSIC_LIBRARY.map((track) => [track.id, track]));
        catalog.forEach((track) => merged.set(track.id, track));
        setMusicTracks([...merged.values()]);
      }
    })();
    return () => {
      stoppedRef.current = true;
      speechSynthesis.cancel();
      narrationAudio.pause();
      narrationAudio.removeAttribute("src");
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
    const project = newProject("未命名作品", "", "自動判讀");
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
    const project = newProject(title, body, "自動判讀");
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
        const result = await analyzeInCloud(current.body, current.style, openAiApiKeyRef.current);
        cues = result.scenes;
        if (result.model) setNarrationStage(`OpenAI ${result.model} · 配樂分析完成`);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 520));
        cues = analyzeStory(current.body, current.style);
      }
      cues = assignMusicTracks(cues, tracksRef.current);
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
    playbackTokenRef.current += 1;
    speechSynthesis.cancel();
    const narrationAudio = narrationAudioRef.current;
    if (narrationAudio) {
      narrationAudio.pause();
      narrationAudio.removeAttribute("src");
      narrationAudio.load();
    }
    mixerRef.current?.stop(0.8);
    setPlaying(false);
    setPaused(false);
    setLabPlaying(false);
    setNarrationBusy(false);
    setNarrationStage("等待播放");
    setSceneProgress(0);
  };

  const prepareNarration = useCallback((project: StoryProject, scene: SceneCue, provider: Exclude<NarrationProvider, "system">) => {
    const settings = narrationSettingsRef.current;
    const narrationRate = effectiveNarrationRate(scene.narrationRate, settings.speed);
    const key = JSON.stringify({
      provider, projectId: project.id, sceneId: scene.id, text: scene.text,
      mood: scene.mood, style: project.style, narrationRate, openAiVoice: settings.openAiVoice,
      previousText: project.cues[scene.index - 1]?.text ?? "",
      nextText: project.cues[scene.index + 1]?.text ?? "",
    });
    const existing = narrationCacheRef.current.get(key);
    if (existing) return existing;
    const promise = generateNarration({
      text: scene.text,
      projectId: project.id,
      sceneId: scene.id,
      provider,
      mood: scene.mood,
      style: project.style,
      narrationRate,
      openAiVoice: settings.openAiVoice,
      openAiApiKey: provider === "openai" ? openAiApiKeyRef.current.trim() || undefined : undefined,
      previousText: project.cues[scene.index - 1]?.text,
      nextText: project.cues[scene.index + 1]?.text,
    }).catch((error) => {
      narrationCacheRef.current.delete(key);
      throw error;
    });
    narrationCacheRef.current.set(key, promise);
    return promise;
  }, []);

  const speakScene = useCallback(async (index: number, startProgress = 0) => {
    const project = projectRef.current;
    const scene = project?.cues[index];
    if (!scene || stoppedRef.current) {
      setPlaying(false);
      mixerRef.current?.stop(1.4);
      return;
    }
    const safeStartProgress = Math.min(0.995, Math.max(0, startProgress));
    setSelectedScene(index);
    setSceneProgress(safeStartProgress);
    const token = playbackTokenRef.current;
    const track = getTrack(scene.musicTrackId, tracksRef.current);
    try { await mixerRef.current?.transition(track, scene.transitionSeconds, scene.musicLevel); }
    catch { notify("瀏覽器阻擋了自動播放，請再按一次播放", "warn"); setPlaying(false); return; }

    let naturalVoice: NarrationResult | null = null;
    const settings = narrationSettingsRef.current;
    if (settings.provider !== "system") {
      setNarrationBusy(true);
      setNarrationStage(`正在生成第 ${index + 1} 幕自然旁白…`);
      try {
        naturalVoice = await prepareNarration(project, scene, settings.provider);
      } catch (error) {
        if (!settings.autoFallback) {
          setPlaying(false);
          mixerRef.current?.stop();
          notify(error instanceof Error ? error.message : "自然語音生成失敗", "warn");
          return;
        }
        notify(`自然語音暫不可用，已改用裝置語音：${error instanceof Error ? error.message : "連線失敗"}`, "warn");
      } finally { setNarrationBusy(false); }
    }
    if (stoppedRef.current || token !== playbackTokenRef.current) return;

    if (naturalVoice) {
      const audio = narrationAudioRef.current;
      if (!audio) return;
      activeNarrationRef.current = "cloud";
      speechSynthesis.cancel();
      audio.onloadedmetadata = null;
      audio.src = naturalVoice.url;
      audio.playbackRate = 1;
      audio.ontimeupdate = () => setSceneProgress(audio.duration ? Math.min(1, audio.currentTime / audio.duration) : 0);
      audio.onended = () => {
        setSceneProgress(1);
        if (!stoppedRef.current) void speakScene(index + 1);
      };
      audio.onerror = () => {
        if (!stoppedRef.current) { setPlaying(false); mixerRef.current?.stop(); notify("自然語音音檔載入失敗", "warn"); }
      };
      setNarrationStage(`${providerLabel(naturalVoice.provider)} · ${naturalVoice.cacheHit ? "快取旁白" : "AI 生成旁白"}`);
      try {
        if (safeStartProgress > 0) {
          if (!Number.isFinite(audio.duration)) {
            await new Promise<void>((resolve, reject) => {
              audio.onloadedmetadata = () => resolve();
              audio.addEventListener("error", () => reject(new Error("自然語音音檔載入失敗")), { once: true });
            });
          }
          audio.currentTime = Math.min(Math.max(0, audio.duration - 0.05), audio.duration * safeStartProgress);
        }
        await audio.play();
      }
      catch { notify("瀏覽器阻擋了自然語音播放，請再按一次播放", "warn"); setPlaying(false); return; }
      const next = project.cues[index + 1];
      if (next && settings.provider !== "system") void prepareNarration(project, next, settings.provider).catch(() => undefined);
      return;
    }

    activeNarrationRef.current = "system";
    setNarrationStage("裝置語音 · 自動保底");
    const startCharacter = Math.min(Math.max(0, scene.text.length - 1), Math.floor(scene.text.length * safeStartProgress));
    const utterance = new SpeechSynthesisUtterance(scene.text.slice(startCharacter));
    utterance.lang = "zh-TW";
    utterance.rate = effectiveNarrationRate(scene.narrationRate, settings.speed);
    const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().includes("zh-tw"))
      ?? speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    utterance.onboundary = (event) => setSceneProgress(Math.min(1, (startCharacter + event.charIndex) / Math.max(1, scene.text.length)));
    utterance.onend = () => {
      setSceneProgress(1);
      if (!stoppedRef.current) void speakScene(index + 1);
    };
    utterance.onerror = () => {
      if (!stoppedRef.current) { setPlaying(false); mixerRef.current?.stop(); notify("朗讀被瀏覽器中斷", "warn"); }
    };
    speechSynthesis.speak(utterance);
  }, [notify, prepareNarration]);

  const playFrom = (index = selectedScene, startProgress?: number) => {
    if (!current.cues.length) return notify("請先分析故事，建立場景配樂", "warn");
    const requestedProgress = startProgress ?? (index === selectedScene ? sceneProgress : 0);
    stoppedRef.current = false;
    playbackTokenRef.current += 1;
    speechSynthesis.cancel();
    narrationAudioRef.current?.pause();
    setPlaying(true);
    setPaused(false);
    void speakScene(index, requestedProgress);
  };

  const togglePause = () => {
    if (!playing) return playFrom();
    if (paused) {
      if (activeNarrationRef.current === "cloud") void narrationAudioRef.current?.play(); else speechSynthesis.resume();
      mixerRef.current?.resume(); setPaused(false);
    } else {
      if (activeNarrationRef.current === "cloud") narrationAudioRef.current?.pause(); else speechSynthesis.pause();
      mixerRef.current?.pause(); setPaused(true);
    }
  };

  const previewScene = async (index: number) => {
    stopPlayback();
    setSelectedScene(index);
    const selected = current.cues[index];
    if (!selected) return;
    try { await mixerRef.current?.transition(getTrack(selected.musicTrackId, tracksRef.current), selected.transitionSeconds, selected.musicLevel); }
    catch { notify("按播放即可啟用聲音", "warn"); }
  };

  const seekToProgress = (percentage: number) => {
    if (!current.cues.length) return;
    const durations = current.cues.map((scene) => estimateCueSeconds(scene, narrationSettingsRef.current.speed));
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const targetSeconds = Math.min(total - 0.05, Math.max(0, total * (percentage / 100)));
    let elapsed = 0;
    let targetIndex = current.cues.length - 1;
    for (let index = 0; index < durations.length; index += 1) {
      if (targetSeconds < elapsed + durations[index]) { targetIndex = index; break; }
      elapsed += durations[index];
    }
    const targetSceneProgress = Math.min(0.995, Math.max(0, (targetSeconds - elapsed) / durations[targetIndex]));
    const shouldContinue = playing && !paused;
    stoppedRef.current = true;
    playbackTokenRef.current += 1;
    speechSynthesis.cancel();
    narrationAudioRef.current?.pause();
    mixerRef.current?.stop(0.25);
    setSelectedScene(targetIndex);
    setSceneProgress(targetSceneProgress);
    setPaused(false);
    if (shouldContinue) {
      stoppedRef.current = false;
      playbackTokenRef.current += 1;
      setPlaying(true);
      void speakScene(targetIndex, targetSceneProgress);
    } else {
      setPlaying(false);
      setNarrationStage(`已定位第 ${targetIndex + 1} 幕 · ${formatClock(targetSeconds)}`);
    }
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

  const applyNarrationProvider = (provider: NarrationProvider) => {
    const next = { ...narrationSettings, provider };
    setNarrationSettings(next);
    saveNarrationSettings(next);
    setLabProvider(provider);
    notify(`正式朗讀已切換為「${providerLabel(provider)}」`);
  };

  const updateOpenAiVoice = (openAiVoice: OpenAIVoice) => {
    const next = { ...narrationSettings, openAiVoice };
    setNarrationSettings(next);
    saveNarrationSettings(next);
    setLabVoice(openAiVoice);
  };

  const updateNarrationSpeed = (speed: number) => {
    const next = { ...narrationSettings, speed };
    setNarrationSettings(next);
    saveNarrationSettings(next);
    setLabSpeed(speed);
  };

  const applyVoiceLabSettings = () => {
    const next = { ...narrationSettings, provider: labProvider, openAiVoice: labVoice, speed: labSpeed };
    setNarrationSettings(next);
    saveNarrationSettings(next);
    notify(`已套用 ${providerLabel(labProvider)} · ${labSpeed.toFixed(2)}×`);
  };

  const playVoiceLabSample = async () => {
    const sample = VOICE_LAB_SAMPLES.find((item) => item.id === labSampleId) ?? VOICE_LAB_SAMPLES[0];
    stopPlayback();
    setLabPlaying(true);
    setNarrationStage(`試聽 ${providerLabel(labProvider)}`);
    if (labProvider === "system") {
      activeNarrationRef.current = "system";
      const utterance = new SpeechSynthesisUtterance(sample.text);
      utterance.lang = "zh-TW";
      utterance.rate = effectiveNarrationRate(sample.mood === "sorrow" ? 0.86 : 0.94, labSpeed);
      const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().includes("zh-tw"))
        ?? speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("zh"));
      if (voice) utterance.voice = voice;
      utterance.onend = () => setLabPlaying(false);
      utterance.onerror = () => setLabPlaying(false);
      speechSynthesis.speak(utterance);
      return;
    }
    try {
      setNarrationBusy(true);
      const result = await generateNarration({
        text: sample.text, projectId: "voice-lab", sceneId: sample.id, provider: labProvider,
        mood: sample.mood, style: current.style,
        narrationRate: effectiveNarrationRate(sample.mood === "sorrow" ? 0.86 : 0.94, labSpeed),
        openAiVoice: labVoice,
        openAiApiKey: labProvider === "openai" ? openAiApiKey.trim() || undefined : undefined,
      });
      const audio = narrationAudioRef.current;
      if (!audio) return;
      activeNarrationRef.current = "cloud";
      audio.src = result.url;
      audio.onended = () => setLabPlaying(false);
      audio.onerror = () => { setLabPlaying(false); notify("試聽音檔載入失敗", "warn"); };
      setNarrationStage(`${providerLabel(result.provider)} · ${result.cacheHit ? "快取試聽" : "新生成試聽"}`);
      await audio.play();
    } catch (error) {
      setLabPlaying(false);
      notify(error instanceof Error ? error.message : "試聽生成失敗", "warn");
    } finally { setNarrationBusy(false); }
  };

  const wordCount = current?.body.replace(/\s/g, "").length ?? 0;
  const timeline = useMemo(() => {
    const durations = current?.cues.map((scene) => estimateCueSeconds(scene, narrationSettings.speed)) ?? [];
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const elapsed = durations.slice(0, selectedScene).reduce((sum, duration) => sum + duration, 0)
      + (durations[selectedScene] ?? 0) * sceneProgress;
    return { total, elapsed, progress: total ? (elapsed / total) * 100 : 0 };
  }, [current?.cues, narrationSettings.speed, selectedScene, sceneProgress]);
  const displayedProgress = seekPreview ?? timeline.progress;
  const displayedElapsed = timeline.total * (displayedProgress / 100);

  if (!current) return null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setMobileNav(true)} aria-label="開啟作品庫"><Menu size={19} /></button>
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        <div className="brand-copy"><b>聲境 AI</b><small>小說配樂導演台</small></div>
        <div className="topbar-center">
          <span className={`status-dot ${analysisMode}`} />
          {narrationSettings.provider === "system" ? "裝置旁白" : `${providerLabel(narrationSettings.provider)} 自然旁白`}
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
        <div className="project-list" role="navigation" aria-label="我的作品">
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
              <button className={view === "voices" ? "active" : ""} onClick={() => setView("voices")}><Mic2 size={15} /> 聲音</button>
              <button className={view === "library" ? "active" : ""} onClick={() => setView("library")}><Music2 size={15} /> 音樂庫</button>
            </div>
          </div>

          {view === "script" ? (
            <>
              <div className="director-bar">
                <div className="style-select" title={STORY_STYLE_DESCRIPTIONS[current.style]}>
                  <span>導演風格</span>
                  <select value={current.style} onChange={(event) => { updateCurrent({ style: event.target.value as StoryStyle }); setDirty(true); }}>
                    {styles.map((style) => <option key={style}>{style}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </div>
                <div className="mode-choice" title="雲端未設定時會自動使用本機分析">
                  <button className={analysisMode === "local" ? "active" : ""} onClick={() => setAnalysisMode("local")}>本機</button>
                  <button disabled={!isCloudConfigured || !userEmail} className={analysisMode === "cloud" ? "active" : ""} onClick={() => setAnalysisMode("cloud")} title="由 Supabase 後端安全呼叫 OpenAI">OpenAI</button>
                </div>
                <button className="analyze-button" disabled={analyzing} onClick={() => void runAnalysis()}>
                  {analyzing ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}
                  {analyzing ? "正在讀懂情節…" : dirty ? "重新設計配樂" : "分析並設計配樂"}
                </button>
              </div>
              <div className="director-context">
                <span><Sparkles size={14} /><b>{current.style}</b>{STORY_STYLE_DESCRIPTIONS[current.style]}</span>
                <span>{analysisMode === "cloud" ? "OpenAI 會分析分幕、情緒、張力與選曲線索" : "本機規則分析，不會呼叫外部 AI"}</span>
              </div>
              <div className="editor-toolbar">
                <span>{dirty ? "文字已變更，建議重新分析" : "場景與配樂已同步"}</span>
                <button onClick={() => setEditing((value) => !value)}>{editing ? "完成編輯" : "編輯全文"}</button>
              </div>
              {editing ? (
                <textarea className="story-editor" aria-label="小說全文" value={current.body} placeholder="在這裡貼上小說章節，或從左側匯入 .txt / .md…" onChange={(event) => { updateCurrent({ body: event.target.value }); setDirty(true); }} />
              ) : (
                <article className="manuscript" aria-label="小說場景" tabIndex={0}>
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
          ) : view === "voices" ? (
            <div className="voice-lab" role="region" aria-label="聲音實驗室" tabIndex={0}>
              <div className="voice-lab-intro">
                <span>中文小說聲音實驗室</span>
                <h2>同一段文字，直接用耳朵決定。</h2>
                <p>選擇情緒片段與語音引擎。雲端聲音第一次會生成音檔，之後直接讀取私人快取。</p>
              </div>
              <div className="voice-sample-tabs" role="tablist" aria-label="試聽段落">
                {VOICE_LAB_SAMPLES.map((sample) => (
                  <button key={sample.id} className={labSampleId === sample.id ? "active" : ""} onClick={() => setLabSampleId(sample.id)}>
                    <b>{sample.title}</b><small>{sample.function}</small>
                  </button>
                ))}
              </div>
              <blockquote className="voice-copy">{VOICE_LAB_SAMPLES.find((item) => item.id === labSampleId)?.text}</blockquote>
              <div className="voice-provider-list">
                {NARRATION_PROVIDERS.map((provider) => (
                  <button key={provider.id} className={`voice-provider ${labProvider === provider.id ? "active" : ""}`} onClick={() => setLabProvider(provider.id)}>
                    <span className="provider-radio">{labProvider === provider.id && <Check size={13} />}</span>
                    <span className="provider-main"><b>{provider.name}</b><small>{provider.model} · {provider.note}</small></span>
                    <span className="provider-meta"><i>{provider.accent}</i><small>{provider.cloud ? isCloudConfigured && userEmail ? "可產生" : "需雲端登入" : "免設定"}</small></span>
                  </button>
                ))}
              </div>
              <div className="voice-control-grid">
                <label className="voice-select-control">
                  <span><b>OpenAI 音色</b><small>偏低沉／偏明亮是聽感分類</small></span>
                  <select disabled={labProvider !== "openai"} value={labVoice} onChange={(event) => setLabVoice(event.target.value as OpenAIVoice)}>
                    {OPENAI_VOICE_OPTIONS.map((voice) => <option value={voice.id} key={voice.id}>{voice.name} · {voice.tone}{voice.recommended ? "（推薦）" : ""}</option>)}
                  </select>
                  <small>中文表現請以實際試聽為準；官方推薦 Cedar 與 Marin。</small>
                </label>
                <label className="voice-speed-control">
                  <span><b>朗讀速度</b><strong>{labSpeed.toFixed(2)}×</strong></span>
                  <input type="range" min="0.7" max="1.3" step="0.05" value={labSpeed} onChange={(event) => setLabSpeed(Number(event.target.value))} />
                  <small><i>較慢</i><i>自然</i><i>較快</i></small>
                </label>
              </div>
              <div className="voice-lab-actions">
                <button className="voice-preview-button" disabled={narrationBusy} onClick={() => void playVoiceLabSample()}>
                  {narrationBusy ? <LoaderCircle className="spin" size={17} /> : labPlaying ? <AudioLines size={17} /> : <Play size={17} fill="currentColor" />}
                  {narrationBusy ? "正在生成自然聲音…" : labPlaying ? "正在試聽" : "產生並試聽"}
                </button>
                <button className="voice-apply-button" onClick={applyVoiceLabSettings}>
                  套用到正式朗讀
                </button>
                <span><Server size={14} /> 自備金鑰僅用於當次請求，不會寫入作品或資料庫。</span>
              </div>
            </div>
          ) : (
            <div className="music-library" role="region" aria-label="音樂庫曲目" tabIndex={0}>
              <div className="library-intro"><span>物件儲存曲庫 · {musicTracks.length} 首</span><h2>配樂可以成長，授權不能遺失。</h2><p>遠端目錄會從 Supabase／R2 載入；內建曲目只作離線保底。每首曲目都保留作者、來源、授權與情緒標籤。</p></div>
              {musicTracks.map((track) => (
                <div className="track-row" key={track.id}>
                  <button onClick={() => void mixerRef.current?.transition(track, 1.2, 0.2)} aria-label={`試聽 ${track.title}`}><Play size={15} fill="currentColor" /></button>
                  <span className="track-wave" aria-hidden="true">▂▅▃▇▄▆▂▅▇▃▆▄▂</span>
                  <span><b>{track.title}</b><small>{track.author} · {track.license} · {track.storageProvider === "r2" ? "R2" : track.storageProvider === "supabase" ? "Supabase" : "離線"}</small></span>
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
            <div className="inspector-content" role="region" aria-label="場景調整" tabIndex={0}>
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
                {musicTracks.map((track) => <option value={track.id} key={track.id}>{track.title}</option>)}
              </select>
              <div className="track-detail"><FileAudio size={17} /><span><b>{getTrack(cue.musicTrackId, musicTracks).author}</b><small>{getTrack(cue.musicTrackId, musicTracks).tags.join(" · ")} · {getTrack(cue.musicTrackId, musicTracks).license}</small></span></div>
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
          <span className="album-mark">{narrationBusy ? <LoaderCircle className="spin" size={18} /> : <Headphones size={18} />}</span>
          <span><small>{narrationStage}</small><b>{cue?.title ?? "等待配樂"}</b></span>
        </div>
        <div className="transport-center">
          <div className="transport-buttons">
            <button disabled={selectedScene === 0} onClick={() => playFrom(Math.max(0, selectedScene - 1))}><SkipBack size={17} fill="currentColor" /></button>
            <button className="play-main" onClick={togglePause}>{playing && !paused ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button>
            <button onClick={stopPlayback}><Square size={14} fill="currentColor" /></button>
            <button disabled={selectedScene >= current.cues.length - 1} onClick={() => playFrom(Math.min(current.cues.length - 1, selectedScene + 1))}><SkipForward size={17} fill="currentColor" /></button>
          </div>
          <div className="progress-row">
            <span>{formatClock(displayedElapsed)}</span>
            <input
              aria-label="故事播放時間軸"
              type="range"
              min="0"
              max="100"
              step="0.1"
              disabled={!current.cues.length}
              value={displayedProgress}
              title={`拖曳或點選跳到 ${formatClock(displayedElapsed)}`}
              style={{ background: `linear-gradient(90deg, var(--amber) 0 ${displayedProgress}%, #343934 ${displayedProgress}% 100%)` }}
              onChange={(event) => setSeekPreview(Number(event.target.value))}
              onPointerUp={(event) => { seekToProgress(Number(event.currentTarget.value)); setSeekPreview(null); }}
              onKeyUp={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) { seekToProgress(Number(event.currentTarget.value)); setSeekPreview(null); } }}
              onBlur={(event) => { if (seekPreview !== null) { seekToProgress(Number(event.currentTarget.value)); setSeekPreview(null); } }}
            />
            <span>{formatClock(timeline.total)}</span>
          </div>
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
            <div className="narration-setting">
              <span><Mic2 size={17} /><b>正式朗讀聲音</b></span>
              <select value={narrationSettings.provider} onChange={(event) => applyNarrationProvider(event.target.value as NarrationProvider)}>
                {NARRATION_PROVIDERS.map((provider) => <option value={provider.id} key={provider.id}>{provider.name} · {provider.model}</option>)}
              </select>
              <select disabled={narrationSettings.provider !== "openai"} aria-label="OpenAI 正式朗讀音色" value={narrationSettings.openAiVoice} onChange={(event) => updateOpenAiVoice(event.target.value as OpenAIVoice)}>
                {OPENAI_VOICE_OPTIONS.map((voice) => <option value={voice.id} key={voice.id}>{voice.name} · {voice.tone}{voice.recommended ? "（推薦）" : ""}</option>)}
              </select>
              <label className="settings-speed"><span>整體語速</span><input type="range" min="0.7" max="1.3" step="0.05" value={narrationSettings.speed} onChange={(event) => updateNarrationSpeed(Number(event.target.value))} /><b>{narrationSettings.speed.toFixed(2)}×</b></label>
              <label><input type="checkbox" checked={narrationSettings.autoFallback} onChange={(event) => {
                const next = { ...narrationSettings, autoFallback: event.target.checked };
                setNarrationSettings(next); saveNarrationSettings(next);
              }} /> 雲端聲音失敗時，自動改用裝置語音</label>
            </div>
            <div className="api-key-setting">
              <span><KeyRound size={17} /><b>自備 OpenAI API Key</b><i>{openAiApiKey ? "本分頁已啟用" : "選填"}</i></span>
              <div>
                <input
                  type={showOpenAiApiKey ? "text" : "password"}
                  value={openAiApiKey}
                  onChange={(event) => setOpenAiApiKey(event.target.value)}
                  placeholder="sk-…"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label="自備 OpenAI API Key"
                />
                <button type="button" onClick={() => setShowOpenAiApiKey((value) => !value)} aria-label={showOpenAiApiKey ? "隱藏 API Key" : "顯示 API Key"}>{showOpenAiApiKey ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                {openAiApiKey && <button type="button" onClick={() => { setOpenAiApiKey(""); setShowOpenAiApiKey(false); }} aria-label="清除 API Key"><X size={17} /></button>}
              </div>
              <small>{openAiApiKey ? "分析與 OpenAI 朗讀會優先使用您的金鑰；重新整理後自動清除。" : "留白時使用聲境 AI 後端金鑰。金鑰不會儲存在瀏覽器或資料庫。"}</small>
            </div>
            {!isCloudConfigured ? (
              <div className="setup-note"><b>部署者設定</b><p>在 GitHub 儲存庫加入 <code>VITE_SUPABASE_URL</code> 與 <code>VITE_SUPABASE_ANON_KEY</code>，即可開啟登入、跨裝置同步與雲端 AI 導演。</p></div>
            ) : userEmail ? (
              <div className="signed-actions"><button className="primary-action" disabled={cloudBusy} onClick={() => void syncCloud()}>{cloudBusy ? <LoaderCircle className="spin" size={16} /> : <Cloud size={16} />} 同步目前作品</button><button onClick={() => void signOut().then(() => { setUserEmail(null); setAnalysisMode("local"); notify("已登出雲端工作區"); })}><LogOut size={16} /> 登出</button></div>
            ) : (
              <div className="login-form"><label>Email 登入連結</label><div><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button disabled={cloudBusy} onClick={() => void sendMagicLink()}>{cloudBusy ? <LoaderCircle className="spin" size={16} /> : <LogIn size={16} />} 寄送</button></div><small>免密碼登入。點擊信件連結後即可同步作品。</small></div>
            )}
            <div className="privacy-row"><CircleUserRound size={17} /><span><b>金鑰隔離</b><small>平台金鑰只在後端；自備金鑰僅停留於本分頁記憶體，經 Edge Function 完成當次請求後即丟棄。</small></span></div>
          </section>
        </div>
      )}

      {toast && <div className={`toast ${toast.tone ?? "good"}`}>{toast.tone === "warn" ? "注意" : "完成"}<span>{toast.message}</span></div>}
    </div>
  );
}

export default App;
