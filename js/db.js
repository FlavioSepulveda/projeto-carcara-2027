const KEYS = {
  users:           'carcara:users',
  session:         'carcara:session',
  posts:           'carcara:posts',
  murais:          'carcara:murais',
  editais:         'carcara:editais',
  likes:           'carcara:likes',
  comments:        'carcara:comments',
  follows:         'carcara:follows',
  licenseRequests: 'carcara:license_requests',
  messages:        'carcara:messages',
  studentBoard:    'carcara:student_board',
};

const read  = (k) => JSON.parse(localStorage.getItem(k) || '[]');
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function seed() {
  if (read(KEYS.users).length === 0) {
    write(KEYS.users, [
      { id: 'demo', name: 'Artista Demo', email: 'demo@carcara.piaui', password: '1234', city: 'Teresina', bio: 'Estudante de Artes Visuais • Teresina 🎨', socialUrl: '', isStudent: true, institution: 'Artes Visuais • UFPI', openToWork: true, avatar: null, licensed: true },
      { id: 'clara', name: 'Clara Mendes', email: 'clara@carcara.piaui', password: '1234', city: 'Oeiras', bio: 'Ceramista e pesquisadora de barro do Poti 🏺', socialUrl: '', isStudent: false, institution: '', openToWork: true, avatar: null, licensed: true },
      { id: 'joao', name: 'João Carnaúba', email: 'joao@carcara.piaui', password: '1234', city: 'Parnaíba', bio: 'Xilogravura e memória sertaneja 🪵', socialUrl: '', isStudent: false, institution: '', openToWork: false, avatar: null, licensed: true },
    ]);
  }

  if (read(KEYS.posts).length === 0) {
    const now = Date.now();
    write(KEYS.posts, [
      {
        id: 'p1',
        title: 'Série "Sertão Vivo" — estudo em óleo',
        tag: 'pintura',
        availability: 'encomendas',
        medium: 'Óleo sobre tela',
        dimensions: '60x80cm',
        artist: 'Artista Demo',
        artistId: 'demo',
        location: 'Teresina',
        likes: 12,
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=80',
          'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=80',
        ],
        description: 'Estudo de luz e temperatura cromática sobre tela de algodão cru (etapas do processo).',
        createdAt: now - 100000,
        portfolio: true,
      },
      { id: 'p2', title: 'Gravura em linóleo: o carcará', tag: 'gravura', availability: 'venda', medium: 'Linoleogravura', dimensions: '30x42cm', artist: 'João Carnaúba', artistId: 'joao', location: 'Parnaíba', likes: 19, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=80', description: 'Primeira tiragem em linóleo sobre papel artesanal 180g.', createdAt: now - 200000, portfolio: false },
      { id: 'p3', title: 'Vaso cerâmico — argila local do Poti', tag: 'ceramica', availability: 'encomendas', medium: 'Argila queimada', dimensions: '25x18cm', artist: 'Clara Mendes', artistId: 'clara', location: 'Oeiras', likes: 27, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80', description: 'Argila coletada nas margens do rio e queimada em forno a lenha.', createdAt: now - 300000, portfolio: true },
      { id: 'p4', title: 'Retratos do bairro Vermelha', tag: 'fotografia', availability: 'acervo', medium: 'Fotografia Digital', artist: 'Artista Demo', artistId: 'demo', location: 'Teresina', likes: 15, img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700&q=80', description: 'Série fotográfica documental em luz natural de fim de tarde.', createdAt: now - 400000, portfolio: false },
    ]);
  }

  if (read(KEYS.murais).length === 0) {
    write(KEYS.murais, [
      { id: 'm1', title: 'Paletas do Sertão', description: 'Ocres, terracotas e dourados da paisagem piauiense.', postIds: ['p1'], img: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=500&q=80' },
      { id: 'm2', title: 'Gravura & Textura', description: 'Referências de matrizes, sulcos e impressão.', postIds: ['p2'], img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80' },
      { id: 'm3', title: 'Cerâmica Contemporânea', description: 'Formas orgânicas e queimas experimentais.', postIds: ['p3'], img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80' },
    ]);
  }

  if (read(KEYS.editais).length === 0) {
    write(KEYS.editais, [
      { id: genId(), title: 'PNAB Piauí — Artes Visuais', type: 'edital', description: 'Inscrições abertas para projetos de circulação e formação artística no Piauí.', deadline: '2026-12-15', link: '', createdAt: Date.now() },
      { id: genId(), title: 'Salão de Artes de Teresina', type: 'exposicao', description: 'Chamada para artistas visuais apresentarem obras na mostra coletiva anual.', deadline: '2026-11-30', link: '', createdAt: Date.now() },
    ]);
  }

  if (read(KEYS.studentBoard).length === 0) {
    write(KEYS.studentBoard, [
      {
        id: genId(),
        category: 'materiais',
        title: 'Doação de sobras de argila e ferramentas de modelagem',
        institution: 'Artes Visuais • UFPI',
        description: 'Tenho cerca de 4kg de argila branca embalada e espátulas de madeira sobrando do semestre passado. Entrego no CCE.',
        authorId: 'demo',
        authorName: 'Artista Demo',
        createdAt: Date.now() - 3600000,
      },
      {
        id: genId(),
        category: 'pesquisa',
        title: 'Grupo de Estudos em Arte Digital, Shaders e Jogos Autorais',
        institution: 'UFPI • Teresina',
        description: 'Encontros semanais às quintas-feiras para prototipar jogos experimentais e discutir estética piauiense nos games.',
        authorId: 'clara',
        authorName: 'Clara Mendes',
        createdAt: Date.now() - 7200000,
      },
    ]);
  }

  if (read(KEYS.messages).length === 0) {
    write(KEYS.messages, [
      {
        id: genId(),
        fromId: 'clara',
        toId: 'demo',
        text: 'Oi! Vi sua série Sertão Vivo, você aceita encomendas ou troca de obras para exposição coletiva em Teresina?',
        read: false,
        createdAt: Date.now() - 1800000,
      },
    ]);
  }
}

let idbPromise = null;
function openIDB() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open('carcara-images', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('images')) req.result.createObjectStore('images');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return idbPromise;
}

seed();

export const DB = {
  genId,
  // Users
  getUsers: () => read(KEYS.users),
  findUser: (email) => read(KEYS.users).find(u => u.email === email),
  getUserById: (id) => read(KEYS.users).find(u => u.id === id),
  addUser(user) {
    const users = read(KEYS.users);
    const created = { ...user, id: genId(), city: 'Piauí', bio: 'Membro da comunidade Carcará 🦅', socialUrl: '', isStudent: false, institution: '', openToWork: false, avatar: null, licensed: false };
    users.push(created);
    write(KEYS.users, users);
    return created;
  },
  updateUser(userId, patch) {
    const users = read(KEYS.users);
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return null;
    users[idx] = { ...users[idx], ...patch };
    write(KEYS.users, users);

    if (patch.name) {
      const posts = read(KEYS.posts).map(p =>
        p.artistId === userId ? { ...p, artist: patch.name } : p
      );
      write(KEYS.posts, posts);
    }

    const session = JSON.parse(localStorage.getItem(KEYS.session) || 'null');
    if (session && session.id === userId) {
      localStorage.setItem(KEYS.session, JSON.stringify({ ...session, ...patch }));
    }
    return users[idx];
  },
  setUserLicensed(userId, status = true, bioUpdate = null, cityUpdate = null) {
    const patch = { licensed: status };
    if (bioUpdate) patch.bio = bioUpdate;
    if (cityUpdate) patch.city = cityUpdate;
    return this.updateUser(userId, patch);
  },

  // Session
  getSession: () => JSON.parse(localStorage.getItem(KEYS.session) || 'null'),
  setSession: (u) => localStorage.setItem(KEYS.session, JSON.stringify(u)),
  clearSession: () => localStorage.removeItem(KEYS.session),

  // Licenças & Fila
  getLicenseRequests: () => read(KEYS.licenseRequests).sort((a, b) => a.createdAt - b.createdAt),
  getUserLicenseRequest: (emailOrId) =>
    read(KEYS.licenseRequests).find(r => r.userId === emailOrId || r.email === emailOrId),
  getQueuePosition(emailOrId) {
    const pending = read(KEYS.licenseRequests)
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
    const index = pending.findIndex(r => r.userId === emailOrId || r.email === emailOrId);
    return index >= 0 ? { position: index + 1, total: pending.length } : null;
  },
  submitLicenseRequest(payload) {
    const list = read(KEYS.licenseRequests).filter(
      r => r.email !== payload.email && (!payload.userId || r.userId !== payload.userId)
    );
    const req = { id: genId(), status: 'pending', createdAt: Date.now(), ...payload };
    list.push(req);
    write(KEYS.licenseRequests, list);
    return req;
  },
  approveLicenseRequest(emailOrId) {
    const list = read(KEYS.licenseRequests);
    const req = list.find(r => r.userId === emailOrId || r.email === emailOrId);
    if (req) { req.status = 'approved'; write(KEYS.licenseRequests, list); }
    const user = read(KEYS.users).find(u => u.id === emailOrId || u.email === emailOrId);
    if (user) {
      const bio = req ? `Artista visual • ${req.city} (${req.specialty}) 🎨` : user.bio;
      this.setUserLicensed(user.id, true, bio, req?.city || user.city);
    }
  },

  // Área dos Estudantes
  getStudentPosts: () => read(KEYS.studentBoard).sort((a, b) => b.createdAt - a.createdAt),
  addStudentPost(item) {
    const list = read(KEYS.studentBoard);
    const created = { ...item, id: genId(), createdAt: Date.now() };
    list.push(created);
    write(KEYS.studentBoard, list);
    return created;
  },

  // Mensagens Diretas (DM)
  getUnreadCount(userId) {
    return read(KEYS.messages).filter(m => m.toId === userId && !m.read).length;
  },
  getConversations(userId) {
    const all = read(KEYS.messages)
      .filter(m => m.fromId === userId || m.toId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    const map = new Map();
    for (const m of all) {
      const partnerId = m.fromId === userId ? m.toId : m.fromId;
      if (!map.has(partnerId)) {
        const unread = all.filter(x => x.fromId === partnerId && x.toId === userId && !x.read).length;
        map.set(partnerId, { partnerId, lastMessage: m, unread });
      }
    }
    return Array.from(map.values());
  },
  getThread(userA, userB) {
    return read(KEYS.messages)
      .filter(m => (m.fromId === userA && m.toId === userB) || (m.fromId === userB && m.toId === userA))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
  sendMessage({ fromId, toId, text, contextPost = null }) {
    const list = read(KEYS.messages);
    const msg = { id: genId(), fromId, toId, text: text.trim(), contextPost, read: false, createdAt: Date.now() };
    list.push(msg);
    write(KEYS.messages, list);
    return msg;
  },
  markThreadRead(currentUserId, partnerId) {
    const list = read(KEYS.messages);
    let changed = false;
    for (const m of list) {
      if (m.fromId === partnerId && m.toId === currentUserId && !m.read) {
        m.read = true;
        changed = true;
      }
    }
    if (changed) write(KEYS.messages, list);
  },

  // Posts, Likes & Comentários
  getPosts: () => read(KEYS.posts).sort((a, b) => b.createdAt - a.createdAt),
  addPost(post) {
    const posts = read(KEYS.posts);
    const created = { ...post, id: genId(), createdAt: Date.now(), likes: 0 };
    posts.push(created);
    write(KEYS.posts, posts);
    return created;
  },
  updatePost(id, patch) {
    const posts = read(KEYS.posts);
    const idx = posts.findIndex(p => p.id === id);
    if (idx < 0) return null;
    posts[idx] = { ...posts[idx], ...patch };
    write(KEYS.posts, posts);
    return posts[idx];
  },
  hasLiked: (postId, userId) => read(KEYS.likes).some(l => l.postId === postId && l.userId === userId),
  toggleLike(postId, userId) {
    const likes = read(KEYS.likes);
    const posts = read(KEYS.posts);
    const post = posts.find(p => p.id === postId);
    if (!post) return { liked: false, likes: 0 };
    const idx = likes.findIndex(l => l.postId === postId && l.userId === userId);
    if (idx >= 0) {
      likes.splice(idx, 1);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      write(KEYS.posts, posts); write(KEYS.likes, likes);
      return { liked: false, likes: post.likes };
    }
    likes.push({ postId, userId });
    post.likes = (post.likes || 0) + 1;
    write(KEYS.posts, posts); write(KEYS.likes, likes);
    return { liked: true, likes: post.likes };
  },
  getCommentsByPost: (postId) => read(KEYS.comments).filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt),
  addComment({ postId, userId, userName, text }) {
    const list = read(KEYS.comments);
    const item = { id: genId(), postId, userId, userName, text: text.trim(), createdAt: Date.now() };
    list.push(item);
    write(KEYS.comments, list);
    return item;
  },

  // Follows
  isFollowing: (followerId, targetId) => read(KEYS.follows).some(f => f.followerId === followerId && f.targetId === targetId),
  getFollowersCount: (targetId) => read(KEYS.follows).filter(f => f.targetId === targetId).length,
  toggleFollow(followerId, targetId) {
    const list = read(KEYS.follows);
    const idx = list.findIndex(f => f.followerId === followerId && f.targetId === targetId);
    if (idx >= 0) { list.splice(idx, 1); write(KEYS.follows, list); return false; }
    list.push({ followerId, targetId }); write(KEYS.follows, list); return true;
  },

  // Murais & Editais
  getMurais: () => read(KEYS.murais).map(m => ({ ...m, postIds: m.postIds || [], count: (m.postIds || []).length })),
  addMural(m) {
    const list = read(KEYS.murais);
    const created = { ...m, id: genId(), postIds: [], count: 0 };
    list.push(created); write(KEYS.murais, list); return created;
  },
  togglePostInMural(muralId, postId) {
    const list = read(KEYS.murais);
    const mural = list.find(m => m.id === muralId);
    if (!mural) return false;
    mural.postIds = mural.postIds || [];
    const idx = mural.postIds.indexOf(postId);
    const saved = idx < 0;
    saved ? mural.postIds.push(postId) : mural.postIds.splice(idx, 1);
    mural.count = mural.postIds.length;
    write(KEYS.murais, list);
    return saved;
  },
  isPostSavedAnywhere: (postId) => read(KEYS.murais).some(m => (m.postIds || []).includes(postId)),
  getEditais: () => read(KEYS.editais).sort((a, b) => b.createdAt - a.createdAt),
  addEdital(e) {
    const list = read(KEYS.editais);
    const created = { ...e, id: genId(), createdAt: Date.now() };
    list.push(created); write(KEYS.editais, list); return created;
  },

  // Imagens & Álbuns
  async saveImage(file) {
    const db = await openIDB();
    const key = genId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(file, key);
      tx.oncomplete = () => resolve(key);
      tx.onerror = () => reject(tx.error);
    });
  },
  async getImageURL(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const req = tx.objectStore('images').get(key);
      req.onsuccess = () => resolve(req.result ? URL.createObjectURL(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  },
  async resolvePostImages(post) {
    const urls = [];
    if (Array.isArray(post.images) && post.images.length > 0) {
      urls.push(...post.images);
    }
    if (Array.isArray(post.imgKeys) && post.imgKeys.length > 0) {
      for (const k of post.imgKeys) {
        const u = await this.getImageURL(k);
        if (u) urls.push(u);
      }
    }
    if (urls.length === 0) {
      if (post.img) urls.push(post.img);
      else if (post.imgKey) {
        const u = await this.getImageURL(post.imgKey);
        if (u) urls.push(u);
      }
    }
    return urls.length > 0 ? urls : ['https://via.placeholder.com/500?text=🦅'];
  },
  async resolvePostImage(post) {
    const urls = await this.resolvePostImages(post);
    return urls[0];
  },
};