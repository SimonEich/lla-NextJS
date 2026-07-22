"use client";

import { useState } from "react";
import CardScreen from "@/components/CardScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import { AppHeader } from "@/components/AppHeader";
import { useSession } from "@/hooks/useSession";

type Phase = "question" | "feedback";

export default function LearnScreen() {
  const { data, activeCount, swipeRight, swipeUp, swipeLeft, swipeDown } = useSession();
  const [phase, setPhase] = useState<Phase>("question");
  const [isCorrect, setIsCorrect] = useState(false);

  function handleAnswer(correct: boolean) {
    setIsCorrect(correct);
    setPhase("feedback");
  }

  function handleSwipe(action: () => void) {
    setPhase("question");
    action();
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Lernen" />
      {!data ? (
        <div className="flex flex-1 items-center justify-center bg-app-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand" />
        </div>
      ) : phase === "feedback" ? (
        <FeedbackScreen
          data={data}
          isCorrect={isCorrect}
          activeCount={activeCount}
          onSwipeRight={() => handleSwipe(swipeRight)}
          onSwipeUp={() => handleSwipe(swipeUp)}
          onSwipeLeft={() => handleSwipe(swipeLeft)}
          onSwipeDown={() => handleSwipe(swipeDown)}
        />
      ) : (
        <CardScreen data={data} onAnswer={handleAnswer} activeCount={activeCount} />
      )}
    </div>
  );
}
