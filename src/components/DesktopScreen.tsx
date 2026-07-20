import { useEffect, useMemo, useRef, useState } from "react";
import type { Database } from "sql.js";
import {
  loadFullStory,
  mergeTablesUpToChapter,
  type LoadedStory,
} from "../engine/storyLoader";
import { buildDatabase, runQuery, type QueryResult } from "../engine/sqlEngine";
import {
  getStoryProgress,
  setChapterProgress,
  markStoryCompleted,
} from "../engine/progressStore";
import MailClient from "./MailClient";
import EvidenceFolder from "./EvidenceFolder";
import TableViewer from "./TableViewer";
import SqlConsole from "./SqlConsole";
import ResultsPane from "./ResultsPane";
import ArrestTool from "./ArrestTool";
import ChapterTransition from "./ChapterTransition";
import FloatingWindow, {
  type WindowPosition,
  type WindowSize,
} from "./FloatingWindow";
import Taskbar from "./Taskbar";
import styles from "./DesktopScreen.module.css";

interface DesktopScreenProps {
  storyId: string;
  storyPath: string;
  onExitToMenu: () => void;
}

type WindowKey =
  | "mail"
  | "evidence"
  | "tables"
  | "sql"
  | "results"
  | "arrest";

interface WindowConfig {
  label: string;
  glyph: string;
  width: number;
  height: number;
  position: WindowPosition;
}

const WINDOW_CONFIG: Record<WindowKey, WindowConfig> = {
  mail: { label: "Mail", glyph: "✉️", width: 400, height: 340, position: { x: 160, y: 20 } },
  evidence: {
    label: "Beweise",
    glyph: "🗂️",
    width: 400,
    height: 340,
    position: { x: 580, y: 20 },
  },
  sql: {
    label: "SQL-Konsole",
    glyph: "🖥️",
    width: 340,
    height: 340,
    position: { x: 1000, y: 20 },
  },
  tables: {
    label: "Tabellen",
    glyph: "📊",
    width: 400,
    height: 340,
    position: { x: 160, y: 380 },
  },
  results: {
    label: "Ergebnis",
    glyph: "📋",
    width: 400,
    height: 340,
    position: { x: 580, y: 380 },
  },
  arrest: {
    label: "Arrest-Tool",
    glyph: "🚨",
    width: 340,
    height: 220,
    position: { x: 1000, y: 380 },
  },
};

const DESKTOP_ICON_ORDER: WindowKey[] = [
  "mail",
  "evidence",
  "tables",
  "sql",
  "arrest",
];

interface OpenWindow {
  key: WindowKey;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
}

type Transition =
  | { kind: "chapter"; nextChapter: number }
  | { kind: "completed" };

