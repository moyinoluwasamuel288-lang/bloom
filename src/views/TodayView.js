import { CycleEngine } from '../core/CycleEngine.js';
import { TaskEngine } from '../core/TaskEngine.js';

export class TodayView {
  constructor(container, store, eventBus) {
    this.container = container;
    this.store = store;
    this.eventBus = eventBus;
  }

  async render() {
    this.container.innerHTML = this.getSkeletonHTML();

    try {
      const cycles = await this.store.getAll('cycles');
      const hasData = cycles.length > 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = await this.store.get('dailyLogs', todayStr);
      const profile = (await this.store.get('settings', 'profile')) || {};

      let metrics = null;
      let phaseInfo = null;
      let periodStartedToday = false;
      let daysUntilNext = null;

      if (hasData) {
        metrics = CycleEngine.analyzeCycles(cycles);
        phaseInfo = CycleEngine.getCurrentPhase(todayStr, metrics.lastPeriodStart, metrics.avgCycleLength);
        periodStartedToday = metrics.lastPeriodStart === todayStr;
        daysUntilNext = CycleEngine.dayDiff(todayStr, metrics.predictedNextStart);
      }

      const completedTasks = (todayLog && todayLog.completedTasks) || [];
      const tasks = TaskEngine.getTasksForPhase(phaseInfo ? phaseInfo.phase : null);

      this.container.innerHTML = `
        <div class="today-view fade-in">
          <header class="header">
            <p class="greeting-sub">Welcome back 🌱</p>
            <h1 class="greeting-title">${this.getGreeting()}${profile.name ? `, ${this.escapeHtml(profile.name)}` : ''}</h1>
            <p class="date-display">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </header>

          ${hasData ? this.renderTrackedState(metrics, phaseInfo, periodStartedToday, daysUntilNext) : this.renderEmptyState(todayStr)}

          <section class="checkin-cta">
            <h3>How are you feeling today?</h3>
            ${todayLog ? `
              <div class="checkin-summary">
                <p>✓ Logged for today</p>
                <div class="chip-group">
                  ${todayLog.symptoms ? todayLog.symptoms.map(s => `<span class="chip">${s}</span>`).join('') : ''}
                  ${todayLog.mood ? `<span class="chip mood-chip">${todayLog.mood}</span>` : ''}
                </div>
                <button id="open-checkin-btn" class="btn btn-secondary">Edit Daily Check-in</button>
              </div>
            ` : `
              <button id="open-checkin-btn" class="btn btn-primary btn-block">
                Log Today's Experience
              </button>
            `}
          </section>

          <section class="daily-bloom-tasks">
            <h3>Today's Self-Care 🌱</h3>
            <p class="task-intro">${hasData ? "Picked for where you are in your cycle." : 'A few general ideas for today.'} We'll check in gently, a few minutes apart.</p>
            <ul class="task-list">
              ${tasks.map(t => `
                <li class="task-item">
                  <input type="checkbox" id="${t.id}" data-xp="${t.xp}" ${completedTasks.includes(t.id) ? 'checked' : ''} />
                  <label for="${t.id}">
                    <span class="task-label-text">${t.label} <span class="task-xp">+${t.xp} XP</span></span>
                    <span class="task-desc">${t.description}</span>
                  </label>
                </li>
              `).join('')}
            </ul>
          </section>
        </div>
      `;

      this.bindEvents(tasks, completedTasks, todayStr, hasData);
    } catch (err) {
      this.renderErrorState(err);
    }
  }

