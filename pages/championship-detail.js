// pages/championship-detail.js
import {
  getChampionship, updateChampionship,
  getPhases, createPhase, updatePhase, deletePhase,
  getGroups, createGroup, updateGroup, deleteGroup
} from '../js/services/championshipService.js';
import { getMatches, createMatch, updateMatch, deleteMatch, savePerformance, deletePerformance } from '../js/services/matchService.js';
import { getTeams, createTeam } from '../js/services/profileService.js';
import { saveMedia, getMediaUrl } from '../js/services/mediaService.js';
import { autosave } from '../js/core/autosave.js';
import { openModal } from '../js/ui/modal.js';
import { showToast } from '../js/ui/toast.js';
import { navigate } from '../js/core/router.js';

export async function renderChampionshipDetail(container, { id }) {
  if (!id) { navigate('championships'); return; }
  container.innerHTML = `<div class="page-loader">Carregando...</div>`;

  const champ = await getChampionship(id);
  if (!champ) { navigate('championships'); return; }

  const [phases, teams] = await Promise.all([getPhases(id), getTeams()]);
  const logoUrl = champ.logoId ? await getMediaUrl(champ.logoId) : null;
  const bannerUrl = champ.bannerId ? await getMediaUrl(champ.bannerId) : null;

  container.innerHTML = `
    <div class="page champ-detail-page">
      <div class="champ-banner" id="champ-banner" style="${bannerUrl ? `background-image:url(${bannerUrl})` : ''}">
        <div class="champ-banner__overlay">
          <button class="btn btn--ghost btn--xs back-btn">← Voltar</button>
          <label class="media-upload-btn" title="Trocar banner">
            📷 Banner
            <input type="file" accept="image/*" id="banner-upload" hidden>
          </label>
        </div>
      </div>

      <div class="champ-detail-header">
        <div class="champ-logo-wrap">
          <div class="champ-logo" id="champ-logo">
            ${logoUrl ? `<img src="${logoUrl}" alt="logo">` : `<span>${champ.name[0]?.toUpperCase()}</span>`}
          </div>
          <label class="media-upload-btn media-upload-btn--sm" title="Trocar logo">
            📷
            <input type="file" accept="image/*" id="logo-upload" hidden>
          </label>
        </div>
        <div class="champ-detail-meta">
          <h1 class="champ-detail-name" contenteditable="true" id="champ-name-edit">${champ.name}</h1>
          <div class="champ-detail-sub">
            <input class="inline-input" id="champ-season-edit" value="${champ.season || ''}" placeholder="Temporada">
            <select class="inline-select" id="champ-status-edit">
              <option value="upcoming" ${champ.status==='upcoming'?'selected':''}>Futuro</option>
              <option value="active" ${champ.status==='active'?'selected':''}>Em Andamento</option>
              <option value="finished" ${champ.status==='finished'?'selected':''}>Finalizado</option>
            </select>
          </div>
        </div>
      </div>

      <div class="champ-phases" id="phases-container">
        <div class="phases-header">
          <h2 class="section-title">Fases</h2>
          <button class="btn btn--primary btn--sm" id="btn-add-phase">+ Fase</button>
        </div>
        <div id="phases-list"></div>
      </div>
    </div>
  `;

  // Media uploads
  container.querySelector('#banner-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const media = await saveMedia(file);
    await updateChampionship(id, { bannerId: media.id });
    container.querySelector('#champ-banner').style.backgroundImage = `url(${media.data})`;
    showToast('Banner atualizado!', 'success');
  });

  container.querySelector('#logo-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const media = await saveMedia(file);
    await updateChampionship(id, { logoId: media.id });
    container.querySelector('#champ-logo').innerHTML = `<img src="${media.data}" alt="logo">`;
    showToast('Logo atualizado!', 'success');
  });

  // Inline editing
  const nameEl = container.querySelector('#champ-name-edit');
  nameEl.addEventListener('input', () => autosave('champ-name-' + id, () =>
    updateChampionship(id, { name: nameEl.textContent.trim() })));

  container.querySelector('#champ-season-edit').addEventListener('input', (e) =>
    autosave('champ-season-' + id, () => updateChampionship(id, { season: e.target.value })));

  container.querySelector('#champ-status-edit').addEventListener('change', (e) =>
    updateChampionship(id, { status: e.target.value }).then(() => showToast('Status atualizado', 'success')));

  container.querySelector('.back-btn').addEventListener('click', () => navigate('championships'));

  // Phases
  async function renderPhases() {
    const phasesList = container.querySelector('#phases-list');
    const currentPhases = await getPhases(id);
    phasesList.innerHTML = '';

    for (const phase of currentPhases) {
      const phaseEl = await renderPhase(phase, teams, id);
      phasesList.appendChild(phaseEl);
    }
  }

  container.querySelector('#btn-add-phase').addEventListener('click', async () => {
    const name = prompt('Nome da fase:');
    if (!name) return;
    await createPhase(id, { name });
    await renderPhases();
    showToast('Fase criada!', 'success');
  });

  await renderPhases();
}

