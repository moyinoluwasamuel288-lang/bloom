import { CycleEngine } from './CycleEngine.js';

export class CalendarEngine {
  static buildMonth(year, month, cycles, metrics) {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    const confirmedSet = this.buildConfirmedSet(cycles);
    const hasData = cycles.length > 0;
    const projected = (hasData && metrics.projectedCycles) || [];

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = this.toDateStr(dateObj);
      let type = hasData ? 'safe' : 'unknown';

      if (confirmedSet.has(dateStr)) {
        type = 'period-confirmed';
      } else if (hasData) {
        for (const c of projected) {
          if (dateStr >= c.periodStart && dateStr <= c.periodEnd) { type = 'period-predicted'; break; }
          if (dateStr === c.ovulation) { type = 'ovulation'; break; }
          if (dateStr >= c.fertileStart && dateStr <= c.fertileEnd) { type = 'fertile'; break; }
        }
      }

      days.push({ date: dateStr, day: d, type, isToday: dateStr === todayStr });
    }

    return days;
  }

  static buildConfirmedSet(cycles) {
    const set = new Set();
    const todayStr = new Date().toISOString().split('T')[0];
    cycles.forEach(c => {
      const end = c.endDate && c.endDate >= c.startDate ? c.endDate : todayStr;
      let cursor = c.startDate;
      let guard = 0;
      while (cursor <= end && guard < 20) {
        set.add(cursor);
        cursor = CycleEngine.addDays(cursor, 1);
        guard++;
      }
    });
    return set;
  }

  static toDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
