import { useEffect, useMemo, useRef, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import { ChevronDown, Loader2, Mail, RotateCcw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useDt } from '@/lib/dashboard-i18n';
import {
  DEFAULT_QUOTE_CONFIRMATION_TEMPLATE,
  QUOTE_TEMPLATE_BODY_MAX,
  QUOTE_TEMPLATE_PLACEHOLDERS,
  QUOTE_TEMPLATE_SUBJECT_MAX,
  SAMPLE_QUOTE_TEMPLATE_VALUES,
  renderQuoteTemplate,
  validateQuoteConfirmationTemplate,
  type QuoteConfirmationTemplate,
} from '@/lib/quote-email-template';
import { getQuoteConfirmationTemplate, saveQuoteConfirmationTemplate } from '@/lib/quote-requests';
import { useEntitlement } from './entitlement-context';

type Field = 'subject' | 'body';

/** Lets the site owner edit the confirmation email sent to visitors who request a quote. */
export function QuoteEmailEditor() {
  const t = useDt();
  const entitlement = useEntitlement();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<QuoteConfirmationTemplate | null>(null);
  const [draft, setDraft] = useState<QuoteConfirmationTemplate>(DEFAULT_QUOTE_CONFIRMATION_TEMPLATE);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const lastField = useRef<Field>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    getQuoteConfirmationTemplate()
      .then((template) => { if (active) { setSaved(template); setDraft(template); } })
      .catch((error: unknown) => { console.error('Unable to load the confirmation email.', error); if (active) setLoadError(t('quoteEmailLoadError')); });
    return () => { active = false; };
  }, [t]);

  const validation = useMemo(() => validateQuoteConfirmationTemplate(draft), [draft]);
  const dirty = saved !== null && JSON.stringify(saved) !== JSON.stringify(draft);
  const preview = {
    subject: renderQuoteTemplate(draft.subject, SAMPLE_QUOTE_TEMPLATE_VALUES),
    body: renderQuoteTemplate(draft.body, SAMPLE_QUOTE_TEMPLATE_VALUES),
  };

  const insertPlaceholder = (name: string) => {
    const field = lastField.current;
    const element = field === 'subject' ? subjectRef.current : bodyRef.current;
    const token = `{${name}}`;
    const value = draft[field];
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    setDraft({ ...draft, [field]: `${value.slice(0, start)}${token}${value.slice(end)}` });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async () => {
    if (!validation.value) return;
    setSaving(true);
    try {
      const result = await saveQuoteConfirmationTemplate(validation.value);
      setSaved(result);
      setDraft(result);
      dashboard.showToast({ type: 'success', message: t('quoteEmailSaved') });
    } catch (error) {
      console.error('Unable to save the confirmation email.', error);
      dashboard.showToast({ type: 'error', message: error instanceof Error ? error.message : t('quoteEmailSaveError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="pb-4">
        <button
          type="button"
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={open}
          aria-controls="quote-email-editor-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="size-4" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t('quoteEmailTitle')}
              {saved ? <Badge variant={saved.enabled ? 'secondary' : 'outline'}>{saved.enabled ? t('quoteEmailOn') : t('quoteEmailOff')}</Badge> : null}
            </CardTitle>
            <CardDescription className="mt-1">{t('quoteEmailIntro')}</CardDescription>
          </span>
          <ChevronDown className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </CardHeader>
      <CardContent id="quote-email-editor-panel" hidden={!open} className="space-y-5">
        {!entitlement.features.quoteEmail ? (
          <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{t('quoteEmailPlanNote')}</p>
        ) : null}
        {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
        {saved === null && !loadError ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t('quoteEmailLoading')}</p>
        ) : null}
        {saved !== null ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm font-medium">
                {t('quoteEmailEnabled')}
                <Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} />
              </label>
              <div className="space-y-1.5">
                <label htmlFor="quote-email-subject" className="text-sm font-medium">{t('quoteEmailSubject')}</label>
                <Input
                  id="quote-email-subject"
                  ref={subjectRef}
                  value={draft.subject}
                  maxLength={QUOTE_TEMPLATE_SUBJECT_MAX}
                  aria-invalid={validation.errors.subject ? true : undefined}
                  onFocus={() => { lastField.current = 'subject'; }}
                  onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                />
                {validation.errors.subject ? <p className="text-xs text-destructive">{validation.errors.subject}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="quote-email-body" className="text-sm font-medium">{t('quoteEmailBody')}</label>
                <Textarea
                  id="quote-email-body"
                  ref={bodyRef}
                  rows={10}
                  value={draft.body}
                  maxLength={QUOTE_TEMPLATE_BODY_MAX}
                  aria-invalid={validation.errors.body ? true : undefined}
                  onFocus={() => { lastField.current = 'body'; }}
                  onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                />
                {validation.errors.body ? <p className="text-xs text-destructive">{validation.errors.body}</p> : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t('quoteEmailPlaceholders')}</p>
                <p className="text-xs text-muted-foreground">{t('quoteEmailPlaceholdersHint')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUOTE_TEMPLATE_PLACEHOLDERS.map((name) => (
                    <Button key={name} type="button" variant="outline" size="sm" className="font-mono text-xs" onClick={() => insertPlaceholder(name)}>
                      {`{${name}}`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t('quoteEmailPreview')}</p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs text-muted-foreground">{t('quoteEmailSubject')}</p>
                <p className="mb-3 font-semibold">{preview.subject || '—'}</p>
                <div className="space-y-3 whitespace-pre-wrap leading-6">{preview.body || '—'}</div>
                <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{t('quoteEmailPreviewNote')}</p>
              </div>
            </div>
          </div>
        ) : null}
        {saved !== null ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            <span className="mr-auto text-xs text-muted-foreground">{dirty ? t('changesUnsaved') : t('quoteEmailUpToDate')}</span>
            <Button type="button" variant="ghost" onClick={() => setDraft(DEFAULT_QUOTE_CONFIRMATION_TEMPLATE)}>
              <RotateCcw className="size-4" aria-hidden="true" /> {t('quoteEmailReset')}
            </Button>
            <Button type="button" onClick={() => void save()} disabled={!dirty || !validation.value || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />} {t('quoteEmailSave')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
