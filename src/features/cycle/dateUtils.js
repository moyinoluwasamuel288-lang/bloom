export function fmt(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseD(s) { return new Date(s + 'T00:00:00'); }
export function todayStr() { return fmt(new Date()); }
export function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return fmt(d); }
export function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
export function niceDate(s) { return parseD(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'still up, huh?';
  if (h < 12) return 'morning, love';
  if (h < 17) return 'hey there';
  if (h < 21) return 'evening check-in';
  return 'winding down?';
}
