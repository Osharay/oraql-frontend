'use client';

import { cn } from '@/lib/utils';

interface LiftMeterProps {
  hitRate: number;
  baselineRate: number;
  className?: string;
}

/**
 * Observed rate against the baseline it is judged by.
 *
 * The baseline is drawn as a reference line rather than left implicit, because
 * the gap between the two is the entire claim. A bar showing 90% on its own
 * says nothing about whether 90% is remarkable.
 */
export function LiftMeter({ hitRate, baselineRate, className }: LiftMeterProps) {
  const lift = hitRate - baselineRate;
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-oracle-full bg-warm-sand">
        <div
          className={cn(
            'h-full rounded-oracle-full transition-all duration-normal',
            lift > 0.05 ? 'bg-lift-strong' : lift > 0 ? 'bg-lift-pos' : 'bg-lift-neg',
          )}
          style={{ width: `${Math.min(Math.max(hitRate, 0), 1) * 100}%` }}
        />
        {/* Baseline marker */}
        <div
          className="absolute top-0 h-full w-px bg-txt-primary/50"
          style={{ left: `${Math.min(Math.max(baselineRate, 0), 1) * 100}%` }}
          title={`Baseline ${pct(baselineRate)}`}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-caption text-txt-tertiary">
        <span>
          <span className="font-semibold text-txt-primary">{pct(hitRate)}</span> observed
        </span>
        <span>baseline {pct(baselineRate)}</span>
        <span className={cn('font-semibold', lift > 0 ? 'text-lift-strong' : 'text-txt-tertiary')}>
          {lift >= 0 ? '+' : ''}
          {Math.round(lift * 100)} pts
        </span>
      </div>
    </div>
  );
}
