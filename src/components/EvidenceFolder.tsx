import type { EvidenceItem } from "../types/story.types";
import styles from "./EvidenceFolder.module.css";

interface EvidenceFolderProps {
  evidence: EvidenceItem[];
  hints: string[];
}

function EvidenceFolder({ evidence, hints }: EvidenceFolderProps) {
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
          <ul className={styles.hintsList}>
            {hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EvidenceFolder;
