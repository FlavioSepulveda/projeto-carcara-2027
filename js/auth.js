import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../src/firebase.ts';
import { checkWaitlistStatus, isPublicLaunchEnabled, ADMIN_EMAIL } from '../src/waitlist.ts';
import { DB } from './db.js';
import { toast, openDialog, closeDialog } from './ui.js';

/** Sincroniza o usuário autenticado no Firebase com o perfil local e checa aprovação na fila */
async function syncFirebaseUser(fbUser, fallbackName = null) {
  const cleanEmail = fbUser.email.trim().toLowerCase();
  const [waitlistEntry, publicOpen] = await Promise.all([
    checkWaitlistStatus(cleanEmail).catch(() => null),
    isPublicLaunchEnabled().catch(() => false),
  ]);

  const isApproved =
    cleanEmail === ADMIN_EMAIL ||
    publicOpen ||
    (waitlistEntry && waitlistEntry.status === 'approved');

  let localUser = DB.findUser(cleanEmail);

  if (!localUser) {
    localUser = DB.addUser({
      name: (waitlistEntry?.artistName || fbUser.displayName || fallbackName || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      password: null,
      provider: 'firebase',
      avatarUrl: fbUser.photoURL || null,
      city: waitlistEntry?.city || 'Piauí',
      licensed: !!isApproved,
    });
  } else {
    const patch = {};
    if (fbUser.photoURL && !localUser.avatarUrl) patch.avatarUrl = fbUser.photoURL;
    if (isApproved && !localUser.licensed) {
      patch.licensed = true;
      if (waitlistEntry?.city) patch.city = waitlistEntry.city;
    }
    if (Object.keys(patch).length > 0) {
      localUser = DB.updateUser(localUser.id, patch);
    }
  }

  DB.setSession(localUser);
  return localUser;
}

export const Auth = {
  getUser() {
    const s = DB.getSession();
    if (!s) return null;
    return DB.getUserById(s.id) || s;
  },
  isLogged() {
    return !!this.getUser();
  },
  hasLicense() {
    const u = this.getUser();
    return !!(u && u.licensed);
  },
  isAdmin() {
    const u = this.getUser();
    return !!(u && u.email?.toLowerCase() === ADMIN_EMAIL);
  },
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    // Mantém suporte à conta local de demonstração
    if (cleanEmail === 'demo@carcara.piaui' && password === '1234') {
      const demo = DB.findUser(cleanEmail);
      DB.setSession(demo);
      return demo;
    }
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return syncFirebaseUser(cred.user);
  },
  async register({ name, email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(cred.user, { displayName: name.trim() });
    return syncFirebaseUser(cred.user, name.trim());
  },
  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return syncFirebaseUser(result.user);
  },
  async logout() {
    try { await signOut(auth); } catch {}
    DB.clearSession();
  },
};

const GOOGLE_BTN_HTML = `
  <button type="button" id="googleAuthBtn"
          class="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs py-2.5 px-4 rounded-xl border border-carcara-300 shadow-sm transition">
    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
    <span>Continuar com Google</span>
  </button>

  <div class="relative flex py-1 items-center">
    <div class="flex-grow border-t border-carcara-200"></div>
    <span class="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-sertao-700/50 font-semibold">ou use seu e-mail</span>
    <div class="flex-grow border-t border-carcara-200"></div>
  </div>
`;

