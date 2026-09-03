import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Building2,
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
import { APP_PLANS } from '@/lib/pricing-plans';
import { openAppUpgradePage } from '@/lib/entitlement';
import { useEntitlement } from './entitlement-context';

export type DashboardSection = 'overview' | 'listings' | 'writer' | 'requests' | 'analytics' | 'guide' | 'pricing' | 'settings';

interface DashboardShellProps {
  section: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  children: ReactNode;
}

const navigation: Array<{
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', icon: Building2 },
  { id: 'writer', label: 'AI Listing Writer', icon: WandSparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'pricing', label: 'Pricing', icon: BadgeDollarSign },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const sectionLabels: Record<DashboardSection, { title: string; eyebrow: string }> = {
  overview: { title: 'Overview', eyebrow: 'Workspace' },
  listings: { title: 'Listings', eyebrow: 'Property inventory' },
  writer: { title: 'AI Listing Writer', eyebrow: 'Content studio' },
  requests: { title: 'Quote requests', eyebrow: 'Lead management' },
  analytics: { title: 'Advanced analytics', eyebrow: 'Portfolio intelligence' },
  guide: { title: 'Guide', eyebrow: 'Getting started' },
  pricing: { title: 'Pricing', eyebrow: 'Plans' },
  settings: { title: 'Settings', eyebrow: 'Workspace preferences' },
};

export function DashboardShell({
  section,
  onSectionChange,
  children,
}: DashboardShellProps) {
  const currentSection = sectionLabels[section];
  const entitlement = useEntitlement();
  const planName =
    APP_PLANS.find((plan) => plan.id === entitlement.planId)?.name ?? "Basic";
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
              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">EstateAI</p>
              <p className="truncate text-xs text-muted-foreground">Listing workspace</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup className="px-3 py-6">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={section === item.id}
                        onClick={() => onSectionChange(item.id)}
                        tooltip={item.label}
                        className="h-11 rounded-xl"
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
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
                {entitlement.isTrial ? "Trial" : entitlement.isWixStaff ? "Wix" : "Plan"}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-sidebar-foreground/60">
              {entitlement.listingCap === null
                ? "Unlimited listings are visible on the site."
                : `${entitlement.publicListingCount} of ${entitlement.listingCap} listings are visible on the site.`}
            </p>
            {entitlement.canStartTrial ? (
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                onClick={() => openAppUpgradePage(entitlement.instanceId)}
              >
                Start free trial
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
                  <span>Contact app developer</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-background">
        <header className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-border/70 bg-white/90 px-4 backdrop-blur sm:px-8">
          <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {currentSection.eyebrow}
            </p>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              {currentSection.title}
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
