"use client";

import { useRef, useState } from "react";
import { MultiData } from "@/types/session";

type Props = {
  data: MultiData;
  isCorrect: boolean;
  activeCount: number;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeLeft: () => void;
  onSwipeDown: () => void;
};

const SWIPE_THRESHOLD = 60;

export default function FeedbackScreen({
  data,
  isCorrect,
  activeCount,
  onSwipeRight,
  onSwipeUp,
  onSwipeLeft,
  onSwipeDown,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startY: 0, dx: 0, dy: 0, active: false });
  const [springBack, setSpringBack] = useState(false);
  const { sentence, word, progress, verbForm } = data;

  function applyTransform(dx: number, dy: number) {
    const card = cardRef.current;
    if (!card) return;
    const rotate = Math.max(-8, Math.min(8, (dx / 150) * 8));
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: true };
    setSpringBack(false);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best-effort — dragging still works via document-level moves.
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    drag.current.dx = dx;
    drag.current.dy = dy;
    applyTransform(dx, dy);
  }

  function handlePointerUp() {
    if (!drag.current.active) return;
    const { dx, dy } = drag.current;
    drag.current.active = false;

    setSpringBack(true);
    applyTransform(0, 0);

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
    } else if (absDy > absDx && absDy > SWIPE_THRESHOLD) {
      if (dy < 0) onSwipeUp();
      else onSwipeDown();
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-app-bg pb-20">
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
        className={`no-select flex w-[85%] cursor-grab flex-col items-center gap-4 rounded-3xl bg-white p-7 shadow-[0_6px_16px_rgba(0,0,0,0.1)] active:cursor-grabbing ${
          springBack ? "transition-transform duration-300 ease-out" : ""
        }`}
      >
        {/* Result badge */}
        <span
          className={`mb-2 rounded-full px-5 py-2 text-lg font-bold text-ink ${
            isCorrect ? "bg-correct-bg" : "bg-wrong-bg"
          }`}
        >
          {isCorrect ? "Richtig ✓" : "Falsch ✗"}
        </span>

        {/* Word */}
        <p className="text-4xl font-extrabold text-ink">{word.native}</p>
        <p className="-mt-2 text-2xl font-semibold text-[#555]">{word.target}</p>

        {/* Example sentence */}
        <div className="mt-2 w-full rounded-2xl bg-[#f8f8f8] p-4">
          <p className="text-sm text-muted">{sentence.native}</p>
          <p className="text-[17px] font-semibold text-ink">{sentence.target}</p>
          {sentence.pers_pron_form && (
            <p className="mt-1 text-xs text-muted-2">
              {sentence.pers_pron_form}: {sentence.target_word_form}
            </p>
          )}
        </div>

        {/* Level info */}
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <p className="text-sm text-muted-3">
            Level {progress.level} ·{" "}
            {verbForm
              ? `${(progress.formsDone ?? []).length}/${verbForm.requiredForms.length} Formen`
              : `${progress.correctCount}/3 richtig`}
          </p>
          <p className="text-[11px] text-[#ccc]">{activeCount} Wörter im Stapel</p>
        </div>
      </div>

      {/* Swipe hints */}
      <div className="absolute bottom-6 flex items-center gap-4 text-sm text-[#666] opacity-50">
        <span>← Falsch</span>
        <div className="flex gap-3">
          <span>↑ Einfach</span>
          <span>→ Gewusst</span>
          <span>↓ Schwer</span>
        </div>
      </div>
    </div>
  );
}
