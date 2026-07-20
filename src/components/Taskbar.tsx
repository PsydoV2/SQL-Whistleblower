import { useState } from "react";
import styles from "./Taskbar.module.css";

export interface TaskbarWindowEntry {
  key: string;
  label: string;
  glyph: string;
  isActive: boolean;
}

interface TaskbarProps {
  storyTitle: string;
  chapterLabel: string;
  windows: TaskbarWindowEntry[];
  onFocusWindow: (key: string) => void;
  onExitToMenu: () => void;
}

function Taskbar({
  storyTitle,
  chapterLabel,
  windows,
  onFocusWindow,
  onExitToMenu,
}: TaskbarProps) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);

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
              }`}
              onClick={() => onFocusWindow(win.key)}
            >
              <span>{win.glyph}</span>
              <span>{win.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tray}>
          <span className={styles.trayStory}>{storyTitle}</span>
          <span className={styles.trayChapter}>{chapterLabel}</span>
        </div>
      </div>
    </>
  );
}

export default Taskbar;
