import { useEffect } from "react";
import styles from "./PanicOverlay.module.css";

interface PanicOverlayProps {
  onDismiss: () => void;
}

// Harmlos aussehende "Tarn"-Ansicht (Boss-Key): verdeckt das Spiel sofort
// hinter einer langweiligen Tabellenkalkulation und tauscht den Tab-Titel.
const DECOY_TITLE = "Umsatzübersicht Q3 2026.xlsx - Tabellenkalkulation";

const COLUMNS = ["Region", "Produkt", "Menge", "Umsatz (€)", "Marge %"];

const ROWS: string[][] = [
  ["Nord", "Modul A", "1.240", "37.200", "18,4"],
  ["Nord", "Modul B", "980", "29.400", "21,1"],
  ["Süd", "Modul A", "1.510", "45.300", "17,9"],
  ["Süd", "Modul C", "620", "24.800", "24,6"],
  ["West", "Modul B", "1.075", "32.250", "20,3"],
  ["West", "Modul C", "845", "33.800", "23,7"],
  ["Ost", "Modul A", "1.320", "39.600", "18,8"],
  ["Ost", "Modul B", "1.150", "34.500", "20,9"],
  ["Zentral", "Modul C", "700", "28.000", "24,1"],
  ["Zentral", "Modul A", "1.410", "42.300", "18,2"],
];

function PanicOverlay({ onDismiss }: PanicOverlayProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = DECOY_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  return (
    <div
      className={styles.overlay}
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      title="Klicken oder Esc drücken, um fortzufahren"
    >
      <div className={styles.appWindow}>
        <div className={styles.titleBar}>
          <span className={styles.titleText}>{DECOY_TITLE}</span>
          <div className={styles.titleButtons}>
            <span className={styles.titleBtn}>_</span>
            <span className={styles.titleBtn}>▢</span>
            <span className={styles.titleBtn}>✕</span>
          </div>
        </div>
        <div className={styles.menuBar}>
          {["Datei", "Bearbeiten", "Ansicht", "Einfügen", "Format", "Daten", "Hilfe"].map(
            (item) => (
              <span key={item} className={styles.menuItem}>
                {item}
              </span>
            ),
          )}
        </div>
        <div className={styles.formulaBar}>
          <span className={styles.cellRef}>D4</span>
          <span className={styles.formula}>=SUMME(D2:D11)</span>
        </div>
        <div className={styles.sheet}>
          <table className={styles.grid}>
            <thead>
              <tr>
                <th className={styles.rowHeader}></th>
                {COLUMNS.map((col, i) => (
                  <th key={i} className={styles.colHeader}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, r) => (
                <tr key={r}>
                  <td className={styles.rowHeader}>{r + 1}</td>
                  {row.map((cell, c) => (
                    <td key={c} className={styles.cell}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={styles.rowHeader}>{ROWS.length + 1}</td>
                <td className={styles.cell}></td>
                <td className={`${styles.cell} ${styles.total}`}>Gesamt</td>
                <td className={`${styles.cell} ${styles.total}`}>10.850</td>
                <td className={`${styles.cell} ${styles.total}`}>341.150</td>
                <td className={styles.cell}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.statusBar}>
          <span>Bereit</span>
          <span className={styles.sheetTabs}>
            <span className={styles.sheetTabActive}>Tabelle1</span>
            <span className={styles.sheetTab}>Tabelle2</span>
            <span className={styles.sheetTab}>Tabelle3</span>
          </span>
          <span>Summe=341.150</span>
        </div>
      </div>
    </div>
  );
}

export default PanicOverlay;
