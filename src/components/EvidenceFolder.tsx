import type { EvidenceItem } from "../types/story.types";
import styles from "./EvidenceFolder.module.css";

interface EvidenceFolderProps {
  evidence: EvidenceItem[];
  hints: string[];
  revealedHints: number;
  onRevealHint: () => void;
}

function EvidenceFolder({
  evidence,
  hints,
  revealedHints,
  onRevealHint,
}: EvidenceFolderProps) {
  const remaining = hints.length - revealedHints;

  return (
    <div className={styles.folder}>
      {evidence.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.itemTitle}>{item.title}</div>
          <div className={styles.itemContent}>
            {item.type === "image" ? (
              <img src={item.content} alt={item.title} />
            ) : (
              item.content
            )}
          </div>
        </div>
      ))}
      {hints.length > 0 && (
        <div className={styles.hints}>
          <div className={styles.hintsTitle}>Hinweise</div>
          {revealedHints === 0 ? (
            <p className={styles.hintsIntro}>
              Komm erst mal selbst weiter — bei Bedarf kannst du Hinweise
              anfordern.
            </p>
          ) : (
            <ul className={styles.hintsList}>
              {hints.slice(0, revealedHints).map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          )}
          {remaining > 0 && (
            <button className={styles.hintButton} onClick={onRevealHint}>
              Hinweis anfordern ({remaining} verbleibend)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EvidenceFolder;
