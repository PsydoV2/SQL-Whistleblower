import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import styles from "./FloatingWindow.module.css";

export interface WindowPosition {
  x: number;
  y: number;
}

interface FloatingWindowProps {
  title: string;
  position: WindowPosition;
  zIndex: number;
  width: number;
  height: number;
  onClose: () => void;
  onFocus: () => void;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
}

function FloatingWindow({
  title,
  position,
  zIndex,
  width,
  height,
  onClose,
  onFocus,
  onMove,
  children,
}: FloatingWindowProps) {
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: WindowPosition;
  } | null>(null);

  function handleTitleBarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    onFocus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
    };
  }

  function handleTitleBarPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    onMove({ x: drag.origin.x + dx, y: drag.origin.y + dy });
  }

  function handleTitleBarPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  return (
    <div
      className={styles.window}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        zIndex,
      }}
      onPointerDownCapture={onFocus}
    >
      <div
        className={styles.titleBar}
        onPointerDown={handleTitleBarPointerDown}
        onPointerMove={handleTitleBarPointerMove}
        onPointerUp={handleTitleBarPointerUp}
        onPointerCancel={handleTitleBarPointerUp}
      >
        <span className={styles.title}>{title}</span>
        <button
          className={styles.closeButton}
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Fenster schließen"
        >
          ×
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default FloatingWindow;
