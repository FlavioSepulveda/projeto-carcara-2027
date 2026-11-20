import {
  submitRealWaitlist,
  checkWaitlistStatus,
  listAllWaitlistRequests,
  approveBetaTester,
} from '../src/waitlist.ts';
import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, toast, openDialog, closeDialog } from './ui.js';

export async function renderLicenseSection(onStateChange) {
  const box = $('#licenseStatusBox');
  if (!box) return;

  const user = Auth.getUser();
  if (user) {
    if ($('#licName') && !$('#licName').value) $('#licName').value = user.name;
    if ($('#licEmail') && !$('#licEmail').value) $('#licEmail').value = user.email;
  }

  const savedWaitlistEmail = localStorage.getItem('carcara:waitlist_email');
  const lookupEmail = user ? user.email : savedWaitlistEmail;

  const existingReq = lookupEmail
    ? await checkWaitlistStatus(lookupEmail).catch(() => null)
    : null;

  // Ativa licença automaticamente se for Admin ou se o pedido já estiver aprovado no Firestore
  if (user && !user.licensed && (Auth.isAdmin() || (existingReq && existingReq.status === 'approved'))) {
    DB.setUserLicensed(user.id, true, null, existingReq?.city || user.city);
  }

  const adminBtnHtml = Auth.isAdmin()
    ? `<button id="openCuradoriaBtn" class="mt-2.5 ml-2 border border-carcara-400 text-carcara-200 hover:bg-sertao-700 font-semibold text-xs px-3.5 py-1.5 rounded-full">
         🛡️ Gerenciar Fila Beta
       </button>`
    : '';

  if (user && (Auth.hasLicense() || Auth.isAdmin())) {
    box.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="bi bi-patch-check-fill text-emerald-400 text-xl"></i>
        <div>
          <p class="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Licença Ativa</p>
          <p class="text-sm font-bold text-white">${user.name} — Artista Verificado</p>
          <div class="flex flex-wrap items-center">
            <button id="licPublishNow" class="mt-2.5 bg-carcara-500 hover:bg-carcara-400 text-sertao-900 font-semibold text-xs px-4 py-1.5 rounded-full">
              + Publicar obra agora
            </button>
            ${adminBtnHtml}
          </div>
        </div>
      </div>`;
    $('#licPublishNow').onclick = () => openPublishFlow(onStateChange);
    $('#openCuradoriaBtn')?.addEventListener('click', () => openCuradoriaModal(onStateChange));
    return;
  }

  if (existingReq && existingReq.status === 'approved') {
    box.innerHTML = `
      <div class="space-y-2">
        <p class="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <i class="bi bi-stars mr-1"></i> Convite Beta Aprovado!
        </p>
        <p class="text-sm font-bold text-white">${existingReq.artistName}</p>
        <p class="text-xs text-carcara-100/80 leading-relaxed">
          Seu e-mail (<strong>${existingReq.email}</strong>) já está liberado para testar o Carcará. Clique em entrar com esse e-mail ou Google para começar a publicar!
        </p>
        <button id="licApprovedLoginBtn" class="btn-primary text-xs mt-1">Entrar e começar a usar →</button>
      </div>`;
    $('#licApprovedLoginBtn').onclick = () => openAuthDialog(onStateChange);
    return;
  }

  if (existingReq && existingReq.status === 'pending') {
    box.innerHTML = `
      <div class="space-y-2">
        <p class="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <i class="bi bi-cloud-check-fill mr-1"></i> Inscrito na fila oficial
        </p>
        <p class="text-sm font-bold text-white">${existingReq.artistName}</p>
        <p class="text-xs text-carcara-100/80 leading-relaxed">
          Seu e-mail (<strong>${existingReq.email}</strong>) está salvo na nossa base. Assim que seu acesso beta for liberado, basta entrar com esse e-mail ou Google!
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
          <p class="text-xs text-carcara-100/70 mt-1">Cadastre seu e-mail ao lado para participar dos testes beta ou do lançamento oficial.</p>
        </div>
        <button id="licLoginBtn" class="btn-primary text-xs shrink-0">Entrar</button>
      </div>`;
    $('#licLoginBtn').onclick = () => openAuthDialog(onStateChange);
    return;
  }

  box.innerHTML = `
    <p class="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">Conta em modo leitor</p>
    <p class="text-sm font-bold text-white mt-0.5">${user.name}</p>
    <p class="text-xs text-carcara-100/70 mt-1">Preencha o formulário ao lado para entrar na fila oficial de credenciamento.</p>`;
}

/** Modal exclusivo do Admin para visualizar todos os inscritos e liberar Beta Testers */
async function openCuradoriaModal(onStateChange) {
  openDialog({
    title: '🛡️ Curadoria & Fila de Beta Testers',
    size: 'max-w-2xl',
    html: `<p class="text-xs text-sertao-700/70 py-6 text-center">Carregando inscritos do Firestore...</p>`,
  });

  try {
    const list = await listAllWaitlistRequests();
    openDialog({
      title: `🛡️ Curadoria & Fila de Beta Testers (${list.length})`,
      size: 'max-w-2xl',
      html: `
        <div class="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          ${list.length === 0 ? `<p class="text-xs text-center text-sertao-700/60 py-8">Nenhum inscrito na fila ainda.</p>` : ''}
          ${list.map(item => `
            <div class="p-3.5 rounded-xl border border-carcara-200 bg-carcara-50 flex items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="text-sm text-sertao-900">${item.artistName}</strong>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${item.status === 'approved' ? '✓ Beta Liberado' : '⏳ Aguardando'}
                  </span>
                </div>
                <p class="text-xs text-sertao-700">${item.email} • ${item.city} (${item.specialty})</p>
                <p class="text-xs text-sertao-700/80">${item.statement}</p>
                ${item.portfolioUrl ? `<a href="${item.portfolioUrl}" target="_blank" rel="noopener" class="inline-block text-[11px] text-carcara-700 underline">Ver portfólio →</a>` : ''}
              </div>
              <div class="flex flex-col gap-1.5 shrink-0">
                ${item.status !== 'approved' ? `
                  <button data-approve-email="${item.email}" class="btn-primary text-xs">
                    Liberar Beta ✓
                  </button>` : `
                  <button data-approve-email="${item.email}" class="px-3 py-1.5 rounded-full text-xs font-semibold border border-carcara-300 text-carcara-800 hover:bg-carcara-100">
                    Reenviar E-mail ✉️
                  </button>`}
              </div>
            </div>
          `).join('')}
        </div>`,
      onMount(root) {
        root.querySelectorAll('[data-approve-email]').forEach(btn => {
          btn.onclick = async () => {
            const email = btn.dataset.approveEmail;
            btn.disabled = true;
            btn.textContent = 'Enviando...';
            const res = await approveBetaTester(email);
            if (res.emailSent) {
              toast(`Acesso liberado e e-mail enviado para ${email}! 🦅✉️`);
            } else {
              toast(`Liberado no banco, mas o e-mail falhou: ${res.errorMsg}`);
            }
            openCuradoriaModal(onStateChange);
            if (onStateChange) onStateChange();
          };
        });
      },
    });
  } catch (err) {
    toast('Erro ao carregar fila. Verifique as regras do Firestore.');
  }
}

export function initLicenseForm(onStateChange) {
  const form = $('#licenseForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Salvando na fila...';

    const user = Auth.getUser();
    const data = Object.fromEntries(new FormData(form));

    try {
      await submitRealWaitlist({
        artistName: data.artistName,
        email: data.email,
        city: data.city,
        specialty: data.specialty,
        portfolioUrl: data.portfolioUrl,
        statement: data.statement,
      });

      DB.submitLicenseRequest({ userId: user ? user.id : null, ...data });
      localStorage.setItem('carcara:waitlist_email', data.email.trim().toLowerCase());

      await renderLicenseSection(onStateChange);
      toast('Inscrição salva na lista oficial do Carcará! 🦅✨');
    } catch (err) {
      toast('Não foi possível salvar agora. Verifique se o Firestore está ativado.');
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
          <p class="text-xs text-sertao-700/80">Entre na lista de espera para receber acesso aos testes beta ou ao lançamento oficial.</p>
          <a href="#licenca" id="jumpLicenseBtn" class="btn-primary justify-center">Entrar na Fila de Espera</a>
        </div>`,
      onMount(root) {
        root.querySelector('#jumpLicenseBtn').onclick = () => closeDialog();
      },
    });
    return;
  }

  openDialog({
    title: 'Publicar obra ou álbum de processo',
    size: 'max-w-lg',
    html: `
      <form id="pubDialogForm" class="space-y-3">
        <div>
          <div class="flex items-center justify-between">
            <label class="form-label">Imagens (selecione 1 ou várias para criar álbum)</label>
            <span id="pubAlbumCount" class="text-[11px] font-semibold text-carcara-700"></span>
          </div>
          <input id="pubImgInput" name="images" type="file" accept="image/*" multiple required class="form-input text-xs" />
          <div id="pubPreviewGrid" class="hidden mt-2 grid grid-cols-3 gap-2"></div>
        </div>

        <div>
          <label class="form-label">Título</label>
          <input name="title" required class="form-input" placeholder="Ex: Série Sertão Vivo (Etapas 1 a 4)" />
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

        <div id="pubGameLinkWrap" class="hidden bg-carcara-50 border border-carcara-200 rounded-xl p-3">
          <label class="form-label">Link jogável / Demo (itch.io, Vercel, GitHub)</label>
          <input name="playableUrl" type="url" class="form-input bg-white" placeholder="https://seuprojeto.itch.io/jogo" />
        </div>

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
          <textarea name="description" rows="2" class="form-input" placeholder="Conte sobre a pesquisa, etapas do álbum ou materiais..."></textarea>
        </div>

        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" name="portfolio" class="accent-carcara-600" /> Destacar no meu Portfólio
        </label>

        <button type="submit" class="btn-primary w-full justify-center">Publicar 🦅</button>
      </form>`,
    onMount(root) {
      const inp = root.querySelector('#pubImgInput');
      const prevGrid = root.querySelector('#pubPreviewGrid');
      const countEl = root.querySelector('#pubAlbumCount');
      const tagSel = root.querySelector('#pubTagSelect');
      const gameWrap = root.querySelector('#pubGameLinkWrap');

      inp.onchange = () => {
        const files = Array.from(inp.files || []).slice(0, 10);
        if (!files.length) {
          prevGrid.classList.add('hidden');
          countEl.textContent = '';
          return;
        }
        countEl.textContent = files.length > 1 ? `Álbum com ${files.length} fotos` : '1 foto';
        prevGrid.classList.remove('hidden');
        prevGrid.innerHTML = files.map((file, idx) => `
          <div class="relative rounded-lg overflow-hidden border border-carcara-200 aspect-square bg-carcara-100">
            <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover" />
            ${idx === 0 && files.length > 1 ? `<span class="absolute bottom-1 left-1 text-[9px] font-bold bg-sertao-900/85 text-white px-1.5 py-0.5 rounded">Capa</span>` : ''}
          </div>`).join('');
      };

      tagSel.onchange = () => {
        gameWrap.classList.toggle('hidden', tagSel.value !== 'jogos');
      };

      root.querySelector('#pubDialogForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const files = Array.from(inp.files || []).slice(0, 10);
        const imgKeys = [];

        for (const f of files) {
          if (f.size > 0) imgKeys.push(await DB.saveImage(f));
        }

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
          imgKeys,
          imgKey: imgKeys[0] || null,
          portfolio: !!fd.get('portfolio'),
        });

        closeDialog();
        toast(imgKeys.length > 1 ? `Álbum com ${imgKeys.length} fotos publicado! 🦅` : 'Publicado no feed! 🦅');
        if (onPublished) onPublished();
      };
    },
  });
}