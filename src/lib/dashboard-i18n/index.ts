import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { i18n } from "@wix/essentials";

import { EN, type DashboardMessageKey, type DashboardMessages } from "./messages-en";
import { DASHBOARD_CATALOGS } from "./catalogs";

export const DASHBOARD_LANG_CODES = [
  "en",
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
] as const;

export type DashboardLangCode = (typeof DASHBOARD_LANG_CODES)[number];
export type DashboardLanguageSetting = "auto" | DashboardLangCode;

export const DASHBOARD_LANGUAGE_OPTIONS: Array<{
  id: DashboardLanguageSetting;
  nameKey: DashboardMessageKey;
}> = [
  { id: "auto", nameKey: "languageAuto" },
  { id: "en", nameKey: "langEn" },
  { id: "zh", nameKey: "langZh" },
  { id: "hi", nameKey: "langHi" },
  { id: "es", nameKey: "langEs" },
  { id: "ar", nameKey: "langAr" },
  { id: "fr", nameKey: "langFr" },
  { id: "bn", nameKey: "langBn" },
  { id: "pt", nameKey: "langPt" },
  { id: "ru", nameKey: "langRu" },
  { id: "ur", nameKey: "langUr" },
  { id: "id", nameKey: "langId" },
  { id: "de", nameKey: "langDe" },
  { id: "ja", nameKey: "langJa" },
  { id: "sw", nameKey: "langSw" },
  { id: "tr", nameKey: "langTr" },
  { id: "ko", nameKey: "langKo" },
  { id: "vi", nameKey: "langVi" },
  { id: "it", nameKey: "langIt" },
  { id: "th", nameKey: "langTh" },
  { id: "pl", nameKey: "langPl" },
];

export function isDashboardLangCode(value: string): value is DashboardLangCode {
  return DASHBOARD_LANG_CODES.some((code) => code === value);
}

export function isDashboardLanguageSetting(
  value: string,
): value is DashboardLanguageSetting {
  return value === "auto" || isDashboardLangCode(value);
}

export function mapToDashboardLanguage(code: string): DashboardLangCode {
  const normalized = code.trim().toLowerCase().replace("_", "-");
  const base = normalized.split("-")[0] ?? "en";
  if (base === "zh") return "zh";
  if (isDashboardLangCode(base)) return base;
  return "en";
}

export function dashboardTextDirection(lang: DashboardLangCode): "ltr" | "rtl" {
  return lang === "ar" || lang === "ur" ? "rtl" : "ltr";
}

async function readString(loader: () => unknown): Promise<string> {
  try {
    const value = loader();
    const resolved =
      typeof value === "object" && value !== null && "then" in value
        ? await (value as Promise<unknown>)
        : value;
    return typeof resolved === "string" ? resolved.trim() : "";
  } catch {
    return "";
  }
}

export async function resolveDashboardLanguage(
  setting: DashboardLanguageSetting,
): Promise<DashboardLangCode> {
  if (isDashboardLangCode(setting)) return setting;
  const fromEssentials = await readString(() => i18n.getLanguage());
  if (fromEssentials) return mapToDashboardLanguage(fromEssentials);
  return "en";
}

export async function resolveDashboardLocale(
  lang: DashboardLangCode,
): Promise<string> {
  const locale = await readString(() => i18n.getLocale());
  if (locale) return locale;
  if (lang === "zh") return "zh-CN";
  if (lang === "pt") return "pt-BR";
  return lang;
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function translate(
  lang: DashboardLangCode,
  key: DashboardMessageKey,
  vars?: Record<string, string | number>,
): string {
  const catalog = DASHBOARD_CATALOGS[lang] ?? EN;
  return interpolate(catalog[key] ?? EN[key], vars);
}

type TranslateFn = (
  key: DashboardMessageKey,
  vars?: Record<string, string | number>,
) => string;

interface DashboardI18nValue {
  lang: DashboardLangCode;
  locale: string;
  dir: "ltr" | "rtl";
  t: TranslateFn;
}

const DashboardI18nContext = createContext<DashboardI18nValue>({
  lang: "en",
  locale: "en",
  dir: "ltr",
  t: (key, vars) => translate("en", key, vars),
});

export function DashboardI18nProvider({
  language,
  children,
}: {
  language: DashboardLanguageSetting;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<DashboardLangCode>(() =>
    isDashboardLangCode(language) ? language : "en",
  );
  const [locale, setLocale] = useState<string>(lang);

  useEffect(() => {
    let cancelled = false;
    void resolveDashboardLanguage(language).then((next) => {
      if (!cancelled) setLang(next);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    void resolveDashboardLocale(lang).then((next) => {
      if (!cancelled) setLocale(next);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const value = useMemo<DashboardI18nValue>(() => {
    const dir = dashboardTextDirection(lang);
    return {
      lang,
      locale,
      dir,
      t: (key, vars) => translate(lang, key, vars),
    };
  }, [lang, locale]);

  return createElement(
    DashboardI18nContext.Provider,
    { value },
    createElement(
      "div",
      { lang, dir: value.dir, className: "contents" },
      children,
    ),
  );
}

export function useDashboardI18n(): DashboardI18nValue {
  return useContext(DashboardI18nContext);
}

export function useDt(): TranslateFn {
  return useDashboardI18n().t;
}

export type { DashboardMessageKey, DashboardMessages };
export { EN };
