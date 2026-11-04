import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { dashboard } from '@wix/dashboard';
import { CheckCircle2, Copy, FilePlus2, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { CURRENCIES } from '@/lib/currencies';
import { formatPrice } from '@/lib/formatters';
import { queryListings, type Listing } from '@/lib/listings';
import { useDashboardI18n, useDt } from '@/lib/dashboard-i18n';
import {
  INVOICE_LIMITS,
  InvoiceRequestError,
  createInvoice,
  getInvoiceDraftForQuote,
  invoiceDraftTotal,
  lineItemFromListing,
  parseInvoiceDraft,
  type CreatedInvoice,
  type InvoiceDraftErrors,
  type InvoiceDraftInput,
  type InvoiceRecord,
} from '@/lib/invoices';
import { copyText } from './invoice-ui';
import { ContactPicker } from './contact-picker';
import type { ContactOption } from '@/lib/contacts';

interface LineState { key: string; listingId: string; name: string; description: string; amount: string; quantity: string }

interface FormState {
  /** The chosen site contact; name/email/phone are its details, for display. */
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  currency: string;
  dueInDays: string;
  lines: LineState[];
  message: string;
  quoteRequestId?: string;
  listingId?: string;
  listingTitle?: string;
}

const newLine = (line?: Partial<LineState>): LineState => ({ key: crypto.randomUUID(), listingId: '', name: '', description: '', amount: '', quantity: '1', ...line });

const emptyForm = (): FormState => ({ contactId: '', firstName: '', lastName: '', email: '', phone: '', title: '', currency: 'USD', dueInDays: '14', lines: [newLine()], message: '' });

function fromDraft(draft: InvoiceDraftInput): FormState {
  return {
    contactId: draft.customer.contactId,
    firstName: draft.customer.firstName,
    lastName: draft.customer.lastName,
    email: draft.customer.email,
    phone: draft.customer.phone ?? '',
    title: draft.title,
    currency: draft.currency,
    dueInDays: String(draft.dueInDays),
    lines: draft.lineItems.length
      ? draft.lineItems.map((line) => newLine({ listingId: line.listingId, name: line.name, description: line.description ?? '', amount: String(line.amount), quantity: String(line.quantity) }))
      : [newLine()],
    message: draft.message ?? '',
    quoteRequestId: draft.quoteRequestId,
    listingId: draft.listingId,
    listingTitle: draft.listingTitle,
  };
}

function toDraftInput(form: FormState) {
  return {
    customer: { contactId: form.contactId, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
    title: form.title,
    currency: form.currency,
    dueInDays: form.dueInDays,
    lineItems: form.lines.map((line) => ({ listingId: line.listingId, name: line.name, description: line.description, amount: line.amount, quantity: line.quantity })),
    message: form.message,
    quoteRequestId: form.quoteRequestId,
    listingId: form.listingId,
    listingTitle: form.listingTitle,
  };
}

/** Loads the dashboard's non-archived listings for the line item dropdown (up to 500). */
async function loadListings(): Promise<Listing[]> {
  const listings: Listing[] = [];
  for (let page = 0; page < 5; page += 1) {
    const result = await queryListings({ page, pageSize: 100 });
    listings.push(...result.items);
    if (!result.hasNext || result.items.length === 0) break;
  }
  return listings;
}

/**
 * Sheet for creating a Wix invoice; each line item is one of the site's listings.
 * "Create invoice" saves a draft; "Create & send" also emails it with a payment link.
 * With `quoteRequestId` it is pre-filled from the quote request and its listing.
 */
export function InvoiceComposer({
  open,
  onOpenChange,
  quoteRequestId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteRequestId?: string;
  onCreated: (invoice: InvoiceRecord) => void;
}) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<InvoiceDraftErrors>({});
  const [sending, setSending] = useState<'create' | 'send' | null>(null);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [created, setCreated] = useState<CreatedInvoice | null>(null);
  // One key per composed invoice, so a retried request never creates a duplicate.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setListings(null);
    loadListings()
      .then((items) => { if (!cancelled) setListings(items); })
      .catch(() => { if (!cancelled) setListings([]); });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setTouched(false);
    setServerErrors({});
    setDraftError('');
    setIdempotencyKey(crypto.randomUUID());
    if (!quoteRequestId) { setForm(emptyForm()); return; }
    let cancelled = false;
    setLoadingDraft(true);
    getInvoiceDraftForQuote(quoteRequestId)
      .then((draft) => { if (!cancelled) setForm(fromDraft(draft)); })
      .catch((error) => { if (!cancelled) setDraftError(error instanceof Error ? error.message : t('invoiceDraftError')); })
      .finally(() => { if (!cancelled) setLoadingDraft(false); });
    return () => { cancelled = true; };
  }, [open, quoteRequestId, t]);

  const validation = useMemo(() => parseInvoiceDraft(toDraftInput(form)), [form]);
  const errors: InvoiceDraftErrors = touched ? { ...validation.errors, ...serverErrors } : serverErrors;
  const total = invoiceDraftTotal(form.lines.map((line) => ({ amount: Number(line.amount), quantity: Number(line.quantity) })));
  const selectedContact: ContactOption | null = form.contactId ? { id: form.contactId, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined } : null;

  const update = (patch: Partial<FormState>) => { setForm((current) => ({ ...current, ...patch })); setServerErrors({}); };
  const updateLine = (key: string, patch: Partial<LineState>) => update({ lines: form.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)) });

  // Listings in the dropdown, plus any listing a pre-filled line uses that's no longer listed (e.g. archived).
  const listingOptions = useMemo(() => {
    const options = (listings ?? []).map((listing) => ({ id: listing._id, label: `${listing.title} · ${formatPrice(listing.price, listing.currency, locale)}` }));
    for (const line of form.lines) {
      if (line.listingId && !options.some((option) => option.id === line.listingId)) options.push({ id: line.listingId, label: line.name || line.listingId });
    }
    return options;
  }, [form.lines, listings, locale]);

  const chooseListing = (key: string, listingId: string) => {
    const listing = listings?.find((item) => item._id === listingId);
    if (!listing) return;
    const line = lineItemFromListing(listing);
    const firstChoice = !form.lines.some((item) => item.key !== key && item.listingId);
    update({
      lines: form.lines.map((item) => (item.key === key ? { ...item, listingId: line.listingId, name: line.name, description: line.description ?? '', amount: line.amount ? String(line.amount) : '' } : item)),
      // The first listing chosen sets the invoice currency and a default title.
      ...(firstChoice ? { currency: listing.currency || form.currency, ...(form.title ? {} : { title: `Invoice – ${listing.title}`.slice(0, INVOICE_LIMITS.title) }) } : {}),
    });
  };

  const submit = async (send: boolean) => {
    setTouched(true);
    if (!validation.value || sending) return;
    setSending(send ? 'send' : 'create');
    try {
      const result = await createInvoice(validation.value, idempotencyKey, send);
      const { invoice } = result;
      setCreated(result);
      onCreated(invoice);
      if (!send) dashboard.showToast({ type: 'success', message: t('invoiceDraftCreated') });
      else if (!result.warning) dashboard.showToast({ type: 'success', message: t('invoiceCreated', { number: invoice.number || t('invoiceUnnumbered'), email: invoice.customerEmail || validation.value.customer.email }) });
    } catch (error) {
      if (error instanceof InvoiceRequestError && error.errors) setServerErrors(error.errors);
      dashboard.showToast({ type: 'error', message: error instanceof Error ? error.message : t('invoiceCreateError') });
    } finally {
      setSending(null);
    }
  };

  const fieldError = (key: keyof InvoiceDraftErrors) => (errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null);

  return (
    <Sheet open={open} onOpenChange={(next) => { if (sending === null) onOpenChange(next); }}>
      {/* Overrides use the same data-[side=right] variant as the Sheet's defaults (w-3/4, sm:max-w-sm) so they actually win. */}
      <SheetContent side="right" className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:lg:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{created ? t(created.invoice.status === 'DRAFT' ? 'invoiceDraftCreatedTitle' : 'invoiceCreatedTitle') : t('invoiceComposeTitle')}</SheetTitle>
          <SheetDescription>{created ? created.invoice.title : t('invoiceComposeDescription')}</SheetDescription>
        </SheetHeader>

        {created ? (
          <CreatedSummary created={created} locale={locale} onClose={() => onOpenChange(false)} />
        ) : loadingDraft ? (
          <div className="space-y-3 px-4" aria-busy="true">
            <p className="text-sm text-muted-foreground">{t('invoiceDraftLoading')}</p>
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div>
        ) : draftError ? (
          <p className="mx-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{draftError}</p>
        ) : (
          <form className="space-y-6 px-4 pb-6" onSubmit={(event) => { event.preventDefault(); void submit(false); }} noValidate>
            <section className="space-y-3">
              <label htmlFor="invoice-contact" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('invoiceContact')}</label>
              <ContactPicker
                id="invoice-contact"
                value={selectedContact}
                invalid={Boolean(errors.customer)}
                onChange={(contact) => update(contact
                  ? { contactId: contact.id, firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone ?? '' }
                  : { contactId: '', firstName: '', lastName: '', email: '', phone: '' })}
              />
              {fieldError('customer')}
              <p className="text-xs text-muted-foreground">{t('invoiceContactHint')}</p>
            </section>

            <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem]">
              <Field label={t('invoiceTitleLabel')} id="invoice-title">
                <Input id="invoice-title" value={form.title} maxLength={INVOICE_LIMITS.title} onChange={(event) => update({ title: event.target.value })} aria-invalid={errors.title ? true : undefined} />
                {fieldError('title')}
              </Field>
              <Field label={t('invoiceCurrency')} id="invoice-currency">
                <Select value={form.currency} onValueChange={(currency) => update({ currency })}>
                  <SelectTrigger id="invoice-currency" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((option) => <SelectItem key={option.value} value={option.value}>{option.value}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError('currency')}
              </Field>
              <Field label={t('invoiceDueIn')} id="invoice-due">
                <Input id="invoice-due" type="number" inputMode="numeric" min={0} max={INVOICE_LIMITS.maxDueInDays} value={form.dueInDays} onChange={(event) => update({ dueInDays: event.target.value })} aria-invalid={errors.dueInDays ? true : undefined} />
                {fieldError('dueInDays')}
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('invoiceLineItems')}</h3>
              <ul className="space-y-3">
                {form.lines.map((line, index) => (
                  <li key={line.key} className="space-y-2 rounded-xl border border-border/70 p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_4.5rem_auto] sm:items-end">
                      <Field label={t('invoiceListing')} id={`line-listing-${line.key}`}>
                        <Select value={line.listingId || undefined} onValueChange={(value) => chooseListing(line.key, value)} disabled={listings === null}>
                          <SelectTrigger id={`line-listing-${line.key}`} className="w-full" aria-invalid={touched && !line.listingId ? true : undefined}>
                            <SelectValue placeholder={listings === null ? t('invoiceListingsLoading') : t('invoiceChooseListing')} />
                          </SelectTrigger>
                          <SelectContent>
                            {listingOptions.map((option) => {
                              // A listing already on another line can't be picked again.
                              const taken = option.id !== line.listingId && form.lines.some((other) => other.key !== line.key && other.listingId === option.id);
                              return <SelectItem key={option.id} value={option.id} disabled={taken}>{taken ? `${option.label} · ${t('invoiceListingAdded')}` : option.label}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={t('invoiceLineAmount')} id={`line-amount-${line.key}`}>
                        <Input id={`line-amount-${line.key}`} type="number" inputMode="decimal" min={0} step="0.01" value={line.amount} onChange={(event) => updateLine(line.key, { amount: event.target.value })} />
                      </Field>
                      <Field label={t('invoiceLineQuantity')} id={`line-qty-${line.key}`}>
                        <Input id={`line-qty-${line.key}`} type="number" inputMode="numeric" min={1} step={1} value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} />
                      </Field>
                      <Button type="button" variant="ghost" size="icon" aria-label={t('invoiceRemoveLine', { index: index + 1 })} disabled={form.lines.length === 1} onClick={() => update({ lines: form.lines.filter((item) => item.key !== line.key) })}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <Input aria-label={t('invoiceLineDescription')} placeholder={t('invoiceLineDescription')} value={line.description} maxLength={INVOICE_LIMITS.description} onChange={(event) => updateLine(line.key, { description: event.target.value })} />
                  </li>
                ))}
              </ul>
              {fieldError('lineItems')}
              {listings !== null && listings.length === 0 ? <p className="text-xs text-muted-foreground">{t('invoiceNoListings')}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" disabled={form.lines.length >= INVOICE_LIMITS.lineItems || (listings !== null && form.lines.length >= listingOptions.length)} onClick={() => update({ lines: [...form.lines, newLine()] })}>
                  <Plus className="size-4" aria-hidden="true" /> {t('invoiceAddLine')}
                </Button>
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('invoiceTotal')}: </span>
                  <span className="font-semibold tabular-nums">{formatPrice(total, form.currency, locale)}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{t('invoiceTaxNote')}</p>
            </section>

            <Field label={t('invoiceMessage')} id="invoice-message">
              <Textarea id="invoice-message" rows={3} maxLength={INVOICE_LIMITS.message} value={form.message} onChange={(event) => update({ message: event.target.value })} />
            </Field>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={sending !== null}>{t('invoiceCancel')}</Button>
              <Button type="button" variant="outline" onClick={() => void submit(true)} disabled={sending !== null}>
                {sending === 'send' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />} {t('invoiceCreateSend')}
              </Button>
              <Button type="submit" disabled={sending !== null}>
                {sending === 'create' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FilePlus2 className="size-4" aria-hidden="true" />} {t('invoiceCreate')}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

function CreatedSummary({ created, locale, onClose }: { created: CreatedInvoice; locale: string; onClose: () => void }) {
  const t = useDt();
  const { invoice, checkoutUrl, warning } = created;
  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-300/60 bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{invoice.number || t('invoiceUnnumbered')} · {formatPrice(invoice.total, invoice.currency, locale)}</p>
          <p className="text-muted-foreground">{invoice.customerName} · {invoice.customerEmail}</p>
        </div>
      </div>
      {invoice.status === 'DRAFT' && !warning ? <p className="text-sm text-muted-foreground">{t('invoiceDraftCreatedHint')}</p> : null}
      {warning ? (
        <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="alert">
          {t('invoiceCreatedWarning')} {warning}
        </p>
      ) : null}
      {checkoutUrl ? (
        <div className="space-y-1.5">
          <label htmlFor="invoice-created-link" className="text-xs font-medium">{t('invoicePaymentLink')}</label>
          <div className="flex gap-2">
            <Input id="invoice-created-link" readOnly value={checkoutUrl} onFocus={(event) => event.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={() => void copyText(checkoutUrl, t('invoiceLinkCopied'))}>
              <Copy className="size-4" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">{t('invoiceCopyLink')}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('invoicePaymentLinkHint')}</p>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="button" onClick={onClose}>{t('invoiceClose')}</Button>
      </div>
    </div>
  );
}
