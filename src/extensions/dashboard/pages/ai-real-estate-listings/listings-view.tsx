import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  getImageUrl,
} from "@/lib/formatters";
import { useDashboardI18n, useDt } from "@/lib/dashboard-i18n";
import {
  PROPERTY_TYPE_MESSAGE_KEYS,
  STATUS_MESSAGE_KEYS,
  TRANSACTION_MESSAGE_KEYS,
} from "@/lib/dashboard-i18n/labels";
import {
  LISTING_STATUSES,
  PROPERTY_TYPES,
  getListing,
  isListingStatus,
  isPropertyType,
  queryListings,
  type Listing,
  type ListingStatus,
  type ListingViewEvent,
  type PropertyType,
} from "@/lib/listings";
import { isListingCapReached, openAppUpgradePage } from "@/lib/entitlement";
import { useEntitlement } from "./entitlement-context";

interface ListingsViewProps {
  refreshToken: number;
  includeArchived: boolean;
  onAddListing: () => void;
  onEditListing: (id: string) => void;
  onArchiveListing: (id: string) => Promise<void>;
  onOpenPricing: () => void;
}

const PAGE_SIZE = 10;

interface UniqueViewer {
  key: string;
  name: string;
  email?: string;
  viewCount: number;
  lastViewedAt: Date;
}

function uniqueViewersFromEvents(
  events: ListingViewEvent[] | undefined,
  defaultVisitorName: string,
): {
  viewers: UniqueViewer[];
  anonymousViews: number;
} {
  const map = new Map<string, UniqueViewer>();
  let anonymousViews = 0;
  for (const event of events ?? []) {
    const viewerId = event.viewerId?.trim();
    const email = event.viewerEmail?.trim().toLowerCase();
    if (!viewerId && !email) {
      anonymousViews += 1;
      continue;
    }
    const key = viewerId ? `id:${viewerId}` : `email:${email}`;
    const viewedAt =
      event.viewedAt instanceof Date
        ? event.viewedAt
        : new Date(event.viewedAt);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: event.viewerName?.trim() || defaultVisitorName,
        email: event.viewerEmail?.trim(),
        viewCount: 1,
        lastViewedAt: viewedAt,
      });
      continue;
    }
    existing.viewCount += 1;
    if (viewedAt > existing.lastViewedAt) {
      existing.lastViewedAt = viewedAt;
      if (event.viewerName?.trim()) existing.name = event.viewerName.trim();
      if (event.viewerEmail?.trim()) existing.email = event.viewerEmail.trim();
    }
  }
  return {
    viewers: [...map.values()].sort(
      (left, right) => right.lastViewedAt.getTime() - left.lastViewedAt.getTime(),
    ),
    anonymousViews,
  };
}

