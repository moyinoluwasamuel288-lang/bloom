import { greeting } from '../features/cycle/dateUtils.js';

export function renderHeader(state) {
  return `
    <div class="b-header">
      <div>
        <div class="b-logo">🌼 bloom</div>
        <div class="b-greeting">${greeting()}${state.streak > 0 ? ` — you're on a ${state.streak}-day streak` : ''}</div>
      </div>
      <div class="b-header-actions">
        <button class="b-icon-btn" data-action="open-theme">🎨</button>
        <button class="b-icon-btn" data-action="open-settings">⚙️</button>
      </div>
    </div>`;
}
