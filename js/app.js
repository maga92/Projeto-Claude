// js/app.js - Main Application Orchestrator
import { openDB } from '../db/database.js';
import { on, emit, Events } from './core/events.js';
import { registerRoute, navigate } from './core/router.js';
import { initRankings } from './services/rankingService.js';
import { initProfile } from './services/profileService.js';
import { globalSearch } from './services/searchService.js';
import { exportData, importData } from './services/exportService.js';
import { renderHome } from '../pages/home.js';
import { renderChampionships } from '../pages/championships.js';
import { renderChampionshipDetail } from '../pages/championship-detail.js';
import { renderRankings } from '../pages/rankings.js';
import { renderProfile } from '../pages/profile.js';

const content = document.getElementById('content');
let searchDebounce;

// ── ROUTES ────────────────────────────────────
function setupRoutes() {
  registerRoute('home', () => renderHome(content));
  registerRoute('championships', () => renderChampionships(content));
  registerRoute('championship-detail', (params) => renderChampionshipDetail(content, params));
  registerRoute('rankings', () => renderRankings(content));
  registerRoute('profile', () => renderProfile(content));
}

// ── BOTTOM NAV ────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigate(item.dataset.route);
    });
  });

  on(Events.NAVIGATE, ({ path }) => {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('nav-item--active', item.dataset.route === path.split('-')[0] || item.dataset.route === path);
    });
    // Special: championship-detail maps to championships nav
    if (path === 'championship-detail') {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('nav-item--active'));
      document.querySelector('[data-route="championships"]')?.classList.add('nav-item--active');
    }
  });
}

// ── GLOBAL SEARCH ─────────────────────────────
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    const q = e.target.value.trim();
    if (!q) { searchResults.classList.add('hidden'); return; }
    searchDebounce = setTimeout(async () => {
      const results = await globalSearch(q);
      renderSearchResults(results, searchResults, searchInput);
    }, 250);
  });

  searchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim()) searchResults.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      searchResults.classList.add('hidden');
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchResults.classList.add('hidden'); searchInput.blur(); }
  });
}

function renderSearchResults(results, container, input) {
  if (!results.length) {
    container.innerHTML = `<div class="search-empty">Nenhum resultado encontrado</div>`;
    container.classList.remove('hidden');
    return;
  }

  const typeLabels = {
    championship: 'Campeonato',
    team: 'Time',
    match: 'Partida',
    achievement: 'Conquista',
    ranking: 'Ranking',
  };

  container.innerHTML = results.map(r => `
    <div class="search-result-item" data-type="${r.type}" data-id="${r.id}">
      <span class="search-result-item__type result-type--${r.type}">${typeLabels[r.type] || r.type}</span>
      <div class="search-result-item__info">
        <div class="search-result-item__title">${r.title}</div>
        <div class="search-result-item__sub">${r.subtitle}</div>
      </div>
    </div>
  `).join('');

  container.classList.remove('hidden');

  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      const id = item.dataset.id;
      container.classList.add('hidden');
      input.value = '';
      if (type === 'championship') navigate('championship-detail', { id });
      else if (type === 'match') navigate('championships');
      else if (type === 'ranking') navigate('rankings');
      else if (type === 'achievement') navigate('profile');
      else navigate('home');
    });
  });
}

// ── EXPORT / IMPORT ───────────────────────────
function setupDataMenu() {
  const btn = document.getElementById('btn-data-menu');
  const dropdown = document.getElementById('data-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  document.getElementById('btn-export')?.addEventListener('click', () => {
    exportData();
    dropdown.classList.add('hidden');
  });

  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file-input')?.click();
    dropdown.classList.add('hidden');
  });

  document.getElementById('import-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const mode = confirm('Substituir todos os dados?\n\nOK = Substituir\nCancelar = Mesclar') ? 'replace' : 'merge';
    await importData(file, mode);
    e.target.value = '';
    navigate('home');
  });
}

// ── INIT ─────────────────────────────────────
async function init() {
  try {
    await openDB();
    await Promise.all([initRankings(), initProfile()]);
    setupRoutes();
    setupNav();
    setupSearch();
    setupDataMenu();
    navigate('home');
    document.querySelector('[data-route="home"]')?.classList.add('nav-item--active');

    on(Events.DATA_IMPORTED, () => navigate('home'));
  } catch (err) {
    console.error('Init failed:', err);
    content.innerHTML = `<div class="empty-state"><p>Erro ao iniciar o sistema: ${err.message}</p></div>`;
  }
}

init();
