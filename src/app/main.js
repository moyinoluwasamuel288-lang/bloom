import { render } from './render.js';
import { wireEvents } from './events.js';
import { startReminderLoop } from './actions.js';

wireEvents();
render();

if ('Notification' in window && Notification.permission === 'granted') startReminderLoop();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
