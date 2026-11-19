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

  if (!user) {
    box.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-wider text-carcara-300 font-semibold">Status atual</p>
          <p class="text-sm font-bold text-white mt-0.5">Visitante não autenticado</p>
          <p class="text-xs text-carcara-100/70 mt-1">Entre ou cadastre-se para acompanhar sua posição na fila.</p>
        </div>
        <button id="licLoginBtn" class="btn-primary text-xs shrink-0">Entrar</button>
      </div>`;
    $('#licLoginBtn').onclick = () => openAuthDialog(onStateChange);
    return;
  }

  if (Auth.hasLicense()) {
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

  const queue = DB.getQueuePosition(user.id) || DB.getQueuePosition(user.email);
  if (queue) {
    box.innerHTML = `
      <div class="space-y-2">
        <p class="text-amber-300 text-xs font-semibold uppercase tracking-wider"><i class="bi bi-hourglass-split"></i> Na fila de espera</p>
        <p class="text-sm font-bold text-white">Posição atual: #${queue.position} de ${queue.total}</p>
        <p class="text-xs text-carcara-100/70">Assim que uma vaga do lote abrir, sua conta será liberada.</p>
        <button id="demoApproveBtn" class="mt-2 bg-emerald-500 hover:bg-emerald-400 text-sertao-900 font-bold text-xs px-3 py-1 rounded-full">
          Aprovar minha vaga (Demo) ✓
        </button>
      </div>`;
    $('#demoApproveBtn').onclick = () => {
      DB.approveLicenseRequest(user.id);
      toast('Licença aprovada! Você já pode publicar 🦅');
      if (onStateChange) onStateChange();
    };
    return;
  }

  box.innerHTML = `
    <p class="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">Conta sem licença</p>
    <p class="text-sm font-bold text-white mt-0.5">${user.name} (Modo Leitor)</p>
    <p class="text-xs text-carcara-100/70 mt-1">Envie o formulário ao lado para entrar na fila de credenciamento.</p>`;
}

export function initLicenseForm(onStateChange) {
  $('#licenseForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = Auth.getUser();
    const data = Object.fromEntries(new FormData(e.target));
    DB.submitLicenseRequest({ userId: user ? user.id : null, ...data });
    renderLicenseSection(onStateChange);
    toast('Você entrou na fila de credenciamento! 🦅');
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
          <p class="text-xs text-sertao-700/80">Você pode continuar curtindo, comentando, enviando mensagens diretas e criando murais. Para publicar obras, entre na fila de licença.</p>
          <a href="#licenca" id="jumpLicenseBtn" class="btn-primary justify-center">Ir para Fila de Licença</a>
        </div>`,
      onMount(root) {
        root.querySelector('#jumpLicenseBtn').onclick = () => closeDialog();
      },
    });
    return;
  }

  openDialog({
    title: 'Publicar novo processo',
    size: 'max-w-lg',
    html: `
      <form id="pubDialogForm" class="space-y-3">
        <div>
          <label class="form-label">Imagem</label>
          <input id="pubImgInput" name="image" type="file" accept="image/*" required class="form-input text-xs" />
          <img id="pubPreview" class="hidden mt-2 w-full h-48 object-cover rounded-xl border border-carcara-200" />
        </div>
        <div><label class="form-label">Título</label><input name="title" required class="form-input" placeholder="Ex: Série Sertão Vivo" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Técnica</label><select name="tag" class="form-input"><option value="pintura">Pintura</option><option value="gravura">Gravura</option><option value="ceramica">Cerâmica</option><option value="fotografia">Fotografia</option><option value="3d">3D</option></select></div>
          <div><label class="form-label">Local</label><input name="location" class="form-input" placeholder="Teresina" /></div>
        </div>
        <div><label class="form-label">Descrição</label><textarea name="description" rows="2" class="form-input"></textarea></div>
        <label class="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" name="portfolio" class="accent-carcara-600" /> Destacar no meu Portfólio</label>
        <button type="submit" class="btn-primary w-full justify-center">Publicar 🦅</button>
      </form>`,
    onMount(root) {
      const inp = root.querySelector('#pubImgInput');
      const prev = root.querySelector('#pubPreview');
      inp.onchange = () => {
        if (inp.files?.[0]) { prev.src = URL.createObjectURL(inp.files[0]); prev.classList.remove('hidden'); }
      };
      root.querySelector('#pubDialogForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const file = fd.get('image');
        const imgKey = file && file.size > 0 ? await DB.saveImage(file) : null;
        DB.addPost({
          title: fd.get('title'), tag: fd.get('tag'), location: fd.get('location'),
          description: fd.get('description'), artist: user.name, artistId: user.id,
          imgKey, portfolio: !!fd.get('portfolio'),
        });
        closeDialog();
        toast('Publicado no feed! 🦅');
        if (onPublished) onPublished();
      };
    },
  });
}