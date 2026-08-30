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
import {
  formatDate,
  formatPrice,
  formatPropertyType,
  formatStatus,
  getImageUrl,
} from '@/lib/formatters';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/lib/listings';

interface OverviewViewProps {
  refreshToken: number;
  onAddListing: () => void;
  onViewListings: () => void;
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

function RecentListings({ listings, onViewListings }: { listings: DashboardSnapshot['recent']; onViewListings: () => void }) {
  if (listings.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-semibold">Your inventory is ready for its first listing</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add a property to start tracking your portfolio and unlock analytics.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onViewListings}>
          Open listings <ArrowRight className="size-4" aria-hidden="true" />
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
                {listing.city || 'Location not set'}
                <span aria-hidden="true">·</span>
                {formatPropertyType(listing.propertyType)}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{formatPrice(listing.price, listing.currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(listing._updatedDate)}</p>
            </div>
            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
              {formatStatus(listing.status)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function OverviewView({ refreshToken, onAddListing, onViewListings }: OverviewViewProps) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSnapshot(await getDashboardSnapshot());
    } catch (loadError) {
      console.error('Unable to load dashboard overview.', loadError);
      setError('We could not load your overview. Check the collection permissions and try again.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Good to see you</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Your real estate workspace</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep your inventory organized, spot movement quickly, and prepare every listing for assisted publishing.
          </p>
        </div>
        <Button onClick={onAddListing} className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          Add listing
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden="true" /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot ? (
          <>
            <MetricCard label="Total listings" value={snapshot.total} detail="Across your workspace" icon={Building2} />
            <MetricCard label="Active" value={snapshot.active} detail="Currently available" icon={CheckCircle2} />
            <MetricCard label="Under offer" value={snapshot.underOffer} detail="Moving through a deal" icon={Handshake} />
            <MetricCard label="Sold" value={snapshot.sold} detail="Completed transactions" icon={BadgeDollarSign} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent listings</CardTitle>
              <CardDescription>The latest properties added or updated in your workspace.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewListings}>
              View all <ArrowRight className="size-4" aria-hidden="true" />
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
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Next focus</span>
            </div>
            <CardTitle className="mt-3 text-foreground">Turn details into momentum</CardTitle>
            <CardDescription className="text-muted-foreground">
              Start with complete listing basics. AI-assisted content generation can be connected when your provider is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="sm" onClick={onAddListing}>
              Create a listing <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
