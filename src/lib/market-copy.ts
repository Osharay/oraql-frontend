/**
 * One place that decides how a market is described to a user.
 *
 * The client asked "Which team has the over 0.5?!" about a card reading
 * "Over 0.5 Goals". The label named a market but never its subject, and a
 * goals line with no subject reads as though it belongs to one club. Every
 * surface that shows a number now takes its words from here, so the answer
 * is the same wherever it appears.
 *
 * It parses both the old market names ("Over 0.5 Goals") and the current
 * ones ("Match Goals: Over 0.5"), because rows written before the rename are
 * still in the database.
 */

export interface MarketLike {
  name: string;
  shortName?: string;
  line?: number;
  category?: string;
}

export interface TeamLike {
  name: string;
  shortName?: string;
}

export interface EventLike {
  homeTeam: TeamLike;
  awayTeam: TeamLike;
}

type Metric = 'goals' | 'corners' | 'cards';

interface Parsed {
  kind: 'total' | 'result' | 'btts' | 'unknown';
  metric?: Metric;
  direction?: 'over' | 'under';
  line?: number;
  team?: string;
  outcome?: 'draw' | 'yes' | 'no';
}

const team = (t: TeamLike) => t.shortName || t.name;

function parse(name: string): Parsed {
  const n = name.trim();

  // "Match Goals: Over 2.5" / "Match Corners: Under 9.5"
  const current = /^Match\s+(Goals|Corners|Cards)\s*:\s*(Over|Under)\s+([\d.]+)/i.exec(n);
  if (current) {
    return {
      kind: 'total',
      metric: current[1].toLowerCase() as Metric,
      direction: current[2].toLowerCase() as 'over' | 'under',
      line: Number(current[3]),
    };
  }

  // Legacy: "Over 2.5 Goals" / "Under 9.5 Corners"
  const legacy = /^(Over|Under)\s+([\d.]+)\s+(Goals|Corners|Cards)/i.exec(n);
  if (legacy) {
    return {
      kind: 'total',
      metric: legacy[3].toLowerCase() as Metric,
      direction: legacy[1].toLowerCase() as 'over' | 'under',
      line: Number(legacy[2]),
    };
  }

  // Both teams to score
  const btts = /both\s+teams\s+to\s+score/i.test(n);
  if (btts) {
    return { kind: 'btts', outcome: /\b(no|not)\b/i.test(n) ? 'no' : 'yes' };
  }

  if (/^draw$/i.test(n) || /\bdraw\b/i.test(n)) {
    return { kind: 'result', outcome: 'draw' };
  }

  // "Arsenal to Win"
  const toWin = /^(.+?)\s+to\s+win$/i.exec(n);
  if (toWin) {
    return { kind: 'result', team: toWin[1].trim() };
  }

  // Legacy: "Home Win" / "Away Win"
  const legacyResult = /^(Home|Away)\s+Win$/i.exec(n);
  if (legacyResult) {
    return { kind: 'result', team: legacyResult[1].toLowerCase() === 'home' ? '__home' : '__away' };
  }

  return { kind: 'unknown' };
}

function resolveTeam(token: string | undefined, event?: EventLike): string | undefined {
  if (!token) return undefined;
  if (token === '__home') return event ? team(event.homeTeam) : 'The home team';
  if (token === '__away') return event ? team(event.awayTeam) : 'The away team';
  return token;
}

/**
 * The line a user reads first. Says the outcome in full, in ordinary words.
 */
export function marketHeadline(market: MarketLike, event?: EventLike): string {
  const p = parse(market.name);

  if (p.kind === 'total' && p.metric && p.direction && p.line !== undefined) {
    const word = p.direction === 'over' ? 'More than' : 'Fewer than';
    return `${word} ${p.line} ${p.metric} in the match`;
  }

  if (p.kind === 'btts') {
    return p.outcome === 'no'
      ? 'At least one team fails to score'
      : 'Both teams score at least once';
  }

  if (p.kind === 'result') {
    if (p.outcome === 'draw') return 'The match ends level';
    const name = resolveTeam(p.team, event);
    if (name) return `${name} wins the match`;
  }

  return market.name;
}

/**
 * Who or what the number is about. This is the line that answers
 * "which team?" — so it never leaves the question open.
 */
export function marketSubject(market: MarketLike, event?: EventLike): string {
  const p = parse(market.name);

  if (p.kind === 'total') {
    return 'Both teams combined · full match';
  }
  if (p.kind === 'btts') {
    return 'Both teams · full match';
  }
  if (p.kind === 'result') {
    if (p.outcome === 'draw') return 'Match result · 90 minutes';
    const name = resolveTeam(p.team, event);
    return name ? `${name} · match result` : 'Match result · 90 minutes';
  }
  if (event) {
    return `${team(event.homeTeam)} v ${team(event.awayTeam)} · full match`;
  }
  return 'Full match';
}

/**
 * A compact label for tight spaces (chips, badges). Still names the subject
 * where the outcome alone would be ambiguous — the shortNames the backend
 * stores ("O2.5", "1", "BTTS Y") are trade jargon and are never shown.
 */
export function marketShortLabel(market: MarketLike, event?: EventLike): string {
  const p = parse(market.name);

  if (p.kind === 'total' && p.metric && p.direction && p.line !== undefined) {
    const word = p.direction === 'over' ? 'Over' : 'Under';
    return `Match ${p.metric}: ${word} ${p.line}`;
  }
  if (p.kind === 'btts') {
    return p.outcome === 'no' ? 'Both teams to score: No' : 'Both teams to score: Yes';
  }
  if (p.kind === 'result') {
    if (p.outcome === 'draw') return 'Draw';
    const name = resolveTeam(p.team, event);
    if (name) return `${name} to win`;
  }
  return market.name;
}

/**
 * What a probability means, in words, so the figure is not the only thing
 * on screen. Deliberately avoids implying certainty.
 */
export function probabilityPhrase(probability: number): string {
  const pct = Math.round(probability * 100);
  if (pct >= 90) return `OraQL expects this in about ${pct} of every 100 similar matches`;
  if (pct >= 70) return `Expected in roughly ${pct} of every 100 similar matches`;
  if (pct >= 45) return `Close to a coin toss — about ${pct} in 100`;
  return `Unlikely — about ${pct} in 100`;
}

export interface EvidenceNote {
  tone: 'strong' | 'moderate' | 'thin';
  label: string;
  detail: string;
}

/**
 * How much history sits behind the number. Without this, a figure derived
 * from league averages looks identical to one built on real form — which is
 * how an identical 92.6% came to appear on unrelated fixtures.
 */
export function evidenceNote(confidence: number | undefined): EvidenceNote | null {
  if (typeof confidence !== 'number') return null;
  if (confidence >= 0.6) {
    return {
      tone: 'strong',
      label: 'Backed by recent form',
      detail: 'Both teams have enough recent matches for this to rest on their own record.',
    };
  }
  if (confidence >= 0.45) {
    return {
      tone: 'moderate',
      label: 'Limited recent data',
      detail: 'Some of this leans on league averages rather than these teams’ own form.',
    };
  }
  return {
    tone: 'thin',
    label: 'Thin evidence — read the reasoning',
    detail: 'Mostly league averages. Treat the figure as a starting point, not a read on these teams.',
  };
}

/** Plain words for a value bet, rather than the bare word VALUE. */
export const VALUE_BET_LABEL = 'Better odds than we expect';
export const VALUE_BET_SHORT = 'Value';