function DesktopScreen({ storyId, storyPath, onExitToMenu }: DesktopScreenProps) {
  const [loadedStory, setLoadedStory] = useState<LoadedStory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentChapterNumber, setCurrentChapterNumber] = useState(1);

  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const nextZIndexRef = useRef(10);
  const desktopRef = useRef<HTMLDivElement | null>(null);

  const [queryResults, setQueryResults] = useState<QueryResult[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [arrestError, setArrestError] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFullStory(storyPath)
      .then((loaded) => {
        if (cancelled) return;
        setLoadedStory(loaded);
        const progress = getStoryProgress(storyId);
        const startChapter = progress?.currentChapter ?? 1;
        setCurrentChapterNumber(startChapter);
        setChapterProgress(storyId, startChapter);
        setOpenWindows([
          {
            key: "mail",
            position: WINDOW_CONFIG.mail.position,
            size: { width: WINDOW_CONFIG.mail.width, height: WINDOW_CONFIG.mail.height },
            zIndex: nextZIndexRef.current++,
          },
        ]);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storyPath, storyId]);

  useEffect(() => {
    if (!loadedStory) return;
    let cancelled = false;
    const tables = mergeTablesUpToChapter(
      loadedStory.story,
      loadedStory.chapters,
      currentChapterNumber,
    );
    buildDatabase(tables)
      .then((newDb) => {
        if (cancelled) {
          newDb.close();
          return;
        }
        setDb((prevDb) => {
          prevDb?.close();
          return newDb;
        });
        setQueryResults(null);
        setQueryError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setDbError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadedStory, currentChapterNumber]);

  useEffect(() => {
    return () => {
      db?.close();
    };
  }, [db]);

  const cumulativeTables = useMemo(() => {
    if (!loadedStory) return {};
    return mergeTablesUpToChapter(
      loadedStory.story,
      loadedStory.chapters,
      currentChapterNumber,
    );
  }, [loadedStory, currentChapterNumber]);

  const currentChapter = loadedStory?.chapters.find(
    (chapter) => chapter.chapterNumber === currentChapterNumber,
  );

  function openWindow(key: WindowKey) {
    setOpenWindows((prev) => {
      if (prev.some((win) => win.key === key)) {
        return prev.map((win) =>
          win.key === key ? { ...win, zIndex: nextZIndexRef.current++ } : win,
        );
      }
      return [
        ...prev,
        {
          key,
          position: WINDOW_CONFIG[key].position,
          size: {
            width: WINDOW_CONFIG[key].width,
            height: WINDOW_CONFIG[key].height,
          },
          zIndex: nextZIndexRef.current++,
        },
      ];
    });
  }

  function closeWindow(key: WindowKey) {
    setOpenWindows((prev) => prev.filter((win) => win.key !== key));
  }

  function focusWindow(key: WindowKey) {
    setOpenWindows((prev) =>
      prev.map((win) =>
        win.key === key ? { ...win, zIndex: nextZIndexRef.current++ } : win,
      ),
    );
  }

  function moveWindow(key: WindowKey, position: WindowPosition) {
    const rect = desktopRef.current?.getBoundingClientRect();
    const maxX = rect ? Math.max(0, rect.width - 120) : position.x;
    const maxY = rect ? Math.max(0, rect.height - 40) : position.y;
    const clamped = {
      x: Math.min(Math.max(position.x, 0), maxX),
      y: Math.min(Math.max(position.y, 0), maxY),
    };
    setOpenWindows((prev) =>
      prev.map((win) => (win.key === key ? { ...win, position: clamped } : win)),
    );
  }

  function resizeWindow(key: WindowKey, size: WindowSize) {
    setOpenWindows((prev) =>
      prev.map((win) => (win.key === key ? { ...win, size } : win)),
    );
  }

  function handleRunQuery(sqlText: string) {
    if (!db) {
      setQueryError("Datenbank wird noch geladen, bitte kurz warten.");
      return;
    }
    try {
      const result = runQuery(db, sqlText);
      setQueryResults(result);
      setQueryError(null);
    } catch (err) {
      setQueryResults(null);
      setQueryError(err instanceof Error ? err.message : String(err));
    }
    openWindow("results");
  }

  function handleArrestSubmit(name: string) {
    if (!loadedStory || !currentChapter) return;

    const isCorrect =
      name.trim().toLowerCase() ===
      currentChapter.solution.value.trim().toLowerCase();

    if (!isCorrect) {
      setArrestError(`"${name}" ist nicht die gesuchte Person. Versuch es erneut.`);
      return;
    }

    setArrestError(null);
    const isLastChapter =
      currentChapterNumber >= loadedStory.chapters.length;

    if (isLastChapter) {
      markStoryCompleted(storyId);
      setTransition({ kind: "completed" });
    } else {
      setTransition({ kind: "chapter", nextChapter: currentChapterNumber + 1 });
    }
  }

  function handleContinueToNextChapter(nextChapter: number) {
    setChapterProgress(storyId, nextChapter);
    setCurrentChapterNumber(nextChapter);
    setArrestError(null);
    setOpenWindows([
      {
        key: "mail",
        position: WINDOW_CONFIG.mail.position,
        size: { width: WINDOW_CONFIG.mail.width, height: WINDOW_CONFIG.mail.height },
        zIndex: nextZIndexRef.current++,
      },
    ]);
    setTransition(null);
  }

  function renderWindowContent(key: WindowKey) {
    if (!currentChapter) return null;
    switch (key) {
      case "mail":
        return <MailClient mail={currentChapter.briefingMail} />;
      case "evidence":
        return (
          <EvidenceFolder
            evidence={currentChapter.evidence}
            hints={currentChapter.hints}
          />
        );
      case "tables":
        return <TableViewer tables={cumulativeTables} />;
      case "sql":
        return dbError ? (
          <div className={styles.centered}>Datenbank-Fehler: {dbError}</div>
        ) : (
          <SqlConsole onRunQuery={handleRunQuery} />
        );
      case "results":
        return <ResultsPane results={queryResults} error={queryError} />;
      case "arrest":
        return (
          <ArrestTool onSubmit={handleArrestSubmit} errorMessage={arrestError} />
        );
      default:
        return null;
    }
  }

  if (loadError) {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          Story konnte nicht geladen werden: {loadError}
        </div>
      </div>
    );
  }

  if (!loadedStory || !currentChapter) {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>Story wird geladen...</div>
      </div>
    );
  }

  const maxZIndex = openWindows.reduce(
    (max, win) => Math.max(max, win.zIndex),
    -Infinity,
  );

  return (
    <div className={styles.screen}>
      <div className={styles.desktop} ref={desktopRef}>
        <div className={styles.iconColumn}>
          {DESKTOP_ICON_ORDER.map((key) => (
            <button
              key={key}
              className={styles.icon}
              onClick={() => openWindow(key)}
            >
              <span className={styles.iconGlyph}>{WINDOW_CONFIG[key].glyph}</span>
              <span className={styles.iconLabel}>{WINDOW_CONFIG[key].label}</span>
            </button>
          ))}
        </div>

        {openWindows.map((win) => (
          <FloatingWindow
            key={win.key}
            title={WINDOW_CONFIG[win.key].label}
            position={win.position}
            size={win.size}
            zIndex={win.zIndex}
            onClose={() => closeWindow(win.key)}
            onFocus={() => focusWindow(win.key)}
            onMove={(position) => moveWindow(win.key, position)}
            onResize={(size) => resizeWindow(win.key, size)}
          >
            {renderWindowContent(win.key)}
          </FloatingWindow>
        ))}
      </div>

      <Taskbar
        storyTitle={loadedStory.story.title}
        chapterLabel={`Kapitel ${currentChapter.chapterNumber}: ${currentChapter.title}`}
        windows={openWindows.map((win) => ({
          key: win.key,
          label: WINDOW_CONFIG[win.key].label,
          glyph: WINDOW_CONFIG[win.key].glyph,
          isActive: win.zIndex === maxZIndex,
        }))}
        onFocusWindow={(key) => focusWindow(key as WindowKey)}
        onExitToMenu={onExitToMenu}
      />

      {transition?.kind === "chapter" && (
        <ChapterTransition
          eyebrow="Fall gelöst"
          title={`Kapitel ${currentChapterNumber} abgeschlossen`}
          text="Gute Arbeit. Die Ermittlung geht weiter - im nächsten Kapitel tauchen neue Beweise auf."
          buttonLabel={`Weiter zu Kapitel ${transition.nextChapter}`}
          onContinue={() => handleContinueToNextChapter(transition.nextChapter)}
        />
      )}
      {transition?.kind === "completed" && (
        <ChapterTransition
          eyebrow="Fall abgeschlossen"
          title={loadedStory.story.title}
          text="Du hast den Fall vollständig gelöst. Gut gemacht, Ermittler."
          buttonLabel="Zurück zum Hauptmenü"
          onContinue={onExitToMenu}
        />
      )}
    </div>
  );
}

export default DesktopScreen;
