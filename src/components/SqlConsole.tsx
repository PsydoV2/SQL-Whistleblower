import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject, UIEvent } from "react";
import styles from "./SqlConsole.module.css";

export interface SqlRunInfo {
  time: string;
  summary: string;
  ok: boolean;
}

interface SqlConsoleProps {
  value: string;
  onChange: (value: string) => void;
  onRun: (sql: string) => void;
  history: string[];
  lastRun: SqlRunInfo | null;
  insertRef: MutableRefObject<((token: string) => void) | null>;
}

function SqlConsole({
  value,
  onChange,
  onRun,
  history,
  lastRun,
  insertRef,
}: SqlConsoleProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const lineCount = useMemo(() => value.split("\n").length, [value]);

  function handleRun() {
    if (value.trim().length === 0) {
      return;
    }
    onRun(value);
  }

  function insertAtCaret(token: string) {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : value.length;
    const end = textarea ? textarea.selectionEnd : value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const prefix = needsLeadingSpace ? " " : "";
    const insertText = prefix + token;
    const newValue = before + insertText + after;
    pendingCaretRef.current = start + insertText.length;
    onChange(newValue);
  }

  // Allow the parent to push identifier tokens (clicked table/column names)
  // into the editor at the caret while the console is open.
  useEffect(() => {
    insertRef.current = insertAtCaret;
    return () => {
      if (insertRef.current === insertAtCaret) {
        insertRef.current = null;
      }
    };
  });

  // Restore the caret after a programmatic insertion (controlled textarea).
  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && textareaRef.current) {
      const caret = pendingCaretRef.current;
      pendingCaretRef.current = null;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(caret, caret);
    }
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleRun();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + "  " + value.slice(end);
      pendingCaretRef.current = start + 2;
      onChange(newValue);
    }
  }

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function loadFromHistory(entry: string) {
    onChange(entry);
    setHistoryOpen(false);
    pendingCaretRef.current = entry.length;
  }

  return (
    <div className={styles.console}>
      <div className={styles.toolbar}>
        <span className={styles.prompt}>query.sql</span>
        <div className={styles.toolbarRight}>
          <button
            className={styles.historyButton}
            onClick={() => setHistoryOpen((open) => !open)}
            disabled={history.length === 0}
          >
            Verlauf ({history.length})
          </button>
        </div>
      </div>

      {historyOpen && history.length > 0 && (
        <ul className={styles.historyList}>
          {history.map((entry, index) => (
            <li key={index}>
              <button
                className={styles.historyEntry}
                onClick={() => loadFromHistory(entry)}
                title={entry}
              >
                {entry.replace(/\s+/g, " ").trim()}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.editor}>
        <div className={styles.gutter} ref={gutterRef} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className={styles.gutterLine}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.status}>
          {lastRun ? (
            <span className={lastRun.ok ? styles.statusOk : styles.statusErr}>
              {lastRun.time} · {lastRun.summary}
            </span>
          ) : (
            <span className={styles.hint}>Strg/Cmd + Enter zum Ausführen</span>
          )}
        </span>
        <button className={styles.runButton} onClick={handleRun}>
          Ausführen
        </button>
      </div>
    </div>
  );
}

export default SqlConsole;
