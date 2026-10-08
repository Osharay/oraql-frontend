/**
 * Whether the gap between what landed and what OraQL expected is more than
 * chance explains for this many settled picks (about two standard errors).
 * A fixed threshold called a 5-point gap over 458 picks "about as expected".
 */
export function verdict(rate: number, expected: number, settled: number): string {
  const gap = rate - expected;
  const points = Math.round(Math.abs(gap) * 100);
  const noise = 2 * Math.sqrt((expected * (1 - expected)) / settled);
  const over = `over ${settled.toLocaleString()} settled`;
  if (Math.abs(gap) <= noise || points === 0)
    return `Landing about as often as OraQL expected: a ${points}-point gap ${over} is within what chance explains.`;
  return gap < 0
    ? `OraQL is running ${points} points high ${over}: more than chance explains. Check the splits below for where.`
    : `Landing ${points} points more often than OraQL expected ${over}: more than chance explains.`;
}
