import { CycleEngine } from '../core/CycleEngine.js';
import { CalendarEngine } from '../core/CalendarEngine.js';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_LABELS = {
  'period-confirmed': 'Logged period',
  'period-predicted': 'Estimated period',
  fertile: 'Higher pregnancy chance (estimate)',
  ovulation: 'Estimated ovulation day',
  safe: 'Lower pregnancy chance (estimate)',
  unknown: 'No data yet'
};

export class CalendarView {
  constructor(container, store, eventBus) {
    this.container = container;
    this.store = store;
    this.eventBus = eventBus;
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
  }

  async render() {
    this.container.innerHTML = this.getSkeletonHTML();

    try {
      const cycles = await this.store.getAll('cycles');
      const hasData = cycles.length > 0;
      let metrics = { cycleCount: 0 };

      if (hasData) {
        metrics = CycleEngine.analyzeCycles(cycles);
        metrics.projectedCycles = CycleEngine.projectCycles(metrics.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength, 6);
      }

      const days = CalendarEngine.buildMonth(this.year, this.month, cycles, metrics);

      this.container.innerHTML = `
        <div class="calendar-view fade-in">
          <header class="header">
            <h1 class="greeting-title">Calendar</h1>
            <p class="date-display">Logged days are certain — everything else is an estimate</p>
          </header>

          ${!hasData ? `
            <div class="calendar-no-data-banner">
              Log a period on the Today screen to start seeing estimated periods, fertile windows, and ovulation here.
            </div>
          ` : ''}

          <div class="calendar-card">
            <div class="calendar-nav">
              <button class="btn-icon" id="cal-prev-btn" aria-label="Previous month">‹</button>
              <span class="calendar-month-label">${MONTH_LABELS[this.month]} ${this.year}</span>
              <button class="btn-icon" id="cal-next-btn" aria-label="Next month">›</button>
            </div>

            <div class="calendar-weekdays">
              ${WEEKDAY_LABELS.map(w => `<span>${w}</span>`).join('')}
            </div>

            <div class="calendar-grid">
              ${days.map(d => d ? `
                <button class="calendar-day ${d.type} ${d.isToday ? 'today' : ''}" data-date="${d.date}" data-type="${d.type}">
                  ${d.day}
                </button>
              ` : `<span class="calendar-day-empty"></span>`).join('')}
            </div>
          </div>

          ${hasData ? `
            <div class="calendar-legend">
              <span class="legend-item"><i class="legend-swatch swatch-period-confirmed"></i>Logged period</span>
              <span class="legend-item"><i class="legend-swatch swatch-period-predicted"></i>Estimated period</span>
              <span class="legend-item"><i class="legend-swatch swatch-fertile"></i>Fertile window</span>
              <span class="legend-item"><i class="legend-swatch swatch-ovulation"></i>Ovulation</span>
            </div>
          ` : ''}

          <div class="calendar-day-detail" id="calendar-day-detail">
            <p class="empty-note">Tap a day to see what it means.</p>
          </div>

          ${hasData ? `<p class="calendar-disclaimer">Estimates are based on your logged cycles and aren\u2019t a substitute for medical advice or contraception.</p>` : ''}
        </div>
      `;

      this.bindEvents();
    } catch (err) {
      this.renderErrorState();
    }
  }

  bindEvents() {
    const prevBtn = this.container.querySelector('#cal-prev-btn');
    const nextBtn = this.container.querySelector('#cal-next-btn');

    prevBtn.addEventListener('click', () => {
      this.month -= 1;
      if (this.month < 0) { this.month = 11; this.year -= 1; }
      this.render();
    });

    nextBtn.addEventListener('click', () => {
      this.month += 1;
      if (this.month > 11) { this.month = 0; this.year += 1; }
      this.render();
    });

    this.container.querySelectorAll('.calendar-day').forEach(cell => {
      cell.addEventListener('click', () => {
        this.container.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.showDayDetail(cell.dataset.date, cell.dataset.type);
      });
    });
  }

  showDayDetail(dateStr, type) {
    const detail = this.container.querySelector('#calendar-day-detail');
    const dateObj = new Date(dateStr + 'T00:00:00');
    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    detail.innerHTML = `
      <p class="detail-date">${formatted}</p>
      <p class="detail-type type-${type}">${TYPE_LABELS[type] || 'No data'}</p>
    `;
  }

  getSkeletonHTML() {
    return `
      <div class="calendar-view skeleton-wrapper">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card" style="height:340px;"></div>
      </div>
    `;
  }

  renderErrorState() {
    this.container.innerHTML = `
      <div class="error-state-card">
        <div class="error-icon">🌱</div>
        <h3>Unable to load your calendar</h3>
        <p>Bloom encountered a temporary reading issue. Your data remains safe locally.</p>
        <button class="btn btn-secondary" onclick="location.reload()">Reload Application</button>
      </div>
    `;
  }
}
