/**
 * National teams play a few times a year with changing squads, so their
 * records mean less than a club's. Marked wherever a pick is shown.
 * Mirrors the API's src/common/international.ts.
 */
const CLUB_WORDS = /\b(clubs?|champions league|europa|conference league|libertadores|sudamericana|cup winners|super cup|recopa|leagues cup)\b/i;
const NATIONAL_WORDS =
  /\b(world cup|nations league|euro championship|uefa euro|africa cup of nations|afcon|copa america|gold cup|asian cup|friendlies|qualification|qualifiers?|olympic|u17|u19|u20|u21|u23|cosafa|cafa|saff|aff|asean|gulf cup|arab cup|cecafa|wafu)\b/i;

export function isInternationalCompetition(name?: string | null, country?: string | null): boolean {
  const n = name ?? '';
  if (CLUB_WORDS.test(n)) return false;
  if (NATIONAL_WORDS.test(n)) return (country ?? 'World') === 'World' || /friendlies|qualif/i.test(n);
  return false;
}

export function InternationalBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span
      title="National teams: few matches a year and changing squads, so the record behind this pick means less than a club's."
      className="rounded-oracle-full bg-oracle-gold/15 px-2 py-0.5 text-caption font-semibold text-oracle-gold-dark"
    >
      International
    </span>
  );
}
