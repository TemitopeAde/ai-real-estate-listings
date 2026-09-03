import { useCallback, useEffect, useState } from 'react';
import { Archive, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPrice } from '@/lib/formatters';
import { useDashboardI18n, useDt } from '@/lib/dashboard-i18n';
import { QUOTE_STATUS_MESSAGE_KEYS } from '@/lib/dashboard-i18n/labels';
import {
  isQuoteRequestStatus,
  queryQuoteRequests,
  QUOTE_REQUEST_STATUSES,
  updateQuoteRequest,
  type QuoteRequest,
  type QuoteRequestStatus,
} from '@/lib/quote-requests';

const PAGE_SIZE = 10;

export function RequestsView({ refreshToken }: { refreshToken: number }) {
  const t = useDt();
  const { locale } = useDashboardI18n();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteRequestStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await queryQuoteRequests({
        page,
        pageSize: PAGE_SIZE,
        search,
        status: status === 'all' ? undefined : status,
      });
      setRequests(result.items);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
    } catch {
      setError(t('quotesLoadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load, refreshToken]);

  const save = async (
    request: QuoteRequest,
    update: { status?: QuoteRequestStatus; notes?: string; archived?: boolean },
  ) => {
    setSavingId(request._id);
    try {
      const saved = await updateQuoteRequest(request._id, update);
      setRequests((items) => items.map((item) => (item._id === saved._id ? saved : item)));
    } catch {
      setError(t('quotesUpdateError'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('requestsEyebrow')}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('requestsTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('requestsIntro')}</p>
      </div>
      <Card>
        <CardHeader className="gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('incomingRequests')}</CardTitle>
            <CardDescription>
              {totalCount === 1
                ? t('requestCount', { count: totalCount })
                : t('requestCountPlural', { count: totalCount })}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder={t('searchProperty')}
                aria-label={t('searchQuoteRequests')}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value === 'all' || !isQuoteRequestStatus(value) ? 'all' : value);
                setPage(0);
              }}
            >
              <SelectTrigger className="sm:w-36" aria-label={t('filterQuoteStatus')}>
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                {QUOTE_REQUEST_STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(QUOTE_STATUS_MESSAGE_KEYS[item.value])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label={t('refreshQuotes')}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{t('noQuotes')}</div>
          ) : (
            <div className="divide-y divide-border/60">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-start"
                >
                  <div>
                    <p className="font-semibold">{request.listingTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.listingCity} · {formatPrice(request.listingPrice, request.listingCurrency, locale)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(request._createdDate, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      {request.firstName} {request.lastName}
                    </p>
                    <a
                      className="text-sm text-primary underline-offset-4 hover:underline"
                      href={`mailto:${request.email}`}
                    >
                      {request.email}
                    </a>
                    {request.phone ? (
                      <p className="text-sm text-muted-foreground">{request.phone}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary">
                      {t(QUOTE_STATUS_MESSAGE_KEYS[request.status])}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {request.message ? (
                        <div
                          className="quote-request-message max-w-none [&_a]:text-primary [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2"
                          dangerouslySetInnerHTML={{ __html: request.message }}
                        />
                      ) : (
                        t('noMessage')
                      )}
                    </div>
                    <Textarea
                      defaultValue={request.notes}
                      placeholder={t('internalNotes')}
                      aria-label={t('notesFor', { title: request.listingTitle })}
                      onBlur={(event) => {
                        if (event.target.value !== (request.notes ?? '')) {
                          void save(request, { notes: event.target.value });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={request.status}
                      disabled={savingId === request._id}
                      onValueChange={(value) => {
                        if (isQuoteRequestStatus(value)) void save(request, { status: value });
                      }}
                    >
                      <SelectTrigger aria-label={t('statusFor', { title: request.listingTitle })}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTE_REQUEST_STATUSES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {t(QUOTE_STATUS_MESSAGE_KEYS[item.value])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingId === request._id}
                      onClick={() => void save(request, { archived: true })}
                    >
                      <Archive className="size-4" /> {t('archive')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && requests.length > 0 ? (
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <span className="text-muted-foreground">{t('pageLabel', { current: page + 1 })}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((value) => value - 1)}
                >
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
