import { CONFIG } from './config.js';
import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, $$, toast, openDialog, closeDialog, timeAgo } from './ui.js';
import { openMessagesDialog } from './messages.js';

let currentOpFilter = 'all';
let currentStudentFilter = 'all';

async function resolveAvatarHtml(user, sizeClass = 'w-16 h-16 text-2xl') {
  if (user.avatarKey) {
    const url = await DB.getImageURL(user.avatarKey);
    if (url) {
      return `<img src="${url}" alt="${user.name}" class="${sizeClass} rounded-full object-cover border-2 border-carcara-300 shrink-0 shadow-sm" />`;
    }
  }
  if (user.avatarUrl) {
    return `<img src="${user.avatarUrl}" alt="${user.name}" class="${sizeClass} rounded-full object-cover border-2 border-carcara-300 shrink-0 shadow-sm" />`;
  }
  return `
    <div class="${sizeClass} rounded-full bg-carcara-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm border-2 border-carcara-300">
      ${(user.name || '?').charAt(0).toUpperCase()}
    </div>`;
}

export async function renderPortfolio(onSelectPost) {
  const grid = $('#portfolioGrid');
  const empty = $('#portfolioEmpty');
  if (!grid) return;

  const user = Auth.getUser();
  const posts = DB.getPosts().filter(p => p.portfolio);
  const filtered = user ? posts.filter(p => p.artistId === user.id) : posts;

  empty.classList.toggle('hidden', filtered.length > 0);
  grid.innerHTML = '';

  for (const p of filtered) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML = `
      <span class="post-card__tag">⭐ Portfólio</span>
      <div class="post-card__media"><img src="${await DB.resolvePostImage(p)}" class="post-card__image aspect-square" loading="lazy" /></div>
      <div class="post-card__body">
        <h4 class="post-card__title line-clamp-2">${p.title}</h4>
        <div class="post-card__meta"><span>🎨 ${p.artist}</span><span>•</span><span class="capitalize">${p.tag}</span></div>
      </div>`;
    card.onclick = () => onSelectPost && onSelectPost(p);
    grid.appendChild(card);
  }
}

export function renderOportunidades() {
  const grid = $('#oportunidadesGrid');
  if (!grid) return;
  const list = DB.getEditais().filter(e => currentOpFilter === 'all' || e.type === currentOpFilter);

  grid.innerHTML = list.map(e => `
    <article class="op-card">
      <span class="op-tag">${e.type}</span>
      <h4>${e.title}</h4>
      <p>${e.description || ''}</p>
      ${e.deadline ? `<span class="op-date">Até ${new Date(e.deadline).toLocaleDateString('pt-BR')}</span>` : ''}
      ${e.link ? `<a href="${e.link}" target="_blank" rel="noopener" class="block mt-2 text-xs text-carcara-300 underline">Ver mais →</a>` : ''}
    </article>`).join('') || `<p class="col-span-3 text-carcara-100/50 text-sm">Nenhuma oportunidade nesse filtro.</p>`;
}

export function initOportunidadesControls() {
  const box = $('#opFilters');
  if (box) {
    box.innerHTML = CONFIG.OP_FILTERS.map((f, i) =>
      `<button data-op="${f.id}" class="op-filter ${i === 0 ? 'active' : ''}">${f.label}</button>`
    ).join('');
    $$('.op-filter', box).forEach(btn => {
      btn.onclick = () => {
        $$('.op-filter', box).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentOpFilter = btn.dataset.op;
        renderOportunidades();
      };
    });
  }

  $('#newOportunidadeBtn')?.addEventListener('click', () => {
    if (!Auth.isLogged()) { openAuthDialog(); return; }
    openDialog({
      title: 'Sugerir edital ou oportunidade',
      size: 'max-w-md',
      html: `
        <form id="opDialogForm" class="space-y-3">
          <div><label class="form-label">Título</label><input name="title" required class="form-input" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="form-label">Tipo</label><select name="type" class="form-input"><option value="edital">Edital</option><option value="exposicao">Exposição</option><option value="residencia">Residência</option><option value="formacao">Formação</option></select></div>
            <div><label class="form-label">Prazo</label><input name="deadline" type="date" class="form-input" /></div>
          </div>
          <div><label class="form-label">Descrição</label><textarea name="description" rows="2" class="form-input"></textarea></div>
          <div><label class="form-label">Link (opcional)</label><input name="link" type="url" class="form-input" placeholder="https://" /></div>
          <button type="submit" class="btn-primary w-full justify-center">Publicar</button>
        </form>`,
      onMount(root) {
        root.querySelector('#opDialogForm').onsubmit = (e) => {
          e.preventDefault();
          DB.addEdital(Object.fromEntries(new FormData(e.target)));
          closeDialog();
          renderOportunidades();
          toast('Oportunidade publicada! 🎉');
        };
      },
    });
  });
}

