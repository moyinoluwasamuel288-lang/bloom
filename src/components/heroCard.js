export function renderHeroCard(state, d, theme) {
  let ringPercent = 0, centerBig = '', centerSmall = '';
  if (state.ongoingStart) {
    ringPercent = Math.min(d.cycleDay / Math.max(state.avgPeriodLength, 1), 1);
    centerBig = `day ${d.cycleDay}`;
    centerSmall = d.cycleDay <= 1 ? 'just started, take it easy' : 'still going';
  } else if (d.lastStart) {
    if (d.isLate) {
      ringPercent = 1;
      centerBig = `${Math.abs(d.daysUntilNext)} ${Math.abs(d.daysUntilNext) === 1 ? 'day' : 'days'}`;
      centerSmall = 'late — everything okay?';
    } else {
      ringPercent = 1 - Math.min(d.daysUntilNext / state.avgCycleLength, 1);
      centerBig = d.daysUntilNext === 0 ? 'today' : `${d.daysUntilNext}d`;
      centerSmall = d.daysUntilNext === 0 ? 'might start today' : "till your next one";
    }
  } else {
    centerBig = '+';
    centerSmall = 'tap below when it starts';
  }

  const R = 70, C = 2 * Math.PI * R, dash = C * ringPercent;

  return `
    <div class="b-hero">
      ${theme.decor.map((e, i) => `<span class="b-floaty" style="left:${15 + i * 30}%; animation-delay:${i * 2.3}s;">${e}</span>`).join('')}
      <div class="b-ring-wrap">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="${R}" fill="none" stroke="${theme.surfaceAlt}" stroke-width="14"/>
          <circle cx="90" cy="90" r="${R}" fill="none" stroke="${d.isLate ? '#e0505f' : theme.primary}" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${dash} ${C - dash}" transform="rotate(-90 90 90)" style="transition: stroke-dasharray .6s ease;"/>
        </svg>
        <div class="b-ring-center">
          <div class="b-ring-big" style="${d.isLate ? 'color:#e0505f;' : ''}">${centerBig}</div>
          <div class="b-ring-small">${centerSmall}</div>
        </div>
      </div>
      <div class="b-actions-row">
        ${!state.ongoingStart
          ? `<button class="b-btn b-btn-primary" data-action="start-period">💧 it started today</button>`
          : `<button class="b-btn b-btn-primary" data-action="end-period">✅ it ended today</button>`}
      </div>
    </div>`;
}
