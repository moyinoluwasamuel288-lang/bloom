import { state, ui } from './state.js';
import { THEMES } from '../data/themes.js';
import { getDerived } from '../features/cycle/cycleEngine.js';
import { getBadges } from '../features/bloom/gamification.js';
import { renderHeader } from '../components/header.js';
import { renderHeroCard } from '../components/heroCard.js';
import { renderStatsRow } from '../components/statsRow.js';
import { renderXpSection } from '../components/xpSection.js';
import { renderTaskList } from '../components/taskList.js';
import { renderGardenSection } from '../components/gardenSection.js';
import { renderBadgeRow } from '../components/badgeRow.js';
import { renderHistorySection } from '../components/historySection.js';
import { renderReminderCard } from '../components/reminderCard.js';
import { renderThemeModal, renderSettingsModal } from '../components/modals.js';

const THEME_VARS = ['bg', 'surface', 'surfaceAlt', 'primary', 'secondary', 'accent', 'text', 'textSoft', 'border', 'displayFont', 'bodyFont', 'radius'];

function applyTheme(theme) {
  const root = document.getElementById('root');
  THEME_VARS.forEach(key => {
    root.style.setProperty(`--${key}`, theme[key]);
    document.body.style.setProperty(`--${key}`, theme[key]);
  });
}

export function render() {
  const theme = THEMES[state.themeKey];
  const d = getDerived(state);
  const badges = getBadges(state, d);

  applyTheme(theme);

  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="b-wrap">
      ${renderHeader(state)}
      ${renderHeroCard(state, d, theme)}
      ${renderStatsRow(state, d)}
      ${renderXpSection(d)}
      ${renderTaskList(d)}
      ${renderGardenSection(d, theme)}
      ${renderBadgeRow(badges)}
      ${renderHistorySection(state, d, ui)}
      ${renderReminderCard()}
    </div>
    ${ui.showTheme ? renderThemeModal(state) : ''}
    ${ui.showSettings ? renderSettingsModal(state) : ''}
  `;
}
