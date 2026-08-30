import {
  isAreaUnit,
  isPropertyCondition,
  isFurnishingStatus,
  isTenureType,
  isRentalFrequency,
  isListingStatus,
  isPropertyType,
  isTransactionType,
  type ListingInput,
} from "@/lib/listing-types";

export interface ValidationResult<T> {
  value?: T;
  errors: string[];
}

/**
 * Quill uses a few presentation classes and data attributes that are not part
 * of Wix RICH_TEXT's supported HTML shape. Keep the editor's rich formatting,
 * but persist it as portable HTML that Wix can render consistently.
 */
export function normalizeRichText(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|meta|link)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|meta|link)(?:\s[^>]*)?\s*\/?\s*>/gi, "")
    .replace(/\s+on[a-z-]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<span\s+class="ql-ui"[^>]*><\/span>/gi, "")
    .replace(/\sclass="[^"]*\bql-align-(left|center|right|justify)\b[^"]*"/gi, ' style="text-align:$1"')
    .replace(/\sclass="[^"]*\bql-font-serif\b[^"]*"/gi, ' style="font-family:serif"')
    .replace(/\sclass="[^"]*\bql-font-monospace\b[^"]*"/gi, ' style="font-family:monospace"')
    .replace(/\sclass="[^"]*\bql-size-small\b[^"]*"/gi, ' style="font-size:0.75em"')
    .replace(/\sclass="[^"]*\bql-size-large\b[^"]*"/gi, ' style="font-size:1.5em"')
    .replace(/\sclass="[^"]*\bql-size-huge\b[^"]*"/gi, ' style="font-size:2.5em"')
    .replace(/\sclass="[^"]*\bql-indent-(\d+)\b[^"]*"/gi, (_match, level: string) => ` style="margin-left:${Number(level) * 3}em"`)
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sdata-[a-z-]+="[^"]*"/gi, "")
    .replace(/<(?:s|strike)>([\s\S]*?)<\/(?:s|strike)>/gi, '<span style="text-decoration:line-through">$1</span>')
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, '<p style="border-left:3px solid currentColor;padding-left:1em">$1</p>')
    .replace(/<pre>([\s\S]*?)<\/pre>/gi, '<p style="font-family:monospace;white-space:pre-wrap">$1</p>')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '<span style="font-family:monospace">$1</span>')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(
  value: unknown,
  label: string,
  errors: string[],
): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} is required.`);
    return undefined;
  }

  return value.trim();
}

function optionalString(
  value: unknown,
  label: string,
  errors: string[],
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    errors.push(`${label} must be text.`);
    return undefined;
  }

  return value.trim();
}

function requiredNumber(
  value: unknown,
  label: string,
  errors: string[],
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${label} must be a non-negative number.`);
    return undefined;
  }

  return value;
}

function optionalNumber(
  value: unknown,
  label: string,
  errors: string[],
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredNumber(value, label, errors);
}

function optionalBoolean(
  value: unknown,
  label: string,
  errors: string[],
): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    errors.push(`${label} must be true or false.`);
    return undefined;
  }
  return value;
}

function optionalStringArray(
  value: unknown,
  label: string,
  errors: string[],
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    errors.push(`${label} must be an array of text values.`);
    return undefined;
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function optionalDate(
  value: unknown,
  label: string,
  errors: string[],
): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()))
    errors.push(`${label} must be a valid date.`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function optionalUrl(
  value: unknown,
  label: string,
  errors: string[],
): string | undefined {
  const url = optionalString(value, label, errors);
  if (!url) return undefined;
  try {
    new URL(url);
    return url;
  } catch {
    errors.push(`${label} must be a valid URL.`);
    return undefined;
  }
}

function optionalEnum<T extends string>(
  value: unknown,
  label: string,
  guard: (value: unknown) => value is T,
  errors: string[],
): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (!guard(value)) {
    errors.push(`${label} is invalid.`);
    return undefined;
  }
  return value;
}

function parseViewEvents(
  value: unknown,
  errors: string[],
): ListingInput["viewEvents"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push("View events must be an array.");
    return undefined;
  }
  return value.flatMap((event): NonNullable<ListingInput["viewEvents"]> => {
    if (!isRecord(event)) {
      errors.push("Each view event must be an object.");
      return [];
    }
    const viewedAt = optionalDate(event.viewedAt, "Viewed at", errors);
    if (!viewedAt) return [];
    const parsed: NonNullable<ListingInput["viewEvents"]>[number] = {
      viewedAt,
    };
    for (const key of ["viewerId", "viewerName", "viewerEmail"] as const) {
      if (typeof event[key] === "string" && event[key].trim())
        parsed[key] = event[key].trim();
    }
    return [parsed];
  });
}

