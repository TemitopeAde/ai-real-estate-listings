import { pollWhileVisible } from "@/lib/poll-while-visible";
import { openAppUpgradePage } from "@/lib/entitlement";
import { PlanGate } from "./plan-gate";
import { useCallback, useEffect, useState } from "react";
import "@wix/design-system/styles.global.css";
import { dashboard } from "@wix/dashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DEFAULT_WORKSPACE_SETTINGS,
  readWorkspaceSettings,
  writeWorkspaceSettings,
  type WorkspaceSettings,
} from "@/lib/settings";
import type { DashboardLanguageSetting } from "@/lib/dashboard-i18n";
import {
  archiveListing,
  getAppEntitlement,
  getListing,
  ListingsApiError,
  saveListing,
  type Listing,
  type ListingInput,
} from "@/lib/listings";
import type { AppEntitlement } from "@/lib/entitlement";
import { DashboardI18nProvider, useDt } from "@/lib/dashboard-i18n";
import { DashboardShell, type DashboardSection } from "./dashboard-shell";
import { ListingForm } from "./listing-form";
import { ListingsView } from "./listings-view";
import { OverviewView } from "./overview-view";
import { AnalyticsView } from "./analytics-view";
import { SettingsView } from "./settings-view";
import { RequestsView } from "./requests-view";
import { AIWriterView } from "./ai-writer-view";
import { GuideView } from "./guide-view";
import { FaqView } from "./faq-view";
import { PricingView } from "./pricing-view";
import { EntitlementProvider } from "./entitlement-context";

const ENTITLEMENT_RETRY_MS = 5000;

type EditorMode = "new" | "edit" | null;

export function DashboardApp() {
  const [settings, setSettings] = useState<WorkspaceSettings>(
    () => readWorkspaceSettings() ?? DEFAULT_WORKSPACE_SETTINGS,
  );

  return (
    <DashboardI18nProvider language={settings.dashboardLanguage}>
      <DashboardAppInner settings={settings} setSettings={setSettings} />
    </DashboardI18nProvider>
  );
}