export function ListingsView({
  refreshToken,
  includeArchived,
  onAddListing,
  onEditListing,
  onArchiveListing,
  onOpenPricing,
}: ListingsViewProps) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const entitlement = useEntitlement();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListingStatus | "all">("all");
  const [propertyType, setPropertyType] = useState<PropertyType | "all">("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<Listing | null>(
    null,
  );
  const [viewersListing, setViewersListing] = useState<Listing | null>(null);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersError, setViewersError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryListings({
        search,
        status: status === "all" ? undefined : status,
        propertyType: propertyType === "all" ? undefined : propertyType,
        includeArchived,
        page,
        pageSize: PAGE_SIZE,
      });
      setListings(result.items);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
    } catch (loadError) {
      console.error("Unable to load listings.", loadError);
      setError(t("listingsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [includeArchived, page, propertyType, search, status, t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load, refreshToken]);

  const handleStatusChange = (value: string) => {
    setStatus(value === "all" || !isListingStatus(value) ? "all" : value);
    setPage(0);
  };

  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value === "all" || !isPropertyType(value) ? "all" : value);
    setPage(0);
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await onArchiveListing(id);
      await load();
    } catch {
      // The parent owns user-facing error feedback for mutations.
    } finally {
      setArchivingId(null);
    }
  };

  const openUniqueViewers = async (listing: Listing) => {
    setViewersListing(listing);
    setViewersError(null);
    setViewersLoading(true);
    try {
      const fullListing = await getListing(listing._id);
      setViewersListing(fullListing ?? listing);
    } catch (error) {
      console.error("[listings-viewers] fetch failed", error);
      setViewersError(t("uniqueVisitorsError"));
    } finally {
      setViewersLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              {t("listingsEyebrow")}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {t("listingsTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("listingsIntro")}
              {entitlement.listingCap !== null
                ? ` ${t("listingsCapNote", {
                    visible: entitlement.publicListingCount,
                    cap: entitlement.listingCap,
                  })}`
                : ""}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <Button onClick={onAddListing} className="w-full sm:w-auto">
              <Plus className="size-4" aria-hidden="true" /> {t("addListing")}
            </Button>
            {isListingCapReached(entitlement) ? (
              <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                {t("listingCapReachedBody")}
              </p>
            ) : null}
          </div>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("propertyInventory")}</CardTitle>
              <CardDescription>
                {totalCount === 1
                  ? t("listingsCount", { count: totalCount })
                  : t("listingsCountPlural", { count: totalCount })}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  placeholder={t("searchTitleOrCity")}
                  className="pl-9"
                  aria-label={t("searchListings")}
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className="w-full sm:w-36"
                  aria-label={t("filterByStatus")}
                >
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  {LISTING_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(STATUS_MESSAGE_KEYS[option.value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={propertyType}
                onValueChange={handlePropertyTypeChange}
              >
                <SelectTrigger
                  className="w-full sm:w-40"
                  aria-label={t("filterByType")}
                >
                  <SelectValue placeholder={t("propertyType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allPropertyTypes")}</SelectItem>
                  {PROPERTY_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(PROPERTY_TYPE_MESSAGE_KEYS[option.value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  <RefreshCw className="size-4" aria-hidden="true" /> {t("retry")}
                </Button>
              </div>
            ) : loading ? (
              <div
                className="flex items-center justify-center px-6 py-16"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">{t("loadingListings")}</span>
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BuildingIcon />
                </div>
                <h3 className="font-semibold">{t("emptyListings")}</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("emptyListingsBody")}
                </p>
                <Button size="sm" onClick={onAddListing}>
                  <Plus className="size-4" aria-hidden="true" /> {t("addListing")}
                </Button>
                {isListingCapReached(entitlement) ? (
                  <p className="max-w-md text-xs text-muted-foreground">
                    {t("listingCapReachedBody")}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader className="bg-muted/20 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <TableRow>
                      <TableHead className="h-auto px-6 py-3 font-medium">
                        {t("columnProperty")}
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        {t("columnType")}
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        {t("columnPrice")}
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        {t("columnStatus")}
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        {t("columnViews")}
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        {t("columnUpdated")}
                      </TableHead>
                      <TableHead className="h-auto px-6 py-3 text-right font-medium">
                        {t("columnActions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => {
                      const imageUrl = getImageUrl(listing.primaryImage);
                      return (
                        <TableRow
                          key={listing._id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="size-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <BuildingIcon />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate font-medium">
                                  {listing.title}
                                </p>
                                <p className="mt-1 max-w-[240px] truncate text-xs text-muted-foreground">
                                  {listing.city || t("locationNotSet")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-4">
                            <p>{t(PROPERTY_TYPE_MESSAGE_KEYS[listing.propertyType])}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t(TRANSACTION_MESSAGE_KEYS[listing.transactionType])}
                            </p>
                          </TableCell>
                          <TableCell className="px-3 py-4 font-medium">
                            {formatPrice(listing.price, listing.currency, locale)}
                          </TableCell>
                          <TableCell className="px-3 py-4">
                            <Badge
                              variant={
                                listing.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {t(STATUS_MESSAGE_KEYS[listing.status])}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-4 font-medium">
                            {listing.viewCount ?? 0}
                          </TableCell>
                          <TableCell className="px-3 py-4 text-muted-foreground">
                            {formatDate(listing._updatedDate, locale)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <ListingActionsMenu
                              listing={listing}
                              archiving={archivingId === listing._id}
                              canEdit={entitlement.features.editListings}
                              onEdit={() => {
                                onEditListing(listing._id);
                              }}
                              onViewers={() => {
                                if (!entitlement.features.uniqueVisitors) {
                                  if (entitlement.canStartTrial) {
                                    openAppUpgradePage(entitlement.instanceId);
                                    return;
                                  }
                                  onOpenPricing();
                                  return;
                                }
                                void openUniqueViewers(listing);
                              }}
                              onDelete={() => {
                                setArchiveCandidate(listing);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {!loading && !error && totalCount > 0 ? (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
                <p className="text-xs text-muted-foreground">
                  {t("pageOf", { current: page + 1, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === 0}
                    onClick={() =>
                      setPage((current) => Math.max(0, current - 1))
                    }
                    aria-label={t("previousPage")}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={!hasNext}
                    onClick={() => setPage((current) => current + 1)}
                    aria-label={t("nextPage")}
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={viewersListing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewersListing(null);
            setViewersError(null);
            setViewersLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("uniqueVisitorsTitle")}</DialogTitle>
            <DialogDescription>
              {t("uniqueVisitorsHint", { title: viewersListing?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <UniqueViewersList
              listing={viewersListing}
              loading={viewersLoading}
              error={viewersError}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={archiveCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteListingTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteListingBody", { title: archiveCandidate?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (archiveCandidate) void handleArchive(archiveCandidate._id);
                setArchiveCandidate(null);
              }}
            >
              {t("deleteListing")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ListingActionsMenu({
  listing,
  archiving,
  canEdit,
  onEdit,
  onViewers,
  onDelete,
}: {
  listing: Listing;
  archiving: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onViewers: () => void;
  onDelete: () => void;
}) {
  const t = useDt();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 8 });

  const close = () => setOpen(false);

  const placeMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return false;
    }
    const next = {
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    };
    setPosition(next);
    return true;
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (placeMenu()) setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        (menuRef.current?.contains(target) || triggerRef.current?.contains(target))
      ) {
        return;
      }
      setOpen(false);
    };
    const onReposition = () => {
      if (!placeMenu()) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [listing._id, open]);

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, right: position.right, left: "auto" }}
          className="fixed z-[400] w-52 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={() => {
              close();
              onEdit();
            }}
          >
            {canEdit ? (
              <Pencil className="size-4" aria-hidden="true" />
            ) : (
              <Lock className="size-4" aria-hidden="true" />
            )}{" "}
            {t("edit")}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={() => {
              close();
              onViewers();
            }}
          >
            <Eye className="size-4" aria-hidden="true" /> {t("uniqueVisitors")}
          </button>
          {listing.status !== "archived" ? (
            <button
              type="button"
              role="menuitem"
              disabled={archiving}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              onClick={() => {
                close();
                onDelete();
              }}
            >
              <Archive className="size-4" aria-hidden="true" /> {t("delete")}
            </button>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative inline-flex" ref={triggerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("actionsFor", { title: listing.title })}
        onClick={toggle}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </Button>
      {menu}
    </div>
  );
}

function UniqueViewersList({
  listing,
  loading,
  error,
}: {
  listing: Listing | null;
  loading: boolean;
  error: string | null;
}) {
  const t = useDt();
  const { locale } = useDashboardI18n();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-10"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t("uniqueVisitorsLoading")}</span>
      </div>
    );
  }
  if (error) {
    return <p className="py-4 text-sm text-destructive">{error}</p>;
  }
  const { viewers, anonymousViews } = uniqueViewersFromEvents(
    listing?.viewEvents,
    t("signedInVisitor"),
  );
  if (viewers.length === 0 && anonymousViews === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">{t("noViewersYet")}</p>
    );
  }
  return (
    <div className="max-h-[min(24rem,60vh)] space-y-3 overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground">
        {viewers.length === 1
          ? t("uniqueVisitorCount", { count: viewers.length })
          : t("uniqueVisitorCountPlural", { count: viewers.length })}
        {anonymousViews > 0
          ? ` · ${
              anonymousViews === 1
                ? t("unsignedViews", { count: anonymousViews })
                : t("unsignedViewsPlural", { count: anonymousViews })
            }`
          : ""}
      </p>
      {viewers.length > 0 ? (
        <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
          {viewers.map((viewer) => (
            <li key={viewer.key} className="px-3 py-3">
              <p className="font-medium">{viewer.name}</p>
              {viewer.email ? (
                <a
                  href={`mailto:${encodeURIComponent(viewer.email)}`}
                  className="mt-0.5 inline-block text-xs text-primary underline-offset-2 hover:underline"
                >
                  {viewer.email}
                </a>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {viewer.viewCount === 1
                  ? t("viewCountLabel", { count: viewer.viewCount })
                  : t("viewCountLabelPlural", { count: viewer.viewCount })}{" "}
                · {t("lastViewed", { when: formatDateTime(viewer.lastViewedAt, locale) })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("unsignedViewsOnly")}</p>
      )}
    </div>
  );
}

function BuildingIcon() {
  return <Building2 className="size-4" aria-hidden="true" />;
}
