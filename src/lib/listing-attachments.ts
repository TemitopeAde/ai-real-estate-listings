import type { ListingDocument, ListingImage, ListingVideo } from "./listing-types";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isAttachmentUrl(value: string, kind: "image" | "pdf"): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    return kind === "pdf"
      ? /\.pdf$/i.test(url.pathname)
      : /\.(?:png|jpe?g|gif|webp|avif|svg)(?:$|\/)/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function parseFloorPlans(value: unknown, errors: string[]): ListingImage[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) { errors.push("Floor plans must be an array."); return undefined; }
  const seen = new Set<string>();
  return value.flatMap((item): ListingImage[] => {
    if (!record(item) || !isAttachmentUrl(text(item.url), "image")) {
      errors.push("Each floor plan must be a supported HTTPS image."); return [];
    }
    const url = text(item.url);
    if (seen.has(url)) return [];
    seen.add(url);
    return [{ url, ...(text(item.id) ? { id: text(item.id) } : {}), ...(text(item.title) ? { title: text(item.title) } : {}) }];
  });
}

export function parseBrochures(value: unknown, errors: string[]): ListingDocument[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) { errors.push("Brochures must be an array."); return undefined; }
  const seen = new Set<string>();
  const urls = new Set<string>();
  return value.flatMap((item): ListingDocument[] => {
    if (!record(item) || !text(item.id) || !isAttachmentUrl(text(item.url), "pdf") || !/\.pdf$/i.test(text(item.filename))) {
      errors.push("Each brochure must include a Wix file ID, HTTPS PDF URL and PDF filename."); return [];
    }
    const id = text(item.id), url = text(item.url);
    if (seen.has(id) || urls.has(url)) return [];
    seen.add(id); urls.add(url);
    return [{ id, url, filename: text(item.filename), ...(text(item.title) ? { title: text(item.title) } : {}) }];
  });
}

export const MAX_LISTING_VIDEOS = 20;
const MAX_VIDEO_TITLE = 120;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Extracts the video ID from any common YouTube link (or pasted iframe embed code). */
export function parseYouTubeId(input: string): string | null {
  let value = input.trim();
  const iframeSrc = /<iframe\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i.exec(value)?.[2];
  if (iframeSrc) value = iframeSrc;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined;
  if (host === "youtu.be" || host === "www.youtu.be") {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) id = segments[1];
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function isWixVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      /(^|\.)wixstatic\.com$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

/** Convert Wix's media identifier to the public playback URL used by HTML video. */
export function wixVideoPlaybackUrl(value: string): string | null {
  const input = value.trim();
  const match = /^wix:video:\/\/v1\/([A-Za-z0-9_~-]+)(?:\/[^?#]*)?(?:#[^\s]*)?$/.exec(input);
  if (match?.[1]) return `https://video.wixstatic.com/video/${match[1]}/file`;
  return isWixVideoUrl(input) ? input : null;
}

function wixVideoPoster(value: string): string | undefined {
  if (isWixVideoUrl(value)) return value;
  const match = /^wix:image:\/\/v1\/([A-Za-z0-9_.~-]+)(?:[\/#]|$)/.exec(value);
  return match?.[1] ? `https://static.wixstatic.com/media/${match[1]}` : undefined;
}

/** Supports both SDK media identifiers and raw Media Manager file descriptors. */
export function wixVideoFromMediaItem(item: unknown): Extract<ListingVideo, { source: "wix" }> | null {
  if (!record(item)) return null;
  const media = record(item.media) ? item.media : undefined;
  const video = media?.video;
  const resolutions = record(video) && Array.isArray(video.resolutions) ? video.resolutions : [];
  const playable = resolutions.find((entry) => record(entry) && /\.(mp4|webm)$/i.test(text(entry.format)) && wixVideoPlaybackUrl(text(entry.url)));
  const candidates = [
    record(playable) ? text(playable.url) : "",
    text(video),
    text(item.url),
  ];
  const url = candidates.map(wixVideoPlaybackUrl).find((candidate) => candidate !== null);
  if (!url) return null;
  const title = text(item.displayName).slice(0, MAX_VIDEO_TITLE);
  const poster = wixVideoPoster(text(item.thumbnailUrl));
  return {
    source: "wix", url,
    ...(text(item._id) ? { id: text(item._id) } : {}),
    ...(title ? { title } : {}),
    ...(poster ? { poster } : {}),
  };
}

export function parseVideos(value: unknown, errors: string[]): ListingVideo[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) { errors.push("Videos must be an array."); return undefined; }
  if (value.length > MAX_LISTING_VIDEOS) {
    errors.push(`A listing can have at most ${MAX_LISTING_VIDEOS} videos.`);
    return undefined;
  }
  const seen = new Set<string>();
  return value.flatMap((item): ListingVideo[] => {
    if (!record(item)) { errors.push("Each video must be a YouTube link or a Wix Media video."); return []; }
    const title = text(item.title);
    if (title.length > MAX_VIDEO_TITLE) {
      errors.push(`Video labels must be at most ${MAX_VIDEO_TITLE} characters.`); return [];
    }
    const label = title ? { title } : {};
    if (item.source === "youtube") {
      const videoId = text(item.videoId);
      if (!YOUTUBE_ID.test(videoId)) { errors.push("Each YouTube video needs a valid video ID."); return []; }
      if (seen.has(`yt:${videoId}`)) return [];
      seen.add(`yt:${videoId}`);
      return [{ source: "youtube", videoId, url: `https://youtu.be/${videoId}`, ...label }];
    }
    if (item.source === "wix") {
      const url = wixVideoPlaybackUrl(text(item.url));
      if (!url) { errors.push("Each Wix video must be a supported Wix Media URL."); return []; }
      if (seen.has(url)) return [];
      seen.add(url);
      const poster = wixVideoPoster(text(item.poster));
      return [{
        source: "wix",
        url,
        ...(text(item.id) ? { id: text(item.id) } : {}),
        ...label,
        ...(poster ? { poster } : {}),
      }];
    }
    errors.push("Each video must be a YouTube link or a Wix Media video."); return [];
  });
}

export function moveAttachment<T>(items: T[], index: number, offset: number): T[] {
  const next = [...items];
  const target = index + offset;
  if (index < 0 || index >= next.length || target < 0 || target >= next.length) return next;
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}
