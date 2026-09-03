import React, { useEffect, useState, type FC } from "react";
import { httpClient } from "@wix/essentials";
import { Bot, Send, Sparkles } from "lucide-react";
import type { Listing } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

const apiOrigin = new URL(import.meta.url).origin;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PropertyAssistantProps {
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

export const PropertyAssistant: FC<PropertyAssistantProps> = ({ listing, lang }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestions = [t(lang, "suggestFamily"), t(lang, "suggestAdvantages"), t(lang, "suggestAmenities")];

  useEffect(() => {
    setMessages([]);
    setQuestion("");
    setError(null);
  }, [listing._id]);

  const submit = async (value = question) => {
    const nextQuestion = value.trim();
    if (!nextQuestion || loading) return;
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

  return <section className={styles.assistant} aria-labelledby="property-assistant-title">
    <div className={styles.assistantHeader}>
      <div className={styles.assistantIcon}><Bot aria-hidden="true" /></div>
      <div><h2 id="property-assistant-title">{t(lang, "assistantTitle")}</h2><p>{t(lang, "assistantIntro")}</p></div>
    </div>
    {messages.length === 0 ? <div className={styles.suggestions}><span><Sparkles aria-hidden="true" /> {t(lang, "tryAsking")}</span><div>{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void submit(suggestion)} disabled={loading}>{suggestion}</button>)}</div></div> : <div className={styles.assistantMessages} aria-live="polite">{messages.map((message, index) => <div className={`${styles.assistantMessage} ${message.role === "user" ? styles.assistantUser : styles.assistantReply}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? t(lang, "you") : t(lang, "assistant")}</span><p>{message.content}</p></div>)}{loading ? <div className={`${styles.assistantMessage} ${styles.assistantReply}`}><span>{t(lang, "assistant")}</span><p>{t(lang, "checkingListing")}</p></div> : null}</div>}
    {error ? <p className={styles.assistantError} role="alert">{error}</p> : null}
    <form className={styles.assistantForm} onSubmit={(event) => { event.preventDefault(); void submit(); }}><label className={styles.visuallyHidden} htmlFor="property-assistant-question">{t(lang, "askQuestion")}</label><input id="property-assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t(lang, "askPlaceholder")} maxLength={500} disabled={loading} /><button type="submit" disabled={loading || !question.trim()} aria-label={t(lang, "askAssistant")}><Send aria-hidden="true" /> <span>{t(lang, "ask")}</span></button></form>
  </section>;
};
