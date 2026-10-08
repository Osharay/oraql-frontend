'use client';

import { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder.store';
import { cn } from '@/lib/utils';
import type { SelectionSource } from '@/types';

/**
 * "Add to Builder" for a streak or cluster selection. Says why when the API
 * refuses (match started, conflicting selection) instead of doing nothing.
 */
export function AddStreakToBuilder({
  eventId,
  marketId,
  teamId,
  probability,
  kickoffAt,
  source,
  className,
}: {
  eventId?: string | null;
  marketId?: string | null;
  teamId?: string | null;
  probability?: number;
  kickoffAt?: string | null;
  /** Where it is added from, shown if the builder is saved as a cluster. */
  source?: SelectionSource;
  className?: string;
}) {
  const addStreak = useBuilderStore((s) => s.addStreak);
  const [state, setState] = useState<'idle' | 'busy' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!eventId || !marketId) return null;
  const started = kickoffAt ? new Date(kickoffAt).getTime() <= Date.now() : false;
  if (started) return null;

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <button
        type="button"
        disabled={state === 'busy'}
        onClick={async (e) => {
          // Cards and rows are often links or toggles; this must not trigger them.
          e.preventDefault();
          e.stopPropagation();
          setState('busy');
          const reason = await addStreak({ eventId, marketId, teamId, probability, source });
          setError(reason);
          setState(reason ? 'idle' : 'added');
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-oracle-full border px-3 py-1.5 text-caption font-semibold transition-colors duration-normal',
          state === 'added'
            ? 'border-lift-pos/40 bg-lift-pos/10 text-lift-strong'
            : 'border-oracle-gold bg-oracle-gold/10 text-txt-primary hover:bg-oracle-gold/20',
        )}
      >
        {state === 'busy' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === 'added' ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {state === 'added' ? 'In your Builder' : 'Add to Builder'}
      </button>
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
