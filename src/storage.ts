import { normalizeStoryStyle, type StoryProject, type StoryStyle } from "./types";
import { analyzeStory, DEMO_STORY, URBAN_DEMO_STORY } from "./storyEngine";

const STORAGE_KEY = "shengjing-ai-projects-v1";
const CURRENT_KEY = "shengjing-ai-current-project";

export function newProject(title = "白狼歸城", body = DEMO_STORY, style: StoryStyle = "自動判讀"): StoryProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), title, body, style, cues: analyzeStory(body, style),
    createdAt: now, updatedAt: now, source: "local",
  };
}

export function loadProjects(): StoryProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const projects = JSON.parse(stored) as StoryProject[];
      if (projects.length) {
        const normalized = projects.map((project) => {
        const style = normalizeStoryStyle(project.style);
        return project.style === style ? project : { ...project, style, cues: analyzeStory(project.body, style) };
        });
        // 舊使用者也自動補上第二個範本，不覆寫既有作品或目前選取狀態。
        if (!normalized.some((project) => project.body === URBAN_DEMO_STORY)) {
          normalized.push(newProject("霓虹王座｜都市無敵流", URBAN_DEMO_STORY, "電影感"));
          saveProjects(normalized);
        }
        return normalized;
      }
    }
  } catch { /* corrupted storage starts fresh */ }
  const demo = newProject();
  const urbanDemo = newProject("霓虹王座｜都市無敵流", URBAN_DEMO_STORY, "電影感");
  const templates = [demo, urbanDemo];
  saveProjects(templates);
  return templates;
}

export function saveProjects(projects: StoryProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function loadCurrentProjectId() { return localStorage.getItem(CURRENT_KEY); }
export function saveCurrentProjectId(id: string) { localStorage.setItem(CURRENT_KEY, id); }

export function exportCueSheet(project: StoryProject) {
  const payload = JSON.stringify({
    format: "聲境 AI cue-sheet", version: "1.0", exportedAt: new Date().toISOString(),
    project: { title: project.title, style: project.style, bodyLength: project.body.length },
    scenes: project.cues,
  }, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.title.replace(/[\\/:*?"<>|]/g, "-")}-配樂表.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
