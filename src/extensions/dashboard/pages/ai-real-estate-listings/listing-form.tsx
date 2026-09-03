import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
import { useDashboardI18n, useDt } from "@/lib/dashboard-i18n";
import {
  AREA_UNIT_MESSAGE_KEYS,
  CONDITION_MESSAGE_KEYS,
  FURNISHING_MESSAGE_KEYS,
  PROPERTY_TYPE_MESSAGE_KEYS,
  RENTAL_MESSAGE_KEYS,
  STATUS_MESSAGE_KEYS,
  TENURE_MESSAGE_KEYS,
  TRANSACTION_MESSAGE_KEYS,
} from "@/lib/dashboard-i18n/labels";
import type { AreaUnit } from "@/lib/listing-types";
import { AIWriterPanel } from "./ai-writer-panel";
import { useEntitlement } from "./entitlement-context";

const RichTextEditor = lazy(() =>
  import("./rich-text-editor").then((module) => ({
    default: module.RichTextEditor,
  })),
);

const API_ORIGIN = new URL(import.meta.url).origin;

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
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    transactionType: listing?.transactionType ?? "sale",
    propertyType: listing?.propertyType ?? "house",
    status: listing?.status ?? defaults.defaultStatus,
    price: listing ? String(listing.price) : "875000",
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
          ? "350"
          : ""
        : String(listing.serviceCharge),
    securityDeposit:
      listing?.securityDeposit === undefined
        ? isNewListing
          ? "8750"
          : ""
        : String(listing.securityDeposit),
    agentName: listing?.agentName ?? "",
    agentPhone: listing?.agentPhone ?? "",
    agentEmail: listing?.agentEmail ?? "",
    latitude:
      listing?.latitude === undefined
        ? isNewListing
          ? "30.2672"
          : ""
        : String(listing.latitude),
    longitude:
      listing?.longitude === undefined
        ? isNewListing
          ? "-97.7431"
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
    amenities: listing?.amenities?.join(", ") ?? "",
    country:
      matchCountryCode(
        fallbackCountries,
        listing?.address?.country ?? (isNewListing ? "US" : ""),
      ) ??
      listing?.address?.country ??
      (isNewListing ? "US" : ""),
    state:
      listing?.address?.state ??
      listing?.address?.subdivision ??
      (isNewListing ? "TX" : ""),
    address:
      listing?.address?.address ??
      listing?.address?.streetAddress ??
      listing?.address?.formatted ??
      (isNewListing ? "412 Maple Street" : ""),
    city:
      listing?.address?.city ?? listing?.city ?? (isNewListing ? "Austin" : ""),
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
  translate: ReturnType<typeof useDt>,
  locale: string,
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
  const propertyType = translate(
    PROPERTY_TYPE_MESSAGE_KEYS[form.propertyType],
  );
  const furnishing = translate(
    FURNISHING_MESSAGE_KEYS[form.furnishingStatus],
  );
  const amount = Number(form.price);
  const price = form.price.trim()
    ? `${form.currency} ${Number.isFinite(amount) ? amount.toLocaleString(locale) : form.price.trim()}`
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
  const entitlement = useEntitlement();
  const t = useDt();
  const { locale } = useDashboardI18n();
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
  const [, setStatesLoading] = useState(false);
  const [, setCitiesLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [writerOpen, setWriterOpen] = useState(false);
  const [writerKey, setWriterKey] = useState(0);
  const isEditing = Boolean(listing?._id);

  const editorLabel = isEditing ? t("editListingDetails") : t("createListing");

  const transactionOptions = useMemo(
    () =>
      TRANSACTION_TYPES.map((option) => ({
        value: option.value,
        label: t(TRANSACTION_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const propertyTypeOptions = useMemo(
    () =>
      PROPERTY_TYPES.map((option) => ({
        value: option.value,
        label: t(PROPERTY_TYPE_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const statusOptions = useMemo(
    () =>
      LISTING_STATUSES.map((option) => ({
        value: option.value,
        label: t(STATUS_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const conditionOptions = useMemo(
    () =>
      PROPERTY_CONDITIONS.map((option) => ({
        value: option.value,
        label: t(CONDITION_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const furnishingOptions = useMemo(
    () =>
      FURNISHING_STATUSES.map((option) => ({
        value: option.value,
        label: t(FURNISHING_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const tenureOptions = useMemo(
    () =>
      TENURE_TYPES.map((option) => ({
        value: option.value,
        label: t(TENURE_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const rentalOptions = useMemo(
    () =>
      RENTAL_FREQUENCIES.map((option) => ({
        value: option.value,
        label: t(RENTAL_MESSAGE_KEYS[option.value]),
      })),
    [t],
  );
  const areaUnitOptions = useMemo(
    () =>
      AREA_UNITS.map((option) => ({
        value: option.value,
        label: t(AREA_UNIT_MESSAGE_KEYS[option.value as AreaUnit]),
      })),
    [t],
  );

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
    setForm((current) => {
      const needsTitle = !current.title.trim();
      const needsDescription = !current.description.trim();
      const needsAmenities = !current.amenities.trim();
      if (!needsTitle && !needsDescription && !needsAmenities) return current;
      return {
        ...current,
        title: needsTitle ? t("sampleListingTitle") : current.title,
        description: needsDescription ? t("sampleListingDescription") : current.description,
        amenities: needsAmenities ? t("sampleAmenities") : current.amenities,
      };
    });
    // Seed sample copy once for new listings; omit `t` so language changes do not reset edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?._id, loading]);

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
          `${API_ORIGIN}/api/locations`,
        );
        if (!response.ok) throw new Error("location-countries");
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
    if (!form.country) {
      setStates([]);
      setCities([]);
      setStatesLoading(false);
      setCitiesLoading(false);
      return;
    }

    const loadStates = async () => {
      setStatesLoading(true);
      setLocationError(false);
      try {
        const response = await httpClient.fetchWithAuth(
          `${API_ORIGIN}/api/locations?country=${encodeURIComponent(form.country)}`,
        );
        if (!response.ok) throw new Error("location-states");
        const data = (await response.json()) as unknown;
        if (cancelled) return;
        if (Array.isArray(data)) {
          const nextStates = data.filter(isLocationOption);
          setStates(nextStates);
          setForm((current) => {
            if (!current.state) return current;
            const matchingState = matchStateOption(nextStates, current.state);
            const nextValue = matchingState?.iso2 ?? matchingState?.name;
            return nextValue && nextValue !== current.state
              ? { ...current, state: nextValue }
              : current;
          });
        }
      } catch (error) {
        console.error("Unable to load states.", error);
        if (!cancelled) setLocationError(true);
      } finally {
        setStatesLoading(false);
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
    const nextValue = matchingState?.iso2 ?? matchingState?.name;
    if (nextValue && nextValue !== form.state) {
      setForm((current) =>
        current.state === form.state
          ? { ...current, state: nextValue }
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
          `${API_ORIGIN}/api/locations?country=${encodeURIComponent(form.country)}&state=${encodeURIComponent(form.state)}`,
        );
        if (!response.ok) throw new Error("location-cities");
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
        message: t("mediaManagerFailed"),
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
        message: t("mediaManagerFailed"),
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
    if (!form.title.trim()) nextErrors.title = t("enterTitle");
    if (!form.currency.trim() || !/^[a-z]{3}$/i.test(form.currency.trim())) {
      nextErrors.currency = t("currencyCodeError");
    }

    const price = Number(form.price);
    if (!form.price.trim() || !Number.isFinite(price) || price < 0)
      nextErrors.price = t("enterValidPrice");

    const area = Number(form.area);
    if (!form.area.trim() || !Number.isFinite(area) || area < 0)
      nextErrors.area = t("enterValidArea");
    if (!form.country.trim()) nextErrors.country = t("selectCountry");
    if (!form.state.trim()) nextErrors.state = t("selectState");
    if (!form.city.trim()) nextErrors.city = t("enterCityError");
    if (!form.address.trim()) nextErrors.address = t("enterAddressError");
    if (form.agentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.agentEmail.trim())) {
      nextErrors.agentEmail = t("validEmail");
    }
    if (
      form.agentPhone.trim() &&
      !/^[+()\d\s.-]{7,30}$/.test(form.agentPhone.trim())
    ) {
      nextErrors.agentPhone = t("validPhone");
    }

    for (const [key, value] of [
      ["bedrooms", form.bedrooms],
      ["bathrooms", form.bathrooms],
    ] as const) {
      if (value.trim() && optionalNumber(value) === undefined)
        nextErrors[key] = t("validNumber");
    }

    for (const [key, value] of [
      ["yearBuilt", form.yearBuilt],
      ["parkingSpaces", form.parkingSpaces],
    ] as const) {
      const number = optionalNumber(value);
      if (value.trim() && (number === undefined || !Number.isInteger(number))) {
        nextErrors[key] = t("wholeNumber");
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
      dashboard.showToast({
        type: "error",
        message: messages[0] ?? t("formInvalid"),
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
          : t("listingSaveFailed"),
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
        <span className="sr-only">{t("loadingListing")}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit} noValidate>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain py-6">
      <div>
        <p className="text-sm font-medium text-primary">{t("listingEditorEyebrow")}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {editorLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("listingEditorIntro")}
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
            <CardTitle>{t("propertyStory")}</CardTitle>
            <CardDescription>{t("propertyStoryHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t("title")} hint={t("titleHint")} required />
              <Input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
                placeholder={t("titlePlaceholder")}
              />
              {errors.title ? (
                <span className="block text-xs font-normal text-destructive">
                  {errors.title}
                </span>
              ) : null}
            </label>

            <div className="space-y-2 text-sm font-medium">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel text={t("description")} hint={t("descriptionHint")} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!entitlement.features.aiWriter) return;
                    setWriterKey((current) => current + 1);
                    setWriterOpen(true);
                  }}
                  disabled={!entitlement.features.aiWriter}
                >
                  <WandSparkles className="size-4" aria-hidden="true" />
                  {entitlement.features.aiWriter ? t("writeWithAi") : t("writeWithAiPro")}
                </Button>
              </div>
              <div className="listing-rich-editor overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30">
                <Suspense
                  fallback={
                    <div className="min-h-52 p-4 text-sm text-muted-foreground">
                      {t("loadingEditor")}
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
                {t("descriptionFormatHint")}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldSelect
                label={t("country")}
                hint={t("countryHint")}
                value={form.country}
                onValueChange={(value) => {
                  update("country", value);
                  update("state", "");
                  update("city", "");
                }}
                options={countrySelectOptions(countries, form.country)}
                error={errors.country}
              />
              <FieldSelect
                label={t("state")}
                hint={t("stateHint")}
                value={form.state}
                onValueChange={(value) => {
                  update("state", value);
                  update("city", "");
                }}
                options={stateSelectOptions(states, form.state)}
                disabled={!form.country}
                error={errors.state}
              />
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text={t("address")} hint={t("addressHint")} required />
                <Input
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  aria-invalid={Boolean(errors.address)}
                  placeholder={t("addressPlaceholder")}
                />
                {errors.address ? (
                  <span className="block text-xs font-normal text-destructive">
                    {errors.address}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text={t("city")} hint={t("cityHint")} required />
                <Input
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  aria-invalid={Boolean(errors.city)}
                  placeholder={t("cityPlaceholder")}
                  list="listing-city-options"
                />
                <datalist id="listing-city-options">
                  {cities.map((city) => (
                    <option key={city.id ?? city.name} value={city.name} />
                  ))}
                </datalist>
                {locationError ? (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t("locationUnavailable")}
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
            <CardTitle>{t("listingImages")}</CardTitle>
            <CardDescription>{t("listingImagesCardHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center justify-between gap-3">
                <div>
                <FieldLabel text={t("listingImages")} hint={t("listingImagesHint")} />
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {t("listingImagesMultiHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void chooseImages()}
                >
                  <ImagePlus className="size-4" aria-hidden="true" /> {t("addImages")}
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
                        alt={image.title ?? t("listingImageAlt", { n: index + 1 })}
                        className="aspect-square w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 p-1.5 text-white">
                        <span className="truncate text-[11px]">
                          {index === 0 ? t("coverImage") : t("imageN", { n: index + 1 })}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-white hover:bg-white/20 hover:text-white"
                          onClick={() => removeImage(index)}
                          aria-label={t("removeImage", { n: index + 1 })}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-normal text-muted-foreground">
                  {t("noImagesYet")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>{t("virtualTour")}</CardTitle>
            <CardDescription>
              {t("virtualTourHint")}
              {!entitlement.features.virtualTour
                ? ` ${t("virtualTourLocked")}`
                : entitlement.features.multiSceneTour
                  ? ` ${t("virtualTourScenes")}`
                  : ` ${t("virtualTourPro")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm font-medium">
            <div className="flex items-center justify-between gap-3">
              <div>
                <FieldLabel text={t("panoramaImages")} hint={t("panoramaHint")} />
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {t("panoramaOptional")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void choosePanoramaImages()}
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {form.panoramaImages.length > 0 ? t("addImages") : t("chooseImages")}
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
                      alt={image.title ?? t("sceneN", { n: index + 1 })}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 p-1.5 text-white">
                      <span className="truncate text-[11px]">
                        {image.title ?? t("sceneN", { n: index + 1 })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-white hover:bg-white/20 hover:text-white"
                        onClick={() => removePanoramaImage(index)}
                        aria-label={t("removePanorama", { n: index + 1 })}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-normal text-muted-foreground">
                {t("noPanoramas")}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>{t("listingFacts")}</CardTitle>
            <CardDescription>{t("listingFactsHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldSelect
              label={t("transactionType")}
              hint={t("transactionHint")}
              value={form.transactionType}
              onValueChange={(value) => {
                if (isTransactionType(value)) update("transactionType", value);
              }}
              options={transactionOptions}
            />
            <FieldSelect
              label={t("propertyType")}
              hint={t("propertyTypeHint")}
              value={form.propertyType}
              onValueChange={(value) => {
                if (isPropertyType(value)) update("propertyType", value);
              }}
              options={propertyTypeOptions}
            />
            <FieldSelect
              label={t("status")}
              hint={t("statusHint")}
              value={form.status}
              onValueChange={(value) => {
                if (isListingStatus(value)) update("status", value);
              }}
              options={statusOptions}
            />
            <FieldSelect
              label={t("propertyCondition")}
              hint={t("propertyConditionHint")}
              value={form.propertyCondition}
              onValueChange={(value) => {
                if (isPropertyCondition(value))
                  update("propertyCondition", value);
              }}
              options={conditionOptions}
            />
            <FieldSelect
              label={t("furnishingStatus")}
              hint={t("furnishingHint")}
              value={form.furnishingStatus}
              onValueChange={(value) => {
                if (isFurnishingStatus(value))
                  update("furnishingStatus", value);
              }}
              options={furnishingOptions}
            />
            <FieldSelect
              label={t("tenure")}
              hint={t("tenureHint")}
              value={form.tenure}
              onValueChange={(value) => {
                if (isTenureType(value)) update("tenure", value);
              }}
              options={tenureOptions}
            />
            <FieldSelect
              label={t("rentalFrequency")}
              hint={t("rentalHint")}
              value={form.rentalFrequency}
              onValueChange={(value) => {
                if (isRentalFrequency(value)) update("rentalFrequency", value);
              }}
              options={rentalOptions}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text={t("price")} hint={t("priceHint")} required />
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
                <FieldLabel text={t("currency")} hint={t("currencyHint")} required />
                <Select
                  value={form.currency}
                  onValueChange={(value) => update("currency", value)}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={t("currency")}
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
                <FieldLabel text={t("area")} hint={t("areaHint")} required />
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
                label={t("areaUnit")}
                hint={t("areaUnitHint")}
                value={form.areaUnit}
                onValueChange={(value) => update("areaUnit", value)}
                options={areaUnitOptions}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <OptionalNumberField
                label={t("bedrooms")}
                value={form.bedrooms}
                error={errors.bedrooms}
                onChange={(value) => update("bedrooms", value)}
              />
              <OptionalNumberField
                label={t("bathrooms")}
                value={form.bathrooms}
                error={errors.bathrooms}
                onChange={(value) => update("bathrooms", value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OptionalNumberField
                label={t("yearBuilt")}
                value={form.yearBuilt}
                error={errors.yearBuilt}
                onChange={(value) => update("yearBuilt", value)}
              />
              <OptionalNumberField
                label={t("parkingSpaces")}
                value={form.parkingSpaces}
                error={errors.parkingSpaces}
                onChange={(value) => update("parkingSpaces", value)}
              />
            </div>

            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t("amenities")} hint={t("amenitiesHint")} />
              <Input
                value={form.amenities}
                onChange={(event) => update("amenities", event.target.value)}
                placeholder={t("amenitiesPlaceholder")}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <FieldLabel text={t("availabilityDate")} hint={t("availabilityHint")} />
                <Input
                  type="date"
                  value={form.availabilityDate}
                  onChange={(event) =>
                    update("availabilityDate", event.target.value)
                  }
                />
              </label>
              <OptionalNumberField
                label={t("serviceCharge")}
                value={form.serviceCharge}
                error={errors.serviceCharge}
                onChange={(value) => update("serviceCharge", value)}
              />
              <OptionalNumberField
                label={t("securityDeposit")}
                value={form.securityDeposit}
                error={errors.securityDeposit}
                onChange={(value) => update("securityDeposit", value)}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <div>
                <p className="text-sm font-medium">{t("agentContact")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text={t("agentName")} hint={t("agentNameHint")} />
                  <Input
                    value={form.agentName}
                    onChange={(event) =>
                      update("agentName", event.target.value)
                    }
                    placeholder={t("agentNamePlaceholder")}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text={t("agentPhone")} hint={t("agentPhoneHint")} />
                  <Input
                    type="tel"
                    value={form.agentPhone}
                    onChange={(event) =>
                      update("agentPhone", event.target.value)
                    }
                    placeholder={t("agentPhonePlaceholder")}
                    aria-invalid={Boolean(errors.agentPhone)}
                  />
                  {errors.agentPhone ? (
                    <span className="block text-xs font-normal text-destructive">
                      {errors.agentPhone}
                    </span>
                  ) : null}
                </label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">
                  <FieldLabel text={t("agentEmail")} hint={t("agentEmailHint")} />
                  <Input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.agentEmail}
                    onChange={(event) =>
                      update("agentEmail", event.target.value)
                    }
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
                <p className="text-sm font-medium">{t("mapPlacement")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text={t("latitude")} hint={t("latitudeHint")} />
                  <Input
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={form.latitude}
                    onChange={(event) => update("latitude", event.target.value)}
                    placeholder="40.7128"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <FieldLabel text={t("longitude")} hint={t("longitudeHint")} />
                  <Input
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={form.longitude}
                    onChange={(event) =>
                      update("longitude", event.target.value)
                    }
                    placeholder="-74.0060"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="size-3.5 text-emerald-600" aria-hidden="true" />{" "}
        {t("aiFieldsReserved")}
      </div>
      </div>

      <div className="shrink-0 -mx-6 flex flex-wrap justify-end gap-2 border-t border-border/70 bg-background px-6 py-4">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            t("saving")
          ) : (
            <>
              <Save className="size-4" aria-hidden="true" /> {t("saveListing")}
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
          <DialogTitle>{t("aiWriterDialog")}</DialogTitle>
          <DialogDescription>{t("aiWriterDialogHint")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AIWriterPanel
            key={writerKey}
            initialInput={listingCopyInputFromForm(form, countries, states, t, locale)}
            showShare={false}
            onDescriptionReady={(copy) => {
              update("description", htmlFromPlainDescription(copy));
            }}
            onGenerated={() => {
              dashboard.showToast({
                type: "success",
                message: t("descriptionUpdated"),
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
    </div>
    </TooltipProvider>
  );
}

function FieldSelect<T extends string>({
  label,
  hint,
  value,
  onValueChange,
  options,
  error,
  disabled,
}: {
  label: string;
  hint: string;
  value: T;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  error?: string;
  disabled?: boolean;
}) {
  const t = useDt();
  return (
    <label className="block space-y-2 text-sm font-medium">
      <FieldLabel text={label} hint={hint} />
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-label={label} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={t("selectLabel", { label })} />
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

function countrySelectOptions(
  countries: CountryOption[],
  selected: string,
): Array<{ value: string; label: string }> {
  const options = countries.map((country) => ({
    value: country.code,
    label: country.name,
  }));
  if (selected && !options.some((option) => option.value === selected)) {
    const matched = matchCountryCode(countries, selected);
    options.unshift({
      value: selected,
      label:
        countries.find((country) => country.code === matched)?.name ?? selected,
    });
  }
  return options;
}

function stateSelectOptions(
  states: LocationOption[],
  selected: string,
): Array<{ value: string; label: string }> {
  const options = states.map((option) => ({
    value: option.iso2 ?? option.name,
    label: option.name,
  }));
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
  const t = useDt();
  return (
    <label className="space-y-2 text-sm font-medium">
      <FieldLabel text={label} hint={t("optionalValueHint", { label })} />
      <Input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        placeholder={t("optionalPlaceholder")}
      />
      {error ? (
        <span className="block text-xs font-normal text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FieldLabel({
  text,
  hint,
  required = false,
}: {
  text: string;
  hint: string;
  required?: boolean;
}) {
  const t = useDt();
  return (
    <span className="flex items-center gap-1">
      {text}
      {required ? (
        <span className="text-destructive" aria-label={t("required")}>
          *
        </span>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-4 items-center justify-center rounded-full text-xs text-muted-foreground hover:text-foreground"
            aria-label={t("helpPrefix", { hint })}
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
