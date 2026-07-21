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
import SqlConsole, { type SqlRunInfo } from "./SqlConsole";
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

type WindowKey = "mail" | "evidence" | "tables" | "sql" | "results" | "arrest";

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
    width: 440,
    height: 360,
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
    position: { x: 1000, y: 400 },
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
  minimized: boolean;
  maximized: boolean;
}

type Transition =
  | { kind: "chapter"; nextChapter: number }
  | { kind: "completed" };

const HISTORY_LIMIT = 20;

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
  const [sqlText, setSqlText] = useState("SELECT * FROM employees;");
  const [sqlHistory, setSqlHistory] = useState<string[]>([]);
  const [sqlLastRun, setSqlLastRun] = useState<SqlRunInfo | null>(null);
  const sqlInsertRef = useRef<((token: string) => void) | null>(null);

  const [revealedHints, setRevealedHints] = useState(0);
  const [arrestError, setArrestError] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);

  function makeWindow(key: WindowKey): OpenWindow {
    return {
      key,
      position: WINDOW_CONFIG[key].position,
      size: { width: WINDOW_CONFIG[key].width, height: WINDOW_CONFIG[key].height },
      zIndex: nextZIndexRef.current++,
      minimized: false,
      maximized: false,
    };
  }

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
        setOpenWindows([makeWindow("mail")]);
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
        setSqlLastRun(null);
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
    setRevealedHints(0);
  }, [currentChapterNumber]);

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

  const visibleWindows = openWindows.filter((win) => !win.minimized);
  const topZIndex = visibleWindows.reduce(
    (max, win) => Math.max(max, win.zIndex),
    -Infinity,
  );

  function openWindow(key: WindowKey) {
    setOpenWindows((prev) => {
      if (prev.some((win) => win.key === key)) {
        return prev.map((win) =>
          win.key === key
            ? { ...win, minimized: false, zIndex: nextZIndexRef.current++ }
            : win,
        );
      }
      return [...prev, makeWindow(key)];
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

  function minimizeWindow(key: WindowKey) {
    setOpenWindows((prev) =>
      prev.map((win) => (win.key === key ? { ...win, minimized: true } : win)),
    );
  }

  function toggleMaximizeWindow(key: WindowKey) {
    setOpenWindows((prev) =>
      prev.map((win) =>
        win.key === key
          ? { ...win, maximized: !win.maximized, zIndex: nextZIndexRef.current++ }
          : win,
      ),
    );
  }

  function handleTaskbarClick(key: WindowKey) {
    const win = openWindows.find((w) => w.key === key);
    if (!win) return;
    if (win.minimized) {
      openWindow(key);
    } else if (win.zIndex === topZIndex) {
      minimizeWindow(key);
    } else {
      focusWindow(key);
    }
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

  function insertIntoSql(token: string) {
    const sqlWin = openWindows.find((win) => win.key === "sql");
    if (sqlWin && !sqlWin.minimized && sqlInsertRef.current) {
      sqlInsertRef.current(token);
    } else {
      setSqlText((prev) => {
        const needsSpace = prev.length > 0 && !/\s$/.test(prev);
        return prev + (needsSpace ? " " : "") + token;
      });
      openWindow("sql");
    }
  }

  function handleRunQuery(sql: string) {
    const time = new Date().toLocaleTimeString("de-DE");
    if (!db) {
      setQueryResults(null);
      setQueryError("Datenbank wird noch geladen, bitte kurz warten.");
      setSqlLastRun({ time, summary: "Datenbank lädt noch", ok: false });
      openWindow("results");
      return;
    }
    const start = performance.now();
    try {
      const result = runQuery(db, sql);
      const duration = Math.max(1, Math.round(performance.now() - start));
      const rowCount = result.reduce((sum, r) => sum + r.rows.length, 0);
      setQueryResults(result);
      setQueryError(null);
      setSqlLastRun({
        time,
        summary: `${rowCount} Zeile(n) · ${duration} ms`,
        ok: true,
      });
    } catch (err) {
      setQueryResults(null);
      setQueryError(err instanceof Error ? err.message : String(err));
      setSqlLastRun({ time, summary: "Fehler in der Abfrage", ok: false });
    }
    setSqlHistory((prev) => {
      const trimmed = sql.trim();
      if (prev[0] === trimmed) return prev;
      return [trimmed, ...prev.filter((q) => q !== trimmed)].slice(
        0,
        HISTORY_LIMIT,
      );
    });
    openWindow("results");
  }

  function handleRevealHint() {
    if (!currentChapter) return;
    setRevealedHints((count) =>
      Math.min(count + 1, currentChapter.hints.length),
    );
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
    const isLastChapter = currentChapterNumber >= loadedStory.chapters.length;

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
    setOpenWindows([makeWindow("mail")]);
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
            revealedHints={revealedHints}
            onRevealHint={handleRevealHint}
          />
        );
      case "tables":
        return <TableViewer tables={cumulativeTables} onInsert={insertIntoSql} />;
      case "sql":
        return dbError ? (
          <div className={styles.centered}>Datenbank-Fehler: {dbError}</div>
        ) : (
          <SqlConsole
            value={sqlText}
            onChange={setSqlText}
            onRun={handleRunQuery}
            history={sqlHistory}
            lastRun={sqlLastRun}
            insertRef={sqlInsertRef}
          />
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
            glyph={WINDOW_CONFIG[win.key].glyph}
            position={win.position}
            size={win.size}
            zIndex={win.zIndex}
            minimized={win.minimized}
            maximized={win.maximized}
            onClose={() => closeWindow(win.key)}
            onFocus={() => focusWindow(win.key)}
            onMinimize={() => minimizeWindow(win.key)}
            onToggleMaximize={() => toggleMaximizeWindow(win.key)}
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
          isActive: !win.minimized && win.zIndex === topZIndex,
          isMinimized: win.minimized,
        }))}
        onWindowButtonClick={(key) => handleTaskbarClick(key as WindowKey)}
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
