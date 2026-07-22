import { loadState as loadPersisted, saveState as persistState } from '../services/storage.js';

export let state = loadPersisted();
export let ui = { showTheme: false, showSettings: false, showHistory: false };

let toastTimer = null;
export function showToast(msg) {
  clearTimeout(toastTimer);
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'b-toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.style.display = 'block';
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

export function saveState() {
  persistState(state, showToast);
}
