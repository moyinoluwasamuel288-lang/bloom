import { todayStr, addDays } from '../cycle/dateUtils.js';
import { TASKS } from '../../data/tasks.js';

export function bumpStreak(state) {
  const t = todayStr();
  if (state.lastActiveDate === t) return;
  state.streak = (state.lastActiveDate === addDays(t, -1)) ? state.streak + 1 : 1;
  state.lastActiveDate = t;
}

export function toggleTask(state, taskId, pts) {
  const t = todayStr();
  const list = state.completedByDate[t] || [];
  const has = list.includes(taskId);
  state.completedByDate[t] = has ? list.filter(x => x !== taskId) : [...list, taskId];
  state.points = Math.max(0, state.points + (has ? -pts : pts));
  if (!has) bumpStreak(state);
}

export function getBadges(state, derived) {
  const totalLogged = state.periods.length + (state.ongoingStart ? 1 : 0);
  const avgGap = derived.cycleLengths.length ? derived.cycleLengths.reduce((a, b) => a + b, 0) / derived.cycleLengths.length : null;
  const hadOnTime = avgGap !== null && derived.cycleLengths.some(g => Math.abs(g - avgGap) <= 2);
  const perfectDay = Object.values(state.completedByDate).some(list => list.length >= TASKS.length);
  return [
    { id: 'first', label: 'first one logged', icon: '🌱', earned: totalLogged >= 1 },
    { id: 'streak3', label: '3 days showing up', icon: '🔥', earned: state.streak >= 3 },
    { id: 'streak7', label: 'a full week strong', icon: '💪', earned: state.streak >= 7 },
    { id: 'cycles3', label: 'getting to know your body', icon: '📈', earned: state.periods.length >= 3 },
    { id: 'ontime', label: 'right on schedule', icon: '⏰', earned: hadOnTime },
    { id: 'selfcare', label: 'took care of you, fully', icon: '👑', earned: perfectDay },
    { id: 'level5', label: 'certified bloom girl', icon: '💎', earned: derived.level >= 5 },
  ];
}
