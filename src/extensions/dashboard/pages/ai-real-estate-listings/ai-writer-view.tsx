import { AIWriterPanel } from './ai-writer-panel';

export function AIWriterView() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Content studio</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Write listings that get noticed</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Add the property facts once and let AI turn them into polished marketing copy. Review every detail before publishing.
        </p>
      </div>
      <AIWriterPanel />
    </div>
  );
}
