import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
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
import { Skeleton } from "@/components/ui/skeleton";
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
  formatPrice,
  formatPropertyType,
  formatStatus,
  formatTransactionType,
  getImageUrl,
} from "@/lib/formatters";
import {
  LISTING_STATUSES,
  PROPERTY_TYPES,
  isListingStatus,
  isPropertyType,
  queryListings,
  type Listing,
  type ListingStatus,
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
  const [editCandidate, setEditCandidate] = useState<Listing | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<Listing | null>(
    null,
  );

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
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
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
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditCandidate(listing)}
                                aria-label={`Edit ${listing.title}`}
                                title="Edit listing"
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                              {listing.status !== "archived" ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={archivingId === listing._id}
                                  onClick={() => setArchiveCandidate(listing)}
                                  aria-label={`Archive ${listing.title}`}
                                  title="Archive listing"
                                >
                                  <Archive className="size-4" aria-hidden="true" />
                                </Button>
                              ) : null}
                            </div>
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
      <AlertDialog
        open={editCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setEditCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Open “{editCandidate?.title}” in the listing form to make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (editCandidate) onEditListing(editCandidate._id);
                setEditCandidate(null);
              }}
            >
              Continue to edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={archiveCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this listing?</AlertDialogTitle>
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
              Archive listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BuildingIcon() {
  return <Building2 className="size-4" aria-hidden="true" />;
}