  renderTrackedState(metrics, phaseInfo, periodStartedToday, daysUntilNext) {
    return `
      <section class="period-start-section">
        <button id="period-start-btn" class="period-start-btn ${periodStartedToday ? 'logged' : ''}" ${periodStartedToday ? 'disabled' : ''}>
          <span class="period-start-icon">${periodStartedToday ? '✓' : '🌸'}</span>
          <span class="period-start-text">${periodStartedToday ? "You've logged today as day 1" : 'It started today'}</span>
        </button>
      </section>

      <section class="next-period-card">
        <div class="next-period-row">
          <div class="next-period-item">
            <span class="next-period-label">Next period</span>
            <span class="next-period-value">${this.formatShortDate(metrics.predictedNextStart)}</span>
            <span class="next-period-sub">${daysUntilNext > 0 ? `in ${daysUntilNext} days` : 'around today'}</span>
          </div>
          <div class="next-period-item">
            <span class="next-period-label">Ovulation</span>
            <span class="next-period-value">${this.formatShortDate(metrics.estimatedOvulation)}</span>
            <span class="next-period-sub">estimated</span>
          </div>
          <div class="next-period-item">
            <span class="next-period-label">Fertile window</span>
            <span class="next-period-value">${this.formatShortDate(metrics.fertileWindow.start)} – ${this.formatShortDate(metrics.fertileWindow.end)}</span>
            <span class="next-period-sub">estimated</span>
          </div>
        </div>
        ${metrics.confidence === 'low' ? '<p class="confidence-note">Based on one cycle so far — estimates get sharper the more you log.</p>' : ''}
        <button id="view-calendar-btn" class="btn btn-secondary btn-block">View full calendar</button>
      </section>

      <section class="cycle-card-container">
        <div class="cycle-card phase-${phaseInfo.phase}">
          <div class="cycle-card-header">
            <span class="phase-badge">${phaseInfo.name}</span>
            <span class="confidence-indicator">Confidence: ${metrics.confidence}</span>
          </div>
          <div class="cycle-card-body">
            <div class="cycle-day-display">
              <span class="label">Cycle Day</span>
              <span class="value">${phaseInfo.dayOfCycle}</span>
            </div>
            <div class="cycle-prediction">
              ${daysUntilNext > 0
                ? `<p>Period may arrive in <strong>about ${daysUntilNext} days</strong></p>`
                : `<p>Period expected <strong>around today</strong></p>`}
            </div>
          </div>
          <div class="cycle-progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, (phaseInfo.dayOfCycle / metrics.avgCycleLength) * 100)}%"></div>
          </div>
        </div>
      </section>
    `;
  }

  renderEmptyState(todayStr) {
    return `
      <section class="period-start-section">
        <button id="period-start-btn" class="period-start-btn">
          <span class="period-start-icon">🌸</span>
          <span class="period-start-text">It started today</span>
        </button>
        <button id="log-past-toggle-btn" class="log-past-toggle-btn" type="button">Started on a different day?</button>
        <div class="log-past-form" id="log-past-form" hidden>
          <label for="past-period-date" class="step-label">When did your last period start?</label>
          <div class="input-row">
            <input type="date" id="past-period-date" class="form-control" max="${todayStr}" />
            <button id="log-past-save-btn" class="btn btn-secondary btn-sm">Save</button>
          </div>
        </div>
      </section>

      <section class="empty-tracking-card">
        <div class="empty-tracking-icon">🌱</div>
        <h3>No period logged yet</h3>
        <p>Once you log a period — today's or a past start date — Bloom will start estimating your next period, ovulation, and fertile window. We don\u2019t guess before then.</p>
      </section>
    `;
  }

  formatShortDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  bindEvents(tasks, completedTasks, todayStr, hasData) {
    const btn = this.container.querySelector('#open-checkin-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.eventBus.emit('open-checkin-modal');
      });
    }

    const calBtn = this.container.querySelector('#view-calendar-btn');
    if (calBtn) {
      calBtn.addEventListener('click', () => this.eventBus.emit('navigate', { route: 'calendar' }));
    }

    const startBtn = this.container.querySelector('#period-start-btn');
    if (startBtn && !startBtn.disabled) {
      startBtn.addEventListener('click', () => this.logPeriodStarted(todayStr, startBtn));
    }

    const toggleBtn = this.container.querySelector('#log-past-toggle-btn');
    const pastForm = this.container.querySelector('#log-past-form');
    if (toggleBtn && pastForm) {
      toggleBtn.addEventListener('click', () => {
        pastForm.hidden = !pastForm.hidden;
        toggleBtn.textContent = pastForm.hidden ? 'Started on a different day?' : 'Never mind';
      });

      const saveBtn = this.container.querySelector('#log-past-save-btn');
      const dateInput = this.container.querySelector('#past-period-date');
      saveBtn.addEventListener('click', () => {
        const chosenDate = dateInput.value;
        if (!chosenDate) {
          this.eventBus.emit('toast', { message: 'Pick a date first', type: 'info' });
          return;
        }
        if (chosenDate > todayStr) {
          this.eventBus.emit('toast', { message: "That date hasn't happened yet", type: 'info' });
          return;
        }
        this.logPeriodStarted(chosenDate, saveBtn);
      });
    }

    this.container.querySelectorAll('.task-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => this.toggleTask(cb, todayStr));
    });

    // Let app.js schedule gentle, spaced-out reminders for whatever's left to do today
    this.eventBus.emit('tasks-ready', { tasks, completedIds: completedTasks, dateStr: todayStr });
  }

  async toggleTask(checkbox, todayStr) {
    const id = checkbox.id;
    const xp = Number(checkbox.dataset.xp) || 5;
    checkbox.disabled = true;

    try {
      const existingLog = await this.store.get('dailyLogs', todayStr);
      const completed = new Set((existingLog && existingLog.completedTasks) || []);
      if (checkbox.checked) completed.add(id); else completed.delete(id);

      await this.store.set('dailyLogs', todayStr, {
        ...(existingLog || {}),
        date: todayStr,
        completedTasks: Array.from(completed)
      });

      if (checkbox.checked) {
        this.eventBus.emit('task-toggled', { id, checked: true, xp });
      }
    } catch (err) {
      checkbox.checked = !checkbox.checked;
      this.eventBus.emit('toast', { message: "Couldn't save that — please try again", type: 'error' });
    } finally {
      checkbox.disabled = false;
    }
  }

  /**
   * Logs a period start for the given date — either today (from the main
   * button) or a past date (from the "started on a different day" form).
   * This is the only place cycle data gets created, so predictions never
   * appear without a real logged date behind them.
   */
  async logPeriodStarted(dateStr, triggerEl) {
    triggerEl.disabled = true;
    const textEl = triggerEl.querySelector ? triggerEl.querySelector('.period-start-text') : null;
    const originalText = textEl ? textEl.textContent : triggerEl.textContent;
    if (textEl) textEl.textContent = 'Logging…'; else triggerEl.textContent = 'Saving…';

    try {
      const existingCycles = await this.store.getAll('cycles');
      const alreadyLoggedThatDay = existingCycles.some(c => c.startDate === dateStr);

      if (!alreadyLoggedThatDay) {
        await this.store.set('cycles', `cycle_${Date.now()}`, {
          startDate: dateStr,
          createdAt: Date.now()
        });

        const existingLog = await this.store.get('dailyLogs', dateStr);
        await this.store.set('dailyLogs', dateStr, {
          ...(existingLog || {}),
          date: dateStr,
          flow: (existingLog && existingLog.flow && existingLog.flow !== 'none') ? existingLog.flow : 'medium'
        });
      }

      this.eventBus.emit('period-started');
      this.eventBus.emit('toast', { message: 'Logged — take it easy today 💗', type: 'success' });
      this.eventBus.emit('data-updated');
    } catch (err) {
      triggerEl.disabled = false;
      if (textEl) textEl.textContent = originalText; else triggerEl.textContent = originalText;
      this.eventBus.emit('toast', { message: "Couldn't save that — please try again", type: 'error' });
    }
  }

  getSkeletonHTML() {
    return `
      <div class="today-view skeleton-wrapper">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-subtitle"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    `;
  }

  renderErrorState(error) {
    this.container.innerHTML = `
      <div class="error-state-card">
        <div class="error-icon">🌱</div>
        <h3>Unable to load your cycle data</h3>
        <p>Bloom encountered a temporary reading issue. Your data remains safe locally.</p>
        <button class="btn btn-secondary" onclick="location.reload()">Reload Application</button>
      </div>
    `;
  }
}
