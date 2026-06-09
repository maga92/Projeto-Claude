// js/core/events.js - Internal Event System
const listeners = {};

export const Events = {
  // Navigation
  NAVIGATE: 'navigate',
  // Championships
  CHAMPIONSHIP_CREATED: 'championship:created',
  CHAMPIONSHIP_UPDATED: 'championship:updated',
  CHAMPIONSHIP_DELETED: 'championship:deleted',
  // Matches
  MATCH_CREATED: 'match:created',
  MATCH_UPDATED: 'match:updated',
  MATCH_DELETED: 'match:deleted',
  // Profile
  PROFILE_UPDATED: 'profile:updated',
  // Rankings
  RANKING_UPDATED: 'ranking:updated',
  // Search
  SEARCH_QUERY: 'search:query',
  // Data
  DATA_IMPORTED: 'data:imported',
  DATA_EXPORTED: 'data:exported',
  // UI
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  TOAST_SHOW: 'toast:show',
  AUTOSAVE: 'autosave',
};

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => off(event, callback);
}

export function off(event, callback) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => {
    try { cb(data); } catch (e) { console.error(`Event error [${event}]:`, e); }
  });
}

export function once(event, callback) {
  const wrapper = (data) => { callback(data); off(event, wrapper); };
  on(event, wrapper);
}
