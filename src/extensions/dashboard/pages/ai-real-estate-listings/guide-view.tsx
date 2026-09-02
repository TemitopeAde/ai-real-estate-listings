import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Inbox,
  LayoutDashboard,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardSection } from "./dashboard-shell";

interface GuideViewProps {
  onNavigate: (section: DashboardSection) => void;
  onAddListing: () => void;
}

const steps: Array<{
  title: string;
  summary: string;
  items: string[];
  actionLabel: string;
  icon: LucideIcon;
  onSelect: (actions: GuideViewProps) => void;
}> = [
  {
    title: "Create and manage listings",
    summary: "Keep every property in one inventory.",
    items: [
      "Add a listing with location, price, images, and an optional 360° tour.",
      "Agent / owner contact is filled from the site owner and can be edited per listing.",
      "Use the listing actions menu to edit, review unique visitors, or delete.",
      "Only active listings appear on the live site.",
    ],
    actionLabel: "Open listings",
    icon: Building2,
    onSelect: ({ onNavigate }) => onNavigate("listings"),
  },
  {
    title: "Publish listings on the site",
    summary: "Show inventory and property details to visitors.",
    items: [
      "Add the property listings widget to a page such as /properties.",
      "Add the property detail widget to a page such as /property-details.",
      "In the editor, turn Contact, quote request, share, and related listings on or off.",
      "Embed the Saved Properties launcher from Settings so members can bookmark homes.",
    ],
    actionLabel: "Open settings",
    icon: LayoutDashboard,
    onSelect: ({ onNavigate }) => onNavigate("settings"),
  },
  {
    title: "Handle visitor enquiries",
    summary: "Let buyers contact you without leaving the listing.",
    items: [
      "Visitors see owner name, phone, and email on the property page when Contact is enabled.",
      "Request a quote collects name, email, phone, and a formatted message.",
      "New requests appear here with status, notes, and archive.",
      "Quote notifications use the listing agent email and the site owner email.",
    ],
    actionLabel: "Open quote requests",
    icon: Inbox,
    onSelect: ({ onNavigate }) => onNavigate("requests"),
  },
  {
    title: "Write listing copy with AI",
    summary: "Turn facts into marketing-ready descriptions.",
    items: [
      "Open AI Listing Writer or use Write with AI inside the listing editor.",
      "Review the generated copy, then save it on the listing before publishing.",
      "Use Analytics to see which listings attract the most views.",
    ],
    actionLabel: "Open AI writer",
    icon: WandSparkles,
    onSelect: ({ onNavigate }) => onNavigate("writer"),
  },
];

export function GuideView({ onNavigate, onAddListing }: GuideViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Getting started</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            How to use this workspace
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create listings here, publish them with the site widgets, then
            follow up on quote requests and visitor activity from this dashboard.
          </p>
        </div>
        <Button onClick={onAddListing} className="w-full sm:w-auto">
          Add listing
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Recommended path</CardTitle>
            <CardDescription>
              Add at least one active listing, place the widgets on your site,
              then check Quote requests after a visitor submits an enquiry.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.title}
              className="border-border/70 bg-card/90 shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                  </div>
                </div>
                <CardTitle className="mt-3">{step.title}</CardTitle>
                <CardDescription>{step.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    step.onSelect({ onNavigate, onAddListing })
                  }
                >
                  {step.actionLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Need more help
            </span>
          </div>
          <CardTitle className="mt-2">Workspace defaults and support</CardTitle>
          <CardDescription>
            Set default currency, area unit, and status in Settings. Contact
            the app developer from the sidebar if a widget or collection is
            missing after install.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("settings")}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Open settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
