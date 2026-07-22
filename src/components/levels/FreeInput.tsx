"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Card } from "@/components/ui/Card";
import { fuzzyMatch } from "@/utils/fuzzy";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

export function FreeInput({ data, onAnswer }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const { word } = data;

  function handleSubmit() {
    if (result || !input.trim()) return;
    const isCorrect = fuzzyMatch(input, word.target);
    setResult(isCorrect ? "correct" : "wrong");
    setTimeout(() => {
      setInput("");
      setResult(null);
      onAnswer(isCorrect);
    }, 200);
  }

  const borderColor =
    result === "correct" ? "border-brand" : result === "wrong" ? "border-wrong" : "border-border";
  const inputBg = result === "correct" ? "bg-correct-bg" : result === "wrong" ? "bg-wrong-bg" : "bg-white";

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 bg-app-bg px-5 pt-5 pb-12">
      <Card>
        <p className="px-5 pt-7 text-center text-sm text-muted-2">Wie heißt das auf Spanisch?</p>
        <p className="px-5 py-6 text-center text-5xl font-bold text-ink">{word.native}</p>
      </Card>

      <div className="flex flex-col gap-3">
        <input
          className={`w-full rounded-2xl border-[1.5px] px-[18px] py-3.5 text-xl font-semibold text-ink outline-none ${borderColor} ${inputBg}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          placeholder="Antwort eingeben..."
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-ink py-4 text-lg font-bold text-white"
        >
          Prüfen
        </button>
      </div>
    </div>
  );
}
