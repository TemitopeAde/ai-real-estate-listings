import React, { useState, type FC, type ReactNode } from "react";

import type { Listing } from "../../../../lib/listing-types";
import { formatListingPrice } from "../../../../lib/site-widget";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

type SharePlatform = "facebook" | "instagram" | "whatsapp" | "x" | "linkedin";

interface ShareChannel {
  id: SharePlatform;
  label: string;
  copyFirst?: boolean;
  icon: ReactNode;
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14.5 8.25H17V4.5h-2.5C11.57 4.5 9.5 6.57 9.5 9.25v2.25H6.75v3.75H9.5V22h3.75v-6.75h2.55l.7-3.75h-3.25V9.25c0-.55.45-1 1-1Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8A4.5 4.5 0 0 1 16 20.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5Zm0 1.75A2.75 2.75 0 0 0 5.25 8v8A2.75 2.75 0 0 0 8 18.75h8A2.75 2.75 0 0 0 18.75 16V8A2.75 2.75 0 0 0 16 5.25H8Zm8.38 1.37a1.13 1.13 0 1 1 0 2.25 1.13 1.13 0 0 1 0-2.25ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.75 3.75 0 0 1 12 8.25Zm0 1.75A2 2 0 1 0 14 12a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12.04 3.5A8.45 8.45 0 0 0 3.6 11.9c0 1.48.39 2.93 1.13 4.2L3.5 20.5l4.52-1.18a8.5 8.5 0 0 0 4.02 1.02h.01A8.45 8.45 0 0 0 20.5 11.9 8.45 8.45 0 0 0 12.04 3.5Zm0 15.45h-.01a7.02 7.02 0 0 1-3.57-.98l-.26-.15-2.68.7.72-2.61-.17-.27a6.97 6.97 0 0 1-1.07-3.74 7.02 7.02 0 0 1 7.05-7.02 7.02 7.02 0 0 1 7.02 7.05 7.02 7.02 0 0 1-7.03 7.02Zm3.85-5.26c-.21-.1-1.25-.62-1.44-.69-.19-.07-.33-.1-.47.1-.14.21-.54.69-.66.83-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.23-1.16-1.44-.12-.21-.01-.32.09-.43.09-.09.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.36-.05-.1-.47-1.13-.64-1.55-.17-.41-.34-.35-.47-.36h-.4c-.14 0-.36.05-.55.26-.19.21-.72.7-.72 1.71s.74 1.98.84 2.12c.1.14 1.45 2.21 3.52 3.1.49.21.88.34 1.18.43.5.16.95.14 1.31.08.4-.06 1.25-.51 1.42-1 .18-.49.18-.91.12-1-.05-.08-.19-.14-.4-.24Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.6 3.5h2.7l-5.9 6.74 6.95 10.26h-5.45l-4.26-5.57-4.88 5.57H4.04l6.31-7.21L3.7 3.5h5.59l3.85 5.1L17.6 3.5Zm-.95 15.5h1.5L7.42 5.02H5.81L16.65 19Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.54 8.95H3.7V20.5h2.84V8.95ZM5.12 3.5A1.66 1.66 0 1 0 5.12 6.8 1.66 1.66 0 0 0 5.12 3.5ZM20.5 20.5h-2.83v-5.62c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20.5H10.8V8.95h2.72v1.58h.04c.38-.72 1.3-1.48 2.68-1.48 2.87 0 3.4 1.89 3.4 4.34V20.5Z" />
    </svg>
  );
}

const channels: ShareChannel[] = [
  { id: "facebook", label: "Facebook", icon: <FacebookIcon /> },
  { id: "instagram", label: "Instagram", copyFirst: true, icon: <InstagramIcon /> },
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon /> },
  { id: "x", label: "X", icon: <XIcon /> },
  { id: "linkedin", label: "LinkedIn", icon: <LinkedInIcon /> },
];

const shareButtonClass: Record<SharePlatform, string> = {
  facebook: styles.shareFacebook,
  instagram: styles.shareInstagram,
  whatsapp: styles.shareWhatsapp,
  x: styles.shareX,
  linkedin: styles.shareLinkedin,
};

function shareText(listing: Listing, pageUrl: string, locale: string): string {
  return `${listing.title} · ${formatListingPrice(listing, locale)}\n${pageUrl}`;
}

function shareUrl(platform: SharePlatform, text: string, pageUrl: string): string | null {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(pageUrl);
  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "instagram":
      return "https://www.instagram.com/";
    default: {
      const exhaustive: never = platform;
      return exhaustive;
    }
  }
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export const PropertySocialShare: FC<{ listing: Listing; lang: WidgetLangCode; locale: string }> = ({ listing, lang, locale }) => {
  const [copied, setCopied] = useState(false);

  const share = async (channel: ShareChannel) => {
    const pageUrl = window.location.href;
    const text = shareText(listing, pageUrl, locale);
    const url = shareUrl(channel.id, text, pageUrl);
    try {
      if (channel.copyFirst) {
        await copyText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
      }
    } catch (error) {
      console.error(`Unable to share this property to ${channel.label}.`, error);
    }
  };

  return (
    <div className={styles.share}>
      <p className={styles.shareLabel}>{copied ? t(lang, "linkCopiedInstagram") : t(lang, "shareProperty")}</p>
      <ul className={styles.shareList}>
        {channels.map((channel) => (
          <li key={channel.id}>
            <button
              type="button"
              className={`${styles.shareButton} ${shareButtonClass[channel.id]}`}
              onClick={() => void share(channel)}
              aria-label={t(lang, "shareOn", { label: channel.label })}
            >
              {channel.icon}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
