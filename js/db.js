/* ==========================================
   Carcará — camada de dados local
   Funciona 100% no navegador.
   ========================================== */

const DB = (() => {
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
  };

  // ---------- Helpers localStorage ----------
  const read  = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Seed (dados iniciais) ----------
  function seed() {
    if (read(KEYS.users).length === 0) {
      write(KEYS.users, [
        {
          id: 'demo',
          name: 'Artista Demo',
          email: 'demo@carcara.piaui',
          password: '1234',
          avatar: null,
          bio: 'Estudante de Artes Visuais • Teresina 🎨',
          licensed: true,
        },
        {
          id: 'clara',
          name: 'Clara Mendes',
          email: 'clara@carcara.piaui',
          password: '1234',
          avatar: null,
          bio: 'Ceramista e pesquisadora de barro do Poti 🏺',
          licensed: true,
        },
        {
          id: 'joao',
          name: 'João Carnaúba',
          email: 'joao@carcara.piaui',
          password: '1234',
          avatar: null,
          bio: 'Xilogravura e memória sertaneja 🪵',
          licensed: true,
        }
      ]);
    }

    if (read(KEYS.posts).length === 0) {
      const now = Date.now();
      write(KEYS.posts, [
        { id: 'p1', title: 'Série "Sertão Vivo" — estudo em óleo', tag: 'pintura',
          artist: 'Artista Demo', artistId: 'demo', location: 'Teresina',
          likes: 12, img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=80',
          description: 'Estudo de luz e temperatura cromática sobre tela de algodão cru.', createdAt: now - 100000, portfolio: true },
        { id: 'p2', title: 'Gravura em linóleo: o carcará', tag: 'gravura',
          artist: 'João Carnaúba', artistId: 'joao', location: 'Parnaíba',
          likes: 19, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=80',
          description: 'Primeira tiragem em linóleo sobre papel artesanal 180g.', createdAt: now - 200000, portfolio: false },
        { id: 'p3', title: 'Vaso cerâmico — argila local do Poti', tag: 'ceramica',
          artist: 'Clara Mendes', artistId: 'clara', location: 'Oeiras',
          likes: 27, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80',
          description: 'Argila coletada nas margens do rio e queimada em forno a lenha.', createdAt: now - 300000, portfolio: true },
        { id: 'p4', title: 'Retratos do bairro Vermelha', tag: 'fotografia',
          artist: 'Artista Demo', artistId: 'demo', location: 'Teresina',
          likes: 15, img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700&q=80',
          description: 'Série fotográfica documental em luz natural de fim de tarde.', createdAt: now - 400000, portfolio: false },
        { id: 'p5', title: 'Escultura digital — Totem Cerrado', tag: '3d',
          artist: 'João Carnaúba', artistId: 'joao', location: 'Floriano',
          likes: 9, img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=700&q=80',
          description: 'Modelagem orgânica no Blender inspirada em formas vegetais.', createdAt: now - 500000, portfolio: true },
        { id: 'p6', title: 'Aquarela: encontro dos rios', tag: 'pintura',
          artist: 'Clara Mendes', artistId: 'clara', location: 'Teresina',
          likes: 22, img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=700&q=80',
          description: 'Aquarela feita ao ar livre no Parque Ambiental Encontro dos Rios.', createdAt: now - 600000, portfolio: false },
      ]);
    }

    if (read(KEYS.murais).length === 0) {
      write(KEYS.murais, [
        { id: 'm1', title: 'Anatomia para Artes', description: 'Estudos de figura humana, gestual e proporção.', postIds: ['p1', 'p4'],
          img: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=500&q=80' },
        { id: 'm2', title: 'Paletas do Sertão', description: 'Ocres, terracotas e dourados da paisagem piauiense.', postIds: ['p1', 'p6'],
          img: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=500&q=80' },
        { id: 'm3', title: 'Gravura & Textura', description: 'Referências de matrizes, sulcos e impressão.', postIds: ['p2'],
          img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80' },
        { id: 'm4', title: 'Cerâmica Contemporânea', description: 'Formas orgânicas e queimas experimentais.', postIds: ['p3'],
          img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80' },
      ]);
    }

    if (read(KEYS.comments).length === 0) {
      write(KEYS.comments, [
        { id: genId(), postId: 'p1', userId: 'clara', userName: 'Clara Mendes', text: 'Essa paleta ocre ficou incrível!', createdAt: Date.now() - 50000 },
        { id: genId(), postId: 'p3', userId: 'demo', userName: 'Artista Demo', text: 'A textura da argila ficou muito expressiva.', createdAt: Date.now() - 40000 },
      ]);
    }

    if (read(KEYS.editais).length === 0) {
      write(KEYS.editais, [
        { id: genId(), title: 'PNAB Piauí — Artes Visuais', type: 'edital',
          description: 'Inscrições abertas para projetos de circulação e formação artística no Piauí.',
          deadline: '2026-12-15', link: '', createdAt: Date.now() },
        { id: genId(), title: 'Salão de Artes de Teresina', type: 'exposicao',
          description: 'Chamada para artistas visuais apresentarem obras na mostra coletiva anual.',
          deadline: '2026-11-30', link: '', createdAt: Date.now() },
        { id: genId(), title: 'Residência Ninho do Carcará', type: 'residencia',
          description: 'Programa de residência artística e troca de ateliê para estudantes de Artes Visuais.',
          deadline: '2027-01-10', link: '', createdAt: Date.now() },
      ]);
    }
  }

  // ---------- Users ----------
  const getUsers    = () => read(KEYS.users);
  const saveUsers   = (u) => write(KEYS.users, u);
  const findUser    = (email) => getUsers().find(u => u.email === email);
  const getUserById = (id) => getUsers().find(u => u.id === id);

  // Novos cadastros começam como visitantes (licensed: false) até solicitarem/receberem licença
  const addUser = (user) => {
    const users = getUsers();
    const newUser = {
      ...user,
      id: genId(),
      avatar: null,
      bio: 'Membro da comunidade Carcará 🦅',
      licensed: false,
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  };

  const setUserLicensed = (userId, status = true, bioUpdate = null) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return null;
    users[idx].licensed = status;
    if (bioUpdate) users[idx].bio = bioUpdate;
    saveUsers(users);

    const session = getSession();
    if (session && session.id === userId) {
      setSession({ ...session, licensed: status, bio: users[idx].bio });
    }
    return users[idx];
  };

  // ---------- License Requests ----------
  const getLicenseRequests = () => read(KEYS.licenseRequests);

  const getUserLicenseRequest = (emailOrId) =>
    getLicenseRequests().find(r => r.userId === emailOrId || r.email === emailOrId);

  const submitLicenseRequest = (payload) => {
    const list = getLicenseRequests().filter(
      r => r.email !== payload.email && (!payload.userId || r.userId !== payload.userId)
    );
    const req = {
      id: genId(),
      status: 'pending',
      createdAt: Date.now(),
      ...payload,
    };
    list.push(req);
    write(KEYS.licenseRequests, list);
    return req;
  };

  const approveLicenseRequest = (emailOrId) => {
    const list = getLicenseRequests();
    const req = list.find(r => r.userId === emailOrId || r.email === emailOrId);
    if (req) {
      req.status = 'approved';
      write(KEYS.licenseRequests, list);
    }
    const users = getUsers();
    const user = users.find(u => u.id === emailOrId || u.email === emailOrId);
    if (user) {
      const bio = req ? `Artista visual • ${req.city} (${req.specialty}) 🎨` : user.bio;
      setUserLicensed(user.id, true, bio);
    }
  };

  // ---------- Session ----------
  const getSession   = () => JSON.parse(localStorage.getItem(KEYS.session) || 'null');
  const setSession   = (u) => localStorage.setItem(KEYS.session, JSON.stringify(u));
  const clearSession = () => localStorage.removeItem(KEYS.session);

  // ---------- Posts ----------
  const getPosts   = () => read(KEYS.posts).sort((a,b) => b.createdAt - a.createdAt);
  const addPost    = (post) => {
    const posts = read(KEYS.posts);
    const newPost = { ...post, id: genId(), createdAt: Date.now(), likes: 0 };
    posts.push(newPost);
    write(KEYS.posts, posts);
    return newPost;
  };
  const updatePost = (id, patch) => {
    const posts = read(KEYS.posts);
    const idx = posts.findIndex(p => p.id === id);
    if (idx < 0) return null;
    posts[idx] = { ...posts[idx], ...patch };
    write(KEYS.posts, posts);
    return posts[idx];
  };
  const deletePost = (id) => write(KEYS.posts, read(KEYS.posts).filter(p => p.id !== id));

  // ---------- Likes ----------
  const getLikes   = () => read(KEYS.likes);
  const toggleLike = (postId, userId) => {
    const likes = getLikes();
    const idx = likes.findIndex(l => l.postId === postId && l.userId === userId);
    const posts = read(KEYS.posts);
    const post = posts.find(p => p.id === postId);
    if (!post) return { liked: false };
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
  };
  const hasLiked   = (postId, userId) => getLikes().some(l => l.postId === postId && l.userId === userId);

  // ---------- Comments ----------
  const getCommentsByPost = (postId) =>
    read(KEYS.comments).filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);

  const addComment = ({ postId, userId, userName, text }) => {
    const list = read(KEYS.comments);
    const item = { id: genId(), postId, userId, userName, text: text.trim(), createdAt: Date.now() };
    list.push(item);
    write(KEYS.comments, list);
    return item;
  };

  // ---------- Follows ----------
  const getFollows     = () => read(KEYS.follows);
  const isFollowing    = (followerId, targetId) =>
    getFollows().some(f => f.followerId === followerId && f.targetId === targetId);
  const getFollowersCount = (targetId) =>
    getFollows().filter(f => f.targetId === targetId).length;
  const toggleFollow   = (followerId, targetId) => {
    const list = getFollows();
    const idx = list.findIndex(f => f.followerId === followerId && f.targetId === targetId);
    if (idx >= 0) {
      list.splice(idx, 1);
      write(KEYS.follows, list);
      return false;
    }
    list.push({ followerId, targetId });
    write(KEYS.follows, list);
    return true;
  };

  // ---------- Murais ----------
  const getMurais = () => read(KEYS.murais).map(m => ({
    ...m,
    postIds: Array.isArray(m.postIds) ? m.postIds : [],
    count: Array.isArray(m.postIds) ? m.postIds.length : (m.count || 0),
  }));

  const addMural = (m) => {
    const list = read(KEYS.murais);
    const newM = { ...m, id: genId(), postIds: m.postIds || [], count: (m.postIds || []).length };
    list.push(newM);
    write(KEYS.murais, list);
    return newM;
  };

  const togglePostInMural = (muralId, postId) => {
    const list = read(KEYS.murais);
    const mural = list.find(m => m.id === muralId);
    if (!mural) return false;
    mural.postIds = Array.isArray(mural.postIds) ? mural.postIds : [];
    const idx = mural.postIds.indexOf(postId);
    let saved;
    if (idx >= 0) {
      mural.postIds.splice(idx, 1);
      saved = false;
    } else {
      mural.postIds.push(postId);
      saved = true;
    }
    mural.count = mural.postIds.length;
    write(KEYS.murais, list);
    return saved;
  };

  const isPostSavedAnywhere = (postId) =>
    getMurais().some(m => m.postIds.includes(postId));

  // ---------- Editais ----------
  const getEditais = () => read(KEYS.editais).sort((a,b) => b.createdAt - a.createdAt);
  const addEdital  = (e) => {
    const list = read(KEYS.editais);
    const newE = { ...e, id: genId(), createdAt: Date.now() };
    list.push(newE); write(KEYS.editais, list);
    return newE;
  };

  // ---------- IndexedDB para imagens ----------
  const IMG_DB = 'carcara-images';
  let idbPromise = null;

  function openIDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IMG_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return idbPromise;
  }

  async function saveImage(file) {
    const db = await openIDB();
    const key = genId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(file, key);
      tx.oncomplete = () => resolve(key);
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function getImageURL(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const req = tx.objectStore('images').get(key);
      req.onsuccess = () => {
        if (!req.result) return resolve(null);
        resolve(URL.createObjectURL(req.result));
      };
      req.onerror = () => reject(req.error);
    });
  }

  seed();

  return {
    getUsers, findUser, getUserById, addUser, saveUsers, setUserLicensed,
    getLicenseRequests, getUserLicenseRequest, submitLicenseRequest, approveLicenseRequest,
    getSession, setSession, clearSession,
    getPosts, addPost, updatePost, deletePost,
    toggleLike, hasLiked,
    getCommentsByPost, addComment,
    isFollowing, getFollowersCount, toggleFollow,
    getMurais, addMural, togglePostInMural, isPostSavedAnywhere,
    getEditais, addEdital,
    saveImage, getImageURL,
    genId,
  };
})();