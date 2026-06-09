// js/core/router.js - SPA Router
import { emit, Events } from './events.js';

const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path, params = {}) {
  currentRoute = { path, params };
  const handler = routes[path];
  if (handler) {
    handler(params);
    emit(Events.NAVIGATE, { path, params });
  } else {
    console.warn(`No route for: ${path}`);
  }
}

export function getCurrentRoute() {
  return currentRoute;
}
