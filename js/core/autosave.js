// js/core/autosave.js - Debounced Autosave System
import { emit, Events } from './events.js';

const timers = {};

export function autosave(key, fn, delay = 500) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(async () => {
    try {
      await fn();
      showSaveIndicator();
    } catch (e) {
      console.error('Autosave failed:', e);
    }
  }, delay);
}

let saveIndicatorTimer;
function showSaveIndicator() {
  const el = document.getElementById('save-indicator');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(saveIndicatorTimer);
  saveIndicatorTimer = setTimeout(() => el.classList.remove('visible'), 1500);
}

export function cancelAutosave(key) {
  clearTimeout(timers[key]);
  delete timers[key];
}
