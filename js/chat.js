const msgBox = document.getElementById('chat-messages');
const memBox = document.getElementById('online-members-list');
const acBox = document.getElementById('chat-ac-box');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
let cachedUsers = [];
let initialChatLoaded = false;
let activeReply = null;
let pendingAttachment = null;
let lastChatHash = '';
let lastTypingPing = 0;
let lastSentByChannel = {};
let channelSlowMode = { global: 0, updates: 0, beta: 0 };
let activeChannel = 'global';
let activeLeftMode = 'CHANNELS';
window.activeChatLabel = '#zynk-global';
let channelUnread = { global: false, updates: false, beta: false };
let channelPings = { global: 0, updates: 0, beta: 0 };

const CHAT_SVG = {
  react: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  reply: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  sticker: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>`
};

const ALL_EMOJIS = [
  '👍','❤️','😂','🔥','💀','🎉','👀','💯','😭','😍','🥺','😎','🤯','🥳','😡','🤔',
  '👏','🙌','🤝','✌️','🫡','🙏','💪','⚡','💎','🚀','👑','🏆','🎮','🎵','🌟','✨',
  '💚','💙','💜','🧡','🖤','🤍','💔','💥','💫','💤','✅','❌','⚠️','🛡️','🔮','🛸'
];

function getUploadLimitInfo(p) {
  if (!p) return { mb: 50, label: '50 MB' };
  const roles = [p.role, ...(p.extra_roles || [])].map(r => String(r || '').toUpperCase());
  if (roles.some(r => ['FOUNDER', 'HEAD DEV', 'HEAD_DEV', 'DEVELOPER', 'DEV'].includes(r))) return { mb: Infinity, label: 'Unlimited' };
  if (roles.some(r => ['ADMIN', 'MODERATOR', 'STAFF'].includes(r))) return { mb: 52.5, label: '52.5 MB (+5% Staff)' };
  return { mb: 50, label: '50 MB' };
}

function canAccessChannel(p, ch) {
  if (!ch || ch === 'global' || ch === 'updates') return true;
  if (!p) return false;
  if (ch === 'beta') return p.role === 'FOUNDER' || p.role === 'BETA' || !!p.is_beta || (p.extra_roles || []).includes('BETA');
  if (ch.startsWith('dm_')) return ch.replace(/^dm_/, '').split('_').includes(String(p.id));
  return true;
}

window.logAudit = async function(action, target, details) {
  if (!window.sbRest) return;
  const actor = window.userProfile?.username || 'System';
  await window.sbRest('zynk_audit_logs', 'POST', { actor, action, target: target || '-', details: details || '' }, window.authToken).catch(() => {});
};
function formatDiscordMarkdown(raw) {
  const codeBlocks = [];
  const inlineCodes = [];
  const escapes = [];
  let text = String(raw || '').replace(/\r\n/g, '\n');

  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\(\S\)]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const hdr = lang ? `<div class="mono-dim" style="font-size:0.68rem;margin-bottom:4px;text-transform:uppercase;">${lang}</div>` : '';
    codeBlocks.push(`<pre class="md-pre">${hdr}<code>${safe}</code></pre>`);
    return `\u0000CB${idx}\u0000`;
  });

  text = text.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    inlineCodes.push(`<code class="md-code">${safe}</code>`);
    return `\u0000IC${idx}\u0000`;
  });

  text = text.replace(/\\([\\*_~|`>#\-\[\]()<])/g, (_, ch) => {
    const idx = escapes.length;
    escapes.push(ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    return `\u0000ES${idx}\u0000`;
  });

  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = text.split('\n');
  const outLines = [];
  let inMultiQuote = false;
  let multiQuoteBuf = [];

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (inMultiQuote) { multiQuoteBuf.push(ln); continue; }
    if (ln.startsWith('&gt;&gt;&gt; ')) { inMultiQuote = true; multiQuoteBuf.push(ln.slice(13)); continue; }
    if (ln.startsWith('&gt; ')) outLines.push(`<div class="md-quote">${ln.slice(5)}</div>`);
    else if (ln.startsWith('### ')) outLines.push(`<div class="md-h3">${ln.slice(4)}</div>`);
    else if (ln.startsWith('## ')) outLines.push(`<div class="md-h2">${ln.slice(3)}</div>`);
    else if (ln.startsWith('# ')) outLines.push(`<div class="md-h1">${ln.slice(2)}</div>`);
    else if (ln.startsWith('-# ')) outLines.push(`<span class="md-subtext">${ln.slice(3)}</span>`);
    else if (/^(\s*)[-*]\s+(.+)$/.test(ln)) {
      const m = ln.match(/^(\s*)[-*]\s+(.+)$/);
      outLines.push(`<div style="padding-left:${14 + Math.min(48, (m?.length || 0) * 10)}px;">• ${m}</div>`);
    } else if (/^(\s*)(\d+)\.\s+(.+)$/.test(ln)) {
      const m = ln.match(/^(\s*)(\d+)\.\s+(.+)$/);
      outLines.push(`<div style="padding-left:${14 + Math.min(48, (m?.length || 0) * 10)}px;">${m}. ${m}</div>`);
    } else outLines.push(ln);
  }
  if (inMultiQuote) outLines.push(`<div class="md-quote">${multiQuoteBuf.join('<br>')}</div>`);

  let html = outLines.join('<br>').replace(/(<\/div>|<\/pre>|<\/span>)<br>/g, '$1');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--neon-cyan);text-decoration:underline;">$1</a>');
  html = html.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--neon-cyan);text-decoration:underline;">$1</a>');
  html = html.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--neon-cyan);text-decoration:underline;">$2</a>');
  html = html.replace(/\|\|([^|]+)\|\|/g, '<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>').replace(/___([^_]+)___/g, '<u><em>$1</em></u>').replace(/__([^_]+)__/g, '<u>$1</u>');
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(^|[^a-zA-Z0-9_])_([^_\n]+)_/g, '$1<em>$2</em>').replace(/(@[a-zA-Z0-9_]+)/g, '<strong style="color:#10b981;">$1</strong>');
  html = html.replace(/\u0000IC(\d+)\u0000/g, (_, i) => inlineCodes[Number(i)] || '').replace(/\u0000CB(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)] || '').replace(/\u0000ES(\d+)\u0000/g, (_, i) => escapes[Number(i)] || '');
  return html;
}
function compressChatImg(file, maxDim = 640) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (file.type.startsWith('video/')) return resolve(reader.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderChanBadge(ch) {
  const pings = channelPings[ch] || 0;
  if (pings > 0) return `<span style="background:#f43f5e;color:#fff;font-size:0.68rem;font-weight:800;padding:1px 6px;border-radius:999px;">${pings}</span>`;
  if (channelUnread[ch]) return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;"></span>`;
  return '';
}

function buildChannelBar() {
  const chatView = document.getElementById('chat-view');
  const chatHeader = document.querySelector('#chat-view .view-topbar');
  if (!chatView || !chatHeader) return;

  let sideCol = document.getElementById('chat-ic-sidebar');
  if (!sideCol) {
    sideCol = document.createElement('aside');
    sideCol.id = 'chat-ic-sidebar';
    sideCol.className = 'chat-channels-panel';
    chatView.insertBefore(sideCol, chatView.firstChild);
  }

  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const inp = document.getElementById('chat-input');
  if (inp) {
    if (isFounder) inp.removeAttribute('maxlength');
    else inp.setAttribute('maxlength', '2000');
  }
  const cc = document.getElementById('chat-char-count');
  if (cc) cc.textContent = `${inp?.value.length || 0}/${isFounder ? '∞' : '2000'}`;

  const isBeta = canAccessChannel(p, 'beta');
  const isStaff = p && ['FOUNDER', 'HEAD DEV', 'DEVELOPER', 'ADMIN', 'MODERATOR'].includes((p.role || '').toUpperCase());
  const curSlow = channelSlowMode[activeChannel] || 0;
  sideCol.innerHTML = `
    <div style="font-weight:800;font-size:0.95rem;padding:2px 6px;">CHAT</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
      <button type="button" class="btn-neon" style="padding:5px 6px;font-size:0.75rem;">Main chat</button>
      <button type="button" class="btn-outline" style="padding:5px 6px;font-size:0.75rem;" onclick="openTab('vortex-view')">Vortex chat</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
      <button type="button" class="${activeLeftMode === 'CHANNELS' ? 'btn-outline' : 'btn-ghost'}" id="ic-mode-ch" style="padding:5px 6px;font-size:0.75rem;">Channels</button>
      <button type="button" class="${activeLeftMode === 'DMS' ? 'btn-outline' : 'btn-ghost'}" id="ic-mode-dm" style="padding:5px 6px;font-size:0.75rem;">Private Chats</button>
    </div>
    <div class="dock-sep-line"></div>
    ${activeLeftMode === 'CHANNELS' ? `
      <div class="mono-dim" style="padding:0 6px;font-weight:700;">IMPORTANT</div>
      <button type="button" class="ch-item-btn ${activeChannel === 'updates' ? 'active' : ''}" data-ch="updates"><span># updates</span>${renderChanBadge('updates')}</button>
      <div class="mono-dim" style="padding:6px 6px 0;font-weight:700;">COMMUNITY</div>
      <button type="button" class="ch-item-btn ${activeChannel === 'global' ? 'active' : ''}" data-ch="global"><span># zynk-global</span>${renderChanBadge('global')}</button>
      ${isBeta ? `<button type="button" class="ch-item-btn ${activeChannel === 'beta' ? 'active' : ''}" data-ch="beta"><span># beta-lab</span>${renderChanBadge('beta')}</button>` : ''}
    ` : `
      <div class="mono-dim" style="padding:0 6px;font-weight:700;">DIRECT MESSAGES</div>
      <button type="button" class="btn-neon" id="new-dm-btn" style="width:100%;padding:6px 10px;font-size:0.78rem;">+ Start Private DM</button>
      <div id="ic-dm-list" style="display:flex;flex-direction:column;gap:4px;margin-top:4px;"></div>
    `}`;

  document.getElementById('ic-mode-ch').onclick = () => { activeLeftMode = 'CHANNELS'; buildChannelBar(); };
  document.getElementById('ic-mode-dm').onclick = () => { activeLeftMode = 'DMS'; buildChannelBar(); };
  sideCol.querySelectorAll('[data-ch]').forEach(b => (b.onclick = () => {
    window.switchChatChannel(b.dataset.ch, b.dataset.ch === 'global' ? '#zynk-global' : `#${b.dataset.ch}`);
  }));
  const dmBtn = document.getElementById('new-dm-btn');
  if (dmBtn) dmBtn.onclick = () => window.openNewDmModal();

  const dmListBox = document.getElementById('ic-dm-list');
  if (dmListBox && p) {
    const others = cachedUsers.filter(u => String(u.id) !== String(p.id)).slice(0, 15);
    dmListBox.innerHTML = others.map(u => {
      const pair = [String(p.id), String(u.id)].sort().join('_');
      const chId = `dm_${pair}`;
      return `<button type="button" class="ch-item-btn ${activeChannel === chId ? 'active' : ''}" onclick="switchChatChannel('${chId}','@${u.username}')"><span>@${u.username}</span></button>`;
    }).join('');
  }

  let slowBar = document.getElementById('chat-slow-wrap');
  if (!slowBar) {
    slowBar = document.createElement('div');
    slowBar.id = 'chat-slow-wrap';
    slowBar.style.cssText = 'display:flex;gap:8px;align-items:center;';
    chatHeader.insertBefore(slowBar, document.getElementById('chat-credits'));
  }
  slowBar.innerHTML = isStaff ? `<select id="slowmode-sel" class="tool-input" style="width:auto;margin:0;padding:4px 8px;font-size:0.76rem;" title="Channel Slow Mode"><option value="0" ${curSlow === 0 ? 'selected' : ''}>Slow: Off</option><option value="5" ${curSlow === 5 ? 'selected' : ''}>Slow: 5s</option><option value="15" ${curSlow === 15 ? 'selected' : ''}>Slow: 15s</option><option value="30" ${curSlow === 30 ? 'selected' : ''}>Slow: 30s</option><option value="60" ${curSlow === 60 ? 'selected' : ''}>Slow: 1m</option></select>` : '';
  const smSel = document.getElementById('slowmode-sel');
  if (smSel) smSel.onchange = () => {
    channelSlowMode[activeChannel] = parseInt(smSel.value, 10) || 0;
    window.notify?.(`Slow mode set to ${smSel.value === '0' ? 'Off' : smSel.value + 's'} in ${window.activeChatLabel}`);
  };

  const totalPings = Object.values(channelPings).reduce((a, b) => a + b, 0);
  const dockBadge = document.getElementById('dock-chat-badge');
  if (dockBadge) {
    dockBadge.textContent = totalPings;
    dockBadge.classList.toggle('hidden', totalPings === 0);
  }
}

window.switchChatChannel = function(chId, label) {
  if (!canAccessChannel(window.userProfile, chId)) {
    window.notify?.('Access denied: You do not have permission for this channel.', true);
    chId = 'global';
    label = '#zynk-global';
  }
  activeChannel = chId;
  window.activeChatLabel = label || (chId === 'global' ? '#zynk-global' : `#${chId}`);
  channelUnread[chId] = false;
  channelPings[chId] = 0;
  lastChatHash = '';
  const h2 = document.querySelector('#chat-view .view-topbar h2');
  if (h2) h2.textContent = window.activeChatLabel;
  buildChannelBar();
  const inp = document.getElementById('chat-input');
  if (inp) inp.placeholder = `Message ${window.activeChatLabel}... (Type / or @)`;
  pollChatAndMembers();
};
if (chatForm && !document.getElementById('chat-file-inp')) {
  const ta = document.createElement('textarea');
  ta.id = 'chat-input';
  ta.rows = 1;
  ta.placeholder = chatInput?.placeholder || 'Message #zynk-global... (Type / or @)';
  ta.style.cssText = 'flex:1;background:transparent;border:none;color:var(--text-main);font:inherit;resize:none;outline:none;max-height:130px;overflow-y:auto;line-height:1.4;padding:4px 0;';
  chatInput?.replaceWith(ta);

  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.id = 'chat-file-inp';
  fileInp.accept = 'image/*,video/*';
  fileInp.style.cssText = 'position:fixed;left:-9999px;opacity:0;width:1px;height:1px;';

  const imgBtn = document.createElement('button');
  imgBtn.type = 'button';
  imgBtn.className = 'chat-tool-btn';
  imgBtn.title = 'Attach Image or Video';
  imgBtn.innerHTML = CHAT_SVG.plus;
  imgBtn.onclick = () => fileInp.click();

  const stkBtn = document.createElement('button');
  stkBtn.type = 'button';
  stkBtn.className = 'chat-tool-btn';
  stkBtn.title = 'Stickers & Emojis';
  stkBtn.innerHTML = CHAT_SVG.sticker;
  stkBtn.onclick = () => window.toggleChatDrawer();

  const charCount = document.createElement('span');
  charCount.id = 'chat-char-count';
  charCount.className = 'mono-dim';
  charCount.style.cssText = 'font-size:0.72rem;white-space:nowrap;';
  charCount.textContent = '0/2000';

  chatForm.insertBefore(fileInp, ta);
  chatForm.insertBefore(imgBtn, ta);
  chatForm.insertBefore(stkBtn, ta);
  chatForm.insertBefore(charCount, chatForm.querySelector('button[type="submit"]'));
}

let drawerBox = document.getElementById('chat-drawer-box');
if (!drawerBox && chatForm) {
  drawerBox = document.createElement('div');
  drawerBox.id = 'chat-drawer-box';
  drawerBox.className = 'sticker-drawer hidden';
  chatForm.before(drawerBox);
}

let typingBar = document.getElementById('chat-typing-bar');
if (!typingBar && chatForm) {
  typingBar = document.createElement('div');
  typingBar.id = 'chat-typing-bar';
  typingBar.className = 'typing-bar';
  chatForm.before(typingBar);
}
buildChannelBar();

const ROLE_POWER = { FOUNDER: 100, 'HEAD DEV': 95, DEVELOPER: 90, ADMIN: 80, MODERATOR: 60, BETA: 30, UPLOADER: 25, DESIGNER: 25, VIP: 20, SUPPORTER: 15, MEMBER: 10, SYSTEM: 90 };

const SLASH_CMDS = [
  { cmd: '/help', desc: 'Show all available commands', staff: false },
  { cmd: '/credits', desc: 'Check your Z-Credits & Level', staff: false },
  { cmd: '/pay @user 50', desc: 'Send Z-Credits to another member', staff: false },
  { cmd: '/purge 10', desc: 'Delete the last N messages in this channel', staff: true },
  { cmd: '/warn @user reason', desc: 'Warn a member & log infraction', staff: true },
  { cmd: '/mute @user 10m reason', desc: 'Mute a member (10m, 1h, 1d)', staff: true },
  { cmd: '/unmute @user', desc: 'Unmute a member', staff: true },
  { cmd: '/ban @user 1h reason', desc: 'Ban a member with duration & reason', staff: true },
  { cmd: '/unban @user', desc: 'Lift a member ban', staff: true },
  { cmd: '/clear', desc: 'Clear chat history', staff: true },
  { cmd: '/give @user 250', desc: 'Grant Z-Credits to a member (Founder)', founder: true },
  { cmd: '/announce message', desc: 'Post system broadcast in chat (Founder)', founder: true }
];
function parseDurationMs(str) {
  const m = String(str || '').match(/^(\d+)([mhd])$/i);
  if (!m) return 600000;
  const n = parseInt(m.at(1), 10);
  const unit = m.at(2).toLowerCase();
  return unit === 'd' ? n * 86400000 : unit === 'h' ? n * 3600000 : n * 60000;
}

async function logInfraction(targetName, type, reason) {
  const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}&select=id,infractions`).catch(() => []);
  const u = Array.isArray(found) ? found.at(0) : null;
  if (!u) return;
  const prev = Array.isArray(u.infractions) ? u.infractions : [];
  const next = [{ type, reason, by: window.userProfile?.username || 'Staff', at: new Date().toLocaleDateString() }, ...prev].slice(0, 20);
  await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { infractions: next }, window.authToken).catch(() => {});
}

function canDeleteMsg(me, msg) {
  if (!me) return false;
  if (me.role === 'FOUNDER') return true;
  if (msg.user_id && String(msg.user_id) === String(me.id)) return true;
  const myPow = ROLE_POWER[me.role] || 10;
  const targetPow = ROLE_POWER[msg.role] || 10;
  return myPow >= 60 && myPow > targetPow;
}

function getStickerLimit(p) {
  if (!p) return 0;
  if (p.role !== 'MEMBER' || (p.rank_index || 0) >= 1 || (p.extra_roles || []).length > 0) return 10;
  return 2;
}

window.openNewDmModal = function() {
  const p = window.userProfile;
  if (!p) return window.notify?.('Sign in to start a Private DM!', true);
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const others = cachedUsers.filter(u => String(u.id) !== String(p.id));
  box.style.maxWidth = '420px';
  box.innerHTML = `<div style="padding:20px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h3>Start Private DM</h3><button class="btn-ghost" onclick="document.getElementById('user-modal').classList.add('hidden')">✕</button></div><div style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;">${others.map(u => `<div class="ac-item" data-dm-uid="${u.id}" data-dm-name="${u.username}" style="border-radius:8px;background:rgba(4,7,11,0.75);"><strong style="color:${u.equipped_color || '#10b981'}">@${u.username}</strong><span class="mono-dim">[${u.role}]</span></div>`).join('') || '<p class="sub-text">No other members available yet.</p>'}</div></div>`;
  modal.classList.remove('hidden');
  box.querySelectorAll('[data-dm-uid]').forEach(el => (el.onclick = () => {
    modal.classList.add('hidden');
    const pair = [String(p.id), String(el.dataset.dmUid)].sort().join('_');
    window.switchChatChannel(`dm_${pair}`, `@${el.dataset.dmName}`);
  }));
};

window.openReactPicker = function(btn, msgId) {
  document.querySelectorAll('.react-popover').forEach(p => p.remove());
  document.querySelectorAll('.msg-actions.open').forEach(a => a.classList.remove('open'));
  const bar = btn.closest('.msg-actions');
  if (!bar) return;
  bar.classList.add('open');
  const pop = document.createElement('div');
  pop.className = 'react-popover';
  pop.innerHTML = ALL_EMOJIS.map(em => `<button type="button" class="react-choice" onclick="toggleReaction(${msgId}, '${em}')">${em}</button>`).join('');
  bar.appendChild(pop);
};

window.toggleChatDrawer = function() {
  if (!drawerBox) return;
  drawerBox.classList.toggle('hidden');
  if (drawerBox.classList.contains('hidden')) return;
  const p = window.userProfile;
  const limit = getStickerLimit(p);
  const myStickers = Array.isArray(p?.stickers) ? p.stickers : [];
  drawerBox.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="font-size:0.84rem;color:#10b981;">Stickers (${myStickers.length}/${limit}) & Emojis</strong><div style="display:flex;gap:6px;"><button type="button" class="btn-outline" style="padding:4px 10px;font-size:0.78rem;" id="add-sticker-btn">+ Upload Sticker</button><button type="button" class="btn-ghost" onclick="drawerBox.classList.add('hidden')">✕</button></div></div><input type="file" id="sticker-file-inp" accept="image/*" style="position:fixed;left:-9999px;opacity:0;width:1px;height:1px;" /><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">${myStickers.map((src, i) => `<img src="${src}" style="width:58px;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:1px solid rgba(255,255,255,0.12);" onclick="sendStickerImg(${i})" />`).join('') || '<span class="mono-dim">No custom stickers uploaded yet.</span>'}</div><div style="display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">${ALL_EMOJIS.map(em => `<button type="button" class="react-choice" onclick="const i=document.getElementById('chat-input');i.value+='${em}';i.focus();">${em}</button>`).join('')}</div>`;
  document.getElementById('add-sticker-btn').onclick = () => {
    if (!p) return window.notify?.('Sign in to upload stickers!', true);
    if (myStickers.length >= limit) return window.notify?.(`Sticker limit reached (${limit} max).`, true);
    document.getElementById('sticker-file-inp').click();
  };
  document.getElementById('sticker-file-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    const compressed = await compressChatImg(f, 220);
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { stickers: [...myStickers, compressed] }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Sticker saved!');
    window.toggleChatDrawer();
  };
};
window.sendStickerImg = async function(idx) {
  const p = window.userProfile;
  const src = p?.stickers?.[idx];
  if (!p || !src) return;
  drawerBox?.classList.add('hidden');
  appendSingleMsg({ id: Date.now(), user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: '[Sticker]', image_url: src, created_at: new Date().toISOString() });
  await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: 'logo.png', role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: '[Sticker]', image_url: src, channel: activeChannel }, window.authToken);
  lastChatHash = '';
};

