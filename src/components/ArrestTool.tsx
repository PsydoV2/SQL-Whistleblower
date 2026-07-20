import { useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "./ArrestTool.module.css";

interface ArrestToolProps {
  onSubmit: (name: string) => void;
  errorMessage: string | null;
}

function ArrestTool({ onSubmit, errorMessage }: ArrestToolProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    if (name.trim().length === 0) {
      return;
    }
    onSubmit(name);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleSubmit();
    }
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
        <button className={styles.submitButton} onClick={handleSubmit}>
          Verhaften
        </button>
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </div>
  );
}

export default ArrestTool;
