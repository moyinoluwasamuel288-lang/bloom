import { todayStr } from '../cycle/dateUtils.js';
import { REMINDERS } from '../../data/reminders.js';

export async function enableNotifications({ showToast, onGranted }) {
  if (!('Notification' in window)) { showToast("this browser can't do notifications"); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') { showToast("notifications on — I'll check in on you 🌸"); onGranted(); }
  else showToast("no worries — you can turn these on later in browser settings");
}

export function fireNotification(state, saveState, id, message) {
  const t = todayStr();
  if (state.notifDates[id] === t) return; // already sent today
  state.notifDates[id] = t;
  saveState();
  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification('Bloom', { body: message, icon: './icon-192.png', badge: './icon-192.png' }));
    } else {
      new Notification('Bloom', { body: message, icon: './icon-192.png' });
    }
  }
}

export function startReminderLoop(state, saveState, getDerived) {
  if (Notification.permission !== 'granted') return;
  setInterval(() => {
    const now = new Date();
    REMINDERS.forEach(r => {
      if (now.getHours() === r.hour && now.getMinutes() === r.minute) fireNotification(state, saveState, r.id, r.message);
    });
    const d = getDerived(state);
    if (d.isLate && now.getHours() === 10 && now.getMinutes() === 0) {
      fireNotification(state, saveState, 'r-late', `🌸 You're ${Math.abs(d.daysUntilNext)} day(s) late — everything okay?`);
    }
  }, 30000);
}