// ======================================================
// ÁREA DOS ESTUDANTES (Mural Acadêmico & Troca de Materiais)
// ======================================================
export function renderStudentBoard() {
  const grid = $('#studentBoardGrid');
  if (!grid) return;

  const list = DB.getStudentPosts().filter(
    item => currentStudentFilter === 'all' || item.category === currentStudentFilter
  );

  const catLabels = {
    materiais: '🎨 Materiais',
    pesquisa:  '📚 Pesquisa / Monitoria',
    mostra:    '🖼️ Mostra / Ateliê',
  };

  grid.innerHTML = list.map(item => `
    <article class="bg-white rounded-2xl border border-carcara-200 p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <span class="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-carcara-100 text-carcara-800">
            ${catLabels[item.category] || item.category}
          </span>
          <span class="text-[11px] text-sertao-700/50">${timeAgo(item.createdAt)}</span>
        </div>
        <h4 class="font-display font-bold text-lg text-sertao-900 leading-snug mb-1.5">${item.title}</h4>
        <p class="text-xs text-sertao-700/80 leading-relaxed">${item.description}</p>
      </div>

      <div class="pt-3 border-t border-carcara-100 flex items-center justify-between gap-2">
        <div>
          <p class="text-xs font-semibold text-sertao-900">${item.authorName}</p>
          <p class="text-[11px] text-carcara-700"><i class="bi bi-mortarboard-fill mr-1"></i>${item.institution || 'UFPI'}</p>
        </div>
        <button data-student-dm="${item.authorId}" data-student-topic="${item.title}"
                class="px-3 py-1.5 rounded-full text-xs font-semibold bg-sertao-900 text-carcara-100 hover:bg-sertao-800 transition shrink-0">
          <i class="bi bi-chat-dots-fill mr-1"></i> Contatar
        </button>
      </div>
    </article>`).join('') || `<p class="col-span-3 text-center text-sertao-700/60 py-10 text-sm">Nenhum aviso estudantil publicado nessa categoria ainda.</p>`;

  $$('[data-student-dm]', grid).forEach(btn => {
    btn.onclick = () => {
      const me = Auth.getUser();
      if (me && me.id === btn.dataset.studentDm) {
        toast('Este aviso foi publicado por você! 🎓');
        return;
      }
      openMessagesDialog({
        targetUserId: btn.dataset.studentDm,
        contextPost: `Área Estudantil: ${btn.dataset.studentTopic}`,
      });
    };
  });
}

