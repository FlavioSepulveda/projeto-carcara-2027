/* ==========================================
   Carcará — Lógica principal (Pinterest + Instagram)
   ========================================== */

const App = (() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let currentFilter = 'all';
  let currentSort   = 'recent';
  let currentSearch = '';
  let currentArtistFilter = null;
  let feedLayout    = 'masonry'; // 'masonry' (Pinterest) | 'stream' (Instagram)

  // ---------- Toast & Modais ----------
  function toast(msg) {
    const t = $('#toast');
    t.querySelector('div').textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => t.classList.add('hidden'), 2600);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
  function closeAllModals() {
    $$('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }

  async function imageFromStorage(post) {
    if (post.img) return post.img;
    if (post.imgKey) {
      const url = await DB.getImageURL(post.imgKey);
      return url || 'https://via.placeholder.com/500?text=🦅';
    }
    return 'https://via.placeholder.com/500?text=🦅';
  }

  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  // ---------- Menu mobile ----------
  function initMenu() {
    const btn  = $('#menuBtn');
    const menu = $('#mobileMenu');
    const icon = $('#menuIcon');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!isOpen));
      icon.innerHTML = isOpen
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>`;
    });

    $$('.mobile-link', menu).forEach(a => a.addEventListener('click', () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>`;
    }));
  }

  // ---------- Área de sessão (navbar) ----------
  function renderSessionArea() {
    const desktop = $('#sessionArea');
    const mobile  = $('#sessionAreaMobile');
    const user    = Auth.getUser();

    if (!user) {
      const html = `
        <button data-open="authModal" class="bg-carcara-600 hover:bg-carcara-700 text-white px-4 py-2 rounded-full transition text-xs font-semibold">
          Entrar
        </button>`;
      if (desktop) desktop.innerHTML = html;
      if (mobile)  mobile.innerHTML = `<button data-open="authModal" class="w-full bg-carcara-600 text-white px-4 py-2 rounded-full text-sm font-semibold">Entrar</button>`;
    } else {
      const initial = user.name.charAt(0).toUpperCase();
      if (desktop) desktop.innerHTML = `
        <div class="flex items-center gap-2">
          <button data-open="publishModal" class="bg-carcara-600 hover:bg-carcara-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition">+ Publicar</button>
          <div class="flex items-center gap-1.5">
            <button id="myProfileBtn" title="Meu perfil" class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold hover:scale-105 transition">${initial}</button>
            <button id="logoutBtn" class="text-xs text-sertao-700/60 hover:text-red-600">Sair</button>
          </div>
        </div>`;
      if (mobile) mobile.innerHTML = `
        <div class="px-3 py-2 flex items-center justify-between">
          <span class="text-xs font-semibold">${user.name}</span>
          <button id="logoutBtnMobile" class="text-xs text-red-600">Sair</button>
        </div>
        <button data-open="publishModal" class="w-full mt-1 bg-carcara-600 text-white px-4 py-2 rounded-full text-sm font-semibold">+ Publicar</button>`;

      $('#myProfileBtn')?.addEventListener('click', () => openArtistProfile(user.id));

      ['#logoutBtn', '#logoutBtnMobile'].forEach(sel => {
        const b = $(sel);
        if (b) b.addEventListener('click', () => {
          Auth.logout();
          renderAll();
          toast('Você saiu. Até logo! 🦅');
        });
      });
    }

    $$('[data-open]').forEach(btn => {
      btn.onclick = () => openModal(btn.dataset.open);
    });
  }

  // ---------- Stories Strip (Instagram style) ----------
  function renderStories() {
    const strip = $('#storiesStrip');
    if (!strip) return;
    const users = DB.getUsers();
    const me = Auth.getUser();

    const allPill = `
      <div class="story-pill" data-artist-filter="">
        <div class="story-ring ${!currentArtistFilter ? 'ring-2 ring-carcara-600 ring-offset-2' : ''}">
          <div class="story-avatar bg-carcara-100">🦅</div>
        </div>
        <span class="text-[11px] font-medium text-sertao-800 line-clamp-1">Todos</span>
      </div>`;

    const userPills = users.map(u => {
      const initial = (u.name || '?').charAt(0).toUpperCase();
      const active = currentArtistFilter === u.id;
      const following = me ? DB.isFollowing(me.id, u.id) : false;
      return `
        <div class="story-pill" data-artist-filter="${u.id}" title="Filtrar obras de ${u.name}">
          <div class="story-ring ${following ? 'followed' : ''} ${active ? 'ring-2 ring-carcara-600 ring-offset-2' : ''}">
            <div class="story-avatar">${initial}</div>
          </div>
          <span class="text-[11px] font-medium text-sertao-800 line-clamp-1">${u.name.split(' ')[0]}</span>
        </div>`;
    }).join('');

    strip.innerHTML = allPill + userPills;

    $$('.story-pill', strip).forEach(pill => {
      pill.addEventListener('click', () => {
        const id = pill.dataset.artistFilter;
        currentArtistFilter = id || null;
        renderStories();
        renderFeed();
      });
    });
  }

  // ---------- Feed (Pinterest Masonry + Instagram Stream) ----------
  async function renderFeed() {
    const grid = $('#feedGrid');
    const empty = $('#feedEmpty');
    const stats = $('#feedStats');
    if (!grid) return;

    grid.className = feedLayout === 'masonry' ? 'feed-masonry' : 'feed-stream';

    let posts = DB.getPosts();

    if (currentFilter !== 'all') {
      posts = posts.filter(p => p.tag === currentFilter);
    }
    if (currentArtistFilter) {
      posts = posts.filter(p => p.artistId === currentArtistFilter);
    }
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      posts = posts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.artist || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
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
      const imgUrl   = await imageFromStorage(p);
      const liked    = user ? DB.hasLiked(p.id, user.id) : false;
      const saved    = DB.isPostSavedAnywhere(p.id);
      const comments = DB.getCommentsByPost(p.id);
      const initial  = (p.artist || '?').charAt(0).toUpperCase();

      const card = document.createElement('article');
      card.className = 'post-card';
      card.style.animationDelay = `${Math.min(i * 55, 450)}ms`;

      const igTop = feedLayout === 'stream' ? `
        <div class="ig-header">
          <div class="flex items-center gap-2.5 artist-trigger" data-artist="${p.artistId}">
            <div class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold">${initial}</div>
            <div class="leading-tight">
              <p class="text-xs font-semibold text-sertao-900 hover:text-carcara-700">${p.artist}</p>
              <p class="text-[11px] text-sertao-700/60">${p.location || 'Piauí'} • ${timeAgo(p.createdAt)}</p>
            </div>
          </div>
          <span class="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-carcara-100 text-carcara-800 font-semibold">${p.tag}</span>
        </div>` : '';

      const igBottom = feedLayout === 'stream' ? `
        ${p.description ? `<p class="text-xs text-sertao-700/80 mt-1.5 line-clamp-2">${p.description}</p>` : ''}
        <div class="ig-footer-bar">
          <div class="flex items-center gap-3 text-xs font-semibold text-sertao-800">
            <button class="stream-like-btn flex items-center gap-1 hover:text-red-600 transition ${liked ? 'text-red-600' : ''}">
              <span>${liked ? '❤' : '🤍'}</span> <span class="like-count">${p.likes || 0}</span>
            </button>
            <button class="stream-comment-btn flex items-center gap-1 hover:text-carcara-700 transition">
              <i class="bi bi-chat"></i> <span>${comments.length}</span>
            </button>
          </div>
          <button class="pin-save-btn ${saved ? 'saved' : ''}" data-save-pin="${p.id}">
            ${saved ? '📌 Salvo' : '📌 Salvar'}
          </button>
        </div>` : `
        <div class="post-card__meta">
          <span class="artist-trigger hover:underline font-medium" data-artist="${p.artistId}">🎨 ${p.artist}</span>
          <span>•</span>
          <span>${p.location || 'Piauí'}</span>
          <span class="ml-auto flex items-center gap-2">
            <span>💬 ${comments.length}</span>
            <span class="like-count">❤ ${p.likes || 0}</span>
          </span>
        </div>`;

      card.innerHTML = `
        ${igTop}
        <div class="post-card__media">
          ${feedLayout === 'masonry' ? `<span class="post-card__tag">${p.tag}</span>` : ''}
          <div class="post-card__actions">
            ${feedLayout === 'masonry' ? `<button class="pin-save-btn ${saved ? 'saved' : ''}" data-save-pin="${p.id}">${saved ? 'Salvo' : 'Salvar'}</button>` : ''}
            <button class="icon-btn like-btn ${liked ? 'liked' : ''}" title="Curtir">❤</button>
            ${user && user.id === p.artistId ? `<button class="icon-btn fav-btn ${p.portfolio ? 'liked' : ''}" title="Destaque no portfólio">★</button>` : ''}
          </div>
          <img src="${imgUrl}" alt="${p.title}" class="post-card__image" loading="lazy" />
          <div class="post-card__hover-shade"></div>
          <div class="dbl-heart">❤</div>
        </div>
        <div class="post-card__body">
          <h4 class="post-card__title line-clamp-2">${p.title}</h4>
          ${igBottom}
        </div>`;

      // Clique simples abre detalhes / Duplo clique na imagem dá like estilo Instagram
      const media = card.querySelector('.post-card__media');
      let clickTimer = null;
      media.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          triggerDoubleClickLike(card, p);
        } else {
          clickTimer = setTimeout(() => {
            clickTimer = null;
            showPost(p);
          }, 230);
        }
      });

      card.querySelector('.post-card__body').addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.artist-trigger')) return;
        showPost(p);
      });

      card.querySelectorAll('.artist-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          openArtistProfile(el.dataset.artist);
        });
      });

      // Curtir (botão flutuante ou barra inferior)
      const handleLike = (e) => {
        e.stopPropagation();
        const activeUser = Auth.getUser();
        if (!activeUser) { openModal('authModal'); return; }
        const res = DB.toggleLike(p.id, activeUser.id);
        updateCardLikeUI(card, res.liked, res.likes);
      };
      card.querySelector('.like-btn')?.addEventListener('click', handleLike);
      card.querySelector('.stream-like-btn')?.addEventListener('click', handleLike);

      // Salvar no mural (Pinterest)
      card.querySelector('[data-save-pin]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openSavePinModal(p.id);
      });

      // Destaque no portfólio
      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = DB.updatePost(p.id, { portfolio: !p.portfolio });
        favBtn.classList.toggle('liked', !!updated.portfolio);
        toast(updated.portfolio ? 'Adicionado ao portfólio ⭐' : 'Removido do portfólio');
        renderPortfolio();
      });

      grid.appendChild(card);
    }
  }

  function updateCardLikeUI(card, liked, count) {
    const floatBtn = card.querySelector('.like-btn');
    if (floatBtn) floatBtn.classList.toggle('liked', liked);

    const streamBtn = card.querySelector('.stream-like-btn');
    if (streamBtn) {
      streamBtn.classList.toggle('text-red-600', liked);
      streamBtn.querySelector('span').textContent = liked ? '❤' : '🤍';
    }

    card.querySelectorAll('.like-count').forEach(el => {
      el.textContent = el.closest('.stream-like-btn') ? count : `❤ ${count}`;
    });
  }

  function triggerDoubleClickLike(card, post) {
    const heart = card.querySelector('.dbl-heart');
    if (heart) {
      heart.classList.remove('burst');
      void heart.offsetWidth;
      heart.classList.add('burst');
    }
    const user = Auth.getUser();
    if (!user) {
      toast('Entre na sua conta para curtir obras 🦅');
      return;
    }
    if (!DB.hasLiked(post.id, user.id)) {
      const res = DB.toggleLike(post.id, user.id);
      updateCardLikeUI(card, res.liked, res.likes);
    }
  }

  // ---------- Modal de Detalhes do Post + Comentários ----------
  async function showPost(p) {
    const imgUrl   = await imageFromStorage(p);
    const user     = Auth.getUser();
    const liked    = user ? DB.hasLiked(p.id, user.id) : false;
    const comments = DB.getCommentsByPost(p.id);

    $('#postModalTitle').textContent = p.title;
    $('#postModalBody').innerHTML = `
      <div class="rounded-xl overflow-hidden bg-carcara-100">
        <img src="${imgUrl}" alt="${p.title}" class="w-full max-h-[60vh] object-contain mx-auto" />
      </div>

      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2 cursor-pointer" id="modalArtistLink">
          <div class="w-9 h-9 rounded-full bg-carcara-600 text-white flex items-center justify-center font-bold text-sm">
            ${(p.artist || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="text-sm font-semibold hover:text-carcara-700">${p.artist}</p>
            <p class="text-xs text-sertao-700/60">${p.location || 'Piauí'} • <span class="capitalize">${p.tag}</span></p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="modalLikeBtn" class="px-3 py-1.5 rounded-full text-xs font-semibold border transition ${liked ? 'bg-red-600 text-white border-red-600' : 'border-carcara-200 hover:bg-carcara-100'}">
            ❤ <span id="modalLikeCount">${p.likes || 0}</span>
          </button>
          <button id="modalSavePinBtn" class="pin-save-btn">📌 Salvar em mural</button>
        </div>
      </div>

      ${p.description ? `<p class="text-sm text-sertao-800/90 leading-relaxed">${p.description}</p>` : ''}
      ${p.portfolio ? `<p class="text-xs text-carcara-600 font-semibold">⭐ Obra em destaque no portfólio</p>` : ''}

      <div class="border-t border-carcara-200 pt-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-sertao-700/70 mb-2">Comentários (${comments.length})</h5>
        <div id="postCommentsList" class="space-y-2 max-h-44 overflow-y-auto pr-1 mb-3">
          ${comments.length ? comments.map(c => `
            <div class="bg-carcara-50 border border-carcara-100 rounded-lg px-3 py-2 text-xs">
              <div class="flex justify-between items-center mb-0.5">
                <strong class="text-sertao-900">${c.userName}</strong>
                <span class="text-[10px] text-sertao-700/50">${timeAgo(c.createdAt)}</span>
              </div>
              <p class="text-sertao-800">${c.text}</p>
            </div>
          `).join('') : `<p class="text-xs text-sertao-700/50">Nenhum comentário ainda. Deixe sua impressão!</p>`}
        </div>

        <form id="postCommentForm" class="flex gap-2">
          <input name="comment" required placeholder="${user ? 'Escreva um comentário...' : 'Faça login para comentar...'}"
                 ${user ? '' : 'disabled'} class="form-input text-xs py-2" />
          <button type="submit" class="btn-primary text-xs px-4" ${user ? '' : 'disabled'}>Enviar</button>
        </form>
      </div>
    `;

    $('#modalArtistLink')?.addEventListener('click', () => {
      closeModal('postModal');
      openArtistProfile(p.artistId);
    });

    $('#modalSavePinBtn')?.addEventListener('click', () => {
      openSavePinModal(p.id);
    });

    $('#modalLikeBtn')?.addEventListener('click', () => {
      const u = Auth.getUser();
      if (!u) { closeModal('postModal'); openModal('authModal'); return; }
      const res = DB.toggleLike(p.id, u.id);
      const btn = $('#modalLikeBtn');
      btn.className = `px-3 py-1.5 rounded-full text-xs font-semibold border transition ${res.liked ? 'bg-red-600 text-white border-red-600' : 'border-carcara-200 hover:bg-carcara-100'}`;
      $('#modalLikeCount').textContent = res.likes;
      renderFeed();
    });

    $('#postCommentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = Auth.getUser();
      if (!u) return;
      const input = e.target.comment;
      if (!input.value.trim()) return;
      DB.addComment({ postId: p.id, userId: u.id, userName: u.name, text: input.value });
      showPost(p);
      renderFeed();
    });

    openModal('postModal');
  }

  // ---------- Salvar Pin em Mural (Pinterest) ----------
  function openSavePinModal(postId) {
    if (!Auth.isLogged()) {
      openModal('authModal');
      return;
    }
    const murais = DB.getMurais();
    const body = $('#savePinBody');

    body.innerHTML = `
      <p class="text-xs text-sertao-700/70">Escolha em quais murais deseja guardar esta referência:</p>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        ${murais.map(m => {
          const isSaved = m.postIds.includes(postId);
          return `
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-carcara-200 bg-carcara-50">
              <div>
                <p class="text-sm font-semibold text-sertao-900">${m.title}</p>
                <p class="text-[11px] text-sertao-700/60">${m.count} referências</p>
              </div>
              <button data-toggle-mural="${m.id}" class="pin-save-btn ${isSaved ? 'saved' : ''}">
                ${isSaved ? 'Salvo ✓' : 'Salvar'}
              </button>
            </div>`;
        }).join('')}
      </div>
      <div class="pt-2 border-t border-carcara-200">
        <button id="quickCreateMuralBtn" class="text-xs font-semibold text-carcara-700 hover:underline">
          + Criar novo mural para esta obra
        </button>
      </div>
    `;

    $$('[data-toggle-mural]', body).forEach(btn => {
      btn.addEventListener('click', () => {
        const saved = DB.togglePostInMural(btn.dataset.toggleMural, postId);
        btn.textContent = saved ? 'Salvo ✓' : 'Salvar';
        btn.classList.toggle('saved', saved);
        renderMurais();
        renderFeed();
        toast(saved ? 'Referência salva no mural! 📌' : 'Removida do mural');
      });
    });

    $('#quickCreateMuralBtn')?.addEventListener('click', () => {
      closeModal('savePinModal');
      openModal('muralModal');
    });

    openModal('savePinModal');
  }

  // ---------- Portfólio ----------
  async function renderPortfolio() {
    const grid = $('#portfolioGrid');
    const empty = $('#portfolioEmpty');
    if (!grid) return;

    const user = Auth.getUser();
    const posts = DB.getPosts().filter(p => p.portfolio);
    const filtered = user ? posts.filter(p => p.artistId === user.id) : posts;

    empty.classList.toggle('hidden', filtered.length > 0);
    grid.innerHTML = '';

    for (const p of filtered) {
      const imgUrl = await imageFromStorage(p);
      const card = document.createElement('article');
      card.className = 'post-card';
      card.innerHTML = `
        <span class="post-card__tag">⭐ Portfólio</span>
        <div class="post-card__media">
          <img src="${imgUrl}" alt="${p.title}" class="post-card__image aspect-square" loading="lazy" />
        </div>
        <div class="post-card__body">
          <h4 class="post-card__title line-clamp-2">${p.title}</h4>
          <div class="post-card__meta">
            <span>🎨 ${p.artist}</span><span>•</span><span class="capitalize">${p.tag}</span>
          </div>
        </div>`;
      card.addEventListener('click', () => showPost(p));
      grid.appendChild(card);
    }
  }

  // ---------- Murais ----------
  async function renderMurais() {
    const grid = $('#muraisGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const m of DB.getMurais()) {
      const imgUrl = m.imgKey ? (await DB.getImageURL(m.imgKey)) : m.img;
      const el = document.createElement('div');
      el.className = 'mural-card';
      el.innerHTML = `
        <img src="${imgUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80'}" alt="${m.title}" loading="lazy" />
        <div class="mural-card__overlay">
          <h4 class="mural-card__title">${m.title}</h4>
          <span class="mural-card__count">${m.count || 0} referências</span>
        </div>`;
      el.addEventListener('click', () => openMuralView(m));
      grid.appendChild(el);
    }
  }

  async function openMuralView(mural) {
    $('#muralViewTitle').textContent = mural.title;
    $('#muralViewDesc').textContent  = mural.description || `${mural.count} referências salvas`;
    const body = $('#muralViewBody');

    const allPosts = DB.getPosts();
    const savedPosts = allPosts.filter(p => (mural.postIds || []).includes(p.id));

    if (!savedPosts.length) {
      body.innerHTML = `<p class="text-sm text-sertao-700/60 text-center py-8">Este mural ainda não tem pins salvos. Clique em <strong>Salvar</strong> em qualquer obra do feed!</p>`;
      openModal('muralViewModal');
      return;
    }

    const cardsHtml = await Promise.all(savedPosts.map(async p => {
      const imgUrl = await imageFromStorage(p);
      return `
        <div class="rounded-xl overflow-hidden border border-carcara-200 bg-carcara-50 cursor-pointer mural-pin-item" data-post-id="${p.id}">
          <img src="${imgUrl}" alt="${p.title}" class="w-full h-44 object-cover" />
          <div class="p-2.5">
            <p class="text-xs font-semibold line-clamp-1">${p.title}</p>
            <p class="text-[11px] text-sertao-700/60">🎨 ${p.artist}</p>
          </div>
        </div>`;
    }));

    body.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${cardsHtml.join('')}</div>`;
    $$('.mural-pin-item', body).forEach(item => {
      item.addEventListener('click', () => {
        const post = allPosts.find(x => x.id === item.dataset.postId);
        if (post) {
          closeModal('muralViewModal');
          showPost(post);
        }
      });
    });

    openModal('muralViewModal');
  }

  // ---------- Oportunidades ----------
  let currentOpFilter = 'all';

  function renderOportunidades() {
    const grid = $('#oportunidadesGrid');
    if (!grid) return;

    const all = DB.getEditais();
    const list = currentOpFilter === 'all' ? all : all.filter(e => e.type === currentOpFilter);

    grid.innerHTML = list.map(e => `
      <article class="op-card">
        <span class="op-tag">${e.type}</span>
        <h4>${e.title}</h4>
        <p>${e.description || ''}</p>
        ${e.deadline ? `<span class="op-date">Até ${new Date(e.deadline).toLocaleDateString('pt-BR')}</span>` : ''}
        ${e.link ? `<a href="${e.link}" target="_blank" rel="noopener" class="block mt-2 text-xs text-carcara-300 underline">Ver mais →</a>` : ''}
      </article>
    `).join('') || `<p class="col-span-3 text-carcara-100/50 text-sm">Nenhuma oportunidade nesse filtro.</p>`;
  }

  // ---------- Artistas & Perfil Modal ----------
  function renderArtistas() {
    const grid = $('#artistasGrid');
    if (!grid) return;
    const users = DB.getUsers();
    grid.innerHTML = users.map(u => {
      const initial = (u.name || '?').charAt(0).toUpperCase();
      const followers = DB.getFollowersCount(u.id);
      return `
        <div class="artist-card" data-artist-card="${u.id}">
          <div class="artist-card__avatar">${initial}</div>
          <span class="artist-card__name line-clamp-1">${u.name}</span>
          <span class="text-[10px] text-sertao-700/60 line-clamp-1">${u.bio || 'Artista'}</span>
          <span class="text-[10px] font-semibold text-carcara-700">${followers} seguidores</span>
        </div>`;
    }).join('');

    $$('[data-artist-card]', grid).forEach(card => {
      card.addEventListener('click', () => openArtistProfile(card.dataset.artistCard));
    });
  }

  async function openArtistProfile(artistId) {
    const artist = DB.getUserById(artistId);
    if (!artist) return;

    const me = Auth.getUser();
    const posts = DB.getPosts().filter(p => p.artistId === artistId);
    const followers = DB.getFollowersCount(artistId);
    const following = me ? DB.isFollowing(me.id, artistId) : false;
    const initial = (artist.name || '?').charAt(0).toUpperCase();

    $('#artistModalTitle').textContent = artist.name;
    const body = $('#artistModalBody');

    const worksHtml = await Promise.all(posts.map(async p => {
      const imgUrl = await imageFromStorage(p);
      return `
        <div class="rounded-xl overflow-hidden border border-carcara-200 cursor-pointer artist-work" data-post-id="${p.id}">
          <img src="${imgUrl}" alt="${p.title}" class="w-full h-36 object-cover" />
          <p class="p-2 text-xs font-semibold line-clamp-1">${p.title}</p>
        </div>`;
    }));

    body.innerHTML = `
      <div class="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-carcara-200">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xl font-bold">${initial}</div>
          <div>
            <h5 class="font-display font-bold text-lg">${artist.name}</h5>
            <p class="text-xs text-sertao-700/70">${artist.bio || 'Artista piauiense'}</p>
            <p class="text-xs text-carcara-700 font-semibold mt-1">${posts.length} obras • <span id="artistFollowersCount">${followers}</span> seguidores</p>
          </div>
        </div>
        ${(!me || me.id !== artistId) ? `
          <button id="followArtistBtn" class="${following ? 'px-4 py-2 rounded-full text-xs font-semibold border border-carcara-600 text-carcara-700' : 'btn-primary'}">
            ${following ? 'Seguindo ✓' : '+ Seguir'}
          </button>` : `<span class="text-xs px-3 py-1 rounded-full bg-carcara-100 text-carcara-800 font-semibold">Seu perfil</span>`}
      </div>

      <div>
        <h6 class="text-xs font-bold uppercase tracking-wider text-sertao-700/70 mb-3">Obras publicadas</h6>
        ${worksHtml.length
          ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${worksHtml.join('')}</div>`
          : `<p class="text-xs text-sertao-700/60">Nenhuma obra publicada ainda.</p>`}
      </div>
    `;

    $('#followArtistBtn')?.addEventListener('click', () => {
      const current = Auth.getUser();
      if (!current) { closeModal('artistModal'); openModal('authModal'); return; }
      const nowFollowing = DB.toggleFollow(current.id, artistId);
      const btn = $('#followArtistBtn');
      btn.textContent = nowFollowing ? 'Seguindo ✓' : '+ Seguir';
      btn.className = nowFollowing
        ? 'px-4 py-2 rounded-full text-xs font-semibold border border-carcara-600 text-carcara-700'
        : 'btn-primary';
      $('#artistFollowersCount').textContent = DB.getFollowersCount(artistId);
      renderArtistas();
      renderStories();
      toast(nowFollowing ? `Seguindo ${artist.name} 🦅` : `Deixou de seguir ${artist.name}`);
    });

    $$('.artist-work', body).forEach(el => {
      el.addEventListener('click', () => {
        const post = posts.find(x => x.id === el.dataset.postId);
        if (post) {
          closeModal('artistModal');
          showPost(post);
        }
      });
    });

    openModal('artistModal');
  }

  // ---------- Auth form ----------
  let authMode = 'login';

  function initAuthForm() {
    const form    = $('#authForm');
    const error   = $('#authError');
    const tabLog  = $('#tabLogin');
    const tabReg  = $('#tabRegister');
    if (!form) return;

    const setMode = (mode) => {
      authMode = mode;
      tabLog.classList.toggle('active', mode === 'login');
      tabReg.classList.toggle('active', mode === 'register');
      form.name.parentElement.style.display = mode === 'register' ? '' : 'none';
      form.name.required = mode === 'register';
    };
    tabLog.addEventListener('click', () => setMode('login'));
    tabReg.addEventListener('click', () => setMode('register'));
    setMode('login');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const res = authMode === 'login'
        ? Auth.login(data.email, data.password)
        : Auth.register(data);

      if (!res.ok) {
        error.textContent = res.error;
        error.classList.remove('hidden');
        return;
      }
      error.classList.add('hidden');
      form.reset();
      closeModal('authModal');
      renderAll();
      toast(`Bem-vindo(a), ${res.user.name.split(' ')[0]}! 🦅`);
    });
  }

  // ---------- Publish form + Preview instantâneo ----------
  function initPublishForm() {
    const form = $('#publishForm');
    if (!form) return;

    const imgInput = $('#publishImageInput');
    const wrap     = $('#publishPreviewWrap');
    const preview  = $('#publishPreviewImg');

    imgInput?.addEventListener('change', () => {
      const file = imgInput.files?.[0];
      if (!file) { wrap.classList.add('hidden'); return; }
      preview.src = URL.createObjectURL(file);
      wrap.classList.remove('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = Auth.getUser();
      if (!user) { closeModal('publishModal'); openModal('authModal'); return; }

      const data = new FormData(form);
      const file = data.get('image');
      let imgKey = null;

      if (file && file.size > 0) {
        try { imgKey = await DB.saveImage(file); }
        catch (err) { console.warn(err); toast('Falha ao salvar imagem.'); return; }
      }

      DB.addPost({
        title: data.get('title'),
        tag: data.get('tag'),
        location: data.get('location'),
        description: data.get('description'),
        artist: user.name,
        artistId: user.id,
        imgKey,
        portfolio: !!data.get('portfolio'),
      });

      form.reset();
      wrap?.classList.add('hidden');
      closeModal('publishModal');
      renderAll();
      toast('Publicado no feed! 🦅');
    });
  }

  // ---------- Mural form ----------
  function initMuralForm() {
    const form = $('#muralForm');
    if (!form) return;
    $('#newMuralBtn').addEventListener('click', () => {
      if (!Auth.isLogged()) { openModal('authModal'); return; }
      openModal('muralModal');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const file = data.get('cover');
      let imgKey = null;
      if (file && file.size > 0) {
        try { imgKey = await DB.saveImage(file); } catch {}
      }
      DB.addMural({
        title: data.get('title'),
        description: data.get('description'),
        img: null,
        imgKey,
      });
      form.reset();
      closeModal('muralModal');
      renderMurais();
      toast('Mural criado! 📌');
    });
  }

  // ---------- Oportunidade form ----------
  function initOpForm() {
    const form = $('#opForm');
    if (!form) return;
    $('#newOportunidadeBtn').addEventListener('click', () => {
      if (!Auth.isLogged()) { openModal('authModal'); return; }
      openModal('opModal');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      DB.addEdital(data);
      form.reset();
      closeModal('opModal');
      renderOportunidades();
      toast('Oportunidade publicada! 🎉');
    });
  }

  // ---------- Filtros, Busca & Alternador de Layout ----------
  function initFilters() {
    $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderFeed();
    }));

    $$('.op-filter').forEach(btn => btn.addEventListener('click', () => {
      $$('.op-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOpFilter = btn.dataset.op;
      renderOportunidades();
    }));

    $('#feedSort')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderFeed();
    });

    const handleSearch = (val) => {
      currentSearch = val;
      renderFeed();
    };
    $('#feedSearch')?.addEventListener('input', (e) => handleSearch(e.target.value));
    $('#feedSearchMobile')?.addEventListener('input', (e) => handleSearch(e.target.value));

    const masonryBtn = $('#viewMasonryBtn');
    const streamBtn  = $('#viewStreamBtn');
    masonryBtn?.addEventListener('click', () => {
      feedLayout = 'masonry';
      masonryBtn.classList.add('active');
      streamBtn?.classList.remove('active');
      renderFeed();
    });
    streamBtn?.addEventListener('click', () => {
      feedLayout = 'stream';
      streamBtn.classList.add('active');
      masonryBtn?.classList.remove('active');
      renderFeed();
    });
  }

  // ---------- Modais (close) ----------
  function initModals() {
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
    $$('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeAllModals(); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });
  }

  // ---------- Hero buttons ----------
  function initHero() {
    $('#heroExplore')?.addEventListener('click', () => {
      document.getElementById('feed').scrollIntoView({ behavior: 'smooth' });
    });
    $('#heroPortfolio')?.addEventListener('click', () => {
      if (!Auth.isLogged()) { openModal('authModal'); return; }
      document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---------- Smooth scroll ----------
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    }));
  }

  // ---------- Render geral ----------
  function renderAll() {
    renderSessionArea();
    renderStories();
    renderFeed();
    renderPortfolio();
    renderMurais();
    renderOportunidades();
    renderArtistas();
  }

  function init() {
    initMenu();
    initModals();
    initFilters();
    initAuthForm();
    initPublishForm();
    initMuralForm();
    initOpForm();
    initHero();
    initSmoothScroll();
    renderAll();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);