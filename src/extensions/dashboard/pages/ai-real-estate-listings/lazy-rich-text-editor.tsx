import { Component, lazy, Suspense, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useDt } from "@/lib/dashboard-i18n";

const loadRichTextEditor = () =>
  lazy(() =>
    import("./rich-text-editor").then((module) => ({
      default: module.RichTextEditor,
    })),
  );
let RichTextEditor = loadRichTextEditor();

// A failed chunk load (network error, stale dev-server deps) must not take down the surrounding form.
class EditorLoadBoundary extends Component<
  { fallback: (retry: () => void) => ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unable to load the description editor.", error);
  }

  retry = () => {
    RichTextEditor = loadRichTextEditor();
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}

export function LazyRichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useDt();
  return (
    <div className="listing-rich-editor overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30">
      <EditorLoadBoundary
        fallback={(retry) => (
          <div role="alert" className="flex min-h-52 flex-col items-start gap-3 p-4 text-sm text-muted-foreground">
            {t("editorLoadFailed")}
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              {t("retry")}
            </Button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="min-h-52 p-4 text-sm text-muted-foreground">
              {t("loadingEditor")}
            </div>
          }
        >
          <RichTextEditor value={value} onChange={onChange} />
        </Suspense>
      </EditorLoadBoundary>
    </div>
  );
}
