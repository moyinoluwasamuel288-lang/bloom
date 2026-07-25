/**
 * Daily self-care tasks tied to the current cycle phase, so they feel
 * relevant rather than generic. Each task carries an offsetMinutes value —
 * how many minutes after the Today screen first loads today its reminder
 * should fire — spaced roughly five minutes apart so reminders trickle in
 * rather than arriving all at once.
 */
export class TaskEngine {
  static getTasksForPhase(phase) {
    const byPhase = {
      menstrual: [
        { id: 'rest', label: 'Rest for 10 minutes', description: 'Your body is shedding the uterine lining right now — a short rest can ease cramping.', xp: 10, offsetMinutes: 5 },
        { id: 'heat', label: 'Try a heat pack on your lower belly', description: 'Gentle heat relaxes the uterine muscle and often eases cramps.', xp: 10, offsetMinutes: 10 },
        { id: 'hydrate', label: 'Drink a warm glass of water', description: 'Staying warm and hydrated can help with bloating and fatigue.', xp: 5, offsetMinutes: 15 },
      ],
      follicular: [
        { id: 'move', label: 'Get moving for a few minutes', description: 'Energy tends to rise in this phase — a short walk can feel great right now.', xp: 10, offsetMinutes: 5 },
        { id: 'plan', label: 'Plan something you\u2019re looking forward to', description: 'This is often a good window for starting new things.', xp: 5, offsetMinutes: 10 },
        { id: 'protein', label: 'Add protein to your next meal', description: 'Supports the rebuilding your body is doing this week.', xp: 5, offsetMinutes: 15 },
      ],
      ovulatory: [
        { id: 'connect', label: 'Reach out to someone you care about', description: 'Sociability often peaks around ovulation — a good day to check in on a friend.', xp: 10, offsetMinutes: 5 },
        { id: 'stretch', label: 'Stretch for 5 minutes', description: 'A quick stretch can help you feel grounded today.', xp: 5, offsetMinutes: 10 },
        { id: 'water', label: 'Drink a glass of water', description: 'A simple, steady habit worth keeping up.', xp: 5, offsetMinutes: 15 },
      ],
      luteal: [
        { id: 'wind-down', label: 'Wind down a little earlier tonight', description: 'PMS symptoms can disrupt sleep — an earlier bedtime tonight may help.', xp: 10, offsetMinutes: 5 },
        { id: 'journal', label: 'Journal for 5 minutes', description: 'Getting thoughts out of your head can ease a busy mind before your period.', xp: 10, offsetMinutes: 10 },
        { id: 'snack', label: 'Reach for a magnesium-rich snack', description: 'Nuts, seeds, or dark chocolate may help ease PMS symptoms.', xp: 5, offsetMinutes: 15 },
      ],
    };

    return byPhase[phase] || [
      { id: 'checkin', label: 'Take a quiet moment for yourself', description: 'Even two minutes of stillness counts.', xp: 5, offsetMinutes: 5 },
      { id: 'water-generic', label: 'Drink a glass of water', description: 'A simple, steady habit worth keeping up.', xp: 5, offsetMinutes: 10 },
      { id: 'breathe', label: 'Take 5 slow, deep breaths', description: 'A quick reset for your nervous system.', xp: 5, offsetMinutes: 15 },
    ];
  }
}
