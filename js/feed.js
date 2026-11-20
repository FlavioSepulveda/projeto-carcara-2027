import { CONFIG } from './config.js';
import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, $$, toast, openDialog, closeDialog, timeAgo } from './ui.js';
import { openMessagesDialog } from './messages.js';

let currentFilter = 'all';
let currentSort   = 'recent';
let currentSearch = '';
let currentArtistFilter = null;
let feedLayout    = 'masonry';

export function setArtistFilter(artistId) {
  currentArtistFilter = artistId || null;
}

export function renderStories(onFilterChange) {
  const strip = $('#storiesStrip');
  if (!strip) return;
  const artists = DB.getUsers().filter(u => u.licensed);

  strip.innerHTML = [
    `<div class="story-pill" data-artist="">
      <div class="story-ring ${!currentArtistFilter ? 'ring-2 ring-carcara-600 ring-offset-2' : ''}">
        <div class="story-avatar bg-carcara-100">🦅</div>
      </div>
      <span class="text-[11px] font-medium line-clamp-1">Todos</span>
    </div>`,
    ...artists.map(u => `
      <div class="story-pill" data-artist="${u.id}">
        <div class="story-ring ${currentArtistFilter === u.id ? 'ring-2 ring-carcara-600 ring-offset-2' : ''}">
          <div class="story-avatar">${u.name.charAt(0).toUpperCase()}</div>
        </div>
        <span class="text-[11px] font-medium line-clamp-1">${u.name.split(' ')[0]}</span>
      </div>`),
  ].join('');

  $$('.story-pill', strip).forEach(el => {
    el.onclick = () => {
      currentArtistFilter = el.dataset.artist || null;
      renderStories(onFilterChange);
      renderFeed(onFilterChange);
    };
  });
}

