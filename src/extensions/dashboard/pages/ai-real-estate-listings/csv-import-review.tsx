import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  ImageOff,
  Loader2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/formatters";
import { useDashboardI18n, useDt } from "@/lib/dashboard-i18n";
import {
  LISTING_CSV_BATCH_SIZE,
  LISTING_CSV_COLUMNS,
  LISTING_CSV_LIST_SEPARATOR,
  LISTING_CSV_TEMPLATE,
  csvRowMode,
  errorCount,
  isWixMediaUrl,
  parseListingCsv,
  validateCsvRows,
  type ListingCsvColumn,
  type ListingCsvErrors,
  type ListingCsvKey,
  type ListingCsvRow,
} from "@/lib/listing-csv";
import { importListingRows } from "@/lib/listings";
import type { ListingImportResult } from "@/lib/server/listing-import";
import { cn } from "@/lib/utils";
import { LazyRichTextEditor } from "./lazy-rich-text-editor";

type Step = "upload" | "review" | "summary" | "importing" | "done";

interface ReviewRow {
  rowNumber: number;
  values: ListingCsvRow;
  serverMessage?: string;
  serverErrors?: ListingCsvErrors;
  current?: ListingCsvRow;
}

const GRID_PAGE_SIZE = 50;
const EDITABLE_COLUMNS = (LISTING_CSV_COLUMNS as readonly ListingCsvColumn[]).filter(
  (column) => column.kind !== "readonly",
);
const SUMMARY_COLUMNS = EDITABLE_COLUMNS.filter((column) => column.kind !== "id");

export function downloadTextFile(fileName: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function splitUrls(value: string): string[] {
  return value.split(LISTING_CSV_LIST_SEPARATOR).map((url) => url.trim()).filter(Boolean);
}

function rowImages(values: ListingCsvRow): string[] {
  return [values.primaryImage, ...splitUrls(values.galleryImages), ...splitUrls(values.panoramaImages)].filter(Boolean);
}

function Thumb({ url, className }: { url: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span
        title={url}
        className={cn("flex size-8 items-center justify-center rounded border border-destructive/50 bg-destructive/10 text-destructive", className)}
      >
        <ImageOff className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Image could not be loaded: {url}</span>
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      title={url}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("size-8 rounded border object-cover", className)}
    />
  );
}

