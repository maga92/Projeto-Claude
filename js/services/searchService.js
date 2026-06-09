// js/services/searchService.js - Global Search (HLTV Style)
import { getAll } from '../../db/database.js';
import { STORES } from '../../db/schema.js';

export async function globalSearch(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  // Championships
  const championships = await getAll(STORES.championships);
  championships.filter(c => c.name?.toLowerCase().includes(q)).forEach(c => {
    results.push({ type: 'championship', id: c.id, title: c.name, subtitle: `Campeonato · ${c.season || ''}`, data: c });
  });

  // Teams
  const teams = await getAll(STORES.teams);
  teams.filter(t => t.name?.toLowerCase().includes(q)).forEach(t => {
    results.push({ type: 'team', id: t.id, title: t.name, subtitle: 'Time', data: t });
  });

  // Matches
  const matches = await getAll(STORES.matches);
  matches.filter(m => 
    m.teamA?.toLowerCase().includes(q) || 
    m.teamB?.toLowerCase().includes(q)
  ).slice(0, 8).forEach(m => {
    const score = m.scoreA !== null ? `${m.scoreA}–${m.scoreB}` : 'vs';
    results.push({ type: 'match', id: m.id, title: `${m.teamA} ${score} ${m.teamB}`, subtitle: 'Partida', data: m });
  });

  // Achievements
  const achievements = await getAll(STORES.achievements);
  achievements.filter(a => a.title?.toLowerCase().includes(q)).forEach(a => {
    results.push({ type: 'achievement', id: a.id, title: a.title, subtitle: `Conquista · ${a.year || ''}`, data: a });
  });

  // Rankings
  const rankings = await getAll(STORES.rankings);
  for (const r of rankings) {
    (r.items || []).filter(i => i.name?.toLowerCase().includes(q)).forEach(i => {
      results.push({ type: 'ranking', id: i.id, title: i.name, subtitle: `Ranking ${r.id}`, data: i });
    });
  }

  return results.slice(0, 20);
}
