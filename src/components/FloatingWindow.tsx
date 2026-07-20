import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import styles from "./FloatingWindow.module.css";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

const MIN_WIDTH = 260;
const MIN_HEIGHT = 160;

interface FloatingWindowProps {
  title: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  onMove: (position: WindowPosition) => void;
  onResize: (size: WindowSize) => void;
  children: ReactNode;
}

function FloatingWindow({
  title,
  position,
  size,
  zIndex,
  onClose,
  onFocus,
  onMove,
  onResize,
  children,
}: FloatingWindowProps) {
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: WindowPosition;
  } | null>(null);

  const resizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: WindowSize;
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

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    onFocus();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: size,
    };
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = resizeStartRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const dx = event.clientX - resize.startX;
    const dy = event.clientY - resize.startY;
    onResize({
      width: Math.max(MIN_WIDTH, resize.origin.width + dx),
      height: Math.max(MIN_HEIGHT, resize.origin.height + dy),
    });
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (resizeStartRef.current?.pointerId === event.pointerId) {
      resizeStartRef.current = null;
    }
  }

  return (
    <div
      className={styles.window}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
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
      <div
        className={styles.resizeHandle}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        aria-hidden="true"
      />
    </div>
  );
}

export default FloatingWindow;
