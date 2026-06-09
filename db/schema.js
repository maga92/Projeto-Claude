// db/schema.js - IndexedDB Schema Definition
export const DB_NAME = 'MajorLeagueLive';
export const DB_VERSION = 1;

export const STORES = {
  championships: 'championships',
  phases: 'phases',
  groups: 'groups',
  teams: 'teams',
  matches: 'matches',
  players: 'players',
  playerProfile: 'playerProfile',
  playerMatchPerformance: 'playerMatchPerformance',
  rankings: 'rankings',
  regions: 'regions',
  achievements: 'achievements',
  media: 'media',
  settings: 'settings',
};

export function upgradeDB(db) {
  // Championships
  if (!db.objectStoreNames.contains(STORES.championships)) {
    const store = db.createObjectStore(STORES.championships, { keyPath: 'id' });
    store.createIndex('status', 'status', { unique: false });
    store.createIndex('season', 'season', { unique: false });
  }
  // Phases
  if (!db.objectStoreNames.contains(STORES.phases)) {
    const store = db.createObjectStore(STORES.phases, { keyPath: 'id' });
    store.createIndex('championshipId', 'championshipId', { unique: false });
    store.createIndex('order', 'order', { unique: false });
  }
  // Groups
  if (!db.objectStoreNames.contains(STORES.groups)) {
    const store = db.createObjectStore(STORES.groups, { keyPath: 'id' });
    store.createIndex('phaseId', 'phaseId', { unique: false });
  }
  // Teams
  if (!db.objectStoreNames.contains(STORES.teams)) {
    const store = db.createObjectStore(STORES.teams, { keyPath: 'id' });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('regionId', 'regionId', { unique: false });
  }
  // Matches
  if (!db.objectStoreNames.contains(STORES.matches)) {
    const store = db.createObjectStore(STORES.matches, { keyPath: 'id' });
    store.createIndex('phaseId', 'phaseId', { unique: false });
    store.createIndex('groupId', 'groupId', { unique: false });
    store.createIndex('championshipId', 'championshipId', { unique: false });
    store.createIndex('date', 'date', { unique: false });
  }
  // Players
  if (!db.objectStoreNames.contains(STORES.players)) {
    const store = db.createObjectStore(STORES.players, { keyPath: 'id' });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('teamId', 'teamId', { unique: false });
  }
  // Player Profile (single record)
  if (!db.objectStoreNames.contains(STORES.playerProfile)) {
    db.createObjectStore(STORES.playerProfile, { keyPath: 'id' });
  }
  // Player Match Performance
  if (!db.objectStoreNames.contains(STORES.playerMatchPerformance)) {
    const store = db.createObjectStore(STORES.playerMatchPerformance, { keyPath: 'id' });
    store.createIndex('matchId', 'matchId', { unique: false });
    store.createIndex('date', 'date', { unique: false });
  }
  // Rankings
  if (!db.objectStoreNames.contains(STORES.rankings)) {
    db.createObjectStore(STORES.rankings, { keyPath: 'id' });
  }
  // Regions
  if (!db.objectStoreNames.contains(STORES.regions)) {
    db.createObjectStore(STORES.regions, { keyPath: 'id' });
  }
  // Achievements
  if (!db.objectStoreNames.contains(STORES.achievements)) {
    const store = db.createObjectStore(STORES.achievements, { keyPath: 'id' });
    store.createIndex('type', 'type', { unique: false });
  }
  // Media
  if (!db.objectStoreNames.contains(STORES.media)) {
    db.createObjectStore(STORES.media, { keyPath: 'id' });
  }
  // Settings
  if (!db.objectStoreNames.contains(STORES.settings)) {
    db.createObjectStore(STORES.settings, { keyPath: 'key' });
  }
}
