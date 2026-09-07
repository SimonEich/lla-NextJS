"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Card } from "@/components/ui/Card";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

type Token = { text: string; isTarget: boolean };

const TRAILING_PUNCT = /[.,!?;:]/;

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[a-zà-öø-ÿ0-9]/i.test(ch);
}

// Splits the sentence into clickable chunks, keeping the (possibly
// multi-word, e.g. "Buenas tardes") target form as a single chunk so it's
// never chopped up across separate buttons.
function tokenize(sentence: string, form: string): Token[] {
  const lowerSentence = sentence.toLowerCase();
  const lowerForm = form.toLowerCase();

  let searchFrom = 0;
  let matchStart = -1;
  while (searchFrom <= lowerSentence.length) {
    const idx = lowerSentence.indexOf(lowerForm, searchFrom);
    if (idx === -1) break;
    const before = idx > 0 ? lowerSentence[idx - 1] : undefined;
    const after = lowerSentence[idx + lowerForm.length];
    // Require the match to sit on word boundaries so a short form (e.g.
    // "es") can't match inside a longer word (e.g. "está").
    if (!isWordChar(before) && !isWordChar(after)) {
      matchStart = idx;
      break;
    }
    searchFrom = idx + 1;
  }

  if (matchStart === -1) {
    // Form wasn't found verbatim (shouldn't normally happen) — fall back to
    // per-word tokens so the card still renders something clickable.
    return sentence.split(" ").map((text) => ({
      text,
      isTarget: text.replace(/[.,!?;:]/g, "").toLowerCase() === lowerForm,
    }));
  }

  let matchEnd = matchStart + form.length;
  // Keep trailing punctuation glued to the word/phrase, e.g. "verde." stays
  // one token instead of splitting off a lone "." button.
  while (matchEnd < sentence.length && TRAILING_PUNCT.test(sentence[matchEnd])) {
    matchEnd++;
  }

  const before = sentence.slice(0, matchStart).trim();
  const match = sentence.slice(matchStart, matchEnd);
  const after = sentence.slice(matchEnd).trim();

  return [
    ...(before ? before.split(/\s+/).map((text) => ({ text, isTarget: false })) : []),
    { text: match, isTarget: true },
    ...(after ? after.split(/\s+/).map((text) => ({ text, isTarget: false })) : []),
  ];
}

export function WordMark({ data, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const { sentence } = data;

  const tokens = tokenize(sentence.target, sentence.target_word_form);

  function handlePress(index: number, isTarget: boolean) {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => {
      setSelected(null);
      onAnswer(isTarget);
    }, 200);
  }

  return (
    <div className="flex flex-1 flex-col bg-app-bg px-5 pt-5 pb-12">
      <Card flex>
        <p className="mb-2 w-full break-words text-center text-[clamp(1.375rem,6vw,2.25rem)] font-bold text-ink [overflow-wrap:anywhere]">
          {data.word.native}
        </p>
        <p className="mb-5 text-center text-sm text-muted-2">Tippe das richtige Wort an</p>
        <div className="flex flex-wrap justify-center gap-2 px-3">
          {tokens.map((token, i) => {
            let bg = "bg-[#f0f0f0]";
            if (selected === i) {
              bg = token.isTarget ? "bg-correct-bg" : "bg-wrong-bg";
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePress(i, token.isTarget)}
                className={`max-w-full break-words rounded-[10px] px-3.5 py-2.5 text-[clamp(1rem,5vw,1.5rem)] font-semibold text-ink transition-colors [overflow-wrap:anywhere] ${bg}`}
              >
                {token.text}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
