import { niceDate, diffDays } from '../features/cycle/dateUtils.js';

export function renderHistoryList(state, d) {
  if (state.periods.length === 0 && !state.ongoingStart) return `<div class="b-empty-note">nothing logged yet — it'll show up here once you tell me it's started 🌷</div>`;
  let rows = '';
  if (state.ongoingStart) rows += `<div class="b-history-row"><span>${niceDate(state.ongoingStart)} → ongoing</span><span class="b-pill">Day ${d.cycleDay}</span></div>`;
  [...state.periods].reverse().forEach((p, i) => {
    const idx = state.periods.length - 1 - i;
    const gap = idx > 0 ? diffDays(state.periods[idx - 1].start, p.start) : null;
    rows += `<div class="b-history-row"><span>${niceDate(p.start)} → ${niceDate(p.end)}</span><span class="b-pill">${gap ? `${gap}d cycle` : `${diffDays(p.start, p.end) + 1}d flow`}</span></div>`;
  });
  return rows;
}

export function renderHistorySection(state, d, ui) {
  return `
    <div class="b-section">
      <div class="b-section-title" style="justify-content:space-between;cursor:pointer;" data-action="toggle-history">
        <span>⏳ looking back</span><span>${ui.showHistory ? '▲' : '▼'}</span>
      </div>
      ${ui.showHistory ? renderHistoryList(state, d) : ''}
    </div>`;
}
