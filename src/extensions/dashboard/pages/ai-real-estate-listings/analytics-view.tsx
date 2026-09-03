import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Activity, BrainCircuit, Building2, MapPin, RefreshCw, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/formatters';
import { getAnalyticsSnapshot, type AnalyticsSnapshot } from '@/lib/listings';
import { useDashboardI18n, useDt } from '@/lib/dashboard-i18n';
import { breakdownLabelKey } from '@/lib/dashboard-i18n/labels';
import { useEntitlement } from './entitlement-context';
import { PlanGate } from './plan-gate';

interface AnalyticsViewProps {
  refreshToken: number;
  onOpenPricing: () => void;
}

function AnalyticsMetric({ label, value, description, icon: Icon }: { label: string; value: string; description: string; icon: LucideIcon }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></div>
      </CardContent>
    </Card>
  );
}

function BreakdownList({ title, items, emptyLabel }: { title: string; items: Array<{ label: string; value: number }>; emptyLabel: string }) {
  const t = useDt();
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t('currentDistribution')}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="py-8 text-sm text-muted-foreground">{emptyLabel}</p> : <div className="space-y-4">{items.map((item) => {
          const key = breakdownLabelKey(item.label);
          const label = key ? t(key) : item.label;
          return <div key={item.label}><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span>{label}</span><span className="font-medium tabular-nums">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.value / Math.max(...items.map((entry) => entry.value))) * 100)}%` }} /></div></div>;
        })}</div>}
      </CardContent>
    </Card>
  );
}

function PricingTable({ items }: { items: AnalyticsSnapshot['averagePriceByCurrency'] }) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{t('averagePrice')}</CardTitle>
        <CardDescription>{t('averagePriceHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="py-8 text-sm text-muted-foreground">{t('addListingsForPricing')}</p> : <div className="space-y-3">{items.map((item) => <div key={item.currency} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3"><div><p className="text-sm font-medium">{item.currency}</p><p className="mt-1 text-xs text-muted-foreground">{item.listings === 1 ? t('listingCountOne', { count: item.listings }) : t('listingCountMany', { count: item.listings })}</p></div><p className="text-sm font-semibold">{formatPrice(item.average, item.currency, locale)}</p></div>)}</div>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsView({ refreshToken, onOpenPricing }: AnalyticsViewProps) {
  const t = useDt();
  const entitlement = useEntitlement();
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activityConfig = {
    listings: { label: t('listingActivity'), color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const propertyConfig = {
    listings: { label: t('navListings'), color: 'var(--chart-4)' },
  } satisfies ChartConfig;

  const translateBreakdown = (items: Array<{ label: string; value: number }>) =>
    items.map((item) => {
      const key = breakdownLabelKey(item.label);
      return { ...item, label: key ? t(key) : item.label };
    });

  const load = useCallback(async () => {
    if (!entitlement.features.analytics) return;
    setError(null);
    try {
      setAnalytics(await getAnalyticsSnapshot());
    } catch (loadError) {
      console.error('Unable to load analytics.', loadError);
      setError(t('analyticsLoadError'));
    }
  }, [entitlement.features.analytics, t]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t('analyticsEyebrow')}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('analyticsTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t('analyticsIntro')}</p>
        </div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" aria-hidden="true" /> {t('refresh')}</Button>
      </div>

      {!entitlement.features.analytics ? (
        <PlanGate
          title={t('analyticsLockedTitle')}
          description={t('analyticsLockedBody')}
          onUpgrade={onOpenPricing}
        />
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>{t('retry')}</Button>
          </CardContent>
        </Card>
      ) : !analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsMetric label={t('trackedInventory')} value={String(analytics.total)} description={t('trackedInventoryHint')} icon={Building2} />
            <AnalyticsMetric label={t('aiReadyContent')} value={String(analytics.aiReady)} description={t('aiReadyHint')} icon={BrainCircuit} />
            <AnalyticsMetric label={t('activeCities')} value={String(analytics.topCities.length)} description={t('activeCitiesHint')} icon={MapPin} />
            <AnalyticsMetric label={t('activitySignal')} value={String(analytics.activityByMonth.reduce((total, month) => total + month.value, 0))} description={t('activitySignalHint')} icon={TrendingUp} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>{t('listingActivity')}</CardTitle>
                <CardDescription>{t('listingActivityHint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={activityConfig} className="min-h-[260px] w-full">
                  <BarChart accessibilityLayer data={analytics.activityByMonth} margin={{ left: -12, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" fill="var(--color-listings)" radius={5} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <BreakdownList title={t('topCities')} items={analytics.topCities} emptyLabel={t('topCitiesEmpty')} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader><CardTitle>{t('propertyMix')}</CardTitle><CardDescription>{t('propertyMixHint')}</CardDescription></CardHeader>
              <CardContent>
                {analytics.propertyBreakdown.length === 0 ? <p className="py-8 text-sm text-muted-foreground">{t('propertyMixEmpty')}</p> : <ChartContainer config={propertyConfig} className="min-h-[280px] w-full"><BarChart accessibilityLayer data={translateBreakdown(analytics.propertyBreakdown)} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={90} /><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="value" fill="var(--color-listings)" radius={5} /></BarChart></ChartContainer>}
              </CardContent>
            </Card>
            <PricingTable items={analytics.averagePriceByCurrency} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownList title={t('listingStatus')} items={analytics.statusBreakdown} emptyLabel={t('listingStatusEmpty')} />
            <BreakdownList title={t('transactionMix')} items={analytics.transactionBreakdown} emptyLabel={t('transactionMixEmpty')} />
          </div>

          {analytics.propertyBreakdown.length > 0 ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="size-3.5" aria-hidden="true" /> {t('analyticsFooter')}</div> : <Badge variant="secondary" className="w-fit">{t('noListingData')}</Badge>}
        </>
      )}
    </div>
  );
}
