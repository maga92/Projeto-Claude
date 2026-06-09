// pages/home.js - Dashboard Home
import { getChampionshipsByStatus } from '../js/services/championshipService.js';
import { getPlayerStats } from '../js/services/matchService.js';
import { getProfile } from '../js/services/profileService.js';
import { getMediaUrl } from '../js/services/mediaService.js';
import { navigate } from '../js/core/router.js';

export async function renderHome(container) {
  container.innerHTML = `<div class="page-loader">Carregando...</div>`;

  const [active, profile, stats] = await Promise.all([
    getChampionshipsByStatus('active'),
    getProfile(),
    getPlayerStats(),
  ]);

  const photoUrl = profile?.photoId ? await getMediaUrl(profile.photoId) : null;
  const recentPerfs = (stats.performances || [])
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 5);

  container.innerHTML = `
    <div class="page home-page">
      <div class="home-hero">
        <div class="home-hero__profile">
          <div class="avatar avatar--lg">
            ${photoUrl ? `<img src="${photoUrl}" alt="foto">` : `<span class="avatar__initials">${getInitials(profile?.name || 'ML')}</span>`}
          </div>
          <div class="home-hero__info">
            <h1 class="home-hero__name">${profile?.nickname || profile?.name || 'Meu Perfil'}</h1>
            <span class="home-hero__position">${profile?.position || 'Posição não definida'}</span>
          </div>
        </div>
        <div class="home-hero__stats">
          <div class="stat-pill">
            <span class="stat-pill__value">${stats.totalMatches}</span>
            <span class="stat-pill__label">Partidas</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__value">${stats.totalGoals}</span>
            <span class="stat-pill__label">Gols</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__value">${stats.totalAssists}</span>
            <span class="stat-pill__label">Assist.</span>
          </div>
          <div class="stat-pill stat-pill--accent">
            <span class="stat-pill__value">${stats.avgRating}</span>
            <span class="stat-pill__label">Média</span>
          </div>
        </div>
      </div>

      <section class="home-section">
        <div class="section-header">
          <h2 class="section-title">Em Andamento</h2>
          <button class="btn btn--ghost btn--sm" data-nav="championships">Ver todos</button>
        </div>
        ${active.length === 0
          ? `<div class="empty-state empty-state--sm"><p>Nenhum campeonato ativo</p><button class="btn btn--primary btn--sm" data-nav="championships">Criar campeonato</button></div>`
          : `<div class="championship-cards">${active.slice(0, 3).map(c => championshipCard(c)).join('')}</div>`
        }
      </section>

      <section class="home-section">
        <div class="section-header">
          <h2 class="section-title">Últimas Partidas</h2>
        </div>
        ${recentPerfs.length === 0
          ? `<div class="empty-state empty-state--sm"><p>Nenhuma partida registrada com desempenho</p></div>`
          : `<div class="recent-matches">${recentPerfs.map(p => recentMatchRow(p)).join('')}</div>`
        }
      </section>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  container.querySelectorAll('[data-champ-id]').forEach(card => {
    card.addEventListener('click', () => navigate('championship-detail', { id: card.dataset.champId }));
  });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function championshipCard(c) {
  return `
    <div class="champ-card" data-champ-id="${c.id}">
      <div class="champ-card__body">
        <span class="champ-card__name">${c.name}</span>
        <span class="champ-card__season">${c.season || ''}</span>
      </div>
      <span class="status-dot status-dot--active"></span>
    </div>
  `;
}

function recentMatchRow(p) {
  const date = p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '–';
  return `
    <div class="recent-match-row">
      <div class="recent-match__meta">
        <span class="recent-match__date">${date}</span>
      </div>
      <div class="recent-match__stats">
        ${p.goals ? `<span class="perf-badge perf-badge--goal">⚽ ${p.goals}</span>` : ''}
        ${p.assists ? `<span class="perf-badge perf-badge--assist">🅰️ ${p.assists}</span>` : ''}
        ${p.rating ? `<span class="perf-badge perf-badge--rating">${p.rating}</span>` : ''}
      </div>
    </div>
  `;
}
