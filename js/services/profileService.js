// js/services/profileService.js
import { getAll, getById, put, remove, generateId } from '../../db/database.js';
import { emit, Events } from '../core/events.js';
import { STORES } from '../../db/schema.js';

const PROFILE_ID = 'main_profile';

export async function getProfile() {
  return await getById(STORES.playerProfile, PROFILE_ID);
}

export async function saveProfile(data) {
  const existing = await getProfile();
  const profile = {
    ...existing,
    ...data,
    id: PROFILE_ID,
    updatedAt: Date.now(),
  };
  await put(STORES.playerProfile, profile);
  emit(Events.PROFILE_UPDATED, profile);
  return profile;
}

export async function initProfile() {
  const existing = await getProfile();
  if (!existing) {
    await saveProfile({
      name: '',
      nickname: '',
      birthDate: null,
      height: '',
      weight: '',
      position: '',
      currentTeam: '',
      photoId: null,
    });
  }
}

// Achievements
export async function getAchievements() {
  return await getAll(STORES.achievements);
}

export async function createAchievement(data) {
  const ach = {
    id: generateId(),
    type: data.type || 'title',
    title: data.title || '',
    description: data.description || '',
    year: data.year || new Date().getFullYear(),
    createdAt: Date.now(),
  };
  await put(STORES.achievements, ach);
  return ach;
}

export async function deleteAchievement(id) {
  await remove(STORES.achievements, id);
}

// Teams
export async function getTeams() {
  return await getAll(STORES.teams);
}

export async function getTeam(id) {
  return await getById(STORES.teams, id);
}

export async function createTeam(data) {
  const team = {
    id: generateId(),
    name: data.name || 'Novo Time',
    regionId: data.regionId || null,
    logoId: data.logoId || null,
    createdAt: Date.now(),
  };
  await put(STORES.teams, team);
  return team;
}

export async function updateTeam(id, updates) {
  const existing = await getById(STORES.teams, id);
  if (!existing) throw new Error('Team not found');
  const updated = { ...existing, ...updates };
  await put(STORES.teams, updated);
  return updated;
}

export async function deleteTeam(id) {
  await remove(STORES.teams, id);
}