export function initStudentBoardControls() {
  const box = $('#studentFilters');
  if (box) {
    box.innerHTML = CONFIG.STUDENT_FILTERS.map((f, i) =>
      `<button data-st-filter="${f.id}" class="filter-btn ${i === 0 ? 'active' : ''}">${f.label}</button>`
    ).join('');

    $$('.filter-btn', box).forEach(btn => {
      btn.onclick = () => {
        $$('.filter-btn', box).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStudentFilter = btn.dataset.stFilter;
        renderStudentBoard();
      };
    });
  }

  $('#newStudentPostBtn')?.addEventListener('click', () => {
    const user = Auth.getUser();
    if (!user) { openAuthDialog(); return; }

    openDialog({
      title: 'Publicar na Área dos Estudantes',
      size: 'max-w-md',
      html: `
        <form id="studentPostForm" class="space-y-3">
          <div>
            <label class="form-label">Categoria</label>
            <select name="category" class="form-input">
              <option value="materiais">🎨 Troca / Doação / Venda de Materiais</option>
              <option value="pesquisa">📚 Grupo de Pesquisa & Monitoria</option>
              <option value="mostra">🖼️ Mostra Acadêmica & Ateliê</option>
            </select>
          </div>
          <div>
            <label class="form-label">Título do aviso</label>
            <input name="title" required class="form-input" placeholder="Ex: Vendo cavalete de madeira ou Busco dupla p/ exposição" />
          </div>
          <div>
            <label class="form-label">Curso / Instituição</label>
            <input name="institution" required value="${user.institution || 'Artes Visuais • UFPI'}" class="form-input" />
          </div>
          <div>
            <label class="form-label">Detalhes</label>
            <textarea name="description" rows="3" required class="form-input" placeholder="Descreva o material, horário do grupo ou local no campus..."></textarea>
          </div>
          <button type="submit" class="btn-primary w-full justify-center">Publicar no mural 🎓</button>
        </form>`,
      onMount(root) {
        root.querySelector('#studentPostForm').onsubmit = (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          DB.addStudentPost({
            ...data,
            authorId: user.id,
            authorName: user.name,
          });
          closeDialog();
          renderStudentBoard();
          toast('Aviso publicado na Área dos Estudantes! 🎓');
        };
      },
    });
  });
}

