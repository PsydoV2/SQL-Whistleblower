import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
  storyTitle: string;
  onLogin: () => void;
  onCancel: () => void;
}

function LoginScreen({ storyTitle, onLogin, onCancel }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    window.setTimeout(onLogin, 650);
  }

  return (
    <div className={styles.screen}>
      <button className={styles.cancel} onClick={onCancel}>
        ← Abbrechen
      </button>

      <div className={styles.caseBanner}>
        <span className={styles.caseLabel}>Falldatei</span>
        <span className={styles.caseTitle}>{storyTitle}</span>
      </div>

      <div className={styles.tile}>
        <div className={styles.avatar} aria-hidden="true">
          🕵️
        </div>
        <div className={styles.userName}>Ermittler</div>

        {loggingIn ? (
          <div className={styles.welcome}>
            <div className={styles.spinner} aria-hidden="true" />
            <span>Willkommen…</span>
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.password}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort"
              aria-label="Passwort"
            />
            <button
              className={styles.loginButton}
              type="submit"
              aria-label="Anmelden"
            >
              →
            </button>
          </form>
        )}
      </div>

      {!loggingIn && (
        <p className={styles.hint}>Passwort eingeben und Enter drücken</p>
      )}

      <div className={styles.footer}>Corp-Security · Ermittlungs-Terminal</div>
    </div>
  );
}

export default LoginScreen;
