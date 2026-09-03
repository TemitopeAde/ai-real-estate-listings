import { EN } from "../src/lib/dashboard-i18n/messages-en.ts";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "../src/lib/dashboard-i18n/locales");

const LANGS = [
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt",
  "ru",
  "ur",
  "id",
  "de",
  "ja",
  "sw",
  "tr",
  "ko",
  "vi",
  "it",
  "th",
  "pl",
];

const enKeys = Object.keys(EN).sort();
let failed = false;

function parseKeys(src) {
  return [...src.matchAll(/^  ([a-zA-Z0-9_]+):/gm)].map((m) => m[1]);
}

console.log(`en: OK (${enKeys.length} keys)`);

for (const lang of LANGS) {
  const src = readFileSync(join(localesDir, `${lang}.ts`), "utf8");
  const keys = parseKeys(src).sort();
  const missing = enKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !enKeys.includes(k));
  if (missing.length || extra.length || keys.length !== enKeys.length) {
    failed = true;
    console.error(
      `${lang}: keys=${keys.length} missing=${missing.length} extra=${extra.length}`,
    );
  } else {
    console.log(`${lang}: OK (${keys.length} keys)`);
  }
}

if (failed) process.exit(1);
console.log(`All catalogs match EN (${enKeys.length} keys).`);
