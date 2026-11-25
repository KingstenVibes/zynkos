const msgBox = document.getElementById('chat-messages');
const memBox = document.getElementById('online-members-list');
const acBox = document.getElementById('chat-ac-box');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
let cachedUsers = [];
let initialChatLoaded = false;
let activeReply = null;
let lastChatHash = '';
let lastNotifiedMsgId = 0;
let lastTypingPing = 0;
let activeChannel = 'global';
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

function compressChatImg(file, maxDim = 540) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderChanBadge(ch) {
  const pings = channelPings[ch] || 0;
  if (pings > 0) return `<span style="background:#f43f5e;color:#fff;font-size:0.68rem;font-weight:800;padding:1px 6px;border-radius:999px;margin-left:5px;">${pings}</span>`;
  if (channelUnread[ch]) return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin-left:6px;"></span>`;
  return '';
}
function buildChannelBar() {
  const chatHeader = document.querySelector('#chat-view .view-topbar');
  if (!chatHeader) return;
  let bar = document.getElementById('chat-chan-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'chat-chan-bar';
    bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;';
    chatHeader.insertBefore(bar, document.getElementById('chat-credits'));
  }
  const p = window.userProfile;
  const isBeta = p && (p.role === 'FOUNDER' || p.role === 'BETA' || p.is_beta || (p.extra_roles || []).includes('BETA'));
  bar.innerHTML = `
    <button type="button" class="${activeChannel === 'global' ? 'btn-neon' : 'btn-outline'}" data-ch="global" style="padding:5px 11px;font-size:0.8rem;"># zynk-global${renderChanBadge('global')}</button>
    <button type="button" class="${activeChannel === 'updates' ? 'btn-neon' : 'btn-outline'}" data-ch="updates" style="padding:5px 11px;font-size:0.8rem;"># updates${renderChanBadge('updates')}</button>
    ${isBeta ? `<button type="button" class="${activeChannel === 'beta' ? 'btn-neon' : 'btn-outline'}" data-ch="beta" style="padding:5px 11px;font-size:0.8rem;"># beta-lab${renderChanBadge('beta')}</button>` : ''}
    <button type="button" class="btn-outline" id="new-dm-btn" style="padding:5px 11px;font-size:0.8rem;">Private DM</button>`;

  bar.querySelectorAll('[data-ch]').forEach(b => (b.onclick = () => {
    window.switchChatChannel(b.dataset.ch, b.dataset.ch === 'global' ? '#zynk-global' : `#${b.dataset.ch}`);
  }));
  document.getElementById('new-dm-btn').onclick = () => window.openNewDmModal();

  const totalPings = Object.values(channelPings).reduce((a, b) => a + b, 0);
  const dockBadge = document.getElementById('dock-chat-badge');
  if (dockBadge) {
    dockBadge.textContent = totalPings;
    dockBadge.classList.toggle('hidden', totalPings === 0);
  }
}

window.switchChatChannel = function(chId, label) {
  activeChannel = chId;
  window.activeChatLabel = label || (chId === 'global' ? '#zynk-global' : `#${chId}`);
  channelUnread[chId] = false;
  channelPings[chId] = 0;
  lastChatHash = '';
  const h2 = document.querySelector('#chat-view .view-topbar h2');
  if (h2) h2.textContent = window.activeChatLabel;
  buildChannelBar();
  if (chatInput) chatInput.placeholder = `Message ${window.activeChatLabel}... (Type / or @)`;
  pollChatAndMembers();
};

