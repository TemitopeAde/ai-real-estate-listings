import { useEffect, useState, type ReactNode } from 'react';
import { observePublicAccess } from '../../../lib/observe-public-access';

export function SubscriptionBoundary({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => observePublicAccess(setAllowed), []);
  if (!allowed) return fallback;
  return children;
}
