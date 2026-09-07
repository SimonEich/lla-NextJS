"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CardScreen from "@/components/CardScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import { AppHeader } from "@/components/AppHeader";
import { useSession } from "@/hooks/useSession";

type Phase = "question" | "feedback";

export default function ExamScreen() {
  const router = useRouter();
  const { data, activeCount, empty, examCorrect, examWrong } = useSession({ examMode: true });
  const [phase, setPhase] = useState<Phase>("question");
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string | undefined>(undefined);

  function handleAnswer(correct: boolean, typedAnswer?: string) {
    setIsCorrect(correct);
    setUserAnswer(typedAnswer);
    setPhase("feedback");
  }

  function handleSwipe(action: () => void) {
    setPhase("question");
    action();
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Prüfung" />
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-app-bg px-10">
          <p className="text-5xl">🎉</p>
          <p className="text-xl font-bold text-ink">Nichts zu prüfen</p>
          <p className="text-center text-base text-muted">
            Es gibt aktuell keine aktiven Wörter zu prüfen.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-2xl bg-ink px-8 py-3.5 text-base font-semibold text-white"
          >
            Zurück
          </button>
        </div>
      ) : !data ? (
        <div className="flex flex-1 items-center justify-center bg-app-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand" />
        </div>
      ) : phase === "feedback" ? (
        <FeedbackScreen
          data={data}
          isCorrect={isCorrect}
          activeCount={activeCount}
          userAnswer={userAnswer}
          examMode
          // Right/up: known well enough → master it outright. Left/down:
          // not (yet) known → flag it "pending" for a later pass.
          onSwipeRight={() => handleSwipe(examCorrect)}
          onSwipeUp={() => handleSwipe(examCorrect)}
          onSwipeLeft={() => handleSwipe(examWrong)}
          onSwipeDown={() => handleSwipe(examWrong)}
        />
      ) : (
        <CardScreen data={data} onAnswer={handleAnswer} activeCount={activeCount} examMode />
      )}
    </div>
  );
}
