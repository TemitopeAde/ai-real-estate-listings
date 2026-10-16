import { useState } from "react";
import { dashboard } from "@wix/dashboard";
import { ArrowDown, ArrowUp, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDt } from "@/lib/dashboard-i18n";
import { isAttachmentUrl, moveAttachment } from "@/lib/listing-attachments";
import type { ListingDocument, ListingImage } from "@/lib/listing-types";

interface Props {
  floorPlans: ListingImage[];
  brochures: ListingDocument[];
  onFloorPlansChange: (images: ListingImage[]) => void;
  onBrochuresChange: (documents: ListingDocument[]) => void;
}

export function ListingAttachmentsEditor({ floorPlans, brochures, onFloorPlansChange, onBrochuresChange }: Props) {
  const t = useDt();
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");

  async function choose(kind: "image" | "pdf") {
    setError(""); setSelecting(true);
    try {
      const response = await dashboard.openMediaManager({ category: kind === "image" ? "IMAGE" : "DOCUMENT", multiSelect: true });
      if (!response) return;
      let invalid = false;
      const images = [...floorPlans], documents = [...brochures];
      for (const item of response.items) {
        const url = item.url?.trim() ?? "";
        const filename = url.split("/").pop()?.split("?")[0] ?? "";
        const title = item.displayName?.trim() || filename;
        if (!isAttachmentUrl(url, kind) || (kind === "pdf" && !item._id)) { invalid = true; continue; }
        if (kind === "image") {
          if (!images.some((image) => image.url === url || (item._id && image.id === item._id))) images.push({ url, id: item._id, title });
        } else if (item._id && !documents.some((document) => document.id === item._id || document.url === url)) {
          documents.push({ id: item._id, url, filename: /\.pdf$/i.test(title) ? title : filename, title });
        }
      }
      if (kind === "image") onFloorPlansChange(images); else onBrochuresChange(documents);
      if (invalid) setError(t(kind === "image" ? "floorPlanInvalid" : "brochureInvalid"));
    } catch (cause) {
      console.error("Unable to select listing attachments.", cause);
      setError(t("mediaManagerFailed"));
    } finally { setSelecting(false); }
  }

  return <>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {(["image", "pdf"] as const).map((kind) => {
      const isImage = kind === "image";
      const items = isImage ? floorPlans : brochures;
      const change = (next: typeof items) => {
        if (isImage) onFloorPlansChange(next); else onBrochuresChange(next as ListingDocument[]);
      };
      return <Card key={kind} className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader><CardTitle>{t(isImage ? "floorPlans" : "brochures")}</CardTitle><CardDescription>{t(isImage ? "floorPlansHint" : "brochuresHint")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" size="sm" disabled={selecting} onClick={() => void choose(kind)}><Plus className="size-4" aria-hidden="true" />{t(isImage ? "addFloorPlans" : "addBrochures")}</Button>
          {!items.length ? <p className="text-sm text-muted-foreground">{t("noAttachments")}</p> : <ul className="space-y-3">
            {items.map((item, index) => <li key={item.id || item.url} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
              {isImage ? <img src={item.url} alt={item.title || t("floorPlans")} className="h-24 w-32 rounded bg-muted/20 object-contain" /> : <FileText className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />}
              <div className="min-w-0 flex-1 space-y-1">
                <label className="block text-xs font-medium">{t("attachmentLabel")}
                  <Input value={item.title ?? ""} onChange={(event) => change(items.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))} />
                </label>
                {"filename" in item ? <p className="break-all text-xs text-muted-foreground">{String(item.filename)}</p> : null}
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="icon" disabled={index === 0} aria-label={t("moveAttachmentUp", { name: item.title || String(index + 1) })} onClick={() => change(moveAttachment(items, index, -1))}><ArrowUp className="size-4" aria-hidden="true" /></Button>
                <Button type="button" variant="outline" size="icon" disabled={index === items.length - 1} aria-label={t("moveAttachmentDown", { name: item.title || String(index + 1) })} onClick={() => change(moveAttachment(items, index, 1))}><ArrowDown className="size-4" aria-hidden="true" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label={t("removeAttachment", { name: item.title || String(index + 1) })} onClick={() => change(items.filter((_, i) => i !== index))}><Trash2 className="size-4" aria-hidden="true" /></Button>
              </div>
            </li>)}
          </ul>}
        </CardContent>
      </Card>;
    })}
  </>;
}
