import { useState } from 'react';
import { Check, Copy, Sparkles, WandSparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_LISTING_COPY_INPUT,
  generateListingDescription,
  LISTING_COPY_STYLES,
  type ListingCopyInput,
} from '@/lib/ai-writer';
import { SocialShare } from './social-share';

interface AIWriterPanelProps {
  initialInput?: Partial<ListingCopyInput>;
  onDescriptionReady?: (description: string) => void;
  onGenerated?: () => void;
  showShare?: boolean;
}

export function AIWriterPanel({
  initialInput,
  onDescriptionReady,
  onGenerated,
  showShare = true,
}: AIWriterPanelProps) {
  const [form, setForm] = useState<ListingCopyInput>({ ...DEFAULT_LISTING_COPY_INPUT, ...initialInput });
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof ListingCopyInput>(key: K, value: ListingCopyInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const copy = await generateListingDescription(form);
      setDescription(copy);
      onDescriptionReady?.(copy);
      onGenerated?.();
    } catch (generationError) {
      console.error('Unable to generate listing copy.', generationError);
      setError(generationError instanceof Error ? generationError.message : 'The description could not be generated.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!description) return;
    await navigator.clipboard.writeText(description);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Property basics</CardTitle>
          <CardDescription>What should the description say?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Bedrooms<Input value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">Bathrooms<Input value={form.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Location<Input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Austin, Texas" /></label>
            <label className="space-y-2 text-sm font-medium">Price<Input value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="$875,000" /></label>
          </div>
          <label className="space-y-2 text-sm font-medium">Property type<Input value={form.propertyType} onChange={(event) => update('propertyType', event.target.value)} /></label>
          <label className="space-y-2 text-sm font-medium">Amenities<Textarea value={form.amenities} onChange={(event) => update('amenities', event.target.value)} placeholder="Swimming pool, gym, parking" rows={3} /></label>
          <label className="space-y-2 text-sm font-medium">Furnishing
            <Select value={form.furnishing} onValueChange={(value) => update('furnishing', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Furnished">Furnished</SelectItem>
                <SelectItem value="Semi-furnished">Semi-furnished</SelectItem>
                <SelectItem value="Unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="space-y-3">
            <p className="text-sm font-medium">Writing style</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LISTING_COPY_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => update('style', style.value)}
                  className={`rounded-xl border p-3 text-left transition ${form.style === style.value ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-border hover:border-primary/40'}`}
                >
                  <span className="block text-sm font-medium">{style.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{style.description}</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="button" className="w-full" onClick={() => void generate()} disabled={loading || !form.location.trim()}>
            <WandSparkles className="size-4" aria-hidden="true" />
            {loading ? 'Writing your description…' : 'Generate description'}
          </Button>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
      <Card className="min-h-[32rem] border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Generated description</CardTitle>
            <CardDescription>
              {onDescriptionReady
                ? 'When writing finishes, this copy is added to the listing description.'
                : 'Review the copy, then copy it into your listing.'}
            </CardDescription>
          </div>
          {description ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {description ? (
            <>
              <Textarea
                value={description}
                onChange={(event) => {
                  const next = event.target.value;
                  setDescription(next);
                  onDescriptionReady?.(next);
                }}
                className="min-h-[25rem] resize-y leading-7"
                aria-label="Generated property description"
              />
              {showShare ? <SocialShare text={description} /> : null}
            </>
          ) : (
            <div className="flex min-h-[25rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">Your polished copy will appear here</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Choose a style and generate a description from the confirmed property facts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
