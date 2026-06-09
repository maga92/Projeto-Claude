// js/services/exportService.js - Complete Export/Import System
import { getAll, clearStore, putBulk, put } from '../../db/database.js';
import { STORES } from '../../db/schema.js';
import { emit, Events } from '../core/events.js';
import { showToast } from '../ui/toast.js';

const EXPORT_VERSION = '1.0';
const ALL_STORES = Object.values(STORES);

export async function exportData() {
  const snapshot = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), stores: {} };
  for (const store of ALL_STORES) {
    snapshot.stores[store] = await getAll(store);
  }
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `major-league-live-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso!', 'success');
  emit(Events.DATA_EXPORTED);
}

export async function importData(file, mode = 'replace') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.stores) throw new Error('Formato inválido: campo stores ausente');
        if (!validateImport(data)) throw new Error('Dados corrompidos ou inválidos');

        if (mode === 'replace') {
          for (const store of ALL_STORES) {
            await clearStore(store);
          }
        }

        for (const store of ALL_STORES) {
          const items = data.stores[store];
          if (Array.isArray(items) && items.length > 0) {
            if (mode === 'merge') {
              for (const item of items) await put(store, item);
            } else {
              await putBulk(store, items);
            }
          }
        }

        showToast('Dados importados com sucesso!', 'success');
        emit(Events.DATA_IMPORTED, { mode });
        resolve(true);
      } catch (err) {
        showToast(`Erro ao importar: ${err.message}`, 'error');
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function validateImport(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.stores || typeof data.stores !== 'object') return false;
  if (!data.version) return false;
  return true;
}
