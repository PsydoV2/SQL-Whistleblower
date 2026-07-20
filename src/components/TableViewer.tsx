import { useState } from "react";
import type { TableData } from "../types/story.types";
import styles from "./TableViewer.module.css";

interface TableViewerProps {
  tables: Record<string, TableData>;
}

function TableViewer({ tables }: TableViewerProps) {
  const tableNames = Object.keys(tables);
  const [selected, setSelected] = useState(tableNames[0] ?? null);

  const activeTable = selected ? tables[selected] : null;

  return (
    <div className={styles.viewer}>
      <div className={styles.tableList}>
        {tableNames.map((name) => (
          <button
            key={name}
            className={`${styles.tableButton} ${
              name === selected ? styles.tableButtonActive : ""
            }`}
            onClick={() => setSelected(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={styles.tableWrapper}>
        {activeTable && (
          <table className={styles.table}>
            <thead>
              <tr>
                {activeTable.columns.map((col) => (
                  <th key={col}>{col}</th>
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
