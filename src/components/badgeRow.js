export function renderBadgeRow(badges) {
  return `
    <div class="b-section">
      <div class="b-section-title">🏆 little wins</div>
      <div class="b-badges-row">
        ${badges.map(b => `<div class="b-badge ${b.earned ? 'earned' : ''}"><div class="b-badge-icon">${b.icon}</div><div class="b-badge-label">${b.label}</div></div>`).join('')}
      </div>
    </div>`;
}
