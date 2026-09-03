import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APP_PLAN_FEATURES,
  APP_PLANS,
  type AppPlanId,
  type PlanFeatureValue,
} from "@/lib/pricing-plans";
import { useDt } from "@/lib/dashboard-i18n";
import type { DashboardMessageKey } from "@/lib/dashboard-i18n";
import { PLAN_NAME_KEYS, PLAN_SUMMARY_KEYS } from "@/lib/dashboard-i18n/labels";
import { useEntitlement } from "./entitlement-context";
import { openAppUpgradePage } from "@/lib/entitlement";

const FEATURE_NAME_KEYS: DashboardMessageKey[] = [
  "featActiveListings",
  "featWidgets",
  "featOwnerContact",
  "featQuoteForm",
  "featSaved",
  "featAiWriter",
  "featTour",
  "featUniqueVisitors",
  "featAnalytics",
  "featSocial",
  "featQuoteEmail",
  "featAssistant",
  "featRelated",
  "featMultiScene",
  "featPriority",
];

const ACTIVE_LISTING_VALUE_KEYS: Record<AppPlanId, DashboardMessageKey> = {
  basic: "featActiveBasic",
  pro: "featActivePro",
  business: "featActiveBusiness",
};

function FeatureCell({
  value,
  planId,
  rowIndex,
}: {
  value: PlanFeatureValue;
  planId: AppPlanId;
  rowIndex: number;
}) {
  const t = useDt();
  if (typeof value === "string") {
    return (
      <span className="font-medium">
        {rowIndex === 0 ? t(ACTIVE_LISTING_VALUE_KEYS[planId]) : value}
      </span>
    );
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center text-primary">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">{t("included")}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center text-muted-foreground">
      <Minus className="size-4" aria-hidden="true" />
      <span className="sr-only">{t("notIncluded")}</span>
    </span>
  );
}

export function PricingView() {
  const t = useDt();
  const entitlement = useEntitlement();
  const currentPlanId = entitlement.planId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("pricingEyebrow")}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("pricingTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {entitlement.isTrial ? t("pricingIntroTrial") : t("pricingIntro")}
          </p>
        </div>
        {entitlement.canStartTrial ? (
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => openAppUpgradePage(entitlement.instanceId)}
          >
            {t("startFreeTrial")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {APP_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.id === currentPlanId
                ? "border-primary/40 bg-card/90 shadow-sm"
                : "border-border/70 bg-card/90 shadow-sm"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{t(PLAN_NAME_KEYS[plan.id])}</CardTitle>
                <div className="flex flex-wrap justify-end gap-1">
                  {plan.id === currentPlanId ? (
                    <Badge>
                      {entitlement.isTrial ? t("freeTrial") : t("currentPlan")}
                    </Badge>
                  ) : null}
                  {plan.id === "pro" && currentPlanId !== "pro" ? (
                    <Badge variant="secondary">{t("mostPopular")}</Badge>
                  ) : null}
                </div>
              </div>
              <p className="text-3xl font-semibold tracking-tight">
                {plan.id === "basic" ? t("planPriceFree") : plan.price}
                {plan.id !== "basic" ? (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {t("planBillingMonthly")}
                  </span>
                ) : (
                  <span className="ml-1 block text-sm font-normal text-muted-foreground">
                    {t("planBillingIncluded")}
                  </span>
                )}
              </p>
              <CardDescription>{t(PLAN_SUMMARY_KEYS[plan.id])}</CardDescription>
            </CardHeader>
            {entitlement.canStartTrial && plan.id !== "basic" ? (
              <CardContent>
                <Button
                  type="button"
                  className="w-full"
                  variant={plan.id === "pro" ? "default" : "outline"}
                  onClick={() => openAppUpgradePage(entitlement.instanceId)}
                >
                  {t("startFreeTrial")}
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t("featureComparison")}</CardTitle>
          <CardDescription>{t("featureComparisonHint")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[14rem] px-6">{t("feature")}</TableHead>
                {APP_PLANS.map((plan) => (
                  <TableHead key={plan.id} className="px-4 text-center">
                    {t(PLAN_NAME_KEYS[plan.id])}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {APP_PLAN_FEATURES.map((feature, rowIndex) => (
                <TableRow key={FEATURE_NAME_KEYS[rowIndex]}>
                  <TableCell className="whitespace-normal px-6 font-medium">
                    {t(FEATURE_NAME_KEYS[rowIndex] ?? "featActiveListings")}
                  </TableCell>
                  {(Object.keys(feature.values) as AppPlanId[]).map((planId) => (
                    <TableCell key={planId} className="px-4 text-center">
                      <FeatureCell
                        value={feature.values[planId]}
                        planId={planId}
                        rowIndex={rowIndex}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
