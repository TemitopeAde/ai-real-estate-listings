import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  CircleHelp,
  Building2,
  Languages,
  LayoutDashboard,
  Lock,
  Mail,
  Settings2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { openAppUpgradePage } from '@/lib/entitlement';
import {
  DASHBOARD_LANGUAGE_OPTIONS,
  isDashboardLanguageSetting,
  useDt,
  type DashboardLanguageSetting,
} from '@/lib/dashboard-i18n';
import { PLAN_NAME_KEYS } from '@/lib/dashboard-i18n/labels';
import type { DashboardMessageKey } from '@/lib/dashboard-i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntitlement } from './entitlement-context';

export type DashboardSection = 'overview' | 'listings' | 'writer' | 'requests' | 'analytics' | 'guide' | 'faq' | 'pricing' | 'settings';

interface DashboardShellProps {
  section: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  dashboardLanguage: DashboardLanguageSetting;
  onDashboardLanguageChange: (language: DashboardLanguageSetting) => void;
  children: ReactNode;
}

const navigation: Array<{
  id: DashboardSection;
  labelKey: DashboardMessageKey;
  icon: LucideIcon;
}> = [
  { id: 'overview', labelKey: 'navOverview', icon: LayoutDashboard },
  { id: 'listings', labelKey: 'navListings', icon: Building2 },
  { id: 'writer', labelKey: 'navWriter', icon: WandSparkles },
  { id: 'analytics', labelKey: 'navAnalytics', icon: BarChart3 },
  // { id: 'requests', labelKey: 'navRequests', icon: Inbox },
  { id: 'guide', labelKey: 'navGuide', icon: BookOpen },
  { id: 'faq', labelKey: 'navFaq', icon: CircleHelp },
  { id: 'pricing', labelKey: 'navPricing', icon: BadgeDollarSign },
  { id: 'settings', labelKey: 'navSettings', icon: Settings2 },
];

const sectionCopy: Record<
  DashboardSection,
  { titleKey: DashboardMessageKey; eyebrowKey: DashboardMessageKey }
> = {
  overview: { titleKey: 'navOverview', eyebrowKey: 'eyebrowWorkspace' },
  listings: { titleKey: 'navListings', eyebrowKey: 'eyebrowInventory' },
  writer: { titleKey: 'navWriter', eyebrowKey: 'eyebrowStudio' },
  requests: { titleKey: 'navRequests', eyebrowKey: 'eyebrowLeads' },
  analytics: { titleKey: 'analyticsTitle', eyebrowKey: 'eyebrowAnalytics' },
  guide: { titleKey: 'navGuide', eyebrowKey: 'eyebrowGuide' },
  faq: { titleKey: 'navFaq', eyebrowKey: 'eyebrowFaq' },
  pricing: { titleKey: 'navPricing', eyebrowKey: 'eyebrowPricing' },
  settings: { titleKey: 'navSettings', eyebrowKey: 'eyebrowSettings' },
};

export function DashboardShell({
  section,
  onSectionChange,
  dashboardLanguage,
  onDashboardLanguageChange,
  children,
}: DashboardShellProps) {
  const t = useDt();
  const currentSection = sectionCopy[section];
  const entitlement = useEntitlement();
  const planName = t(PLAN_NAME_KEYS[entitlement.planId]);
  const lockedSections: Partial<Record<DashboardSection, boolean>> = {
    writer: !entitlement.features.aiWriter,
    analytics: !entitlement.features.analytics,
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas" className="border-sidebar-border shadow-[4px_0_24px_-20px_rgba(30,64,175,0.35)]">
        <SidebarHeader className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_rgba(197,168,128,0.65)]">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{t('appName')}</p>
              <p className="truncate text-xs text-muted-foreground">{t('appTagline')}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup className="px-3 py-6">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
              {t('eyebrowWorkspace')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const label = t(item.labelKey);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={section === item.id}
                        onClick={() => onSectionChange(item.id)}
                        tooltip={label}
                        className="h-11 rounded-xl"
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                        {lockedSections[item.id] ? (
                          <Lock className="ml-auto size-3.5 opacity-60" aria-hidden="true" />
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{planName}</span>
              <Badge variant="secondary" className="border-0 bg-sidebar-primary/10 text-[10px] text-sidebar-primary">
                {entitlement.isTrial ? t('badgeTrial') : entitlement.isWixStaff ? t('badgeWix') : t('badgePlan')}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-sidebar-foreground/60">
              {entitlement.listingCap === null
                ? t('listingsVisibleUnlimited')
                : t('listingsVisibleCapped', {
                    visible: entitlement.publicListingCount,
                    cap: entitlement.listingCap,
                  })}
            </p>
            {entitlement.canStartTrial ? (
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                onClick={() => openAppUpgradePage(entitlement.instanceId)}
              >
                {t('startFreeTrial')}
              </Button>
            ) : null}
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="admin@hikonsults.com"
                className="h-11 rounded-xl"
              >
                <a href="mailto:admin@hikonsults.com">
                  <Mail aria-hidden="true" />
                  <span>{t('contactDeveloper')}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Languages className="size-4 shrink-0 text-sidebar-foreground/70" aria-hidden="true" />
                <Select
                  value={dashboardLanguage}
                  onValueChange={(value) => {
                    if (isDashboardLanguageSetting(value)) onDashboardLanguageChange(value);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-9 min-w-0 flex-1 rounded-xl border-sidebar-border bg-sidebar"
                    aria-label={t('dashboardLanguage')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" className="max-h-72">
                    {DASHBOARD_LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {t(option.nameKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-background">
        <header className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-border/70 bg-white/90 px-4 backdrop-blur sm:px-8">
          <SidebarTrigger className="-ml-1" aria-label={t('toggleNav')} />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t(currentSection.eyebrowKey)}
            </p>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              {t(currentSection.titleKey)}
            </h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.14),_transparent_34rem)] p-4 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
