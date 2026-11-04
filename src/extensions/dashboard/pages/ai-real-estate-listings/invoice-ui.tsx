import { dashboard } from '@wix/dashboard';
import { useDt, type DashboardMessageKey } from '@/lib/dashboard-i18n';
import { invoiceDisplayStatus, type InvoiceDisplayStatus, type InvoiceRecord } from '@/lib/invoices';
import { cn } from '@/lib/utils';

export const INVOICE_STATUS_KEYS: Record<InvoiceDisplayStatus, DashboardMessageKey> = {
  draft: 'invoiceStatusDraft',
  published: 'invoiceStatusPublished',
  sent: 'invoiceStatusSent',
  viewed: 'invoiceStatusViewed',
  overdue: 'invoiceStatusOverdue',
  partially_paid: 'invoiceStatusPartiallyPaid',
  paid: 'invoiceStatusPaid',
  voided: 'invoiceStatusVoided',
};

const STATUS_STYLES: Record<InvoiceDisplayStatus, { dot: string; pill: string }> = {
  draft: { dot: 'bg-slate-400', pill: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  published: { dot: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  sent: { dot: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  viewed: { dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  overdue: { dot: 'bg-rose-500', pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  partially_paid: { dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  paid: { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  voided: { dot: 'bg-zinc-400', pill: 'bg-zinc-500/10 text-zinc-600 line-through dark:text-zinc-400' },
};

export function InvoiceStatusPill({ invoice }: { invoice: Pick<InvoiceRecord, 'status' | 'statusQualifiers'> }) {
  const t = useDt();
  const status = invoiceDisplayStatus(invoice);
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status].pill)}>
      <span className={cn('size-1.5 rounded-full', STATUS_STYLES[status].dot)} aria-hidden="true" />
      {t(INVOICE_STATUS_KEYS[status])}
    </span>
  );
}

export async function copyText(value: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    dashboard.showToast({ type: 'success', message: successMessage });
  } catch {
    // Clipboard can be blocked inside the dashboard iframe; show the value instead.
    dashboard.showToast({ type: 'standard', message: value });
  }
}
