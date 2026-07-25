import { LocalStorageEngine } from './core/Storage.js';
import { RewardEngine } from './core/RewardEngine.js';
import { NotificationManager } from './core/NotificationManager.js';
import { SafeStorage } from './core/SafeStorage.js';
import { TodayView } from './views/TodayView.js';
import { CalendarView } from './views/CalendarView.js';
import { InsightsView } from './views/InsightsView.js';
import { GardenView } from './views/GardenView.js';
import { SettingsView } from './views/SettingsView.js';
import { CheckInModal } from './components/CheckInModal.js';
import { Toast } from './components/Toast.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import { WelcomeGate } from './components/WelcomeGate.js';

const TASK_XP = { task1: 10, task2: 5, task3: 5 };

class EventBus {
  constructor() { this.listeners = {}; }
  on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); }
  emit(evt, data) { (this.listeners[evt] || []).forEach(fn => fn(data)); }
}

class BloomApp {
  async init() {
    this.eventBus = new EventBus();
    this.store = new LocalStorageEngine();

    try {
      await this.store.init();
    } catch (err) {
      this.renderFatalError();
      return;
    }

    this.reward = new RewardEngine(this.store, this.eventBus);
    this.notifications = new NotificationManager(this.eventBus);

    this.registerServiceWorker();
    this.setupTheme();
    this.setupOfflineBanner();
    this.initComponents();
    this.bindNavigation();
    this.bindRewardEvents();
    this.notifications.initFromSavedState();

    // Default route
    this.renderRoute('today');

    await this.maybeShowWelcomeGate();
  }

  async maybeShowWelcomeGate() {
    let profile = null;
    try {
      profile = await this.store.get('settings', 'profile');
    } catch (err) {
      return;
    }
    if (profile) return;

    const gateContainer = document.getElementById('welcome-gate-container');
    const gate = new WelcomeGate(gateContainer, this.store, this.eventBus);
    gate.render();
  }

  setupTheme() {
    const savedTheme = SafeStorage.get('bloom_theme', 'soft');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  setupOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    const update = () => {
      if (!banner) return;
      banner.classList.toggle('visible', !navigator.onLine);
    };
    window.addEventListener('online', () => { update(); this.eventBus.emit('toast', { message: 'Back online', type: 'success' }); });
    window.addEventListener('offline', () => { update(); this.eventBus.emit('toast', { message: 'You\u2019re offline — Bloom keeps working, changes save locally', type: 'info' }); });
    update();
  }

  initComponents() {
    this.appContainer = document.getElementById('app-view');
    this.modalContainer = document.getElementById('modal-container');
    this.confirmContainer = document.getElementById('confirm-container');
    this.toastContainer = document.getElementById('toast-container');

    this.checkInModal = new CheckInModal(this.modalContainer, this.store, this.eventBus);
    this.checkInModal.render();

    this.confirmDialog = new ConfirmDialog(this.confirmContainer);
    this.toast = new Toast(this.toastContainer);

    this.eventBus.on('open-checkin-modal', () => this.checkInModal.open());
    this.eventBus.on('data-updated', () => this.renderRoute(this.currentRoute));
    this.eventBus.on('toast', (payload) => this.toast.show(payload));
    this.eventBus.on('confirm', (payload) => this.confirmDialog.open(payload));

    this.eventBus.on('navigate', ({ route }) => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
      this.renderRoute(route);
    });

    this.eventBus.on('profile-updated', () => {
      if (this.currentRoute === 'today' || this.currentRoute === 'settings') {
        this.renderRoute(this.currentRoute);
      }
    });

    this.eventBus.on('reminders-toggle', async ({ enabled }) => {
      if (enabled) {
        await this.notifications.enableDailyReminder(20, 0);
      } else {
        this.notifications.disableDailyReminder();
      }
    });

    // Today screen reports its phase-aware tasks here so reminders can be
    // scheduled centrally — once per task per day, however many times the
    // screen re-renders.
    this.eventBus.on('tasks-ready', ({ tasks, completedIds, dateStr }) => {
      this.notifications.scheduleTaskReminders(tasks, this.store, dateStr, completedIds);
    });
  }

  bindRewardEvents() {
    this.eventBus.on('checkin-saved', async () => {
      await this.reward.grantXP(10, 'checkin');
    });

    this.eventBus.on('period-started', async () => {
      await this.reward.grantXP(15, 'period-start');
    });

    this.eventBus.on('task-toggled', async ({ id, checked, xp }) => {
      if (!checked) return;
      await this.reward.grantXP(xp || TASK_XP[id] || 5, 'task');
    });

    this.eventBus.on('level-up', ({ level }) => {
      this.toast.show({ message: `Level up! You reached Level ${level} 🌸`, type: 'success' });
      this.launchConfetti();
    });

    this.eventBus.on('badge-earned', (badge) => {
      this.toast.show({ message: `New badge unlocked: ${badge.icon} ${badge.label}`, type: 'success' });
    });
  }

  launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#E0897A', '#8BA888', '#E5C365', '#A288A8'];
    const wrap = document.createElement('div');
    wrap.className = 'level-up-confetti';
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      wrap.appendChild(piece);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2400);
  }

  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.dataset.route;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderRoute(route);
      });
    });
  }

  async renderRoute(route) {
    this.currentRoute = route;
    try {
      switch (route) {
        case 'today':
          await new TodayView(this.appContainer, this.store, this.eventBus).render();
          break;
        case 'calendar':
          await new CalendarView(this.appContainer, this.store, this.eventBus).render();
          break;
        case 'insights':
          await new InsightsView(this.appContainer, this.store).render();
          break;
        case 'garden':
          await new GardenView(this.appContainer, this.store).render();
          break;
        case 'settings':
          await new SettingsView(this.appContainer, this.store, this.eventBus).render();
          break;
        default:
          await new TodayView(this.appContainer, this.store, this.eventBus).render();
      }
    } catch (err) {
      this.eventBus.emit('toast', { message: 'Something went wrong loading that screen', type: 'error' });
    }
  }

  renderFatalError() {
    document.getElementById('app-shell').innerHTML = `
      <div class="error-state-card" style="margin:40px 20px;">
        <div class="error-icon">🌱</div>
        <h3>Bloom couldn\u2019t start</h3>
        <p>Your browser may be blocking local storage (common in private/incognito mode). Try a normal browser window.</p>
        <button class="btn btn-secondary" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Non-fatal: app still works online without offline caching
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BloomApp().init();
});
