export class CycleEngine {
  static DEFAULT_CYCLE_LENGTH = 28;
  static DEFAULT_PERIOD_LENGTH = 5;

  /**
   * Calculates averages and predicted windows from historical cycle logs.
   * @param {Array<{startDate: string, endDate?: string}>} cycles
   * @returns {Object} Calculated metrics and predictions
   */
  static analyzeCycles(cycles) {
    if (!cycles || cycles.length === 0) {
      return this.getFallbackMetrics();
    }

    // Sort chronologically ascending
    const sorted = [...cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Calculate cycle lengths (interval between consecutive start dates)
    const cycleLengths = [];
    const periodLengths = [];

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].endDate) {
        const pLen = this.dayDiff(sorted[i].startDate, sorted[i].endDate) + 1;
        if (pLen > 0 && pLen < 20) periodLengths.push(pLen);
      }

      if (i < sorted.length - 1) {
        const cLen = this.dayDiff(sorted[i].startDate, sorted[i + 1].startDate);
        if (cLen >= 15 && cLen <= 60) { // Exclude extreme outliers
          cycleLengths.push(cLen);
        }
      }
    }

    const avgCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : this.DEFAULT_CYCLE_LENGTH;

    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : this.DEFAULT_PERIOD_LENGTH;

    const lastCycle = sorted[sorted.length - 1];
    const predictedNextStart = this.addDays(lastCycle.startDate, avgCycleLength);
    const predictedNextEnd = this.addDays(predictedNextStart, avgPeriodLength - 1);

    // Fertile window estimation (Standard Ovulation Calculation: ~14 days before next cycle)
    const estimatedOvulation = this.addDays(predictedNextStart, -14);
    const fertileWindowStart = this.addDays(estimatedOvulation, -5);
    const fertileWindowEnd = this.addDays(estimatedOvulation, 1);

    return {
      avgCycleLength,
      avgPeriodLength,
      cycleCount: sorted.length,
      lastPeriodStart: lastCycle.startDate,
      predictedNextStart,
      predictedNextEnd,
      estimatedOvulation,
      fertileWindow: { start: fertileWindowStart, end: fertileWindowEnd },
      confidence: cycleLengths.length >= 3 ? 'high' : cycleLengths.length >= 1 ? 'medium' : 'low'
    };
  }

  /**
   * Determine current phase and cycle day relative to a given date.
   */
  static getCurrentPhase(targetDateStr, lastStartStr, avgCycleLength) {
    const dayOfCycle = this.dayDiff(lastStartStr, targetDateStr) + 1;

    if (dayOfCycle <= 0) {
      return { phase: 'unknown', dayOfCycle };
    }

    // Phase threshold definitions
    if (dayOfCycle <= 5) return { phase: 'menstrual', name: 'Menstrual Phase', dayOfCycle };
    if (dayOfCycle <= 13) return { phase: 'follicular', name: 'Follicular Phase', dayOfCycle };
    if (dayOfCycle <= 16) return { phase: 'ovulatory', name: 'Ovulatory Phase', dayOfCycle };
    if (dayOfCycle <= avgCycleLength) return { phase: 'luteal', name: 'Luteal Phase', dayOfCycle };

    return { phase: 'late', name: 'Late / Expecting', dayOfCycle };
  }

  /**
   * Projects period/ovulation/fertile windows forward from the last logged
   * period, for as many cycles as the calendar needs to render. n=0 is the
   * most recently logged period; n=1 is the next predicted period, etc.
   */
  static projectCycles(lastPeriodStart, avgCycleLength, avgPeriodLength, count = 6) {
    const cycles = [];
    for (let n = 0; n <= count; n++) {
      const periodStart = this.addDays(lastPeriodStart, n * avgCycleLength);
      const periodEnd = this.addDays(periodStart, avgPeriodLength - 1);
      const nextStart = this.addDays(lastPeriodStart, (n + 1) * avgCycleLength);
      const ovulation = this.addDays(nextStart, -14);
      const fertileStart = this.addDays(ovulation, -5);
      const fertileEnd = this.addDays(ovulation, 1);
      cycles.push({ n, periodStart, periodEnd, ovulation, fertileStart, fertileEnd });
    }
    return cycles;
  }

  static dayDiff(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  static addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  static getFallbackMetrics() {
    const today = new Date().toISOString().split('T')[0];
    return {
      avgCycleLength: this.DEFAULT_CYCLE_LENGTH,
      avgPeriodLength: this.DEFAULT_PERIOD_LENGTH,
      cycleCount: 0,
      lastPeriodStart: today,
      predictedNextStart: this.addDays(today, this.DEFAULT_CYCLE_LENGTH),
      predictedNextEnd: this.addDays(today, this.DEFAULT_CYCLE_LENGTH + this.DEFAULT_PERIOD_LENGTH),
      estimatedOvulation: this.addDays(today, 14),
      fertileWindow: { start: this.addDays(today, 9), end: this.addDays(today, 15) },
      confidence: 'none'
    };
  }
}
