const msgBox = document.getElementById('chat-messages');
const memBox = document.getElementById('online-members-list');
const acBox = document.getElementById('chat-ac-box');
const chatInput = document.getElementById('chat-input');
let lastMsgId = 0;
let cachedUsers = [];
let initialChatLoaded = false;

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
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  return unit === 'd' ? n * 86400000 : unit === 'h' ? n * 3600000 : n * 60000;
}

function appendMsg(m) {
  if (!msgBox || !m || (m.id && document.querySelector(`[data-mid="${m.id}"]`))) return;
  const me = window.userProfile;
  const isPinged = me && m.content && new RegExp(`@${me.username}\\b`, 'i').test(m.content) && m.username !== me.username;
  if (isPinged && initialChatLoaded) {
    window.notify?.(`🔔 @${m.username} pinged you: "${m.content}"`, false, () => window.openTab('chat-view'));
  }

  const div = document.createElement('div');
  div.className = 'chat-msg' + (isPinged ? ' pinged' : '');
  if (m.id) div.dataset.mid = m.id;
  const av = m.avatar && !m.avatar.includes('dicebear') ? m.avatar : 'logo.png';
  const safeText = String(m.content || '').replace(/</g, '&lt;').replace(/(@[a-zA-Z0-9_]+)/g, '<strong style="color:#10b981;">$1</strong>');
  div.innerHTML = `
    <img class="msg-avatar" src="${av}" />
    <div>
      <div><strong style="color:${m.color || '#10b981'}">${m.username}</strong> <span class="mono-dim">[${m.role || 'MEMBER'}]${m.is_beta ? ' [BETA]' : ''}</span></div>
      <div style="margin-top:3px;">${safeText}</div>
    </div>`;
  div.querySelector('.msg-avatar').onclick = () => { if (m.user_id && window.openUserModal) window.openUserModal(m.user_id); };
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function pollChatAndMembers() {
  if (!window.sbRest) return;
  try {
    const msgs = await window.sbRest(`messages?id=gt.${lastMsgId}&order=id.asc&limit=80`);
    if (Array.isArray(msgs) && msgs.length) {
      msgs.forEach(m => { appendMsg(m); lastMsgId = Math.max(lastMsgId, m.id || 0); });
    }
  } catch (err) {
    console.warn('Chat poll:', err.message);
  }
  initialChatLoaded = true;

  const users = await window.sbRest('users?order=online.desc,xp.desc&limit=50').catch(() => []);
  if (Array.isArray(users)) {
    cachedUsers = users;
    if (memBox) {
      memBox.innerHTML = users.map(u => `<div class="member-item" onclick="openUserModal('${u.id}')"><span style="color:${u.online ? '#10b981' : '#64748b'}">●</span><span style="color:${u.equipped_color || '#f8fafc'}">${u.username}</span></div>`).join('');
    }
  }
}
chatInput?.addEventListener('input', () => {
  if (!acBox) return;
  const val = chatInput.value;
  const p = window.userProfile;
  const isStaff = p && ['FOUNDER', 'ADMIN', 'MODERATOR'].includes(p.role);
  const isFounder = p && p.role === 'FOUNDER';

  if (val.startsWith('/')) {
    const q = val.toLowerCase();
    const matches = SLASH_CMDS.filter(c => (!c.staff || isStaff) && (!c.founder || isFounder) && c.cmd.startsWith(q.split(' ')[0]));
    if (!matches.length) return acBox.classList.add('hidden');
    acBox.innerHTML = matches.map(c => `<div class="ac-item" data-fill="${c.cmd.split(' ').slice(0, 2).join(' ')} "><strong>${c.cmd}</strong><span class="mono-dim">${c.desc}</span></div>`).join('');
    acBox.classList.remove('hidden');
    acBox.querySelectorAll('.ac-item').forEach(el => (el.onclick = () => { chatInput.value = el.dataset.fill; acBox.classList.add('hidden'); chatInput.focus(); }));
    return;
  }

  const atMatch = val.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  if (atMatch) {
    const query = atMatch[1].toLowerCase();
    const matches = cachedUsers.filter(u => u.username.toLowerCase().startsWith(query)).slice(0, 8);
    if (!matches.length) return acBox.classList.add('hidden');
    acBox.innerHTML = matches.map(u => `<div class="ac-item" data-uname="${u.username}"><span style="color:${u.equipped_color || '#10b981'}">@${u.username}</span><span class="mono-dim">[${u.role}]</span></div>`).join('');
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
  const saved = await window.sbRest('messages', 'POST', { username: 'ZynkBot', avatar: 'logo.png', role: 'SYSTEM', color: '#06b6d4', content: text }, window.authToken);
  if (Array.isArray(saved) && saved[0]) { appendMsg(saved[0]); lastMsgId = Math.max(lastMsgId, saved[0].id); }
}

document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  acBox?.classList.add('hidden');
  const raw = chatInput.value.trim();
  if (!raw) return;
  const p = window.userProfile;
  if (!p) return window.notify?.('Sign in to send messages in Zynk Chat!', true);
  if (p.is_muted || (p.mute_until && p.mute_until > Date.now())) {
    const mins = p.mute_until > Date.now() ? Math.ceil((p.mute_until - Date.now()) / 60000) + 'm left' : 'Active';
    return window.notify?.(`You are muted (${mins}). Reason: ${p.mute_reason || 'Staff action'}`, true);
  }
  chatInput.value = '';

  try {
    const isStaff = ['FOUNDER', 'ADMIN', 'MODERATOR'].includes(p.role) || (p.extra_roles || []).some(r => ['ADMIN', 'MODERATOR'].includes(r));
    const isFounder = p.role === 'FOUNDER';

    if (raw.startsWith('/')) {
      const parts = raw.split(' ');
      const cmd = parts[0].toLowerCase();
      const targetName = parts[1]?.replace(/^@/, '');

      if (cmd === '/help') return botPost('Commands: /help, /credits, /pay @user <amt>' + (isStaff ? ' | Staff: /warn @user <reason>, /mute @user <10m/1h/1d> <reason>, /unmute @user, /ban @user <10m/1h/1d> <reason>, /unban @user, /clear' : '') + (isFounder ? ' | Founder: /give @user <amt>, /announce <msg>' : ''));
      if (cmd === '/credits') return botPost(`@${p.username}: ${p.credits} Z-Credits (Level ${Math.floor((p.xp || 0) / 1000) + 1})`);
      if (cmd === '/clear' && isStaff) {
        await window.sbRest('messages?id=gt.0', 'DELETE', null, window.authToken);
        if (msgBox) msgBox.innerHTML = '';
        lastMsgId = 0;
        return botPost(`Chat cleared by @${p.username}.`);
      }
      if (cmd === '/announce' && isFounder) return botPost(`[BROADCAST] ${parts.slice(1).join(' ')}`);
      if (cmd === '/warn' && isStaff && targetName) return botPost(`⚠️ @${targetName} was warned by @${p.username}. Reason: ${parts.slice(2).join(' ') || 'Follow community rules'}`);
      if (cmd === '/mute' && isStaff && targetName) {
        const durMs = parseDurationMs(parts[2]);
        const reason = parts.slice(3).join(' ') || 'Chat violation';
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { is_muted: true, mute_until: Date.now() + durMs, mute_reason: reason }, window.authToken);
        return botPost(`🔇 @${targetName} muted for ${parts[2] || '10m'} by @${p.username}. Reason: ${reason}`);
      }
      if (cmd === '/unmute' && isStaff && targetName) {
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { is_muted: false, mute_until: 0, mute_reason: '' }, window.authToken);
        return botPost(`🔊 @${targetName} was unmuted by @${p.username}.`);
      }
      if (cmd === '/ban' && isStaff && targetName) {
        const durMs = parseDurationMs(parts[2]);
        const reason = parts.slice(3).join(' ') || 'Rule violation';
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { ban_until: Date.now() + durMs, ban_reason: reason, online: false }, window.authToken);
        return botPost(`⛔ @${targetName} banned for ${parts[2] || '10m'} by @${p.username}. Reason: ${reason}`);
      }
      if (cmd === '/unban' && isStaff && targetName) {
        await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { ban_until: 0, ban_reason: '' }, window.authToken);
        return botPost(`✅ @${targetName} was unbanned by @${p.username}.`);
      }
      if (cmd === '/give' && isFounder && targetName) {
        const amt = parseInt(parts[2], 10);
        if (!(amt > 0)) return window.notify('Specify a valid amount.', true);
        const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
        const u = Array.isArray(found) ? found[0] : null;
        if (!u) return window.notify(`User @${targetName} not found.`, true);
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
        await window.refreshMyProfile();
        return botPost(`⚡ Founder @${p.username} granted +${amt} Z-Credits to @${u.username}!`);
      }
      if (cmd === '/pay' && targetName) {
        const amt = parseInt(parts[2], 10);
        if (!(amt > 0) || p.credits < amt) return window.notify('Invalid or insufficient Z-Credits.', true);
        const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
        const u = Array.isArray(found) ? found[0] : null;
        if (!u) return window.notify(`User @${targetName} not found.`, true);
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - amt }, window.authToken);
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
        await window.refreshMyProfile();
        return botPost(`💸 @${p.username} sent ${amt} Z-Credits to @${u.username}!`);
      }
    }

    const saved = await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: !!p.is_beta, color: p.equipped_color, content: raw }, window.authToken);
    if (Array.isArray(saved) && saved[0]) { appendMsg(saved[0]); lastMsgId = Math.max(lastMsgId, saved[0].id); }
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 5, xp: (p.xp || 0) + 25, msg_count: (p.msg_count || 0) + 1 }, window.authToken);
    await window.refreshMyProfile();
  } catch (err) {
    window.notify('Chat error: ' + err.message, true);
  }
});

setInterval(pollChatAndMembers, 2500);
pollChatAndMembers();
