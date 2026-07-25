export class CheckInModal {
  constructor(container, store, eventBus) {
    this.container = container;
    this.store = store;
    this.eventBus = eventBus;
    this.isOpen = false;
    this.selectedFlow = 'none';
    this.selectedSymptoms = new Set();
    this.selectedMood = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="modal-overlay" aria-hidden="true">
        <div class="modal-sheet" role="dialog" aria-labelledby="modal-title">
          <header class="modal-header">
            <h2 id="modal-title">Daily Check-in</h2>
            <button class="close-btn" id="modal-close-btn" aria-label="Close">&times;</button>
          </header>

          <div class="modal-body">
            <section class="modal-step">
              <label class="step-label">Flow Today</label>
              <div class="flow-selector">
                ${['none', 'spotting', 'light', 'medium', 'heavy'].map(f => `
                  <button type="button" class="chip-btn flow-btn" data-value="${f}">${f}</button>
                `).join('')}
              </div>
            </section>

            <section class="modal-step">
              <label class="step-label">Symptoms</label>
              <div class="chip-grid">
                ${['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Acne', 'Back pain', 'Nausea', 'Tenderness'].map(s => `
                  <button type="button" class="chip-btn symptom-btn" data-value="${s}">${s}</button>
                `).join('')}
              </div>
            </section>

            <section class="modal-step">
              <label class="step-label">Mood</label>
              <div class="mood-selector">
                <button type="button" class="mood-btn" data-value="great">😄 Great</button>
                <button type="button" class="mood-btn" data-value="good">🙂 Good</button>
                <button type="button" class="mood-btn" data-value="okay">😐 Okay</button>
                <button type="button" class="mood-btn" data-value="low">😕 Low</button>
                <button type="button" class="mood-btn" data-value="difficult">😣 Difficult</button>
              </div>
            </section>

            <section class="modal-step">
              <label class="step-label" for="daily-note">Personal Notes</label>
              <textarea id="daily-note" placeholder="Anything else you'd like to remember?" rows="3"></textarea>
            </section>
          </div>

          <footer class="modal-footer">
            <button id="save-checkin-btn" class="btn btn-primary btn-block">Save Check-in</button>
          </footer>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const overlay = this.container.querySelector('#modal-overlay');
    const closeBtn = this.container.querySelector('#modal-close-btn');
    const saveBtn = this.container.querySelector('#save-checkin-btn');

    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });

    // Delegate selection logic
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('flow-btn')) {
        this.container.querySelectorAll('.flow-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedFlow = e.target.dataset.value;
      }

      if (e.target.classList.contains('symptom-btn')) {
        const val = e.target.dataset.value;
        if (this.selectedSymptoms.has(val)) {
          this.selectedSymptoms.delete(val);
          e.target.classList.remove('active');
        } else {
          this.selectedSymptoms.add(val);
          e.target.classList.add('active');
        }
      }

      if (e.target.classList.contains('mood-btn')) {
        this.container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedMood = e.target.dataset.value;
      }
    });

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      try {
        await this.saveData();
        this.close();
        this.eventBus.emit('data-updated');
        this.eventBus.emit('checkin-saved');
        this.eventBus.emit('toast', { message: 'Check-in saved · +10 XP', type: 'success' });
      } catch (err) {
        this.eventBus.emit('toast', { message: "Couldn't save — check your device storage and try again", type: 'error' });
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Check-in';
      }
    });
  }

  open() {
    const overlay = this.container.querySelector('#modal-overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
  }

  close() {
    const overlay = this.container.querySelector('#modal-overlay');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
  }

  async saveData() {
    const todayStr = new Date().toISOString().split('T')[0];
    const note = this.container.querySelector('#daily-note').value;

    const logEntry = {
      date: todayStr,
      flow: this.selectedFlow,
      symptoms: Array.from(this.selectedSymptoms),
      mood: this.selectedMood,
      notes: note
    };

    await this.store.set('dailyLogs', todayStr, logEntry);

    // If flow is logged as active starting flow, automatically sync with cycles collection
    if (['light', 'medium', 'heavy'].includes(this.selectedFlow)) {
      const existingCycles = await this.store.getAll('cycles');
      // Create new cycle if needed
      if (existingCycles.length === 0 || existingCycles[existingCycles.length - 1].endDate) {
        await this.store.set('cycles', `cycle_${Date.now()}`, {
          startDate: todayStr,
          createdAt: Date.now()
        });
      }
    } else if (this.selectedFlow === 'none') {
      // Flow ended — close the open cycle if one exists
      const existingCycles = await this.store.getAll('cycles');
      const openCycle = existingCycles.find(c => !c.endDate);
      if (openCycle) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await this.store.set('cycles', openCycle.id || `cycle_${openCycle.createdAt}`, {
          ...openCycle,
          endDate: yesterday.toISOString().split('T')[0]
        });
      }
    }
  }
}
