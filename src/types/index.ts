// ─── OraQL_ Frontend Type Definitions ───
// Mirrors the backend Prisma models for type safety.

export type Sport = 'FOOTBALL' | 'BASKETBALL' | 'TENNIS' | 'CRICKET' | 'BASEBALL' | 'HOCKEY';

export type EventStatus =
  | 'SCHEDULED'
  | 'LINEUP_CONFIRMED'
  | 'LIVE'
  | 'HALF_TIME'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'SUSPENDED';

export type MarketCategory =
  | 'MATCH_RESULT'
  | 'GOALS'
  | 'CORNERS'
  | 'CARDS'
  | 'PLAYER'
  | 'HALFTIME'
  | 'HANDICAP'
  | 'SPECIAL';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN';
  preferredSports: Sport[];
  timezone: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface League {
  id: string;
  name: string;
  country?: string;
  logoUrl?: string;
  eventCount?: number;
}

export interface Event {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  sport: Sport;
  status: EventStatus;
  kickoffAt: string;
  venue?: string;
  round?: string;
  homeScore?: number;
  awayScore?: number;
  picks?: PickSummary[];
}

export interface EventDetail extends Event {
  markets: Market[];
  picks: Pick[];
  lineups: Lineup[];
  matchStats: MatchStat[];
}

export interface Market {
  id: string;
  category: MarketCategory;
  name: string;
  shortName?: string;
  line?: number;
  probability: number;
  confidence: number;
  impliedProbability?: number;
  valueGap?: number;
  isValueBet: boolean;
  explanation?: string;
  explanationFactors?: Record<string, unknown>;
  probabilityUpdatedAt: string;
}

export interface Pick {
  id: string;
  rank: number;
  probability: number;
  confidence: number;
  explanation?: string;
  market: Market;
  event?: Event;
}

export interface PickSummary {
  id: string;
  rank: number;
  probability: number;
  market: {
    name: string;
    shortName?: string;
    category: MarketCategory;
  };
}

export interface Lineup {
  id: string;
  teamId: string;
  formation?: string;
  isConfirmed: boolean;
  entries: LineupEntry[];
}

export interface LineupEntry {
  id: string;
  player: {
    id: string;
    name: string;
    position?: string;
    number?: number;
    photoUrl?: string;
  };
  isStarter: boolean;
  position?: string;
}

export interface MatchStat {
  id: string;
  team: Team;
  goals: number;
  shotsTotal?: number;
  shotsOnTarget?: number;
  possession?: number;
  corners: number;
  yellowCards: number;
  redCards: number;
}

/** Where a Bet Builder selection was added from. */
export type SelectionSource = 'STREAK_EVIDENCE' | 'STREAK_EMERGING' | 'STREAK_EXPLORATORY' | 'CLUSTER' | 'MATCH_FORM';

export interface BuilderSelection {
  id: string;
  market: Market & { event: Event };
  addedProbability: number;
  createdAt: string;
  /** Null for a market added from a match page. */
  source?: SelectionSource | null;
}

export interface BuilderState {
  selections: BuilderSelection[];
  count: number;
  /**
   * Chance every selection lands. Null when two or more selections share a
   * match: those move together, so only a range can be given.
   */
  combinedProbability: number | null;
  combinedRange: { low: number; high: number };
  /** Matches holding more than one selection. */
  sharedMatches: number;
}

