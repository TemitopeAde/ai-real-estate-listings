import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPrice, getImageUrl } from '@/lib/formatters';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/lib/listings';
import { openAppUpgradePage } from '@/lib/entitlement';
import { useDashboardI18n, useDt } from '@/lib/dashboard-i18n';
import {
  PROPERTY_TYPE_MESSAGE_KEYS,
  STATUS_MESSAGE_KEYS,
} from '@/lib/dashboard-i18n/labels';
import { isListingCapReached } from '@/lib/entitlement';
import { useEntitlement } from './entitlement-context';

interface OverviewViewProps {
  refreshToken: number;
  onAddListing: () => void;
  onViewListings: () => void;
  onOpenWriter: () => void;
  onOpenGuide: () => void;
  onOpenPricing: () => void;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

function GuideIntro({ onOpenGuide }: { onOpenGuide: () => void }) {
  const t = useDt();
  const [before, after] = t('overviewIntro').split('{guide}');
  return (
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      {before}
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={onOpenGuide}
      >
        {t('workspaceGuide')}
      </button>
      {after}
    </p>
  );
}

function RecentListings({
  listings,
  onViewListings,
}: {
  listings: DashboardSnapshot['recent'];
  onViewListings: () => void;
}) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  if (listings.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-semibold">{t('inventoryEmptyTitle')}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t('inventoryEmptyBody')}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onViewListings}>
          {t('openListings')} <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {listings.map((listing) => {
        const imageUrl = getImageUrl(listing.primaryImage);
        return (
          <div key={listing._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-11 rounded-lg object-cover" />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-4" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{listing.title}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                {listing.city || t('locationNotSet')}
                <span aria-hidden="true">·</span>
                {t(PROPERTY_TYPE_MESSAGE_KEYS[listing.propertyType])}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{formatPrice(listing.price, listing.currency, locale)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(listing._updatedDate, locale)}</p>
            </div>
            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
              {t(STATUS_MESSAGE_KEYS[listing.status])}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function OverviewView({ refreshToken, onAddListing, onViewListings, onOpenWriter, onOpenGuide, onOpenPricing }: OverviewViewProps) {
  const t = useDt();
  const entitlement = useEntitlement();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSnapshot(await getDashboardSnapshot());
    } catch (loadError) {
      console.error('Unable to load dashboard overview.', loadError);
      setError(t('overviewLoadError'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t('overviewEyebrow')}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('overviewTitle')}</h2>
          <GuideIntro onOpenGuide={onOpenGuide} />
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          <Button onClick={onAddListing} className="w-full sm:w-auto">
            <Plus className="size-4" aria-hidden="true" />
            {t('addListing')}
          </Button>
          {isListingCapReached(entitlement) ? (
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">
              {t('listingCapReachedBody')}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden="true" /> {t('retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot ? (
          <>
            <MetricCard label={t('metricTotal')} value={snapshot.total} detail={t('metricTotalDetail')} icon={Building2} />
            <MetricCard label={t('metricActive')} value={snapshot.active} detail={t('metricActiveDetail')} icon={CheckCircle2} />
            <MetricCard label={t('metricUnderOffer')} value={snapshot.underOffer} detail={t('metricUnderOfferDetail')} icon={Handshake} />
            <MetricCard label={t('metricSold')} value={snapshot.sold} detail={t('metricSoldDetail')} icon={BadgeDollarSign} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t('recentListings')}</CardTitle>
              <CardDescription>{t('recentListingsHint')}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewListings}>
              {t('viewAll')} <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent>
            {snapshot ? <RecentListings listings={snapshot.recent} onViewListings={onViewListings} /> : <Skeleton className="h-52 rounded-xl" />}
          </CardContent>
        </Card>

      <Card className="overflow-hidden border-[#C5A880]/50 bg-[#C5A880]/10 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#0C3B2E]">
              <Clock3 className="size-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">{t('nextFocus')}</span>
            </div>
            <CardTitle className="mt-3 text-foreground">{t('momentumTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('momentumBody')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (entitlement.features.aiWriter) {
                  onOpenWriter();
                  return;
                }
                if (entitlement.canStartTrial) {
                  openAppUpgradePage(entitlement.instanceId);
                  return;
                }
                onOpenPricing();
              }}
            >
              {entitlement.features.aiWriter
                ? t('openWriter')
                : entitlement.canStartTrial
                  ? t('startFreeTrial')
                  : t('unlockWriter')}{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
