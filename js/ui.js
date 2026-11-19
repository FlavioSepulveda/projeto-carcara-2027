export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let toastTimer = null;
export function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.querySelector('div').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

export function openDialog({ title, html, size = 'max-w-lg', onMount }) {
  const modal  = $('#appModal');
  const dialog = $('#appModalDialog');
  const body   = $('#appModalBody');

  $('#appModalTitle').textContent = title;
  dialog.className = `modal-content ${size}`;
  body.innerHTML = html;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (typeof onMount === 'function') onMount(body);
}

export function closeDialog() {
  $('#appModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

export function initDialogEvents() {
  $('#appModalClose')?.addEventListener('click', closeDialog);
  $('#appModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'appModal') closeDialog();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDialog();
  });
}

export function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}