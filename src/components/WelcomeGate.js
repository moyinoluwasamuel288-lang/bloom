export class WelcomeGate {
  constructor(container, store, eventBus) {
    this.container = container;
    this.store = store;
    this.eventBus = eventBus;
  }

  render() {
    this.container.innerHTML = `
      <div class="welcome-gate-overlay" id="welcome-gate-overlay">
        <div class="welcome-gate-card fade-in">
          <div class="welcome-gate-emoji">🌱</div>
          <h2 class="welcome-gate-title">Welcome to Bloom</h2>
          <p class="welcome-gate-subtitle">What should we call you? We'll use it to make the app feel a little more like yours.</p>
          <input type="text" id="welcome-name-input" class="input welcome-name-input" placeholder="Your name" maxlength="30" autocomplete="given-name" />
          <button id="welcome-continue-btn" class="btn btn-primary btn-block">Continue</button>
          <button id="welcome-skip-btn" class="btn btn-ghost-link">Skip for now</button>
        </div>
      </div>
    `;

    this.bindEvents();

    // Focus without stealing scroll position on small screens
    setTimeout(() => this.container.querySelector('#welcome-name-input')?.focus(), 300);
  }

  bindEvents() {
    const input = this.container.querySelector('#welcome-name-input');
    const continueBtn = this.container.querySelector('#welcome-continue-btn');
    const skipBtn = this.container.querySelector('#welcome-skip-btn');

    const submit = async () => {
      const name = input.value.trim();
      await this.saveAndClose(name);
    };

    continueBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    skipBtn.addEventListener('click', () => this.saveAndClose(''));
  }

  async saveAndClose(name) {
    try {
      await this.store.set('settings', 'profile', { name });
    } catch (err) {
      // Non-fatal — app continues without a saved name, name field stays editable in Settings
    }
    this.eventBus.emit('profile-updated', { name });
    const overlay = this.container.querySelector('#welcome-gate-overlay');
    overlay.classList.add('closing');
    setTimeout(() => { this.container.innerHTML = ''; }, 250);
  }
}
