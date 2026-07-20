import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(
  rootDir,
  "node_modules/sql.js/dist/sql-wasm-browser.wasm",
);
const destination = path.join(rootDir, "public/sql-wasm-browser.wasm");

copyFileSync(source, destination);
