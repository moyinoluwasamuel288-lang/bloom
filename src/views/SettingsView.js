import { SafeStorage } from '../core/SafeStorage.js';

export class SettingsView {
  constructor(container, store, eventBus) {
    this.container = container;
    this.store = store;
    this.eventBus = eventBus;
  }

  async render() {
    let profile = { name: '' };
    try {
      profile = (await this.store.get('settings', 'profile')) || profile;
    } catch (err) {
      // Non-fatal — settings still renders with an empty name field
    }

    this.container.innerHTML = `
      <div class="settings-view fade-in">
        <h2>Settings</h2>

        <section class="settings-group">
          <h3>About you</h3>
          <div class="setting-item setting-item-stacked">
            <label for="name-input">Your name</label>
            <div class="input-row">
              <input type="text" id="name-input" class="form-control" placeholder="What should we call you?" value="${this.escapeHtml(profile.name || '')}" maxlength="30" />
              <button id="save-name-btn" class="btn btn-secondary btn-sm">Save</button>
            </div>
          </div>
        </section>

        <section class="settings-group">
          <h3>Appearance</h3>
          <div class="setting-item">
            <label for="theme-select">Theme</label>
            <select id="theme-select" class="form-control">
              <option value="soft">Soft Natural</option>
              <option value="dark">Dark Mode</option>
              <option value="y2k">Y2K Nostalgia</option>
            </select>
          </div>
        </section>

        <section class="settings-group">
          <h3>Reminders</h3>
          <div class="setting-item">
            <label for="notif-toggle">Remind me to check in each day</label>
            <input type="checkbox" id="notif-toggle" />
          </div>
          <p class="privacy-note" id="notif-status"></p>
        </section>

        <section class="settings-group">
          <h3>Your data</h3>
          <p class="privacy-note">Everything you log stays on this device — nothing is sent anywhere.</p>
          <div class="btn-stack">
            <button id="export-data-btn" class="btn btn-secondary">Export data</button>
            <button id="clear-data-btn" class="btn btn-danger">Delete all my data</button>
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  bindEvents() {
    this.bindNameField();
    this.bindThemeSelect();
    this.bindReminderToggle();
    this.bindExport();
    this.bindDelete();
  }

  bindNameField() {
    const nameInput = this.container.querySelector('#name-input');
    const saveNameBtn = this.container.querySelector('#save-name-btn');
    if (!nameInput || !saveNameBtn) return;

    saveNameBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      try {
        await this.store.set('settings', 'profile', { name });
        this.eventBus.emit('profile-updated', { name });
        this.eventBus.emit('toast', { message: name ? `Saved — hi, ${name}!` : 'Name cleared', type: 'success' });
      } catch (err) {
        this.eventBus.emit('toast', { message: "Couldn't save your name — please try again", type: 'error' });
      }
    });
  }

  bindThemeSelect() {
    const themeSelect = this.container.querySelector('#theme-select');
    if (!themeSelect) return;

    const savedTheme = SafeStorage.get('bloom_theme', 'soft');
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-theme', theme);
      const saved = SafeStorage.set('bloom_theme', theme);
      this.eventBus.emit('toast', {
        message: saved ? 'Theme updated' : 'Theme changed for this visit (your browser is blocking saved settings)',
        type: saved ? 'success' : 'info'
      });
    });
  }

  bindReminderToggle() {
    const notifToggle = this.container.querySelector('#notif-toggle');
    const notifStatus = this.container.querySelector('#notif-status');
    if (!notifToggle) return;

    notifToggle.checked = SafeStorage.get('bloom_reminders_enabled') === 'true';

    const supportsNotifications = typeof window.Notification !== 'undefined';
    if (notifStatus) {
      notifStatus.textContent = supportsNotifications && Notification.permission === 'denied'
        ? 'Notifications are blocked in your browser settings.'
        : '';
    }

    notifToggle.addEventListener('change', () => {
      this.eventBus.emit('reminders-toggle', { enabled: notifToggle.checked });
    });
  }

  bindExport() {
    const exportBtn = this.container.querySelector('#export-data-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
      try {
        const json = await this.store.exportAllData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bloom-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.eventBus.emit('toast', { message: 'Backup downloaded', type: 'success' });
      } catch (err) {
        this.eventBus.emit('toast', { message: 'Export failed — please try again', type: 'error' });
      }
    });
  }

  bindDelete() {
    const clearBtn = this.container.querySelector('#clear-data-btn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
      this.eventBus.emit('confirm', {
        title: 'Delete all data?',
        message: 'This removes every cycle log, check-in, and garden entry on this device. This can\u2019t be undone.',
        confirmLabel: 'Delete everything',
        onConfirm: async () => {
          try {
            await this.store.clearAll();
            this.eventBus.emit('toast', { message: 'All your data has been deleted', type: 'success' });
            setTimeout(() => location.reload(), 900);
          } catch (err) {
            this.eventBus.emit('toast', { message: 'Could not delete data — please try again', type: 'error' });
          }
        }
      });
    });
  }
}
