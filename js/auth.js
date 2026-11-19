/* ==========================================
   Carcará — autenticação local (localStorage)
   ========================================== */

const Auth = (() => {
  let currentUser = DB.getSession();

  function refreshUser() {
    if (!currentUser) return null;
    const fresh = DB.getUserById(currentUser.id);
    if (fresh) {
      currentUser = {
        id: fresh.id,
        name: fresh.name,
        email: fresh.email,
        avatar: fresh.avatar,
        bio: fresh.bio,
        licensed: !!fresh.licensed,
      };
      DB.setSession(currentUser);
    }
    return currentUser;
  }

  function getUser() { return refreshUser(); }
  function isLogged() { return !!getUser(); }
  function hasLicense() {
    const u = getUser();
    return !!(u && u.licensed);
  }

  function login(email, password) {
    const user = DB.findUser(email);
    if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };

    // Verifica se há solicitação aprovada vinculada ao e-mail
    const req = DB.getUserLicenseRequest(email);
    const licensed = !!user.licensed || (req && req.status === 'approved');
    if (licensed && !user.licensed) {
      DB.setUserLicensed(user.id, true);
    }

    currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      licensed,
    };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  }

  function register({ name, email, password }) {
    if (!name || !email || !password) return { ok: false, error: 'Preencha todos os campos.' };
    if (DB.findUser(email)) return { ok: false, error: 'Este e-mail já está cadastrado.' };
    if (password.length < 4) return { ok: false, error: 'Senha muito curta (mín. 4).' };

    const req = DB.getUserLicenseRequest(email);
    const preApproved = !!(req && req.status === 'approved');

    const user = DB.addUser({ name, email, password });
    if (preApproved) {
      DB.setUserLicensed(user.id, true);
    }

    currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      licensed: preApproved,
    };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  }

  function logout() {
    currentUser = null;
    DB.clearSession();
  }

  return { getUser, isLogged, hasLicense, login, register, logout };
})();