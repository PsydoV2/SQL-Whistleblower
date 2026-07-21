import { useState } from "react";
import type { TableData } from "../types/story.types";
import styles from "./TableViewer.module.css";

interface TableViewerProps {
  tables: Record<string, TableData>;
  onInsert: (token: string) => void;
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
        {activeTable && (
          <table className={styles.table}>
            <thead>
              <tr>
                {activeTable.columns.map((col) => (
                  <th key={col}>
                    <button
                      className={styles.columnButton}
                      onClick={() => onInsert(col)}
                      title={`"${col}" in SQL-Konsole einfügen`}
                    >
                      {col}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTable.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, colIndex) => (
                    <td key={colIndex}>{String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TableViewer;
