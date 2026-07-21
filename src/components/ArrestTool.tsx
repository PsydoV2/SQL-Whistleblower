import { useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "./ArrestTool.module.css";

interface ArrestToolProps {
  onSubmit: (name: string) => void;
  errorMessage: string | null;
}

function ArrestTool({ onSubmit, errorMessage }: ArrestToolProps) {
  const [name, setName] = useState("");
  const [pendingName, setPendingName] = useState<string | null>(null);

  function handleRequest() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return;
    }
    setPendingName(trimmed);
  }

  function handleConfirm() {
    if (pendingName) {
      onSubmit(pendingName);
      setPendingName(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleRequest();
    }
  }

  if (pendingName) {
    return (
      <div className={styles.tool}>
        <div className={styles.confirmBox}>
          <p className={styles.confirmQuestion}>
            Haftbefehl gegen <strong>{pendingName}</strong> ausstellen?
          </p>
          <p className={styles.confirmWarning}>
            Eine Verhaftung ist folgenschwer. Stell sicher, dass die Beweislage
            eindeutig ist.
          </p>
          <div className={styles.confirmRow}>
            <button
              className={styles.cancelButton}
              onClick={() => setPendingName(null)}
            >
              Abbrechen
            </button>
            <button className={styles.submitButton} onClick={handleConfirm}>
              Verhaftung bestätigen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tool}>
      <p className={styles.label}>
        Wen verhaftest du? Gib den vollen Namen der verdächtigen Person ein.
      </p>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Name eingeben..."
        />
        <button className={styles.submitButton} onClick={handleRequest}>
          Verhaften
        </button>
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </div>
  );
}

export default ArrestTool;
