'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  body: string;
  detail?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * The most important screen in the product.
 *
 * A correctly gated engine finds nothing on most days. If that reads as a
 * broken page, the pressure to lower the thresholds becomes irresistible —
 * and lowering them puts back exactly the noise the gate exists to remove.
 * So this is designed to look like a deliberate result.
 */
export function EmptyState({ title, body, detail, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-oracle-md border border-warm-stone bg-warm-cream px-8 py-14 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 flex justify-center text-txt-tertiary">{icon}</div>}
      <h3 className="font-display text-h4 text-txt-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-body text-txt-secondary">{body}</p>
      {detail && (
        <p className="mx-auto mt-4 max-w-md text-body-sm text-txt-tertiary">{detail}</p>
      )}
    </div>
  );
}
