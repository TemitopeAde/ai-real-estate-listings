import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openAppUpgradePage } from "@/lib/entitlement";
import { useDt } from "@/lib/dashboard-i18n";
import { useEntitlement } from "./entitlement-context";

interface PlanGateProps {
  title: string;
  description: string;
  onUpgrade: () => void;
}

export function PlanGate({ title, description, onUpgrade }: PlanGateProps) {
  const t = useDt();
  const entitlement = useEntitlement();
  const startTrial = () => openAppUpgradePage(entitlement.instanceId);

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {entitlement.canStartTrial ? (
          <Button type="button" onClick={startTrial}>
            {t("startFreeTrial")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant={entitlement.canStartTrial ? "outline" : "default"}
          onClick={onUpgrade}
        >
          {t("viewPlans")}
        </Button>
      </CardContent>
    </Card>
  );
}
