import { THEMES } from '../data/themes.js';

export function renderThemeModal(state) {
  return `<div class="b-modal-backdrop" data-action="close-modal">
    <div class="b-modal" onclick="event.stopPropagation()">
      <div class="b-modal-head"><div class="b-modal-title">what feels like you?</div><button class="b-icon-btn" data-action="close-modal">✕</button></div>
      <div class="b-theme-grid">
        ${Object.entries(THEMES).map(([key, t]) => `
          <div class="b-theme-opt ${state.themeKey === key ? 'active' : ''}" data-action="pick-theme" data-id="${key}">
            <div class="b-theme-swatch" style="background:${t.bg}"></div>
            <div class="b-theme-name">${t.emoji} ${t.label}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

export function renderSettingsModal(state) {
  return `<div class="b-modal-backdrop" data-action="close-modal">
    <div class="b-modal" onclick="event.stopPropagation()">
      <div class="b-modal-head"><div class="b-modal-title">the details</div><button class="b-icon-btn" data-action="close-modal">✕</button></div>
      <div class="b-field"><label>how many days, usually, between periods?</label>
        <input type="number" value="${state.avgCycleLength}" min="15" max="60" data-field="avgCycleLength"/></div>
      <div class="b-field"><label>how many days does it usually last?</label>
        <input type="number" value="${state.avgPeriodLength}" min="1" max="14" data-field="avgPeriodLength"/></div>
      <button class="b-danger" data-action="reset-all">start over</button>
    </div>
  </div>`;
}
