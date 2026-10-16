// Description images are framed at 16:10 on the detail page; request a matching copy from
// Wix instead of the full-size original. Stored descriptions are never modified.
const DESCRIPTION_IMAGE_WIDTH = 1280;
const DESCRIPTION_IMAGE_HEIGHT = 800;

function resizedWixImageUrl(src: string): string {
  let url: URL;
  try { url = new URL(src); } catch { return src; }
  if (url.protocol !== "https:" || url.hostname !== "static.wixstatic.com" || !url.pathname.startsWith("/media/")) return src;
  // Already transformed, or animated GIFs whose animation a resize would drop.
  if (url.pathname.includes("/v1/") || /\.gif$/i.test(url.pathname)) return src;
  return `${url.origin}${url.pathname}/v1/fill/w_${DESCRIPTION_IMAGE_WIDTH},h_${DESCRIPTION_IMAGE_HEIGHT}/file.webp`;
}

export function optimizeDescriptionImages(html: string): string {
  if (!html || !/<img\b/i.test(html)) return html;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let next = tag.replace(/(\ssrc\s*=\s*)(["'])(.*?)\2/i, (_match, prefix: string, quote: string, src: string) =>
      `${prefix}${quote}${resizedWixImageUrl(src.replace(/&amp;/g, "&")).replace(/&/g, "&amp;")}${quote}`);
    const end = next.endsWith("/>") ? "/>" : ">";
    const body = next.slice(0, -end.length);
    const extra = `${/\sloading\s*=/i.test(body) ? "" : ' loading="lazy"'}${/\sdecoding\s*=/i.test(body) ? "" : ' decoding="async"'}`;
    next = `${body.replace(/\s+$/, "")}${extra}${end === "/>" ? " />" : ">"}`;
    return next;
  });
}
