// pages/profile.js
import { getProfile, saveProfile, getAchievements, createAchievement, deleteAchievement } from '../js/services/profileService.js';
import { getPlayerStats } from '../js/services/matchService.js';
import { saveMedia, getMediaUrl } from '../js/services/mediaService.js';
import { autosave } from '../js/core/autosave.js';
import { showToast } from '../js/ui/toast.js';
import { openModal } from '../js/ui/modal.js';

export async function renderProfile(container) {
  container.innerHTML = `<div class="page-loader">Carregando...</div>`;

  const [profile, stats, achievements] = await Promise.all([
    getProfile(),
    getPlayerStats(),
    getAchievements(),
  ]);

  const photoUrl = profile?.photoId ? await getMediaUrl(profile.photoId) : null;
  const age = profile?.birthDate ? calcAge(profile.birthDate) : null;

  const recentPerfs = (stats.performances || [])
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 10);

  const chartData = [...recentPerfs].reverse();

  container.innerHTML = `
    <div class="page profile-page">
      <div class="profile-header">
        <div class="profile-photo-wrap">
          <div class="profile-photo" id="profile-photo">
            ${photoUrl
              ? `<img src="${photoUrl}" alt="foto">`
              : `<span class="profile-photo__placeholder">${getInitials(profile?.name || 'EU')}</span>`
            }
          </div>
          <label class="photo-upload-btn" title="Trocar foto">
            📷
            <input type="file" accept="image/*" id="photo-upload" hidden>
          </label>
        </div>
        <div class="profile-meta">
          <div class="form-group">
            <input class="profile-name-input" id="p-name" value="${profile?.name || ''}" placeholder="Seu nome">
          </div>
          <div class="form-group">
            <input class="profile-nickname-input" id="p-nickname" value="${profile?.nickname || ''}" placeholder="Apelido">
          </div>
        </div>
      </div>

      <div class="profile-details-grid">
        <div class="form-group">
          <label class="form-label">Data de Nascimento</label>
          <input class="form-input" id="p-birthdate" type="date" value="${profile?.birthDate || ''}">
          ${age ? `<span class="form-hint">${age} anos</span>` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Altura (cm)</label>
          <input class="form-input" id="p-height" type="number" value="${profile?.height || ''}" placeholder="175">
        </div>
        <div class="form-group">
          <label class="form-label">Peso (kg)</label>
          <input class="form-input" id="p-weight" type="number" value="${profile?.weight || ''}" placeholder="70">
        </div>
        <div class="form-group">
          <label class="form-label">Posição</label>
          <select class="form-select" id="p-position">
            ${['','Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Centroavante'].map(p =>
              `<option ${profile?.position === p ? 'selected' : ''} value="${p}">${p || 'Selecione...'}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Time Atual</label>
          <input class="form-input" id="p-team" value="${profile?.currentTeam || ''}" placeholder="Nome do time">
        </div>
      </div>

      <section class="profile-section">
        <h2 class="section-title">Estatísticas Pessoais</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-card__value">${stats.totalMatches}</span>
            <span class="stat-card__label">Partidas</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${stats.totalGoals}</span>
            <span class="stat-card__label">Gols</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${stats.totalAssists}</span>
            <span class="stat-card__label">Assistências</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${stats.totalYellowCards}</span>
            <span class="stat-card__label">🟨</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${stats.totalRedCards}</span>
            <span class="stat-card__label">🟥</span>
          </div>
          <div class="stat-card stat-card--accent">
            <span class="stat-card__value">${stats.avgRating}</span>
            <span class="stat-card__label">Nota Média</span>
          </div>
        </div>
      </section>

      ${chartData.length >= 2 ? `
      <section class="profile-section">
        <h2 class="section-title">Evolução</h2>
        <div class="chart-wrap" id="perf-chart">
          <canvas id="perf-canvas" width="600" height="200"></canvas>
          <div class="chart-legend">
            <span class="legend-item legend-item--goals">⚽ Gols</span>
            <span class="legend-item legend-item--assists">🅰️ Assists</span>
            <span class="legend-item legend-item--rating">⭐ Nota</span>
          </div>
        </div>
      </section>
      ` : ''}

      <section class="profile-section">
        <div class="section-header">
          <h2 class="section-title">Conquistas</h2>
          <button class="btn btn--primary btn--sm" id="btn-add-achievement">+ Conquista</button>
        </div>
        <div id="achievements-list" class="achievements-list">
          ${renderAchievementsList(achievements)}
        </div>
      </section>

      <section class="profile-section">
        <h2 class="section-title">Últimas Partidas (com desempenho)</h2>
        <div class="match-history">
          ${recentPerfs.length === 0
            ? '<div class="empty-state"><p>Nenhuma partida com desempenho registrado</p></div>'
            : recentPerfs.map(p => perfRow(p)).join('')
          }
        </div>
      </section>
    </div>
  `;

  // Photo upload
  container.querySelector('#photo-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const media = await saveMedia(file);
    await saveProfile({ photoId: media.id });
    container.querySelector('#profile-photo').innerHTML = `<img src="${media.data}" alt="foto">`;
    showToast('Foto atualizada!', 'success');
  });

  // Autosave fields
  const fields = ['name', 'nickname', 'birthdate', 'height', 'weight', 'position', 'team'];
  function saveAll() {
    return saveProfile({
      name: container.querySelector('#p-name').value,
      nickname: container.querySelector('#p-nickname').value,
      birthDate: container.querySelector('#p-birthdate').value,
      height: container.querySelector('#p-height').value,
      weight: container.querySelector('#p-weight').value,
      position: container.querySelector('#p-position').value,
      currentTeam: container.querySelector('#p-team').value,
    });
  }

  ['#p-name','#p-nickname','#p-birthdate','#p-height','#p-weight','#p-team'].forEach(sel => {
    container.querySelector(sel)?.addEventListener('input', () => autosave('profile', saveAll));
  });
  container.querySelector('#p-position')?.addEventListener('change', () => autosave('profile', saveAll));

  // Achievements
  container.querySelector('#btn-add-achievement').addEventListener('click', () => openAchievementModal(container));

  container.querySelector('#achievements-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-del-achievement');
    if (!btn) return;
    if (!confirm('Excluir conquista?')) return;
    await deleteAchievement(btn.dataset.id);
    const updated = await getAchievements();
    container.querySelector('#achievements-list').innerHTML = renderAchievementsList(updated);
  });

  // Chart
  if (chartData.length >= 2) {
    setTimeout(() => drawChart(chartData), 100);
  }
}

function renderAchievementsList(achievements) {
  if (!achievements.length) return '<div class="empty-state"><p>Nenhuma conquista ainda</p></div>';
  const titles = achievements.filter(a => a.type === 'title');
  const awards = achievements.filter(a => a.type === 'award');
  let html = '';
  if (titles.length) {
    html += `<div class="ach-group"><h3 class="ach-group-title">🏆 Títulos</h3><div class="ach-cards">${titles.map(achCard).join('')}</div></div>`;
  }
  if (awards.length) {
    html += `<div class="ach-group"><h3 class="ach-group-title">🥇 Awards</h3><div class="ach-cards">${awards.map(achCard).join('')}</div></div>`;
  }
  return html;
}

function achCard(a) {
  return `
    <div class="ach-card">
      <div class="ach-card__body">
        <span class="ach-card__title">${a.title}</span>
        ${a.description ? `<span class="ach-card__desc">${a.description}</span>` : ''}
        <span class="ach-card__year">${a.year}</span>
      </div>
      <button class="btn btn--danger btn--xs btn-del-achievement" data-id="${a.id}">✕</button>
    </div>
  `;
}

function perfRow(p) {
  const date = p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '–';
  return `
    <div class="perf-row">
      <span class="perf-row__date">${date}</span>
      <div class="perf-row__stats">
        <span class="perf-badge perf-badge--goal">⚽ ${p.goals || 0}</span>
        <span class="perf-badge perf-badge--assist">🅰️ ${p.assists || 0}</span>
        ${p.yellowCards ? `<span class="perf-badge">🟨 ${p.yellowCards}</span>` : ''}
        ${p.redCards ? `<span class="perf-badge">🟥 ${p.redCards}</span>` : ''}
        <span class="perf-badge perf-badge--rating">⭐ ${p.rating || 0}</span>
      </div>
    </div>
  `;
}

function calcAge(birthDate) {
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function drawChart(data) {
  const canvas = document.getElementById('perf-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 600;
  const H = 200;
  canvas.width = W;
  canvas.height = H;

  const pad = { t: 20, b: 30, l: 30, r: 20 };
  const w = W - pad.l - pad.r;
  const h = H - pad.t - pad.b;
  const n = data.length;

  const maxGoals = Math.max(...data.map(d => d.goals || 0), 1);
  const maxRating = 10;

  function xPos(i) { return pad.l + (i / (n - 1)) * w; }
  function yGoal(v) { return pad.t + h - (v / maxGoals) * h; }
  function yAssist(v) { return pad.t + h - (v / maxGoals) * h; }
  function yRating(v) { return pad.t + h - (v / maxRating) * h; }

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = pad.t + h * f;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + w, y); ctx.stroke();
  });

  function drawLine(dataFn, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    data.forEach((d, i) => {
      const x = xPos(i), y = dataFn(d);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Dots
    data.forEach((d, i) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(xPos(i), dataFn(d), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawLine(d => yGoal(d.goals || 0), '#e85d04');
  drawLine(d => yAssist(d.assists || 0), '#3a86ff');
  drawLine(d => yRating(d.rating || 0), '#06d6a0');

  // X labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const label = d.date ? new Date(d.date).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}) : String(i+1);
    ctx.fillText(label, xPos(i), H - 8);
  });
}

function openAchievementModal(container) {
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Tipo</label>
      <select class="form-select" id="ach-type">
        <option value="title">🏆 Título</option>
        <option value="award">🥇 Award</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input class="form-input" id="ach-title" placeholder="Ex: Campeão da Copa">
    </div>
    <div class="form-group">
      <label class="form-label">Descrição</label>
      <input class="form-input" id="ach-desc" placeholder="Ex: 1º lugar">
    </div>
    <div class="form-group">
      <label class="form-label">Ano</label>
      <input class="form-input" id="ach-year" type="number" value="${new Date().getFullYear()}">
    </div>
  `;
  openModal({
    title: 'Adicionar Conquista',
    content: form,
    actions: [
      { id: 'cancel', label: 'Cancelar', variant: 'ghost' },
      { id: 'save', label: 'Adicionar', variant: 'primary', closes: false, handler: async () => {
        const title = form.querySelector('#ach-title').value.trim();
        if (!title) { showToast('Título obrigatório', 'error'); return; }
        await createAchievement({
          type: form.querySelector('#ach-type').value,
          title,
          description: form.querySelector('#ach-desc').value,
          year: parseInt(form.querySelector('#ach-year').value),
        });
        document.querySelector('.modal-overlay')?.remove();
        const updated = await getAchievements();
        container.querySelector('#achievements-list').innerHTML = renderAchievementsList(updated);
        showToast('Conquista adicionada!', 'success');
      }},
    ]
  });
}
