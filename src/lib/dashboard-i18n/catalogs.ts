import { EN, type DashboardMessages } from "./messages-en";
import { ar } from "./locales/ar";
import { bn } from "./locales/bn";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { hi } from "./locales/hi";
import { id } from "./locales/id";
import { it } from "./locales/it";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { pl } from "./locales/pl";
import { pt } from "./locales/pt";
import { ru } from "./locales/ru";
import { sw } from "./locales/sw";
import { th } from "./locales/th";
import { tr } from "./locales/tr";
import { ur } from "./locales/ur";
import { vi } from "./locales/vi";
import { zh } from "./locales/zh";

type DashboardLangCode =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "ar"
  | "fr"
  | "bn"
  | "pt"
  | "ru"
  | "ur"
  | "id"
  | "de"
  | "ja"
  | "sw"
  | "tr"
  | "ko"
  | "vi"
  | "it"
  | "th"
  | "pl";

export const DASHBOARD_CATALOGS: Record<DashboardLangCode, DashboardMessages> = {
  en: EN,
  zh,
  hi,
  es,
  ar,
  fr,
  bn,
  pt,
  ru,
  ur,
  id,
  de,
  ja,
  sw,
  tr,
  ko,
  vi,
  it,
  th,
  pl,
};
