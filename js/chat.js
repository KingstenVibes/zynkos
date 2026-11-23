const msgBox = document.getElementById('chat-messages');
const memBox = document.getElementById('online-members-list');
const acBox = document.getElementById('chat-ac-box');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
let cachedUsers = [];
let initialChatLoaded = false;
let activeReply = null;
let lastChatHash = '';
let lastTypingPing = 0;

const CHAT_SVG = {
  react: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  reply: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  sticker: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>`
};

const ALL_EMOJIS = [
  '👍','❤️','😂','🔥','💀','🎉','👀','💯','😭','😍','🥺','😎','🤯','🥳','😡','🤔',
  '👏','🙌','🤝','✌️','🫡','🙏','💪','⚡','💎','🚀','👑','🏆','🎮','🎵','🌟','✨',
  '💚','💙','💜','🧡','🖤','🤍','💔','💥','💫','💤','✅','❌','⚠️','🛡️','🔮','🛸'
];

if (chatForm && !document.getElementById('chat-file-inp')) {
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.id = 'chat-file-inp';
  fileInp.accept = 'image/*';
  fileInp.className = 'hidden';

  const imgBtn = document.createElement('button');
  imgBtn.type = 'button';
  imgBtn.className = 'chat-tool-btn';
  imgBtn.title = 'Upload Image (Max 5MB)';
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
const ROLE_POWER = { FOUNDER: 100, ADMIN: 80, MODERATOR: 60, BETA: 30, UPLOADER: 25, DESIGNER: 25, VIP: 20, SUPPORTER: 15, MEMBER: 10, SYSTEM: 90 };

const SLASH_CMDS = [
  { cmd: '/help', desc: 'Show all available commands', staff: false },
  { cmd: '/credits', desc: 'Check your Z-Credits & Level', staff: false },
  { cmd: '/pay @user 50', desc: 'Send Z-Credits to another member', staff: false },
  { cmd: '/warn @user reason', desc: 'Warn a member in chat', staff: true },
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
    <input type="file" id="sticker-file-inp" accept="image/*" class="hidden" />
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      ${myStickers.map((src, i) => `<img src="${src}" style="width:58px;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:1px solid rgba(255,255,255,0.12);" onclick="sendStickerImg(${i})" title="Click to send sticker" />`).join('') || '<span class="mono-dim">No custom stickers uploaded yet.</span>'}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">
      ${ALL_EMOJIS.map(em => `<button type="button" class="react-choice" onclick="chatInput.value+='${em}';chatInput.focus();">${em}</button>`).join('')}
    </div>`;

  document.getElementById('add-sticker-btn').onclick = () => {
    if (!p) return window.notify?.('Sign in to upload stickers!', true);
    if (myStickers.length >= limit) return window.notify?.(`Sticker limit reached (${limit} max for your rank/role).`, true);
    document.getElementById('sticker-file-inp').click();
  };
  document.getElementById('sticker-file-inp').onchange = (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return window.notify?.('Sticker must be under 5MB!', true);
    const r = new FileReader();
    r.onload = async () => {
      const next = [...myStickers, r.result];
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { stickers: next }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Sticker saved!');
      window.toggleChatDrawer();
    };
    r.readAsDataURL(f);
  };
};

window.sendStickerImg = async function(idx) {
  const p = window.userProfile;
  const src = p?.stickers?.[idx];
  if (!p || !src) return;
  drawerBox?.classList.add('hidden');
  appendSingleMsg({ id: Date.now(), user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: '[Sticker]', image_url: src, created_at: new Date().toISOString() });
  await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: 'logo.png', role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: '[Sticker]', image_url: src }, window.authToken);
  lastChatHash = '';
};
