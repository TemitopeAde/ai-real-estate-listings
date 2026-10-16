import { useState } from "react";
import { dashboard } from "@wix/dashboard";
import { ArrowDown, ArrowUp, Film, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDt } from "@/lib/dashboard-i18n";
import {
  MAX_LISTING_VIDEOS,
  isWixVideoUrl,
  moveAttachment,
  parseYouTubeId,
  youTubeThumbnail,
} from "@/lib/listing-attachments";
import type { ListingVideo } from "@/lib/listing-types";

interface Props {
  videos: ListingVideo[];
  onChange: (videos: ListingVideo[]) => void;
}

function videoKey(video: ListingVideo): string {
  return video.source === "youtube" ? `yt:${video.videoId}` : video.url;
}

function VideoThumb({ video }: { video: ListingVideo }) {
  if (video.source === "youtube") {
    return <img src={youTubeThumbnail(video.videoId)} alt="" className="h-20 w-36 shrink-0 rounded bg-muted object-cover" />;
  }
  return (
    <video
      src={video.url}
      poster={video.poster}
      muted
      preload="metadata"
      className="h-20 w-36 shrink-0 rounded bg-muted object-cover"
      aria-hidden="true"
    />
  );
}

export function ListingVideosEditor({ videos, onChange }: Props) {
  const t = useDt();
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState(false);
  const full = videos.length >= MAX_LISTING_VIDEOS;

  function addYouTube() {
    setError("");
    const videoId = parseYouTubeId(link);
    if (!videoId) {
      setLinkError(t("youTubeInvalid"));
      return;
    }
    setLinkError("");
    setLink("");
    if (videos.some((video) => video.source === "youtube" && video.videoId === videoId)) return;
    onChange([...videos, { source: "youtube", videoId, url: `https://youtu.be/${videoId}` }]);
  }

  async function chooseWixVideos() {
    setError("");
    setSelecting(true);
    try {
      const response = await dashboard.openMediaManager({ category: "VIDEO", multiSelect: true });
      if (!response) return;
      let invalid = false;
      const next = [...videos];
      for (const item of response.items) {
        const url = item.url?.trim() ?? "";
        if (!isWixVideoUrl(url)) { invalid = true; continue; }
        if (next.some((video) => video.source === "wix" && (video.url === url || (item._id && video.id === item._id)))) continue;
        if (next.length >= MAX_LISTING_VIDEOS) break;
        next.push({
          source: "wix",
          url,
          ...(item._id ? { id: item._id } : {}),
          ...(item.displayName?.trim() ? { title: item.displayName.trim().slice(0, 120) } : {}),
        });
      }
      onChange(next);
      if (invalid) setError(t("wixVideoInvalid"));
    } catch (cause) {
      console.error("Unable to select listing videos.", cause);
      setError(t("mediaManagerFailed"));
    } finally {
      setSelecting(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{t("videos")}</CardTitle>
        <CardDescription>{t("videosHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="listing-youtube-link">{t("addYouTubeVideo")}</label>
            <Input
              id="listing-youtube-link"
              value={link}
              placeholder={t("youTubeUrlPlaceholder")}
              aria-invalid={linkError ? true : undefined}
              aria-describedby={linkError ? "listing-youtube-link-error" : undefined}
              disabled={full}
              onChange={(event) => { setLink(event.target.value); setLinkError(""); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") { event.preventDefault(); addYouTube(); }
              }}
            />
            {linkError ? <p id="listing-youtube-link-error" className="mt-1 text-xs text-destructive">{linkError}</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8" disabled={full || !link.trim()} onClick={addYouTube}>
            <Plus className="size-4" aria-hidden="true" />{t("addYouTubeVideo")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8" disabled={full || selecting} onClick={() => void chooseWixVideos()}>
            <Film className="size-4" aria-hidden="true" />{t("chooseWixVideos")}
          </Button>
        </div>
        {!videos.length ? <p className="text-sm text-muted-foreground">{t("noVideos")}</p> : (
          <ul className="space-y-3">
            {videos.map((video, index) => {
              const name = video.title || String(index + 1);
              return (
                <li key={videoKey(video)} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                  <VideoThumb video={video} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Badge variant={video.source === "youtube" ? "destructive" : "secondary"}>
                      {t(video.source === "youtube" ? "videoSourceYouTube" : "videoSourceWix")}
                    </Badge>
                    <label className="block text-xs font-medium">{t("attachmentLabel")}
                      <Input
                        value={video.title ?? ""}
                        maxLength={120}
                        onChange={(event) => onChange(videos.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))}
                      />
                    </label>
                    <p className="break-all text-xs text-muted-foreground">{video.url}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="icon" disabled={index === 0} aria-label={t("moveAttachmentUp", { name })} onClick={() => onChange(moveAttachment(videos, index, -1))}><ArrowUp className="size-4" aria-hidden="true" /></Button>
                    <Button type="button" variant="outline" size="icon" disabled={index === videos.length - 1} aria-label={t("moveAttachmentDown", { name })} onClick={() => onChange(moveAttachment(videos, index, 1))}><ArrowDown className="size-4" aria-hidden="true" /></Button>
                    <Button type="button" variant="outline" size="icon" aria-label={t("removeAttachment", { name })} onClick={() => onChange(videos.filter((_, i) => i !== index))}><Trash2 className="size-4" aria-hidden="true" /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