if (chatForm && !document.getElementById('chat-file-inp')) {
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.id = 'chat-file-inp';
  fileInp.accept = 'image/*';
  fileInp.style.cssText = 'position:fixed;left:-9999px;opacity:0;width:1px;height:1px;';

  const imgBtn = document.createElement('button');
  imgBtn.type = 'button';
  imgBtn.className = 'chat-tool-btn';
  imgBtn.title = 'Upload Image';
  imgBtn.innerHTML = CHAT_SVG.plus;
  imgBtn.onclick = () => fileInp.click();

  const stkBtn = document.createElement('button');
  stkBtn.type = 'button';
  stkBtn.className = 'chat-tool-btn';
  stkBtn.title = 'Stickers & Emojis';
  stkBtn.innerHTML = CHAT_SVG.sticker;
  stkBtn.onclick = () => window.toggleChatDrawer();

  chatForm.insertBefore(fileInp, chatInput);
  chatForm.insertBefore(imgBtn, chatInput);
  chatForm.insertBefore(stkBtn, chatInput);
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

const ROLE_POWER = { FOUNDER: 100, ADMIN: 80, MODERATOR: 60, BETA: 30, UPLOADER: 25, DESIGNER: 25, VIP: 20, SUPPORTER: 15, MEMBER: 10, SYSTEM: 90 };

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
  box.innerHTML = `
    <div style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>Start Private DM</h3>
        <button class="btn-ghost" onclick="document.getElementById('user-modal').classList.add('hidden')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;">
        ${others.map(u => `<div class="ac-item" data-dm-uid="${u.id}" data-dm-name="${u.username}" style="border-radius:8px;background:rgba(4,7,11,0.75);"><strong style="color:${u.equipped_color || '#10b981'}">@${u.username}</strong><span class="mono-dim">[${u.role}]</span></div>`).join('') || '<p class="sub-text">No other members available yet.</p>'}
      </div>
    </div>`;
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
  drawerBox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:0.84rem;color:#10b981;">Stickers (${myStickers.length}/${limit}) & Emojis</strong>
      <div style="display:flex;gap:6px;">
        <button type="button" class="btn-outline" style="padding:4px 10px;font-size:0.78rem;" id="add-sticker-btn">+ Upload Sticker</button>
        <button type="button" class="btn-ghost" onclick="drawerBox.classList.add('hidden')">✕</button>
      </div>
    </div>
    <input type="file" id="sticker-file-inp" accept="image/*" style="position:fixed;left:-9999px;opacity:0;width:1px;height:1px;" />
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      ${myStickers.map((src, i) => `<img src="${src}" style="width:58px;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:1px solid rgba(255,255,255,0.12);" onclick="sendStickerImg(${i})" />`).join('') || '<span class="mono-dim">No custom stickers uploaded yet.</span>'}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">
      ${ALL_EMOJIS.map(em => `<button type="button" class="react-choice" onclick="chatInput.value+='${em}';chatInput.focus();">${em}</button>`).join('')}
    </div>`;

  document.getElementById('add-sticker-btn').onclick = () => {
    if (!p) return window.notify?.('Sign in to upload stickers!', true);
    if (myStickers.length >= limit) return window.notify?.(`Sticker limit reached (${limit} max).`, true);
    document.getElementById('sticker-file-inp').click();
  };
  document.getElementById('sticker-file-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    const compressed = await compressChatImg(f, 220);
    const next = [...myStickers, compressed];
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { stickers: next }, window.authToken);
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
document.addEventListener('click', (e) => {
  if (!e.target.closest('.msg-actions')) {
    document.querySelectorAll('.react-popover').forEach(p => p.remove());
    document.querySelectorAll('.msg-actions.open').forEach(a => a.classList.remove('open'));
  }
});

document.getElementById('chat-file-inp')?.addEventListener('change', async (e) => {
  const f = e.target.files?.at(0);
  const p = window.userProfile;
  if (!f || !p) return;
  if (activeChannel === 'updates' && p.role !== 'FOUNDER') {
    e.target.value = '';
    return window.notify?.('Only Founder can post in #updates.', true);
  }
  const caption = chatInput.value.trim() || f.name;
  chatInput.value = '';
  e.target.value = '';
  window.notify?.('Uploading image...');
  try {
    const compressed = await compressChatImg(f, 560);
    appendSingleMsg({ id: Date.now(), user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: caption, image_url: compressed, created_at: new Date().toISOString() });
    await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: 'logo.png', role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: caption, image_url: compressed, channel: activeChannel }, window.authToken);
    lastChatHash = '';
    pollChatAndMembers();
  } catch (err) {
    window.notify?.('Image upload failed: ' + err.message, true);
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
  } catch (err) {
    window.notify?.('Reaction error: ' + err.message, true);
  }
};

window.deleteChatMsg = async function(msgId) {
  document.querySelector(`[data-mid="${msgId}"]`)?.remove();
  try {
    await window.sbRest(`messages?id=eq.${msgId}`, 'DELETE', null, window.authToken);
    lastChatHash = '';
  } catch (err) {
    window.notify?.('Delete failed: ' + err.message, true);
  }
};

window.reportChatMsg = async function(msgId, targetUser, msgText) {
  const me = window.userProfile;
  if (!me) return window.notify?.('Sign in to report messages!', true);
  const reason = prompt(`Report @${targetUser} — Enter reason (e.g. Spam, Harassment, NSFW):`);
  if (!reason || !reason.trim()) return;
  await window.sbRest('zynk_reports', 'POST', { reporter: me.username, target_user: targetUser, message_id: msgId, message_text: msgText, channel: activeChannel, reason: reason.trim() }, window.authToken);
  window.notify?.('Report submitted to Moderation Queue!');
};

window.editChatMsg = function(msgId, oldText) {
  const row = document.querySelector(`[data-mid="${msgId}"]`);
  const textEl = row?.querySelector('.msg-text-body');
  if (!textEl || row.querySelector('.inline-edit-wrap')) return;

  const prevHtml = textEl.innerHTML;
  textEl.innerHTML = `
    <div class="inline-edit-wrap" style="margin-top:4px;">
      <input type="text" class="tool-input inline-edit-inp" style="margin:0;padding:7px 10px;font-size:0.9rem;" value="${oldText.replace(/"/g, '&quot;')}" />
      <div class="mono-dim" style="font-size:0.72rem;margin-top:4px;">escape to <span class="inline-cancel" style="color:#06b6d4;cursor:pointer;text-decoration:underline;">cancel</span> • enter to <span class="inline-save" style="color:#10b981;cursor:pointer;text-decoration:underline;">save</span></div>
    </div>`;

  const inp = textEl.querySelector('.inline-edit-inp');
  inp.focus();
  inp.setSelectionRange(inp.value.length, inp.value.length);

  const cancel = () => { textEl.innerHTML = prevHtml; };
  const save = async () => {
    const next = inp.value.trim();
    if (!next || next === oldText) return cancel();
    textEl.innerHTML = `${next.replace(/</g, '&lt;')} <span class="mono-dim">(edited)</span>`;
    await window.sbRest(`messages?id=eq.${msgId}`, 'PATCH', { content: next, edited: true }, window.authToken);
    lastChatHash = '';
    pollChatAndMembers();
  };

  textEl.querySelector('.inline-cancel').onclick = cancel;
  textEl.querySelector('.inline-save').onclick = save;
  inp.onkeydown = (ev) => {
    if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
    if (ev.key === 'Enter') { ev.preventDefault(); save(); }
  };
};

window.setChatReply = function(username, text) {
  activeReply = `@${username}: ${text.slice(0, 65)}`;
  let bar = document.getElementById('reply-preview-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reply-preview-bar';
    bar.className = 'reply-banner';
    chatForm?.before(bar);
  }
  bar.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">${CHAT_SVG.reply} Replying to <strong>${activeReply}</strong></span><button type="button" class="btn-ghost" onclick="clearChatReply()">✕</button>`;
  chatInput?.focus();
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
  const safeText = String(m.content || '').replace(/</g, '&lt;').replace(/(@[a-zA-Z0-9_]+)/g, '<strong style="color:#10b981;">$1</strong>');

  const isOwner = me && m.user_id && String(m.user_id) === String(me.id);
  const canDel = canDeleteMsg(me, m);
  const reacts = m.reactions && typeof m.reactions === 'object' ? m.reactions : {};
  const reactHtml = Object.entries(reacts).filter(([, arr]) => Array.isArray(arr) && arr.length).map(([em, arr]) => {
    const mine = me && arr.includes(me.username);
    const who = arr.map(u => '@' + u).join(', ');
    return `<button type="button" class="react-pill ${mine ? 'mine' : ''}" title="Reacted by ${who}" onclick="toggleReaction(${m.id}, '${em}')">${em} ${arr.length}</button>`;
  }).join('');

  div.innerHTML = `
    <div class="msg-actions">
      <button type="button" class="msg-act-btn" title="Add Reaction" onclick="openReactPicker(this, ${m.id})">${CHAT_SVG.react}</button>
      <button type="button" class="msg-act-btn" title="Reply" onclick="setChatReply('${m.username}', \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.reply}</button>
      ${isOwner ? `<button type="button" class="msg-act-btn" title="Edit Message" onclick="editChatMsg(${m.id}, \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.edit}</button>` : ''}
      ${!isOwner && m.username !== 'ZynkBot' ? `<button type="button" class="msg-act-btn" style="color:#f59e0b;" title="Report Message" onclick="reportChatMsg(${m.id}, '${m.username}', \`${String(m.content || '').replace(/`/g, '')}\`)">${CHAT_SVG.flag}</button>` : ''}
      ${canDel ? `<button type="button" class="msg-act-btn" style="color:#f43f5e;" title="Delete Message" onclick="deleteChatMsg(${m.id})">${CHAT_SVG.trash}</button>` : ''}
    </div>
    <img class="msg-avatar" src="${av}" />
    <div style="flex:1;min-width:0;">
      ${m.reply_to ? `<div class="reply-quote">${CHAT_SVG.reply} <span>${String(m.reply_to).replace(/</g, '&lt;')}</span></div>` : ''}
      <div><strong style="color:${m.color || '#10b981'};cursor:pointer;" class="msg-author">${m.username}</strong> <span class="mono-dim">[${m.role || 'MEMBER'}]${m.is_beta ? ' [BETA]' : ''} • ${timeStr}</span></div>
      ${m.content !== '[Sticker]' ? `<div class="msg-text-body" style="margin-top:3px;word-break:break-word;">${safeText}${m.edited ? ' <span class="mono-dim">(edited)</span>' : ''}</div>` : ''}
      ${m.image_url ? `<img src="${m.image_url}" class="chat-img-attach" style="${m.content === '[Sticker]' ? 'width:110px;height:110px;border:none;' : ''}" />` : ''}
      ${reactHtml ? `<div class="react-row">${reactHtml}</div>` : ''}
    </div>`;
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

function formatLastSeen(ts) {
  if (!ts) return '';
  const mins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
async function pollChatAndMembers() {
  if (!window.sbRest) return;
  const me = window.userProfile;
  try {
    const cols = 'id,user_id,username,role,color,content,reply_to,edited,reactions,is_beta,created_at,image_url,channel';
    const filter = activeChannel === 'global' ? 'or=(channel.eq.global,channel.is.null)' : `channel=eq.${encodeURIComponent(activeChannel)}`;
    const msgs = await window.sbRest(`messages?select=${cols}&${filter}&order=id.desc&limit=35`);
    if (Array.isArray(msgs)) {
      msgs.reverse();
      const hash = activeChannel + ':' + JSON.stringify(msgs.map(m => [m.id, m.content, m.edited, m.reactions]));
      if (hash !== lastChatHash) {
        lastChatHash = hash;
        renderMessages(msgs);
      }
    }

    const recentAll = await window.sbRest(`messages?select=id,username,content,channel&id=gt.${lastNotifiedMsgId}&order=id.asc&limit=20`).catch(() => []);
    if (Array.isArray(recentAll) && recentAll.length) {
      recentAll.forEach(m => {
        if (m.id > lastNotifiedMsgId) lastNotifiedMsgId = m.id;
        if (!initialChatLoaded || !me || m.username === me.username || m.username === 'ZynkBot') return;
        const ch = m.channel || 'global';
        if (ch !== activeChannel || !document.getElementById('chat-view')?.classList.contains('active')) {
          channelUnread[ch] = true;
        }
        if (new RegExp(`@${me.username}\\b`, 'i').test(m.content || '')) {
          channelPings[ch] = (channelPings[ch] || 0) + 1;
          window.notify?.(`@${m.username} pinged you in #${ch}: "${m.content}"`, false, () => {
            window.openTab('chat-view');
            window.switchChatChannel(ch, ch === 'global' ? '#zynk-global' : `#${ch}`);
          });
        }
      });
      buildChannelBar();
    }
  } catch (err) {
    console.warn('Chat sync:', err.message);
  }
  initialChatLoaded = true;

  const users = await window.sbRest('users?select=id,username,role,extra_roles,avatar,equipped_color,online,typing_until,activity_text,last_channel,last_seen&order=online.desc,xp.desc&limit=60').catch(() => []);
  if (Array.isArray(users)) {
    cachedUsers = users;
    const typers = users.filter(u => u.typing_until && u.typing_until > Date.now() && (!me || u.id !== me.id));
    if (typingBar) {
      if (typers.length) {
        const names = typers.length === 1 ? `@${typers.at(0).username} is typing...` : `${typers.map(t => '@' + t.username).join(', ')} are typing...`;
        typingBar.innerHTML = `<span class="typing-pill"><span class="typing-dots"><span></span><span></span><span></span></span><span>${names}</span></span>`;
      } else {
        typingBar.innerHTML = '';
      }
    }
    if (memBox) {
      const roleOrder = ['FOUNDER', 'ADMIN', 'MODERATOR', 'BETA', 'UPLOADER', 'DESIGNER', 'VIP', 'SUPPORTER', 'MEMBER'];
      const roleColMap = window.ROLE_COLORS || {};
      const online = users.filter(u => u.online);
      const offline = users.filter(u => !u.online);
      const renderMem = (u, isOn) => {
        const av = u.avatar && !u.avatar.includes('dicebear') ? u.avatar : 'logo.png';
        const sub = isOn ? (u.activity_text || u.role) : `${u.last_channel || u.role}${u.last_seen ? ` • ${formatLastSeen(u.last_seen)}` : ''}`;
        return `<div class="member-item" style="opacity:${isOn ? '1' : '0.6'}" onclick="openUserModal('${u.id}')">
          <div class="mem-av-wrap"><img src="${av}" /><span class="mem-dot" style="background:${isOn ? '#10b981' : '#64748b'}"></span></div>
          <div style="min-width:0;"><div style="color:${u.equipped_color || '#f8fafc'};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.username}</div><div class="mono-dim" style="font-size:0.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</div></div>
        </div>`;
      };
      let groupedHtml = '';
      roleOrder.forEach(r => {
        const list = online.filter(u => (u.role || 'MEMBER').toUpperCase() === r);
        if (list.length) {
          groupedHtml += `<div class="members-head" style="color:${roleColMap[r] || '#94a3b8'}">${r} — ${list.length}</div>` + list.map(u => renderMem(u, true)).join('');
        }
      });
      memBox.innerHTML = `${groupedHtml || '<div class="mono-dim" style="padding:4px 8px;">No members online</div>'}<div class="members-head">OFFLINE — ${offline.length}</div>${offline.map(u => renderMem(u, false)).join('')}`;
    }
  }
}

