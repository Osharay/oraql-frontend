'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { NextFixture, OpponentBand, OpponentSplit, StreakCandidate } from '@/types';
import { ResultStrip } from './ResultStrip';
import { LiftMeter } from './LiftMeter';
import { cn, minimumOddsCopy } from '@/lib/utils';
import { AbsenceBadge, AvailabilityLine, worthShowing } from './AvailabilityNote';
import { AddStreakToBuilder } from '@/components/builder/AddStreakToBuilder';
import { InternationalBadge } from '@/components/ui/InternationalBadge';

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-oracle-gold/15 text-oracle-gold-dark' },
  ACTIVE: { label: 'Active', className: 'bg-lift-pos/15 text-lift-strong' },
  STRENGTHENING: { label: 'Strengthening', className: 'bg-lift-pos/20 text-lift-strong' },
  WEAKENING: { label: 'Weakening', className: 'bg-warm-sand text-txt-secondary' },
  // Broken is not an error — it is a past-tense fact, so no danger colour.
  BROKEN: { label: 'Broken', className: 'bg-warm-sand text-txt-tertiary' },
  EXPIRED: { label: 'Expired', className: 'bg-warm-sand text-txt-tertiary' },
  FILTERED: { label: 'Not significant', className: 'bg-warm-sand text-txt-tertiary' },
};

/** Which matches the record covers, in words rather than an enum. */
function venuePhrase(venue?: string): string {
  if (venue === 'HOME') return 'home matches only';
  if (venue === 'AWAY') return 'away matches only';
  return 'home and away';
}

/**
 * An adjusted p-value is the share of discoveries like this one you would
 * expect to be coincidence. Stating that in words beats printing "0.032"
 * next to the word "p" for anyone who is not a statistician.
 */
function coincidenceCopy(adjusted?: number | null): { value: string; note: string } {
  if (adjusted == null) return { value: '—', note: 'Not scored in this run.' };
  const pct = adjusted * 100;
  const value = pct < 0.1 ? 'under 0.1%' : `${pct.toFixed(1)}%`;
  return {
    value,
    note: `Of patterns flagged like this one, about ${value} are expected to be coincidence.`,
  };
}

