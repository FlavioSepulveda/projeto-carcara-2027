import { DB } from './db.js';
import { openDialog, closeDialog, toast } from './ui.js';

let currentUser = DB.getSession();

export const Auth = {
  getUser() {
    if (!currentUser) return null;
    const fresh = DB.getUserById(currentUser.id);
    if (fresh) {
      currentUser = { id: fresh.id, name: fresh.name, email: fresh.email, bio: fresh.bio, licensed: !!fresh.licensed };
      DB.setSession(currentUser);
    }
    return currentUser;
  },
  isLogged() { return !!this.getUser(); },
  hasLicense() { const u = this.getUser(); return !!(u && u.licensed); },

  login(email, password) {
    const user = DB.findUser(email);
    if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };
    currentUser = { id: user.id, name: user.name, email: user.email, bio: user.bio, licensed: !!user.licensed };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  },

  register({ name, email, password }) {
    if (!name || !email || !password) return { ok: false, error: 'Preencha todos os campos.' };
    if (DB.findUser(email)) return { ok: false, error: 'Este e-mail já está cadastrado.' };
    const req = DB.getUserLicenseRequest(email);
    const user = DB.addUser({ name, email, password });
    if (req && req.status === 'approved') DB.setUserLicensed(user.id, true);
    currentUser = { id: user.id, name: user.name, email: user.email, bio: user.bio, licensed: !!(req && req.status === 'approved') };
    DB.setSession(currentUser);
    return { ok: true, user: currentUser };
  },

  logout() {
    currentUser = null;
    DB.clearSession();
  },
};

export function openAuthDialog(onSuccess) {
  let mode = 'login';
  openDialog({
    title: 'Entrar no Carcará',
    size: 'max-w-md',
    html: `
      <div class="flex gap-2 mb-4">
        <button type="button" id="tabLogin" class="tab active">Entrar</button>
        <button type="button" id="tabRegister" class="tab">Cadastrar</button>
      </div>
      <form id="authDialogForm" class="space-y-3">
        <div id="authNameWrap" class="hidden">
          <label class="form-label">Nome</label>
          <input name="name" class="form-input" placeholder="Seu nome artístico" />
        </div>
        <div>
          <label class="form-label">E-mail</label>
          <input name="email" type="email" required class="form-input" placeholder="voce@email.com" />
        </div>
        <div>
          <label class="form-label">Senha</label>
          <input name="password" type="password" required minlength="4" class="form-input" placeholder="••••••" />
        </div>
        <p id="authErr" class="text-red-600 text-xs hidden"></p>
        <button type="submit" class="btn-primary w-full justify-center">Continuar</button>
      </form>`,
    onMount(root) {
      const form = root.querySelector('#authDialogForm');
      const nameWrap = root.querySelector('#authNameWrap');
      const err = root.querySelector('#authErr');

      const switchMode = (m) => {
        mode = m;
        root.querySelector('#tabLogin').classList.toggle('active', m === 'login');
        root.querySelector('#tabRegister').classList.toggle('active', m === 'register');
        nameWrap.classList.toggle('hidden', m === 'login');
        form.name.required = m === 'register';
      };

      root.querySelector('#tabLogin').onclick = () => switchMode('login');
      root.querySelector('#tabRegister').onclick = () => switchMode('register');

      form.onsubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const res = mode === 'login' ? Auth.login(data.email, data.password) : Auth.register(data);
        if (!res.ok) {
          err.textContent = res.error;
          err.classList.remove('hidden');
          return;
        }
        closeDialog();
        toast(`Bem-vindo(a), ${res.user.name.split(' ')[0]}! 🦅`);
        if (onSuccess) onSuccess();
      };
    },
  });
}