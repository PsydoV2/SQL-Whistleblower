import { useEffect, useMemo, useState } from "react";
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
import styles from "./DesktopScreen.module.css";

interface DesktopScreenProps {
  storyId: string;
  storyPath: string;
  onExitToMenu: () => void;
}

type WindowKey = "mail" | "evidence" | "tables" | "sql" | "arrest";

const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "mail", label: "Mail" },
  { key: "evidence", label: "Beweise" },
  { key: "tables", label: "Tabellen" },
  { key: "sql", label: "SQL-Konsole" },
  { key: "arrest", label: "Arrest-Tool" },
];

type Transition =
  | { kind: "chapter"; nextChapter: number }
  | { kind: "completed" };

function DesktopScreen({ storyId, storyPath, onExitToMenu }: DesktopScreenProps) {
  const [loadedStory, setLoadedStory] = useState<LoadedStory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentChapterNumber, setCurrentChapterNumber] = useState(1);

  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [activeWindow, setActiveWindow] = useState<WindowKey>("mail");
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
    setActiveWindow("mail");
    setTransition(null);
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
      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={onExitToMenu}>
          ← Hauptmenü
        </button>
        <div className={styles.titleBlock}>
          <span className={styles.storyTitle}>{loadedStory.story.title}</span>
          <span className={styles.chapterTitle}>
            Kapitel {currentChapter.chapterNumber}: {currentChapter.title}
          </span>
        </div>
      </header>

      <nav className={styles.tabBar}>
        {WINDOWS.map((win) => (
          <button
            key={win.key}
            className={activeWindow === win.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveWindow(win.key)}
          >
            {win.label}
          </button>
        ))}
      </nav>

      <main className={styles.content}>
        {activeWindow === "mail" && (
          <div className={styles.panel}>
            <MailClient mail={currentChapter.briefingMail} />
          </div>
        )}
        {activeWindow === "evidence" && (
          <div className={styles.panel}>
            <EvidenceFolder
              evidence={currentChapter.evidence}
              hints={currentChapter.hints}
            />
          </div>
        )}
        {activeWindow === "tables" && (
          <div className={styles.panel}>
            <TableViewer tables={cumulativeTables} />
          </div>
        )}
        {activeWindow === "sql" && (
          <div className={styles.sqlSplit}>
            <div className={styles.sqlPane}>
              <div className={styles.paneLabel}>SQL-Konsole</div>
              {dbError ? (
                <div className={styles.centered}>
                  Datenbank-Fehler: {dbError}
                </div>
              ) : (
                <SqlConsole onRunQuery={handleRunQuery} />
              )}
            </div>
            <div className={styles.sqlPane}>
              <div className={styles.paneLabel}>Ergebnis</div>
              <ResultsPane results={queryResults} error={queryError} />
            </div>
          </div>
        )}
        {activeWindow === "arrest" && (
          <div className={styles.panel}>
            <ArrestTool
              onSubmit={handleArrestSubmit}
              errorMessage={arrestError}
            />
          </div>
        )}
      </main>

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