export interface SportSummary {
  sport: Sport;
  eventCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Streak engine ───

export type StreakStatus =
  | 'NEW'
  | 'ACTIVE'
  | 'STRENGTHENING'
  | 'WEAKENING'
  | 'BROKEN'
  | 'EXPIRED'
  | 'FILTERED';

export interface MarketDefinitionSummary {
  marketId: string;
  displayName: string;
  shortName?: string;
}

export interface StreakCandidate {
  id: string;
  entityId: string;
  selection: 'HOME' | 'AWAY' | 'MATCH' | null;
  context?: {
    venue?: string;
    /** Set when the team changed league: the record is this season only. */
    leagueChanged?: boolean;
    currentSeasonOnly?: number;
    /** Weighted recent form: recent matches count most, pulled towards the long record. */
    formRate?: number;
    /** The record pulled towards the market's usual rate (from 9 Oct 2026). */
    seasonRate?: number;
    /** The chance shown and used: the season figure nudged by form, 5% to 90%. */
    chance?: number;
    /** The last fifteen matches in this slice. */
    recent?: { wins: number; played: number };
    /** Strong in recent matches alone, though two seasons do not show it. */
    emerging?: boolean;
  } | null;
  sampleSize: number;
  wins: number;
  hitRate: number;
  baselineRate: number;
  lift: number;
  pValue?: number | null;
  adjustedPValue?: number | null;
  currentStreak: number;
  longestStreak: number;
  last10?: string | null;
  strengthScore: number;
  status: StreakStatus;
  survivedGate: boolean;
  marketDefinition: MarketDefinitionSummary;
  /** The same market in the team's current season, when the API has it. */
  thisSeason?: { season: number; wins: number; played: number } | null;
  /**
   * The team or league the record belongs to, resolved by the API. Without it
   * a card shows a market and never says whose record it is.
   */
  entity?: {
    id: string;
    type: 'TEAM' | 'LEAGUE' | 'MATCHUP';
    name: string;
    shortName?: string | null;
  } | null;
  /** The market named for the club it applies to. */
  marketLabel?: string;
  subject?: MarketSubject;
  /** The team's next fixture: the match this card is about. */
  nextFixture?: NextFixture | null;
  /** The same record split by how strong the opponent was at the time. */
  opponentSplit?: OpponentSplit | null;
}

export type OpponentBand = 'STRONGER' | 'SIMILAR' | 'WEAKER';

export interface OpponentSplit {
  stronger: { wins: number; played: number };
  similar: { wins: number; played: number };
  weaker: { wins: number; played: number };
  unrated: number;
  /** The next opponent's band, when both sides are rated. */
  next?: OpponentBand | null;
}

export interface NextFixture {
  eventId: string;
  kickoffAt: string;
  home: { id: string; name: string };
  away: { id: string; name: string };
  /** Whether the card's team is the home side. */
  isHome: boolean;
  competition: {
    name: string;
    country: string | null;
    kind: 'LEAGUE' | 'CUP';
    round: string | null;
    /** National-team competition: records mean less. */
    international?: boolean;
  };
  /** Who is missing on each side, from the card's team's point of view. */
  availability?: {
    own: Availability | null;
    opponent: Availability | null;
    verdict: AbsenceVerdict | null;
  } | null;
  /** Who is stronger going in, from team ratings. Null until both are rated. */
  strength?: {
    home: { rating: number; tier: 'STRONG' | 'AVERAGE' | 'WEAK' | null };
    away: { rating: number; tier: 'STRONG' | 'AVERAGE' | 'WEAK' | null };
    stronger: 'HOME' | 'AWAY' | 'EVEN';
  } | null;
}

export interface CandidatesResponse {
  run: { id: string; candidatesTested: number; candidatesSurviving?: number } | null;
  tier?: string;
  caveat?: string;
  candidates: StreakCandidate[];
}

/**
 * Who a figure covers. Decided by the API from the market definition, because
 * a candidate's `selection` is null for venue-agnostic slices and so cannot
 * say whether a market is about one club or the match total.
 */
export interface MarketSubject {
  scope: 'TEAM' | 'MATCH';
  team: string | null;
  label: string;
}

export interface ClusterComponent {
  id: string;
  rank: number;
  /** The chance it was built into the cluster with (null on older clusters). */
  chance?: number | null;
  snapshot: {
    /** The market named for the club it applies to. */
    marketLabel?: string;
    subject?: MarketSubject;
    hitRate: number;
    baselineRate: number;
    lift: number;
    sampleSize: number;
    currentStreak: number;
    result?: { result: 'WIN' | 'LOSS' | 'VOID' | 'UNKNOWN' } | null;
    event: {
      id?: string;
      kickoffAt: string;
      homeTeam: { id?: string; name: string; shortName?: string };
      awayTeam: { id?: string; name: string; shortName?: string };
      league: { name: string; country?: string | null };
    };
    streakCandidate: {
      selection: 'HOME' | 'AWAY' | 'MATCH' | null;
      entityId: string;
      entityType?: string;
      wins?: number;
      last10?: string | null;
      context?: StreakCandidate['context'];
      marketDefinition: MarketDefinitionSummary;
    };
  };
}

export interface Cluster {
  id: string;
  date: string;
  type: string;
  /** Sent by the API: whether every component cleared the significance gate. */
  tier?: 'evidence' | 'suggestive';
  label?: string;
  caveat?: string;
  componentCount: number;
  combinedProbability: number;
  status: StreakStatus;
  components: ClusterComponent[];
}

export interface ClustersResponse {
  date: string;
  caveat: string;
  clusters: Cluster[];
}

// ─── Team market form ───

export interface TeamMarketForm {
  marketId: string;
  marketLabel: string;
  scope: 'TEAM' | 'MATCH';
  subject: string;
  category: string;
  /** Newest first, e.g. "WWLWW". */
  recent: string;
  recentWins: number;
  recentPlayed: number;
  recentRate: number;
  currentRun: number;
  longWins: number;
  longPlayed: number;
  longRate: number;
  baselineRate: number | null;
  lift: number | null;
  chance: number | null;
  chanceBand: 'rare' | 'unusual' | 'common' | null;
}

export interface TeamFormResponse {
  team: { id: string; name: string; shortName?: string | null };
  window: number;
  venue: 'ALL' | 'HOME' | 'AWAY';
  sort: 'lift' | 'rate' | 'run';
  lookbackDays: number;
  matchesSeen: number;
  marketsMeasured: number;
  caveat: string | null;
  markets: TeamMarketForm[];
}

export interface FixtureFormResponse {
  event: { id: string; kickoffAt: string; league: { name: string } };
  home: TeamFormResponse;
  away: TeamFormResponse;
}

// ─── Fixture market board ───

export interface BoardRow {
  marketId: string;
  marketLabel: string;
  category: string;
  scope: 'TEAM' | 'MATCH';
  side: 'HOME' | 'AWAY' | 'MATCH';
  subject: string;
  probability: number;
  baselineRate: number | null;
  edge: number | null;
  wins: number;
  played: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidenceNote: string;
  recent: string;
  currentRun: number;
  evidence: Array<{ label: string; wins: number; played: number }>;
  gated: boolean;
  /** Whether both sides' records lean the same way on this market. */
  agreement?: 'AGREE_FOR' | 'AGREE_AGAINST' | 'SPLIT' | null;
  /** Key players missing, and whether that works against this row or for it. */
  absence?: AbsenceVerdict | null;
}

export interface BoardResponse {
  event: {
    id: string;
    kickoffAt: string;
    status: string;
    league: { name: string; country: string | null } | null;
    home: { id: string; name: string };
    away: { id: string; name: string };
  };
  /** Who is missing on each side; a side is null until it has been checked. */
  availability?: { home: Availability | null; away: Availability | null };
  sort: string;
  markets: number;
  /** Rows with at least `evidenceFloor` settled matches behind them. */
  measured: number;
  someHistory: number;
  evidenceFloor: number;
  lookbackDays: number;
  caveat: string;
  rows: BoardRow[];
}

// ─── Player availability ───

export interface MissingPlayer {
  playerId: string;
  name: string;
  status: string;
  reason: string | null;
  /** Share of the team's goals plus half its assists this season; null when unknown. */
  share: number | null;
  /** ABSENT: injured or suspended. BENCHED: fit but not in the confirmed XI. */
  kind: 'ABSENT' | 'BENCHED';
}

export interface Availability {
  level: 'NONE' | 'MINOR' | 'MAJOR' | 'UNKNOWN';
  lostShare: number;
  missing: MissingPlayer[];
  lineupConfirmed: boolean;
  statsKnown: boolean;
}

/** Whether absences work against a pick (HURTS) or for it (HELPS). */
export interface AbsenceVerdict {
  effect: 'HURTS' | 'HELPS';
  level: 'MAJOR' | 'MINOR';
}

// ─── Results ───

export type ResultValue = 'WIN' | 'LOSS' | 'VOID' | 'UNKNOWN';

export interface HitRate {
  settled: number;
  won: number;
  rate: number | null;
  /** The average chance OraQL gave: what the rate should be if it is calibrated. */
  expected: number | null;
}

export interface ResultsMatch {
  match: {
    eventId: string;
    kickoffAt: string;
    home: string;
    away: string;
    score: string | null;
    league: string;
    country: string | null;
    international: boolean;
  };
  items: Array<{
    label: string;
    result: ResultValue;
    probability: number;
    tier?: 'evidence' | 'emerging' | 'exploratory';
    driver?: 'RECENT' | 'SEASON';
  }>;
}

export interface ResultsCluster {
  id: string;
  date: string;
  tier: string;
  combinedProbability: number;
  outcome: 'WIN' | 'LOSS' | 'PENDING' | 'VOID';
  international: boolean;
  legs: Array<{ match: ResultsMatch['match']; label: string; result: ResultValue | null; probability: number }>;
}

export interface ResultsResponse {
  type: 'picks' | 'streaks' | 'clusters';
  summary: {
    overall: HitRate;
    byScope?: Record<string, HitRate>;
    byTier?: Record<string, HitRate>;
    byDriver?: Record<string, HitRate>;
    legs?: HitRate;
  };
  matches?: ResultsMatch[];
  clusters?: ResultsCluster[];
}

/** A cluster the user saved from the Bet Builder, and how it is going. */
export interface CustomClusterLeg {
  match: {
    eventId: string;
    kickoffAt: string;
    status: string;
    home: string;
    away: string;
    score: string | null;
    league: string;
    country: string | null;
    international: boolean;
  };
  label: string;
  /** Where it came from, in words: "Evidence-backed streak", "Match market"… */
  from: string;
  probability: number;
  result: ResultValue | null;
}

export interface CustomCluster {
  id: string;
  name: string | null;
  createdAt: string;
  state: 'UPCOMING' | 'IN_PLAY' | 'SETTLED';
  outcome: 'WIN' | 'LOSS' | 'VOID' | 'PENDING';
  combinedProbability: number | null;
  combinedRange: { low: number; high: number };
  canDelete: boolean;
  legs: CustomClusterLeg[];
}

export interface CustomClustersResponse {
  summary: { clusters: HitRate; selections: HitRate; waiting: number };
  clusters: CustomCluster[];
}