/** "Sat 10 Oct, 15:00" in the reader's own time zone. */
function kickoffCopy(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/**
 * The match the card is about, home side on the left, so a reader can go
 * straight to the bookie without looking the fixture up.
 */
export function FixtureLine({ fixture, teamId }: { fixture: NextFixture; teamId?: string }) {
  const side = (t: { id: string; name: string }) => (
    <span className={t.id === teamId ? 'font-semibold text-txt-primary' : 'text-txt-secondary'}>
      {t.name}
    </span>
  );
  const where = [fixture.competition.name, fixture.competition.country].filter(Boolean).join(' · ');
  const strength = fixture.strength;
  const strongerName =
    strength?.stronger === 'HOME' ? fixture.home.name : strength?.stronger === 'AWAY' ? fixture.away.name : null;
  const tierWord = (t?: string | null) =>
    t === 'STRONG' ? 'strong' : t === 'AVERAGE' ? 'mid-table' : t === 'WEAK' ? 'weak' : null;
  return (
    <Link
      href={`/events/${fixture.eventId}`}
      className="mt-3 block rounded-oracle-sm border border-warm-sand bg-warm-cream/60 px-3 py-2 transition-colors duration-normal hover:border-warm-stone"
    >
      <p className="flex flex-wrap items-center gap-x-2 text-body">
        {side(fixture.home)}
        <span className="text-txt-tertiary">vs</span>
        {side(fixture.away)}
        <span className="rounded-oracle-full bg-white px-2 py-0.5 text-caption font-semibold text-txt-secondary">
          {fixture.isHome ? 'Home' : 'Away'}
        </span>
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-body-sm text-txt-tertiary">
        <span>{kickoffCopy(fixture.kickoffAt)}</span>
        <span>·</span>
        <span>{where}</span>
        <span className="rounded-oracle-full bg-white px-2 py-0.5 text-caption font-semibold text-txt-secondary">
          {fixture.competition.kind === 'CUP' ? 'Cup' : 'League'}
        </span>
        <InternationalBadge show={!!fixture.competition.international} />
      </p>
      {strength && (
        <p
          className="mt-1 text-body-sm text-txt-secondary"
          title={`Team ratings, from results: ${fixture.home.name} ${strength.home.rating}, ${fixture.away.name} ${strength.away.rating} (home side gets about 60 points for playing at home).`}
        >
          {strongerName ? (
            <>
              <span className="font-semibold text-txt-primary">{strongerName}</span> the stronger side
            </>
          ) : (
            'Evenly matched'
          )}
          {(tierWord(strength.home.tier) || tierWord(strength.away.tier)) && (
            <span className="text-txt-tertiary">
              {' · '}
              {[
                tierWord(strength.home.tier) && `${fixture.home.name} ${tierWord(strength.home.tier)}`,
                tierWord(strength.away.tier) && `${fixture.away.name} ${tierWord(strength.away.tier)}`,
              ]
                .filter(Boolean)
                .join(', ')}{' '}
              in their league
            </span>
          )}
        </p>
      )}
      {fixture.availability &&
      (fixture.availability.verdict || worthShowing(fixture.availability.own) || worthShowing(fixture.availability.opponent)) ? (
        <div className="mt-2 space-y-1 border-t border-warm-sand pt-2">
          <AbsenceBadge verdict={fixture.availability.verdict} />
          <AvailabilityLine
            team={fixture.isHome ? fixture.home.name : fixture.away.name}
            availability={fixture.availability.own}
          />
          <AvailabilityLine
            team={fixture.isHome ? fixture.away.name : fixture.home.name}
            availability={fixture.availability.opponent}
          />
        </div>
      ) : null}
      <p className="mt-1 text-caption font-medium text-oracle-gold-dark">
        Every market for this match, and where both sides agree →
      </p>
    </Link>
  );
}

const BAND_COPY: Record<OpponentBand, { label: string; key: 'stronger' | 'similar' | 'weaker' }> = {
  STRONGER: { label: 'stronger sides', key: 'stronger' },
  SIMILAR: { label: 'similar sides', key: 'similar' },
  WEAKER: { label: 'weaker sides', key: 'weaker' },
};

/** Below this, a band's rate is shown but flagged as thin. */
const THIN = 5;

/**
 * The record against stronger, similar and weaker opponents, with the band
 * the next opponent falls in called out — so a run built on weak sides does
 * not read as a forecast against a strong one.
 */
function OpponentSplitLine({ split }: { split: OpponentSplit }) {
  const bands: OpponentBand[] = ['STRONGER', 'SIMILAR', 'WEAKER'];
  const rated = bands.reduce((n, b) => n + split[BAND_COPY[b].key].played, 0);
  if (rated === 0) return null;
  const pct = (r: { wins: number; played: number }) => Math.round((r.wins / r.played) * 100);
  const next = split.next ? split[BAND_COPY[split.next].key] : null;

  return (
    <div className="mt-3 rounded-oracle-sm border border-warm-sand px-3 py-2 text-body-sm">
      {split.next && next && next.played > 0 && (
        <p className="mb-1 text-txt-primary">
          Next opponent is one of the{' '}
          <span className="font-semibold">{BAND_COPY[split.next].label}</span>. Against those it came
          off{' '}
          <span className="font-semibold">
            {next.wins} of {next.played} times ({pct(next)}%)
          </span>
          {next.played < THIN && <span className="text-txt-tertiary"> — few matches, treat as a hint</span>}
          .
        </p>
      )}
      {split.next && next && next.played === 0 && (
        <p className="mb-1 text-txt-primary">
          Next opponent is one of the <span className="font-semibold">{BAND_COPY[split.next].label}</span>
          , and there is no record against those yet.
        </p>
      )}
      <p className="flex flex-wrap gap-x-3 text-txt-tertiary">
        <span>By opponent strength:</span>
        {bands.map((b) => {
          const r = split[BAND_COPY[b].key];
          if (r.played === 0) return null;
          return (
            <span key={b} className={b === split.next ? 'font-semibold text-txt-primary' : undefined}>
              vs {BAND_COPY[b].label.replace(' sides', '')} {r.wins}/{r.played}
            </span>
          );
        })}
      </p>
    </div>
  );
}

export function StreakCard({
  candidate,
  suggestive = false,
  inGroup = false,
}: {
  candidate: StreakCandidate;
  suggestive?: boolean;
  /** Shown under its match's heading: the fixture box is the heading's, not the card's. */
  inGroup?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const status = STATUS_COPY[candidate.status] ?? STATUS_COPY.ACTIVE;
  const venue = candidate.context?.venue;
  const subject = candidate.entity?.shortName || candidate.entity?.name;
  const coincidence = coincidenceCopy(candidate.adjustedPValue);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  // Below half, it fails more often than it lands. Still a real finding about
  // the team — but a tendency to know, not a selection to back.
  const season = candidate.thisSeason;
  const recent = candidate.context?.recent;
  const formRate = candidate.context?.formRate ?? null;
  // Recent form leads, the long record behind it: the price follows form.
  const chance = candidate.context?.chance ?? formRate ?? candidate.hitRate;
  const tendency = chance < 0.5;
  const emerging = !candidate.survivedGate && candidate.context?.emerging;

  return (
    <article
      className={cn(
        'rounded-oracle-md border bg-white p-5 shadow-soft transition-shadow duration-normal hover:shadow-card',
        suggestive ? 'border-dashed border-warm-stone' : 'border-warm-stone',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* The eyebrow only earns its place when the heading does not
              already name the club — otherwise it reads twice. */}
          {subject && !candidate.marketLabel && (
            <p className="text-caption font-semibold uppercase tracking-wide text-oracle-gold-dark">
              {subject}
            </p>
          )}
          <h3 className="font-display text-h5 text-txt-primary">
            {candidate.marketLabel || candidate.marketDefinition.displayName}
          </h3>
          {candidate.subject?.label && (
            <p className="mt-0.5 text-body-sm text-txt-secondary">
              {candidate.subject.label}
              {candidate.entity?.type === 'TEAM' && (
                <>
                  {' · '}
                  <Link
                    href={`/teams/${candidate.entity.id}`}
                    className="font-medium text-oracle-gold-dark hover:underline"
                  >
                    all markets
                  </Link>
                </>
              )}
            </p>
          )}
          {candidate.context?.chance != null ? (
            <>
              {/* The honest chance leads; the raw record is the evidence under it. */}
              <p className="mt-2 text-body font-semibold text-txt-primary">OraQL chance {pct(candidate.context.chance)}</p>
              <p className="text-body-sm text-txt-secondary">Happens in {pct(candidate.hitRate)} of their matches</p>
            </>
          ) : (
            <p className="mt-2 text-body font-semibold text-txt-primary">
              Happens in {pct(candidate.hitRate)} of their matches
            </p>
          )}
          {!tendency && minimumOddsCopy(chance) && (
            <p
              className="mt-0.5 text-body-sm font-medium text-oracle-gold-dark"
              title="Break-even is 1 ÷ OraQL's chance; this adds a 10% margin because the chance is an estimate. Compare it with the bookie's price."
            >
              {minimumOddsCopy(chance)}
            </p>
          )}
          {recent && recent.played > 0 && (
            <p className="mt-0.5 text-body-sm text-txt-secondary">
              Last {recent.played}: {recent.wins} of {recent.played} ({pct(recent.wins / recent.played)})
              {formRate != null && (
                <span className="text-txt-tertiary">
                  {' · '}recent form {pct(formRate)}
                </span>
              )}
            </p>
          )}
          <p className="mt-0.5 text-body-sm text-txt-tertiary">
            {venuePhrase(venue)}
            {' · '}
            {candidate.wins} of {candidate.sampleSize} settled matches
            {season && season.played > 0 && (
              <>
                {' · '}
                <span className="text-txt-secondary">
                  this season {season.wins} of {season.played} ({pct(season.wins / season.played)})
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              'rounded-oracle-full px-2.5 py-1 text-caption font-semibold',
              status.className,
            )}
          >
            {status.label}
          </span>
          {tendency && (
            <span className="rounded-oracle-full bg-warm-sand px-2.5 py-1 text-caption font-semibold text-txt-secondary">
              Tendency, not a pick
            </span>
          )}
          {emerging && (
            <span
              title="Strong over the last fifteen matches, though two seasons do not show it yet. Tracked before it is trusted."
              className="rounded-oracle-full bg-oracle-gold/15 px-2.5 py-1 text-caption font-semibold text-oracle-gold-dark"
            >
              Emerging — recent form
            </span>
          )}
        </div>
      </div>

      {candidate.nextFixture && !inGroup && (
        <FixtureLine fixture={candidate.nextFixture} teamId={candidate.entity?.id} />
      )}
      {/* Under a match heading the absences are listed once there; the card
          keeps only what they mean for its own market. */}
      {inGroup && candidate.nextFixture?.availability?.verdict && (
        <div className="mt-2">
          <AbsenceBadge verdict={candidate.nextFixture.availability.verdict} />
        </div>
      )}
      {candidate.nextFixture && candidate.entity?.type === 'TEAM' && (
        <AddStreakToBuilder
          className="mt-2"
          eventId={candidate.nextFixture.eventId}
          marketId={candidate.marketDefinition.marketId}
          teamId={candidate.entity.id}
          probability={chance}
          kickoffAt={candidate.nextFixture.kickoffAt}
          source={candidate.survivedGate ? 'STREAK_EVIDENCE' : emerging ? 'STREAK_EMERGING' : 'STREAK_EXPLORATORY'}
        />
      )}

      {candidate.context?.leagueChanged && (
        <p className="mt-3 rounded-oracle-sm bg-warm-cream px-3 py-2 text-body-sm text-txt-secondary">
          {subject ?? 'This team'} changed league this season, so only this season&apos;s matches
          are counted. Last season&apos;s record describes a different competition.
        </p>
      )}

      {tendency && (
        <p className="mt-3 rounded-oracle-sm bg-warm-cream px-3 py-2 text-body-sm text-txt-secondary">
          Less likely than not: on recent form it fails about {pct(1 - chance)} of the time. What
          stands out is that it happens {(candidate.hitRate / candidate.baselineRate).toFixed(1)}×
          as often as for a typical side.
        </p>
      )}

      {candidate.opponentSplit && (
        <OpponentSplitLine split={candidate.opponentSplit} />
      )}

      <div className="mt-4">
        <LiftMeter hitRate={candidate.hitRate} baselineRate={candidate.baselineRate} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <ResultStrip last10={candidate.last10} />
        {candidate.currentStreak > 0 && (
          <span className="text-body-sm text-txt-secondary">
            {candidate.currentStreak} in a row right now
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex items-center gap-1 text-body-sm text-txt-tertiary transition-colors duration-normal hover:text-txt-primary"
        >
          Why this qualified
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-normal', open && 'rotate-180')}
          />
        </button>
      </div>

      {open && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-warm-sand pt-4 text-body-sm sm:grid-cols-4">
          <div>
            <dt className="text-txt-tertiary">Matches counted</dt>
            <dd className="font-semibold text-txt-primary">{candidate.sampleSize}</dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Longest run</dt>
            <dd className="font-semibold text-txt-primary">
              {candidate.longestStreak} in a row
            </dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Against the usual rate</dt>
            <dd className="font-semibold text-txt-primary">
              {pct(candidate.hitRate)} vs {pct(candidate.baselineRate)}
            </dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Could be coincidence</dt>
            <dd
              className="font-semibold text-txt-primary"
              title={
                candidate.adjustedPValue != null
                  ? `Adjusted p-value: ${candidate.adjustedPValue}`
                  : undefined
              }
            >
              {coincidence.value}
            </dd>
          </div>

          <p className="col-span-2 text-body-sm text-txt-secondary sm:col-span-4">
            {suggestive
              ? 'This pattern leans the right way but is not distinguishable from its baseline once the number of slices tested is accounted for. Exploratory only.'
              : `${subject ? `${subject} has landed this` : 'This landed'} in ${Math.round(
                  candidate.hitRate * 100,
                )}% of ${candidate.sampleSize} settled matches, against ${Math.round(
                  candidate.baselineRate * 100,
                )}% for the market generally. ${coincidence.note} It is a record of what has happened, not a forecast.`}
          </p>
        </dl>
      )}
    </article>
  );
}
