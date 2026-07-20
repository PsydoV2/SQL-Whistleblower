export interface TableData {
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export interface StoryRegistryEntry {
  id: string;
  title: string;
  description: string;
  difficulty: "leicht" | "mittel" | "schwer";
  estimatedMinutes: number;
  path: string;
}

export interface StoryRegistry {
  stories: StoryRegistryEntry[];
}

export interface Story {
  id: string;
  title: string;
  author: string;
  chapters: string[];
  baseTables: Record<string, TableData>;
}

export interface BriefingMail {
  from: string;
  subject: string;
  body: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: "text" | "image";
  content: string;
}

export interface ChapterSolution {
  type: "exact_match";
  value: string;
}

export interface Chapter {
  chapterNumber: number;
  title: string;
  briefingMail: BriefingMail;
  evidence: EvidenceItem[];
  additionalTables: Record<string, TableData>;
  solution: ChapterSolution;
  hints: string[];
}