function DashboardAppInner({
  settings,
  setSettings,
}: {
  settings: WorkspaceSettings;
  setSettings: (settings: WorkspaceSettings) => void;
}) {
  const t = useDt();
  const [section, setSection] = useState<DashboardSection>("overview");
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [entitlement, setEntitlement] = useState<AppEntitlement | null>(null);
  const [entitlementChecked, setEntitlementChecked] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    const stop = pollWhileVisible(async (signal) => {
      let next: AppEntitlement | null = null;
      try { next = await getAppEntitlement(signal); }
      catch (error) { console.error("Unable to load plan entitlement.", error); }
      if (!active) return;
      // Failed or unverifiable checks are retried quietly; the last known access stays in place.
      if (signal.aborted || !next || next.accessStatus === "unavailable") {
        window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(() => setRefreshToken((value) => value + 1), ENTITLEMENT_RETRY_MS);
        return;
      }
      setEntitlement(next);
      setEntitlementChecked(true);
      if (!next.hasAccess) {
        setEditorMode(null);
        setEditingListing(null);
        setEditorError(null);
      }
    });
    return () => { active = false; window.clearTimeout(retryTimer); stop(); };
  }, [refreshToken]);

  const openEditor = useCallback(
    async (id?: string) => {
      if (!entitlementChecked) return;
      const current = entitlement;

      if (id && current && !current.features.editListings) {
        dashboard.showToast({
          type: "error",
          message: t("listingEditLocked"),
        });
        setSection("pricing");
        return;
      }

      setEditorError(null);
      setEditorMode(id ? "edit" : "new");
      setEditingListing(null);
      setEditorLoading(Boolean(id));

      if (!id) {
        // Refresh in the background; the form disables saving at the listing cap.
        void getAppEntitlement()
          .then(setEntitlement)
          .catch((error) => console.error("Unable to load plan entitlement.", error));
        return;
      }

      try {
        const listing = await getListing(id);
        if (!listing) throw new Error(t("listingNotFound"));
        setEditingListing(listing);
      } catch (error) {
        console.error("Unable to open listing editor.", error);
        const message =
          error instanceof Error ? error.message : t("listingLoadFailed");
        setEditorError(message);
        dashboard.showToast({ type: "error", message });
      } finally {
        setEditorLoading(false);
      }
    },
    [entitlement, t],
  );

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setEditingListing(null);
    setEditorError(null);
    setEditorLoading(false);
  }, []);

  const handleSave = useCallback(
    async (input: ListingInput, id?: string) => {
      try {
        const savedListing = await saveListing(input, id);
        closeEditor();
        setSection("listings");
        setRefreshToken((value) => value + 1);
        dashboard.showToast({
          type: "success",
          message: id
            ? t("listingUpdated", { title: savedListing.title })
            : t("listingAdded", { title: savedListing.title }),
        });
      } catch (error) {
        const atCap =
          error instanceof ListingsApiError &&
          error.code === "listing_cap_reached";
        const editLocked =
          error instanceof ListingsApiError &&
          error.code === "upgrade_required";
        const message = atCap
          ? t("listingCapReached", {
              cap: entitlement?.listingCap ?? 0,
            })
          : editLocked
            ? t("listingEditLocked")
            : error instanceof Error
              ? error.message
              : t("listingSaveFailed");
        dashboard.showToast({ type: "error", message });
        if (atCap || editLocked) {
          closeEditor();
          setSection("pricing");
        }
        throw error;
      }
    },
    [closeEditor, entitlement, t],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        const archivedListing = await archiveListing(id);
        setRefreshToken((value) => value + 1);
        dashboard.showToast({
          type: "success",
          message: t("listingArchived", { title: archivedListing.title }),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("listingArchiveFailed");
        dashboard.showToast({ type: "error", message });
        throw error;
      }
    },
    [t],
  );

  const changeSection = (nextSection: DashboardSection) => {
    closeEditor();
    setSection(nextSection);
  };

  const changeLanguage = (dashboardLanguage: DashboardLanguageSetting) => {
    const nextSettings = { ...settings, dashboardLanguage };
    try {
      writeWorkspaceSettings(nextSettings);
      setSettings(nextSettings);
    } catch (error) {
      console.error("Unable to save dashboard language.", error);
    }
  };

  let content;
  if (section === "overview") {
    content = (
      <OverviewView
        refreshToken={refreshToken}
        onAddListing={() => void openEditor()}
        onViewListings={() => setSection("listings")}
        onOpenWriter={() => setSection("writer")}
        onOpenGuide={() => setSection("guide")}
        onOpenPricing={() => setSection("pricing")}
      />
    );
  } else if (section === "listings") {
    content = (
      <ListingsView
        refreshToken={refreshToken}
        includeArchived={settings.showArchived}
        onAddListing={() => void openEditor()}
        onEditListing={(id) => void openEditor(id)}
        onArchiveListing={handleArchive}
        onOpenPricing={() => setSection("pricing")}
      />
    );
  } else if (section === "analytics") {
    content = (
      <AnalyticsView
        refreshToken={refreshToken}
        onOpenPricing={() => setSection("pricing")}
      />
    );
  } else if (section === "requests") {
    content = <RequestsView refreshToken={refreshToken} />;
  } else if (section === "writer") {
    content = <AIWriterView onOpenPricing={() => setSection("pricing")} />;
  } else if (section === "guide") {
    content = (
      <GuideView
        onNavigate={setSection}
        onAddListing={() => void openEditor()}
      />
    );
  } else if (section === "faq") {
    content = <FaqView onNavigate={setSection} />;
  } else if (section === "pricing") {
    content = <PricingView />;
  } else {
    content = (
      <SettingsView settings={settings} onSettingsChange={setSettings} />
    );
  }

  if (entitlementChecked && !entitlement?.hasAccess) {
    return <EntitlementProvider value={entitlement}>
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <PlanGate
          title={t("subscriptionRequired")}
          description={t("subscriptionRestore")}
          onUpgrade={() => {
            if (entitlement?.instanceId) openAppUpgradePage(entitlement.instanceId);
            else setRefreshToken((value) => value + 1);
          }}
        />
        <Button variant="outline" onClick={() => setRefreshToken((value) => value + 1)}>{t("subscriptionRetry")}</Button>
        <PricingView />
      </main>
    </EntitlementProvider>;
  }

  return (
    <EntitlementProvider value={entitlement} pending={!entitlementChecked}>
      <DashboardShell
        section={section}
        onSectionChange={changeSection}
        dashboardLanguage={settings.dashboardLanguage}
        onDashboardLanguageChange={changeLanguage}
      >
        {content}
      </DashboardShell>
      <Dialog
        open={editorMode !== null}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <DialogContent className="flex h-[92vh] max-h-[92vh] max-w-6xl flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editorMode === "edit" ? t("editorEdit") : t("editorAdd")}
            </DialogTitle>
            <DialogDescription>{t("editorHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6">
            {editorError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
              >
                <p className="font-medium">{t("editorOpenErrorTitle")}</p>
                <p className="mt-1">{editorError}</p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-4 h-auto p-0"
                  onClick={closeEditor}
                >
                  {t("returnToListings")}
                </Button>
              </div>
            ) : (
              <ListingForm
                listing={editingListing}
                defaultCurrency={settings.defaultCurrency}
                defaultAreaUnit={settings.defaultAreaUnit}
                defaultStatus={settings.defaultStatus}
                loading={editorLoading}
                onBack={closeEditor}
                onSave={handleSave}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </EntitlementProvider>
  );
}
