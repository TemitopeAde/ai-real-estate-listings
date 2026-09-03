import { useEffect, type CSSProperties } from 'react';
import { fontFamilyFromShorthand, fontSizeFromShorthand } from '../../../lib/site-widget';

export function useWidgetFonts(titleFont: string, bodyFont: string): CSSProperties {
  const titleFamily = fontFamilyFromShorthand(titleFont) || 'Helvetica';
  const bodyFamily = fontFamilyFromShorthand(bodyFont) || 'Helvetica';
  const bodySize = fontSizeFromShorthand(bodyFont) || '14px';
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    for (const [family, shorthand] of [[titleFamily, titleFont], [bodyFamily, bodyFont]] as const) {
      const loadValue = /\b\d+(?:\.\d+)?(?:px|pt|pc|em|rem|%)/i.test(shorthand) ? shorthand : `1em ${family}`;
      void document.fonts.load(loadValue).catch((error: unknown) => console.error(`Unable to load widget font ${family}.`, error));
    }
  }, [bodyFont, bodyFamily, titleFont, titleFamily]);
  return { '--title-font-family': titleFamily, '--body-font-family': bodyFamily, '--body-font-size': bodySize, fontFamily: bodyFamily, fontSize: bodySize } as CSSProperties;
}
