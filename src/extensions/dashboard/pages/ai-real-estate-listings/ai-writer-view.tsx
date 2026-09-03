import { AIWriterPanel } from './ai-writer-panel';
import { useDt } from '@/lib/dashboard-i18n';
import { useEntitlement } from './entitlement-context';
import { PlanGate } from './plan-gate';

export function AIWriterView({ onOpenPricing }: { onOpenPricing: () => void }) {
  const t = useDt();
  const entitlement = useEntitlement();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('writerEyebrow')}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('writerTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('writerIntro')}
        </p>
      </div>
      {entitlement.features.aiWriter ? (
        <AIWriterPanel />
      ) : (
        <PlanGate
          title={t('writerLockedTitle')}
          description={t('writerLockedBody')}
          onUpgrade={onOpenPricing}
        />
      )}
    </div>
  );
}
