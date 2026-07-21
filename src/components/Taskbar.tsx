import { useEffect, useState } from "react";
import styles from "./Taskbar.module.css";

export interface TaskbarWindowEntry {
  key: string;
  label: string;
  glyph: string;
  isActive: boolean;
  isMinimized: boolean;
}

interface TaskbarProps {
  storyTitle: string;
  chapterLabel: string;
  windows: TaskbarWindowEntry[];
  onWindowButtonClick: (key: string) => void;
  onExitToMenu: () => void;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 15);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Taskbar({
  storyTitle,
  chapterLabel,
  windows,
  onWindowButtonClick,
  onExitToMenu,
}: TaskbarProps) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const now = useClock();

  const time = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <>
      {startMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setStartMenuOpen(false)}
        />
      )}
      <div className={styles.taskbar}>
        <div className={styles.startWrapper}>
          {startMenuOpen && (
            <div className={styles.startMenu}>
              <div className={styles.startMenuHeader}>
                <div className={styles.startMenuStory}>{storyTitle}</div>
                <div className={styles.startMenuChapter}>{chapterLabel}</div>
              </div>
              <button
                className={styles.startMenuItem}
                onClick={() => {
                  setStartMenuOpen(false);
                  onExitToMenu();
                }}
              >
                ← Zurück zum Hauptmenü
              </button>
            </div>
          )}
          <button
            className={styles.startButton}
            onClick={() => setStartMenuOpen((open) => !open)}
          >
            Start
          </button>
        </div>

        <div className={styles.windowButtons}>
          {windows.map((win) => (
            <button
              key={win.key}
              className={`${styles.windowButton} ${
                win.isActive ? styles.windowButtonActive : ""
              } ${win.isMinimized ? styles.windowButtonMinimized : ""}`}
              onClick={() => onWindowButtonClick(win.key)}
            >
              <span>{win.glyph}</span>
              <span>{win.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tray}>
          <span className={styles.trayChapter}>{chapterLabel}</span>
          <div className={styles.clock}>
            <span className={styles.clockTime}>{time}</span>
            <span className={styles.clockDate}>{date}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Taskbar;
