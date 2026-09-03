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
  type WorkspaceSettings,
} from "@/lib/settings";
import {
  archiveListing,
  getAppEntitlement,
  getListing,
  saveListing,
  type Listing,
  type ListingInput,
} from "@/lib/listings";
import type { AppEntitlement } from "@/lib/entitlement";
import { DashboardShell, type DashboardSection } from "./dashboard-shell";
import { ListingForm } from "./listing-form";
import { ListingsView } from "./listings-view";
import { OverviewView } from "./overview-view";
import { AnalyticsView } from "./analytics-view";
import { SettingsView } from "./settings-view";
import { RequestsView } from "./requests-view";
import { AIWriterView } from "./ai-writer-view";
import { GuideView } from "./guide-view";
import { PricingView } from "./pricing-view";
import { EntitlementProvider } from "./entitlement-context";

type EditorMode = "new" | "edit" | null;

export function DashboardApp() {
  const [section, setSection] = useState<DashboardSection>("overview");
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [settings, setSettings] = useState<WorkspaceSettings>(
    () => readWorkspaceSettings() ?? DEFAULT_WORKSPACE_SETTINGS,
  );
  const [entitlement, setEntitlement] = useState<AppEntitlement | null>(null);

  useEffect(() => {
    void getAppEntitlement()
      .then(setEntitlement)
      .catch((error: unknown) => {
        console.error("Unable to load plan entitlement.", error);
      });
  }, [refreshToken]);

  const openEditor = useCallback(async (id?: string) => {
    setEditorError(null);
    setEditorMode(id ? "edit" : "new");
    setEditingListing(null);
    setEditorLoading(Boolean(id));

    if (!id) {
      return;
    }

    try {
      const listing = await getListing(id);
      if (!listing) throw new Error("This listing could not be found.");
      setEditingListing(listing);
    } catch (error) {
      console.error("Unable to open listing editor.", error);
      const message =
        error instanceof Error
          ? error.message
          : "This listing could not be loaded.";
      setEditorError(message);
      dashboard.showToast({ type: "error", message });
    } finally {
      setEditorLoading(false);
    }
  }, []);

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
            ? `${savedListing.title} was updated.`
            : `${savedListing.title} was added.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The listing could not be saved.";
        dashboard.showToast({ type: "error", message });
        throw error;
      }
    },
    [closeEditor],
  );

  const handleArchive = useCallback(async (id: string) => {
    try {
      const archivedListing = await archiveListing(id);
      setRefreshToken((value) => value + 1);
      dashboard.showToast({
        type: "success",
        message: `${archivedListing.title} was archived.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The listing could not be archived.";
      dashboard.showToast({ type: "error", message });
      throw error;
    }
  }, []);

  const changeSection = (nextSection: DashboardSection) => {
    closeEditor();
    setSection(nextSection);
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
  } else if (section === "pricing") {
    content = <PricingView />;
  } else {
    content = (
      <SettingsView settings={settings} onSettingsChange={setSettings} />
    );
  }

  return (
    <EntitlementProvider value={entitlement}>
      <DashboardShell section={section} onSectionChange={changeSection}>
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
              {editorMode === "edit" ? "Edit listing" : "Add listing"}
            </DialogTitle>
            <DialogDescription>
              Keep your property information accurate and ready for publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6">
            {editorError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
              >
                <p className="font-medium">Unable to open this listing</p>
                <p className="mt-1">{editorError}</p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-4 h-auto p-0"
                  onClick={closeEditor}
                >
                  Return to listings
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
