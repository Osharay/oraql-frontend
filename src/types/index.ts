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

export interface BuilderSelection {
  id: string;
  market: Market & { event: Event };
  addedProbability: number;
  createdAt: string;
}

export interface BuilderState {
  selections: BuilderSelection[];
  count: number;
  combinedProbability: number;
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
  context?: { venue?: string } | null;
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
      kickoffAt: string;
      homeTeam: { name: string; shortName?: string };
      awayTeam: { name: string; shortName?: string };
      league: { name: string };
    };
    streakCandidate: {
      selection: 'HOME' | 'AWAY' | 'MATCH' | null;
      entityId: string;
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
