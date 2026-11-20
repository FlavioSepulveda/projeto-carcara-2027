import { CONFIG } from './config.js';
import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, toast, openDialog, closeDialog } from './ui.js';

export function renderLicenseSection(onStateChange) {
  const box = $('#licenseStatusBox');
  if (!box) return;

  const user = Auth.getUser();
  if (user) {
    if ($('#licName') && !$('#licName').value) $('#licName').value = user.name;
    if ($('#licEmail') && !$('#licEmail').value) $('#licEmail').value = user.email;
  }

  const savedWaitlistEmail = localStorage.getItem('carcara:waitlist_email');
  const lookupKey = user ? user.email : savedWaitlistEmail;
  const existingReq = lookupKey ? DB.getUserLicenseRequest(lookupKey) : null;

  if (user && Auth.hasLicense()) {
    box.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="bi bi-patch-check-fill text-emerald-400 text-xl"></i>
        <div>
          <p class="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Licença Ativa</p>
          <p class="text-sm font-bold text-white">${user.name} — Artista Verificado</p>
          <button id="licPublishNow" class="mt-2.5 bg-carcara-500 hover:bg-carcara-400 text-sertao-900 font-semibold text-xs px-4 py-1.5 rounded-full">
            + Publicar obra agora
          </button>
        </div>
      </div>`;
    $('#licPublishNow').onclick = () => openPublishFlow(onStateChange);
    return;
  }

  if (existingReq && existingReq.status === 'pending') {
    box.innerHTML = `
      <div class="space-y-2">
        <p class="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <i class="bi bi-envelope-check-fill mr-1"></i> Inscrito na fila de lançamento
        </p>
        <p class="text-sm font-bold text-white">${existingReq.artistName}</p>
        <p class="text-xs text-carcara-100/80 leading-relaxed">
          Seu e-mail (<strong>${existingReq.email}</strong>) está registrado. Você receberá um aviso oficial assim que o acesso for liberado!
        </p>
      </div>`;
    return;
  }

  if (!user) {
    box.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-wider text-carcara-300 font-semibold">Pré-lançamento</p>
          <p class="text-sm font-bold text-white mt-0.5">Lista de espera aberta</p>
          <p class="text-xs text-carcara-100/70 mt-1">Cadastre seu e-mail ao lado para ser avisado no lançamento oficial.</p>
        </div>
        <button id="licLoginBtn" class="btn-primary text-xs shrink-0">Entrar</button>
      </div>`;
    $('#licLoginBtn').onclick = () => openAuthDialog(onStateChange);
    return;
  }

  box.innerHTML = `
    <p class="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">Conta em modo leitor</p>
    <p class="text-sm font-bold text-white mt-0.5">${user.name}</p>
    <p class="text-xs text-carcara-100/70 mt-1">Envie o formulário ao lado para entrar na fila de credenciamento e receber o e-mail de liberação.</p>`;
}

