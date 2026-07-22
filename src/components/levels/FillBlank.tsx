"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

export function FillBlank({ data, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { word, sentence, answerArray } = data;

  // Replace the target word form with a blank in the Spanish sentence
  const blankSentence = sentence.target.replace(sentence.target_word_form, "___");

  // Options: correct form + distractor base forms
  const options = answerArray.map((w) => (w.id === word.id ? sentence.target_word_form : w.target));

  function handlePress(option: string) {
    if (selected) return;
    const isCorrect = option === sentence.target_word_form;
    setSelected(option);
    setTimeout(() => {
      setSelected(null);
      onAnswer(isCorrect);
    }, 200);
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 bg-app-bg px-5 pt-5 pb-12">
      <Card flex>
        <p className="mb-4 text-center text-lg text-muted">{sentence.native}</p>
        <p className="text-center text-3xl font-bold text-ink">{blankSentence}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          let variant: "default" | "correct" | "wrong" = "default";
          if (selected === opt) {
            variant = opt === sentence.target_word_form ? "correct" : "wrong";
          }
          return <Button key={i} label={opt} variant={variant} onPress={() => handlePress(opt)} />;
        })}
      </div>
    </div>
  );
}
