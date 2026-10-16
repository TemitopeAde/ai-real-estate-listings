import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Search,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatPrice } from '@/lib/formatters';
import { useDashboardI18n, useDt } from '@/lib/dashboard-i18n';
import { QUOTE_STATUS_MESSAGE_KEYS } from '@/lib/dashboard-i18n/labels';
import {
  QUOTE_REQUEST_STATUSES,
  queryQuoteRequests,
  sendQuoteReply,
  updateQuoteRequest,
  type QuoteRequest,
  type QuoteRequestCounts,
  type QuoteRequestStatus,
} from '@/lib/quote-requests';
import { cn } from '@/lib/utils';
import { QuoteEmailEditor } from './quote-email-editor';
import { useEntitlement } from './entitlement-context';
import { QUOTE_TEMPLATE_BODY_MAX, QUOTE_TEMPLATE_PLACEHOLDERS, QUOTE_TEMPLATE_SUBJECT_MAX, validateQuoteConfirmationTemplate } from '@/lib/quote-email-template';

const PAGE_SIZE = 20;

type Tab = 'active' | QuoteRequestStatus | 'archived';

const STATUS_STYLES: Record<QuoteRequestStatus, { dot: string; pill: string }> = {
  new: { dot: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  contacted: { dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  quoted: { dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  closed: { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
};

function initials(request: QuoteRequest): string {
  return `${request.firstName.charAt(0)}${request.lastName.charAt(0)}`.toUpperCase() || '?';
}

function plainText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|li|div)>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

function relativeTime(value: Date | string | undefined, locale: string): string {
  // Dates arrive from the API as ISO strings.
  const date = value ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) return '';
  const seconds = (date.getTime() - Date.now()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [['day', 86400], ['hour', 3600], ['minute', 60]];
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      if (unit === 'day' && Math.abs(seconds) > 7 * 86400) return formatDate(date, locale);
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return format.format(0, 'minute');
}

/** Matches the dashboard breakpoint where the list and detail sit side by side. */
function useWideLayout(): boolean {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return wide;
}

function StatusPill({ status }: { status: QuoteRequestStatus }) {
  const t = useDt();
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status].pill)}>
      <span className={cn('size-1.5 rounded-full', STATUS_STYLES[status].dot)} aria-hidden="true" />
      {t(QUOTE_STATUS_MESSAGE_KEYS[status])}
    </span>
  );
}

