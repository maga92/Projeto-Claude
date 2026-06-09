// js/services/matchService.js
import { getAll, getById, getByIndex, put, remove, generateId } from '../../db/database.js';
import { emit, Events } from '../core/events.js';
import { STORES } from '../../db/schema.js';

export async function getMatches(filters = {}) {
  let matches = await getAll(STORES.matches);
  if (filters.championshipId) matches = matches.filter(m => m.championshipId === filters.championshipId);
  if (filters.phaseId) matches = matches.filter(m => m.phaseId === filters.phaseId);
  if (filters.groupId) matches = matches.filter(m => m.groupId === filters.groupId);
  return matches.sort((a, b) => (b.date || 0) - (a.date || 0));
}

export async function getMatch(id) {
  return await getById(STORES.matches, id);
}

export async function createMatch(data) {
  const match = {
    id: generateId(),
    championshipId: data.championshipId || null,
    phaseId: data.phaseId || null,
    groupId: data.groupId || null,
    teamA: data.teamA || '',
    teamB: data.teamB || '',
    scoreA: data.scoreA !== undefined ? data.scoreA : null,
    scoreB: data.scoreB !== undefined ? data.scoreB : null,
    date: data.date || null,
    trackPerformance: data.trackPerformance || false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await put(STORES.matches, match);
  emit(Events.MATCH_CREATED, match);
  return match;
}

export async function updateMatch(id, updates) {
  const existing = await getById(STORES.matches, id);
  if (!existing) throw new Error('Match not found');
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  await put(STORES.matches, updated);
  emit(Events.MATCH_UPDATED, updated);
  return updated;
}

export async function deleteMatch(id) {
  // Also delete performance if linked
  const perfs = await getByIndex(STORES.playerMatchPerformance, 'matchId', id);
  for (const p of perfs) await remove(STORES.playerMatchPerformance, p.id);
  await remove(STORES.matches, id);
  emit(Events.MATCH_DELETED, { id });
}

// Performance
export async function savePerformance(matchId, data) {
  const existing = await getByIndex(STORES.playerMatchPerformance, 'matchId', matchId);
  const perf = {
    id: existing[0]?.id || generateId(),
    matchId,
    goals: data.goals || 0,
    assists: data.assists || 0,
    yellowCards: data.yellowCards || 0,
    redCards: data.redCards || 0,
    rating: data.rating || 0,
    date: data.date || Date.now(),
    championshipId: data.championshipId || null,
  };
  await put(STORES.playerMatchPerformance, perf);
  return perf;
}

export async function getPerformances() {
  return await getAll(STORES.playerMatchPerformance);
}

export async function deletePerformance(matchId) {
  const perfs = await getByIndex(STORES.playerMatchPerformance, 'matchId', matchId);
  for (const p of perfs) await remove(STORES.playerMatchPerformance, p.id);
}

export async function getPlayerStats() {
  const performances = await getPerformances();
  return {
    totalMatches: performances.length,
    totalGoals: performances.reduce((s, p) => s + (p.goals || 0), 0),
    totalAssists: performances.reduce((s, p) => s + (p.assists || 0), 0),
    totalYellowCards: performances.reduce((s, p) => s + (p.yellowCards || 0), 0),
    totalRedCards: performances.reduce((s, p) => s + (p.redCards || 0), 0),
    avgRating: performances.length
      ? (performances.reduce((s, p) => s + (p.rating || 0), 0) / performances.length).toFixed(1)
      : '0.0',
    performances,
  };
}
