import React, { useCallback, useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { inputs, widget } from "@wix/editor";
import { Box, Button, Divider, Dropdown, FillPreview, FormField, Input, listItemSelectBuilder, SidePanel, Slider, Text, ToggleSwitch, WixDesignSystemProvider } from "@wix/design-system";
import "@wix/design-system/styles.global.css";

import { DEFAULT_DETAIL_WIDGET_CONFIG, DEFAULT_LISTING_WIDGET_CONFIG, fontFamilyFromShorthand, normalizeListingWidgetConfig, parseWidgetJson, type DetailWidgetConfig, type ListingWidgetConfig, type WidgetFont, type WidgetSpacing } from "../../../lib/site-widget";

type PanelConfig = ListingWidgetConfig | DetailWidgetConfig;
type PanelKind = "listings" | "detail";
interface WidgetPanelProps { kind: PanelKind; }

function parseFont(value: unknown, fallback: WidgetFont): WidgetFont {
  if (typeof value === "object" && value !== null && "font" in value && typeof value.font === "string") return { font: value.font, textDecoration: "textDecoration" in value && typeof value.textDecoration === "string" ? value.textDecoration : undefined };
  return fallback;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SidePanel.Field>
      <FormField label={label} labelSize="small" labelPlacement="top">{children}</FormField>
    </SidePanel.Field>
  );
}
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><Input size="small" value={value} onChange={(event) => onChange(event.target.value)} /></Field>; }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <Field label={label}><Input size="small" type="number" value={String(value)} min={min} max={max} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, Math.round(next)))); }} /></Field>; }
function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <SidePanel.Field>
      <Box align="space-between" verticalAlign="middle" gap="SP2">
        <Text size="small">{label}</Text>
        <ToggleSwitch size="small" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      </Box>
    </SidePanel.Field>
  );
}
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ id: string; label: string }>; onChange: (value: string) => void }) { const dropdownOptions = options.map((option) => listItemSelectBuilder({ id: option.id, title: option.label, label: option.label })); return <Field label={label}><Dropdown size="small" selectedId={value} options={dropdownOptions} valueParser={(option) => option.label} onSelect={(option) => onChange(String(option.id))} /></Field>; }
function RangeField({ label, value, min, max, step, onChange, unit = "px" }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; unit?: string }) { return <Field label={`${label}: ${value}${unit}`}><Slider value={[value]} min={min} max={max} step={step} onChange={(next) => onChange(Array.isArray(next) ? next[0] ?? value : next)} /></Field>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <SidePanel.Field>
      <Box align="space-between" verticalAlign="middle" gap="SP2">
        <Text size="small">{label}</Text>
        <FillPreview size="small" aspectRatio={1} fill={value} onClick={() => { void inputs.selectColor(value, { onChange: (next) => { if (next) onChange(next); } }); }} />
      </Box>
    </SidePanel.Field>
  );
}
function FontField({ label, value, onChange }: { label: string; value: WidgetFont; onChange: (value: WidgetFont) => void }) {
  return (
    <Field label={label}>
      <Box direction="vertical" gap="SP1">
        <Button size="small" priority="secondary" fullWidth onClick={() => { void inputs.selectFont({ font: value.font, textDecoration: value.textDecoration ?? "" }, { onChange: (next) => { if (next?.font) onChange({ font: next.font, textDecoration: next.textDecoration ?? "" }); } }); }}>Choose font</Button>
        <Text size="tiny" secondary ellipsis>{value.font}</Text>
      </Box>
    </Field>
  );
}
function SpacingFields({ label, value, onChange }: { label: string; value: WidgetSpacing; onChange: (side: keyof WidgetSpacing, value: number) => void }) {
  return (
    <Box direction="vertical" gap="SP2">
      <Text size="small" weight="bold">{label}</Text>
      <Box direction="vertical" gap="SP2">
        <Box gap="SP2">
          <RangeField label="Top" value={value.top} min={0} max={160} step={1} onChange={(next) => onChange("top", next)} />
          <RangeField label="Right" value={value.right} min={0} max={160} step={1} onChange={(next) => onChange("right", next)} />
        </Box>
        <Box gap="SP2">
          <RangeField label="Bottom" value={value.bottom} min={0} max={160} step={1} onChange={(next) => onChange("bottom", next)} />
          <RangeField label="Left" value={value.left} min={0} max={160} step={1} onChange={(next) => onChange("left", next)} />
        </Box>
      </Box>
    </Box>
  );
}

