import { useState } from 'react';
import { dashboard } from '@wix/dashboard';
import { Box, Button as WdsButton, Text, WixDesignSystemProvider } from '@wix/design-system';
import { Check, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AREA_UNITS, isListingStatus, LISTING_STATUSES } from '@/lib/listings';
import { CURRENCIES } from '@/lib/currencies';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DEFAULT_WORKSPACE_SETTINGS,
  writeWorkspaceSettings,
  type WorkspaceSettings,
} from '@/lib/settings';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
}

export function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDraft = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const save = () => {
    try {
      const nextSettings = {
        ...draft,
        defaultCurrency: draft.defaultCurrency.trim().toUpperCase() || DEFAULT_WORKSPACE_SETTINGS.defaultCurrency,
      };
      writeWorkspaceSettings(nextSettings);
      onSettingsChange(nextSettings);
      setDraft(nextSettings);
      setSaved(true);
      dashboard.showToast({ type: 'success', message: 'Workspace settings saved.' });
    } catch (saveError) {
      console.error('Unable to save settings.', saveError);
      const message = saveError instanceof Error ? saveError.message : 'Settings could not be saved in this browser.';
      setError(message);
      dashboard.showToast({ type: 'error', message });
    }
  };

  const reset = () => {
    setDraft(DEFAULT_WORKSPACE_SETTINGS);
    setSaved(false);
    setError(null);
  };

  const [embedding, setEmbedding] = useState(false);
  const embedSavedProperties = async () => {
    setEmbedding(true);
    try {
      const response = await fetch('/api/saved-properties/embed', { method: 'POST', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('The launcher could not be embedded.');
      dashboard.showToast({ type: 'success', message: 'Saved Properties launcher is active on the site.' });
    } catch (embedError) {
      console.error('Unable to embed Saved Properties launcher.', embedError);
      dashboard.showToast({ type: 'error', message: embedError instanceof Error ? embedError.message : 'The launcher could not be embedded.' });
    } finally { setEmbedding(false); }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Workspace preferences</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Set sensible defaults for new listings and keep the workspace focused on the records your team is actively managing.</p>
      </div>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card className="max-w-3xl border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal className="size-5" aria-hidden="true" /></div>
          <CardTitle className="mt-4">Listing defaults</CardTitle>
          <CardDescription>These preferences prefill new listings. Existing records are not changed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text="Default currency" hint="The currency preselected for new listing prices." />
              <Select value={draft.defaultCurrency} onValueChange={(value) => updateDraft('defaultCurrency', value)}>
                <SelectTrigger className="w-full" aria-label="Default currency"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">Choose from the full ISO 4217 currency list.</span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text="Default area unit" hint="The measurement unit preselected for new listing areas." />
              <Select value={draft.defaultAreaUnit} onValueChange={(value) => updateDraft('defaultAreaUnit', value)}>
                <SelectTrigger aria-label="Default area unit"><SelectValue /></SelectTrigger>
                <SelectContent>{AREA_UNITS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">Applied to the area field on new records.</span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text="Default listing status" hint="The workflow status assigned to new listings." />
              <Select value={draft.defaultStatus} onValueChange={(value) => { if (isListingStatus(value)) updateDraft('defaultStatus', value); }}>
                <SelectTrigger aria-label="Default listing status"><SelectValue /></SelectTrigger>
                <SelectContent>{LISTING_STATUSES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">New listings open with this workflow stage.</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border/70 p-3 text-sm">
              <input type="checkbox" checked={draft.showArchived} onChange={(event) => updateDraft('showArchived', event.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span><span className="flex items-center gap-1 font-medium">Include archived listings <FieldLabel text="" hint="When enabled, archived listings appear in the Listings view by default." /></span><span className="mt-1 block text-xs font-normal text-muted-foreground">Keep archived records visible in the Listings view by default.</span></span>
            </label>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">{saved ? <><Check className="size-4 text-emerald-600" aria-hidden="true" /> Saved locally for this browser</> : 'Changes are not saved yet'}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /> Reset</Button>
              <Button onClick={save}><Save className="size-4" aria-hidden="true" /> Save settings</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <WixDesignSystemProvider>
        <Box direction="vertical" gap="SP3" padding="SP4" border="1px solid" borderColor="D80" maxWidth={768}>
          <Text tagName="h3" size="medium" weight="bold">Saved Properties launcher</Text>
          <Text secondary>Embed or restore the member saved-properties button and drawer on your live site.</Text>
          <Box align="space-between" verticalAlign="middle" gap="SP3">
            <Text size="small" secondary>Safe to run more than once.</Text>
            <WdsButton priority="primary" size="small" disabled={embedding} onClick={() => void embedSavedProperties()}>{embedding ? 'Embedding…' : 'Embed launcher'}</WdsButton>
          </Box>
        </Box>
      </WixDesignSystemProvider>
    </div>
    </TooltipProvider>
  );
}

function FieldLabel({ text, hint }: { text: string; hint: string }) {
  return <span className="flex items-center gap-1">{text}<Tooltip><TooltipTrigger asChild><button type="button" className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground" aria-label={`Help: ${hint}`} onClick={(event) => event.stopPropagation()}><span aria-hidden="true">?</span></button></TooltipTrigger><TooltipContent>{hint}</TooltipContent></Tooltip></span>;
}
