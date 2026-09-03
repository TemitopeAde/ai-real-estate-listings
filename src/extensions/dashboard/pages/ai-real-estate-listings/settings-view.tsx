import { useEffect, useState } from 'react';
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
import { embedSavedPropertiesLauncher } from '@/lib/saved-properties';
import { CURRENCIES } from '@/lib/currencies';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DEFAULT_WORKSPACE_SETTINGS,
  writeWorkspaceSettings,
  type WorkspaceSettings,
} from '@/lib/settings';
import {
  DASHBOARD_LANGUAGE_OPTIONS,
  isDashboardLanguageSetting,
  useDt,
} from '@/lib/dashboard-i18n';
import {
  AREA_UNIT_MESSAGE_KEYS,
  STATUS_MESSAGE_KEYS,
} from '@/lib/dashboard-i18n/labels';
import type { AreaUnit } from '@/lib/listing-types';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
}

export function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  const t = useDt();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft((current) =>
      current.dashboardLanguage === settings.dashboardLanguage
        ? current
        : { ...current, dashboardLanguage: settings.dashboardLanguage },
    );
  }, [settings.dashboardLanguage]);

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
      dashboard.showToast({ type: 'success', message: t('settingsSaved') });
    } catch (saveError) {
      console.error('Unable to save settings.', saveError);
      const message = t('settingsSaveFailed');
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
      await embedSavedPropertiesLauncher();
      dashboard.showToast({ type: 'success', message: t('launcherActive') });
    } catch (embedError) {
      console.error('Unable to embed Saved Properties launcher.', embedError);
      dashboard.showToast({ type: 'error', message: t('launcherFailed') });
    } finally { setEmbedding(false); }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('settingsEyebrow')}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{t('settingsTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t('settingsIntro')}</p>
      </div>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card className="max-w-3xl border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal className="size-5" aria-hidden="true" /></div>
          <CardTitle className="mt-4">{t('listingDefaults')}</CardTitle>
          <CardDescription>{t('listingDefaultsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t('defaultCurrency')} hint={t('defaultCurrencyHint')} />
              <Select value={draft.defaultCurrency} onValueChange={(value) => updateDraft('defaultCurrency', value)}>
                <SelectTrigger className="w-full" aria-label={t('defaultCurrency')}><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">{t('defaultCurrencyHelp')}</span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t('defaultAreaUnit')} hint={t('defaultAreaUnitHint')} />
              <Select value={draft.defaultAreaUnit} onValueChange={(value) => updateDraft('defaultAreaUnit', value)}>
                <SelectTrigger aria-label={t('defaultAreaUnit')}><SelectValue /></SelectTrigger>
                <SelectContent>{AREA_UNITS.map((option) => <SelectItem key={option.value} value={option.value}>{t(AREA_UNIT_MESSAGE_KEYS[option.value as AreaUnit])}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">{t('defaultAreaUnitHelp')}</span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t('defaultStatus')} hint={t('defaultStatusHint')} />
              <Select value={draft.defaultStatus} onValueChange={(value) => { if (isListingStatus(value)) updateDraft('defaultStatus', value); }}>
                <SelectTrigger aria-label={t('defaultStatus')}><SelectValue /></SelectTrigger>
                <SelectContent>{LISTING_STATUSES.map((option) => <SelectItem key={option.value} value={option.value}>{t(STATUS_MESSAGE_KEYS[option.value])}</SelectItem>)}</SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">{t('defaultStatusHelp')}</span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <FieldLabel text={t('dashboardLanguage')} hint={t('dashboardLanguageHint')} />
              <Select value={draft.dashboardLanguage} onValueChange={(value) => { if (isDashboardLanguageSetting(value)) updateDraft('dashboardLanguage', value); }}>
                <SelectTrigger aria-label={t('dashboardLanguage')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DASHBOARD_LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{t(option.nameKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border/70 p-3 text-sm">
              <input type="checkbox" checked={draft.showArchived} onChange={(event) => updateDraft('showArchived', event.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span><span className="flex items-center gap-1 font-medium">{t('includeArchived')} <FieldLabel text="" hint={t('includeArchivedHint')} /></span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t('includeArchivedHelp')}</span></span>
            </label>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">{saved ? <><Check className="size-4 text-emerald-600" aria-hidden="true" /> {t('savedLocally')}</> : t('changesUnsaved')}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /> {t('reset')}</Button>
              <Button onClick={save}><Save className="size-4" aria-hidden="true" /> {t('saveSettings')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <WixDesignSystemProvider>
        <Box direction="vertical" gap="SP3" padding="SP4" border="1px solid" borderColor="D80" maxWidth={768}>
          <Text tagName="h3" size="medium" weight="bold">{t('savedPropertiesLauncher')}</Text>
          <Text secondary>{t('savedPropertiesLauncherHint')}</Text>
          <Box align="space-between" verticalAlign="middle" gap="SP3">
            <Text size="small" secondary>{t('embedSafe')}</Text>
            <WdsButton priority="primary" size="small" disabled={embedding} onClick={() => void embedSavedProperties()}>{embedding ? t('embedding') : t('embedLauncher')}</WdsButton>
          </Box>
        </Box>
      </WixDesignSystemProvider>
    </div>
    </TooltipProvider>
  );
}

function FieldLabel({ text, hint }: { text: string; hint: string }) {
  const t = useDt();
  return <span className="flex items-center gap-1">{text}<Tooltip><TooltipTrigger asChild><button type="button" className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground" aria-label={t('helpPrefix', { hint })} onClick={(event) => event.stopPropagation()}><span aria-hidden="true">?</span></button></TooltipTrigger><TooltipContent>{hint}</TooltipContent></Tooltip></span>;
}
