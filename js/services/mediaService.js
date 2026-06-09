// js/services/mediaService.js
import { getById, put, remove, generateId } from '../../db/database.js';
import { STORES } from '../../db/schema.js';

export async function saveMedia(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const media = {
        id: generateId(),
        data: e.target.result,
        type: file.type,
        name: file.name,
        createdAt: Date.now(),
      };
      await put(STORES.media, media);
      resolve(media);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getMedia(id) {
  if (!id) return null;
  return await getById(STORES.media, id);
}

export async function deleteMedia(id) {
  if (!id) return;
  await remove(STORES.media, id);
}

export async function getMediaUrl(id) {
  if (!id) return null;
  const media = await getMedia(id);
  return media?.data || null;
}
