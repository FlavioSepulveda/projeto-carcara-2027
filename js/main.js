import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { $, $$, initDialogEvents, toast } from './ui.js';
import { renderStories, renderFeed, showPostDetails, initFeedControls } from './feed.js';
import { renderMurais, openNewMuralDialog, openSavePinDialog } from './murais.js';
import {
  renderPortfolio,
  renderOportunidades,
  initOportunidadesControls,
  renderStudentBoard,
  initStudentBoardControls,
  renderArtistas,
  openArtistProfile,
} from './community.js';
import { renderLicenseSection, initLicenseForm, openPublishFlow } from './license.js';
import { openMessagesDialog } from './messages.js';

async function renderNavbar() {
  const desktop = $('#sessionArea');
  const mobile  = $('#sessionAreaMobile');
  const user    = Auth.getUser();

  if (!user) {
    if (desktop) desktop.innerHTML = `<button id="navLoginBtn" class="bg-carcara-600 hover:bg-carcara-700 text-white px-4 py-2 rounded-full text-xs font-semibold">Entrar</button>`;
    if (mobile)  mobile.innerHTML  = `<button id="navLoginBtnMob" class="w-full bg-carcara-600 text-white px-4 py-2 rounded-full text-sm font-semibold">Entrar</button>`;
    $('#navLoginBtn')?.addEventListener('click', () => openAuthDialog(renderAll));
    $('#navLoginBtnMob')?.addEventListener('click', () => openAuthDialog(renderAll));
    return;
  }

  const unread    = DB.getUnreadCount(user.id);
  const licensed  = Auth.hasLicense();
  const initial   = user.name.charAt(0).toUpperCase();
  const fullUser  = DB.getUserById(user.id) || user;
  const avatarUrl = fullUser.avatarKey
    ? await DB.getImageURL(fullUser.avatarKey)
    : (fullUser.avatarUrl || null);

  const avatarContent = avatarUrl
    ? `<img src="${avatarUrl}" alt="${user.name}" class="w-full h-full rounded-full object-cover" />`
    : initial;

  if (desktop) {
    desktop.innerHTML = `
      <div class="flex items-center gap-2">
        <button id="navDmBtn" title="Mensagens Diretas" class="relative w-8 h-8 rounded-full bg-white border border-carcara-200 hover:bg-carcara-100 flex items-center justify-center text-sertao-800 transition">
          <i class="bi bi-chat-dots text-sm"></i>
          ${unread > 0 ? `<span class="dm-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">${unread}</span>` : ''}
        </button>

        ${licensed
          ? `<button id="navPubBtn" class="bg-carcara-600 hover:bg-carcara-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold">+ Publicar</button>`
          : `<a href="#licenca" class="bg-carcara-100 text-carcara-800 border border-carcara-300 px-3 py-1.5 rounded-full text-xs font-semibold">Fila Licença</a>`}

        <button id="navProfBtn" title="Meu Perfil" class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-carcara-300 hover:scale-105 transition">${avatarContent}</button>
        <button id="navOutBtn" class="text-xs text-sertao-700/60 hover:text-red-600">Sair</button>
      </div>`;
  }

  if (mobile) {
    mobile.innerHTML = `
      <div class="flex items-center justify-between py-1">
        <button id="navProfBtnMob" class="text-xs font-semibold text-carcara-800 underline">${user.name} (Meu Perfil)</button>
        <div class="flex items-center gap-3">
          <button id="navDmBtnMob" class="text-xs font-semibold text-carcara-700">Mensagens ${unread > 0 ? `(${unread})` : ''}</button>
          <button id="navOutBtnMob" class="text-xs text-red-600">Sair</button>
        </div>
      </div>
      ${licensed
        ? `<button id="navPubBtnMob" class="w-full mt-1 bg-carcara-600 text-white py-2 rounded-full text-xs font-semibold">+ Publicar</button>`
        : `<a href="#licenca" class="block text-center w-full mt-1 bg-carcara-100 text-carcara-800 py-2 rounded-full text-xs font-semibold">Solicitar Licença</a>`}`;
  }

  const openDm   = () => openMessagesDialog({ onUpdateBadge: renderNavbar });
  const openProf = () => openArtistProfile(user.id, openPost, renderAll);

  $('#navDmBtn')?.addEventListener('click', openDm);
  $('#navDmBtnMob')?.addEventListener('click', openDm);
  $('#navPubBtn')?.addEventListener('click', () => openPublishFlow(renderAll));
  $('#navPubBtnMob')?.addEventListener('click', () => openPublishFlow(renderAll));
  $('#navProfBtn')?.addEventListener('click', openProf);
  $('#navProfBtnMob')?.addEventListener('click', openProf);
  ['#navOutBtn', '#navOutBtnMob'].forEach(sel => $(sel)?.addEventListener('click', () => {
    Auth.logout();
    renderAll();
    toast('Até logo! 🦅');
  }));
}

const feedCallbacks = {
  onOpenArtist: (id) => openArtistProfile(id, openPost, renderAll),
  onOpenSavePin: (postId) => openSavePinDialog(postId, () => { renderMurais(openPost); renderFeed(feedCallbacks); }),
  onPortfolioChange: () => renderPortfolio(openPost),
};

function openPost(post) {
  showPostDetails(post, feedCallbacks);
}

function renderAll() {
  renderNavbar();
  renderLicenseSection(renderAll);
  renderStories(feedCallbacks);
  renderFeed(feedCallbacks);
  renderPortfolio(openPost);
  renderMurais(openPost);
  renderOportunidades();
  renderStudentBoard();
  renderArtistas(openPost, renderAll);
}

document.addEventListener('DOMContentLoaded', () => {
  initDialogEvents();
  initFeedControls(feedCallbacks);
  initOportunidadesControls();
  initStudentBoardControls();
  initLicenseForm(renderAll);

  $('#newMuralBtn')?.addEventListener('click', () => openNewMuralDialog(() => renderMurais(openPost)));

  $('#menuBtn')?.addEventListener('click', () => {
    $('#mobileMenu')?.classList.toggle('hidden');
  });
  $$('.mobile-link').forEach(a => a.addEventListener('click', () => $('#mobileMenu')?.classList.add('hidden')));

  renderAll();
});