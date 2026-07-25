# Bloom — Cycle Companion

A privacy-first, offline-capable period tracker PWA. All data stays in IndexedDB on-device; nothing is sent to a server.

## Structure

```
index.html              Shell: nav, mount points for modal/toast/confirm/welcome
manifest.json            PWA manifest
sw.js                     Service worker (offline cache + notification click handling)
icons/                    App icons (placeholders — swap for real artwork)
src/
  app.js                  Bootstrap: routing, event bus, error/offline handling, reminder scheduling
  core/
    CycleEngine.js         Cycle length averaging, phase detection, predictions, multi-cycle projection
    CalendarEngine.js       Classifies each calendar day (logged / predicted period, fertile, ovulation)
    TaskEngine.js            Phase-aware daily self-care tasks with reminder timing
    Storage.js               IndexedDB wrapper (cycles, dailyLogs, settings, garden)
    RewardEngine.js           XP, levels, streaks, badges
    NotificationManager.js     Daily + task reminders via the Notification API, with in-app fallback
    SafeStorage.js              Guards every localStorage read/write so a blocked storage context can't crash a screen
  views/
    TodayView.js, CalendarView.js, InsightsView.js, GardenView.js, SettingsView.js
  components/
    CheckInModal.js, Toast.js, ConfirmDialog.js, WelcomeGate.js
  styles/
    tokens.css, themes.css, base.css, animations.css
```

## Known gaps from the current build

- **Onboarding screen** isn't included in this drop — the nav wires up Today / Calendar / Insights / Garden / Settings. If you have onboarding code from an earlier session, send it and I'll fold it in the same way.
- **Icons are placeholders** (a generated "B" mark) — replace `icons/icon-192.png` and `icons/icon-512.png` with real artwork before shipping.
- **Reminders (both the daily check-in reminder and the automatic per-task reminders) only fire while a tab is open.** They're scheduled with in-page timers, so closing the tab or browser stops them. True background delivery on a schedule needs a push server or the (still-limited) Periodic Background Sync API — flagging this so it's not mistaken for guaranteed background alarms, especially on iOS Safari where PWA notification support is restricted. When notifications aren't granted or supported, reminders still show as an in-app toast instead, so nothing silently fails.
- **Calendar predictions beyond the next cycle or two get less reliable** the further out they are — they're a straight repeat of your average cycle length, not a refit model. The "safe period" label reflects lower estimated pregnancy chance based on your logged data, not a guarantee — a disclaimer is shown on the calendar screen itself.

## Deploying

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages) since there's no backend:

```bash
# GitHub Pages
git init
git add .
git commit -m "Bloom v2"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
# then enable Pages on the repo, serving from main /root
```

Serve over HTTPS (or localhost) — the service worker and Notification API both require a secure context.
