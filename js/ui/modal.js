// js/ui/modal.js - Modal System
let activeModals = [];

export function openModal({ title, content, actions = [], size = 'md', onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = `modal modal--${size}`;
  
  const actionsHtml = actions.map(a => 
    `<button class="btn btn--${a.variant || 'ghost'}" data-action="${a.id}">${a.label}</button>`
  ).join('');

  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">${title}</h3>
      <button class="modal__close" aria-label="Fechar">✕</button>
    </div>
    <div class="modal__body">${typeof content === 'string' ? content : ''}</div>
    ${actionsHtml ? `<div class="modal__footer">${actionsHtml}</div>` : ''}
  `;

  if (typeof content !== 'string') {
    modal.querySelector('.modal__body').appendChild(content);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

  const close = () => {
    overlay.classList.remove('modal-overlay--visible');
    setTimeout(() => { overlay.remove(); activeModals = activeModals.filter(m => m !== overlay); }, 200);
    if (onClose) onClose();
  };

  modal.querySelector('.modal__close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  actions.forEach(a => {
    modal.querySelector(`[data-action="${a.id}"]`)?.addEventListener('click', () => {
      a.handler?.();
      if (a.closes !== false) close();
    });
  });

  activeModals.push(overlay);
  return { close, overlay, modal };
}

export function closeAllModals() {
  activeModals.forEach(m => m.remove());
  activeModals = [];
}
