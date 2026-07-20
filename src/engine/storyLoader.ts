import storyRegistryData from "../data/storyRegistry.json";
import type {
  Chapter,
  Story,
  StoryRegistry,
  TableData,
} from "../types/story.types";

export class StoryValidationError extends Error {}

/**
 * Liest die statisch gebündelte Liste aller wählbaren Stories.
 */
export function loadStoryRegistry(): StoryRegistry {
  return storyRegistryData as StoryRegistry;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Konnte "${url}" nicht laden (Status ${response.status}).`);
  }
  return (await response.json()) as T;
}

function validateTables(
  tables: Record<string, TableData>,
  context: string,
): void {
  for (const [tableName, table] of Object.entries(tables)) {
    const columnCount = table.columns.length;
    const uniqueColumns = new Set(table.columns);
    if (uniqueColumns.size !== columnCount) {
      throw new StoryValidationError(
        `${context}: Tabelle "${tableName}" enthält doppelte Spaltennamen.`,
      );
    }
    table.rows.forEach((row, rowIndex) => {
      if (row.length !== columnCount) {
        throw new StoryValidationError(
          `${context}: Tabelle "${tableName}", Zeile ${rowIndex + 1} hat ${row.length} Werte, erwartet ${columnCount}.`,
        );
      }
    });
  }
}

/**
 * Lädt die story.json einer Story vom angegebenen Pfad (z. B.
 * "/stories/story_01_der_einbruch/") und validiert die Grundstruktur der
 * baseTables.
 */
export async function loadStory(path: string): Promise<Story> {
  const story = await fetchJson<Story>(`${path}story.json`);
  validateTables(story.baseTables, `Story "${story.id}"`);
  return story;
}

/**
 * Lädt eine einzelne Kapitel-JSON-Datei und validiert deren
 * additionalTables.
 */
export async function loadChapter(
  path: string,
  fileName: string,
): Promise<Chapter> {
  const chapter = await fetchJson<Chapter>(`${path}${fileName}`);
  validateTables(
    chapter.additionalTables,
    `Kapitel ${chapter.chapterNumber} ("${chapter.title}")`,
  );
  return chapter;
}

export interface LoadedStory {
  story: Story;
  chapters: Chapter[];
}

/**
 * Lädt story.json und alle referenzierten Kapitel einer Story in einem
 * Rutsch, sortiert nach Kapitelnummer.
 */
export async function loadFullStory(path: string): Promise<LoadedStory> {
  const story = await loadStory(path);
  const chapters = await Promise.all(
    story.chapters.map((fileName) => loadChapter(path, fileName)),
  );
  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  return { story, chapters };
}

/**
 * Baut die kumulierte Tabellenmenge für ein Kapitel: baseTables + die
 * additionalTables aller Kapitel bis einschließlich der übergebenen
 * Kapitelnummer. So wächst die Datenbank über die Story hinweg, ohne dass
 * bereits gefundene Daten verloren gehen.
 */
export function mergeTablesUpToChapter(
  story: Story,
  chapters: Chapter[],
  chapterNumber: number,
): Record<string, TableData> {
  const merged: Record<string, TableData> = { ...story.baseTables };
  for (const chapter of chapters) {
    if (chapter.chapterNumber > chapterNumber) {
      continue;
    }
    Object.assign(merged, chapter.additionalTables);
  }
  return merged;
}