async function renderPhase(phase, teams, champId) {
  const [groups, matches] = await Promise.all([
    getGroups(phase.id),
    getMatches({ phaseId: phase.id, championshipId: champId })
  ]);
  const directMatches = matches.filter(m => !m.groupId);

  const el = document.createElement('div');
  el.className = 'phase-block';
  el.dataset.phaseId = phase.id;

  el.innerHTML = `
    <div class="phase-header">
      <span class="phase-name" contenteditable="true">${phase.name}</span>
      <div class="phase-actions">
        <button class="btn btn--ghost btn--xs btn-add-group" data-phase="${phase.id}">+ Grupo</button>
        <button class="btn btn--ghost btn--xs btn-add-match" data-phase="${phase.id}">+ Partida</button>
        <button class="btn btn--danger btn--xs btn-del-phase" data-phase="${phase.id}">✕</button>
      </div>
    </div>
    <div class="phase-groups" id="groups-${phase.id}">
      ${groups.map(g => renderGroupHTML(g, matches.filter(m => m.groupId === g.id), teams)).join('')}
    </div>
    <div class="phase-direct-matches" id="direct-matches-${phase.id}">
      ${directMatches.map(m => renderMatchRowHTML(m)).join('')}
    </div>
  `;

  const nameEl = el.querySelector('.phase-name');
  nameEl.addEventListener('input', () => autosave('phase-' + phase.id, () =>
    updatePhase(phase.id, { name: nameEl.textContent.trim() })));

  el.querySelector('.btn-add-group').addEventListener('click', async () => {
    const name = prompt('Nome do grupo:');
    if (!name) return;
    await createGroup(phase.id, { name });
    // Refresh phase
    const parent = el.parentElement;
    const newEl = await renderPhase(phase, teams, champId);
    parent.replaceChild(newEl, el);
  });

  el.querySelector('.btn-add-match').addEventListener('click', () => openMatchModal(phase.id, null, champId, async () => {
    const parent = el.parentElement;
    const newEl = await renderPhase(phase, teams, champId);
    parent.replaceChild(newEl, el);
  }));

  el.querySelector('.btn-del-phase').addEventListener('click', async () => {
    if (!confirm('Excluir esta fase e todos os jogos?')) return;
    await deletePhase(phase.id);
    el.remove();
    showToast('Fase excluída', 'info');
  });

  // Group add match buttons
  el.querySelectorAll('.btn-group-add-match').forEach(btn => {
    btn.addEventListener('click', () => openMatchModal(phase.id, btn.dataset.group, champId, async () => {
      const parent = el.parentElement;
      const newEl = await renderPhase(phase, teams, champId);
      parent.replaceChild(newEl, el);
    }));
  });

  // Delete group
  el.querySelectorAll('.btn-del-group').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este grupo?')) return;
      await deleteGroup(btn.dataset.group);
      const parent = el.parentElement;
      const newEl = await renderPhase(phase, teams, champId);
      parent.replaceChild(newEl, el);
    });
  });

  // Edit match
  el.querySelectorAll('.match-row').forEach(row => {
    row.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-del-match')) return;
      openEditMatchModal(row.dataset.matchId, champId, async () => {
        const parent = el.parentElement;
        const newEl = await renderPhase(phase, teams, champId);
        parent.replaceChild(newEl, el);
      });
    });
  });

  // Delete match
  el.querySelectorAll('.btn-del-match').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteMatch(btn.dataset.match);
      btn.closest('.match-row').remove();
    });
  });

  return el;
}

function renderGroupHTML(group, matches, teams) {
  return `
    <div class="group-block" data-group-id="${group.id}">
      <div class="group-header">
        <span class="group-name">${group.name}</span>
        <div class="group-actions">
          <button class="btn btn--ghost btn--xs btn-group-add-match" data-group="${group.id}">+ Partida</button>
          <button class="btn btn--danger btn--xs btn-del-group" data-group="${group.id}">✕</button>
        </div>
      </div>
      <div class="group-matches">
        ${matches.length === 0 ? '<p class="no-matches">Sem partidas</p>' : matches.map(m => renderMatchRowHTML(m)).join('')}
      </div>
    </div>
  `;
}

