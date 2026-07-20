# SQL-Whistleblower

Ein browserbasiertes Detektiv-Spiel, in dem Spieler Kriminalfälle mit echten SQL-Abfragen
lösen. Reines Frontend (Vite + React + TypeScript), SQL läuft komplett im Browser via
[sql.js](https://github.com/sql-js/sql.js) (SQLite/WASM). Kein Server, keine Datenbank,
keine Authentifizierung.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stories hinzufügen

Neue Fälle werden als JSON-Dateien unter `public/stories/<story_id>/` abgelegt
(`story.json` + `chapter_*.json`) und in `src/data/storyRegistry.json` registriert.
Das Datenformat ist in der MVP-Spezifikation dokumentiert.
