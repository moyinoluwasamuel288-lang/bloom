import { CycleEngine } from '../core/CycleEngine.js';

export class InsightsView {
  constructor(container, store) {
    this.container = container;
    this.store = store;
  }

  async render() {
    this.container.innerHTML = this.getSkeletonHTML();

    try {
      const cycles = await this.store.getAll('cycles');
      const dailyLogs = await this.store.getAll('dailyLogs');
      const hasData = cycles.length > 0;
      const metrics = hasData ? CycleEngine.analyzeCycles(cycles) : null;
      const symptomTally = this.tallySymptoms(dailyLogs);
      const moodTally = this.tallyMoods(dailyLogs);

      this.container.innerHTML = `
        <div class="insights-view fade-in">
          <header class="header">
            <h1 class="greeting-title">Your Insights</h1>
            <p class="date-display">${hasData ? `Based on ${metrics.cycleCount} logged cycle${metrics.cycleCount === 1 ? '' : 's'}` : 'No cycles logged yet'}</p>
          </header>

          <section class="insight-card">
            <h3>Cycle Averages</h3>
            ${hasData ? `
              <div class="metric-row">
                <div class="metric">
                  <span class="metric-value">${metrics.avgCycleLength}</span>
                  <span class="metric-label">avg cycle length (days)</span>
                </div>
                <div class="metric">
                  <span class="metric-value">${metrics.avgPeriodLength}</span>
                  <span class="metric-label">avg period length (days)</span>
                </div>
              </div>
              <p class="confidence-note">Confidence: ${metrics.confidence}${metrics.confidence === 'low' ? ' — log a few more cycles for sharper estimates' : ''}</p>
            ` : `
              <p class="empty-note">Log a period on the Today screen to start building your averages here.</p>
            `}
          </section>

          <section class="insight-card">
            <h3>Symptom Patterns</h3>
            ${symptomTally.length > 0 ? `
              <ul class="pattern-list">
                ${symptomTally.map(([name, count]) => `
                  <li class="pattern-row">
                    <span>${name}</span>
                    <div class="pattern-bar-track"><div class="pattern-bar-fill" style="width:${Math.min(100, count * 12)}%"></div></div>
                    <span class="pattern-count">${count}×</span>
                  </li>
                `).join('')}
              </ul>
            ` : `
              <p class="empty-note">No symptoms logged yet. Daily check-ins will build this picture over time.</p>
            `}
          </section>

          <section class="insight-card">
            <h3>Mood Patterns</h3>
            ${moodTally.length > 0 ? `
              <div class="chip-group">
                ${moodTally.map(([mood, count]) => `<span class="chip">${mood} · ${count}×</span>`).join('')}
              </div>
            ` : `
              <p class="empty-note">No moods logged yet. Check in daily to see trends here.</p>
            `}
          </section>
        </div>
      `;
    } catch (err) {
      this.renderErrorState(err);
    }
  }

  tallySymptoms(logs) {
    const counts = {};
    logs.forEach(l => (l.symptoms || []).forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }

  tallyMoods(logs) {
    const counts = {};
    logs.forEach(l => { if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  getSkeletonHTML() {
    return `
      <div class="insights-view skeleton-wrapper">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;
  }

  renderErrorState(error) {
    this.container.innerHTML = `
      <div class="error-state-card">
        <div class="error-icon">🌱</div>
        <h3>Unable to load your insights</h3>
        <p>Bloom encountered a temporary reading issue. Your data remains safe locally.</p>
        <button class="btn btn-secondary" onclick="location.reload()">Reload Application</button>
      </div>
    `;
  }
}