function renderMatchRowHTML(match) {
  const score = match.scoreA !== null ? `${match.scoreA} – ${match.scoreB}` : 'vs';
  const date = match.date ? new Date(match.date).toLocaleDateString('pt-BR') : '';
  const perfBadge = match.trackPerformance ? '<span class="perf-indicator" title="Desempenho registrado">⭐</span>' : '';
  return `
    <div class="match-row" data-match-id="${match.id}">
      <span class="match-team">${match.teamA || '–'}</span>
      <span class="match-score">${score}</span>
      <span class="match-team match-team--right">${match.teamB || '–'}</span>
      <div class="match-meta">${date} ${perfBadge}</div>
      <button class="btn btn--danger btn--xs btn-del-match" data-match="${match.id}">✕</button>
    </div>
  `;
}

function openMatchModal(phaseId, groupId, champId, onSave) {
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Time A *</label>
        <input class="form-input" id="m-teamA" placeholder="Nome do time">
      </div>
      <div class="form-group">
        <label class="form-label">Time B *</label>
        <input class="form-input" id="m-teamB" placeholder="Nome do time">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Gols A</label>
        <input class="form-input" id="m-scoreA" type="number" min="0" placeholder="–">
      </div>
      <div class="form-group">
        <label class="form-label">Gols B</label>
        <input class="form-input" id="m-scoreB" type="number" min="0" placeholder="–">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Data</label>
      <input class="form-input" id="m-date" type="date">
    </div>
    <div class="form-group">
      <label class="toggle-label">
        <input type="checkbox" id="m-track"> Registrar meu desempenho
      </label>
    </div>
    <div id="perf-fields" class="perf-fields perf-fields--hidden">
      <div class="form-row">
        <div class="form-group"><label class="form-label">⚽ Gols</label><input class="form-input" id="p-goals" type="number" min="0" value="0"></div>
        <div class="form-group"><label class="form-label">🅰️ Assists.</label><input class="form-input" id="p-assists" type="number" min="0" value="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">🟨 Amarelos</label><input class="form-input" id="p-yellow" type="number" min="0" value="0"></div>
        <div class="form-group"><label class="form-label">🟥 Vermelhos</label><input class="form-input" id="p-red" type="number" min="0" value="0"></div>
        <div class="form-group"><label class="form-label">⭐ Nota (0-10)</label><input class="form-input" id="p-rating" type="number" min="0" max="10" step="0.5" value="7"></div>
      </div>
    </div>
  `;

  form.querySelector('#m-track').addEventListener('change', (e) => {
    form.querySelector('#perf-fields').classList.toggle('perf-fields--hidden', !e.target.checked);
  });

  openModal({
    title: 'Nova Partida',
    content: form,
    size: 'lg',
    actions: [
      { id: 'cancel', label: 'Cancelar', variant: 'ghost' },
      { id: 'save', label: 'Salvar', variant: 'primary', closes: false, handler: async () => {
        const teamA = form.querySelector('#m-teamA').value.trim();
        const teamB = form.querySelector('#m-teamB').value.trim();
        if (!teamA || !teamB) { showToast('Times obrigatórios', 'error'); return; }
        const scoreAVal = form.querySelector('#m-scoreA').value;
        const scoreBVal = form.querySelector('#m-scoreB').value;
        const track = form.querySelector('#m-track').checked;
        const dateVal = form.querySelector('#m-date').value;

        const match = await createMatch({
          phaseId, groupId: groupId || null, championshipId: champId,
          teamA, teamB,
          scoreA: scoreAVal !== '' ? parseInt(scoreAVal) : null,
          scoreB: scoreBVal !== '' ? parseInt(scoreBVal) : null,
          date: dateVal ? new Date(dateVal).getTime() : null,
          trackPerformance: track,
        });

        if (track) {
          await savePerformance(match.id, {
            goals: parseInt(form.querySelector('#p-goals').value) || 0,
            assists: parseInt(form.querySelector('#p-assists').value) || 0,
            yellowCards: parseInt(form.querySelector('#p-yellow').value) || 0,
            redCards: parseInt(form.querySelector('#p-red').value) || 0,
            rating: parseFloat(form.querySelector('#p-rating').value) || 0,
            date: dateVal ? new Date(dateVal).getTime() : Date.now(),
            championshipId: champId,
          });
        }

        document.querySelector('.modal-overlay')?.remove();
        showToast('Partida criada!', 'success');
        if (onSave) await onSave();
      }},
    ]
  });
}

async function openEditMatchModal(matchId, champId, onSave) {
  const match = await import('../js/services/matchService.js').then(m => m.getMatch(matchId));
  if (!match) return;

  const { getByIndex } = await import('../db/database.js');
  const { STORES } = await import('../db/schema.js');
  const perfs = await getByIndex(STORES.playerMatchPerformance, 'matchId', matchId);
  const perf = perfs[0] || null;

  const form = document.createElement('div');
  const dateStr = match.date ? new Date(match.date).toISOString().split('T')[0] : '';
  form.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Time A</label>
        <input class="form-input" id="m-teamA" value="${match.teamA || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Time B</label>
        <input class="form-input" id="m-teamB" value="${match.teamB || ''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Gols A</label>
        <input class="form-input" id="m-scoreA" type="number" value="${match.scoreA ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Gols B</label>
        <input class="form-input" id="m-scoreB" type="number" value="${match.scoreB ?? ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Data</label>
      <input class="form-input" id="m-date" type="date" value="${dateStr}">
    </div>
    <div class="form-group">
      <label class="toggle-label">
        <input type="checkbox" id="m-track" ${match.trackPerformance ? 'checked' : ''}> Registrar meu desempenho
      </label>
    </div>
    <div id="perf-fields" class="perf-fields ${match.trackPerformance ? '' : 'perf-fields--hidden'}">
      <div class="form-row">
        <div class="form-group"><label class="form-label">⚽ Gols</label><input class="form-input" id="p-goals" type="number" value="${perf?.goals ?? 0}"></div>
        <div class="form-group"><label class="form-label">🅰️ Assists.</label><input class="form-input" id="p-assists" type="number" value="${perf?.assists ?? 0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">🟨 Amarelos</label><input class="form-input" id="p-yellow" type="number" value="${perf?.yellowCards ?? 0}"></div>
        <div class="form-group"><label class="form-label">🟥 Vermelhos</label><input class="form-input" id="p-red" type="number" value="${perf?.redCards ?? 0}"></div>
        <div class="form-group"><label class="form-label">⭐ Nota</label><input class="form-input" id="p-rating" type="number" step="0.5" value="${perf?.rating ?? 7}"></div>
      </div>
    </div>
  `;

  form.querySelector('#m-track').addEventListener('change', (e) => {
    form.querySelector('#perf-fields').classList.toggle('perf-fields--hidden', !e.target.checked);
  });

  openModal({
    title: 'Editar Partida',
    content: form,
    size: 'lg',
    actions: [
      { id: 'cancel', label: 'Cancelar', variant: 'ghost' },
      { id: 'save', label: 'Salvar', variant: 'primary', closes: false, handler: async () => {
        const scoreAVal = form.querySelector('#m-scoreA').value;
        const scoreBVal = form.querySelector('#m-scoreB').value;
        const track = form.querySelector('#m-track').checked;
        const dateVal = form.querySelector('#m-date').value;

        await updateMatch(matchId, {
          teamA: form.querySelector('#m-teamA').value.trim(),
          teamB: form.querySelector('#m-teamB').value.trim(),
          scoreA: scoreAVal !== '' ? parseInt(scoreAVal) : null,
          scoreB: scoreBVal !== '' ? parseInt(scoreBVal) : null,
          date: dateVal ? new Date(dateVal).getTime() : null,
          trackPerformance: track,
        });

        if (track) {
          await savePerformance(matchId, {
            goals: parseInt(form.querySelector('#p-goals').value) || 0,
            assists: parseInt(form.querySelector('#p-assists').value) || 0,
            yellowCards: parseInt(form.querySelector('#p-yellow').value) || 0,
            redCards: parseInt(form.querySelector('#p-red').value) || 0,
            rating: parseFloat(form.querySelector('#p-rating').value) || 0,
            date: dateVal ? new Date(dateVal).getTime() : Date.now(),
            championshipId: champId,
          });
        } else {
          await deletePerformance(matchId);
        }

        document.querySelector('.modal-overlay')?.remove();
        showToast('Partida atualizada!', 'success');
        if (onSave) await onSave();
      }},
    ]
  });
}