function Thumbs({ value, max = 4 }: { value: string; max?: number }) {
  const urls = splitUrls(value).filter((url) => /^https?:\/\//i.test(url));
  if (urls.length === 0) return null;
  return (
    <div className="mt-1 flex items-center gap-1">
      {urls.slice(0, max).map((url) => (
        <Thumb key={url} url={url} />
      ))}
      {urls.length > max ? (
        <span className="text-xs text-muted-foreground">+{urls.length - max}</span>
      ) : null}
    </div>
  );
}

function cellWidth(column: ListingCsvColumn): string {
  if (column.kind === "urls" || column.kind === "longtext") return "min-w-72";
  if (column.kind === "url" || column.key === "title" || column.kind === "list") return "min-w-56";
  if (column.kind === "id") return "min-w-40";
  if (column.kind === "number" || column.kind === "integer" || column.kind === "currency") return "min-w-28";
  return "min-w-40";
}

function htmlToText(html: string): string {
  if (!html) return "";
  return (new DOMParser().parseFromString(html, "text/html").body.textContent ?? "").replace(/\s+/g, " ").trim();
}

// Quill reports an emptied editor as markup such as "<p><br></p>".
function normalizeEditorHtml(html: string): string {
  return htmlToText(html) || /<(img|video|iframe)\b/i.test(html) ? html : "";
}

function DescriptionCell({
  attributes,
  rowNumber,
  value,
  invalid,
  onChange,
}: {
  attributes: Record<string, unknown>;
  rowNumber: number;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const t = useDt();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const preview = useMemo(() => htmlToText(value), [value]);

  return (
    <>
      <p title={preview || undefined} className="mb-1 line-clamp-2 text-sm text-muted-foreground">
        {preview || "—"}
      </p>
      <Button
        {...attributes}
        type="button"
        variant="outline"
        size="sm"
        className={cn(invalid && "border-destructive")}
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
      >
        {t("csvEditDescription")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent overlayClassName="z-[80]" className="z-[80] max-h-[90vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("csvDescriptionEditorTitle", { row: rowNumber })}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {open ? <LazyRichTextEditor value={draft} onChange={setDraft} /> : null}
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onChange(normalizeEditorHtml(draft));
                setOpen(false);
              }}
            >
              {t("csvApplyDescription")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Cell({
  column,
  rowNumber,
  value,
  error,
  onChange,
}: {
  column: ListingCsvColumn;
  rowNumber: number;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `csv-${rowNumber}-${column.key}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    "data-csv-cell": "",
    "aria-label": `${column.label}, row ${rowNumber}`,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: cn(
      "h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      error && "border-destructive bg-destructive/5 focus-visible:ring-destructive/30",
    ),
  };

  let control;
  if (column.kind === "longtext") {
    const { className: _inputClassName, ...attributes } = shared;
    control = <DescriptionCell attributes={attributes} rowNumber={rowNumber} value={value} invalid={Boolean(error)} onChange={onChange} />;
  } else if (column.kind === "enum" || column.kind === "boolean") {
    const options =
      column.kind === "boolean"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : (column.options ?? []);
    const known = options.some((option) => option.value === value);
    control = (
      <select {...shared} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {!known && value ? <option value={value}>{value} (invalid)</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...shared}
        type={column.kind === "date" ? "date" : "text"}
        inputMode={
          column.kind === "number" || column.kind === "integer" || column.kind === "latitude" || column.kind === "longitude"
            ? "decimal"
            : undefined
        }
        value={value}
        placeholder={column.kind === "urls" || column.kind === "list" ? "a | b | c" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <td className={cn("border-b border-border/60 px-1.5 py-1.5 align-top", cellWidth(column))}>
      {control}
      {column.kind === "url" || column.kind === "urls" ? <Thumbs value={value} /> : null}
      {error ? (
        <p id={errorId} className="mt-1 max-w-72 text-xs leading-4 text-destructive">
          {error}
        </p>
      ) : null}
    </td>
  );
}

export function CsvImportReview({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [page, setPage] = useState(0);
  const [checking, setChecking] = useState(false);
  const [banner, setBanner] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState({ created: 0, updated: 0, failed: 0 });
  const [changedSinceOpen, setChangedSinceOpen] = useState(false);

  const issues = useMemo(() => validateCsvRows(rows.map((row) => row.values)), [rows]);
  const rowErrors = useMemo(
    () => rows.map((row, index) => ({ ...issues.errors[index], ...row.serverErrors })),
    [rows, issues],
  );
  const errorRowCount = rowErrors.filter((errors, index) => errorCount(errors) > 0 || rows[index]!.serverMessage).length;
  const visibleRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row, index }) => !onlyErrors || errorCount(rowErrors[index]!) > 0 || row.serverMessage),
    [rows, rowErrors, onlyErrors],
  );
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / GRID_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = visibleRows.slice(currentPage * GRID_PAGE_SIZE, (currentPage + 1) * GRID_PAGE_SIZE);
  const allWarnings = issues.warnings.flatMap((warnings, index) =>
    warnings.map((warning) => `Row ${rows[index]!.rowNumber}: ${warning}`),
  );

  const reset = () => {
    setStep("upload");
    setFileName("");
    setFileErrors([]);
    setUnknownHeaders([]);
    setMissingHeaders([]);
    setRows([]);
    setOnlyErrors(false);
    setPage(0);
    setBanner(null);
    setWarningsAcknowledged(false);
    setProgress({ done: 0, total: 0 });
    setOutcome({ created: 0, updated: 0, failed: 0 });
    setChangedSinceOpen(false);
  };

  const close = () => {
    if (step === "importing") return;
    if (rows.length > 0 && step !== "done" && !window.confirm(t("csvDiscardConfirm"))) return;
    if (changedSinceOpen) onImported();
    reset();
    onOpenChange(false);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = parseListingCsv(await file.text());
      setFileName(file.name);
      setFileErrors(parsed.fileErrors);
      setUnknownHeaders(parsed.unknownHeaders);
      const hasCreates = parsed.rows.some((row) => csvRowMode(row) === "create");
      setMissingHeaders(
        hasCreates
          ? parsed.missingRequiredHeaders.map((key) => LISTING_CSV_COLUMNS.find((column) => column.key === key)!.label)
          : [],
      );
      setRows(parsed.rows.map((values, index) => ({ rowNumber: index + 2, values })));
      setBanner(null);
      setPage(0);
      setOnlyErrors(false);
      if (parsed.rows.length > 0 && parsed.duplicateHeaders.length === 0) setStep("review");
    } catch (error) {
      console.error("Unable to read CSV file.", error);
      setFileErrors([t("csvReadFailed")]);
    }
  };

  const updateCell = (rowNumber: number, key: ListingCsvKey, value: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        // Any edit invalidates the server's verdict for this row.
        return { rowNumber, values: { ...row.values, [key]: value } };
      }),
    );
  };

  const removeRow = (rowNumber: number) => {
    setRows((current) => current.filter((row) => row.rowNumber !== rowNumber));
  };

  const goToNextError = () => {
    const focused = document.activeElement?.closest("tr")?.dataset.row;
    const startRow = focused ? Number(focused) : 0;
    const errorIndexes = visibleRows
      .map(({ row, index }, position) => ({ row, index, position }))
      .filter(({ row, index }) => errorCount(rowErrors[index]!) > 0 || row.serverMessage);
    const target = errorIndexes.find(({ row }) => row.rowNumber > startRow) ?? errorIndexes[0];
    if (!target) return;
    setPage(Math.floor(target.position / GRID_PAGE_SIZE));
    requestAnimationFrame(() => {
      const tr = gridRef.current?.querySelector<HTMLTableRowElement>(`tr[data-row="${target.row.rowNumber}"]`);
      const firstInvalid =
        tr?.querySelector<HTMLElement>("[aria-invalid='true']") ?? tr?.querySelector<HTMLElement>("[data-csv-cell]");
      tr?.scrollIntoView({ block: "center" });
      firstInvalid?.focus();
    });
  };

  const sendInBatches = async (
    batchRows: ReviewRow[],
    dryRun: boolean,
    onBatch?: (done: number) => void,
  ): Promise<ListingImportResult[]> => {
    const results: ListingImportResult[] = [];
    let createsBefore = 0;
    for (let start = 0; start < batchRows.length; start += LISTING_CSV_BATCH_SIZE) {
      const batch = batchRows.slice(start, start + LISTING_CSV_BATCH_SIZE);
      const batchResults = await importListingRows(
        batch.map((row) => ({ rowNumber: row.rowNumber, values: row.values })),
        { dryRun, createsBefore },
      );
      createsBefore += batchResults.filter((result) => result.status === "ready-create").length;
      results.push(...batchResults);
      onBatch?.(Math.min(start + batch.length, batchRows.length));
    }
    return results;
  };

  const applyResults = (results: ListingImportResult[]) => {
    const byRow = new Map(results.map((result) => [result.rowNumber, result]));
    setRows((current) =>
      current.map((row) => {
        const result = byRow.get(row.rowNumber);
        if (!result) return row;
        return {
          ...row,
          serverMessage: result.status === "error" ? result.message : undefined,
          serverErrors: result.status === "error" ? result.errors : undefined,
          current: result.current,
        };
      }),
    );
  };

  const checkAndReview = async () => {
    setChecking(true);
    setBanner(null);
    try {
      const results = await sendInBatches(rows, true);
      applyResults(results);
      const failed = results.filter((result) => result.status === "error").length;
      if (failed > 0) {
        setOnlyErrors(true);
        setPage(0);
        setBanner({ tone: "error", text: t("csvServerErrorsFound", { count: failed }) });
      } else {
        setWarningsAcknowledged(false);
        setStep("summary");
      }
    } catch (error) {
      console.error("CSV dry-run failed.", error);
      setBanner({ tone: "error", text: error instanceof Error ? error.message : t("csvCheckFailed") });
    } finally {
      setChecking(false);
    }
  };

  const confirmImport = async () => {
    setStep("importing");
    setProgress({ done: 0, total: rows.length });
    setChangedSinceOpen(true);
    let results: ListingImportResult[] = [];
    let stoppedEarly = false;
    try {
      results = await sendInBatches(rows, false, (done) => setProgress({ done, total: rows.length }));
    } catch (error) {
      console.error("CSV import failed.", error);
      stoppedEarly = true;
    }

    const saved = new Set(
      results.filter((result) => result.status === "created" || result.status === "updated").map((result) => result.rowNumber),
    );
    const created = results.filter((result) => result.status === "created").length;
    const updated = results.filter((result) => result.status === "updated").length;
    const remaining = rows.filter((row) => !saved.has(row.rowNumber));
    applyResults(results);
    setRows((current) => current.filter((row) => !saved.has(row.rowNumber)));
    setOutcome({ created, updated, failed: remaining.length });
    if (stoppedEarly) setBanner({ tone: "error", text: t("csvImportFailed") });
    else if (remaining.length > 0) setBanner({ tone: "error", text: t("csvDoneErrors", { count: remaining.length }) });
    setOnlyErrors(remaining.length > 0);
    setPage(0);
    setStep(remaining.length > 0 ? "review" : "done");
  };

  const readyCount = rows.length - errorRowCount;
  const clientErrorCount = issues.errors.reduce((sum, errors) => sum + errorCount(errors), 0);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-[min(96vw,1400px)]" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle>{step === "summary" ? t("csvSummaryTitle") : step === "done" ? t("csvDoneTitle") : t("csvImportTitle")}</DialogTitle>
          <DialogDescription>{fileName ? fileName : t("csvImportIntro")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {banner ? (
            <div
              role="alert"
              className={cn(
                "mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                banner.tone === "error" ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted/50",
              )}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{banner.text}</span>
            </div>
          ) : null}

          {step === "upload" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <FileUp className="size-8 text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => fileInput.current?.click()}>
                    <FileUp className="size-4" aria-hidden="true" /> {t("csvChooseFile")}
                  </Button>
                  <Button variant="outline" onClick={() => downloadTextFile("listings-template.csv", LISTING_CSV_TEMPLATE)}>
                    <Download className="size-4" aria-hidden="true" /> {t("csvDownloadTemplate")}
                  </Button>
                </div>
                <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{t("csvTemplateHelp")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{t("csvImagesHelp")}</p>
              {fileErrors.length > 0 ? (
                <ul role="alert" className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {fileErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-3">
              {fileErrors.length > 0 ? (
                <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {fileErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
              {unknownHeaders.length > 0 ? (
                <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  {t("csvUnknownHeaders", { headers: unknownHeaders.join(", ") })}
                </p>
              ) : null}
              {missingHeaders.length > 0 ? (
                <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  {t("csvMissingHeaders", { headers: missingHeaders.join(", ") })}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium" aria-live="polite">
                  {t("csvRowsSummary", { total: rows.length, ready: readyCount, errors: errorRowCount })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={onlyErrors} onChange={(event) => { setOnlyErrors(event.target.checked); setPage(0); }} />
                    {t("csvOnlyErrors")}
                  </label>
                  <Button variant="outline" size="sm" onClick={goToNextError} disabled={errorRowCount === 0}>
                    {t("csvNextError")} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div ref={gridRef} className="max-h-[56vh] overflow-auto rounded-lg border border-border">
                <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 z-20 bg-muted">
                    <tr>
                      <th className="sticky left-0 z-30 min-w-28 border-b border-border bg-muted px-2 py-2 text-left font-medium">#</th>
                      {EDITABLE_COLUMNS.map((column) => (
                        <th key={column.key} className="border-b border-border px-2 py-2 text-left font-medium whitespace-nowrap">
                          {column.label}
                          {column.requiredOnCreate ? <span className="text-destructive"> *</span> : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ row, index }) => {
                      const errors = rowErrors[index]!;
                      const count = errorCount(errors) + (row.serverMessage && errorCount(row.serverErrors ?? {}) === 0 ? 1 : 0);
                      const mode = csvRowMode(row.values);
                      return (
                        <tr key={row.rowNumber} data-row={row.rowNumber} className={cn(count > 0 && "bg-destructive/[0.03]")}>
                          <td className="sticky left-0 z-10 border-b border-border/60 bg-background px-2 py-1.5 align-top">
                            <div className="flex items-center gap-1">
                              <span className="w-8 text-xs tabular-nums text-muted-foreground">{row.rowNumber}</span>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={t("csvRemoveRow", { row: row.rowNumber })}
                                onClick={() => removeRow(row.rowNumber)}
                              >
                                <X />
                              </Button>
                            </div>
                            <div className="mt-1">
                              {count > 0 ? (
                                <Badge variant="destructive">{count === 1 ? t("csvRowOneError") : t("csvRowErrors", { count })}</Badge>
                              ) : (
                                <Badge variant={mode === "create" ? "secondary" : "outline"}>
                                  {mode === "create" ? t("csvRowNew") : t("csvRowUpdate")}
                                </Badge>
                              )}
                            </div>
                            {errors.row || row.serverMessage ? (
                              <p className="mt-1 max-w-48 text-xs leading-4 text-destructive">{errors.row ?? row.serverMessage}</p>
                            ) : null}
                            {issues.warnings[index]!.map((warning) => (
                              <p key={warning} className="mt-1 max-w-48 text-xs leading-4 text-amber-700 dark:text-amber-300">
                                {warning}
                              </p>
                            ))}
                          </td>
                          {EDITABLE_COLUMNS.map((column) => (
                            <Cell
                              key={column.key}
                              column={column}
                              rowNumber={row.rowNumber}
                              value={row.values[column.key as ListingCsvKey]}
                              error={errors[column.key as ListingCsvKey]}
                              onChange={(value) => updateCell(row.rowNumber, column.key as ListingCsvKey, value)}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pageCount > 1 ? (
                <div className="flex items-center justify-end gap-2 text-sm">
                  <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                    <ChevronLeft />
                  </Button>
                  <span>{t("csvPage", { page: currentPage + 1, pages: pageCount })}</span>
                  <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
                    <ChevronRight />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "summary" ? (
            <ImportSummary
              rows={rows}
              warnings={allWarnings}
              acknowledged={warningsAcknowledged}
              onAcknowledge={setWarningsAcknowledged}
              locale={locale}
            />
          ) : null}

          {step === "importing" ? (
            <div className="flex flex-col items-center gap-4 py-16" aria-live="polite">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">{t("csvImporting", { done: progress.done, total: progress.total })}</p>
              <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CheckCircle2 className="size-10 text-emerald-600" aria-hidden="true" />
              <p className="text-lg font-semibold">{t("csvDoneTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("csvDoneSummary", { created: outcome.created, updated: outcome.updated })}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-6 py-3">
          {step === "review" ? (
            <>
              <Button variant="ghost" onClick={() => { if (window.confirm(t("csvDiscardConfirm"))) reset(); }}>
                {t("csvChooseAnother")}
              </Button>
              <div className="flex items-center gap-3">
                {clientErrorCount > 0 ? <span className="text-sm text-muted-foreground">{t("csvFixErrorsFirst")}</span> : null}
                <Button onClick={checkAndReview} disabled={checking || rows.length === 0 || clientErrorCount > 0 || fileErrors.length > 0}>
                  {checking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {checking ? t("csvChecking") : t("csvCheckAndReview")}
                </Button>
              </div>
            </>
          ) : null}
          {step === "summary" ? (
            <>
              <Button variant="outline" onClick={() => setStep("review")}>
                <ChevronLeft className="size-4" aria-hidden="true" /> {t("csvBackToEdit")}
              </Button>
              <Button onClick={confirmImport} disabled={allWarnings.length > 0 && !warningsAcknowledged}>
                {t("csvConfirmImport")}
              </Button>
            </>
          ) : null}
          {step === "done" ? (
            <Button className="ml-auto" onClick={close}>
              {t("csvDone")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportSummary({
  rows,
  warnings,
  acknowledged,
  onAcknowledge,
  locale,
}: {
  rows: ReviewRow[];
  warnings: string[];
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
  locale: string;
}) {
  const t = useDt();
  const creates = rows.filter((row) => csvRowMode(row.values) === "create");
  const updates = rows.filter((row) => csvRowMode(row.values) === "update");
  const images = rows.flatMap((row) => rowImages(row.values));
  const wixImages = images.filter(isWixMediaUrl).length;

  const coverage = SUMMARY_COLUMNS.map((column) => {
    const key = column.key as ListingCsvKey;
    const filled = rows.filter((row) => row.values[key]);
    const sample = filled[0]?.values[key] ?? "";
    let detail = sample.length > 60 ? `${sample.slice(0, 60)}…` : sample;
    if (column.kind === "urls" && filled.length > 0) {
      const total = filled.reduce((sum, row) => sum + splitUrls(row.values[key]).length, 0);
      detail = `${total} URLs · ${(total / filled.length).toFixed(1)} per listing`;
    }
    if (key === "price" && filled[0]) {
      const value = Number(filled[0].values.price);
      detail = formatPrice(value, filled[0].values.currency, locale);
    }
    return { column, filled: filled.length, detail };
  }).filter((entry) => entry.filled > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat label={t("csvSummaryNew")} value={creates.length} />
        <SummaryStat label={t("csvSummaryUpdates")} value={updates.length} />
        <SummaryStat
          label={t("csvSummaryImages")}
          value={images.length}
          detail={t("csvSummaryImagesDetail", { wix: wixImages, external: images.length - wixImages })}
        />
      </div>

      {warnings.length > 0 ? (
        <section className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <h3 className="font-semibold">{t("csvWarnings")}</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <label className="mt-3 flex items-center gap-2 font-medium">
            <input type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} />
            {t("csvAcknowledgeWarnings")}
          </label>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t("csvFieldCoverage")}</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{t("csvField")}</th>
                <th className="px-3 py-2 font-medium">{t("csvFilled")}</th>
                <th className="px-3 py-2 font-medium">{t("csvSample")}</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map(({ column, filled, detail }) => (
                <tr key={column.key} className="border-t border-border/60">
                  <td className="px-3 py-1.5 whitespace-nowrap">{column.label}</td>
                  <td className="px-3 py-1.5 tabular-nums whitespace-nowrap">
                    {filled}/{rows.length}
                  </td>
                  <td className="max-w-md truncate px-3 py-1.5 text-muted-foreground">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {creates.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">
            {t("csvSummaryNew")} ({creates.length})
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {creates.slice(0, 60).map((row) => {
              const image = row.values.primaryImage || splitUrls(row.values.galleryImages)[0];
              return (
                <li key={row.rowNumber} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {image ? <Thumb url={image} className="size-12" /> : <span className="size-12 rounded border bg-muted" />}
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{row.values.title}</p>
                    <p className="truncate text-muted-foreground">
                      {formatPrice(Number(row.values.price), row.values.currency, locale)} · {row.values.propertyType} · {row.values.city}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {creates.length > 60 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("csvAndMore", { count: creates.length - 60 })}</p>
          ) : null}
        </section>
      ) : null}

      {updates.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">
            {t("csvSummaryUpdates")} ({updates.length})
          </h3>
          <ul className="space-y-2">
            {updates.slice(0, 60).map((row) => (
              <UpdateDiff key={row.rowNumber} row={row} />
            ))}
          </ul>
          {updates.length > 60 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("csvAndMore", { count: updates.length - 60 })}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function UpdateDiff({ row }: { row: ReviewRow }) {
  const t = useDt();
  const current = row.current;
  const changes = SUMMARY_COLUMNS.filter((column) => {
    const key = column.key as ListingCsvKey;
    const next = row.values[key];
    return next !== "" && next !== (current?.[key] ?? "");
  });

  return (
    <li className="rounded-lg border border-border p-3 text-sm">
      <p className="font-medium">
        {current?.title || row.values.title || row.values.id}
        <span className="ml-2 text-xs font-normal text-muted-foreground">{row.values.id}</span>
      </p>
      {changes.length === 0 ? (
        <p className="mt-1 text-muted-foreground">{t("csvNoChanges")}</p>
      ) : (
        <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-[max-content_1fr]">
          {changes.map((column) => {
            const key = column.key as ListingCsvKey;
            const before = current?.[key] ?? "";
            const after = row.values[key];
            const isImage = column.kind === "url" || column.kind === "urls";
            return (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{column.label}</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2">
                  {isImage ? (
                    <>
                      <span className="flex gap-1">{splitUrls(before).slice(0, 4).map((url) => <Thumb key={url} url={url} />)}{before ? null : "—"}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="flex gap-1">{splitUrls(after).slice(0, 4).map((url) => <Thumb key={url} url={url} />)}</span>
                    </>
                  ) : (
                    <>
                      <span className="max-w-xs truncate text-muted-foreground line-through">{before || "—"}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="max-w-xs truncate font-medium">{after}</span>
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </li>
  );
}