window.clearPendingAttachment = function() {
  pendingAttachment = null;
  document.getElementById('chat-attach-preview')?.remove();
};

document.getElementById('chat-file-inp')?.addEventListener('change', async (e) => {
  const f = e.target.files?.at(0);
  const p = window.userProfile;
  e.target.value = '';
  if (!f || !p) return;
  if (activeChannel === 'updates' && p.role !== 'FOUNDER') return window.notify?.('Only Founder can post in #updates.', true);
  const limitInfo = getUploadLimitInfo(p);
  const sizeMB = f.size / (1024 * 1024);
  if (sizeMB > limitInfo.mb) return window.notify?.(`File too large (${sizeMB.toFixed(1)} MB). Your limit is ${limitInfo.label}.`, true);
  const compressed = await compressChatImg(f, 680);
  pendingAttachment = { name: f.name, dataUrl: compressed, sizeLabel: `${sizeMB.toFixed(2)} MB`, isVid: f.type.startsWith('video/') };
  let prev = document.getElementById('chat-attach-preview');
  if (!prev) { prev = document.createElement('div'); prev.id = 'chat-attach-preview'; prev.className = 'reply-banner'; chatForm?.before(prev); }
  const thumb = pendingAttachment.isVid ? `<div style="width:44px;height:44px;border-radius:8px;background:#04070b;display:flex;align-items:center;justify-content:center;border:1px solid var(--neon-emerald);font-size:0.7rem;">VID</div>` : `<img src="${compressed}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid var(--neon-emerald);" />`;
  prev.innerHTML = `<div style="display:flex;align-items:center;gap:10px;">${thumb}<div><strong>${f.name}</strong><div class="mono-dim">${pendingAttachment.sizeLabel} • Ready to send</div></div></div><button type="button" class="btn-ghost" onclick="clearPendingAttachment()">✕</button>`;
  document.getElementById('chat-input')?.focus();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.msg-actions')) {
    document.querySelectorAll('.react-popover').forEach(p => p.remove());
    document.querySelectorAll('.msg-actions.open').forEach(a => a.classList.remove('open'));
  }
});

