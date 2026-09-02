import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
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
  formatPropertyType,
  formatStatus,
  formatTransactionType,
  getImageUrl,
} from "@/lib/formatters";
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

interface ListingsViewProps {
  refreshToken: number;
  includeArchived: boolean;
  onAddListing: () => void;
  onEditListing: (id: string) => void;
  onArchiveListing: (id: string) => Promise<void>;
}

const PAGE_SIZE = 10;

interface UniqueViewer {
  key: string;
  name: string;
  email?: string;
  viewCount: number;
  lastViewedAt: Date;
}

function uniqueViewersFromEvents(events: ListingViewEvent[] | undefined): {
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
        name: event.viewerName?.trim() || "Signed-in visitor",
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
}: ListingsViewProps) {
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
      console.info("[listings-view] loaded", {
        count: result.items.length,
        totalCount: result.totalCount,
        ids: result.items.map((item) => item._id),
      });
    } catch (loadError) {
      console.error("Unable to load listings.", loadError);
      setError(
        "We could not load listings. Check the collection permissions and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [includeArchived, page, propertyType, search, status]);

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
    console.info("[listings-viewers] open", {
      listingId: listing._id,
      title: listing.title,
      localViewEvents: listing.viewEvents?.length ?? 0,
    });
    setViewersListing(listing);
    setViewersError(null);
    setViewersLoading(true);
    try {
      const fullListing = await getListing(listing._id);
      console.info("[listings-viewers] fetched", {
        listingId: listing._id,
        found: Boolean(fullListing),
        viewCount: fullListing?.viewCount,
        viewEvents: fullListing?.viewEvents,
        unique: uniqueViewersFromEvents(fullListing?.viewEvents ?? listing.viewEvents),
      });
      setViewersListing(fullListing ?? listing);
    } catch (error) {
      console.error("[listings-viewers] fetch failed", error);
      setViewersError("Unique visitors could not be loaded. Try again.");
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
              Inventory management
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              All listings
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search, organize, and keep every property ready for its next
              stage.
            </p>
          </div>
          <Button onClick={onAddListing} className="w-full sm:w-auto">
            <Plus className="size-4" aria-hidden="true" /> Add listing
          </Button>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Property inventory</CardTitle>
              <CardDescription>
                {totalCount} listing{totalCount === 1 ? "" : "s"} in this
                workspace
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
                  placeholder="Search title or city"
                  className="pl-9"
                  aria-label="Search listings"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className="w-full sm:w-36"
                  aria-label="Filter by status"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LISTING_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  aria-label="Filter by property type"
                >
                  <SelectValue placeholder="Property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All property types</SelectItem>
                  {PROPERTY_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  <RefreshCw className="size-4" aria-hidden="true" /> Retry
                </Button>
              </div>
            ) : loading ? (
              <div
                className="flex items-center justify-center px-6 py-16"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Loading listings</span>
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BuildingIcon />
                </div>
                <h3 className="font-semibold">
                  No listings match these filters
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Create your first listing or adjust the search and filters.
                </p>
                <Button size="sm" onClick={onAddListing}>
                  <Plus className="size-4" aria-hidden="true" /> Add listing
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader className="bg-muted/20 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <TableRow>
                      <TableHead className="h-auto px-6 py-3 font-medium">
                        Listing
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        Type
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        Price
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        Status
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        Views
                      </TableHead>
                      <TableHead className="h-auto px-3 py-3 font-medium">
                        Updated
                      </TableHead>
                      <TableHead className="h-auto px-6 py-3 text-right font-medium">
                        Actions
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
                                  {listing.city || "Location not set"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-4">
                            <p>{formatPropertyType(listing.propertyType)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTransactionType(listing.transactionType)}
                            </p>
                          </TableCell>
                          <TableCell className="px-3 py-4 font-medium">
                            {formatPrice(listing.price, listing.currency)}
                          </TableCell>
                          <TableCell className="px-3 py-4">
                            <Badge
                              variant={
                                listing.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {formatStatus(listing.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-4 font-medium">
                            {listing.viewCount ?? 0}
                          </TableCell>
                          <TableCell className="px-3 py-4 text-muted-foreground">
                            {formatDate(listing._updatedDate)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <ListingActionsMenu
                              listing={listing}
                              archiving={archivingId === listing._id}
                              onEdit={() => {
                                console.info("[listings-actions] edit selected", listing._id);
                                onEditListing(listing._id);
                              }}
                              onViewers={() => {
                                console.info("[listings-actions] viewers selected", listing._id);
                                void openUniqueViewers(listing);
                              }}
                              onDelete={() => {
                                console.info("[listings-actions] delete selected", listing._id);
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
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === 0}
                    onClick={() =>
                      setPage((current) => Math.max(0, current - 1))
                    }
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={!hasNext}
                    onClick={() => setPage((current) => current + 1)}
                    aria-label="Next page"
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
            <DialogTitle>Unique visitors</DialogTitle>
            <DialogDescription>
              People who viewed “{viewersListing?.title}”, counted once each.
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
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              “{archiveCandidate?.title}” will be removed from active listings.
              You can still view it when archived listings are enabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (archiveCandidate) void handleArchive(archiveCandidate._id);
                setArchiveCandidate(null);
              }}
            >
              Delete listing
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
  onEdit,
  onViewers,
  onDelete,
}: {
  listing: Listing;
  archiving: boolean;
  onEdit: () => void;
  onViewers: () => void;
  onDelete: () => void;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 8 });

  const close = () => setOpen(false);

  const placeMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      console.info("[listings-actions] missing trigger rect", listing._id);
      return false;
    }
    const next = {
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    };
    console.info("[listings-actions] place", { listingId: listing._id, rect: rect.toJSON(), next });
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
            <Pencil className="size-4" aria-hidden="true" /> Edit
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
            <Eye className="size-4" aria-hidden="true" /> Unique visitors
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
              <Archive className="size-4" aria-hidden="true" /> Delete
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
        aria-label={`Actions for ${listing.title}`}
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
  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-10"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading unique visitors</span>
      </div>
    );
  }
  if (error) {
    return <p className="py-4 text-sm text-destructive">{error}</p>;
  }
  const { viewers, anonymousViews } = uniqueViewersFromEvents(
    listing?.viewEvents,
  );
  console.info("[listings-viewers] render list", {
    listingId: listing?._id,
    viewEvents: listing?.viewEvents,
    viewers,
    anonymousViews,
  });
  if (viewers.length === 0 && anonymousViews === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No one has viewed this listing yet.
      </p>
    );
  }
  return (
    <div className="max-h-[min(24rem,60vh)] space-y-3 overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground">
        {viewers.length} unique visitor{viewers.length === 1 ? "" : "s"}
        {anonymousViews > 0
          ? ` · ${anonymousViews} unsigned view${anonymousViews === 1 ? "" : "s"}`
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
                {viewer.viewCount} view{viewer.viewCount === 1 ? "" : "s"} · last{" "}
                {formatDateTime(viewer.lastViewedAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Views so far are from unsigned visitors, so unique users cannot be
          listed.
        </p>
      )}
    </div>
  );
}

function BuildingIcon() {
  return <Building2 className="size-4" aria-hidden="true" />;
}
