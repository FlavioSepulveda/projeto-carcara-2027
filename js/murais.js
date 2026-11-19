import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, $$, toast, openDialog, closeDialog } from './ui.js';

export async function renderMurais(onSelectPost) {
  const grid = $('#muraisGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const m of DB.getMurais()) {
    const imgUrl = m.imgKey ? await DB.getImageURL(m.imgKey) : m.img;
    const el = document.createElement('div');
    el.className = 'mural-card';
    el.innerHTML = `
      <img src="${imgUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80'}" alt="${m.title}" loading="lazy" />
      <div class="mural-card__overlay">
        <h4 class="mural-card__title">${m.title}</h4>
        <span class="mural-card__count">${m.count} referências</span>
      </div>`;
    el.onclick = () => openMuralView(m, onSelectPost);
    grid.appendChild(el);
  }
}

export function openNewMuralDialog(onCreated) {
  if (!Auth.isLogged()) { openAuthDialog(() => openNewMuralDialog(onCreated)); return; }

  openDialog({
    title: 'Novo mural de referência',
    size: 'max-w-md',
    html: `
      <form id="muralDialogForm" class="space-y-3">
        <div><label class="form-label">Nome do mural</label><input name="title" required class="form-input" placeholder="Ex: Paletas do Sertão" /></div>
        <div><label class="form-label">Descrição</label><textarea name="description" rows="2" class="form-input"></textarea></div>
        <div><label class="form-label">Capa</label><input name="cover" type="file" accept="image/*" class="form-input text-xs" /></div>
        <button type="submit" class="btn-primary w-full justify-center">Criar mural</button>
      </form>`,
    onMount(root) {
      root.querySelector('#muralDialogForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const file = fd.get('cover');
        const imgKey = file && file.size > 0 ? await DB.saveImage(file) : null;
        DB.addMural({ title: fd.get('title'), description: fd.get('description'), img: null, imgKey });
        closeDialog();
        toast('Mural criado! 📌');
        if (onCreated) onCreated();
      };
    },
  });
}

export function openSavePinDialog(postId, onSaved) {
  if (!Auth.isLogged()) { openAuthDialog(() => openSavePinDialog(postId, onSaved)); return; }

  openDialog({
    title: 'Salvar referência no mural',
    size: 'max-w-md',
    html: `
      <div class="space-y-2 max-h-64 overflow-y-auto">
        ${DB.getMurais().map(m => {
          const saved = m.postIds.includes(postId);
          return `
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-carcara-200 bg-carcara-50">
              <div><p class="text-sm font-semibold">${m.title}</p><p class="text-[11px] text-sertao-700/60">${m.count} referências</p></div>
              <button data-mural-id="${m.id}" class="pin-save-btn ${saved ? 'saved' : ''}">${saved ? 'Salvo ✓' : 'Salvar'}</button>
            </div>`;
        }).join('')}
      </div>
      <button id="createMuralFromPin" class="mt-3 text-xs font-semibold text-carcara-700 hover:underline">+ Criar novo mural</button>`,
    onMount(root) {
      root.querySelectorAll('[data-mural-id]').forEach(btn => {
        btn.onclick = () => {
          const saved = DB.togglePostInMural(btn.dataset.muralId, postId);
          btn.textContent = saved ? 'Salvo ✓' : 'Salvar';
          btn.classList.toggle('saved', saved);
          toast(saved ? 'Salvo no mural! 📌' : 'Removido do mural');
          if (onSaved) onSaved();
        };
      });
      root.querySelector('#createMuralFromPin').onclick = () => openNewMuralDialog(onSaved);
    },
  });
}

async function openMuralView(mural, onSelectPost) {
  const allPosts = DB.getPosts();
  const savedPosts = allPosts.filter(p => mural.postIds.includes(p.id));
  const cards = await Promise.all(savedPosts.map(async p => `
    <div class="rounded-xl overflow-hidden border border-carcara-200 bg-carcara-50 cursor-pointer" data-pin-post="${p.id}">
      <img src="${await DB.resolvePostImage(p)}" class="w-full h-40 object-cover" />
      <div class="p-2"><p class="text-xs font-semibold line-clamp-1">${p.title}</p><p class="text-[11px] text-sertao-700/60">🎨 ${p.artist}</p></div>
    </div>`));

  openDialog({
    title: mural.title,
    size: 'max-w-3xl',
    html: savedPosts.length
      ? `<p class="text-xs text-sertao-700/70 mb-4">${mural.description || ''}</p><div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${cards.join('')}</div>`
      : `<p class="text-sm text-sertao-700/60 text-center py-8">Nenhum pin salvo neste mural ainda.</p>`,
    onMount(root) {
      root.querySelectorAll('[data-pin-post]').forEach(el => {
        el.onclick = () => {
          const post = allPosts.find(x => x.id === el.dataset.pinPost);
          if (post && onSelectPost) { closeDialog(); onSelectPost(post); }
        };
      });
    },
  });
}