"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const MAGNIFICATION = 2.25;
const DEFAULT_LENS_SIZE = 156;

export function ProductImageMagnifier({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const enlargedRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);

  const updateLens = useCallback(() => {
    if (frameRef.current !== null || !pointerRef.current) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const stage = stageRef.current;
      const lens = lensRef.current;
      const enlarged = enlargedRef.current;
      const pointer = pointerRef.current;
      if (!stage || !lens || !enlarged || !pointer) return;

      const bounds = stage.getBoundingClientRect();
      const x = pointer.x - bounds.left;
      const y = pointer.y - bounds.top;
      const lensSize = lens.offsetWidth || DEFAULT_LENS_SIZE;
      const radius = lensSize / 2;

      lens.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0)`;
      lens.style.opacity = "1";
      enlarged.style.width = `${bounds.width}px`;
      enlarged.style.height = `${bounds.height}px`;
      enlarged.style.transform = `translate3d(${radius - x * MAGNIFICATION}px, ${radius - y * MAGNIFICATION}px, 0) scale(${MAGNIFICATION})`;
    });
  }, []);

  const hideLens = useCallback(() => {
    pointerRef.current = null;
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (lensRef.current) lensRef.current.style.opacity = "0";
  }, []);

  useEffect(() => {
    const repositionLens = () => {
      if (pointerRef.current) updateLens();
    };
    window.addEventListener("scroll", repositionLens, true);
    window.addEventListener("resize", repositionLens);
    return () => {
      window.removeEventListener("scroll", repositionLens, true);
      window.removeEventListener("resize", repositionLens);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [updateLens]);

  useEffect(() => {
    if (!viewerOpen) return;

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [viewerOpen]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    updateLens();
  }

  function openTouchViewer(event: React.MouseEvent<HTMLDivElement>) {
    if (event.detail === 0 || !window.matchMedia("(hover: none)").matches) return;
    event.preventDefault();
    event.stopPropagation();
    setViewerScale(1);
    setViewerOpen(true);
  }

  return (
    <>
      <div
        ref={stageRef}
        className="product-image-magnifier"
        role="img"
        aria-label={label}
        onPointerMove={handlePointerMove}
        onPointerLeave={hideLens}
        onClick={openTouchViewer}
      >
        <div className="magnifier-stage">{children}</div>
        <div ref={lensRef} className="magnifier-lens" aria-hidden="true">
          <div ref={enlargedRef} className="magnifier-lens-content">
            <div className="magnifier-stage">{children}</div>
          </div>
        </div>
      </div>
      {viewerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="magnifier-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Zoomed view of ${label}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setViewerOpen(false);
            }}
          >
            <button
              ref={closeRef}
              className="magnifier-viewer-close"
              type="button"
              onClick={() => setViewerOpen(false)}
            >
              Close
            </button>
            <div
              className="magnifier-viewer-art"
              style={{ transform: `scale(${viewerScale})` }}
            >
              {children}
            </div>
            <div className="magnifier-viewer-controls">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={viewerScale <= 1}
                onClick={() =>
                  setViewerScale((scale) => Math.max(1, scale - 0.25))
                }
              >
                −
              </button>
              <span>{Math.round(viewerScale * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={viewerScale >= 2.5}
                onClick={() =>
                  setViewerScale((scale) => Math.min(2.5, scale + 0.25))
                }
              >
                +
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
