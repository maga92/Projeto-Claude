// js/services/championshipService.js
import { getAll, getById, getByIndex, put, remove, generateId } from '../../db/database.js';
import { emit, Events } from '../core/events.js';
import { STORES } from '../../db/schema.js';

export async function getChampionships() {
  return await getAll(STORES.championships);
}

export async function getChampionshipsByStatus(status) {
  const all = await getAll(STORES.championships);
  return all.filter(c => c.status === status);
}

export async function getChampionship(id) {
  return await getById(STORES.championships, id);
}

export async function createChampionship(data) {
  const championship = {
    id: generateId(),
    name: data.name || 'Novo Campeonato',
    season: data.season || new Date().getFullYear().toString(),
    status: data.status || 'upcoming',
    logoId: data.logoId || null,
    bannerId: data.bannerId || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await put(STORES.championships, championship);
  emit(Events.CHAMPIONSHIP_CREATED, championship);
  return championship;
}

export async function updateChampionship(id, updates) {
  const existing = await getById(STORES.championships, id);
  if (!existing) throw new Error('Championship not found');
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  await put(STORES.championships, updated);
  emit(Events.CHAMPIONSHIP_UPDATED, updated);
  return updated;
}

export async function deleteChampionship(id) {
  // Cascade delete phases, groups, matches
  const phases = await getByIndex(STORES.phases, 'championshipId', id);
  for (const phase of phases) {
    await deletePhase(phase.id);
  }
  const matches = await getByIndex(STORES.matches, 'championshipId', id);
  for (const match of matches) {
    await remove(STORES.matches, match.id);
  }
  await remove(STORES.championships, id);
  emit(Events.CHAMPIONSHIP_DELETED, { id });
}

// PHASES
export async function getPhases(championshipId) {
  const phases = await getByIndex(STORES.phases, 'championshipId', championshipId);
  return phases.sort((a, b) => a.order - b.order);
}

export async function createPhase(championshipId, data) {
  const existing = await getPhases(championshipId);
  const phase = {
    id: generateId(),
    championshipId,
    name: data.name || 'Nova Fase',
    order: data.order !== undefined ? data.order : existing.length,
    createdAt: Date.now(),
  };
  await put(STORES.phases, phase);
  return phase;
}

export async function updatePhase(id, updates) {
  const existing = await getById(STORES.phases, id);
  if (!existing) throw new Error('Phase not found');
  const updated = { ...existing, ...updates };
  await put(STORES.phases, updated);
  return updated;
}

export async function deletePhase(id) {
  const groups = await getByIndex(STORES.groups, 'phaseId', id);
  for (const group of groups) await remove(STORES.groups, group.id);
  const matches = await getByIndex(STORES.matches, 'phaseId', id);
  for (const match of matches) await remove(STORES.matches, match.id);
  await remove(STORES.phases, id);
}

// GROUPS
export async function getGroups(phaseId) {
  return await getByIndex(STORES.groups, 'phaseId', phaseId);
}

export async function createGroup(phaseId, data) {
  const group = {
    id: generateId(),
    phaseId,
    name: data.name || 'Grupo A',
    teams: data.teams || [],
    createdAt: Date.now(),
  };
  await put(STORES.groups, group);
  return group;
}

export async function updateGroup(id, updates) {
  const existing = await getById(STORES.groups, id);
  if (!existing) throw new Error('Group not found');
  const updated = { ...existing, ...updates };
  await put(STORES.groups, updated);
  return updated;
}

export async function deleteGroup(id) {
  const matches = await getByIndex(STORES.matches, 'groupId', id);
  for (const match of matches) await remove(STORES.matches, match.id);
  await remove(STORES.groups, id);
}
