import { LISTING_STATUSES, type ListingStatus } from './listings';
import {
  isDashboardLanguageSetting,
  type DashboardLanguageSetting,
} from './dashboard-i18n';

export const SETTINGS_STORAGE_KEY = 'ai-real-estate-listings.workspace-settings';

export interface WorkspaceSettings {
  defaultCurrency: string;
  defaultAreaUnit: string;
  defaultStatus: ListingStatus;
  showArchived: boolean;
  dashboardLanguage: DashboardLanguageSetting;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  defaultCurrency: 'USD',
  defaultAreaUnit: 'sq ft',
  defaultStatus: 'active',
  showArchived: false,
  dashboardLanguage: 'auto',
};

const SETTINGS_SCHEMA_VERSION = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is ListingStatus {
  return LISTING_STATUSES.some((option) => option.value === value);
}

export function readWorkspaceSettings(): WorkspaceSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_WORKSPACE_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_WORKSPACE_SETTINGS;
    }

    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) {
      return DEFAULT_WORKSPACE_SETTINGS;
    }

    const storedVersion =
      typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1;
    const storedStatus = isStatus(parsed.defaultStatus)
      ? parsed.defaultStatus
      : DEFAULT_WORKSPACE_SETTINGS.defaultStatus;
    const defaultStatus =
      storedVersion < SETTINGS_SCHEMA_VERSION && storedStatus === 'draft'
        ? 'active'
        : storedStatus;

    const settings: WorkspaceSettings = {
      defaultCurrency:
        typeof parsed.defaultCurrency === 'string' && parsed.defaultCurrency.trim()
          ? parsed.defaultCurrency.toUpperCase()
          : DEFAULT_WORKSPACE_SETTINGS.defaultCurrency,
      defaultAreaUnit:
        typeof parsed.defaultAreaUnit === 'string' && parsed.defaultAreaUnit.trim()
          ? parsed.defaultAreaUnit
          : DEFAULT_WORKSPACE_SETTINGS.defaultAreaUnit,
      defaultStatus,
      showArchived:
        typeof parsed.showArchived === 'boolean'
          ? parsed.showArchived
          : DEFAULT_WORKSPACE_SETTINGS.showArchived,
      dashboardLanguage:
        typeof parsed.dashboardLanguage === 'string' &&
        isDashboardLanguageSetting(parsed.dashboardLanguage)
          ? parsed.dashboardLanguage
          : DEFAULT_WORKSPACE_SETTINGS.dashboardLanguage,
    };

    if (storedVersion < SETTINGS_SCHEMA_VERSION) {
      writeWorkspaceSettings(settings);
    }

    return settings;
  } catch (error) {
    console.error('Unable to read workspace settings.', error);
    return DEFAULT_WORKSPACE_SETTINGS;
  }
}

export function writeWorkspaceSettings(settings: WorkspaceSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }),
    );
  } catch (error) {
    console.error('Unable to save workspace settings.', error);
    throw new Error('Settings could not be saved in this browser.');
  }
}
