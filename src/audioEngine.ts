import type { MusicTrack } from "./types";

const ease = (value: number) => value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;

export class SoundtrackMixer {
  private channels = [new Audio(), new Audio()];
  private activeIndex = 0;
  private currentTrackId: string | null = null;
  private masterVolume = 0.82;
  private sceneVolume = 0.18;
  private mixLevels = [0, 0];
  private outputVolume = 0;
  private transitionToken = 0;
  private gainToken = 0;

  constructor() {
    this.channels.forEach((audio) => {
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
    });
  }

  private effectiveVolume() { return Math.min(1, this.sceneVolume * this.masterVolume); }
  private applyVolumes() { this.channels.forEach((audio, index) => { audio.volume = Math.min(1, this.mixLevels[index] * this.outputVolume); }); }

  private rampOutput(target: number, seconds: number) {
    const token = ++this.gainToken;
    const started = performance.now();
    const initial = this.outputVolume;
    const duration = Math.max(80, seconds * 1000);
    const tick = (now: number) => {
      if (token !== this.gainToken) return;
      const progress = Math.min(1, (now - started) / duration);
      this.outputVolume = initial + (target - initial) * ease(progress);
      this.applyVolumes();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async transition(track: MusicTrack, seconds: number, sceneVolume: number) {
    this.sceneVolume = sceneVolume;
    if (track.id === this.currentTrackId) {
      const active = this.channels[this.activeIndex];
      if (active.paused) await active.play();
      this.rampOutput(this.effectiveVolume(), Math.max(1.2, seconds));
      return;
    }
    const token = ++this.transitionToken;
    const oldIndex = this.activeIndex;
    const nextIndex = oldIndex === 0 ? 1 : 0;
    const oldAudio = this.channels[oldIndex];
    const nextAudio = this.channels[nextIndex];
    const oldStart = this.mixLevels[oldIndex];
    nextAudio.pause();
    nextAudio.src = track.file;
    nextAudio.currentTime = 0;
    this.mixLevels[nextIndex] = 0;
    await nextAudio.play();
    if (token !== this.transitionToken) return nextAudio.pause();
    this.activeIndex = nextIndex;
    this.currentTrackId = track.id;
    this.rampOutput(this.effectiveVolume(), Math.max(0.8, seconds));
    const started = performance.now();
    const duration = Math.max(120, seconds * 1000);
    const tick = (now: number) => {
      if (token !== this.transitionToken) return;
      const progress = Math.min(1, (now - started) / duration);
      const mixed = ease(progress);
      this.mixLevels[nextIndex] = mixed;
      this.mixLevels[oldIndex] = oldStart * (1 - mixed);
      this.applyVolumes();
      if (progress < 1) requestAnimationFrame(tick);
      else { oldAudio.pause(); oldAudio.currentTime = 0; }
    };
    requestAnimationFrame(tick);
  }

  setMasterVolume(value: number) {
    this.masterVolume = Math.min(1, Math.max(0, value));
    this.rampOutput(this.effectiveVolume(), 0.45);
  }

  pause() { this.channels.forEach((audio) => audio.pause()); }
  resume() { const active = this.channels[this.activeIndex]; if (active.src) void active.play(); }
  stop(seconds = 1) {
    ++this.transitionToken;
    const token = ++this.gainToken;
    const started = performance.now();
    const initial = this.outputVolume;
    const finish = () => {
      this.outputVolume = 0; this.mixLevels = [0, 0]; this.currentTrackId = null;
      this.channels.forEach((audio) => { audio.pause(); audio.currentTime = 0; audio.volume = 0; });
    };
    if (seconds <= 0) return finish();
    const tick = (now: number) => {
      if (token !== this.gainToken) return;
      const progress = Math.min(1, (now - started) / (seconds * 1000));
      this.outputVolume = initial * (1 - ease(progress));
      this.applyVolumes();
      if (progress < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
  }
  destroy() { this.stop(0); this.channels.forEach((audio) => audio.removeAttribute("src")); }
}
