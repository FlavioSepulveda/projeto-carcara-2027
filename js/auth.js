/* ==========================================
   Carcará — autenticação local (localStorage)
   ========================================== */

const Auth = (() => {
  let currentUser = DB.getSession();

  function getUser() { return currentUser; }
  function isLogged() { return !!currentUser; }

  function login(email, password) {
    const user = DB.findUser(email);
    if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };
    currentUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  }

  function register({ name, email, password }) {
    if (!name || !email || !password) return { ok: false, error: 'Preencha todos os campos.' };
    if (DB.findUser(email)) return { ok: false, error: 'Este e-mail já está cadastrado.' };
    if (password.length < 4) return { ok: false, error: 'Senha muito curta (mín. 4).' };

    const user = DB.addUser({ name, email, password });
    currentUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  }

  function logout() {
    currentUser = null;
    DB.clearSession();
  }

  return { getUser, isLogged, login, register, logout };
})();