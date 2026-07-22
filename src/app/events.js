import * as actions from './actions.js';

export function wireEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'open-theme') actions.openTheme();
    else if (action === 'open-settings') actions.openSettings();
    else if (action === 'close-modal') actions.closeModal();
    else if (action === 'pick-theme') actions.pickTheme(el.dataset.id);
    else if (action === 'toggle-task') actions.toggleTask(el.dataset.id, Number(el.dataset.pts));
    else if (action === 'start-period') actions.startPeriod();
    else if (action === 'end-period') actions.endPeriod();
    else if (action === 'toggle-history') actions.toggleHistory();
    else if (action === 'reset-all') { if (confirm('Start completely fresh? This wipes your history, points, and streak for good.')) actions.resetAll(); }
    else if (action === 'enable-notif') actions.enableNotifications();
  });

  document.addEventListener('input', (e) => {
    const field = e.target.dataset && e.target.dataset.field;
    if (field) actions.setField(field, e.target.value);
  });
}
