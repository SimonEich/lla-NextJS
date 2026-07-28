#!/usr/bin/env node
// One-off: the words.ts array literal grew to 3000 entries and TypeScript
// chokes on it ("Expression produces a union type that is too complex to
// represent"). Split the single 3000-element literal into fixed-size chunk
// consts so each individual literal stays small enough for tsc to check,
// then concatenate them back into the same `export const words: Word[]`.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "data", "words.ts");
const src = fs.readFileSync(file, "utf8");
const lines = src.split("\n");

const headerEnd = lines.findIndex((l) => l.startsWith("export const words: Word[] = ["));
if (headerEnd === -1) throw new Error("Could not find `export const words: Word[] = [` line");
const footerStart = lines.findIndex((l, i) => i > headerEnd && l.trim() === "];");
if (footerStart === -1) throw new Error("Could not find closing `];` line");

const bodyLines = lines.slice(headerEnd + 1, footerStart);

// Entries start at top-level "  { id: '...'" lines.
const entryStarts = [];
bodyLines.forEach((l, i) => {
  if (/^  \{ id: '/.test(l)) entryStarts.push(i);
});
if (entryStarts.length === 0) throw new Error("No entries found");

const entries = entryStarts.map((start, idx) => {
  const end = idx + 1 < entryStarts.length ? entryStarts[idx + 1] : bodyLines.length;
  return bodyLines.slice(start, end).join("\n").replace(/\n+$/, "");
});

console.log(`Found ${entries.length} word entries.`);

const CHUNK_SIZE = 250;
const chunks = [];
for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
  chunks.push(entries.slice(i, i + CHUNK_SIZE));
}
console.log(`Splitting into ${chunks.length} chunks of up to ${CHUNK_SIZE} entries each.`);

const preamble = lines.slice(0, headerEnd).join("\n").replace(/\n+$/, "");

const chunkDecls = chunks
  .map((chunkEntries, i) => {
    const body = chunkEntries.join("\n");
    return `const wordsChunk${i}: Word[] = [\n${body}\n];`;
  })
  .join("\n\n");

const combined = `export const words: Word[] = [${chunks
  .map((_, i) => `\n  ...wordsChunk${i},`)
  .join("")}\n];\n`;

const out = `${preamble}\n\n${chunkDecls}\n\n${combined}`;

fs.writeFileSync(file, out);
console.log(`Wrote ${file} (${out.split("\n").length} lines).`);
