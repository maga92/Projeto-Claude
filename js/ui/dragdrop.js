// js/ui/dragdrop.js - Drag & Drop for Lists
export function makeSortable(listEl, onReorder) {
  let dragging = null;
  let placeholder = null;

  listEl.querySelectorAll('[draggable]').forEach(item => setupItem(item));

  function setupItem(item) {
    item.addEventListener('dragstart', (e) => {
      dragging = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = item.offsetHeight + 'px';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      placeholder?.remove();
      dragging = null;
      if (onReorder) {
        const items = [...listEl.querySelectorAll('[draggable]')].map(el => el.dataset.id);
        onReorder(items);
      }
    });
  }

  listEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragging) return;
    const afterEl = getDragAfterEl(listEl, e.clientY);
    if (afterEl) {
      listEl.insertBefore(placeholder, afterEl);
    } else {
      listEl.appendChild(placeholder);
    }
  });

  listEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!dragging || !placeholder) return;
    listEl.insertBefore(dragging, placeholder);
    placeholder.remove();
  });

  return {
    refresh: () => listEl.querySelectorAll('[draggable]').forEach(item => setupItem(item))
  };
}

function getDragAfterEl(container, y) {
  const draggables = [...container.querySelectorAll('[draggable]:not(.dragging)')];
  return draggables.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
