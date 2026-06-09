// js/ui/toast.js - Toast Notifications
let toastContainer;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 3000) {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${getIcon(type)}</span>
    <span class="toast__message">${message}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getIcon(type) {
  const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
  return icons[type] || 'i';
}
