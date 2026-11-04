import { useCallback, useEffect, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Link2, Loader2, Plus, Receipt, RefreshCw, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPrice } from '@/lib/formatters';
import { useDashboardI18n, useDt, type DashboardMessageKey } from '@/lib/dashboard-i18n';
import {
  INVOICE_FILTERS,
  getInvoice,
  getInvoicePaymentLink,
  queryInvoices,
  resendInvoice,
  type InvoiceFilter,
  type InvoiceRecord,
} from '@/lib/invoices';
import { cn } from '@/lib/utils';
import { useEntitlement, useEntitlementPending } from './entitlement-context';
import { InvoiceComposer } from './invoice-composer';
import { InvoiceStatusPill, copyText } from './invoice-ui';
import { PlanGate } from './plan-gate';

const PAGE_SIZE = 20;

const FILTER_KEYS: Record<InvoiceFilter, DashboardMessageKey> = {
  all: 'invoiceFilterAll',
  unpaid: 'invoiceFilterUnpaid',
  paid: 'invoiceFilterPaid',
  voided: 'invoiceFilterVoided',
};

export function InvoicesView({ refreshToken, onOpenPricing }: { refreshToken: number; onOpenPricing: () => void }) {
  const t = useDt();
  const entitlement = useEntitlement();
  const pending = useEntitlementPending();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('eyebrowBilling')}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('invoicesTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('invoicesIntro')}</p>
      </div>
      {pending ? (
        <Skeleton className="h-64 w-full" />
      ) : entitlement.features.invoices ? (
        <InvoicesList refreshToken={refreshToken} />
      ) : (
        <PlanGate title={t('invoicesLockedTitle')} description={t('invoicesLockedBody')} onUpgrade={onOpenPricing} />
      )}
    </div>
  );
}

