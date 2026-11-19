import { DB } from './db.js';
import { Auth, openAuthDialog } from './auth.js';
import { openDialog, timeAgo, toast } from './ui.js';

export function openMessagesDialog({ targetUserId = null, contextPost = null, onUpdateBadge = null } = {}) {
  const me = Auth.getUser();
  if (!me) {
    openAuthDialog(() => openMessagesDialog({ targetUserId, contextPost, onUpdateBadge }));
    return;
  }

  let activePartnerId = targetUserId;

  openDialog({
    title: 'Mensagens Diretas',
    size: 'max-w-3xl',
    html: `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[380px]">
        <!-- Lista de Conversas -->
        <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-carcara-200 pb-3 md:pb-0 md:pr-3 flex flex-col">
          <p class="text-[11px] uppercase tracking-wider font-bold text-sertao-700/60 mb-2">Conversas</p>
          <div id="dmConversationsList" class="space-y-1.5 overflow-y-auto max-h-72"></div>
        </div>

        <!-- Área do Chat -->
        <div class="md:col-span-8 flex flex-col justify-between">
          <div id="dmChatHeader" class="pb-2.5 mb-2.5 border-b border-carcara-100 flex items-center justify-between"></div>
          <div id="dmThreadBox" class="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1 mb-3"></div>
          <form id="dmSendForm" class="flex gap-2">
            <input id="dmInput" name="text" required autocomplete="off"
                   placeholder="Escreva uma mensagem para encomendas, parcerias..."
                   class="form-input text-xs py-2" />
            <button type="submit" class="btn-primary text-xs px-4 shrink-0">Enviar</button>
          </form>
        </div>
      </div>`,
    onMount(root) {
      const listEl   = root.querySelector('#dmConversationsList');
      const headerEl = root.querySelector('#dmChatHeader');
      const threadEl = root.querySelector('#dmThreadBox');
      const form     = root.querySelector('#dmSendForm');
      const input    = root.querySelector('#dmInput');

      if (contextPost) {
        input.value = `Olá! Tenho interesse na sua obra "${contextPost}". Podemos conversar?`;
      }

      const renderConversations = () => {
        const convs = DB.getConversations(me.id);
        const allUsers = DB.getUsers().filter(u => u.id !== me.id);

        // Garante que o destinatário recém-clicado apareça mesmo antes da primeira mensagem
        if (activePartnerId && !convs.some(c => c.partnerId === activePartnerId)) {
          convs.unshift({ partnerId: activePartnerId, lastMessage: null, unread: 0 });
        }

        if (!activePartnerId && convs.length > 0) {
          activePartnerId = convs[0].partnerId;
        }

        const existingHtml = convs.map(c => {
          const u = DB.getUserById(c.partnerId);
          if (!u) return '';
          const active = u.id === activePartnerId;
          return `
            <button type="button" data-dm-partner="${u.id}"
                    class="w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 transition ${active ? 'bg-carcara-100 border border-carcara-300' : 'hover:bg-carcara-50'}">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ${u.name.charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold truncate">${u.name}</p>
                  <p class="text-[11px] text-sertao-700/60 truncate">${c.lastMessage ? c.lastMessage.text : 'Iniciar conversa...'}</p>
                </div>
              </div>
              ${c.unread > 0 ? `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-carcara-600 text-white">${c.unread}</span>` : ''}
            </button>`;
        }).join('');

        // Sugestão rápida de outros artistas caso ainda não tenha conversado
        const others = allUsers.filter(u => !convs.some(c => c.partnerId === u.id));
        const othersHtml = others.length ? `
          <p class="text-[10px] uppercase tracking-wider text-sertao-700/50 pt-3 pb-1">Outros artistas</p>
          ${others.map(u => `
            <button type="button" data-dm-partner="${u.id}" class="w-full text-left p-1.5 rounded-lg flex items-center gap-2 hover:bg-carcara-50 text-xs">
              <span class="w-6 h-6 rounded-full bg-carcara-200 text-carcara-800 flex items-center justify-center text-[10px] font-bold">${u.name.charAt(0).toUpperCase()}</span>
              <span class="truncate">${u.name}</span>
            </button>`).join('')}` : '';

        listEl.innerHTML = existingHtml + othersHtml;

        listEl.querySelectorAll('[data-dm-partner]').forEach(btn => {
          btn.onclick = () => {
            activePartnerId = btn.dataset.dmPartner;
            renderConversations();
            renderThread();
          };
        });
      };

      const renderThread = () => {
        if (!activePartnerId) {
          headerEl.innerHTML = `<span class="text-xs text-sertao-700/60">Selecione um artista ao lado</span>`;
          threadEl.innerHTML = '';
          form.classList.add('hidden');
          return;
        }

        const partner = DB.getUserById(activePartnerId);
        if (!partner) return;

        DB.markThreadRead(me.id, partner.id);
        if (onUpdateBadge) onUpdateBadge();

        form.classList.remove('hidden');
        headerEl.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-carcara-600 text-white flex items-center justify-center text-xs font-bold">
              ${partner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="text-sm font-bold leading-tight">${partner.name}</p>
              <p class="text-[11px] text-sertao-700/60">${partner.bio || 'Comunidade Carcará'}</p>
            </div>
          </div>`;

        const messages = DB.getThread(me.id, partner.id);
        threadEl.innerHTML = messages.length
          ? messages.map(m => {
              const mine = m.fromId === me.id;
              return `
                <div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${mine ? 'bg-carcara-600 text-white rounded-br-sm' : 'bg-carcara-100 text-sertao-900 rounded-bl-sm'}">
                    ${m.contextPost ? `<p class="text-[10px] opacity-80 mb-1 border-b border-current/20 pb-0.5">Sobre: ${m.contextPost}</p>` : ''}
                    <p class="leading-relaxed">${m.text}</p>
                    <span class="block text-[9px] opacity-70 mt-1 text-right">${timeAgo(m.createdAt)}</span>
                  </div>
                </div>`;
            }).join('')
          : `<p class="text-xs text-sertao-700/50 text-center py-10">Envie a primeira mensagem direta para ${partner.name.split(' ')[0]} 🦅</p>`;

        threadEl.scrollTop = threadEl.scrollHeight;
      };

      form.onsubmit = (e) => {
        e.preventDefault();
        if (!activePartnerId || !input.value.trim()) return;
        DB.sendMessage({
          fromId: me.id,
          toId: activePartnerId,
          text: input.value,
          contextPost,
        });
        contextPost = null;
        input.value = '';
        renderConversations();
        renderThread();
        toast('Mensagem enviada! ✉️');
      };

      renderConversations();
      renderThread();
    },
  });
}