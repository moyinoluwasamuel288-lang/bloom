export class GardenView {
  constructor(container, store) {
    this.container = container;
    this.store = store;
  }

  async render() {
    try {
      const gardenData = await this.store.get('garden', 'state') || { xp: 120, level: 2 };

      this.container.innerHTML = `
        <div class="garden-view fade-in">
          <header class="garden-header">
            <h2>Your Sanctuary Garden</h2>
            <div class="xp-badge">Level ${gardenData.level} • ${gardenData.xp} XP</div>
          </header>

          <div class="garden-canvas">
            <div class="plant-slot slot-1">🌱</div>
            <div class="plant-slot slot-2">🪴</div>
            <div class="plant-slot slot-3">🌸</div>
          </div>

          <div class="garden-info-card">
            <h3>Gentle Self-Care Growth</h3>
            <p>Your garden blossoms quietly with every check-in. There are no penalties for missing days—bloom at your own pace.</p>
          </div>
        </div>
      `;
    } catch (err) {
      this.container.innerHTML = `
        <div class="error-state-card">
          <div class="error-icon">🌱</div>
          <h3>Unable to load your garden</h3>
          <p>Your data remains safe locally.</p>
          <button class="btn btn-secondary" onclick="location.reload()">Reload Application</button>
        </div>
      `;
    }
  }
}
