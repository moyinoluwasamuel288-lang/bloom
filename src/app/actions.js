import { state, ui, saveState, showToast } from './state.js';
import { render } from './render.js';
import { startPeriod as startPeriodEngine, endPeriod as endPeriodEngine, getDerived } from '../features/cycle/cycleEngine.js';
import { toggleTask as toggleTaskEngine, bumpStreak } from '../features/bloom/gamification.js';
import { enableNotifications as enableNotificationsFeature, startReminderLoop as startReminderLoopFeature } from '../features/notifications/notifications.js';

export function openTheme() { ui.showTheme = true; render(); }
export function openSettings() { ui.showSettings = true; render(); }
export function closeModal() { ui.showTheme = false; ui.showSettings = false; render(); }

export function pickTheme(key) {
  state.themeKey = key;
  ui.showTheme = false;
  saveState();
  render();
}

export function toggleHistory() { ui.showHistory = !ui.showHistory; render(); }

export function toggleTask(taskId, pts) {
  toggleTaskEngine(state, taskId, pts);
  saveState();
  render();
}

export function startPeriod() {
  startPeriodEngine(state);
  bumpStreak(state);
  saveState();
  render();
  showToast('logged — take it easy on yourself 🌸');
}

export function endPeriod() {
  endPeriodEngine(state);
  bumpStreak(state);
  saveState();
  render();
  showToast('logged, thank you for checking in 💗');
}

export function resetAll() {
  Object.assign(state, {
    periods: [], ongoingStart: null, points: 0, streak: 0,
    lastActiveDate: null, completedByDate: {}, avgCycleLength: 28, avgPeriodLength: 5,
    notifDates: {},
  });
  saveState();
  ui.showSettings = false;
  render();
}

export function setField(field, value) {
  const n = Number(value);
  if (field === 'avgCycleLength' && n > 0) state.avgCycleLength = n;
  if (field === 'avgPeriodLength' && n > 0) state.avgPeriodLength = n;
  saveState();
}

export function startReminderLoop() {
  startReminderLoopFeature(state, saveState, getDerived);
}

export function enableNotifications() {
  enableNotificationsFeature({ showToast, onGranted: startReminderLoop });
}
