import { useState } from "react";
import type { TableData } from "../types/story.types";
import styles from "./TableViewer.module.css";

interface TableViewerProps {
  tables: Record<string, TableData>;
  onInsert: (token: string) => void;
}

// Leitet einen groben SQL-Typ aus den vorhandenen Werten einer Spalte ab.
// Die konkreten Werte werden bewusst NICHT angezeigt – nur das Schema –,
// damit der Fall nicht durch bloßes Ablesen der Tabelle gelöst werden kann.
function inferColumnType(rows: TableData["rows"], colIndex: number): string {
  for (const row of rows) {
    const value = row[colIndex];
    if (value === null || value === undefined) continue;
    if (typeof value === "boolean") return "BOOLEAN";
    if (typeof value === "number") {
      return Number.isInteger(value) ? "INTEGER" : "REAL";
    }
    return "TEXT";
  }
  return "TEXT";
}

function TableViewer({ tables, onInsert }: TableViewerProps) {
  const tableNames = Object.keys(tables);
  const [selected, setSelected] = useState(tableNames[0] ?? null);

  const activeTable = selected ? tables[selected] : null;

  return (
    <div className={styles.viewer}>
      <div className={styles.tableList}>
        <div className={styles.listLabel}>Tabellen</div>
        {tableNames.map((name) => (
          <div key={name} className={styles.tableRow}>
            <button
              className={`${styles.tableButton} ${
                name === selected ? styles.tableButtonActive : ""
              }`}
              onClick={() => setSelected(name)}
            >
              {name}
            </button>
            <button
              className={styles.insertButton}
              onClick={() => onInsert(name)}
              title={`"${name}" in SQL-Konsole einfügen`}
              aria-label={`${name} in SQL-Konsole einfügen`}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <div className={styles.tableWrapper}>
        {activeTable && selected && (
          <div className={styles.schema}>
            <div className={styles.schemaHeader}>
              <span className={styles.schemaName}>{selected}</span>
              <span className={styles.schemaMeta}>
                {activeTable.columns.length} Spalten · {activeTable.rows.length}{" "}
                Zeilen
              </span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Spalte</th>
                  <th>Typ</th>
                </tr>
              </thead>
              <tbody>
                {activeTable.columns.map((col, index) => (
                  <tr key={col}>
                    <td className={styles.colCell}>
                      <button
                        className={styles.columnButton}
                        onClick={() => onInsert(col)}
                        title={`"${col}" in SQL-Konsole einfügen`}
                      >
                        {col}
                      </button>
                    </td>
                    <td className={styles.typeCell}>
                      {inferColumnType(activeTable.rows, index)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.schemaHint}>
              Nur das Schema ist sichtbar. Nutze die SQL-Konsole, um die Daten
              abzufragen – z.&nbsp;B.{" "}
              <code className={styles.schemaCode}>SELECT * FROM {selected};</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableViewer;
