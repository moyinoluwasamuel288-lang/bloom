export function renderStatsRow(state, d) {
  return `
    <div class="b-stats-row">
      <div class="b-chip"><div class="b-chip-val">🔥 ${state.streak}</div><div class="b-chip-label">day streak</div></div>
      <div class="b-chip"><div class="b-chip-val">lv.${d.level}</div><div class="b-chip-label">${state.points} points</div></div>
      <div class="b-chip"><div class="b-chip-val">${state.avgCycleLength}d</div><div class="b-chip-label">your average</div></div>
    </div>`;
}
