import { useEffect, useState } from 'react';
import { Loader2, Search, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contactDisplayName, searchContacts, type ContactOption } from '@/lib/contacts';
import { useDt } from '@/lib/dashboard-i18n';
import { cn } from '@/lib/utils';

/**
 * Picks one of the site's contacts (Wix CRM). Search matches the start of a first name,
 * last name or email; with no search it lists the most recent contacts.
 */
export function ContactPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: ContactOption | null;
  onChange: (contact: ContactOption | null) => void;
  invalid?: boolean;
}) {
  const t = useDt();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ContactOption[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (value) return;
    let cancelled = false;
    setResults(null);
    setError('');
    const timer = window.setTimeout(() => {
      searchContacts(search.trim())
        .then((items) => { if (!cancelled) setResults(items); })
        .catch((loadError) => { if (!cancelled) { setResults([]); setError(loadError instanceof Error ? loadError.message : t('invoiceContactError')); } });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [search, value, t]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{contactDisplayName(value)}</p>
          <p className="truncate text-muted-foreground">{value.email || t('invoiceContactNoEmail')}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); onChange(null); }}>
          <X className="size-4" aria-hidden="true" /> {t('invoiceContactChange')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('invoiceContactSearch')}
          aria-invalid={invalid ? true : undefined}
          autoComplete="off"
        />
      </div>
      <div className={cn('max-h-64 overflow-y-auto rounded-xl border', invalid ? 'border-destructive/60' : 'border-border/70')} role="listbox" aria-label={t('invoiceContact')}>
        {results === null ? (
          <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t('invoiceContactLoading')}</p>
        ) : error ? (
          <p className="p-3 text-sm text-destructive" role="alert">{error}</p>
        ) : results.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">{t('invoiceContactNone')}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {results.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => onChange(contact)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{contactDisplayName(contact)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{contact.email || t('invoiceContactNoEmail')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
