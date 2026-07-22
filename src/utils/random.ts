import { Word } from "@/data/words";

const COOLDOWN_ROUNDS = 5;
const cooldownHistory: number[] = [];

export function getRandomIndex(length: number): {
  correct: number;
  distractor1: number;
  distractor2: number;
  sentence: number;
} {
  // Reset history if it gets too large for the active pool size
  if (cooldownHistory.length >= length) {
    cooldownHistory.length = 0;
  }

  let correctNumber = 0;
  let isTooRecent = true;

  // Cooldown loop for picking a word that isn't too recent
  while (isTooRecent) {
    correctNumber = Math.floor(Math.random() * length);
    isTooRecent = cooldownHistory.includes(correctNumber);
  }

  cooldownHistory.push(correctNumber);
  if (cooldownHistory.length > COOLDOWN_ROUNDS) {
    cooldownHistory.shift();
  }

  let distractor1 = 0;
  let distractor2 = 0;

  do {
    distractor1 = Math.floor(Math.random() * length);
  } while (distractor1 === correctNumber);

  do {
    distractor2 = Math.floor(Math.random() * length);
  } while (distractor2 === correctNumber || distractor2 === distractor1);

  // Assuming each word has up to 6 context sentences (index 0 to 5)
  const sentence = Math.floor(Math.random() * 6);

  return { correct: correctNumber, distractor1, distractor2, sentence };
}

export function buildAnswerArray(correct: Word, d1: Word, d2: Word): Word[] {
  const arr = [correct, d1, d2];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
