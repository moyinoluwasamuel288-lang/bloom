const STORE_KEY = 'bloom-data-v1';

export const defaultState = {
  themeKey: 'sakura',
  periods: [],
  ongoingStart: null,
  points: 0,
  streak: 0,
  lastActiveDate: null,
  completedByDate: {},
  avgCycleLength: 28,
  avgPeriodLength: 5,
  notifDates: {},
};

export function loadState() {
  let state = { ...defaultState };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) {
    console.warn('could not load saved data', e);
  }
  return state;
}

export function saveState(state, onError) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    if (onError) onError("hmm, couldn't save that on this device");
  }
}
