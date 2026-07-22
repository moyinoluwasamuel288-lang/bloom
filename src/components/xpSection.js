import { LEVEL_XP } from '../features/cycle/cycleEngine.js';

export function renderXpSection(d) {
  return `
    <div class="b-section">
      <div class="b-section-title">✨ so close to leveling up</div>
      <div class="b-xpbar-track"><div class="b-xpbar-fill" style="width:${d.xpPercent}%"></div></div>
      <div style="font-size:11px;color:var(--textSoft);margin-top:6px;">${d.xpIntoLevel} of ${LEVEL_XP} points to level ${d.level + 1}</div>
    </div>`;
}
