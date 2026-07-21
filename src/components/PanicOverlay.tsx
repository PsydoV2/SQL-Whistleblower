import { useEffect } from "react";
import styles from "./PanicOverlay.module.css";

interface PanicOverlayProps {
  onDismiss: () => void;
}

// Neutrale "Tarn"-Ansicht (Boss-Key): überdeckt den Spiel-Tab unauffällig,
// nachdem im Vordergrund bereits ein echter neuer Tab geöffnet wurde.
// Tab-Titel und Favicon werden auf eine harmlose Standard-Ansicht getauscht.
const DECOY_TITLE = "Neuer Tab";

// Schlichtes, neutrales Favicon (grauer Kreis) als Data-URI.
const DECOY_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<circle cx="8" cy="8" r="7" fill="#c7ccd1"/></svg>',
  );

function setFavicon(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = href;
}

function PanicOverlay({ onDismiss }: PanicOverlayProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousFavicon =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? "";
    document.title = DECOY_TITLE;
    setFavicon(DECOY_FAVICON);
    return () => {
      document.title = previousTitle;
      if (previousFavicon) setFavicon(previousFavicon);
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
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.hint}>Klicken oder Esc, um fortzufahren</p>
    </div>
  );
}

export default PanicOverlay;