export function RequestsView({ refreshToken }: { refreshToken: number }) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const wide = useWideLayout();
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [counts, setCounts] = useState<QuoteRequestCounts | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await queryQuoteRequests({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim(),
        status: tab === 'active' || tab === 'archived' ? undefined : tab,
        view: tab === 'archived' ? 'archived' : 'active',
        withCounts: true,
      });
      setRequests(result.items);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
      if (result.counts) setCounts(result.counts);
    } catch {
      setError(t('quotesLoadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load, refreshToken]);

  // On wide screens keep a request open in the detail panel.
  useEffect(() => {
    if (!wide || loading) return;
    if (!requests.some((request) => request._id === selectedId)) setSelectedId(requests[0]?._id ?? null);
  }, [wide, loading, requests, selectedId]);

  const selected = useMemo(() => requests.find((request) => request._id === selectedId) ?? null, [requests, selectedId]);

  const save = async (request: QuoteRequest, update: { status?: QuoteRequestStatus; notes?: string; archived?: boolean }, successMessage?: string) => {
    setSavingId(request._id);
    try {
      const saved = await updateQuoteRequest(request._id, update);
      const leavesView =
        (update.archived === true && tab !== 'archived') ||
        (update.archived === false && tab === 'archived') ||
        (update.status !== undefined && tab !== 'active' && tab !== 'archived' && update.status !== tab);
      setRequests((items) => (leavesView ? items.filter((item) => item._id !== saved._id) : items.map((item) => (item._id === saved._id ? saved : item))));
      if (leavesView) {
        setSelectedId(null);
        setSheetOpen(false);
      }
      if (update.status !== undefined || update.archived !== undefined) void refreshCounts();
      if (successMessage) dashboard.showToast({ type: 'success', message: successMessage });
    } catch {
      dashboard.showToast({ type: 'error', message: t('quotesUpdateError') });
    } finally {
      setSavingId(null);
    }
  };

  const refreshCounts = async () => {
    try {
      const result = await queryQuoteRequests({ page: 0, pageSize: 1, search: '', withCounts: true });
      if (result.counts) setCounts(result.counts);
    } catch {
      // Counts are informational; the list is already up to date.
    }
  };

  const open = (request: QuoteRequest) => {
    setSelectedId(request._id);
    if (!wide) setSheetOpen(true);
  };

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'active', label: t('quoteTabAll'), count: counts?.active },
    ...QUOTE_REQUEST_STATUSES.map((item) => ({ id: item.value as Tab, label: t(QUOTE_STATUS_MESSAGE_KEYS[item.value]), count: counts?.[item.value] })),
    { id: 'archived', label: t('quoteTabArchived'), count: counts?.archived },
  ];

  const detail = selected ? (
    <RequestDetail
      key={selected._id}
      request={selected}
      saving={savingId === selected._id}
      locale={locale}
      onSave={save}
      onReplaced={(saved) => {
        setRequests((items) => items.map((item) => (item._id === saved._id ? saved : item)));
        void refreshCounts();
      }}
    />
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t('requestsEyebrow')}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('requestsTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('requestsIntro')}</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" /> {t('refreshQuotes')}
        </Button>
      </div>

      <div role="tablist" aria-label={t('filterQuoteStatus')} className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => {
          const active = tab === item.id;
          const status = item.id !== 'active' && item.id !== 'archived' ? item.id : null;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setTab(item.id); setPage(0); setSelectedId(null); }}
              className={cn(
                'flex min-w-28 shrink-0 flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors',
                active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/70 bg-card hover:bg-muted/50',
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {status ? <span className={cn('size-2 rounded-full', STATUS_STYLES[status].dot)} aria-hidden="true" /> : item.id === 'archived' ? <Archive className="size-3" aria-hidden="true" /> : <Inbox className="size-3" aria-hidden="true" />}
                {item.label}
              </span>
              <span className="mt-1 text-2xl font-semibold tabular-nums">{item.count ?? '–'}</span>
            </button>
          );
        })}
      </div>

      <Card className="gap-0 overflow-hidden border-border/70 p-0 shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-border/60 lg:border-r">
            <div className="border-b border-border/60 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                  placeholder={t('quoteSearchPlaceholder')}
                  aria-label={t('searchQuoteRequests')}
                />
              </div>
            </div>
            <div className="min-h-[24rem] flex-1 lg:max-h-[640px] lg:overflow-y-auto">
              {error ? (
                <div className="p-8 text-center text-sm text-destructive" role="alert">{error}</div>
              ) : loading && requests.length === 0 ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-12 text-center">
                  <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{t('noQuotes')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60" aria-busy={loading}>
                  {requests.map((request) => {
                    const isSelected = request._id === selectedId && (wide || sheetOpen);
                    const unread = request.status === 'new';
                    return (
                      <li key={request._id}>
                        <button
                          type="button"
                          onClick={() => open(request)}
                          aria-current={isSelected ? 'true' : undefined}
                          className={cn(
                            'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                            isSelected && 'bg-primary/5 hover:bg-primary/5',
                          )}
                        >
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {initials(request)}
                            {unread ? <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-sky-500" aria-hidden="true" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>{request.firstName} {request.lastName}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(request._createdDate, locale)}</span>
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{request.listingTitle}</span>
                            <span className="mt-1 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-muted-foreground/80">{plainText(request.message ?? '') || t('noMessage')}</span>
                              <StatusPill status={request.status} />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {requests.length > 0 && (page > 0 || hasNext) ? (
              <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                <span>{t('quotePageRange', { from: page * PAGE_SIZE + 1, to: page * PAGE_SIZE + requests.length, total: totalCount })}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={t('previous')} disabled={page === 0 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label={t('next')} disabled={!hasNext || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button>
                </div>
              </div>
            ) : null}
          </div>

          {wide ? (
            <div className="min-w-0">
              {detail ?? (
                <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 p-12 text-center text-sm text-muted-foreground">
                  <Mail className="size-8" aria-hidden="true" />
                  {t('quoteSelectPrompt')}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      {!wide ? (
        <Sheet open={sheetOpen && selected !== null} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('quoteDetailsTitle')}</SheetTitle>
              <SheetDescription>{selected ? `${selected.firstName} ${selected.lastName}` : ''}</SheetDescription>
            </SheetHeader>
            {detail}
          </SheetContent>
        </Sheet>
      ) : null}

      <QuoteEmailEditor />
    </div>
  );
}

function RequestDetail({
  request,
  saving,
  locale,
  onSave,
  onReplaced,
}: {
  request: QuoteRequest;
  saving: boolean;
  locale: string;
  onReplaced: (request: QuoteRequest) => void;
  onSave: (request: QuoteRequest, update: { status?: QuoteRequestStatus; notes?: string; archived?: boolean }, successMessage?: string) => Promise<void>;
}) {
  const t = useDt();
  const [notes, setNotes] = useState(request.notes ?? '');
  const [composing, setComposing] = useState(false);
  const notesDirty = notes !== (request.notes ?? '');
  const name = `${request.firstName} ${request.lastName}`.trim();
  const phone = request.phone?.replace(/[^\d+]/g, '') ?? '';
  const mailto = `mailto:${request.email}?subject=${encodeURIComponent(`Re: ${request.listingTitle}`)}`;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(request.email);
      dashboard.showToast({ type: 'success', message: t('quoteCopied') });
    } catch {
      dashboard.showToast({ type: 'error', message: request.email });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">{initials(request)}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{t('quoteReceived', { date: formatDateTime(request._createdDate, locale) })}</p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setComposing(true)} disabled={composing}><Send className="size-4" aria-hidden="true" /> {t('quoteSendEmail')}</Button>
        {phone ? <Button asChild size="sm" variant="outline"><a href={`tel:${phone}`}><Phone className="size-4" aria-hidden="true" /> {t('quoteCallAction')}</a></Button> : null}
        <Button size="sm" variant="outline" onClick={() => void copyEmail()}><Copy className="size-4" aria-hidden="true" /> {t('quoteCopyEmail')}</Button>
      </div>

      {composing ? (
        <ReplyComposer request={request} onCancel={() => setComposing(false)} onSent={(saved) => { setComposing(false); onReplaced(saved); }} />
      ) : null}

      <dl className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('quoteContactEmail')}</dt><dd className="truncate font-medium"><a className="text-primary underline-offset-4 hover:underline" href={mailto}>{request.email}</a></dd></div>
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('quoteContactPhone')}</dt><dd className="truncate font-medium">{request.phone || '—'}</dd></div>
      </dl>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('quoteProperty')}</h4>
        <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
          {request.listingPrimaryImage ? (
            <img src={request.listingPrimaryImage} alt="" className="size-16 shrink-0 rounded-lg bg-muted object-cover" />
          ) : (
            <span className="size-16 shrink-0 rounded-lg bg-muted" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{request.listingTitle}</p>
            <p className="text-sm font-semibold text-primary">{formatPrice(request.listingPrice, request.listingCurrency, locale)}</p>
            {request.listingAddress || request.listingCity ? (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" aria-hidden="true" /> {[request.listingAddress, request.listingCity].filter(Boolean).join(', ')}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('quoteMessage')}</h4>
        {request.message ? (
          <div
            className="rounded-xl bg-muted/40 p-4 text-sm leading-6 [&_a]:text-primary [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: request.message }}
          />
        ) : (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">{t('noMessage')}</p>
        )}
      </section>

      {request.emailLog?.length ? (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('quoteSentEmails')}</h4>
          <ul className="space-y-1.5">
            {[...request.emailLog].reverse().map((entry, index) => (
              <li key={`${String(entry.sentAt)}-${index}`} className="flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                <Send className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{entry.subject}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.sentAt, locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('quoteStatusLabel')}</h4>
        <div role="radiogroup" aria-label={t('statusFor', { title: request.listingTitle })} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUOTE_REQUEST_STATUSES.map((item) => {
            const active = request.status === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={saving}
                onClick={() => { if (!active) void onSave(request, { status: item.value }); }}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
                  active ? 'border-primary bg-primary/5 text-foreground' : 'border-border/70 text-muted-foreground hover:bg-muted/50',
                )}
              >
                <span className={cn('size-2 rounded-full', STATUS_STYLES[item.value].dot)} aria-hidden="true" />
                {t(QUOTE_STATUS_MESSAGE_KEYS[item.value])}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={`notes-${request._id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('quoteNotesLabel')}</label>
          <span className="text-xs text-muted-foreground">{t('quoteNotesHint')}</span>
        </div>
        <Textarea
          id={`notes-${request._id}`}
          rows={4}
          maxLength={4000}
          value={notes}
          placeholder={t('internalNotes')}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={!notesDirty || saving} onClick={() => void onSave(request, { notes }, t('quoteNotesSaved'))}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />} {t('quoteSaveNotes')}
          </Button>
        </div>
      </section>

      <div className="border-t border-border/60 pt-4">
        {request.archived ? (
          <Button variant="outline" size="sm" disabled={saving} onClick={() => void onSave(request, { archived: false }, t('quoteRestored'))}>
            <ArchiveRestore className="size-4" aria-hidden="true" /> {t('quoteRestore')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={saving} onClick={() => void onSave(request, { archived: true }, t('quoteArchived'))}>
            <Archive className="size-4" aria-hidden="true" /> {t('archive')}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReplyComposer({ request, onCancel, onSent }: { request: QuoteRequest; onCancel: () => void; onSent: (request: QuoteRequest) => void }) {
  const t = useDt();
  const entitlement = useEntitlement();
  const [subject, setSubject] = useState(`Re: ${request.listingTitle}`.slice(0, QUOTE_TEMPLATE_SUBJECT_MAX));
  const [body, setBody] = useState(`Hi {firstName},\n\n`);
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);
  // One key per composed message, so a retried request never sends twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const validation = validateQuoteConfirmationTemplate({ enabled: true, subject, body });
  const allowed = entitlement.features.quoteEmail;

  const send = async () => {
    setTouched(true);
    if (!validation.value || !allowed) return;
    setSending(true);
    try {
      const saved = await sendQuoteReply(request._id, { subject: validation.value.subject, body: validation.value.body, idempotencyKey });
      dashboard.showToast({ type: 'success', message: t('quoteEmailSent', { email: request.email }) });
      onSent(saved);
    } catch (error) {
      dashboard.showToast({ type: 'error', message: error instanceof Error ? error.message : t('quoteEmailSendError') });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.03] p-4" aria-label={t('quoteComposeTitle', { name: request.firstName })}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t('quoteComposeTitle', { name: request.firstName })}</h4>
        <Button variant="ghost" size="icon-sm" aria-label={t('quoteComposeCancel')} onClick={onCancel} disabled={sending}><X /></Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('quoteComposeTo', { email: request.email })}</p>
      {!allowed ? <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{t('quoteComposePlanNote')}</p> : null}
      <div className="space-y-1.5">
        <label htmlFor={`reply-subject-${request._id}`} className="text-xs font-medium">{t('quoteEmailSubject')}</label>
        <Input id={`reply-subject-${request._id}`} value={subject} maxLength={QUOTE_TEMPLATE_SUBJECT_MAX} onChange={(event) => setSubject(event.target.value)} aria-invalid={touched && validation.errors.subject ? true : undefined} />
        {touched && validation.errors.subject ? <p className="text-xs text-destructive">{validation.errors.subject}</p> : null}
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`reply-body-${request._id}`} className="text-xs font-medium">{t('quoteEmailBody')}</label>
        <Textarea id={`reply-body-${request._id}`} rows={8} value={body} maxLength={QUOTE_TEMPLATE_BODY_MAX} onChange={(event) => setBody(event.target.value)} aria-invalid={touched && validation.errors.body ? true : undefined} autoFocus />
        {touched && validation.errors.body ? <p className="text-xs text-destructive">{validation.errors.body}</p> : null}
        <p className="text-xs text-muted-foreground">{t('quoteComposeHint', { placeholders: QUOTE_TEMPLATE_PLACEHOLDERS.map((name) => `{${name}}`).join(' ') })}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={sending}>{t('quoteComposeCancel')}</Button>
        <Button size="sm" onClick={() => void send()} disabled={sending || !allowed}>
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />} {t('quoteComposeSend')}
        </Button>
      </div>
    </section>
  );
}