chatInput?.addEventListener('input', () => {
  const p = window.userProfile;
  if (p && chatInput.value.trim() && Date.now() - lastTypingPing > 2500) {
    lastTypingPing = Date.now();
    window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { typing_until: Date.now() + 4500 }, window.authToken).catch(() => {});
  }
  if (!acBox) return;
  const val = chatInput.value;
  const isStaff = p && ['FOUNDER', 'ADMIN', 'MODERATOR'].includes(p.role);
  const isFounder = p && p.role === 'FOUNDER';

  if (val.startsWith('/')) {
    const q = val.toLowerCase();
    const matches = SLASH_CMDS.filter(c => (!c.staff || isStaff) && (!c.founder || isFounder) && c.cmd.startsWith(q.split(' ').at(0)));
    if (!matches.length) return acBox.classList.add('hidden');
    acBox.innerHTML = matches.map(c => `<div class="ac-item" data-fill="${c.cmd.split(' ').slice(0, 2).join(' ')} "><strong>${c.cmd}</strong><span class="mono-dim">${c.desc}</span></div>`).join('');
    acBox.classList.remove('hidden');
    acBox.querySelectorAll('.ac-item').forEach(el => (el.onclick = () => { chatInput.value = el.dataset.fill; acBox.classList.add('hidden'); chatInput.focus(); }));
    return;
  }

  const atMatch = val.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  if (atMatch) {
    const query = atMatch.at(1).toLowerCase();
    const matches = cachedUsers.filter(u => u.username.toLowerCase().startsWith(query)).slice(0, 8);
    if (!matches.length) return acBox.classList.add('hidden');
    acBox.innerHTML = `<div style="padding:4px 10px;font-size:0.7rem;color:#94a3b8;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">MEMBERS MATCHING @${query}</div>` + matches.map(u => {
      const av = u.avatar && !u.avatar.includes('dicebear') ? u.avatar : 'logo.png';
      return `<div class="ac-item" data-uname="${u.username}"><div style="display:flex;align-items:center;gap:8px;"><img src="${av}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;" /><strong style="color:${u.equipped_color || '#10b981'}">${u.username}</strong></div><span class="mono-dim">[${u.role}]</span></div>`;
    }).join('');
    acBox.classList.remove('hidden');
    acBox.querySelectorAll('.ac-item').forEach(el => (el.onclick = () => {
      chatInput.value = val.replace(/@([a-zA-Z0-9_]*)$/, `@${el.dataset.uname} `);
      acBox.classList.add('hidden');
      chatInput.focus();
    }));
    return;
  }
  acBox.classList.add('hidden');
});
async function botPost(text) {
  if (!window.sbRest) return;
  await window.sbRest('messages', 'POST', { username: 'ZynkBot', avatar: 'logo.png', role: 'SYSTEM', color: '#06b6d4', content: text, channel: activeChannel }, window.authToken);
  lastChatHash = '';
  await pollChatAndMembers();
}

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  acBox?.classList.add('hidden');
  const raw = chatInput.value.trim();
  if (!raw) return;
  const p = window.userProfile;
  if (!p) return window.notify?.('Sign in to send messages in Zynk Chat!', true);
  if (activeChannel === 'updates' && p.role !== 'FOUNDER') return window.notify?.('Only Founder can post in #updates.', true);
  if (p.is_muted || (p.mute_until && p.mute_until > Date.now())) {
    const mins = p.mute_until > Date.now() ? Math.ceil((p.mute_until - Date.now()) / 60000) + 'm left' : 'Active';
    return window.notify?.(`You are muted (${mins}). Reason: ${p.mute_reason || 'Staff action'}`, true);
  }
  chatInput.value = '';
  const replyText = activeReply || '';
  window.clearChatReply();

  try {
    const isStaff = ['FOUNDER', 'ADMIN', 'MODERATOR'].includes(p.role) || (p.extra_roles || []).some(r => ['ADMIN', 'MODERATOR'].includes(r));
    const isFounder = p.role === 'FOUNDER';

    if (raw.startsWith('/')) {
      const parts = raw.split(' ');
      const cmd = parts.at(0).toLowerCase();
      const targetName = parts.at(1)?.replace(/^@/, '');

      if (cmd === '/help') return botPost('Commands: /help, /credits, /pay @user <amt>' + (isStaff ? ' | Staff: /purge <1-100>, /warn @user <reason>, /mute @user <10m/1h/1d> <reason>, /unmute @user, /ban @user <10m/1h/1d> <reason>, /unban @user, /clear' : '') + (isFounder ? ' | Founder: /give @user <amt>, /announce <msg>' : ''));
      if (cmd === '/credits') return botPost(`@${p.username}: ${p.credits} Z-Credits (Level ${Math.floor((p.xp || 0) / 1000) + 1})`);
      if (cmd === '/purge' && isStaff) {
        const count = Math.min(100, Math.max(1, parseInt(parts.at(1), 10) || 10));
        const filter = activeChannel === 'global' ? 'or=(channel.eq.global,channel.is.null)' : `channel=eq.${encodeURIComponent(activeChannel)}`;
        const recent = await window.sbRest(`messages?select=id&${filter}&order=id.desc&limit=${count}`);
        const ids = Array.isArray(recent) ? recent.map(r => r.id) : [];
        if (ids.length) {
          ids.forEach(id => document.querySelector(`[data-mid="${id}"]`)?.remove());
          await window.sbRest(`messages?id=in.(${ids.join(',')})`, 'DELETE', null, window.authToken);
        }
        lastChatHash = '';
        return botPost(`Purged ${ids.length} message(s) by @${p.username}.`);
      }
      if (cmd === '/clear' && isStaff) {
        await window.sbRest('messages?id=gt.0', 'DELETE', null, window.authToken);
        lastChatHash = '';
        return botPost(`Chat cleared by @${p.username}.`);
      }
      if (cmd === '/announce' && isFounder) return botPost(`[BROADCAST] ${parts.slice(1).join(' ')}`);
      if (cmd === '/warn' && isStaff && targetName) {
        const reason = parts.slice(2).join(' ') || 'Follow community rules';
        await logInfraction(targetName, 'Warning', reason);
        return botPost(`@${targetName} was warned by @${p.username}. Reason: ${reason}`);
      }
      if (cmd === '/mute' && isStaff && targetName) {
        const durMs = parseDurationMs(parts.at(2));
        const reason = parts.slice(3).join(' ') || 'Chat violation';
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { is_muted: true, mute_until: Date.now() + durMs, mute_reason: reason }, window.authToken);
        await logInfraction(targetName, `Muted (${parts.at(2) || '10m'})`, reason);
        return botPost(`@${targetName} muted for ${parts.at(2) || '10m'} by @${p.username}. Reason: ${reason}`);
      }
      if (cmd === '/unmute' && isStaff && targetName) {
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { is_muted: false, mute_until: 0, mute_reason: '' }, window.authToken);
        return botPost(`@${targetName} was unmuted by @${p.username}.`);
      }
      if (cmd === '/ban' && isStaff && targetName) {
        const durMs = parseDurationMs(parts.at(2));
        const reason = parts.slice(3).join(' ') || 'Rule violation';
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { ban_until: Date.now() + durMs, ban_reason: reason, online: false }, window.authToken);
        await logInfraction(targetName, `Banned (${parts.at(2) || '10m'})`, reason);
        return botPost(`@${targetName} banned for ${parts.at(2) || '10m'} by @${p.username}. Reason: ${reason}`);
      }
      if (cmd === '/unban' && isStaff && targetName) {
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { ban_until: 0, ban_reason: '' }, window.authToken);
        return botPost(`@${targetName} was unbanned by @${p.username}.`);
      }
      if (cmd === '/give' && isFounder && targetName) {
        const amt = parseInt(parts.at(2), 10);
        if (!(amt > 0)) return window.notify('Specify a valid amount.', true);
        const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
        const u = Array.isArray(found) ? found.at(0) : null;
        if (!u) return window.notify(`User @${targetName} not found.`, true);
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
        await window.refreshMyProfile();
        return botPost(`Founder @${p.username} granted +${amt} Z-Credits to @${u.username}!`);
      }
      if (cmd === '/pay' && targetName) {
        const amt = parseInt(parts.at(2), 10);
        if (!(amt > 0) || p.credits < amt) return window.notify('Invalid or insufficient Z-Credits.', true);
        const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
        const u = Array.isArray(found) ? found.at(0) : null;
        if (!u) return window.notify(`User @${targetName} not found.`, true);
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - amt }, window.authToken);
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
        await window.refreshMyProfile();
        return botPost(`@${p.username} sent ${amt} Z-Credits to @${u.username}!`);
      }
    }

    appendSingleMsg({ id: Date.now(), user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: raw, reply_to: replyText, created_at: new Date().toISOString() });
    await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: 'logo.png', role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: raw, reply_to: replyText, channel: activeChannel }, window.authToken);
    lastChatHash = '';
    window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 5, xp: (p.xp || 0) + 25, msg_count: (p.msg_count || 0) + 1, typing_until: 0, last_channel: window.activeChatLabel, last_seen: Date.now() }, window.authToken).then(() => window.refreshMyProfile()).catch(() => {});
  } catch (err) {
    window.notify('Chat error: ' + err.message, true);
  }
});

window.addEventListener('zynk-profile-updated', buildChannelBar);
setInterval(pollChatAndMembers, 3500);
pollChatAndMembers();