function AccordionSection({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div style={{ width: "100%" }}>
      <div
        onClick={onToggle}
        style={{
          padding: "14px 18px",
          backgroundColor: "#f8f9fa",
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e0e0e0",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "#e9ecef"; }}
        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = "#f8f9fa"; }}
      >
        <Text size="small" weight="normal" style={{ color: "#162d3d" }}>{title}</Text>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#162d3d" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
          <path d="M8 12.5l4-4H4l4 4z" />
        </svg>
      </div>
      {isOpen ? <div style={{ padding: "18px", backgroundColor: "#fff" }}>{children}</div> : null}
      <Divider />
    </div>
  );
}

export const WidgetPanel: FC<WidgetPanelProps> = ({ kind }) => {
  const defaults = useMemo(() => kind === "listings" ? DEFAULT_LISTING_WIDGET_CONFIG : DEFAULT_DETAIL_WIDGET_CONFIG, [kind]);
  const [config, setConfig] = useState<PanelConfig>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  useEffect(() => { void widget.getProp("config").then((value) => { const parsed = parseWidgetJson(value, defaults); setConfig(kind === "listings" ? normalizeListingWidgetConfig(parsed as Partial<ListingWidgetConfig>) : parsed); setLoaded(true); }).catch((error: unknown) => { console.error("Unable to load widget settings.", error); setLoaded(true); }); }, [defaults, kind]);
  const update = useCallback((key: string, value: unknown) => { setConfig((current) => { const merged = { ...current, [key]: value } as PanelConfig; const next = kind === "listings" ? normalizeListingWidgetConfig(merged as Partial<ListingWidgetConfig>) : merged; void widget.setProp("config", JSON.stringify(next)).catch((error: unknown) => console.error("Unable to save widget setting.", error)); return next; }); }, [kind]);
  const updateSpacing = useCallback((key: "containerMargin" | "containerPadding", side: keyof WidgetSpacing, value: number) => { setConfig((current) => { const next = { ...current, [key]: { ...current[key], [side]: value } } as PanelConfig; void widget.setProp("config", JSON.stringify(next)).catch((error: unknown) => console.error("Unable to save widget spacing.", error)); return next; }); }, []);
  const updateFont = useCallback((key: "titleFont" | "bodyFont", font: WidgetFont) => { update(key, font); const otherFont = key === "titleFont" ? config.bodyFont.font : config.titleFont.font; const fonts = [fontFamilyFromShorthand(font.font), fontFamilyFromShorthand(otherFont)].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index); void widget.setPreloadFonts(fonts).catch((error: unknown) => console.error("Unable to preload widget font.", error)); }, [config.bodyFont.font, config.titleFont.font, update]);
  const toggleSection = useCallback((section: string) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }, []);

  const isListings = kind === "listings";
  const listingConfig = isListings ? config as ListingWidgetConfig : null;
  const detailConfig = isListings ? null : config as DetailWidgetConfig;
  const layoutOptions = [{ id: "grid", label: "Grid" }, { id: "carousel", label: "Carousel" }];
  const loadingModeOptions = [{ id: "load-more", label: "Load more button" }, { id: "infinite", label: "Infinite scroll" }, { id: "pagination", label: "Numbered pagination" }];
  const alignmentOptions = [{ id: "left", label: "Left" }, { id: "center", label: "Center" }, { id: "right", label: "Right" }];
  const ratioOptions = [{ id: "landscape", label: "Landscape" }, { id: "square", label: "Square" }, { id: "portrait", label: "Portrait" }];
  const shadowOptions = [{ id: "none", label: "None" }, { id: "soft", label: "Soft" }, { id: "strong", label: "Strong" }];

  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content noPadding stretchVertically>
          {loaded ? null : (
            <Box padding="SP4">
              <Text size="small">Loading settings…</Text>
            </Box>
          )}
          {loaded ? (
            <>
              <AccordionSection title="Content" isOpen={Boolean(openSections.content)} onToggle={() => toggleSection("content")}>
                {listingConfig ? (
                  <>
                    <TextField label="Heading" value={listingConfig.title} onChange={(value) => update("title", value)} />
                    <TextField label="Subheading" value={listingConfig.subtitle} onChange={(value) => update("subtitle", value)} />
                    <ToggleField label="Show header" checked={listingConfig.showHeader} onChange={(value) => update("showHeader", value)} />
                    <ToggleField label="Show location" checked={listingConfig.showLocation} onChange={(value) => update("showLocation", value)} />
                    <ToggleField label="Show price" checked={listingConfig.showPrice} onChange={(value) => update("showPrice", value)} />
                    <ToggleField label="Show status" checked={listingConfig.showStatus} onChange={(value) => update("showStatus", value)} />
                    <ToggleField label="Show metadata" checked={listingConfig.showMetadata} onChange={(value) => update("showMetadata", value)} />
                  </>
                ) : (
                  <>
                    <ToggleField label="Show location" checked={detailConfig?.showLocation ?? true} onChange={(value) => update("showLocation", value)} />
                    <ToggleField label="Show description" checked={detailConfig?.showDescription ?? true} onChange={(value) => update("showDescription", value)} />
                    <ToggleField label="Show amenities" checked={detailConfig?.showAmenities ?? true} onChange={(value) => update("showAmenities", value)} />
                    <ToggleField label="Show agent" checked={detailConfig?.showAgent ?? true} onChange={(value) => update("showAgent", value)} />
                    <ToggleField label="Show view count" checked={detailConfig?.showViewCount ?? true} onChange={(value) => update("showViewCount", value)} />
                    <ToggleField label="Show AI assistant" checked={detailConfig?.showAiAssistant ?? true} onChange={(value) => update("showAiAssistant", value)} />
                    <ToggleField label="Show social share" checked={detailConfig?.showSocialShare ?? true} onChange={(value) => update("showSocialShare", value)} />
                    <TextField label="Related listings heading" value={detailConfig?.featuredTitle ?? ""} onChange={(value) => update("featuredTitle", value)} />
                    <TextField label="Related listings subheading" value={detailConfig?.featuredSubtitle ?? ""} onChange={(value) => update("featuredSubtitle", value)} />
                    <ToggleField label="Show related listings" checked={detailConfig?.showFeaturedListings ?? true} onChange={(value) => update("showFeaturedListings", value)} />
                    <ToggleField label="Related location" checked={detailConfig?.featuredShowLocation ?? true} onChange={(value) => update("featuredShowLocation", value)} />
                    <ToggleField label="Related price" checked={detailConfig?.featuredShowPrice ?? true} onChange={(value) => update("featuredShowPrice", value)} />
                    <ToggleField label="Related status" checked={detailConfig?.featuredShowStatus ?? true} onChange={(value) => update("featuredShowStatus", value)} />
                    <ToggleField label="Related metadata" checked={detailConfig?.featuredShowMetadata ?? true} onChange={(value) => update("featuredShowMetadata", value)} />
                  </>
                )}
              </AccordionSection>

              {listingConfig ? (
                <AccordionSection title="Search and filters" isOpen={Boolean(openSections.search)} onToggle={() => toggleSection("search")}>
                  <ToggleField label="Show search" checked={listingConfig.showSearch} onChange={(value) => update("showSearch", value)} />
                  <ToggleField label="Show transaction filter" checked={listingConfig.showTransactionFilter} onChange={(value) => update("showTransactionFilter", value)} />
                  <ToggleField label="Show property type filter" checked={listingConfig.showPropertyTypeFilter} onChange={(value) => update("showPropertyTypeFilter", value)} />
                  <ToggleField label="Show price slider" checked={listingConfig.showPriceFilter} onChange={(value) => update("showPriceFilter", value)} />
                  <ToggleField label="Show bedroom filter" checked={listingConfig.showBedroomsFilter} onChange={(value) => update("showBedroomsFilter", value)} />
                  <ColorField label="Filter background" value={listingConfig.filterBackgroundColor} onChange={(value) => update("filterBackgroundColor", value)} />
                  <ColorField label="Filter border" value={listingConfig.filterBorderColor} onChange={(value) => update("filterBorderColor", value)} />
                  <ColorField label="Filter text" value={listingConfig.filterTextColor} onChange={(value) => update("filterTextColor", value)} />
                  <RangeField label="Filter radius" value={listingConfig.filterRadius} min={0} max={40} step={1} onChange={(value) => update("filterRadius", value)} />
                </AccordionSection>
              ) : null}

              <AccordionSection title="Layout and images" isOpen={Boolean(openSections.layout)} onToggle={() => toggleSection("layout")}>
                {listingConfig ? (
                  <>
                    <SelectField label="Property presentation" value={listingConfig.layout} options={layoutOptions} onChange={(value) => update("layout", value)} />
                    <RangeField label="Listings per row" value={listingConfig.columns} min={1} max={6} step={1} unit="" onChange={(value) => update("columns", value)} />
                    <RangeField label="Tablet listings per row" value={listingConfig.tabletColumns} min={1} max={Math.max(1, listingConfig.columns)} step={1} unit="" onChange={(value) => update("tabletColumns", value)} />
                    <RangeField label="Mobile listings per row" value={listingConfig.mobileColumns} min={1} max={Math.max(1, listingConfig.tabletColumns)} step={1} unit="" onChange={(value) => update("mobileColumns", value)} />
                    <TextField label="Detail page path" value={listingConfig.detailPagePath} onChange={(value) => update("detailPagePath", value)} />
                  </>
                ) : null}
                <SelectField label="Image ratio" value={config.imageRatio} options={ratioOptions} onChange={(value) => update("imageRatio", value)} />
                <ToggleField label="Show image arrows" checked={config.showImageControls} onChange={(value) => update("showImageControls", value)} />
                <ToggleField label="Show image dots" checked={config.showImageDots} onChange={(value) => update("showImageDots", value)} />
              </AccordionSection>

              {listingConfig ? (
                <AccordionSection title="Paging controls" isOpen={Boolean(openSections.paging)} onToggle={() => toggleSection("paging")}>
                  <SelectField label="Loading behavior" value={listingConfig.loadingMode} options={loadingModeOptions} onChange={(value) => update("loadingMode", value)} />
                  <NumberField label="Listings per page" value={listingConfig.pageSize} min={1} max={50} onChange={(value) => update("pageSize", value)} />
                  <TextField label="Load more label" value={listingConfig.loadMoreLabel} onChange={(value) => update("loadMoreLabel", value)} />
                  <TextField label="Previous label" value={listingConfig.previousLabel} onChange={(value) => update("previousLabel", value)} />
                  <TextField label="Next label" value={listingConfig.nextLabel} onChange={(value) => update("nextLabel", value)} />
                  <SelectField label="Control alignment" value={listingConfig.controlAlignment} options={alignmentOptions} onChange={(value) => update("controlAlignment", value)} />
                  <RangeField label="Control spacing" value={listingConfig.controlSpacing} min={0} max={48} step={1} onChange={(value) => update("controlSpacing", value)} />
                  <RangeField label="Control radius" value={listingConfig.controlBorderRadius} min={0} max={40} step={1} onChange={(value) => update("controlBorderRadius", value)} />
                  <ToggleField label="Show pagination icons" checked={listingConfig.showPaginationIcons} onChange={(value) => update("showPaginationIcons", value)} />
                  <ColorField label="Control background" value={listingConfig.controlBackgroundColor} onChange={(value) => update("controlBackgroundColor", value)} />
                  <ColorField label="Control text" value={listingConfig.controlTextColor} onChange={(value) => update("controlTextColor", value)} />
                  <ColorField label="Control border" value={listingConfig.controlBorderColor} onChange={(value) => update("controlBorderColor", value)} />
                </AccordionSection>
              ) : null}

              <AccordionSection title="Typography" isOpen={Boolean(openSections.typography)} onToggle={() => toggleSection("typography")}>
                <FontField label="Title font" value={parseFont(config.titleFont, defaults.titleFont)} onChange={(value) => updateFont("titleFont", value)} />
                <FontField label="Body font" value={parseFont(config.bodyFont, defaults.bodyFont)} onChange={(value) => updateFont("bodyFont", value)} />
              </AccordionSection>

              <AccordionSection title="Colors" isOpen={Boolean(openSections.colors)} onToggle={() => toggleSection("colors")}>
                <ColorField label="Background" value={config.backgroundColor} onChange={(value) => update("backgroundColor", value)} />
                <ColorField label="Card" value={config.cardColor} onChange={(value) => update("cardColor", value)} />
                <ColorField label="Text" value={config.textColor} onChange={(value) => update("textColor", value)} />
                <ColorField label="Muted text" value={config.mutedColor} onChange={(value) => update("mutedColor", value)} />
                <ColorField label="Accent" value={config.accentColor} onChange={(value) => update("accentColor", value)} />
                <ColorField label="Border" value={config.cardBorderColor} onChange={(value) => update("cardBorderColor", value)} />
              </AccordionSection>

              <AccordionSection title="Spacing and surfaces" isOpen={Boolean(openSections.spacing)} onToggle={() => toggleSection("spacing")}>
                <SpacingFields label="Parent margin" value={config.containerMargin} onChange={(side, value) => updateSpacing("containerMargin", side, value)} />
                <SpacingFields label="Parent padding" value={config.containerPadding} onChange={(side, value) => updateSpacing("containerPadding", side, value)} />
                <RangeField label="Card radius" value={config.cardRadius} min={0} max={40} step={1} onChange={(value) => update("cardRadius", value)} />
                <RangeField label="Border width" value={config.cardBorderWidth} min={0} max={4} step={1} onChange={(value) => update("cardBorderWidth", value)} />
                <SelectField label="Card shadow" value={config.cardShadow} options={shadowOptions} onChange={(value) => update("cardShadow", value)} />
                {listingConfig ? <RangeField label="Grid gap" value={listingConfig.gap} min={0} max={48} step={4} onChange={(value) => update("gap", value)} /> : null}
              </AccordionSection>

              {detailConfig ? (
                <>
                  <AccordionSection title="Amenities" isOpen={Boolean(openSections.amenities)} onToggle={() => toggleSection("amenities")}>
                    <ColorField label="Amenity text" value={detailConfig.amenitiesTextColor} onChange={(value) => update("amenitiesTextColor", value)} />
                    <ColorField label="Amenity background" value={detailConfig.amenitiesBackgroundColor} onChange={(value) => update("amenitiesBackgroundColor", value)} />
                  </AccordionSection>
                  <AccordionSection title="Social share" isOpen={Boolean(openSections.social)} onToggle={() => toggleSection("social")}>
                    <ColorField label="Facebook" value={detailConfig.shareFacebookColor} onChange={(value) => update("shareFacebookColor", value)} />
                    <ColorField label="Instagram" value={detailConfig.shareInstagramColor} onChange={(value) => update("shareInstagramColor", value)} />
                    <ColorField label="WhatsApp" value={detailConfig.shareWhatsappColor} onChange={(value) => update("shareWhatsappColor", value)} />
                    <ColorField label="X" value={detailConfig.shareXColor} onChange={(value) => update("shareXColor", value)} />
                    <ColorField label="LinkedIn" value={detailConfig.shareLinkedinColor} onChange={(value) => update("shareLinkedinColor", value)} />
                  </AccordionSection>
                  <AccordionSection title="Related listings" isOpen={Boolean(openSections.related)} onToggle={() => toggleSection("related")}>
                    <RangeField label="Number of cards" value={detailConfig.featuredCount} min={1} max={8} step={1} onChange={(value) => update("featuredCount", value)} />
                    <RangeField label="Card gap" value={detailConfig.featuredGap} min={0} max={48} step={4} onChange={(value) => update("featuredGap", value)} />
                  </AccordionSection>
                </>
              ) : null}
            </>
          ) : null}
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};
