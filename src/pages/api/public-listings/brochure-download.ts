import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { files } from "@wix/media";
import { withSubscription } from "@/lib/server/subscription-route";
import { getPublicListing } from "@/lib/server/listings";
import { createBrochureDownloadHandler } from "@/lib/server/brochure-download";
import { isAttachmentUrl } from "@/lib/listing-attachments";

const download = createBrochureDownloadHandler({
  getListing: getPublicListing,
  generateDownload: async (document) => {
    const descriptor = await auth.elevate(files.getFileDescriptor)(document.id);
    if (descriptor.mediaType !== "DOCUMENT" || !isAttachmentUrl(descriptor.url ?? "", "pdf")) {
      throw new Error("The brochure is no longer an available PDF.");
    }
    const result = await auth.elevate(files.generateFileDownloadUrl)(document.id, {
      contentDisposition: files.ContentDisposition.ATTACHMENT,
      downloadFileName: `${document.filename.replace(/\.pdf$/i, "").replace(/[\\/\x00-\x1f]/g, "_").slice(0, 96)}.pdf`,
      expirationInMinutes: 10,
    });
    const url = result.downloadUrls?.[0]?.url;
    if (!url) throw new Error("Wix did not return a download URL.");
    return url;
  },
});

const handlePOST: APIRoute = ({ request }) => download(request);
export const POST = withSubscription(handlePOST, false);
