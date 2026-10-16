import type { Listing, ListingDocument } from "../listing-types";

interface Dependencies {
  getListing: (id: string) => Promise<Listing | null>;
  generateDownload: (document: ListingDocument) => Promise<string>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export function createBrochureDownloadHandler({ getListing, generateDownload }: Dependencies) {
  return async (request: Request): Promise<Response> => {
    let body: unknown;
    try { body = await request.json(); } catch { return json({ message: "Request body must be valid JSON." }, 400); }
    if (!body || typeof body !== "object" || !("listingId" in body) || !("fileId" in body) ||
        typeof body.listingId !== "string" || !body.listingId.trim() || body.listingId.length > 1000 ||
        typeof body.fileId !== "string" || !body.fileId.trim() || body.fileId.length > 1000) {
      return json({ message: "Listing ID and file ID are required." }, 400);
    }
    const listingId = body.listingId.trim(), fileId = body.fileId.trim();
    try {
      const listing = await getListing(listingId);
      const document = listing?.brochures?.find((entry) => entry.id === fileId);
      if (!document) return json({ message: "Brochure not found." }, 404);
      const url = await generateDownload(document);
      if (new URL(url).protocol !== "https:") throw new Error("Invalid download URL.");
      return json({ url });
    } catch (error) {
      console.error("Unable to generate a brochure download.", error);
      return json({ message: "The brochure is temporarily unavailable. Please retry." }, 503);
    }
  };
}
