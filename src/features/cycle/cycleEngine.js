import { todayStr, diffDays, addDays } from './dateUtils.js';

export const LEVEL_XP = 150;

// Computes everything the UI needs about "where the user is" right now.
// Predictions are estimates only — never presented as exact.
export function getDerived(state) {
  const t = todayStr();
  const lastStart = state.ongoingStart || (state.periods.length ? state.periods[state.periods.length - 1].start : null);
  const cycleDay = lastStart ? diffDays(lastStart, t) + 1 : null;
  const predictedNext = lastStart ? addDays(lastStart, state.avgCycleLength) : null;
  const daysUntilNext = predictedNext ? diffDays(t, predictedNext) : null;
  const isLate = !state.ongoingStart && daysUntilNext !== null && daysUntilNext < 0;
  const cycleLengths = [];
  for (let i = 1; i < state.periods.length; i++) cycleLengths.push(diffDays(state.periods[i - 1].start, state.periods[i].start));
  const level = Math.floor(state.points / LEVEL_XP) + 1;
  const xpIntoLevel = state.points % LEVEL_XP;
  const xpPercent = (xpIntoLevel / LEVEL_XP) * 100;
  const todaysTasks = state.completedByDate[t] || [];
  return { t, lastStart, cycleDay, predictedNext, daysUntilNext, isLate, cycleLengths, level, xpIntoLevel, xpPercent, todaysTasks };
}

// Mutates state in place (caller is responsible for saveState + render).
export function startPeriod(state) {
  state.ongoingStart = todayStr();
  state.points += 30;
}

export function endPeriod(state) {
  if (!state.ongoingStart) return;
  const t = todayStr();
  state.periods.push({ start: state.ongoingStart, end: t });
  if (state.periods.length >= 2) {
    const recent = state.periods.slice(-4);
    const gaps = [];
    for (let i = 1; i < recent.length; i++) gaps.push(diffDays(recent[i - 1].start, recent[i].start));
    if (gaps.length) state.avgCycleLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }
  const len = diffDays(state.ongoingStart, t) + 1;
  if (len > 0) state.avgPeriodLength = len;
  state.ongoingStart = null;
  state.points += 20;
}
