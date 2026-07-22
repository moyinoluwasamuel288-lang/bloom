import { TASKS } from '../data/tasks.js';

export function renderTaskList(d) {
  return `
    <div class="b-section">
      <div class="b-section-title">❤️ a few small things for you today</div>
      ${TASKS.map(t => {
        const done = d.todaysTasks.includes(t.id);
        return `<div class="b-task" data-action="toggle-task" data-id="${t.id}" data-pts="${t.points}">
          <div class="b-task-check ${done ? 'done' : ''}">${done ? '✓' : ''}</div>
          <div class="b-task-icon">${t.icon}</div>
          <div class="b-task-label ${done ? 'done' : ''}">${t.label}</div>
          <div class="b-task-pts">+${t.points}</div>
        </div>`;
      }).join('')}
    </div>`;
}
