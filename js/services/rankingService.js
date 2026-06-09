// js/services/rankingService.js
import { getAll, getById, put, remove, generateId } from '../../db/database.js';
import { emit, Events } from '../core/events.js';
import { STORES } from '../../db/schema.js';

const FIXED_RANKINGS = ['global', 'regional', 'players'];

export async function initRankings() {
  for (const id of FIXED_RANKINGS) {
    const existing = await getById(STORES.rankings, id);
    if (!existing) {
      await put(STORES.rankings, { id, items: [] });
    }
  }
}

export async function getRanking(id) {
  return await getById(STORES.rankings, id);
}

export async function updateRanking(id, items) {
  const ranking = await getRanking(id);
  if (!ranking) throw new Error('Ranking not found');
  const updated = { ...ranking, items, updatedAt: Date.now() };
  await put(STORES.rankings, updated);
  emit(Events.RANKING_UPDATED, updated);
  return updated;
}

export async function addRankingItem(rankingId, item) {
  const ranking = await getRanking(rankingId);
  const newItem = {
    id: generateId(),
    name: item.name || '',
    label: item.label || '',
    regionId: item.regionId || null,
    type: item.type || 'team',
  };
  const updated = [...(ranking?.items || []), newItem];
  return await updateRanking(rankingId, updated);
}

export async function removeRankingItem(rankingId, itemId) {
  const ranking = await getRanking(rankingId);
  const updated = (ranking?.items || []).filter(i => i.id !== itemId);
  return await updateRanking(rankingId, updated);
}

// Regions
export async function getRegions() {
  return await getAll(STORES.regions);
}

export async function createRegion(name) {
  const region = {
    id: generateId(),
    name,
    color: randomColor(),
    createdAt: Date.now(),
  };
  await put(STORES.regions, region);
  return region;
}

export async function deleteRegion(id) {
  await remove(STORES.regions, id);
}

function randomColor() {
  const colors = ['#e85d04','#3a86ff','#8338ec','#fb5607','#06d6a0','#ffbe0b','#ef233c','#4361ee'];
  return colors[Math.floor(Math.random() * colors.length)];
}
