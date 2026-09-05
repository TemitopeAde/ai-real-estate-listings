import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Inbox,
  LayoutDashboard,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDt } from "@/lib/dashboard-i18n";
import type { DashboardMessageKey } from "@/lib/dashboard-i18n";
import { isListingCapReached } from "@/lib/entitlement";
import type { DashboardSection } from "./dashboard-shell";
import { useEntitlement } from "./entitlement-context";

interface GuideViewProps {
  onNavigate: (section: DashboardSection) => void;
  onAddListing: () => void;
}

const steps: Array<{
  titleKey: DashboardMessageKey;
  summaryKey: DashboardMessageKey;
  itemKeys: DashboardMessageKey[];
  actionKey: DashboardMessageKey;
  icon: LucideIcon;
  onSelect: (actions: GuideViewProps) => void;
}> = [
  {
    titleKey: "guideStep1Title",
    summaryKey: "guideStep1Summary",
    itemKeys: [
      "guideStep1Item1",
      "guideStep1Item2",
      "guideStep1Item3",
      "guideStep1Item4",
    ],
    actionKey: "openListings",
    icon: Building2,
    onSelect: ({ onNavigate }) => onNavigate("listings"),
  },
  {
    titleKey: "guideStep2Title",
    summaryKey: "guideStep2Summary",
    itemKeys: [
      "guideStep2Item1",
      "guideStep2Item2",
      "guideStep2Item3",
      "guideStep2Item4",
    ],
    actionKey: "openSettings",
    icon: LayoutDashboard,
    onSelect: ({ onNavigate }) => onNavigate("settings"),
  },
  {
    titleKey: "guideStep3Title",
    summaryKey: "guideStep3Summary",
    itemKeys: [
      "guideStep3Item1",
      "guideStep3Item2",
      "guideStep3Item3",
      "guideStep3Item4",
    ],
    actionKey: "openQuoteRequests",
    icon: Inbox,
    onSelect: ({ onNavigate }) => onNavigate("requests"),
  },
  {
    titleKey: "guideStep4Title",
    summaryKey: "guideStep4Summary",
    itemKeys: ["guideStep4Item1", "guideStep4Item2", "guideStep4Item3"],
    actionKey: "openWriter",
    icon: WandSparkles,
    onSelect: ({ onNavigate }) => onNavigate("writer"),
  },
];

export function GuideView({ onNavigate, onAddListing }: GuideViewProps) {
  const t = useDt();
  const entitlement = useEntitlement();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("guideEyebrow")}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("guideTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("guideIntro")}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          <Button onClick={onAddListing} className="w-full sm:w-auto">
            {t("addListing")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          {isListingCapReached(entitlement) ? (
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">
              {t("listingCapReachedBody")}
            </p>
          ) : null}
        </div>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{t("recommendedPath")}</CardTitle>
            <CardDescription>{t("recommendedPathHint")}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.titleKey}
              className="border-border/70 bg-card/90 shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {t("stepLabel", { n: index + 1 })}
                    </p>
                  </div>
                </div>
                <CardTitle className="mt-3">{t(step.titleKey)}</CardTitle>
                <CardDescription>{t(step.summaryKey)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {step.itemKeys.map((itemKey) => (
                    <li key={itemKey}>{t(itemKey)}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    step.onSelect({ onNavigate, onAddListing })
                  }
                >
                  {t(step.actionKey)}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              {t("needMoreHelp")}
            </span>
          </div>
          <CardTitle className="mt-2">{t("supportTitle")}</CardTitle>
          <CardDescription>{t("supportBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("settings")}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            {t("openSettings")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("faq")}
          >
            {t("navFaq")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
