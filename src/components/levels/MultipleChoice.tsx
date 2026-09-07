"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

export function MultipleChoice({ data, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const level = data.progress.level;

  // L1: see Spanish → pick German | L2: see German → pick Spanish
  const question = level === 1 ? data.word.target : data.word.native;
  const context = level === 1 ? data.sentence.target : data.sentence.native;
  const getLabel = (word: typeof data.word) => (level === 1 ? word.native : word.target);

  function handlePress(wordId: string) {
    if (selected) return;
    const isCorrect = wordId === data.word.id;
    setSelected(wordId);
    setTimeout(() => {
      setSelected(null);
      onAnswer(isCorrect);
    }, 200);
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 bg-app-bg px-5 pt-5 pb-12">
      <Card>
        <p className="w-full break-words px-5 pt-8 text-center text-[clamp(1.5rem,7vw,3rem)] font-bold text-ink [overflow-wrap:anywhere]">
          {question}
        </p>
        <p className="px-5 pt-3 pb-7 text-center text-base text-muted-2">{context}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {data.answerArray.map((word) => {
          let variant: "default" | "correct" | "wrong" = "default";
          if (selected === word.id) {
            variant = word.id === data.word.id ? "correct" : "wrong";
          }
          return (
            <Button
              key={word.id}
              label={getLabel(word)}
              variant={variant}
              onPress={() => handlePress(word.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
