import React, { useEffect, useState, type FC } from "react";
import { httpClient } from "@wix/essentials";
import { Bot, Send, Sparkles } from "lucide-react";
import type { Listing } from "../../../../lib/listing-types";
import styles from "./property-detail-widget.module.css";

const apiOrigin = new URL(import.meta.url).origin;
const SUGGESTED_QUESTIONS = [
  "Does this property have enough space for a family of five?",
  "What are the main advantages of this property?",
  "What amenities does this property offer?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PropertyAssistantProps {
  listing: Listing;
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

export const PropertyAssistant: FC<PropertyAssistantProps> = ({ listing }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "The assistant is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <section className={styles.assistant} aria-labelledby="property-assistant-title">
    <div className={styles.assistantHeader}>
      <div className={styles.assistantIcon}><Bot aria-hidden="true" /></div>
      <div><h2 id="property-assistant-title">Ask about this property</h2><p>Get answers based only on the information in this listing.</p></div>
    </div>
    {messages.length === 0 ? <div className={styles.suggestions}><span><Sparkles aria-hidden="true" /> Try asking</span><div>{SUGGESTED_QUESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => void submit(suggestion)} disabled={loading}>{suggestion}</button>)}</div></div> : <div className={styles.assistantMessages} aria-live="polite">{messages.map((message, index) => <div className={`${styles.assistantMessage} ${message.role === "user" ? styles.assistantUser : styles.assistantReply}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? "You" : "Assistant"}</span><p>{message.content}</p></div>)}{loading ? <div className={`${styles.assistantMessage} ${styles.assistantReply}`}><span>Assistant</span><p>Checking the listing details…</p></div> : null}</div>}
    {error ? <p className={styles.assistantError} role="alert">{error}</p> : null}
    <form className={styles.assistantForm} onSubmit={(event) => { event.preventDefault(); void submit(); }}><label className={styles.visuallyHidden} htmlFor="property-assistant-question">Ask a question</label><input id="property-assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this property" maxLength={500} disabled={loading} /><button type="submit" disabled={loading || !question.trim()} aria-label="Ask assistant"><Send aria-hidden="true" /> <span>Ask</span></button></form>
  </section>;
};
