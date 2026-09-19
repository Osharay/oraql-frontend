import { cn, formatProbability, getProbabilityTier } from '@/lib/utils';
import { VALUE_BET_SHORT } from '@/lib/market-copy';

interface ProbabilityBadgeProps {
  probability: number;
  isValueBet?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /**
   * What the figure is about. A bare percentage next to a market name was
   * read as belonging to a team, so the badge always carries the subject for
   * assistive tech and, at the larger sizes, prints "chance" beneath it.
   */
  subject?: string;
  className?: string;
}

export function ProbabilityBadge({
  probability,
  isValueBet,
  size = 'md',
  subject,
  className,
}: ProbabilityBadgeProps) {
  const tier = getProbabilityTier(probability);
  const pct = formatProbability(probability);

  const badge = (
    <span
      title={subject ? `${pct} chance — ${subject}` : `${pct} chance`}
      aria-label={subject ? `${pct} chance that ${subject}` : `${pct} chance`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-mono font-semibold',
        {
          'px-2 py-0.5 text-caption': size === 'sm',
          'px-3 py-1 text-body-sm': size === 'md',
          'px-4 py-1.5 text-body': size === 'lg',
        },
        isValueBet
          ? 'prob-value'
          : {
              'prob-high': tier === 'high',
              'prob-mid': tier === 'mid',
              'prob-low': tier === 'low',
            },
        className,
      )}
    >
      {pct}
      {isValueBet && <span className="text-[10px]">{VALUE_BET_SHORT}</span>}
    </span>
  );

  if (size === 'sm') return badge;

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      {badge}
      <span className="text-[10px] uppercase tracking-wide text-txt-tertiary">chance</span>
    </span>
  );
}
