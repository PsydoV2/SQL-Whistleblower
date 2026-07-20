import { useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "./SqlConsole.module.css";

interface SqlConsoleProps {
  onRunQuery: (sql: string) => void;
}

function SqlConsole({ onRunQuery }: SqlConsoleProps) {
  const [sql, setSql] = useState("SELECT * FROM employees;");

  function handleRun() {
    if (sql.trim().length === 0) {
      return;
    }
    onRunQuery(sql);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleRun();
    }
  }

  return (
    <div className={styles.console}>
      <textarea
        className={styles.textarea}
        value={sql}
        onChange={(event) => setSql(event.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>Strg/Cmd + Enter zum Ausführen</span>
        <button className={styles.runButton} onClick={handleRun}>
          Ausführen
        </button>
      </div>
    </div>
  );
}

export default SqlConsole;