function parseAddress(
  value: unknown,
  errors: string[],
): { formatted?: string } | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (!isRecord(value)) {
    errors.push("Address must be an object.");
    return undefined;
  }

  const formatted = optionalString(value.formatted, "Address", errors);
  return formatted ? { formatted } : undefined;
}

function parseGallery(
  value: unknown,
  errors: string[],
): ListingInput["gallery"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push("Gallery must be an array.");
    return undefined;
  }

  const gallery = value.flatMap(
    (image): NonNullable<ListingInput["gallery"]> => {
      if (
        !isRecord(image) ||
        typeof image.url !== "string" ||
        !image.url.trim()
      ) {
        errors.push("Each gallery image must include a URL.");
        return [];
      }

      const result: NonNullable<ListingInput["gallery"]>[number] = {
        url: image.url.trim(),
      };
      if (typeof image.id === "string" && image.id.trim())
        result.id = image.id.trim();
      if (typeof image.title === "string" && image.title.trim())
        result.title = image.title.trim();
      return [result];
    },
  );

  return gallery;
}

export function parseListingInput(
  body: unknown,
): ValidationResult<ListingInput> {
  const errors: string[] = [];
  if (!isRecord(body)) return { errors: ["A listing object is required."] };

  const title = requiredString(body.title, "Title", errors);
  const transactionType = body.transactionType;
  if (!isTransactionType(transactionType))
    errors.push("Transaction type is invalid.");
  const propertyType = body.propertyType;
  if (!isPropertyType(propertyType)) errors.push("Property type is invalid.");
  const status = body.status;
  if (!isListingStatus(status)) errors.push("Status is invalid.");

  const price = requiredNumber(body.price, "Price", errors);
  const currency = requiredString(
    body.currency,
    "Currency",
    errors,
  )?.toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.push("Currency must be a three-letter ISO code.");
  }
  const area = requiredNumber(body.area, "Area", errors);
  const areaUnit = requiredString(body.areaUnit, "Area unit", errors);
  if (areaUnit && !isAreaUnit(areaUnit)) errors.push("Area unit is invalid.");
  const city = requiredString(body.city, "City", errors);
  const descriptionValue = optionalString(
    body.description,
    "Description",
    errors,
  );
  const description = descriptionValue
    ? normalizeRichText(descriptionValue)
    : undefined;
  if (description && description.length > 30000)
    errors.push("Description is too long.");
  const bedrooms = optionalNumber(body.bedrooms, "Bedrooms", errors);
  const bathrooms = optionalNumber(body.bathrooms, "Bathrooms", errors);
  const yearBuilt = optionalNumber(body.yearBuilt, "Year built", errors);
  const parkingSpaces = optionalNumber(
    body.parkingSpaces,
    "Parking spaces",
    errors,
  );
  const furnished = optionalBoolean(body.furnished, "Furnished", errors);
  const amenities = optionalStringArray(body.amenities, "Amenities", errors);
  const propertyCondition = optionalEnum(
    body.propertyCondition,
    "Property condition",
    isPropertyCondition,
    errors,
  );
  const furnishingStatus = optionalEnum(
    body.furnishingStatus,
    "Furnishing status",
    isFurnishingStatus,
    errors,
  );
  const tenure = optionalEnum(body.tenure, "Tenure", isTenureType, errors);
  const rentalFrequency = optionalEnum(
    body.rentalFrequency,
    "Rental frequency",
    isRentalFrequency,
    errors,
  );
  const availabilityDate = optionalDate(
    body.availabilityDate,
    "Availability date",
    errors,
  );
  const serviceCharge = optionalNumber(
    body.serviceCharge,
    "Service charge",
    errors,
  );
  const securityDeposit = optionalNumber(
    body.securityDeposit,
    "Security deposit",
    errors,
  );
  const agentName = optionalString(body.agentName, "Agent name", errors);
  const agentPhone = optionalString(body.agentPhone, "Agent phone", errors);
  const agentEmail = optionalString(body.agentEmail, "Agent email", errors);
  if (agentEmail && !/^\S+@\S+\.\S+$/.test(agentEmail))
    errors.push("Agent email must be valid.");
  const latitude = optionalNumber(body.latitude, "Latitude", errors);
  const longitude = optionalNumber(body.longitude, "Longitude", errors);
  if (latitude !== undefined && (latitude < -90 || latitude > 90))
    errors.push("Latitude must be between -90 and 90.");
  if (longitude !== undefined && (longitude < -180 || longitude > 180))
    errors.push("Longitude must be between -180 and 180.");
  const virtualTourUrl = optionalUrl(
    body.virtualTourUrl,
    "Virtual tour URL",
    errors,
  );
  const address = parseAddress(body.address, errors);
  const primaryImage = optionalString(
    body.primaryImage,
    "Primary image",
    errors,
  );
  const aiDescriptionValue = optionalString(
    body.aiDescription,
    "AI description",
    errors,
  );
  const aiDescription = aiDescriptionValue
    ? normalizeRichText(aiDescriptionValue)
    : undefined;
  const aiTags =
    body.aiTags === undefined
      ? undefined
      : Array.isArray(body.aiTags) &&
          body.aiTags.every((tag) => typeof tag === "string")
        ? body.aiTags
        : (errors.push("AI tags must be an array of text values."), undefined);
  const gallery = parseGallery(body.gallery, errors);
  const aiGeneratedAt =
    body.aiGeneratedAt === undefined ||
    body.aiGeneratedAt === null ||
    body.aiGeneratedAt === ""
      ? undefined
      : new Date(String(body.aiGeneratedAt));
  if (aiGeneratedAt && Number.isNaN(aiGeneratedAt.getTime()))
    errors.push("AI generated date is invalid.");

  if (
    errors.length > 0 ||
    !title ||
    !isTransactionType(transactionType) ||
    !isPropertyType(propertyType) ||
    !isListingStatus(status) ||
    price === undefined ||
    !currency ||
    area === undefined ||
    !areaUnit ||
    !city
  ) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      title,
      description,
      transactionType,
      propertyType,
      status,
      price,
      currency,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      yearBuilt,
      parkingSpaces,
      furnished,
      amenities,
      propertyCondition,
      furnishingStatus,
      tenure,
      rentalFrequency,
      availabilityDate,
      serviceCharge,
      securityDeposit,
      agentName,
      agentPhone,
      agentEmail,
      latitude,
      longitude,
      virtualTourUrl,
      address,
      city,
      primaryImage,
      gallery,
      aiDescription,
      aiTags,
      aiGeneratedAt,
    },
  };
}

