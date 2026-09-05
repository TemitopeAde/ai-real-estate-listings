import { useMemo, useState } from "react";
import { CircleHelp, Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDt } from "@/lib/dashboard-i18n";
import type { DashboardMessageKey } from "@/lib/dashboard-i18n";
import type { DashboardSection } from "./dashboard-shell";

interface FaqViewProps {
  onNavigate: (section: DashboardSection) => void;
}

const CATEGORIES: Array<{
  id: string;
  titleKey: DashboardMessageKey;
  items: Array<{ q: DashboardMessageKey; a: DashboardMessageKey }>;
}> = [
  {
    id: "start",
    titleKey: "faqCatStart",
    items: [
      { q: "faqStartWhatQ", a: "faqStartWhatA" },
      { q: "faqStartFirstQ", a: "faqStartFirstA" },
      { q: "faqStartPublishQ", a: "faqStartPublishA" },
    ],
  },
  {
    id: "listings",
    titleKey: "faqCatListings",
    items: [
      { q: "faqListStatusQ", a: "faqListStatusA" },
      { q: "faqListVisibleQ", a: "faqListVisibleA" },
      { q: "faqListArchiveQ", a: "faqListArchiveA" },
      { q: "faqListEditQ", a: "faqListEditA" },
      { q: "faqListCoordsQ", a: "faqListCoordsA" },
      { q: "faqListDefaultsQ", a: "faqListDefaultsA" },
      { q: "faqListImagesQ", a: "faqListImagesA" },
    ],
  },
  {
    id: "site",
    titleKey: "faqCatSite",
    items: [
      { q: "faqSiteWidgetsQ", a: "faqSiteWidgetsA" },
      { q: "faqSiteSavedQ", a: "faqSiteSavedA" },
      { q: "faqSiteRelatedQ", a: "faqSiteRelatedA" },
    ],
  },
  {
    id: "plans",
    titleKey: "faqCatPlans",
    items: [
      { q: "faqPlansDiffQ", a: "faqPlansDiffA" },
      { q: "faqPlansTrialQ", a: "faqPlansTrialA" },
      { q: "faqPlansCapQ", a: "faqPlansCapA" },
    ],
  },
  {
    id: "writer",
    titleKey: "faqCatWriter",
    items: [
      { q: "faqWriterHowQ", a: "faqWriterHowA" },
      { q: "faqWriterPlanQ", a: "faqWriterPlanA" },
    ],
  },
  {
    id: "tours",
    titleKey: "faqCatTours",
    items: [
      { q: "faqToursWhatQ", a: "faqToursWhatA" },
      { q: "faqToursPlanQ", a: "faqToursPlanA" },
    ],
  },
  {
    id: "analytics",
    titleKey: "faqCatAnalytics",
    items: [
      { q: "faqAnalyticsWhatQ", a: "faqAnalyticsWhatA" },
      { q: "faqAnalyticsVisitorsQ", a: "faqAnalyticsVisitorsA" },
    ],
  },
  {
    id: "settings",
    titleKey: "faqCatSettings",
    items: [
      { q: "faqSettingsLangQ", a: "faqSettingsLangA" },
      { q: "faqSettingsArchivedQ", a: "faqSettingsArchivedA" },
    ],
  },
  {
    id: "support",
    titleKey: "faqCatSupport",
    items: [
      { q: "faqSupportPermsQ", a: "faqSupportPermsA" },
      { q: "faqSupportContactQ", a: "faqSupportContactA" },
    ],
  },
];

export function FaqView({ onNavigate }: FaqViewProps) {
  const t = useDt();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATEGORIES.map((category) => ({
      ...category,
      items: needle
        ? category.items.filter(
            (item) =>
              t(item.q).toLowerCase().includes(needle) ||
              t(item.a).toLowerCase().includes(needle) ||
              t(category.titleKey).toLowerCase().includes(needle),
          )
        : category.items,
    })).filter((category) => category.items.length > 0);
  }, [query, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("faqEyebrow")}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("faqTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("faqIntro")}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onNavigate("guide")}
        >
          {t("faqOpenGuide")}
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("faqSearch")}
          aria-label={t("faqSearch")}
          className="h-10 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleHelp className="size-5" aria-hidden="true" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("faqNoResults")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((category) => (
            <Card
              key={category.id}
              className="border-border/70 bg-card/90 shadow-sm"
            >
              <CardHeader>
                <CardTitle>{t(category.titleKey)}</CardTitle>
                <CardDescription>
                  {category.items.length === 1
                    ? t("faqItemCount", { count: category.items.length })
                    : t("faqItemCountPlural", { count: category.items.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {category.items.map((item) => (
                    <AccordionItem key={item.q} value={item.q}>
                      <AccordionTrigger>{t(item.q)}</AccordionTrigger>
                      <AccordionContent className="leading-6 text-muted-foreground">
                        {t(item.a)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
