import React, { useEffect, useId, useState, type FC } from "react";
import { httpClient } from "@wix/essentials";
import { Bot, ChevronDown, Send, Sparkles } from "lucide-react";
import type { Listing } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

const apiOrigin = new URL(import.meta.url).origin;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PropertyAssistantProps {
  disabled?: boolean;
  listing: Listing;
  lang: WidgetLangCode;
}

async function askAssistant(listingId: string, question: string, history: Message[]): Promise<string> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/property-assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ listingId, question, history: history.slice(-8) }),
  });
  const result = await response.json().catch(() => null) as { answer?: unknown; message?: unknown } | null;
  if (!response.ok) throw new Error(typeof result?.message === "string" ? result.message : "The assistant could not respond.");
  if (typeof result?.answer !== "string" || !result.answer.trim()) throw new Error("The assistant returned an empty response.");
  return result.answer.trim();
}

export const PropertyAssistant: FC<PropertyAssistantProps> = ({ listing, lang, disabled = false }) => {
  const id = useId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Accordion: collapsed until the visitor opens it.
  const [open, setOpen] = useState(false);
  const suggestions = [t(lang, "suggestFamily"), t(lang, "suggestAdvantages"), t(lang, "suggestAmenities")];

  useEffect(() => {
    setMessages([]);
    setQuestion("");
    setError(null);
  }, [listing._id]);

  const submit = async (value = question) => {
    const nextQuestion = value.trim();
    if (disabled || !nextQuestion || loading) return;
    const userMessage: Message = { role: "user", content: nextQuestion };
    const history = messages;
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError(null);
    setLoading(true);
    try {
      const answer = await askAssistant(listing._id, nextQuestion, history);
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch {
      setError(t(lang, "assistantUnavailable"));
    } finally {
      setLoading(false);
    }
  };

  return <section className={styles.assistant} aria-labelledby={`${id}-title`}>
    <h2 className={styles.assistantHeading}>
      <button id={`${id}-title`} type="button" className={styles.assistantToggle} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((value) => !value)}>
        <span className={styles.assistantIcon}><Bot aria-hidden="true" /></span>
        <span className={styles.assistantHeaderText}><span className={styles.assistantTitle}>{t(lang, "assistantTitle")}</span><span className={styles.assistantSubtitle}>{t(lang, "assistantIntro")}</span></span>
        <ChevronDown className={styles.assistantChevron} aria-hidden="true" />
      </button>
    </h2>
    <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-title`} hidden={!open}>
    {messages.length === 0 ? <div className={styles.suggestions}><span><Sparkles aria-hidden="true" /> {t(lang, "tryAsking")}</span><div>{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void submit(suggestion)} disabled={disabled || loading}>{suggestion}</button>)}</div></div> : <div className={styles.assistantMessages} aria-live="polite">{messages.map((message, index) => <div className={`${styles.assistantMessage} ${message.role === "user" ? styles.assistantUser : styles.assistantReply}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? t(lang, "you") : t(lang, "assistant")}</span><p>{message.content}</p></div>)}{loading ? <div className={`${styles.assistantMessage} ${styles.assistantReply}`}><span>{t(lang, "assistant")}</span><p>{t(lang, "checkingListing")}</p></div> : null}</div>}
    {error ? <p className={styles.assistantError} role="alert">{error}</p> : null}
    <form className={styles.assistantForm} onSubmit={(event) => { event.preventDefault(); void submit(); }}><label className={styles.visuallyHidden} htmlFor={`${id}-question`}>{t(lang, "askQuestion")}</label><input id={`${id}-question`} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t(lang, "askPlaceholder")} maxLength={500} disabled={disabled || loading} /><button type="submit" disabled={disabled || loading || !question.trim()} aria-label={t(lang, "askAssistant")}><Send aria-hidden="true" /> <span>{t(lang, "ask")}</span></button></form>
    </div>
  </section>;
};
