const LEVEL_XP_STEP = 100;

const BADGES = [
  { id: 'first-bloom', label: 'First Bloom', icon: '🌱', check: (s) => s.checkins >= 1 },
  { id: 'week-streak', label: '7-Day Streak', icon: '🔥', check: (s) => s.streak >= 7 },
  { id: 'consistent', label: 'Consistent Care', icon: '💧', check: (s) => s.checkins >= 20 },
  { id: 'level-5', label: 'Level 5', icon: '🌸', check: (s) => s.level >= 5 },
];

export class RewardEngine {
  constructor(store, eventBus) {
    this.store = store;
    this.eventBus = eventBus;
  }

  async getState() {
    const state = await this.store.get('garden', 'state');
    return state || { xp: 0, level: 1, streak: 0, checkins: 0, lastCheckinDate: null, badges: [] };
  }

  async grantXP(amount, reason = '') {
    try {
      const state = await this.getState();
      const today = new Date().toISOString().split('T')[0];
      const isNewCheckin = reason === 'checkin' && state.lastCheckinDate !== today;

      if (isNewCheckin) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        state.streak = state.lastCheckinDate === yStr ? state.streak + 1 : 1;
        state.checkins += 1;
        state.lastCheckinDate = today;
      }

      state.xp += amount;
      const prevLevel = state.level;
      state.level = 1 + Math.floor(state.xp / LEVEL_XP_STEP);

      const newBadges = BADGES.filter(b => !state.badges.includes(b.id) && b.check(state)).map(b => b.id);
      state.badges = [...state.badges, ...newBadges];

      await this.store.set('garden', 'state', state);

      if (state.level > prevLevel) {
        this.eventBus.emit('level-up', { level: state.level });
      }
      newBadges.forEach(id => {
        const badge = BADGES.find(b => b.id === id);
        this.eventBus.emit('badge-earned', badge);
      });

      return state;
    } catch (err) {
      // Reward failures should never block the primary action (saving a check-in, etc.)
      console.warn('RewardEngine: could not persist XP', err);
      return null;
    }
  }

  getBadgeDefinitions() {
    return BADGES;
  }
}
