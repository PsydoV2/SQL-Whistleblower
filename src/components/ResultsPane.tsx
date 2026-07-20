import type { QueryResult } from "../engine/sqlEngine";
import styles from "./ResultsPane.module.css";

interface ResultsPaneProps {
  results: QueryResult[] | null;
  error: string | null;
}

function ResultsPane({ results, error }: ResultsPaneProps) {
  if (error) {
    return (
      <div className={styles.pane}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={styles.pane}>
        <p className={styles.placeholder}>
          Noch keine Query ausgeführt. Schreib eine SQL-Abfrage in der Konsole
          und klicke auf "Ausführen".
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.pane}>
        <p className={styles.emptyResult}>
          Query erfolgreich, aber keine Ergebniszeilen.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.pane}>
      {results.map((result, index) => (
        <div key={index} className={styles.resultBlock}>
          <table className={styles.table}>
            <thead>
              <tr>
                {result.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, colIndex) => (
                    <td key={colIndex}>{value === null ? "NULL" : String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.rowCount}>{result.rows.length} Zeile(n)</div>
        </div>
      ))}
    </div>
  );
}

export default ResultsPane;