// ======================================================
// ARTISTAS & PERFIL COMPLETO
// ======================================================
export async function renderArtistas(onSelectPost, onProfileUpdated = null) {
  const grid = $('#artistasGrid');
  if (!grid) return;
  const artists = DB.getUsers().filter(u => u.licensed);

  const cards = await Promise.all(artists.map(async u => {
    const avatarHtml = await resolveAvatarHtml(u, 'w-16 h-16 text-xl');
    return `
      <div class="artist-card" data-artist-id="${u.id}">
        ${avatarHtml}
        <span class="artist-card__name line-clamp-1">${u.name} <i class="bi bi-patch-check-fill text-carcara-600 text-[11px]"></i></span>
        <span class="text-[10px] text-sertao-700/60 line-clamp-1">${u.isStudent ? `🎓 ${u.institution || 'UFPI'}` : (u.city || 'Piauí')}</span>
        ${u.openToWork ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">🟢 Encomendas</span>` : `<span class="text-[10px] font-semibold text-carcara-700">${DB.getFollowersCount(u.id)} seguidores</span>`}
      </div>`;
  }));

  grid.innerHTML = cards.join('');

  $$('[data-artist-id]', grid).forEach(el => {
    el.onclick = () => openArtistProfile(el.dataset.artistId, onSelectPost, onProfileUpdated);
  });
}

export async function openArtistProfile(artistId, onSelectPost, onProfileUpdated = null) {
  const artist = DB.getUserById(artistId);
  if (!artist) return;

  const me        = Auth.getUser();
  const isMe      = me && me.id === artistId;
  const allPosts  = DB.getPosts().filter(p => p.artistId === artistId);
  const portPosts = allPosts.filter(p => p.portfolio);
  const following = me ? DB.isFollowing(me.id, artistId) : false;
  const avatar    = await resolveAvatarHtml(artist, 'w-16 h-16 text-2xl');

  const buildWorksGrid = async (list, emptyMsg) => {
    if (!list.length) return `<p class="text-xs text-sertao-700/60 py-6 text-center">${emptyMsg}</p>`;
    const items = await Promise.all(list.map(async p => `
      <div class="group relative rounded-xl overflow-hidden border border-carcara-200 cursor-pointer bg-carcara-50" data-work-id="${p.id}">
        <img src="${await DB.resolvePostImage(p)}" class="w-full h-36 object-cover group-hover:scale-105 transition duration-300" />
        <div class="p-2">
          <p class="text-xs font-semibold line-clamp-1">${p.title}</p>
          <p class="text-[10px] text-sertao-700/60 capitalize">${p.tag === 'jogos' ? '🎮 Jogos' : p.tag} • ❤ ${p.likes || 0}</p>
        </div>
      </div>`));
    return `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${items.join('')}</div>`;
  };

  const worksTabHtml     = await buildWorksGrid(allPosts, artist.licensed ? 'Nenhuma obra publicada ainda.' : 'Este perfil ainda não possui licença para publicar obras.');
  const portfolioTabHtml = await buildWorksGrid(portPosts, 'Nenhuma obra destacada no portfólio (★).');

  openDialog({
    title: isMe ? 'Meu Perfil' : 'Perfil do Artista',
    size: 'max-w-2xl',
    html: `
      <div class="space-y-5">
        <div class="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-carcara-200">
          <div class="flex items-center gap-3.5">
            ${avatar}
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h5 class="font-display font-bold text-xl text-sertao-900">${artist.name}</h5>
                ${artist.licensed
                  ? `<span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold"><i class="bi bi-patch-check-fill"></i> Licenciado</span>`
                  : `<span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-carcara-100 text-carcara-800 font-semibold">Visitante</span>`}
                ${artist.isStudent ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-carcara-200 text-sertao-900 font-semibold">🎓 ${artist.institution || 'Estudante'}</span>` : ''}
                ${artist.openToWork ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">🟢 Aberto a encomendas</span>` : ''}
              </div>
              <p class="text-xs text-sertao-700/80 mt-1">${artist.bio || 'Comunidade Carcará • Piauí'}</p>
              <div class="flex items-center gap-3 text-[11px] text-sertao-700/60 mt-1.5 flex-wrap">
                <span><i class="bi bi-geo-alt-fill text-carcara-600"></i> ${artist.city || 'Piauí'}</span>
                ${artist.socialUrl ? `<a href="${artist.socialUrl}" target="_blank" rel="noopener" class="text-carcara-700 font-medium hover:underline"><i class="bi bi-link-45deg"></i> Portfólio / itch.io</a>` : ''}
              </div>
              <p class="text-xs text-carcara-700 font-semibold mt-2">
                ${allPosts.length} obras • <span id="profFollowers">${DB.getFollowersCount(artistId)}</span> seguidores
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${isMe ? `
              <button id="toggleEditProfileBtn" class="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-carcara-300 text-carcara-800 hover:bg-carcara-100 transition">
                <i class="bi bi-pencil-square mr-1"></i> Editar perfil
              </button>` : `
              <button id="profDmBtn" class="px-4 py-2 rounded-full text-xs font-semibold bg-sertao-900 text-carcara-100 hover:bg-sertao-800 transition">
                <i class="bi bi-chat-dots-fill mr-1"></i> Mensagem
              </button>
              <button id="profFollowBtn" class="${following ? 'px-4 py-2 rounded-full text-xs font-semibold border border-carcara-600 text-carcara-700' : 'btn-primary'}">
                ${following ? 'Seguindo ✓' : '+ Seguir'}
              </button>`}
          </div>
        </div>

        ${isMe ? `
          <form id="editProfileForm" class="hidden bg-carcara-50 border border-carcara-200 rounded-2xl p-4 space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider text-carcara-800">Editar informações do perfil</p>
            <div>
              <label class="form-label">Foto de perfil (opcional)</label>
              <input name="avatarFile" type="file" accept="image/*" class="form-input bg-white text-xs" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Nome artístico</label>
                <input name="name" value="${artist.name}" required class="form-input bg-white" />
              </div>
              <div>
                <label class="form-label">Município (PI)</label>
                <input name="city" value="${artist.city || ''}" placeholder="Ex: Teresina" class="form-input bg-white" />
              </div>
            </div>
            <div>
              <label class="form-label">Bio / Pesquisa artística</label>
              <input name="bio" value="${artist.bio || ''}" placeholder="Conte um pouco sobre seu trabalho..." class="form-input bg-white" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Link externo (Instagram, itch.io, Behance)</label>
                <input name="socialUrl" type="url" value="${artist.socialUrl || ''}" placeholder="https://" class="form-input bg-white" />
              </div>
              <div>
                <label class="form-label">Instituição / Curso (se estudante)</label>
                <input name="institution" value="${artist.institution || ''}" placeholder="Ex: Artes Visuais • UFPI" class="form-input bg-white" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5 pt-1">
              <label class="flex items-center gap-2 text-xs font-medium text-sertao-800 cursor-pointer">
                <input type="checkbox" name="isStudent" ${artist.isStudent ? 'checked' : ''} class="accent-carcara-600" />
                🎓 Sou estudante de artes / instituição de ensino
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-sertao-800 cursor-pointer">
                <input type="checkbox" name="openToWork" ${artist.openToWork ? 'checked' : ''} class="accent-carcara-600" />
                🟢 Disponível para encomendas, comissões e projetos
              </label>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" id="cancelEditProfileBtn" class="px-3 py-1.5 rounded-full text-xs font-semibold text-sertao-700 hover:bg-carcara-200">Cancelar</button>
              <button type="submit" class="btn-primary text-xs">Salvar alterações</button>
            </div>
          </form>` : ''}

        <div>
          <div class="flex gap-2 border-b border-carcara-200 pb-2 mb-3">
            <button type="button" data-prof-tab="works" class="prof-tab text-xs font-semibold px-3 py-1.5 rounded-full bg-carcara-600 text-white">
              Processos (${allPosts.length})
            </button>
            <button type="button" data-prof-tab="portfolio" class="prof-tab text-xs font-semibold px-3 py-1.5 rounded-full text-sertao-700 hover:bg-carcara-100">
              ⭐ Portfólio (${portPosts.length})
            </button>
          </div>

          <div id="profTabWorks">${worksTabHtml}</div>
          <div id="profTabPortfolio" class="hidden">${portfolioTabHtml}</div>
        </div>
      </div>`,
    onMount(root) {
      root.querySelectorAll('.prof-tab').forEach(tab => {
        tab.onclick = () => {
          root.querySelectorAll('.prof-tab').forEach(t => {
            t.className = 'prof-tab text-xs font-semibold px-3 py-1.5 rounded-full text-sertao-700 hover:bg-carcara-100';
          });
          tab.className = 'prof-tab text-xs font-semibold px-3 py-1.5 rounded-full bg-carcara-600 text-white';
          const isWorks = tab.dataset.profTab === 'works';
          root.querySelector('#profTabWorks').classList.toggle('hidden', !isWorks);
          root.querySelector('#profTabPortfolio').classList.toggle('hidden', isWorks);
        };
      });

      const editForm = root.querySelector('#editProfileForm');
      root.querySelector('#toggleEditProfileBtn')?.addEventListener('click', () => {
        editForm?.classList.toggle('hidden');
      });
      root.querySelector('#cancelEditProfileBtn')?.addEventListener('click', () => {
        editForm?.classList.add('hidden');
      });
      editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(editForm);
        const file = fd.get('avatarFile');
        const patch = {
          name: fd.get('name').trim(),
          city: fd.get('city').trim(),
          bio: fd.get('bio').trim(),
          socialUrl: fd.get('socialUrl').trim(),
          institution: fd.get('institution').trim(),
          isStudent: !!fd.get('isStudent'),
          openToWork: !!fd.get('openToWork'),
        };
        if (file && file.size > 0) {
          patch.avatarKey = await DB.saveImage(file);
        }
        DB.updateUser(artistId, patch);
        toast('Perfil atualizado com sucesso! 🦅');
        await renderArtistas(onSelectPost, onProfileUpdated);
        if (onProfileUpdated) onProfileUpdated();
        openArtistProfile(artistId, onSelectPost, onProfileUpdated);
      });

      root.querySelector('#profDmBtn')?.addEventListener('click', () => {
        closeDialog();
        openMessagesDialog({ targetUserId: artistId });
      });

      root.querySelector('#profFollowBtn')?.addEventListener('click', (e) => {
        const u = Auth.getUser();
        if (!u) { closeDialog(); openAuthDialog(); return; }
        const now = DB.toggleFollow(u.id, artistId);
        e.currentTarget.textContent = now ? 'Seguindo ✓' : '+ Seguir';
        e.currentTarget.className = now
          ? 'px-4 py-2 rounded-full text-xs font-semibold border border-carcara-600 text-carcara-700'
          : 'btn-primary';
        root.querySelector('#profFollowers').textContent = DB.getFollowersCount(artistId);
        renderArtistas(onSelectPost, onProfileUpdated);
      });

      root.querySelectorAll('[data-work-id]').forEach(el => {
        el.onclick = () => {
          const post = allPosts.find(x => x.id === el.dataset.workId);
          if (post && onSelectPost) { closeDialog(); onSelectPost(post); }
        };
      });
    },
  });
}