function InvoicesList({ refreshToken }: { refreshToken: number }) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [search, setSearch] = useState('');
  // Wix uses cursor paging: cursors[i] loads page i (page 0 has none).
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [page, setPage] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await queryInvoices({ pageSize: PAGE_SIZE, filter, search: search.trim(), cursor: cursors[page] });
      setInvoices(result.items);
      setNextCursor(result.nextCursor);
      if (page === 0) setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('invoicesLoadError'));
    } finally {
      setLoading(false);
    }
  }, [cursors, filter, page, search, t]);

  const resetPaging = () => { setPage(0); setCursors([undefined]); };
  const goNext = () => {
    if (!nextCursor) return;
    setCursors((items) => [...items.slice(0, page + 1), nextCursor]);
    setPage((value) => value + 1);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load, refreshToken]);

  const replace = (invoice: InvoiceRecord) => setInvoices((items) => items.map((item) => (item._id === invoice._id ? invoice : item)));
  const selected = invoices.find((invoice) => invoice._id === selectedId) ?? null;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label={t('invoiceFilterLabel')} className="flex gap-2 overflow-x-auto pb-1">
          {INVOICE_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              onClick={() => { setFilter(item); resetPaging(); }}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                filter === item ? 'border-primary bg-primary/5 text-foreground' : 'border-border/70 text-muted-foreground hover:bg-muted/50',
              )}
            >
              {t(FILTER_KEYS[item])}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading} aria-label={t('invoiceRefresh')}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" /> <span className="hidden sm:inline">{t('invoiceRefresh')}</span>
          </Button>
          <Button onClick={() => setComposerOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="size-4" aria-hidden="true" /> {t('invoiceNew')}
          </Button>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border-border/70 p-0 shadow-sm">
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); resetPaging(); }} placeholder={t('invoiceSearchPlaceholder')} aria-label={t('invoiceSearchLabel')} />
          </div>
        </div>
        {error ? (
          <div className="p-8 text-center text-sm text-destructive" role="alert">{error}</div>
        ) : loading && invoices.length === 0 ? (
          <div className="space-y-2 p-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Receipt className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('invoicesEmpty')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60" aria-busy={loading}>
            {invoices.map((invoice) => (
              <li key={invoice._id}>
                <button type="button" onClick={() => setSelectedId(invoice._id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Receipt className="size-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{invoice.number || t('invoiceUnnumbered')} · {invoice.customerName || invoice.customerEmail}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(invoice.total, invoice.currency, locale)}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {[invoice.listingTitle, invoice.dueDate ? t('invoiceDueOn', { date: formatDate(invoice.dueDate, locale) }) : ''].filter(Boolean).join(' · ')}
                      </span>
                      <InvoiceStatusPill invoice={invoice} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {invoices.length > 0 && (page > 0 || nextCursor) ? (
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
            <span>{t('invoicePageRange', { from: page * PAGE_SIZE + 1, to: page * PAGE_SIZE + invoices.length, total: total ?? '–' })}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" aria-label={t('previous')} disabled={page === 0 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={t('next')} disabled={!nextCursor || loading} onClick={goNext}><ChevronRight /></Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('invoiceDetailsTitle')}</SheetTitle>
            <SheetDescription>{selected ? `${selected.number || t('invoiceUnnumbered')} · ${selected.title}` : ''}</SheetDescription>
          </SheetHeader>
          {selected ? <InvoiceDetail key={selected._id} invoice={selected} onChange={replace} /> : null}
        </SheetContent>
      </Sheet>

      <InvoiceComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onCreated={(invoice) => { setInvoices((items) => [invoice, ...items.filter((item) => item._id !== invoice._id)]); setTotal((count) => (count === undefined ? count : count + 1)); }}
      />
    </>
  );
}

/** Invoice summary with payment-link, Resend and Refresh actions. */
export function InvoiceDetail({ invoice, onChange }: { invoice: InvoiceRecord; onChange: (invoice: InvoiceRecord) => void }) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const [busy, setBusy] = useState<'refresh' | 'send' | 'link' | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const run = useCallback(async (kind: 'refresh' | 'send' | 'link', action: () => Promise<InvoiceRecord>, success?: string) => {
    setBusy(kind);
    try {
      const next = await action();
      onChange(next);
      if (success) dashboard.showToast({ type: 'success', message: success });
    } catch (error) {
      dashboard.showToast({ type: 'error', message: error instanceof Error ? error.message : t('invoiceActionError') });
    } finally {
      setBusy(null);
    }
  }, [onChange, t]);

  const payable = invoice.status !== 'PAID' && invoice.status !== 'VOIDED';
  const getLink = () => run('link', async () => {
    const result = await getInvoicePaymentLink(invoice._id);
    setCheckoutUrl(result.checkoutUrl);
    await copyText(result.checkoutUrl, t('invoiceLinkCopied'));
    return result.invoice;
  });

  return (
    <div className="space-y-5 px-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(invoice.total, invoice.currency, locale)}</p>
          <p className="text-sm text-muted-foreground">{invoice.customerName} · {invoice.customerEmail}</p>
        </div>
        <InvoiceStatusPill invoice={invoice} />
      </div>

      <dl className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">{t('invoicePaidAmount')}</dt><dd className="font-medium tabular-nums">{formatPrice(invoice.paidAmount, invoice.currency, locale)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('invoiceBalance')}</dt><dd className="font-medium tabular-nums">{formatPrice(invoice.balance, invoice.currency, locale)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('invoiceCreatedLabel')}</dt><dd className="font-medium">{formatDate(invoice._createdDate, locale) || '—'}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t('invoiceDueLabel')}</dt><dd className="font-medium">{formatDate(invoice.dueDate, locale) || '—'}</dd></div>
        {invoice.listingTitle ? <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{t('invoiceProperty')}</dt><dd className="truncate font-medium">{invoice.listingTitle}</dd></div> : null}
      </dl>

      {checkoutUrl ? (
        <div className="space-y-1.5">
          <label htmlFor={`invoice-link-${invoice._id}`} className="text-xs font-medium">{t('invoicePaymentLink')}</label>
          <div className="flex gap-2">
            <Input id={`invoice-link-${invoice._id}`} readOnly value={checkoutUrl} onFocus={(event) => event.currentTarget.select()} />
            <Button type="button" variant="outline" size="icon" aria-label={t('invoiceCopyLink')} onClick={() => void copyText(checkoutUrl, t('invoiceLinkCopied'))}><Copy className="size-4" aria-hidden="true" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('invoicePaymentLinkHint')}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {payable ? (
          <Button size="sm" onClick={() => void getLink()} disabled={busy !== null}>
            {busy === 'link' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />} {t('invoiceGetLink')}
          </Button>
        ) : null}
        {payable ? (
          <Button size="sm" variant="outline" onClick={() => void run('send', () => resendInvoice(invoice._id), t(invoice.status === 'DRAFT' ? 'invoiceSentToast' : 'invoiceResent'))} disabled={busy !== null}>
            {busy === 'send' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />} {t(invoice.status === 'DRAFT' ? 'invoiceSend' : 'invoiceResend')}
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => void run('refresh', () => getInvoice(invoice._id), t('invoiceSynced'))} disabled={busy !== null}>
          <RefreshCw className={cn('size-4', busy === 'refresh' && 'animate-spin')} aria-hidden="true" /> {t('invoiceRefresh')}
        </Button>
        {invoice.invoiceUrl ? (
          <Button asChild size="sm" variant="ghost">
            <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" aria-hidden="true" /> {t('invoiceViewOnline')}</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
