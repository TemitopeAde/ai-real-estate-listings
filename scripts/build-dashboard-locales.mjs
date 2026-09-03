/**
 * Rebuilds dashboard locale files from legacy zip arrays + translation overrides.
 * Run: node scripts/build-dashboard-locales.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { EN } from "../src/lib/dashboard-i18n/messages-en.ts";
import { overrides } from "./locale-overrides.mjs";
import ruFull from "./full-locales/ru.mjs";
import itFull from "./full-locales/it.mjs";
import thFull from "./full-locales/th.mjs";
import plFull from "./full-locales/pl.mjs";

overrides.full = { ru: ruFull, it: itFull, th: thFull, pl: plFull };

const KEYS = Object.keys(EN);
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

const KEEP_EN = new Set([
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
]);

function keepEn(key) {
  return KEEP_EN.has(key) || key.startsWith("lang");
}

function salvageOffset(index) {
  if (index < 300) return 0;
  if (index < 370) return 8;
  return 9;
}

function parseLegacyStrings(path) {
  const raw = readFileSync(path, "utf8");
  return [...raw.matchAll(/^\s*"((?:\\.|[^"\\])*)"/gm)].map((m) =>
    m[1].replace(/\\"/g, '"'),
  );
}

function buildMap(lang) {
  const full = overrides.full?.[lang];
  const map = full ? { ...full } : {};

  if (!full) {
    const legacyPath = `scripts/legacy-zips/${lang}.ts`;
    const strings = parseLegacyStrings(legacyPath);

    for (let i = 0; i < KEYS.length; i++) {
      const key = KEYS[i];
      if (map[key] !== undefined) continue;
      if (i >= 300 && i < 308) continue;
      const legacyIndex = i - salvageOffset(i);
      map[key] = strings[legacyIndex] ?? EN[key];
    }
  }

  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i];
    if (overrides.all?.[key]?.[lang]) {
      map[key] = overrides.all[key][lang];
      continue;
    }
    if (overrides.byLang?.[lang]?.[key]) {
      map[key] = overrides.byLang[lang][key];
    }
  }

  for (let i = 300; i < 308; i++) {
    const key = KEYS[i];
    if (!map[key]) {
      throw new Error(`${lang}: missing override for new key ${key}`);
    }
  }

  return map;
}

function emitLocale(code, map) {
  const lines = KEYS.map((key) => {
    const value = keepEn(key) ? EN[key] : (map[key] ?? EN[key]);
    return `  ${key}: ${JSON.stringify(value)},`;
  });

  const body = `import { complete } from "../complete";

export const ${code} = complete({
${lines.join("\n")}
});
`;

  writeFileSync(`src/lib/dashboard-i18n/locales/${code}.ts`, body, "utf8");
}

mkdirSync("src/lib/dashboard-i18n/locales", { recursive: true });

for (const lang of LANGS) {
  const map = buildMap(lang);
  const missing = KEYS.filter((k) => !keepEn(k) && map[k] === undefined);
  if (missing.length) {
    throw new Error(`${lang} missing ${missing.length} keys`);
  }
  emitLocale(lang, map);
  console.log("wrote", lang);
}

console.log("done", LANGS.length, "locales");
