export function renderReminderCard() {
  const supported = 'Notification' in window;
  const granted = supported && Notification.permission === 'granted';
  return `
    <div class="b-section">
      <div class="b-section-title">🔔 reminders</div>
      <div class="b-empty-note" style="text-align:left;">Water, vitamins, pad/cup changes, and a wind-down nudge — sent while Bloom is open on this device. ${granted ? "notifications are on ✓" : ""}</div>
      ${!supported ? '' : granted ? '' : `<button class="b-notif-btn" data-action="enable-notif">turn on reminders</button>`}
    </div>`;
}
