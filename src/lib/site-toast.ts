type ToastTone = 'success' | 'error';

let styleAdded = false;

function ensureStyles(): void {
  if (styleAdded || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `.property-toast-host{position:fixed;right:20px;bottom:20px;z-index:2147483647;display:grid;gap:10px;max-width:min(360px,calc(100vw - 40px));font-family:system-ui,-apple-system,sans-serif}.property-toast{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:start;padding:14px 16px;border:1px solid #dfe7e2;border-radius:14px;background:#fff;color:#17211b;box-shadow:0 14px 35px #17211b26;animation:property-toast-in .2s ease-out}.property-toast__bar{width:4px;min-height:34px;border-radius:4px;background:#2f8f5b}.property-toast--error .property-toast__bar{background:#c94b4b}.property-toast__title{font-size:14px;font-weight:750;line-height:1.35}.property-toast__description{margin-top:3px;color:#63736a;font-size:12px;line-height:1.4}.property-toast__close{border:0;background:transparent;color:#718078;font-size:18px;line-height:1;cursor:pointer}.property-toast__close:focus-visible{outline:2px solid #356b4d;outline-offset:2px}@keyframes property-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.append(style);
  styleAdded = true;
}

export function showSiteToast(title: string, description: string, tone: ToastTone = 'success'): void {
  if (typeof document === 'undefined') return;
  ensureStyles();
  let host = document.querySelector<HTMLDivElement>('.property-toast-host');
  if (!host) { host = document.createElement('div'); host.className = 'property-toast-host'; host.setAttribute('aria-live', 'polite'); host.setAttribute('aria-atomic', 'true'); document.body.append(host); }
  const toast = document.createElement('div'); toast.className = `property-toast property-toast--${tone}`; toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  const content = document.createElement('div'); const titleNode = document.createElement('div'); titleNode.className = 'property-toast__title'; titleNode.textContent = title; const descriptionNode = document.createElement('div'); descriptionNode.className = 'property-toast__description'; descriptionNode.textContent = description; content.append(titleNode, descriptionNode);
  const close = document.createElement('button'); close.className = 'property-toast__close'; close.type = 'button'; close.setAttribute('aria-label', 'Dismiss notification'); close.textContent = '×'; close.onclick = () => toast.remove();
  toast.append(Object.assign(document.createElement('div'), { className: 'property-toast__bar' }), content, close); host.append(toast);
  window.setTimeout(() => toast.remove(), 5000);
}
