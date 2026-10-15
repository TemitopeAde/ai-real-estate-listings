/** Serial polling with cancellation prevents older responses restoring stale access. */
export function pollWhileVisible(check: (signal: AbortSignal) => Promise<void>): () => void {
  let stopped = false;
  let pending = false;
  let controller: AbortController | undefined;
  const run = async () => {
    if (stopped || pending || document.visibilityState === 'hidden') return;
    pending = true;
    controller = new AbortController();
    const timeout = window.setTimeout(() => controller?.abort(), 15000);
    try { await check(controller.signal); }
    finally { window.clearTimeout(timeout); pending = false; }
  };
  const refresh = () => { void run(); };
  refresh();
  const timer = window.setInterval(refresh, 60000);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', refresh);
  return () => {
    stopped = true;
    controller?.abort();
    window.clearInterval(timer);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', refresh);
  };
}
