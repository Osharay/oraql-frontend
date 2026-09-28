import type { AbsenceVerdict, Availability } from '@/types';
import { cn } from '@/lib/utils';

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** "K. Mbappé out (ankle, 38% of goals)" — the few names that matter, in order. */
function missingLine(a: Availability, max = 3): string {
  const shown = a.missing.slice(0, max).map((m) => {
    const what =
      m.kind === 'BENCHED' ? 'not starting' : m.status.toLowerCase() === 'out' ? 'out' : m.status.toLowerCase();
    const why = m.reason && m.kind === 'ABSENT' ? `${m.reason.toLowerCase()}, ` : '';
    const weight = m.share != null && m.share >= 0.05 ? `${why}${pct(m.share)} of goals` : why.replace(/, $/, '');
    return `${m.name} ${what}${weight ? ` (${weight})` : ''}`;
  });
  const more = a.missing.length - shown.length;
  return shown.join(', ') + (more > 0 ? ` and ${more} more` : '');
}

/** Whether a side has absences worth a line: anything above negligible. */
export function worthShowing(a: Availability | null | undefined): boolean {
  return !!a && a.missing.length > 0 && a.level !== 'NONE';
}

/** One side's absences, or nothing when nothing matters or nothing is known. */
export function AvailabilityLine({ team, availability }: { team: string; availability: Availability | null }) {
  if (!worthShowing(availability) || !availability) return null;
  return (
    <p className="text-body-sm text-txt-secondary">
      <span className="font-semibold text-txt-primary">{team}:</span> {missingLine(availability)}
      {!availability.statsKnown && (
        <span className="text-txt-tertiary"> — importance unknown, no scoring numbers for this club yet</span>
      )}
      {availability.lineupConfirmed && <span className="text-txt-tertiary"> · lineup confirmed</span>}
    </p>
  );
}

/**
 * What the absences mean for this pick. Stated both ways: a missing striker
 * works against an over, and for an under.
 */
export function AbsenceBadge({ verdict }: { verdict: AbsenceVerdict | null | undefined }) {
  if (!verdict) return null;
  const hurts = verdict.effect === 'HURTS';
  const label = hurts
    ? verdict.level === 'MAJOR'
      ? 'Key players missing — against this pick'
      : 'Players missing — slightly against'
    : verdict.level === 'MAJOR'
      ? 'Key players missing — supports this pick'
      : 'Players missing — slightly for';
  return (
    <span
      title={
        hurts
          ? 'Players who produce a large share of the goals are out or not starting. The record was built with them.'
          : 'The missing players make fewer goals more likely, which is what this pick needs.'
      }
      className={cn(
        'rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
        hurts
          ? verdict.level === 'MAJOR'
            ? 'bg-danger/10 text-danger'
            : 'bg-warm-sand text-txt-secondary'
          : 'bg-lift-pos/15 text-lift-strong',
      )}
    >
      {label}
    </span>
  );
}
