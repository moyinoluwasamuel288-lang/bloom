import { SafeStorage } from './SafeStorage.js';

/**
 * Manages daily check-in reminders and cycle-prediction alerts.
 * Uses the Notification API when available and permitted; otherwise falls
 * back to an in-app banner so the feature degrades gracefully rather than
 * failing silently (e.g. iOS Safari has limited background notification support).
 */
export class NotificationManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.checkTimer = null;
  }

  isSupported() {
    return typeof window.Notification !== 'undefined';
  }

  getPermissionState() {
    return this.isSupported() ? Notification.permission : 'unsupported';
  }

  async requestPermission() {
    if (!this.isSupported()) {
      this.eventBus.emit('toast', {
        message: 'Notifications aren\u2019t supported here — reminders will show in-app instead.',
        type: 'info'
      });
      return 'unsupported';
    }
    try {
      return await Notification.requestPermission();
    } catch (err) {
      return 'denied';
    }
  }

  async enableDailyReminder(hour = 20, minute = 0) {
    const permission = this.getPermissionState() === 'granted'
      ? 'granted'
      : await this.requestPermission();

    SafeStorage.set('bloom_reminders_enabled', String(permission === 'granted'));
    SafeStorage.set('bloom_reminder_time', `${hour}:${minute}`);

    if (permission !== 'granted') {
      this.eventBus.emit('toast', {
        message: permission === 'denied'
          ? 'Notifications are blocked — enable them in your browser settings to get reminders.'
          : 'Reminders need notification permission to work.',
        type: 'error'
      });
      return false;
    }

    this.eventBus.emit('toast', { message: 'Daily reminder set for ' + this.formatTime(hour, minute), type: 'success' });
    this.startWatcher();
    return true;
  }

  disableDailyReminder() {
    SafeStorage.set('bloom_reminders_enabled', 'false');
    this.stopWatcher();
    this.eventBus.emit('toast', { message: 'Daily reminder turned off', type: 'info' });
  }

  formatTime(hour, minute) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  /** Polls once a minute while the tab is open; a real deployment would pair
   *  this with a server push or periodic background sync for true background delivery. */
  startWatcher() {
    this.stopWatcher();
    this.checkTimer = setInterval(() => this.checkDue(), 60 * 1000);
    this.checkDue();
  }

  stopWatcher() {
    if (this.checkTimer) clearInterval(this.checkTimer);
    this.checkTimer = null;
  }

  checkDue() {
    if (SafeStorage.get('bloom_reminders_enabled') !== 'true') return;
    const [h, m] = (SafeStorage.get('bloom_reminder_time', '20:0')).split(':').map(Number);
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const alreadyFired = SafeStorage.get('bloom_reminder_fired_on') === todayKey;

    if (!alreadyFired && now.getHours() === h && now.getMinutes() >= m) {
      this.fire();
      SafeStorage.set('bloom_reminder_fired_on', todayKey);
    }
  }

  fire() {
    const title = 'Time for your check-in 🌱';
    const body = 'Take a moment to log how you\u2019re feeling today.';

    if (this.getPermissionState() === 'granted') {
      try {
        const notification = new Notification(title, { body, icon: 'icons/icon-192.png', tag: 'bloom-daily-checkin' });
        notification.onclick = () => {
          window.focus();
          this.eventBus.emit('open-checkin-modal');
        };
      } catch (err) {
        this.eventBus.emit('toast', { message: body, type: 'info' });
      }
    } else {
      this.eventBus.emit('toast', { message: body, type: 'info' });
    }
  }

  initFromSavedState() {
    if (SafeStorage.get('bloom_reminders_enabled') === 'true' && this.getPermissionState() === 'granted') {
      this.startWatcher();
    }
  }

  /**
   * Schedules a gentle reminder for each not-yet-done task, spaced by each
   * task's offsetMinutes so they trickle in rather than firing at once.
   * Only schedules once per task per day (tracked via SafeStorage) so
   * re-renders of the Today screen don't stack duplicate timers.
   * Never requires a permission prompt — falls back to an in-app toast
   * when notifications aren't granted, so reminders always show up somehow.
   */
  scheduleTaskReminders(tasks, store, dateStr, completedIds = []) {
    tasks.forEach((task) => {
      if (completedIds.includes(task.id)) return;

      const flagKey = `bloom_task_reminder_${dateStr}_${task.id}`;
      if (SafeStorage.get(flagKey)) return;
      SafeStorage.set(flagKey, 'true');

      const delayMs = Math.max(1, task.offsetMinutes) * 60 * 1000;
      setTimeout(async () => {
        try {
          const log = await store.get('dailyLogs', dateStr);
          const done = log && Array.isArray(log.completedTasks) && log.completedTasks.includes(task.id);
          if (!done) this.fireTaskReminder(task);
        } catch (err) {
          // Non-fatal — a missed reminder shouldn't disrupt anything else
        }
      }, delayMs);
    });
  }

  fireTaskReminder(task) {
    const title = task.label;
    const body = task.description || 'A gentle nudge from Bloom 🌱';

    if (this.getPermissionState() === 'granted') {
      try {
        const notification = new Notification(title, { body, icon: 'icons/icon-192.png', tag: `bloom-task-${task.id}` });
        notification.onclick = () => window.focus();
      } catch (err) {
        this.eventBus.emit('toast', { message: `${title} — ${body}`, type: 'info' });
      }
    } else {
      this.eventBus.emit('toast', { message: `${title} — ${body}`, type: 'info' });
    }
  }
}
