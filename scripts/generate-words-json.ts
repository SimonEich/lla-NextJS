// Runs before dev/build (see package.json's predev/prebuild). The words
// dataset stays a typed, hand-editable TS file for authoring, but shipping
// it as a JS array literal made every route pull in a 3MB+ chunk that had
// to be parsed/executed before the page could render. Emitting it as a
// plain JSON asset instead lets it be fetched lazily and parsed natively.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { words } from "../src/data/words";

const outPath = path.join(__dirname, "..", "public", "words.json");
writeFileSync(outPath, JSON.stringify(words));
console.log(`[generate-words-json] wrote ${words.length} words to ${outPath}`);
