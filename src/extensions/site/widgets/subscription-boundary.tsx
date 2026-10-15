import { useEffect, useState, type ReactNode } from 'react';
import { observePublicAccess } from '../../../lib/observe-public-access';

export function SubscriptionBoundary({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => observePublicAccess(setAllowed), []);
  if (!allowed) return <p role="status">Listings are temporarily unavailable.</p>;
  return children;
}