const patchableKeys = new Set<string>([
  "title",
  "description",
  "transactionType",
  "propertyType",
  "status",
  "price",
  "currency",
  "area",
  "areaUnit",
  "bedrooms",
  "bathrooms",
  "yearBuilt",
  "parkingSpaces",
  "furnished",
  "amenities",
  "propertyCondition",
  "furnishingStatus",
  "tenure",
  "rentalFrequency",
  "availabilityDate",
  "serviceCharge",
  "securityDeposit",
  "agentName",
  "agentPhone",
  "agentEmail",
  "latitude",
  "longitude",
  "virtualTourUrl",
  "viewCount",
  "viewEvents",
  "address",
  "city",
  "primaryImage",
  "gallery",
  "aiDescription",
  "aiTags",
  "aiGeneratedAt",
]);

export function parseListingPatch(
  body: unknown,
): ValidationResult<Partial<ListingInput>> {
  if (!isRecord(body))
    return { errors: ["A listing update object is required."] };

  const errors: string[] = [];
  const unknownKey = Object.keys(body).find((key) => !patchableKeys.has(key));
  if (unknownKey) errors.push(`The field "${unknownKey}" cannot be updated.`);

  const result: Partial<ListingInput> = {};

  if ("title" in body)
    result.title = requiredString(body.title, "Title", errors);
  if ("description" in body) {
    const descriptionValue = optionalString(
      body.description,
      "Description",
      errors,
    );
    result.description = descriptionValue
      ? normalizeRichText(descriptionValue)
      : undefined;
  }
  if ("transactionType" in body) {
    if (!isTransactionType(body.transactionType))
      errors.push("Transaction type is invalid.");
    else result.transactionType = body.transactionType;
  }
  if ("propertyType" in body) {
    if (!isPropertyType(body.propertyType))
      errors.push("Property type is invalid.");
    else result.propertyType = body.propertyType;
  }
  if ("status" in body) {
    if (!isListingStatus(body.status)) errors.push("Status is invalid.");
    else result.status = body.status;
  }
  if ("price" in body)
    result.price = requiredNumber(body.price, "Price", errors);
  if ("currency" in body) {
    const currency = requiredString(
      body.currency,
      "Currency",
      errors,
    )?.toUpperCase();
    if (currency && !/^[A-Z]{3}$/.test(currency))
      errors.push("Currency must be a three-letter ISO code.");
    result.currency = currency;
  }
  if ("area" in body) result.area = requiredNumber(body.area, "Area", errors);
  if ("areaUnit" in body) {
    const areaUnit = requiredString(body.areaUnit, "Area unit", errors);
    if (areaUnit && !isAreaUnit(areaUnit)) errors.push("Area unit is invalid.");
    result.areaUnit = areaUnit;
  }
  if ("bedrooms" in body)
    result.bedrooms = optionalNumber(body.bedrooms, "Bedrooms", errors);
  if ("bathrooms" in body)
    result.bathrooms = optionalNumber(body.bathrooms, "Bathrooms", errors);
  if ("yearBuilt" in body)
    result.yearBuilt = optionalNumber(body.yearBuilt, "Year built", errors);
  if ("parkingSpaces" in body)
    result.parkingSpaces = optionalNumber(
      body.parkingSpaces,
      "Parking spaces",
      errors,
    );
  if ("furnished" in body)
    result.furnished = optionalBoolean(body.furnished, "Furnished", errors);
  if ("amenities" in body)
    result.amenities = optionalStringArray(body.amenities, "Amenities", errors);
  if ("propertyCondition" in body)
    result.propertyCondition = optionalEnum(
      body.propertyCondition,
      "Property condition",
      isPropertyCondition,
      errors,
    );
  if ("furnishingStatus" in body)
    result.furnishingStatus = optionalEnum(
      body.furnishingStatus,
      "Furnishing status",
      isFurnishingStatus,
      errors,
    );
  if ("tenure" in body)
    result.tenure = optionalEnum(body.tenure, "Tenure", isTenureType, errors);
  if ("rentalFrequency" in body)
    result.rentalFrequency = optionalEnum(
      body.rentalFrequency,
      "Rental frequency",
      isRentalFrequency,
      errors,
    );
  if ("availabilityDate" in body)
    result.availabilityDate = optionalDate(
      body.availabilityDate,
      "Availability date",
      errors,
    );
  if ("serviceCharge" in body)
    result.serviceCharge = optionalNumber(
      body.serviceCharge,
      "Service charge",
      errors,
    );
  if ("securityDeposit" in body)
    result.securityDeposit = optionalNumber(
      body.securityDeposit,
      "Security deposit",
      errors,
    );
  if ("agentName" in body)
    result.agentName = optionalString(body.agentName, "Agent name", errors);
  if ("agentPhone" in body)
    result.agentPhone = optionalString(body.agentPhone, "Agent phone", errors);
  if ("agentEmail" in body) {
    result.agentEmail = optionalString(body.agentEmail, "Agent email", errors);
    if (result.agentEmail && !/^\S+@\S+\.\S+$/.test(result.agentEmail))
      errors.push("Agent email must be valid.");
  }
  if ("latitude" in body)
    result.latitude = optionalNumber(body.latitude, "Latitude", errors);
  if ("longitude" in body)
    result.longitude = optionalNumber(body.longitude, "Longitude", errors);
  if ("virtualTourUrl" in body)
    result.virtualTourUrl = optionalUrl(
      body.virtualTourUrl,
      "Virtual tour URL",
      errors,
    );
  if ("viewCount" in body)
    result.viewCount = optionalNumber(body.viewCount, "View count", errors);
  if ("viewEvents" in body)
    result.viewEvents = parseViewEvents(body.viewEvents, errors);
  if ("address" in body) result.address = parseAddress(body.address, errors);
  if ("city" in body) result.city = requiredString(body.city, "City", errors);
  if ("primaryImage" in body)
    result.primaryImage = optionalString(
      body.primaryImage,
      "Primary image",
      errors,
    );
  if ("gallery" in body) {
    result.gallery = parseGallery(body.gallery, errors);
  }
  if ("aiDescription" in body) {
    const aiDescriptionValue = optionalString(
      body.aiDescription,
      "AI description",
      errors,
    );
    result.aiDescription = aiDescriptionValue
      ? normalizeRichText(aiDescriptionValue)
      : undefined;
  }
  if ("aiTags" in body) {
    if (
      !Array.isArray(body.aiTags) ||
      !body.aiTags.every((tag) => typeof tag === "string")
    )
      errors.push("AI tags must be an array of text values.");
    else result.aiTags = body.aiTags;
  }
  if ("aiGeneratedAt" in body) {
    if (
      body.aiGeneratedAt === undefined ||
      body.aiGeneratedAt === null ||
      body.aiGeneratedAt === ""
    ) {
      result.aiGeneratedAt = undefined;
    } else {
      const date = new Date(String(body.aiGeneratedAt));
      if (Number.isNaN(date.getTime()))
        errors.push("AI generated date is invalid.");
      else result.aiGeneratedAt = date;
    }
  }

  return errors.length > 0 ? { errors } : { errors: [], value: result };
}
