import initSqlJs, { type Database, type SqlValue } from "sql.js";
import type { TableData } from "../types/story.types";

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null;

function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
    });
  }
  return sqlJsPromise;
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function toBindValue(value: string | number | boolean | null): SqlValue {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return value;
}

/**
 * Baut aus den Tabellendaten eines Kapitels (baseTables + kumulierte
 * additionalTables) eine frische in-memory SQLite-Datenbank.
 */
export async function buildDatabase(
  tables: Record<string, TableData>,
): Promise<Database> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();

  for (const [tableName, table] of Object.entries(tables)) {
    const columnsSql = table.columns.map(quoteIdentifier).join(", ");
    db.run(`CREATE TABLE ${quoteIdentifier(tableName)} (${columnsSql});`);

    if (table.rows.length === 0) {
      continue;
    }

    const placeholders = table.columns.map(() => "?").join(", ");
    const insertSql = `INSERT INTO ${quoteIdentifier(tableName)} (${columnsSql}) VALUES (${placeholders});`;
    const stmt = db.prepare(insertSql);
    for (const row of table.rows) {
      stmt.run(row.map(toBindValue));
    }
    stmt.free();
  }

  return db;
}

export interface QueryResult {
  columns: string[];
  rows: SqlValue[][];
}

/**
 * Führt beliebiges SQL gegen die übergebene Datenbank aus. Wirft bei
 * ungültigem SQL eine Error-Instanz, die vom Aufrufer (SqlConsole)
 * abgefangen und angezeigt werden soll.
 */
export function runQuery(db: Database, sqlString: string): QueryResult[] {
  const results = db.exec(sqlString);
  return results.map((result) => ({
    columns: result.columns,
    rows: result.values,
  }));
}
