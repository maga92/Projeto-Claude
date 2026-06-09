// pages/rankings.js
import { getRanking, updateRanking, addRankingItem, removeRankingItem, getRegions, createRegion, deleteRegion } from '../js/services/rankingService.js';
import { makeSortable } from '../js/ui/dragdrop.js';
import { showToast } from '../js/ui/toast.js';
import { openModal } from '../js/ui/modal.js';

export async function renderRankings(container) {
  const [global, regional, players, regions] = await Promise.all([
    getRanking('global'),
    getRanking('regional'),
    getRanking('players'),
    getRegions(),
  ]);

  container.innerHTML = `
    <div class="page rankings-page">
      <div class="page-header">
        <h1 class="page-title">Rankings</h1>
      </div>
      <div class="tabs" id="rank-tabs">
        <button class="tab tab--active" data-tab="global">Global</button>
        <button class="tab" data-tab="regional">Regional</button>
        <button class="tab" data-tab="players">Players</button>
      </div>
      <div id="rank-content"></div>
    </div>
  `;

  const rankData = { global, regional, players };
  let currentTab = 'global';
  let currentRegionFilter = null;

  function renderRankingContent() {
    const content = container.querySelector('#rank-content');
    const data = rankData[currentTab];
    const items = data?.items || [];

    let filterHtml = '';
    if (currentTab === 'regional') {
      filterHtml = `
        <div class="region-filter">
          <button class="region-tag ${!currentRegionFilter ? 'region-tag--active' : ''}" data-region="">Todos</button>
          ${regions.map(r => `
            <button class="region-tag ${currentRegionFilter === r.id ? 'region-tag--active' : ''}" data-region="${r.id}" style="--region-color:${r.color}">${r.name}</button>
          `).join('')}
          <button class="btn btn--ghost btn--xs" id="btn-add-region">+ Região</button>
        </div>
      `;
    }

    const filteredItems = currentTab === 'regional' && currentRegionFilter
      ? items.filter(i => i.regionId === currentRegionFilter)
      : items;

    content.innerHTML = `
      ${filterHtml}
      <div class="ranking-list" id="ranking-list-${currentTab}">
        ${filteredItems.length === 0
          ? '<div class="empty-state"><p>Lista vazia. Adicione itens abaixo.</p></div>'
          : filteredItems.map((item, idx) => `
            <div class="rank-item" draggable="true" data-id="${item.id}">
              <span class="rank-item__pos">${idx + 1}</span>
              <div class="rank-item__content">
                <span class="rank-item__name">${item.name}</span>
                ${item.label ? `<span class="rank-item__label">${item.label}</span>` : ''}
                ${item.regionId ? `<span class="rank-item__region">${regions.find(r=>r.id===item.regionId)?.name || ''}</span>` : ''}
              </div>
              <button class="btn btn--danger btn--xs btn-remove-rank" data-id="${item.id}">✕</button>
            </div>
          `).join('')
        }
      </div>
      <div class="ranking-add-row">
        <input class="form-input" id="rank-add-name" placeholder="Nome...">
        ${currentTab === 'regional' ? `
          <select class="form-select" id="rank-add-region">
            <option value="">Sem região</option>
            ${regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
        ` : ''}
        <input class="form-input" id="rank-add-label" placeholder="Etiqueta (opcional)">
        <button class="btn btn--primary btn--sm" id="btn-rank-add">+ Adicionar</button>
      </div>
    `;

    // Drag & drop
    const listEl = content.querySelector(`#ranking-list-${currentTab}`);
    if (listEl && filteredItems.length > 0) {
      makeSortable(listEl, async (newOrder) => {
        const allItems = data.items || [];
        const otherItems = allItems.filter(i => !filteredItems.find(f => f.id === i.id));
        const reordered = newOrder.map(id => filteredItems.find(i => i.id === id)).filter(Boolean);
        rankData[currentTab] = await updateRanking(currentTab, [...otherItems, ...reordered]);
        showToast('Ordem atualizada', 'success');
      });
    }

    // Remove buttons
    content.querySelectorAll('.btn-remove-rank').forEach(btn => {
      btn.addEventListener('click', async () => {
        rankData[currentTab] = await removeRankingItem(currentTab, btn.dataset.id);
        renderRankingContent();
      });
    });

    // Add item
    content.querySelector('#btn-rank-add')?.addEventListener('click', async () => {
      const name = content.querySelector('#rank-add-name').value.trim();
      if (!name) { showToast('Nome obrigatório', 'error'); return; }
      const label = content.querySelector('#rank-add-label')?.value.trim() || '';
      const regionId = content.querySelector('#rank-add-region')?.value || null;
      rankData[currentTab] = await addRankingItem(currentTab, { name, label, regionId });
      renderRankingContent();
      showToast('Item adicionado!', 'success');
    });

    content.querySelector('#rank-add-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') content.querySelector('#btn-rank-add')?.click();
    });

    // Region filter
    content.querySelectorAll('.region-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        currentRegionFilter = btn.dataset.region || null;
        renderRankingContent();
      });
    });

    // Add region
    content.querySelector('#btn-add-region')?.addEventListener('click', () => {
      const name = prompt('Nome da região (ex: SA, EU, NA):');
      if (!name) return;
      createRegion(name.trim()).then(r => {
        regions.push(r);
        renderRankingContent();
        showToast('Região criada!', 'success');
      });
    });

    // Region delete
    content.querySelectorAll('.region-tag[data-region]:not([data-region=""])').forEach(btn => {
      btn.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        if (!confirm('Excluir esta região?')) return;
        await deleteRegion(btn.dataset.region);
        const idx = regions.findIndex(r => r.id === btn.dataset.region);
        if (idx > -1) regions.splice(idx, 1);
        if (currentRegionFilter === btn.dataset.region) currentRegionFilter = null;
        renderRankingContent();
      });
    });
  }

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');
      currentTab = tab.dataset.tab;
      currentRegionFilter = null;
      renderRankingContent();
    });
  });

  renderRankingContent();
}