export function initLicenseForm(onStateChange) {
  const form = $('#licenseForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Registrando na fila...';

    const user = Auth.getUser();
    const data = Object.fromEntries(new FormData(form));

    try {
      if (CONFIG.WAITLIST_ENDPOINT && !CONFIG.WAITLIST_ENDPOINT.includes('SEU_CODIGO_AQUI')) {
        const res = await fetch(CONFIG.WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            ...data,
            _subject: `Nova inscrição na fila Carcará: ${data.artistName} (${data.city})`,
            registeredAt: new Date().toLocaleString('pt-BR'),
          }),
        });
        if (!res.ok) throw new Error('Falha ao registrar na fila online.');
      }

      DB.submitLicenseRequest({ userId: user ? user.id : null, ...data });
      localStorage.setItem('carcara:waitlist_email', data.email);

      renderLicenseSection(onStateChange);
      toast('Inscrição confirmada! Avisaremos no seu e-mail no lançamento 🦅✉️');
    } catch {
      toast('Não foi possível enviar agora. Verifique sua conexão e tente novamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

export function openPublishFlow(onPublished) {
  const user = Auth.getUser();
  if (!user) { openAuthDialog(() => openPublishFlow(onPublished)); return; }

  if (!Auth.hasLicense()) {
    openDialog({
      title: 'Licença de Artista necessária',
      size: 'max-w-md',
      html: `
        <div class="text-center space-y-4 py-2">
          <i class="bi bi-patch-exclamation-fill text-4xl text-carcara-600"></i>
          <h5 class="font-display font-bold text-lg">Publicação restrita a artistas licenciados</h5>
          <p class="text-xs text-sertao-700/80">Entre na fila de espera para receber por e-mail o convite oficial de publicação assim que o lote abrir.</p>
          <a href="#licenca" id="jumpLicenseBtn" class="btn-primary justify-center">Entrar na Fila de Espera</a>
        </div>`,
      onMount(root) {
        root.querySelector('#jumpLicenseBtn').onclick = () => closeDialog();
      },
    });
    return;
  }

  openDialog({
    title: 'Publicar novo processo ou obra',
    size: 'max-w-lg',
    html: `
      <form id="pubDialogForm" class="space-y-3">
        <div>
          <label class="form-label">Capa / Captura de tela</label>
          <input id="pubImgInput" name="image" type="file" accept="image/*" required class="form-input text-xs" />
          <img id="pubPreview" class="hidden mt-2 w-full h-44 object-cover rounded-xl border border-carcara-200" />
        </div>

        <div>
          <label class="form-label">Título</label>
          <input name="title" required class="form-input" placeholder="Ex: Série Sertão Vivo ou Protótipo Lenda do Cabeça de Cuia" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Linguagem / Técnica</label>
            <select id="pubTagSelect" name="tag" class="form-input">
              <option value="pintura">Pintura</option>
              <option value="gravura">Gravura</option>
              <option value="ceramica">Cerâmica</option>
              <option value="fotografia">Fotografia</option>
              <option value="3d">3D</option>
              <option value="jogos">Jogos / Game Art</option>
            </select>
          </div>
          <div>
            <label class="form-label">Disponibilidade</label>
            <select name="availability" class="form-input">
              <option value="acervo">🔒 Apenas acervo</option>
              <option value="encomendas">🟢 Aberto a encomendas</option>
              <option value="venda">🏷️ Obra à venda</option>
            </select>
          </div>
        </div>

        <!-- Campo exclusivo quando selecionar Jogos / Game Art -->
        <div id="pubGameLinkWrap" class="hidden bg-carcara-50 border border-carcara-200 rounded-xl p-3">
          <label class="form-label">Link jogável / Demo (itch.io, Vercel, GitHub)</label>
          <input name="playableUrl" type="url" class="form-input bg-white" placeholder="https://seuprojeto.itch.io/jogo" />
        </div>

        <!-- Ficha Técnica Opcional -->
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="form-label">Suporte / Engine</label>
            <input name="medium" class="form-input text-xs" placeholder="Ex: Óleo / Godot" />
          </div>
          <div>
            <label class="form-label">Dimensões</label>
            <input name="dimensions" class="form-input text-xs" placeholder="Ex: 60x80cm" />
          </div>
          <div>
            <label class="form-label">Ano / Local</label>
            <input name="location" class="form-input text-xs" placeholder="2026 • Teresina" />
          </div>
        </div>

        <div>
          <label class="form-label">Descrição do processo</label>
          <textarea name="description" rows="2" class="form-input" placeholder="Conte sobre a pesquisa, mecânicas ou materiais..."></textarea>
        </div>

        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" name="portfolio" class="accent-carcara-600" /> Destacar no meu Portfólio
        </label>

        <button type="submit" class="btn-primary w-full justify-center">Publicar 🦅</button>
      </form>`,
    onMount(root) {
      const inp = root.querySelector('#pubImgInput');
      const prev = root.querySelector('#pubPreview');
      const tagSel = root.querySelector('#pubTagSelect');
      const gameWrap = root.querySelector('#pubGameLinkWrap');

      inp.onchange = () => {
        if (inp.files?.[0]) { prev.src = URL.createObjectURL(inp.files[0]); prev.classList.remove('hidden'); }
      };

      tagSel.onchange = () => {
        gameWrap.classList.toggle('hidden', tagSel.value !== 'jogos');
      };

      root.querySelector('#pubDialogForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const file = fd.get('image');
        const imgKey = file && file.size > 0 ? await DB.saveImage(file) : null;

        DB.addPost({
          title: fd.get('title'),
          tag: fd.get('tag'),
          availability: fd.get('availability'),
          playableUrl: (fd.get('playableUrl') || '').trim(),
          medium: (fd.get('medium') || '').trim(),
          dimensions: (fd.get('dimensions') || '').trim(),
          location: (fd.get('location') || 'Piauí').trim(),
          description: fd.get('description'),
          artist: user.name,
          artistId: user.id,
          imgKey,
          portfolio: !!fd.get('portfolio'),
        });

        closeDialog();
        toast('Publicado no feed! 🦅');
        if (onPublished) onPublished();
      };
    },
  });
}