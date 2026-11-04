import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, ListChecks, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSnapshot } from '@/lib/listings';
import { useDt, type DashboardMessageKey } from '@/lib/dashboard-i18n';

const CHECKLIST_STORAGE_PREFIX = 'ai-real-estate-listings.overview-checklist';

type ChecklistItemId =
  | 'addListing'
  | 'publishListing'
  | 'addWidget'
  | 'reviewSettings'
  | 'tryWriter'
  | 'checkRequests';

interface ChecklistState {
  checked: ChecklistItemId[];
  dismissed: boolean;
}

const EMPTY_STATE: ChecklistState = { checked: [], dismissed: false };

export interface OverviewChecklistActions {
  onAddListing: () => void;
  onViewListings: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onOpenWriter: () => void;
  onOpenRequests: () => void;
}

interface ChecklistItem {
  id: ChecklistItemId;
  titleKey: DashboardMessageKey;
  bodyKey: DashboardMessageKey;
  actionKey: DashboardMessageKey;
  onAction: (actions: OverviewChecklistActions) => void;
  /** Items with `isAutoComplete` are derived from workspace data and cannot be ticked manually. */
  isAutoComplete?: (snapshot: DashboardSnapshot) => boolean;
}

const ITEMS: ChecklistItem[] = [
  {
    id: 'addListing',
    titleKey: 'checklistAddListingTitle',
    bodyKey: 'checklistAddListingBody',
    actionKey: 'addListing',
    onAction: (actions) => actions.onAddListing(),
    isAutoComplete: (snapshot) => snapshot.total > 0,
  },
  {
    id: 'publishListing',
    titleKey: 'checklistPublishListingTitle',
    bodyKey: 'checklistPublishListingBody',
    actionKey: 'openListings',
    onAction: (actions) => actions.onViewListings(),
    isAutoComplete: (snapshot) => snapshot.active > 0,
  },
  {
    id: 'addWidget',
    titleKey: 'checklistAddWidgetTitle',
    bodyKey: 'checklistAddWidgetBody',
    actionKey: 'checklistOpenGuide',
    onAction: (actions) => actions.onOpenGuide(),
  },
  {
    id: 'reviewSettings',
    titleKey: 'checklistReviewSettingsTitle',
    bodyKey: 'checklistReviewSettingsBody',
    actionKey: 'openSettings',
    onAction: (actions) => actions.onOpenSettings(),
  },
  {
    id: 'tryWriter',
    titleKey: 'checklistTryWriterTitle',
    bodyKey: 'checklistTryWriterBody',
    actionKey: 'openWriter',
    onAction: (actions) => actions.onOpenWriter(),
  },
  {
    id: 'checkRequests',
    titleKey: 'checklistCheckRequestsTitle',
    bodyKey: 'checklistCheckRequestsBody',
    actionKey: 'openQuoteRequests',
    onAction: (actions) => actions.onOpenRequests(),
  },
];

const ITEM_IDS = new Set<string>(ITEMS.map((item) => item.id));

function storageKey(instanceId: string | undefined): string {
  return instanceId ? `${CHECKLIST_STORAGE_PREFIX}.${instanceId}` : CHECKLIST_STORAGE_PREFIX;
}

function readChecklistState(key: string): ChecklistState {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_STATE;
    const record = parsed as Record<string, unknown>;
    const checked = Array.isArray(record.checked)
      ? record.checked.filter(
          (id): id is ChecklistItemId => typeof id === 'string' && ITEM_IDS.has(id),
        )
      : [];
    return { checked, dismissed: record.dismissed === true };
  } catch {
    return EMPTY_STATE;
  }
}

function writeChecklistState(key: string, state: ChecklistState): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Unable to save overview checklist.', error);
  }
}

export function OverviewChecklist({
  snapshot,
  instanceId,
  actions,
}: {
  snapshot: DashboardSnapshot | null;
  instanceId: string | undefined;
  actions: OverviewChecklistActions;
}) {
  const t = useDt();
  const key = storageKey(instanceId);
  const [state, setState] = useState<ChecklistState>(() => readChecklistState(key));

  useEffect(() => {
    setState(readChecklistState(key));
  }, [key]);

  const update = useCallback(
    (next: ChecklistState) => {
      setState(next);
      writeChecklistState(key, next);
    },
    [key],
  );

  if (state.dismissed) return null;

  if (!snapshot) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  const isDone = (item: ChecklistItem) =>
    item.isAutoComplete ? item.isAutoComplete(snapshot) : state.checked.includes(item.id);

  const completed = ITEMS.filter(isDone).length;
  const allDone = completed === ITEMS.length;
  const percent = Math.round((completed / ITEMS.length) * 100);

  const toggle = (id: ChecklistItemId) => {
    const checked = state.checked.includes(id)
      ? state.checked.filter((value) => value !== id)
      : [...state.checked, id];
    update({ ...state, checked });
  };

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListChecks className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{t('checklistTitle')}</CardTitle>
            <CardDescription>
              {allDone ? t('checklistAllDone') : t('checklistHint')}
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => update({ ...state, dismissed: true })}
          aria-label={t('checklistDismiss')}
          title={t('checklistDismiss')}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('checklistDismiss')}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('checklistProgress', { done: completed, total: ITEMS.length })}</span>
            <span>{percent}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={ITEMS.length}
            aria-valuenow={completed}
            aria-label={t('checklistTitle')}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <ul className="divide-y divide-border/60">
          {ITEMS.map((item) => {
            const done = isDone(item);
            const auto = Boolean(item.isAutoComplete);
            const Icon = done ? CheckCircle2 : Circle;
            return (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={t(item.titleKey)}
                  disabled={auto}
                  title={auto ? t('checklistAutoHint') : undefined}
                  onClick={() => toggle(item.id)}
                  className="mt-0.5 shrink-0 rounded-full text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                >
                  <Icon
                    className={done ? 'size-5' : 'size-5 text-muted-foreground'}
                    aria-hidden="true"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      done
                        ? 'text-sm font-medium text-muted-foreground line-through'
                        : 'text-sm font-medium'
                    }
                  >
                    {t(item.titleKey)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(item.bodyKey)}</p>
                </div>
                {done ? null : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => item.onAction(actions)}
                  >
                    {t(item.actionKey)}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
