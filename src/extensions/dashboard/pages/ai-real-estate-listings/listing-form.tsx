import { lazy, Suspense, useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { Check, ImagePlus, Loader2, Save, Trash2, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENCIES } from "@/lib/currencies";
import { httpClient } from "@wix/essentials";
import fallbackCountries from "@/data/countries.json";
import {
  AREA_UNITS,
  FURNISHING_STATUSES,
  LISTING_STATUSES,
  PROPERTY_CONDITIONS,
  PROPERTY_TYPES,
  RENTAL_FREQUENCIES,
  TENURE_TYPES,
  TRANSACTION_TYPES,
  isListingStatus,
  isPropertyCondition,
  isFurnishingStatus,
  isTenureType,
  isRentalFrequency,
  isPropertyType,
  isTransactionType,
  getPanoramaImages,
  type Listing,
  type ListingImage,
  type ListingInput,
  type ListingStatus,
  getSiteOwnerContact,
} from "@/lib/listings";
import { htmlFromPlainDescription, type ListingCopyInput } from "@/lib/ai-writer";
import { AIWriterPanel } from "./ai-writer-panel";

const RichTextEditor = lazy(() =>
  import("./rich-text-editor").then((module) => ({
    default: module.RichTextEditor,
  })),
);

interface ListingFormProps {
  listing: Listing | null;
  defaultCurrency: string;
  defaultAreaUnit: string;
  defaultStatus: ListingStatus;
  loading?: boolean;
  onBack: () => void;
  onSave: (input: ListingInput, id?: string) => Promise<void>;
}

interface ListingFormState {
  title: string;
  description: string;
  transactionType: ListingInput["transactionType"];
  propertyType: ListingInput["propertyType"];
  status: ListingInput["status"];
  price: string;
  currency: string;
  area: string;
  areaUnit: string;
  bedrooms: string;
  bathrooms: string;
  propertyCondition: NonNullable<ListingInput["propertyCondition"]>;
  furnishingStatus: NonNullable<ListingInput["furnishingStatus"]>;
  tenure: NonNullable<ListingInput["tenure"]>;
  rentalFrequency: NonNullable<ListingInput["rentalFrequency"]>;
  availabilityDate: string;
  serviceCharge: string;
  securityDeposit: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  latitude: string;
  longitude: string;
  panoramaImages: ListingImage[];
  yearBuilt: string;
  parkingSpaces: string;
  furnished: boolean;
  amenities: string;
  country: string;
  state: string;
  address: string;
  city: string;
  primaryImage: string;
  gallery: ListingImage[];
}

type FormField = keyof ListingFormState;
type FormErrors = Partial<Record<FormField, string>>;

interface LocationOption {
  iso2?: string;
  name: string;
  id?: number;
}

interface CountryOption {
  code: string;
  name: string;
}

function createInitialState(
  listing: Listing | null,
  defaults: Pick<
    ListingFormProps,
    "defaultCurrency" | "defaultAreaUnit" | "defaultStatus"
  >,
  loading = false,
): ListingFormState {
  const availabilityDate = listing?.availabilityDate;
  const isNewListing = !listing?._id && !loading;
  return {
    title:
      listing?.title ??
      (isNewListing ? "Contemporary 3-bedroom apartment in Lekki" : ""),
    description:
      listing?.description ??
      (isNewListing
        ? "<p>Bright and spacious apartment with modern finishes, excellent natural light, and secure parking. Located close to shops, restaurants, and major commuter routes.</p><p>Ideal for professionals or a growing family looking for a comfortable home in a well-connected neighbourhood.</p>"
        : ""),
    transactionType: listing?.transactionType ?? "sale",
    propertyType: listing?.propertyType ?? "house",
    status: listing?.status ?? defaults.defaultStatus,
    price: listing ? String(listing.price) : "85000000",
    currency: listing?.currency ?? defaults.defaultCurrency,
    area: listing ? String(listing.area) : "1850",
    areaUnit: listing?.areaUnit ?? defaults.defaultAreaUnit,
    bedrooms:
      listing?.bedrooms === undefined
        ? isNewListing
          ? "3"
          : ""
        : String(listing.bedrooms),
    bathrooms:
      listing?.bathrooms === undefined
        ? isNewListing
          ? "3"
          : ""
        : String(listing.bathrooms),
    propertyCondition: listing?.propertyCondition ?? "good",
    furnishingStatus:
      listing?.furnishingStatus ??
      (listing?.furnished
        ? "furnished"
        : isNewListing
          ? "furnished"
          : "unfurnished"),
    tenure: listing?.tenure ?? "freehold",
    rentalFrequency: listing?.rentalFrequency ?? "monthly",
    availabilityDate: availabilityDate
      ? availabilityDate.toISOString().slice(0, 10)
      : isNewListing
        ? "2026-10-01"
        : "",
    serviceCharge:
      listing?.serviceCharge === undefined
        ? isNewListing
          ? "250000"
          : ""
        : String(listing.serviceCharge),
    securityDeposit:
      listing?.securityDeposit === undefined
        ? isNewListing
          ? "5000000"
          : ""
        : String(listing.securityDeposit),
    agentName: listing?.agentName ?? "",
    agentPhone: listing?.agentPhone ?? "",
    agentEmail: listing?.agentEmail ?? "",
    latitude:
      listing?.latitude === undefined
        ? isNewListing
          ? "6.4341"
          : ""
        : String(listing.latitude),
    longitude:
      listing?.longitude === undefined
        ? isNewListing
          ? "3.4703"
          : ""
        : String(listing.longitude),
    panoramaImages: getPanoramaImages(listing ?? {}),
    yearBuilt:
      listing?.yearBuilt === undefined
        ? isNewListing
          ? "2022"
          : ""
        : String(listing.yearBuilt),
    parkingSpaces:
      listing?.parkingSpaces === undefined
        ? isNewListing
          ? "2"
          : ""
        : String(listing.parkingSpaces),
    furnished: listing?.furnished ?? isNewListing,
    amenities:
      listing?.amenities?.join(", ") ??
      (isNewListing ? "Swimming pool, Gym, 24/7 security, BQ" : ""),
    country: listing?.address?.country ?? (isNewListing ? "NG" : ""),
    state:
      listing?.address?.state ??
      listing?.address?.subdivision ??
      (isNewListing ? "LA" : ""),
    address:
      listing?.address?.address ??
      listing?.address?.streetAddress ??
      listing?.address?.formatted ??
      (isNewListing ? "12 Admiralty Way" : ""),
    city:
      listing?.address?.city ?? listing?.city ?? (isNewListing ? "Lekki" : ""),
    primaryImage: listing?.primaryImage ?? "",
    gallery:
      listing?.gallery && listing.gallery.length > 0
        ? listing.gallery
        : listing?.primaryImage
          ? [{ url: listing.primaryImage }]
          : [],
  };
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : undefined;
}

function hasRichText(description: string): boolean {
  return (
    description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  );
}

function listingCopyInputFromForm(
  form: ListingFormState,
  countries: CountryOption[],
  states: LocationOption[],
): ListingCopyInput {
  const countryName =
    countries.find((country) => country.code === form.country)?.name ??
    form.country;
  const stateName =
    states.find((state) => (state.iso2 ?? state.name) === form.state)?.name ??
    form.state;
  const location = [form.address, form.city, stateName, countryName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const propertyType =
    PROPERTY_TYPES.find((type) => type.value === form.propertyType)?.label ??
    form.propertyType;
  const furnishing =
    FURNISHING_STATUSES.find((status) => status.value === form.furnishingStatus)
      ?.label ?? form.furnishingStatus;
  const amount = Number(form.price);
  const price = form.price.trim()
    ? `${form.currency} ${Number.isFinite(amount) ? amount.toLocaleString() : form.price.trim()}`
    : "";
  return {
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    location,
    amenities: form.amenities,
    furnishing,
    price,
    propertyType,
    style: "professional",
  };
}

export function ListingForm({
  listing,
  defaultCurrency,
  defaultAreaUnit,
  defaultStatus,
  loading = false,
  onBack,
  onSave,
}: ListingFormProps) {
  const [form, setForm] = useState(() =>
    createInitialState(listing, {
      defaultCurrency,
      defaultAreaUnit,
      defaultStatus,
    }, loading),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>(fallbackCountries);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [writerOpen, setWriterOpen] = useState(false);
  const [writerKey, setWriterKey] = useState(0);
  const isEditing = Boolean(listing?._id);

  const editorLabel = isEditing
    ? "Edit listing details"
    : "Create a new listing";

  useEffect(() => {
    setForm(
      createInitialState(listing, {
        defaultCurrency,
        defaultAreaUnit,
        defaultStatus,
      }, loading),
    );
    setErrors({});
    setSubmitError(null);
  }, [defaultAreaUnit, defaultCurrency, defaultStatus, listing, loading]);

  useEffect(() => {
    if (listing?._id || loading) return;
    let cancelled = false;
    void getSiteOwnerContact()
      .then((owner) => {
        if (cancelled) return;
        setForm((current) => ({
          ...current,
          agentName: current.agentName.trim() ? current.agentName : (owner.name ?? ""),
          agentPhone: current.agentPhone.trim() ? current.agentPhone : (owner.phone ?? ""),
          agentEmail: current.agentEmail.trim() ? current.agentEmail : (owner.email ?? ""),
        }));
      })
      .catch((error) => {
        console.warn("Unable to auto-fill site owner contact.", error);
      });
    return () => {
      cancelled = true;
    };
  }, [listing?._id, loading]);

  useEffect(() => {
    let cancelled = false;
    const loadCountries = async () => {
      try {
        const response = await httpClient.fetchWithAuth(
          `${window.location.origin}/api/locations`,
        );
        if (!response.ok) throw new Error("Countries could not be loaded.");
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data)) {
          const nextCountries = data.filter(isCountryOption);
          if (nextCountries.length > 0) {
            setCountries(nextCountries);
            setForm((current) => {
              const matched = matchCountryCode(nextCountries, current.country);
              return matched && matched !== current.country
                ? { ...current, country: matched }
                : current;
            });
          }
        }
      } catch (error) {
        console.error("Unable to load countries.", error);
        if (!cancelled) setLocationError(true);
      }
    };
    void loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStates([]);
    setCities([]);
    setLocationError(false);
    if (!form.country) {
      setStatesLoading(false);
      setCitiesLoading(false);
      return;
    }

    const loadStates = async () => {
      setStatesLoading(true);
      try {
        const response = await httpClient.fetchWithAuth(
          `${window.location.origin}/api/locations?country=${encodeURIComponent(form.country)}`,
        );
        if (!response.ok) throw new Error("States could not be loaded.");
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data)) {
          const nextStates = data.filter(isLocationOption);
          setStates(nextStates);
          setForm((current) => {
            if (!current.state) return current;
            const matchingState = matchStateOption(nextStates, current.state);
            return matchingState?.iso2 && matchingState.iso2 !== current.state
              ? { ...current, state: matchingState.iso2 }
              : current;
          });
        }
      } catch (error) {
        console.error("Unable to load states.", error);
        if (!cancelled) setLocationError(true);
      } finally {
        if (!cancelled) setStatesLoading(false);
      }
    };
    void loadStates();
    return () => {
      cancelled = true;
    };
  }, [form.country]);

  useEffect(() => {
    if (states.length === 0 || !form.state) return;
    const matchingState = matchStateOption(states, form.state);
    if (matchingState?.iso2 && matchingState.iso2 !== form.state) {
      setForm((current) =>
        current.state === form.state
          ? { ...current, state: matchingState.iso2 ?? current.state }
          : current,
      );
    }
  }, [form.state, states]);

  useEffect(() => {
    let cancelled = false;
    setCities([]);
    if (!form.country || !form.state) {
      setCitiesLoading(false);
      return;
    }

    const loadCities = async () => {
      setCitiesLoading(true);
      try {
        const response = await httpClient.fetchWithAuth(
          `${window.location.origin}/api/locations?country=${encodeURIComponent(form.country)}&state=${encodeURIComponent(form.state)}`,
        );
        if (!response.ok) throw new Error("Cities could not be loaded.");
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data))
          setCities(data.filter(isLocationOption));
      } catch (error) {
        console.error("Unable to load cities.", error);
        if (!cancelled) setLocationError(true);
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    };
    void loadCities();
    return () => {
      cancelled = true;
    };
  }, [form.country, form.state]);

  const chooseImages = async () => {
    try {
      const response = await dashboard.openMediaManager({
        category: "IMAGE",
        multiSelect: true,
      });
      if (!response) return;

      const selectedImages: ListingImage[] = response.items.flatMap((item) => {
        if (!item.url?.trim()) return [];
        const image: ListingImage = { url: item.url.trim() };
        if (item._id?.trim()) image.id = item._id.trim();
        if (item.displayName?.trim()) image.title = item.displayName.trim();
        return [image];
      });
      const existingUrls = new Set(form.gallery.map((image) => image.url));
      const nextGallery = [
        ...form.gallery,
        ...selectedImages.filter((image) => !existingUrls.has(image.url)),
      ];
      update("gallery", nextGallery);
      if (nextGallery[0]) update("primaryImage", nextGallery[0].url);
    } catch (error) {
      console.error("Unable to open the Wix Media Manager.", error);
      dashboard.showToast({
        type: "error",
        message: "The Media Manager could not be opened.",
      });
    }
  };

  const choosePanoramaImages = async () => {
    try {
      const response = await dashboard.openMediaManager({
        category: "IMAGE",
        multiSelect: true,
      });
      if (!response) return;

      const selectedImages: ListingImage[] = response.items.flatMap((item) => {
        if (!item.url?.trim()) return [];
        const image: ListingImage = { url: item.url.trim() };
        if (item._id?.trim()) image.id = item._id.trim();
        if (item.displayName?.trim()) image.title = item.displayName.trim();
        return [image];
      });
      const existingUrls = new Set(form.panoramaImages.map((image) => image.url));
      update("panoramaImages", [
        ...form.panoramaImages,
        ...selectedImages.filter((image) => !existingUrls.has(image.url)),
      ]);
    } catch (error) {
      console.error("Unable to open the Wix Media Manager for panorama images.", error);
      dashboard.showToast({
        type: "error",
        message: "The Media Manager could not be opened.",
      });
    }
  };

  const removePanoramaImage = (index: number) => {
    update(
      "panoramaImages",
      form.panoramaImages.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  const removeImage = (index: number) => {
    const nextGallery = form.gallery.filter(
      (_, imageIndex) => imageIndex !== index,
    );
    update("gallery", nextGallery);
    update("primaryImage", nextGallery[0]?.url ?? "");
  };

  const update = <K extends FormField>(key: K, value: ListingFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim())
      nextErrors.title = "Enter a title for this listing.";
    if (!form.currency.trim() || !/^[a-z]{3}$/i.test(form.currency.trim())) {
      nextErrors.currency = "Use a three-letter currency code.";
    }

    const price = Number(form.price);
    if (!form.price.trim() || !Number.isFinite(price) || price < 0)
      nextErrors.price = "Enter a valid price.";

    const area = Number(form.area);
    if (!form.area.trim() || !Number.isFinite(area) || area < 0)
      nextErrors.area = "Enter a valid area.";
    if (!form.country.trim()) nextErrors.country = "Select a country.";
    if (!form.state.trim()) nextErrors.state = "Select a state or region.";
    if (!form.city.trim()) nextErrors.city = "Enter the city or locality.";
    if (!form.address.trim()) nextErrors.address = "Enter the street address.";
    if (form.agentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.agentEmail.trim())) {
      nextErrors.agentEmail = "Enter a valid email address.";
    }
    if (
      form.agentPhone.trim() &&
      !/^[+()\d\s.-]{7,30}$/.test(form.agentPhone.trim())
    ) {
      nextErrors.agentPhone = "Enter a valid phone number.";
    }

    for (const [key, value] of [
      ["bedrooms", form.bedrooms],
      ["bathrooms", form.bathrooms],
    ] as const) {
      if (value.trim() && optionalNumber(value) === undefined)
        nextErrors[key] = "Enter a valid number.";
    }

    for (const [key, value] of [
      ["yearBuilt", form.yearBuilt],
      ["parkingSpaces", form.parkingSpaces],
    ] as const) {
      const number = optionalNumber(value);
      if (value.trim() && (number === undefined || !Number.isInteger(number))) {
        nextErrors[key] = "Enter a whole number.";
      }
    }

    return nextErrors;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) {
      const messages = Object.values(nextErrors).filter((message): message is string => Boolean(message));
      const first = messages[0] ?? "Fix the highlighted fields before saving.";
      const extraCount = messages.length - 1;
      dashboard.showToast({
        type: "error",
        message: extraCount > 0
          ? `${first} ${extraCount} more ${extraCount === 1 ? "issue needs" : "issues need"} attention.`
          : first,
      });
      return;
    }

    const input: ListingInput = {
      title: form.title.trim(),
      description: hasRichText(form.description) ? form.description : undefined,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      status: form.status,
      price: Number(form.price),
      currency: form.currency.trim().toUpperCase(),
      area: Number(form.area),
      areaUnit: form.areaUnit,
      bedrooms: optionalNumber(form.bedrooms),
      bathrooms: optionalNumber(form.bathrooms),
      yearBuilt: optionalNumber(form.yearBuilt),
      parkingSpaces: optionalNumber(form.parkingSpaces),
      furnished: form.furnishingStatus === "furnished",
      amenities: form.amenities
        .split(",")
        .map((amenity) => amenity.trim())
        .filter(Boolean),
      propertyCondition: form.propertyCondition,
      furnishingStatus: form.furnishingStatus,
      tenure: form.tenure,
      rentalFrequency: form.rentalFrequency,
      availabilityDate: form.availabilityDate
        ? new Date(`${form.availabilityDate}T00:00:00`)
        : undefined,
      serviceCharge: optionalNumber(form.serviceCharge),
      securityDeposit: optionalNumber(form.securityDeposit),
      agentName: form.agentName.trim() || undefined,
      agentPhone: form.agentPhone.trim() || undefined,
      agentEmail: form.agentEmail.trim() || undefined,
      latitude: optionalNumber(form.latitude),
      longitude: optionalNumber(form.longitude),
      panoramaImage: form.panoramaImages[0]?.url,
      panoramaImages: form.panoramaImages.length > 0 ? form.panoramaImages : undefined,
      address: {
        country: form.country.trim(),
        state: form.state.trim(),
        subdivision: form.state.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        streetAddress: form.address.trim(),
        formatted: [
          form.address.trim(),
          form.city.trim(),
          selectedStateName(states, form.state),
          selectedCountryName(countries, form.country),
        ]
          .filter(Boolean)
          .join(", "),
      },
      city: form.city.trim(),
      primaryImage:
        (form.gallery[0]?.url ?? form.primaryImage.trim()) || undefined,
      gallery: form.gallery.length > 0 ? form.gallery : undefined,
    };

    setSaving(true);
    try {
      await onSave(input, listing?._id);
    } catch (saveError) {
      console.error("Unable to save listing.", saveError);
      setSubmitError(
        saveError instanceof Error
          ? saveError.message
          : "The listing could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-52 flex-col items-center justify-center py-16"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading listing</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <form className="space-y-6" onSubmit={submit} noValidate>
      <div>
        <p className="text-sm font-medium text-primary">Listing editor</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {editorLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Capture the facts once, then keep this record ready for future
          AI-assisted publishing.
        </p>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="min-w-0 space-y-6">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Property story</CardTitle>
            <CardDescription>
              Use the editor to add a polished, structured description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text="Title" hint="A concise name that identifies this property." required />
              <Input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
                placeholder="Light-filled three-bedroom townhouse"
              />
              {errors.title ? (
                <span className="block text-xs font-normal text-destructive">
                  {errors.title}
                </span>
              ) : null}
            </label>

            <div className="space-y-2 text-sm font-medium">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel text="Description" hint="Describe the property, layout, finishes, and selling points." />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWriterKey((current) => current + 1);
                    setWriterOpen(true);
                  }}
                >
                  <WandSparkles className="size-4" aria-hidden="true" />
                  Write with AI
                </Button>
              </div>
              <div className="listing-rich-editor overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30">
                <Suspense
                  fallback={
                    <div className="min-h-52 p-4 text-sm text-muted-foreground">
                      Loading editor…
                    </div>
                  }
                >
                  <RichTextEditor
                    value={form.description}
                    onChange={(value) => update("description", value)}
                  />
                </Suspense>
              </div>
              <p className="text-xs font-normal text-muted-foreground">
                Full formatting includes fonts, sizes, headings, emphasis,
                colors, alignment, lists, indentation, quotes, code, and links.
                Add images in the listing gallery below.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldSelect
                label="Country"
                value={form.country}
                onValueChange={(value) => {
                  update("country", value);
                  update("state", "");
                  update("city", "");
                }}
                options={countries.map((country) => ({
                  value: country.code,
                  label: country.name,
                }))}
                error={errors.country}
              />
              <FieldSelect
                label="State / region"
                value={form.state}
                onValueChange={(value) => {
                  update("state", value);
                  update("city", "");
                }}
                options={stateSelectOptions(states, form.state)}
                disabled={!form.country || statesLoading}
                error={errors.state}
              />
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="Address" hint="Enter the street address or property location details." required />
                <Textarea
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Street address or neighborhood"
                  rows={3}
                />
                {errors.address ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.address}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="City" hint="Choose a suggested city or enter one manually." required />
                <Input
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  aria-invalid={Boolean(errors.city)}
                  placeholder={
                    citiesLoading
                      ? "Loading cities…"
                      : "Enter or select a city"
                  }
                  list="listing-city-options"
                  disabled={!form.state || citiesLoading}
                />
                <datalist id="listing-city-options">
                  {cities.map((city) => (
                    <option key={city.id ?? city.name} value={city.name} />
                  ))}
                </datalist>
                {locationError ? (
                  <span className="block text-xs font-normal text-muted-foreground">
                    Location suggestions are unavailable. Enter the city
                    manually.
                  </span>
                ) : null}
                {errors.city ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.city}
                  </span>
                ) : null}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Listing images</CardTitle>
            <CardDescription>
              Choose photos from your Wix Media Manager. The first image is the cover.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center justify-between gap-3">
                <div>
                <FieldLabel text="Listing images" hint="Choose images from Wix Media Manager; the first image is the cover." />
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    Choose multiple images from your Wix Media Manager. The
                    first image is used as the cover.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void chooseImages()}
                >
                  <ImagePlus className="size-4" aria-hidden="true" /> Add images
                </Button>
              </div>
              {form.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.gallery.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="group relative overflow-hidden rounded-xl border bg-muted/20"
                    >
                      <img
                        src={image.url}
                        alt={image.title ?? `Listing image ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 p-1.5 text-white">
                        <span className="truncate text-[11px]">
                          {index === 0 ? "Cover image" : `Image ${index + 1}`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-white hover:bg-white/20 hover:text-white"
                          onClick={() => removeImage(index)}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-normal text-muted-foreground">
                  No images selected yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>360° virtual tour</CardTitle>
            <CardDescription>
              Add equirectangular 360° photos for the interactive Three.js viewer. Visitors can switch between rooms and viewpoints.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm font-medium">
            <div className="flex items-center justify-between gap-3">
              <div>
                <FieldLabel
                  text="360° panorama images"
                  hint="Choose equirectangular 360° images for the interactive Three.js viewer. Visitors can switch between scenes."
                />
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Optional. Each image should be an equirectangular 360° photo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void choosePanoramaImages()}
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {form.panoramaImages.length > 0 ? "Add images" : "Choose images"}
              </Button>
            </div>
            {form.panoramaImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.panoramaImages.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="group relative overflow-hidden rounded-xl border bg-muted/20"
                  >
                    <img
                      src={image.url}
                      alt={image.title ?? `360° panorama ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 p-1.5 text-white">
                      <span className="truncate text-[11px]">
                        {image.title ?? `Scene ${index + 1}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-white hover:bg-white/20 hover:text-white"
                        onClick={() => removePanoramaImage(index)}
                        aria-label={`Remove panorama ${index + 1}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-normal text-muted-foreground">
                No 360° panoramas selected.
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Listing facts</CardTitle>
            <CardDescription>
              These fields power filters and portfolio analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldSelect
              label="Transaction type"
              value={form.transactionType}
              onValueChange={(value) => {
                if (isTransactionType(value)) update("transactionType", value);
              }}
              options={TRANSACTION_TYPES}
            />
            <FieldSelect
              label="Property type"
              value={form.propertyType}
              onValueChange={(value) => {
                if (isPropertyType(value)) update("propertyType", value);
              }}
              options={PROPERTY_TYPES}
            />
            <FieldSelect
              label="Status"
              value={form.status}
              onValueChange={(value) => {
                if (isListingStatus(value)) update("status", value);
              }}
              options={LISTING_STATUSES}
            />
            <FieldSelect
              label="Property condition"
              value={form.propertyCondition}
              onValueChange={(value) => {
                if (isPropertyCondition(value))
                  update("propertyCondition", value);
              }}
              options={PROPERTY_CONDITIONS}
            />
            <FieldSelect
              label="Furnishing status"
              value={form.furnishingStatus}
              onValueChange={(value) => {
                if (isFurnishingStatus(value))
                  update("furnishingStatus", value);
              }}
              options={FURNISHING_STATUSES}
            />
            <FieldSelect
              label="Tenure"
              value={form.tenure}
              onValueChange={(value) => {
                if (isTenureType(value)) update("tenure", value);
              }}
              options={TENURE_TYPES}
            />
            <FieldSelect
              label="Rental frequency"
              value={form.rentalFrequency}
              onValueChange={(value) => {
                if (isRentalFrequency(value)) update("rentalFrequency", value);
              }}
              options={RENTAL_FREQUENCIES}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="Price" hint="The listing price in the selected currency." required />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  aria-invalid={Boolean(errors.price)}
                  placeholder="0"
                />
                {errors.price ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.price}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="Currency" hint="The three-letter currency used for the listing price." required />
                <Select
                  value={form.currency}
                  onValueChange={(value) => update("currency", value)}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Currency"
                    aria-invalid={Boolean(errors.currency)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.currency}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="Area" hint="The property size in the selected area unit." required />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.area}
                  onChange={(event) => update("area", event.target.value)}
                  aria-invalid={Boolean(errors.area)}
                  placeholder="0"
                />
                {errors.area ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.area}
                  </span>
                ) : null}
              </label>
              <FieldSelect
                label="Area unit"
                value={form.areaUnit}
                onValueChange={(value) => update("areaUnit", value)}
                options={AREA_UNITS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <OptionalNumberField
                label="Bedrooms"
                value={form.bedrooms}
                error={errors.bedrooms}
                onChange={(value) => update("bedrooms", value)}
              />
              <OptionalNumberField
                label="Bathrooms"
                value={form.bathrooms}
                error={errors.bathrooms}
                onChange={(value) => update("bathrooms", value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OptionalNumberField
                label="Year built"
                value={form.yearBuilt}
                error={errors.yearBuilt}
                onChange={(value) => update("yearBuilt", value)}
              />
              <OptionalNumberField
                label="Parking spaces"
                value={form.parkingSpaces}
                error={errors.parkingSpaces}
                onChange={(value) => update("parkingSpaces", value)}
              />
            </div>

            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text="Amenities" hint="List notable features separated by commas." />
              <Input
                value={form.amenities}
                onChange={(event) => update("amenities", event.target.value)}
                placeholder="Swimming pool, gym, 24/7 security"
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Separate amenities with commas.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text="Availability date" hint="The date when the property becomes available." />
                <Input
                  type="date"
                  value={form.availabilityDate}
                  onChange={(event) =>
                    update("availabilityDate", event.target.value)
                  }
                />
              </label>
              <OptionalNumberField
                label="Service charge"
                value={form.serviceCharge}
                error={errors.serviceCharge}
                onChange={(value) => update("serviceCharge", value)}
              />
              <OptionalNumberField
                label="Security deposit"
                value={form.securityDeposit}
                error={errors.securityDeposit}
                onChange={(value) => update("securityDeposit", value)}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <div>
                <p className="text-sm font-medium">Agent / owner contact</p>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Optional contact details for this listing.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text="Name" hint="The agent or owner responsible for this listing." />
                  <Input
                    value={form.agentName}
                    onChange={(event) =>
                      update("agentName", event.target.value)
                    }
                    placeholder="Agent or owner name"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text="Phone" hint="A phone number for listing enquiries." />
                  <Input
                    type="tel"
                    value={form.agentPhone}
                    onChange={(event) =>
                      update("agentPhone", event.target.value)
                    }
                    placeholder="International phone number"
                    aria-invalid={Boolean(errors.agentPhone)}
                  />
                  {errors.agentPhone ? (
                    <span className="block text-xs font-normal text-destructive">
                      {errors.agentPhone}
                    </span>
                  ) : null}
                </label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">
                  <FieldLabel text="Email" hint="An email address for listing enquiries." />
                  <Input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.agentEmail}
                    onChange={(event) =>
                      update("agentEmail", event.target.value)
                    }
                    placeholder="agent@example.com"
                    aria-invalid={Boolean(errors.agentEmail)}
                  />
                  {errors.agentEmail ? (
                    <span className="block text-xs font-normal text-destructive">
                      {errors.agentEmail}
                    </span>
                  ) : null}
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <div>
                <p className="text-sm font-medium">Map location</p>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Add coordinates so the property can be placed on the map.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text="Latitude" hint="The property latitude used for map placement." />
                  <Input
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={form.latitude}
                    onChange={(event) => update("latitude", event.target.value)}
                    placeholder="e.g. 40.7128"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text="Longitude" hint="The property longitude used for map placement." />
                  <Input
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={form.longitude}
                    onChange={(event) =>
                      update("longitude", event.target.value)
                    }
                    placeholder="e.g. -74.0060"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> AI
        fields are reserved for future generation workflows.
      </div>

      <div className="sticky bottom-0 z-20 -mx-6 -mb-6 flex flex-wrap justify-end gap-2 border-t border-border/70 bg-background/95 px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,.04)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button type="button" variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            "Saving…"
          ) : (
            <>
              <Save className="size-4" aria-hidden="true" /> Save listing
            </>
          )}
        </Button>
      </div>
    </form>
    <Dialog open={writerOpen} onOpenChange={setWriterOpen}>
      <DialogContent
        overlayClassName="z-[80]"
        className="z-[80] max-h-[90vh] max-w-5xl"
      >
        <DialogHeader>
          <DialogTitle>AI writer</DialogTitle>
          <DialogDescription>
            Facts from this listing are filled in for you. When writing finishes, the description on the form updates automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AIWriterPanel
            key={writerKey}
            initialInput={listingCopyInputFromForm(form, countries, states)}
            showShare={false}
            onDescriptionReady={(copy) => {
              update("description", htmlFromPlainDescription(copy));
            }}
            onGenerated={() => {
              dashboard.showToast({
                type: "success",
                message: "The listing description was updated.",
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}

function FieldSelect<T extends string>({
  label,
  value,
  onValueChange,
  options,
  error,
  disabled,
}: {
  label: string;
  value: T;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  error?: string;
  disabled?: boolean;
}) {
  const hint = FIELD_HINTS[label] ?? `Choose the ${label.toLowerCase()} for this listing.`;
  return (
    <label className="block space-y-2 text-sm font-medium">
      <FieldLabel text={label} hint={hint} />
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger aria-label={label} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <span className="block text-xs font-normal text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function isLocationOption(value: unknown): value is LocationOption {
  if (typeof value !== "object" || value === null) return false;
  const option = value as Record<string, unknown>;
  return typeof option.name === "string";
}

function isCountryOption(value: unknown): value is CountryOption {
  if (typeof value !== "object" || value === null) return false;
  const option = value as Record<string, unknown>;
  return typeof option.code === "string" && typeof option.name === "string";
}

function matchCountryCode(countries: CountryOption[], value: string): string | undefined {
  const selected = value.trim().toLowerCase();
  if (!selected) return undefined;
  const match = countries.find(
    (country) =>
      country.code.toLowerCase() === selected ||
      country.name.toLowerCase() === selected,
  );
  return match?.code;
}

function matchStateOption(
  states: LocationOption[],
  value: string,
): LocationOption | undefined {
  const selected = value.trim().toLowerCase();
  if (!selected) return undefined;
  const withoutState = selected.replace(/\s+state$/, "");
  const suffix = selected.includes("-") ? selected.split("-").at(-1) : selected;
  return states.find((state) => {
    const code = state.iso2?.toLowerCase();
    const name = state.name.toLowerCase();
    const nameBare = name.replace(/\s+state$/, "");
    return (
      code === selected ||
      code === suffix ||
      code === withoutState ||
      name === selected ||
      nameBare === withoutState ||
      name === withoutState
    );
  });
}

function stateSelectOptions(
  states: LocationOption[],
  selected: string,
): Array<{ value: string; label: string }> {
  const options = states.flatMap((option) =>
    option.iso2 ? [{ value: option.iso2, label: option.name }] : [],
  );
  if (selected && !options.some((option) => option.value === selected)) {
    const matched = matchStateOption(states, selected);
    options.unshift({
      value: selected,
      label: matched?.name ?? selected,
    });
  }
  return options;
}

function selectedStateName(states: LocationOption[], value: string): string {
  return states.find((state) => state.iso2 === value)?.name ?? value;
}

function selectedCountryName(
  countryOptions: CountryOption[],
  value: string,
): string {
  return (
    countryOptions.find((country) => country.code === value)?.name ??
    fallbackCountries.find((country) => country.code === value)?.name ??
    value
  );
}

function OptionalNumberField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <FieldLabel text={label} hint={`Optional ${label.toLowerCase()} value for this listing.`} />
      <Input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        placeholder="Optional"
      />
      {error ? (
        <span className="block text-xs font-normal text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const FIELD_HINTS: Record<string, string> = {
  "Transaction type": "Whether the property is for sale, rent, or lease.",
  "Property type": "The category that best describes the property.",
  Status: "The current workflow stage for this listing.",
  "Property condition": "The current physical condition of the property.",
  "Furnishing status": "Whether the property is unfurnished, partly furnished, or furnished.",
  Tenure: "The ownership or lease arrangement for the property.",
  "Rental frequency": "How often rent is expected for rental or lease listings.",
  Country: "The country where the property is located.",
  "State / region": "The state, province, or region where the property is located.",
  "Area unit": "The unit used to measure the property area.",
};

function FieldLabel({
  text,
  hint,
  required = false,
}: {
  text: string;
  hint: string;
  required?: boolean;
}) {
  return (
    <span className="flex items-center gap-1">
      {text}
      {required ? <span className="text-destructive">*</span> : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-4 items-center justify-center rounded-full text-xs text-muted-foreground hover:text-foreground"
            aria-label={`Help: ${hint}`}
            onClick={(event) => event.stopPropagation()}
          >
            <span aria-hidden="true">?</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    </span>
  );
}
