"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Card } from "@/components/ui/Card";
import { fuzzyMatch } from "@/utils/fuzzy";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

const MIC_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mikrofonzugriff verweigert",
  "no-speech": "Nichts gehört — versuch's nochmal",
  "audio-capture": "Kein Mikrofon gefunden",
};

export function FreeInput({ data, onAnswer }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const { supported: micSupported, listening, start, stop } = useSpeechRecognition("es-ES");
  const { word } = data;

  function submitAnswer(value: string) {
    if (result || !value.trim()) return;
    const isCorrect = fuzzyMatch(value, word.target);
    setResult(isCorrect ? "correct" : "wrong");
    setTimeout(() => {
      setInput("");
      setResult(null);
      onAnswer(isCorrect);
    }, 200);
  }

  function handleSubmit() {
    submitAnswer(input);
  }

  function handleMicPress() {
    if (listening) {
      stop();
      return;
    }
    setMicError(null);
    start(
      (transcript) => {
        const cleaned = transcript.replace(/[.,!?¡¿]+$/g, "").trim();
        setInput(cleaned);
        submitAnswer(cleaned);
      },
      (error) => {
        setMicError(MIC_ERROR_MESSAGES[error] ?? "Spracherkennung fehlgeschlagen");
      }
    );
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
          disabled={listening}
        />

        {micSupported && (
          <button
            type="button"
            onClick={handleMicPress}
            className={`w-full rounded-2xl border-[1.5px] py-3.5 text-base font-semibold transition-colors ${
              listening
                ? "animate-pulse border-brand bg-brand text-white"
                : "border-border bg-white text-ink"
            }`}
          >
            {listening ? "🎤 Höre zu…" : "🎤 Sprechen"}
          </button>
        )}

        {micError && <p className="text-center text-xs text-wrong">{micError}</p>}

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
