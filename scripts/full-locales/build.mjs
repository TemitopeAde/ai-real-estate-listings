/**
 * Builds ru.mjs, it.mjs, th.mjs, pl.mjs from embedded translation maps.
 * Run: node scripts/full-locales/build.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EN } from "../../src/lib/dashboard-i18n/messages-en.ts";
import { ru } from "./data/ru.mjs";
import { it } from "./data/it.mjs";
import { th } from "./data/th.mjs";
import { pl } from "./data/pl.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const OMIT = new Set([
  "appName",
  "badgeWix",
  "navWriter",
  "planBasic",
  "planPro",
  "planBusiness",
  "featAiWriter",
  "shareWhatsapp",
  "shareFacebook",
  "shareInstagram",
  "shareX",
  "shareLinkedin",
  "shareTelegram",
  "sharePinterest",
  "shareReddit",
  "shareThreads",
  "shareTiktok",
  "shareYoutube",
  "shareSnapchat",
  ...Object.keys(EN).filter((k) => k.startsWith("lang")),
]);

const LANGS = { ru, it, th, pl };

function emit(code, map) {
  const keys = Object.keys(EN).filter((k) => !OMIT.has(k));
  const missing = keys.filter((k) => !map[k]);
  const extra = Object.keys(map).filter((k) => !keys.includes(k));
  if (missing.length) throw new Error(`${code}: missing ${missing.length} keys: ${missing.slice(0, 5).join(", ")}`);
  if (extra.length) throw new Error(`${code}: extra keys: ${extra.slice(0, 5).join(", ")}`);

  const lines = keys.map((k) => `  ${k}: ${JSON.stringify(map[k])},`);
  const body = `export default {\n${lines.join("\n")}\n};\n`;
  const path = join(__dirname, `${code}.mjs`);
  writeFileSync(path, body, "utf8");
  console.log(`${code}.mjs: ${keys.length} keys`);
}

mkdirSync(__dirname, { recursive: true });
for (const [code, map] of Object.entries(LANGS)) {
  emit(code, map);
}
console.log("done");
