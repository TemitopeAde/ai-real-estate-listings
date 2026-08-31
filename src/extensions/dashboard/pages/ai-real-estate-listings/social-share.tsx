import { useState } from 'react';
import { Check, Copy, Plus, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export type SocialPlatform =
  | 'whatsapp' | 'facebook' | 'instagram' | 'x' | 'linkedin' | 'telegram'
  | 'pinterest' | 'reddit' | 'threads' | 'tiktok' | 'youtube' | 'snapchat'
  | 'email' | 'sms';

interface Platform {
  id: SocialPlatform;
  label: string;
  description: string;
  copyOnly?: boolean;
}

const platforms: Platform[] = [
  { id: 'whatsapp', label: 'WhatsApp', description: 'Send to a contact or group' },
  { id: 'facebook', label: 'Facebook', description: 'Share to your feed' },
  { id: 'instagram', label: 'Instagram', description: 'Copy caption and open Instagram', copyOnly: true },
  { id: 'x', label: 'X', description: 'Post to your timeline' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Share with your network' },
  { id: 'telegram', label: 'Telegram', description: 'Send to a chat or channel' },
  { id: 'pinterest', label: 'Pinterest', description: 'Copy caption and open Pinterest', copyOnly: true },
  { id: 'reddit', label: 'Reddit', description: 'Submit to a community' },
  { id: 'threads', label: 'Threads', description: 'Copy caption and open Threads', copyOnly: true },
  { id: 'tiktok', label: 'TikTok', description: 'Copy caption and open TikTok', copyOnly: true },
  { id: 'youtube', label: 'YouTube', description: 'Copy caption and open YouTube', copyOnly: true },
  { id: 'snapchat', label: 'Snapchat', description: 'Copy caption and open Snapchat', copyOnly: true },
  { id: 'email', label: 'Email', description: 'Open your email app' },
  { id: 'sms', label: 'Text message', description: 'Send as a text message' },
];

const topPlatforms: SocialPlatform[] = ['whatsapp', 'facebook', 'instagram', 'x', 'linkedin'];
const externalUrls: Partial<Record<SocialPlatform, string>> = {
  instagram: 'https://www.instagram.com/', pinterest: 'https://www.pinterest.com/',
  threads: 'https://www.threads.net/', tiktok: 'https://www.tiktok.com/',
  youtube: 'https://www.youtube.com/', snapchat: 'https://www.snapchat.com/',
};

function platformById(id: SocialPlatform): Platform {
  const platform = platforms.find((item) => item.id === id);
  if (!platform) throw new Error(`Unknown social platform: ${id}`);
  return platform;
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

function getShareUrl(platform: SocialPlatform, text: string, pageUrl: string): string | null {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(pageUrl);
  switch (platform) {
    case 'whatsapp': return `https://wa.me/?text=${encodedText}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'telegram': return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'reddit': return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
    case 'email': return `mailto:?subject=${encodeURIComponent('Property listing')}&body=${encodedText}`;
    case 'sms': return `sms:?body=${encodedText}`;
    default: return null;
  }
}

export function SocialShare({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<SocialPlatform | null>(null);
  const available = platforms.filter((platform) => !topPlatforms.includes(platform.id));

  const share = async (platform: Platform) => {
    const pageUrl = window.location.href;
    try {
      const shareUrl = getShareUrl(platform.id, text, pageUrl);
      if (platform.copyOnly) {
        await copyText(text);
        setCopiedPlatform(platform.id);
        window.setTimeout(() => setCopiedPlatform(null), 1800);
        window.open(externalUrls[platform.id], '_blank', 'noopener,noreferrer');
      } else if (shareUrl?.startsWith('mailto:') || shareUrl?.startsWith('sms:')) {
        window.location.href = shareUrl;
      } else if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=720');
      }
    } catch (error) {
      console.error(`Unable to share to ${platform.label}.`, error);
    }
  };

  return <div className="mt-4 border-t border-border/70 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">Share your listing copy</p><p className="mt-1 text-xs text-muted-foreground">Reach buyers wherever they spend time.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden="true" /> Add channels</Button></div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{topPlatforms.map((id) => { const platform = platformById(id); return <Button key={id} type="button" variant="secondary" className="h-auto min-h-10 justify-start px-3 py-2" onClick={() => void share(platform)}><span className="flex size-6 items-center justify-center rounded-full bg-background text-[10px] font-bold text-primary">{platform.label === 'WhatsApp' ? 'WA' : platform.label === 'Facebook' ? 'f' : platform.label === 'Instagram' ? 'IG' : platform.label === 'LinkedIn' ? 'in' : '𝕏'}</span><span className="truncate">{copiedPlatform === id ? 'Copied' : platform.label}</span></Button>; })}</div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>More sharing channels</SheetTitle><SheetDescription>Choose a platform to share the generated listing copy. Some channels copy the caption first so you can add photos and publish it naturally.</SheetDescription></SheetHeader><div className="grid gap-2 overflow-y-auto px-4 pb-6">{available.map((platform) => <button key={platform.id} type="button" onClick={() => void share(platform)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-muted/40"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{platform.label.slice(0, 2)}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{platform.label}</span><span className="mt-1 block text-xs text-muted-foreground">{platform.description}</span></span>{copiedPlatform === platform.id ? <Check className="size-4 text-emerald-600" aria-label="Copied" /> : platform.copyOnly ? <Copy className="size-4 text-muted-foreground" aria-hidden="true" /> : <Share2 className="size-4 text-muted-foreground" aria-hidden="true" />}</button>)}</div></SheetContent></Sheet>
  </div>;
}