export async function renderFeed({ onOpenArtist, onOpenSavePin, onPortfolioChange } = {}) {
  const grid  = $('#feedGrid');
  const empty = $('#feedEmpty');
  const stats = $('#feedStats');
  if (!grid) return;

  grid.className = feedLayout === 'masonry' ? 'feed-masonry' : 'feed-stream';

  let posts = DB.getPosts();
  if (currentFilter !== 'all') posts = posts.filter(p => p.tag === currentFilter);
  if (currentArtistFilter) posts = posts.filter(p => p.artistId === currentArtistFilter);
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    posts = posts.filter(p =>
      [p.title, p.artist, p.location, p.description, p.medium].some(v => (v || '').toLowerCase().includes(q))
    );
  }
  if (currentSort === 'popular') {
    posts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (stats) stats.textContent = `${posts.length} ${posts.length === 1 ? 'obra' : 'obras'} no ninho`;
  empty.classList.toggle('hidden', posts.length > 0);
  grid.innerHTML = '';

  const user = Auth.getUser();

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const imgUrl   = await DB.resolvePostImage(p);
    const liked    = user ? DB.hasLiked(p.id, user.id) : false;
    const saved    = DB.isPostSavedAnywhere(p.id);
    const comments = DB.getCommentsByPost(p.id);
    const avail    = CONFIG.AVAILABILITY_LABELS[p.availability];
    const tagLabel = p.tag === 'jogos' ? '🎮 Jogos' : p.tag;

    const card = document.createElement('article');
    card.className = 'post-card';
    card.style.animationDelay = `${Math.min(i * 50, 400)}ms`;

    card.innerHTML = `
      ${feedLayout === 'stream' ? `
        <div class="ig-header">
          <div class="flex items-center gap-2.5 artist-trigger" data-artist="${p.artistId}">
            <div class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold">${p.artist.charAt(0).toUpperCase()}</div>
            <div>
              <p class="text-xs font-semibold flex items-center gap-1">${p.artist} <i class="bi bi-patch-check-fill text-carcara-600 text-[11px]"></i></p>
              <p class="text-[11px] text-sertao-700/60">${p.location || 'Piauí'} • ${timeAgo(p.createdAt)}</p>
            </div>
          </div>
          <span class="text-[10px] uppercase px-2.5 py-1 rounded-full bg-carcara-100 text-carcara-800 font-semibold">${tagLabel}</span>
        </div>` : ''}

      <div class="post-card__media">
        ${feedLayout === 'masonry' ? `<span class="post-card__tag">${tagLabel}</span>` : ''}
        <div class="post-card__actions">
          ${feedLayout === 'masonry' ? `<button class="pin-save-btn ${saved ? 'saved' : ''}" data-pin>${saved ? 'Salvo' : 'Salvar'}</button>` : ''}
          <button class="icon-btn like-btn ${liked ? 'liked' : ''}" title="Curtir">❤</button>
          ${user && user.id === p.artistId ? `<button class="icon-btn fav-btn ${p.portfolio ? 'liked' : ''}" title="Portfólio">★</button>` : ''}
        </div>
        <img src="${imgUrl}" alt="${p.title}" class="post-card__image" loading="lazy" />
        <div class="dbl-heart">❤</div>
      </div>

      <div class="post-card__body">
        <div class="flex items-start justify-between gap-2">
          <h4 class="post-card__title line-clamp-2">${p.title}</h4>
          ${p.playableUrl ? `<span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sertao-900 text-carcara-300">🎮 Demo</span>` : ''}
        </div>

        ${avail && p.availability !== 'acervo' ? `
          <span class="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${avail.badge}">${avail.label}</span>
        ` : ''}

        ${feedLayout === 'stream' ? `
          ${p.description ? `<p class="text-xs text-sertao-700/80 mt-1 line-clamp-2">${p.description}</p>` : ''}
          <div class="ig-footer-bar">
            <div class="flex items-center gap-3 text-xs font-semibold">
              <button class="stream-like-btn flex items-center gap-1 ${liked ? 'text-red-600' : ''}">
                <span>${liked ? '❤' : '🤍'}</span> <span class="like-count">${p.likes || 0}</span>
              </button>
              <span class="flex items-center gap-1"><i class="bi bi-chat"></i> ${comments.length}</span>
            </div>
            <button class="pin-save-btn ${saved ? 'saved' : ''}" data-pin>${saved ? '📌 Salvo' : '📌 Salvar'}</button>
          </div>` : `
          <div class="post-card__meta">
            <span class="artist-trigger hover:underline font-medium" data-artist="${p.artistId}">🎨 ${p.artist}</span>
            <span>•</span><span>${p.location || 'Piauí'}</span>
            <span class="ml-auto">💬 ${comments.length} • <span class="like-count">❤ ${p.likes || 0}</span></span>
          </div>`}
      </div>`;

    let timer = null;
    card.querySelector('.post-card__media').onclick = (e) => {
      if (e.target.closest('button')) return;
      if (timer) {
        clearTimeout(timer); timer = null;
        const heart = card.querySelector('.dbl-heart');
        heart.classList.remove('burst'); void heart.offsetWidth; heart.classList.add('burst');
        const u = Auth.getUser();
        if (u && !DB.hasLiked(p.id, u.id)) {
          const res = DB.toggleLike(p.id, u.id);
          syncLikeUI(card, res.liked, res.likes);
        }
      } else {
        timer = setTimeout(() => { timer = null; showPostDetails(p, { onOpenArtist, onOpenSavePin, onPortfolioChange }); }, 220);
      }
    };

    card.querySelector('.post-card__body').onclick = (e) => {
      if (!e.target.closest('button') && !e.target.closest('.artist-trigger')) {
        showPostDetails(p, { onOpenArtist, onOpenSavePin, onPortfolioChange });
      }
    };

    card.querySelectorAll('.artist-trigger').forEach(el => {
      el.onclick = (e) => { e.stopPropagation(); if (onOpenArtist) onOpenArtist(el.dataset.artist); };
    });

    const handleLike = (e) => {
      e.stopPropagation();
      const u = Auth.getUser();
      if (!u) { openAuthDialog(() => renderFeed({ onOpenArtist, onOpenSavePin, onPortfolioChange })); return; }
      const res = DB.toggleLike(p.id, u.id);
      syncLikeUI(card, res.liked, res.likes);
    };
    card.querySelector('.like-btn')?.addEventListener('click', handleLike);
    card.querySelector('.stream-like-btn')?.addEventListener('click', handleLike);

    card.querySelector('[data-pin]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onOpenSavePin) onOpenSavePin(p.id);
    });

    card.querySelector('.fav-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = DB.updatePost(p.id, { portfolio: !p.portfolio });
      e.currentTarget.classList.toggle('liked', !!updated.portfolio);
      toast(updated.portfolio ? 'Adicionado ao portfólio ⭐' : 'Removido do portfólio');
      if (onPortfolioChange) onPortfolioChange();
    });

    grid.appendChild(card);
  }
}

function syncLikeUI(card, liked, count) {
  card.querySelector('.like-btn')?.classList.toggle('liked', liked);
  const sBtn = card.querySelector('.stream-like-btn');
  if (sBtn) {
    sBtn.classList.toggle('text-red-600', liked);
    sBtn.querySelector('span').textContent = liked ? '❤' : '🤍';
  }
  card.querySelectorAll('.like-count').forEach(el => {
    el.textContent = el.closest('.stream-like-btn') ? count : `❤ ${count}`;
  });
}

export async function showPostDetails(p, callbacks = {}) {
  const imgUrl   = await DB.resolvePostImage(p);
  const user     = Auth.getUser();
  const liked    = user ? DB.hasLiked(p.id, user.id) : false;
  const comments = DB.getCommentsByPost(p.id);
  const isOwn    = user && user.id === p.artistId;
  const avail    = CONFIG.AVAILABILITY_LABELS[p.availability];
  const specs    = [p.medium, p.dimensions, p.location].filter(Boolean);

  openDialog({
    title: p.title,
    size: 'max-w-2xl',
    html: `
      <div class="space-y-4">
        <div class="rounded-xl overflow-hidden bg-carcara-100 relative">
          <img src="${imgUrl}" alt="${p.title}" class="w-full max-h-[55vh] object-contain mx-auto" />
        </div>

        ${p.playableUrl ? `
          <a href="${p.playableUrl}" target="_blank" rel="noopener"
             class="flex items-center justify-between p-3 rounded-xl bg-sertao-900 text-carcara-100 hover:bg-sertao-800 transition">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🎮</span>
              <div>
                <p class="text-xs font-bold text-carcara-300">Projeto Interativo / Jogo Disponível</p>
                <p class="text-[11px] text-carcara-100/75 truncate max-w-xs">${p.playableUrl}</p>
              </div>
            </div>
            <span class="btn-primary text-xs shrink-0">Jogar / Testar →</span>
          </a>` : ''}

        <div class="flex items-center justify-between flex-wrap gap-2">
          <div id="postAuthorLink" class="flex items-center gap-2 cursor-pointer">
            <div class="w-9 h-9 rounded-full bg-carcara-600 text-white flex items-center justify-center font-bold text-sm">
              ${p.artist.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="text-sm font-semibold hover:text-carcara-700">${p.artist}</p>
              <p class="text-xs text-sertao-700/60 capitalize">${p.tag === 'jogos' ? 'Jogos / Game Art' : p.tag}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            ${!isOwn ? `<button id="postDmBtn" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-sertao-900 text-carcara-100 hover:bg-sertao-800 transition"><i class="bi bi-chat-dots-fill mr-1"></i>Mensagem</button>` : ''}
            <button id="postModalLike" class="px-3 py-1.5 rounded-full text-xs font-semibold border ${liked ? 'bg-red-600 text-white border-red-600' : 'border-carcara-200'}">❤ ${p.likes || 0}</button>
            <button id="postModalSave" class="pin-save-btn">📌 Salvar</button>
          </div>
        </div>

        ${(avail || specs.length) ? `
          <div class="flex items-center flex-wrap gap-2 bg-carcara-50 border border-carcara-200 rounded-xl px-3 py-2 text-xs">
            ${avail ? `<span class="font-semibold px-2.5 py-0.5 rounded-full ${avail.badge}">${avail.label}</span>` : ''}
            ${specs.length ? `<span class="text-sertao-700/80"><i class="bi bi-info-circle mr-1 text-carcara-600"></i>${specs.join(' • ')}</span>` : ''}
          </div>` : ''}

        ${p.description ? `<p class="text-sm text-sertao-800/90 leading-relaxed">${p.description}</p>` : ''}

        <div class="border-t border-carcara-200 pt-3">
          <h5 class="text-xs font-bold uppercase tracking-wider text-sertao-700/70 mb-2">Comentários (${comments.length})</h5>
          <div class="space-y-2 max-h-40 overflow-y-auto mb-3">
            ${comments.length ? comments.map(c => `
              <div class="bg-carcara-50 border border-carcara-100 rounded-lg px-3 py-2 text-xs">
                <div class="flex justify-between"><strong>${c.userName}</strong><span class="text-[10px] text-sertao-700/50">${timeAgo(c.createdAt)}</span></div>
                <p class="mt-0.5">${c.text}</p>
              </div>`).join('') : `<p class="text-xs text-sertao-700/50">Nenhum comentário ainda.</p>`}
          </div>
          <form id="postCommentForm" class="flex gap-2">
            <input name="comment" required placeholder="${user ? 'Escreva um comentário...' : 'Entre para comentar...'}" ${user ? '' : 'disabled'} class="form-input text-xs py-2" />
            <button type="submit" class="btn-primary text-xs px-4" ${user ? '' : 'disabled'}>Enviar</button>
          </form>
        </div>
      </div>`,
    onMount(root) {
      root.querySelector('#postAuthorLink').onclick = () => {
        closeDialog();
        if (callbacks.onOpenArtist) callbacks.onOpenArtist(p.artistId);
      };
      root.querySelector('#postDmBtn')?.addEventListener('click', () => {
        closeDialog();
        openMessagesDialog({ targetUserId: p.artistId, contextPost: p.title });
      });
      root.querySelector('#postModalSave').onclick = () => {
        if (callbacks.onOpenSavePin) callbacks.onOpenSavePin(p.id);
      };
      root.querySelector('#postModalLike').onclick = () => {
        const u = Auth.getUser();
        if (!u) { closeDialog(); openAuthDialog(); return; }
        DB.toggleLike(p.id, u.id);
        showPostDetails(p, callbacks);
        renderFeed(callbacks);
      };
      root.querySelector('#postCommentForm').onsubmit = (e) => {
        e.preventDefault();
        const u = Auth.getUser();
        if (!u) return;
        DB.addComment({ postId: p.id, userId: u.id, userName: u.name, text: e.target.comment.value });
        showPostDetails(p, callbacks);
        renderFeed(callbacks);
      };
    },
  });
}

export function initFeedControls(callbacks) {
  const filtersBox = $('#feedFilters');
  if (filtersBox) {
    filtersBox.innerHTML = CONFIG.TECH_FILTERS.map((f, idx) =>
      `<button data-filter="${f.id}" class="filter-btn ${idx === 0 ? 'active' : ''}">${f.label}</button>`
    ).join('');

    $$('.filter-btn', filtersBox).forEach(btn => {
      btn.onclick = () => {
        $$('.filter-btn', filtersBox).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderFeed(callbacks);
      };
    });
  }

  $('#feedSort')?.addEventListener('change', (e) => { currentSort = e.target.value; renderFeed(callbacks); });
  $('#feedSearch')?.addEventListener('input', (e) => { currentSearch = e.target.value; renderFeed(callbacks); });
  $('#feedSearchMobile')?.addEventListener('input', (e) => { currentSearch = e.target.value; renderFeed(callbacks); });

  const mBtn = $('#viewMasonryBtn');
  const sBtn = $('#viewStreamBtn');
  mBtn?.addEventListener('click', () => { feedLayout = 'masonry'; mBtn.classList.add('active'); sBtn?.classList.remove('active'); renderFeed(callbacks); });
  sBtn?.addEventListener('click', () => { feedLayout = 'stream'; sBtn.classList.add('active'); mBtn?.classList.remove('active'); renderFeed(callbacks); });
}