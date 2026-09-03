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
import { useEntitlement } from './entitlement-context';
import { PlanGate } from './plan-gate';

interface AnalyticsViewProps {
  refreshToken: number;
  onOpenPricing: () => void;
}

const activityConfig = {
  listings: { label: 'Listings added', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const propertyConfig = {
  listings: { label: 'Listings', color: 'var(--chart-4)' },
} satisfies ChartConfig;

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
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Current distribution across your inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="py-8 text-sm text-muted-foreground">{emptyLabel}</p> : <div className="space-y-4">{items.map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span>{item.label}</span><span className="font-medium tabular-nums">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.value / Math.max(...items.map((entry) => entry.value))) * 100)}%` }} /></div></div>)}</div>}
      </CardContent>
    </Card>
  );
}

function PricingTable({ items }: { items: AnalyticsSnapshot['averagePriceByCurrency'] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Average asking price</CardTitle>
        <CardDescription>Grouped by currency to keep comparisons meaningful.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Add listings to see pricing signals.</p> : <div className="space-y-3">{items.map((item) => <div key={item.currency} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3"><div><p className="text-sm font-medium">{item.currency}</p><p className="mt-1 text-xs text-muted-foreground">{item.listings} listing{item.listings === 1 ? '' : 's'}</p></div><p className="text-sm font-semibold">{formatPrice(item.average, item.currency)}</p></div>)}</div>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsView({ refreshToken, onOpenPricing }: AnalyticsViewProps) {
  const entitlement = useEntitlement();
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entitlement.features.analytics) return;
    setError(null);
    try {
      setAnalytics(await getAnalyticsSnapshot());
    } catch (loadError) {
      console.error('Unable to load analytics.', loadError);
      setError('We could not calculate analytics. Check the collection permissions and try again.');
    }
  }, [entitlement.features.analytics]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio intelligence</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Advanced analytics</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Understand your inventory mix, activity, and content readiness from the data you already have.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" aria-hidden="true" /> Refresh</Button>
      </div>

      {!entitlement.features.analytics ? (
        <PlanGate
          title="Analytics is on Pro and Business"
          description="Upgrade to see inventory mix, activity, and content readiness."
          onUpgrade={onOpenPricing}
        />
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
          </CardContent>
        </Card>
      ) : !analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsMetric label="Tracked inventory" value={String(analytics.total)} description="Listings in the collection" icon={Building2} />
            <AnalyticsMetric label="AI-ready content" value={String(analytics.aiReady)} description="Listings with AI fields populated" icon={BrainCircuit} />
            <AnalyticsMetric label="Active cities" value={String(analytics.topCities.length)} description="Top five cities shown below" icon={MapPin} />
            <AnalyticsMetric label="Activity signal" value={String(analytics.activityByMonth.reduce((total, month) => total + month.value, 0))} description="Listings added in the last six months" icon={TrendingUp} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Listing activity</CardTitle>
                <CardDescription>New records created over the last six calendar months.</CardDescription>
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
            <BreakdownList title="Top cities" items={analytics.topCities} emptyLabel="Add locations to see geographic concentration." />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader><CardTitle>Property mix</CardTitle><CardDescription>Inventory grouped by property type.</CardDescription></CardHeader>
              <CardContent>
                {analytics.propertyBreakdown.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Add listings to see your property mix.</p> : <ChartContainer config={propertyConfig} className="min-h-[280px] w-full"><BarChart accessibilityLayer data={analytics.propertyBreakdown} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={90} /><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="value" fill="var(--color-listings)" radius={5} /></BarChart></ChartContainer>}
              </CardContent>
            </Card>
            <PricingTable items={analytics.averagePriceByCurrency} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownList title="Listing status" items={analytics.statusBreakdown} emptyLabel="Your status breakdown will appear once listings are added." />
            <BreakdownList title="Transaction mix" items={analytics.transactionBreakdown} emptyLabel="Your transaction mix will appear once listings are added." />
          </div>

          {analytics.propertyBreakdown.length > 0 ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="size-3.5" aria-hidden="true" /> Analytics are calculated from the current listings collection and refresh on demand.</div> : <Badge variant="secondary" className="w-fit">No listing data yet</Badge>}
        </>
      )}
    </div>
  );
}
