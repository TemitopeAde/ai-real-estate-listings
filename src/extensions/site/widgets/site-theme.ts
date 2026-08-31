import { useEffect, type RefObject } from "react";
import { site as siteSite } from "@wix/site-site";

const THEME_STYLE_ATTRIBUTE = "data-ai-real-estate-site-theme";

export function useSiteThemeStyles(
  rootRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const element = rootRef.current;
    const root = element?.getRootNode();
    if (!root || root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const shadowRoot = root as ShadowRoot;
    if (shadowRoot.querySelector(`[${THEME_STYLE_ATTRIBUTE}]`)) return;

    let mounted = true;
    let themeNodes: Node[] = [];

    void siteSite
      .getSiteThemeHtml()
      .then((themeHtml) => {
       
        if (!mounted || !themeHtml.trim()) return;

        const template = document.createElement("template");
        template.innerHTML = themeHtml;
        themeNodes = Array.from(template.content.childNodes);

        for (const node of themeNodes) {
          if (node instanceof HTMLElement)
            node.setAttribute(THEME_STYLE_ATTRIBUTE, "");
          shadowRoot.appendChild(node);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load the Wix site theme for the widget.", error);
      });

    return () => {
      mounted = false;
      for (const node of themeNodes) node.parentNode?.removeChild(node);
    };
  }, [rootRef]);
}