window.toggleReaction = async function(msgId, emoji) {
  const me = window.userProfile;
  if (!me) return window.notify?.('Sign in to react to messages!', true);
  document.querySelectorAll('.react-popover').forEach(p => p.remove());
  try {
    const rows = await window.sbRest(`messages?id=eq.${msgId}&select=id,reactions`);
    const m = Array.isArray(rows) ? rows.at(0) : null;
    if (!m) return;
    const reacts = m.reactions && typeof m.reactions === 'object' ? { ...m.reactions } : {};
    const list = Array.isArray(reacts[emoji]) ? [...reacts[emoji]] : [];
    const idx = list.indexOf(me.username);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(me.username);
    if (list.length) reacts[emoji] = list;
    else delete reacts[emoji];
    await window.sbRest(`messages?id=eq.${msgId}`, 'PATCH', { reactions: reacts }, window.authToken);
    lastChatHash = '';
    pollChatAndMembers();
  } catch (err) { window.notify?.('Reaction error: ' + err.message, true); }
};

window.deleteChatMsg = async function(msgId) {
  document.querySelector(`[data-mid="${msgId}"]`)?.remove();
  await window.sbRest(`messages?id=eq.${msgId}`, 'DELETE', null, window.authToken).catch(() => {});
  lastChatHash = '';
};