export function openAuthDialog(onSuccess = null) {
  openDialog({
    title: 'Entrar no Carcará 🦅',
    size: 'max-w-md',
    html: `
      <div class="space-y-4">
        ${GOOGLE_BTN_HTML}

        <div class="grid grid-cols-2 gap-1.5 bg-carcara-100 p-1 rounded-full">
          <button type="button" data-auth-tab="login" class="auth-tab py-1.5 rounded-full text-xs font-semibold bg-white text-sertao-900 shadow-sm">
            Entrar
          </button>
          <button type="button" data-auth-tab="register" class="auth-tab py-1.5 rounded-full text-xs font-semibold text-sertao-700">
            Criar conta
          </button>
        </div>

        <p id="authErrorMsg" class="hidden text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"></p>

        <form id="loginForm" class="space-y-3">
          <div>
            <label class="form-label">E-mail</label>
            <input name="email" type="email" required class="form-input" placeholder="seu@email.com" />
          </div>
          <div>
            <label class="form-label">Senha</label>
            <input name="password" type="password" required class="form-input" placeholder="••••••" />
          </div>
          <button type="submit" class="btn-primary w-full justify-center py-2.5">Entrar</button>

          <div class="pt-2 border-t border-carcara-100 flex items-center justify-between text-[11px] text-sertao-700/70">
            <span>Testar rápido sem conta:</span>
            <button type="button" id="quickDemoBtn" class="text-carcara-700 font-semibold hover:underline">
              Usar Conta Demo
            </button>
          </div>
        </form>

        <form id="registerForm" class="hidden space-y-3">
          <div>
            <label class="form-label">Nome ou nome artístico</label>
            <input name="name" required class="form-input" placeholder="Ex: Maria do Carmo" />
          </div>
          <div>
            <label class="form-label">E-mail</label>
            <input name="email" type="email" required class="form-input" placeholder="seu@email.com" />
          </div>
          <div>
            <label class="form-label">Senha</label>
            <input name="password" type="password" minlength="6" required class="form-input" placeholder="Mínimo 6 caracteres" />
          </div>
          <p class="text-[11px] text-sertao-700/70 leading-relaxed">
            Se seu e-mail já foi aprovado como <strong>Beta Tester</strong>, sua licença de artista é ativada automaticamente ao entrar!
          </p>
          <button type="submit" class="btn-primary w-full justify-center py-2.5">Criar conta</button>
        </form>
      </div>`,
    onMount(root) {
      const errBox = root.querySelector('#authErrorMsg');
      const loginF = root.querySelector('#loginForm');
      const regF   = root.querySelector('#registerForm');
      const tabs   = root.querySelectorAll('.auth-tab');

      const showError = (msg) => {
        errBox.textContent = msg;
        errBox.classList.remove('hidden');
      };

      tabs.forEach(tab => {
        tab.onclick = () => {
          errBox.classList.add('hidden');
          const isLogin = tab.dataset.authTab === 'login';
          tabs.forEach(t => {
            t.className = 'auth-tab py-1.5 rounded-full text-xs font-semibold text-sertao-700';
          });
          tab.className = 'auth-tab py-1.5 rounded-full text-xs font-semibold bg-white text-sertao-900 shadow-sm';
          loginF.classList.toggle('hidden', !isLogin);
          regF.classList.toggle('hidden', isLogin);
        };
      });

      root.querySelector('#googleAuthBtn').onclick = async () => {
        const btn = root.querySelector('#googleAuthBtn');
        btn.disabled = true;
        try {
          const user = await Auth.loginWithGoogle();
          closeDialog();
          toast(user.licensed
            ? `Licença Beta ativa! Bem-vindo, ${user.name}! 🦅✨`
            : `Conectado como ${user.name}! 🦅`);
          if (onSuccess) onSuccess(user);
        } catch (err) {
          showError(err.message || 'Erro ao conectar com o Google.');
        } finally {
          btn.disabled = false;
        }
      };

      root.querySelector('#quickDemoBtn').onclick = async () => {
        const user = await Auth.login('demo@carcara.piaui', '1234');
        closeDialog();
        toast(`Bem-vindo, ${user.name}! 🦅`);
        if (onSuccess) onSuccess(user);
      };

      loginF.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(loginF);
        try {
          const user = await Auth.login(fd.get('email'), fd.get('password'));
          closeDialog();
          toast(`Bem-vindo de volta, ${user.name}! 🦅`);
          if (onSuccess) onSuccess(user);
        } catch (err) {
          showError('E-mail ou senha inválidos.');
        }
      };

      regF.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(regF);
        try {
          const user = await Auth.register({
            name: fd.get('name'),
            email: fd.get('email'),
            password: fd.get('password'),
          });
          closeDialog();
          toast(user.licensed
            ? `Acesso Beta liberado! Bem-vindo, ${user.name}! 🦅✨`
            : `Conta criada! Bem-vindo, ${user.name}! 🦅`);
          if (onSuccess) onSuccess(user);
        } catch (err) {
          showError(err.message || 'Não foi possível criar a conta.');
        }
      };
    },
  });
}