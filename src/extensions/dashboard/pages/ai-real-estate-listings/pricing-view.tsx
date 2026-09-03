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
import { useEntitlement } from "./entitlement-context";
import { openAppUpgradePage } from "@/lib/entitlement";

function FeatureCell({ value }: { value: PlanFeatureValue }) {
  if (typeof value === "string") {
    return <span className="font-medium">{value}</span>;
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center text-primary">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center text-muted-foreground">
      <Minus className="size-4" aria-hidden="true" />
      <span className="sr-only">Not included</span>
    </span>
  );
}

export function PricingView() {
  const entitlement = useEntitlement();
  const currentPlanId = entitlement.planId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">App plans</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Choose the plan that fits your inventory
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {entitlement.isTrial
              ? "Your free trial includes every Business feature. After it ends, the live site and gated tools follow your active plan."
              : "Start on Basic to publish listings and collect quotes. Upgrade to Pro or Business when you need AI copy, 360° tours, analytics, and more marketing tools."}
          </p>
        </div>
        {entitlement.canStartTrial ? (
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => openAppUpgradePage(entitlement.instanceId)}
          >
            Start free trial
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
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex flex-wrap justify-end gap-1">
                  {plan.id === currentPlanId ? (
                    <Badge>{entitlement.isTrial ? "Free trial" : "Current plan"}</Badge>
                  ) : null}
                  {plan.id === "pro" && currentPlanId !== "pro" ? (
                    <Badge variant="secondary">Most popular</Badge>
                  ) : null}
                </div>
              </div>
              <p className="text-3xl font-semibold tracking-tight">
                {plan.price}
                {plan.id !== "basic" ? (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {plan.billing}
                  </span>
                ) : null}
              </p>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>
            {entitlement.canStartTrial && plan.id !== "basic" ? (
              <CardContent>
                <Button
                  type="button"
                  className="w-full"
                  variant={plan.id === "pro" ? "default" : "outline"}
                  onClick={() => openAppUpgradePage(entitlement.instanceId)}
                >
                  Start free trial
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Feature comparison</CardTitle>
          <CardDescription>
            What is included on Basic, Pro, and Business.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[14rem] px-6">Feature</TableHead>
                {APP_PLANS.map((plan) => (
                  <TableHead
                    key={plan.id}
                    className="px-4 text-center"
                  >
                    {plan.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {APP_PLAN_FEATURES.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="whitespace-normal px-6 font-medium">
                    {feature.name}
                  </TableCell>
                  {(Object.keys(feature.values) as AppPlanId[]).map((planId) => (
                    <TableCell key={planId} className="px-4 text-center">
                      <FeatureCell value={feature.values[planId]} />
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