window.reportChatMsg = async function(msgId, targetUser, msgText) {
  const me = window.userProfile;
  if (!me) return window.notify?.('Sign in to report messages!', true);
  const reason = prompt(`Report @${targetUser} — Enter reason:`);
  if (!reason || !reason.trim()) return;
  await window.sbRest('zynk_reports', 'POST', { reporter: me.username, target_user: targetUser, message_id: msgId, message_text: msgText, channel: activeChannel, reason: reason.trim() }, window.authToken);
  window.notify?.('Report submitted!');
};

window.editChatMsg = function(msgId, oldText) {
  const row = document.querySelector(`[data-mid="${msgId}"]`);
  const textEl = row?.querySelector('.msg-text-body');
  if (!textEl || row.querySelector('.inline-edit-wrap')) return;
  const prevHtml = textEl.innerHTML;
  textEl.innerHTML = `<div class="inline-edit-wrap" style="margin-top:4px;"><input type="text" class="tool-input inline-edit-inp" style="margin:0;padding:7px 10px;font-size:0.9rem;" value="${oldText.replace(/"/g, '&quot;')}" /><div class="mono-dim" style="font-size:0.72rem;margin-top:4px;">escape to <span class="inline-cancel" style="color:#06b6d4;cursor:pointer;text-decoration:underline;">cancel</span> • enter to <span class="inline-save" style="color:#10b981;cursor:pointer;text-decoration:underline;">save</span></div></div>`;
  const inp = textEl.querySelector('.inline-edit-inp');
  inp.focus();
  const cancel = () => { textEl.innerHTML = prevHtml; };
  const save = async () => {
    const next = inp.value.trim();
    if (!next || next === oldText) return cancel();
    textEl.innerHTML = `${formatDiscordMarkdown(next)} <span class="mono-dim">(edited)</span>`;
    await window.sbRest(`messages?id=eq.${msgId}`, 'PATCH', { content: next, edited: true }, window.authToken);
    lastChatHash = '';
    pollChatAndMembers();
  };
  textEl.querySelector('.inline-cancel').onclick = cancel;
  textEl.querySelector('.inline-save').onclick = save;
  inp.onkeydown = (ev) => { if (ev.key === 'Escape') cancel(); if (ev.key === 'Enter') save(); };
};
window.setChatReply = function(username, text) {
  activeReply = `@${username}: ${text.slice(0, 65)}`;
  let bar = document.getElementById('reply-preview-bar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'reply-preview-bar'; bar.className = 'reply-banner'; chatForm?.before(bar); }
  bar.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">${CHAT_SVG.reply} Replying to <strong>${activeReply}</strong></span><button type="button" class="btn-ghost" onclick="clearChatReply()">✕</button>`;
  document.getElementById('chat-input')?.focus();
};

window.clearChatReply = function() {
  activeReply = null;
  document.getElementById('reply-preview-bar')?.remove();
};

function buildMsgEl(m) {
  const me = window.userProfile;
  const isPinged = me && m.content && new RegExp(`@${me.username}\\b`, 'i').test(m.content) && m.username !== me.username;
  const div = document.createElement('div');
  div.className = 'chat-msg' + (isPinged ? ' pinged' : '');
  div.dataset.mid = m.id;
  const matchedUser = cachedUsers.find(u => u.username === m.username);
  const rawAv = matchedUser?.avatar || m.avatar;
  const av = rawAv && !String(rawAv).includes('dicebear') ? rawAv : 'logo.png';
  const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const safeText = formatDiscordMarkdown(m.content || '');
  const isOwner = me && m.user_id && String(m.user_id) === String(me.id);
  const canDel = canDeleteMsg(me, m);
  const reacts = m.reactions && typeof m.reactions === 'object' ? m.reactions : {};
  const reactHtml = Object.entries(reacts).filter(([, arr]) => Array.isArray(arr) && arr.length).map(([em, arr]) => {
    const mine = me && arr.includes(me.username);
    return `<button type="button" class="react-pill ${mine ? 'mine' : ''}" title="Reacted by ${arr.map(u => '@' + u).join(', ')}" onclick="toggleReaction(${m.id}, '${em}')">${em} ${arr.length}</button>`;
  }).join('');
  const badgeIcons = matchedUser && window.renderRoleBadgeIcons ? window.renderRoleBadgeIcons(matchedUser) : '';
  const isVideo = String(m.image_url || '').startsWith('data:video');
  const mediaHtml = m.image_url ? (isVideo ? `<video src="${m.image_url}" controls class="chat-img-attach" style="max-width:340px;"></video>` : `<img src="${m.image_url}" class="chat-img-attach" style="${m.content === '[Sticker]' ? 'width:110px;height:110px;border:none;' : ''}" />`) : '';
  div.innerHTML = `<div class="msg-actions"><button type="button" class="msg-act-btn" title="Add Reaction" onclick="openReactPicker(this, ${m.id})">${CHAT_SVG.react}</button><button type="button" class="msg-act-btn" title="Reply" onclick="setChatReply('${m.username}', \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.reply}</button>${isOwner ? `<button type="button" class="msg-act-btn" title="Edit Message" onclick="editChatMsg(${m.id}, \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.edit}</button>` : ''}${!isOwner && m.username !== 'ZynkBot' ? `<button type="button" class="msg-act-btn" style="color:#f59e0b;" title="Report Message" onclick="reportChatMsg(${m.id}, '${m.username}', \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.flag}</button>` : ''}${canDel ? `<button type="button" class="msg-act-btn" style="color:#f43f5e;" title="Delete Message" onclick="deleteChatMsg(${m.id})">${CHAT_SVG.trash}</button>` : ''}</div><img class="msg-avatar" src="${av}" /><div style="flex:1;min-width:0;">${m.reply_to ? `<div class="reply-quote">${CHAT_SVG.reply} <span>${String(m.reply_to).replace(/</g, '&lt;')}</span></div>` : ''}<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><strong style="color:${m.color || '#10b981'};cursor:pointer;" class="msg-author">${m.username}</strong>${badgeIcons}<span class="mono-dim">[${m.role || 'MEMBER'}]${m.is_beta ? ' [BETA]' : ''} • ${timeStr}</span></div>${m.content && m.content !== '[Sticker]' ? `<div class="msg-text-body" style="margin-top:3px;word-break:break-word;">${safeText}${m.edited ? ' <span class="mono-dim">(edited)</span>' : ''}</div>` : ''}${mediaHtml}${reactHtml ? `<div class="react-row">${reactHtml}</div>` : ''}</div>`;
  const openProf = () => { if (m.user_id && window.openUserModal) window.openUserModal(m.user_id); };
  div.querySelector('.msg-avatar').onclick = openProf;
  div.querySelector('.msg-author').onclick = openProf;
  return div;
}

function appendSingleMsg(m) {
  if (!msgBox) return;
  msgBox.appendChild(buildMsgEl(m));
  msgBox.scrollTop = msgBox.scrollHeight;
}

function renderMessages(msgs) {
  if (!msgBox) return;
  const wasAtBottom = msgBox.scrollHeight - msgBox.scrollTop - msgBox.clientHeight < 90;
  msgBox.innerHTML = '';
  msgs.forEach(m => msgBox.appendChild(buildMsgEl(m)));
  if (wasAtBottom || !initialChatLoaded) msgBox.scrollTop = msgBox.scrollHeight;
}
async function pollChatAndMembers() {
  if (!window.sbRest) return;
  const me = window.userProfile;
  if (!canAccessChannel(me, activeChannel)) { activeChannel = 'global'; window.activeChatLabel = '#zynk-global'; buildChannelBar(); }
  try {
    const cols = 'id,user_id,username,role,color,content,reply_to,edited,reactions,is_beta,created_at,image_url,channel';
    const filter = activeChannel === 'global' ? 'or=(channel.eq.global,channel.is.null)' : `channel=eq.${encodeURIComponent(activeChannel)}`;
    const msgs = await window.sbRest(`messages?select=${cols}&${filter}&order=id.desc&limit=35`);
    if (Array.isArray(msgs)) {
      msgs.reverse();
      const hash = activeChannel + ':' + JSON.stringify(msgs.map(m => [m.id, m.content, m.edited, m.reactions]));
      if (hash !== lastChatHash) { lastChatHash = hash; renderMessages(msgs); }
    }
  } catch (err) {}
  initialChatLoaded = true;

  const users = await window.sbRest('users?select=id,username,role,extra_roles,avatar,equipped_color,online,typing_until,activity_text,last_channel,last_seen&order=online.desc,xp.desc&limit=60').catch(() => []);
  if (Array.isArray(users)) {
    cachedUsers = users;
    const typers = users.filter(u => Number(u.typing_until || 0) > Date.now() && (!me || String(u.id) !== String(me.id)));
    if (typingBar) typingBar.innerHTML = typers.length ? `<span class="typing-pill">${typers.map(t => '@' + t.username).join(', ')} typing...</span>` : '';
    if (memBox) {
      const online = users.filter(u => u.online);
      const offline = users.filter(u => !u.online);
      const renderMem = (u, isOn) => `<div class="member-card" style="opacity:${isOn ? '1' : '0.62'}" onclick="openUserModal('${u.id}')"><div class="mem-av-wrap"><img src="${u.avatar || 'logo.png'}" /><span class="mem-dot" style="background:${isOn ? '#10b981' : '#64748b'}"></span></div><div style="min-width:0;flex:1;"><div style="color:${u.equipped_color || '#f8fafc'};font-weight:700;font-size:0.84rem;">${u.username}</div><div class="mono-dim" style="font-size:0.68rem;">${u.role}</div></div></div>`;
      memBox.innerHTML = `<div class="members-head">ONLINE — ${online.length}</div>${online.map(u => renderMem(u, true)).join('')}<div class="members-head">OFFLINE — ${offline.length}</div>${offline.map(u => renderMem(u, false)).join('')}`;
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm?.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'chat-input') return;
  const inp = e.target;
  inp.style.height = 'auto';
  inp.style.height = Math.min(130, inp.scrollHeight) + 'px';
  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const cc = document.getElementById('chat-char-count');
  if (cc) cc.textContent = `${inp.value.length}/${isFounder ? '∞' : '2000'}`;
  if (p && inp.value.length > 0 && Date.now() - lastTypingPing > 1000) {
    lastTypingPing = Date.now();
    window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { typing_until: Date.now() + 5500 }, window.authToken).catch(() => {});
  }
  if (!acBox) return;
  const val = inp.value;
  const isStaff = p && ['FOUNDER', 'HEAD DEV', 'DEVELOPER', 'ADMIN', 'MODERATOR'].includes((p.role || '').toUpperCase());
  if (val.startsWith('/')) {
    const q = val.toLowerCase().split(' ').at(0);
    const matches = SLASH_CMDS.filter(c => (!c.staff || isStaff) && (!c.founder || isFounder) && c.cmd.startsWith(q));
    if (!matches.length) return acBox.classList.add('hidden');
    acBox.innerHTML = matches.map(c => `<div class="ac-item" data-fill="${c.cmd.split(' ').slice(0, 2).join(' ')} "><strong>${c.cmd}</strong><span class="mono-dim">${c.desc}</span></div>`).join('');
    acBox.classList.remove('hidden');
    acBox.querySelectorAll('.ac-item').forEach(el => (el.onclick = () => { inp.value = el.dataset.fill; acBox.classList.add('hidden'); inp.focus(); }));
    return;
  }
  acBox.classList.add('hidden');
});

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inp = document.getElementById('chat-input');
  const raw = inp?.value.trim() || '';
  const att = pendingAttachment;
  const p = window.userProfile;
  if ((!raw && !att) || !p) return;
  const isFounder = p.role === 'FOUNDER';
  inp.value = '';
  inp.style.height = 'auto';
  const cc = document.getElementById('chat-char-count');
  if (cc) cc.textContent = `0/${isFounder ? '∞' : '2000'}`;
  window.clearPendingAttachment();
  const replyText = activeReply || '';
  window.clearChatReply();
  const mult = (p.boost_until && p.boost_until > Date.now()) ? 2 : 1;
  appendSingleMsg({ id: Date.now(), user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: raw, image_url: att?.dataUrl || '', reply_to: replyText, created_at: new Date().toISOString() });
  await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: 'logo.png', role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: raw, image_url: att?.dataUrl || '', reply_to: replyText, channel: activeChannel }, window.authToken);
  lastChatHash = '';
  window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + (5 * mult), xp: (p.xp || 0) + (25 * mult), msg_count: (p.msg_count || 0) + 1, typing_until: 0, last_channel: window.activeChatLabel, last_seen: Date.now() }, window.authToken).then(() => window.refreshMyProfile()).catch(() => {});
});

window.addEventListener('zynk-profile-updated', buildChannelBar);
setInterval(pollChatAndMembers, 2000);
pollChatAndMembers();
