import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createInvoice, queryInvoiceRequests } from '@/lib/invoice-requests';
import type { InvoiceRequest } from '@/lib/listing-types';

export function RequestsView() {
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRequests(await queryInvoiceRequests()); setError(null); }
    catch (reason) { console.error('Unable to load invoice requests.', reason); setError(reason instanceof Error ? reason.message : 'Invoice requests are unavailable.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const submit = async (request: InvoiceRequest) => {
    if (activeId || draftId !== request._id || !amount || !dueDate) return;
    setActiveId(request._id);
    try {
      const updated = await createInvoice(request._id, Number(amount), issueDate, dueDate);
      setRequests((current) => current.map((item) => item._id === updated._id ? updated : item));
      setAmount(''); setDueDate(''); setDraftId(null); setError(null);
    } catch (reason) { console.error('Unable to create invoice from request.', reason); setError(reason instanceof Error ? reason.message : 'The invoice could not be created.'); }
    finally { setActiveId(null); }
  };

  return <div className="space-y-6"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Customer enquiries</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Invoice requests</h2><p className="mt-2 text-sm text-muted-foreground">Review customer details and create Wix invoice drafts.</p></div><Button type="button" variant="outline" onClick={() => void load()}>Refresh</Button></div>{error ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</p> : null}{loading ? <p className="text-sm text-muted-foreground">Loading requests…</p> : requests.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No invoice requests yet.</CardContent></Card> : <div className="grid gap-4">{requests.map((request) => <Card key={request._id}><CardHeader><CardTitle>{request.listingTitle}</CardTitle><CardDescription>{request.firstName} {request.lastName} · {request.email} · {request.phone}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{request.streetAddress}, {request.city}, {request.state}, {request.country} {request.postalCode}</p>{request.message ? <p className="rounded-lg bg-muted/50 p-3 text-sm">{request.message}</p> : null}{request.invoiceId ? <p className="text-sm font-medium text-primary">Invoice draft created: {request.invoiceId}</p> : draftId === request._id ? <div className="grid gap-3 sm:grid-cols-3"><Input type="number" min="0.01" step="0.01" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} /><Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} aria-label="Issue date" /><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Due date" /><Button type="button" className="sm:col-span-3" disabled={activeId !== null} onClick={() => void submit(request)}>{activeId === request._id ? 'Creating invoice…' : 'Create invoice draft'}</Button></div> : <Button type="button" onClick={() => { setDraftId(request._id); setAmount(request.invoiceAmount?.toString() ?? ''); setIssueDate(new Date().toISOString().slice(0, 10)); setDueDate(''); setError(null); }}>Create invoice draft</Button>}</CardContent></Card>)}</div>}</div>;
}
