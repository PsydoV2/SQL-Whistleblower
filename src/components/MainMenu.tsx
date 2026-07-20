import { useMemo } from "react";
import { loadStoryRegistry } from "../engine/storyLoader";
import { getStoryProgress } from "../engine/progressStore";
import styles from "./MainMenu.module.css";

interface MainMenuProps {
  onSelectStory: (storyId: string, storyPath: string) => void;
}

function MainMenu({ onSelectStory }: MainMenuProps) {
  const registry = useMemo(() => loadStoryRegistry(), []);

  return (
    <div className={styles.menu}>
      <header className={styles.header}>
        <h1>SQL-Whistleblower</h1>
        <p className={styles.subtitle}>Fälle lösen. Mit echtem SQL.</p>
      </header>
      <div className={styles.grid}>
        {registry.stories.map((entry) => {
          const progress = getStoryProgress(entry.id);
          return (
            <button
              key={entry.id}
              className={styles.card}
              onClick={() => onSelectStory(entry.id, entry.path)}
            >
              <div className={styles.cardHeader}>
                <h2>{entry.title}</h2>
                {progress?.completed ? (
                  <span className={styles.badge}>Gelöst</span>
                ) : progress ? (
                  <span className={styles.badge}>
                    Kapitel {progress.currentChapter}
                  </span>
                ) : null}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.description}>{entry.description}</p>
                <div className={styles.meta}>
                  <span>{entry.difficulty}</span>
                  <span>~{entry.estimatedMinutes} Min.</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MainMenu;
