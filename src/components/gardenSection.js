export function renderGardenSection(d, theme) {
  const filled = Math.min(d.level, 12);
  return `
    <div class="b-section">
      <div class="b-section-title">🌷 the garden you're growing</div>
      <div class="b-garden-grid">
        ${Array.from({ length: 12 }).map((_, i) => `<div class="b-garden-slot ${i < filled ? 'filled' : ''}">${i < filled ? theme.decor[i % theme.decor.length] : ''}</div>`).join('')}
      </div>
      <div class="b-empty-note">${filled === 0 ? "empty for now — do a little something today and watch it grow" : `${filled} planted so far. keep going 🌱`}</div>
    </div>`;
}
