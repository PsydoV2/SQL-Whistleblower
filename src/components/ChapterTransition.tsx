import styles from "./ChapterTransition.module.css";

interface ChapterTransitionProps {
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  onContinue: () => void;
}

function ChapterTransition({
  eyebrow,
  title,
  text,
  buttonLabel,
  onContinue,
}: ChapterTransitionProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <button className={styles.continueButton} onClick={onContinue}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default ChapterTransition;
