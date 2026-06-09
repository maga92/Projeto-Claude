// pages/championships.js
import { getChampionships, createChampionship, updateChampionship, deleteChampionship } from '../js/services/championshipService.js';
import { getMediaUrl, saveMedia } from '../js/services/mediaService.js';
import { navigate } from '../js/core/router.js';
import { openModal } from '../js/ui/modal.js';
import { showToast } from '../js/ui/toast.js';
import { autosave } from '../js/core/autosave.js';

export async function renderChampionships(container) {
  container.innerHTML = `<div class="page-loader">Carregando...</div>`;
  const all = await getChampionships();

  const tabs = [
    { id: 'active', label: 'Em Andamento', filter: c => c.status === 'active' },
    { id: 'upcoming', label: 'Futuros', filter: c => c.status === 'upcoming' },
    { id: 'finished', label: 'Finalizados', filter: c => c.status === 'finished' },
  ];

  container.innerHTML = `
    <div class="page championships-page">
      <div class="page-header">
        <h1 class="page-title">Campeonatos</h1>
        <button class="btn btn--primary" id="btn-new-champ">+ Novo</button>
      </div>
      <div class="tabs" id="champ-tabs">
        ${tabs.map((t, i) => `<button class="tab${i === 0 ? ' tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="champ-list" class="champ-list"></div>
    </div>
  `;

  let currentTab = 'active';

  function renderList() {
    const tabDef = tabs.find(t => t.id === currentTab);
    const items = all.filter(tabDef.filter);
    const list = container.querySelector('#champ-list');
    if (items.length === 0) {
      list.innerHTML = `<div class="empty-state"><p>Nenhum campeonato ${tabDef.label.toLowerCase()}</p></div>`;
      return;
    }
    list.innerHTML = items.map(c => `
      <div class="champ-row" data-id="${c.id}">
        <div class="champ-row__logo" data-logo-id="${c.logoId || ''}">
          <span class="champ-row__initial">${c.name[0]?.toUpperCase() || '?'}</span>
        </div>
        <div class="champ-row__info">
          <span class="champ-row__name">${c.name}</span>
          <span class="champ-row__season">${c.season || ''}</span>
        </div>
        <div class="champ-row__actions">
          <button class="btn btn--ghost btn--xs btn-edit" data-id="${c.id}">Editar</button>
          <button class="btn btn--danger btn--xs btn-delete" data-id="${c.id}">✕</button>
        </div>
      </div>
    `).join('');

    // Load logos async
    items.forEach(async c => {
      if (c.logoId) {
        const url = await getMediaUrl(c.logoId);
        if (url) {
          const logoEl = list.querySelector(`.champ-row[data-id="${c.id}"] .champ-row__logo`);
          if (logoEl) logoEl.innerHTML = `<img src="${url}" alt="${c.name}">`;
        }
      }
    });

    list.querySelectorAll('.champ-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.closest('button')) navigate('championship-detail', { id: row.dataset.id });
      });
    });
    list.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(btn.dataset.id); });
    });
    list.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Excluir campeonato e todos os dados relacionados?')) return;
        await deleteChampionship(btn.dataset.id);
        const idx = all.findIndex(c => c.id === btn.dataset.id);
        if (idx > -1) all.splice(idx, 1);
        renderList();
        showToast('Campeonato excluído', 'info');
      });
    });
  }

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');
      currentTab = tab.dataset.tab;
      renderList();
    });
  });

  container.querySelector('#btn-new-champ').addEventListener('click', () => openCreateModal());

  function openCreateModal() {
    const form = document.createElement('div');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nome *</label>
        <input class="form-input" id="champ-name" placeholder="Ex: Copa da Amizade" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">Temporada</label>
        <input class="form-input" id="champ-season" placeholder="${new Date().getFullYear()}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="champ-status">
          <option value="upcoming">Futuro</option>
          <option value="active">Em Andamento</option>
          <option value="finished">Finalizado</option>
        </select>
      </div>
    `;
    openModal({
      title: 'Novo Campeonato',
      content: form,
      actions: [
        { id: 'cancel', label: 'Cancelar', variant: 'ghost' },
        { id: 'create', label: 'Criar', variant: 'primary', closes: false, handler: async () => {
          const name = form.querySelector('#champ-name').value.trim();
          if (!name) { showToast('Nome obrigatório', 'error'); return; }
          const c = await createChampionship({
            name,
            season: form.querySelector('#champ-season').value || String(new Date().getFullYear()),
            status: form.querySelector('#champ-status').value,
          });
          all.unshift(c);
          renderList();
          showToast('Campeonato criado!', 'success');
          document.querySelector('.modal-overlay')?.remove();
        }},
      ]
    });
  }

  async function openEditModal(id) {
    const c = all.find(x => x.id === id);
    if (!c) return;
    const form = document.createElement('div');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input class="form-input" id="edit-name" value="${c.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Temporada</label>
        <input class="form-input" id="edit-season" value="${c.season || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="edit-status">
          <option value="upcoming" ${c.status==='upcoming'?'selected':''}>Futuro</option>
          <option value="active" ${c.status==='active'?'selected':''}>Em Andamento</option>
          <option value="finished" ${c.status==='finished'?'selected':''}>Finalizado</option>
        </select>
      </div>
    `;
    openModal({
      title: 'Editar Campeonato',
      content: form,
      actions: [
        { id: 'cancel', label: 'Cancelar', variant: 'ghost' },
        { id: 'save', label: 'Salvar', variant: 'primary', handler: async () => {
          const updated = await updateChampionship(id, {
            name: form.querySelector('#edit-name').value.trim(),
            season: form.querySelector('#edit-season').value,
            status: form.querySelector('#edit-status').value,
          });
          const idx = all.findIndex(x => x.id === id);
          if (idx > -1) all[idx] = updated;
          renderList();
          showToast('Salvo!', 'success');
        }},
      ]
    });
  }

  renderList();
}
