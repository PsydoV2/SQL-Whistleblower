export interface StoryProgress {
  storyId: string;
  currentChapter: number;
  completed: boolean;
}

type ProgressMap = Record<string, StoryProgress>;

const STORAGE_KEY = "sql-whistleblower:progress";

function readAll(): ProgressMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function writeAll(progress: ProgressMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getStoryProgress(storyId: string): StoryProgress | null {
  return readAll()[storyId] ?? null;
}

export function getAllProgress(): ProgressMap {
  return readAll();
}

/** Merkt sich, dass der Spieler aktuell an diesem Kapitel der Story arbeitet. */
export function setChapterProgress(storyId: string, currentChapter: number): void {
  const all = readAll();
  const existing = all[storyId];
  all[storyId] = {
    storyId,
    currentChapter,
    completed: existing?.completed ?? false,
  };
  writeAll(all);
}

/** Markiert eine Story als vollständig gelöst. */
export function markStoryCompleted(storyId: string): void {
  const all = readAll();
  const existing = all[storyId];
  all[storyId] = {
    storyId,
    currentChapter: existing?.currentChapter ?? 1,
    completed: true,
  };
  writeAll(all);
}
