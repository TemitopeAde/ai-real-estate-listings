import React, { useState } from "react";
import { youTubeEmbedUrl, youTubeThumbnail } from "../../../../lib/listing-attachments";
import type { ListingVideo } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-videos.module.css";

interface Props {
  videos: ListingVideo[];
  lang: WidgetLangCode;
  /** Editor/design mode: show posters only, never start playback. */
  disabled?: boolean;
}

function videoKey(video: ListingVideo): string {
  return video.source === "youtube" ? `yt:${video.videoId}` : video.url;
}

function PlayIcon() {
  return (
    <span className={styles.playIcon} aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    </span>
  );
}

function Player({ video, title, lang, disabled }: { video: ListingVideo; title: string; lang: WidgetLangCode; disabled: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  if (video.source === "youtube") {
    // The iframe is only created on click, so YouTube never loads for visitors who don't play.
    if (playing && !disabled) {
      return (
        <iframe
          src={`${youTubeEmbedUrl(video.videoId)}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      );
    }
    return (
      <>
        <img className={styles.poster} src={youTubeThumbnail(video.videoId)} alt="" loading="lazy" />
        <button type="button" className={styles.play} disabled={disabled} aria-label={t(lang, "playVideo", { title })} onClick={() => setPlaying(true)}>
          <PlayIcon />
        </button>
      </>
    );
  }

  if (failed) return <p className={styles.error} role="alert">{t(lang, "videoUnavailable")}</p>;
  if (disabled) {
    return (
      <>
        <video className={styles.poster} src={video.url} poster={video.poster} preload="metadata" muted aria-hidden="true" />
        <span className={styles.play}><PlayIcon /></span>
      </>
    );
  }
  return (
    <video
      src={video.url}
      poster={video.poster}
      title={title}
      aria-label={title}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  );
}

export function PropertyVideos({ videos, lang, disabled = false }: Props) {
  const [index, setIndex] = useState(0);
  const current = videos[Math.min(index, videos.length - 1)];
  if (!current) return null;
  const titleOf = (video: ListingVideo, position: number) => video.title || t(lang, "videoLabel", { number: position + 1 });
  const currentTitle = titleOf(current, index);

  return (
    <div className={styles.videos}>
      <div className={styles.player}>
        {/* Keyed so switching videos stops the previous one and resets its state. */}
        <Player key={videoKey(current)} video={current} title={currentTitle} lang={lang} disabled={disabled} />
      </div>
      <p className={styles.caption} aria-live="polite">
        <strong>{currentTitle}</strong>
        {videos.length > 1 ? <span>{t(lang, "videoCount", { current: index + 1, total: videos.length })}</span> : null}
      </p>
      {videos.length > 1 ? (
        <ul className={styles.strip}>
          {videos.map((video, position) => (
            <li key={videoKey(video)}>
              <button
                type="button"
                className={styles.thumbButton}
                aria-current={position === index ? "true" : undefined}
                aria-label={titleOf(video, position)}
                disabled={disabled}
                onClick={() => setIndex(position)}
              >
                {video.source === "youtube" ? (
                  <img src={youTubeThumbnail(video.videoId)} alt="" loading="lazy" />
                ) : (
                  <video src={video.url} poster={video.poster} preload="metadata" muted aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
