import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

/**
 * tailwind-merge only knows Tailwind's built-in sizes. Told nothing, it reads
 * `text-caption` as a colour, and when a real colour such as `text-value`
 * follows it in the same cn() call it keeps the last one — silently dropping
 * the size. Chips and badges were rendering at body size for that reason.
 * Keep this list in step with fontSize in tailwind.config.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'display-md',
            'display-sm',
            'heading',
            'subhead',
            'body-lg',
            'body',
            'body-sm',
            'caption',
            'mono-sm',
            'h2',
            'h3',
            'h4',
            'h5',
          ],
        },
      ],
    },
  },
});

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format probability as percentage string */
export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

/** Get probability tier: high (>75%), mid (50-75%), low (<50%) */
export function getProbabilityTier(prob: number): 'high' | 'mid' | 'low' {
  if (prob >= 0.75) return 'high';
  if (prob >= 0.50) return 'mid';
  return 'low';
}

/** Format kickoff time for display */
export function formatKickoff(isoDate: string): string {
  const date = new Date(isoDate);

  if (isToday(date)) {
    return `Today, ${format(date, 'HH:mm')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'HH:mm')}`;
  }
  return format(date, 'EEE d MMM, HH:mm');
}

/** Format kickoff as relative time */
export function formatKickoffRelative(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
}

/** Get display label for sport */
export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    FOOTBALL: 'Football',
    BASKETBALL: 'Basketball',
    TENNIS: 'Tennis',
    CRICKET: 'Cricket',
    BASEBALL: 'Baseball',
    HOCKEY: 'Hockey',
  };
  return labels[sport] || sport;
}

/** Get sport icon name (for lucide-react) */
export function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    FOOTBALL: 'circle-dot',
    BASKETBALL: 'circle',
    TENNIS: 'circle-dot',
  };
  return icons[sport] || 'trophy';
}

/** Format market category for display */
export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    MATCH_RESULT: 'Match Result',
    GOALS: 'Goals',
    CORNERS: 'Corners',
    CARDS: 'Cards',
    PLAYER: 'Player Props',
    HALFTIME: 'Half Time',
    HANDICAP: 'Handicap',
    SPECIAL: 'Specials',
  };
  return labels[category] || category;
}
