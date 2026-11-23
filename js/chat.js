const msgBox = document.getElementById('chat-messages');
const memBox = document.getElementById('online-members-list');
let lastMsgId = 0;

function appendMsg(m) {
  if (!msgBox || document.querySelector(`[data-mid="${m.id}"]`)) return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.dataset.mid = m.id;
  const av = m.avatar && !m.avatar.startsWith('https://dicebear.com') ? m.avatar : `https://dicebear.com{encodeURIComponent(m.username || 'Zynk')}`;
  div.innerHTML = `
    <img class="msg-avatar" src="${av}" data-uid="${m.user_id || ''}" />
    <div>
      <div><strong style="color:${m.color || '#10b981'}">${m.username}</strong> <span class="mono-dim">[${m.role || 'MEMBER'}]${m.is_beta ? ' [BETA]' : ''}</span></div>
      <div style="margin-top:3px;">${m.content.replace(/</g, '&lt;')}</div>
    </div>`;
  div.querySelector('.msg-avatar').onclick = () => { if (m.user_id && window.openUserModal) window.openUserModal(m.user_id); };
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function pollChatAndMembers() {
  if (!window.sbRest) return;
  const msgs = await window.sbRest(`messages?id=gt.${lastMsgId}&order=id.asc&limit=80`).catch(() => []);
  if (Array.isArray(msgs) && msgs.length) {
    msgs.forEach(m => { appendMsg(m); lastMsgId = Math.max(lastMsgId, m.id); });
  }
  const users = await window.sbRest('users?order=online.desc,xp.desc&limit=40').catch(() => []);
  if (memBox && Array.isArray(users)) {
    memBox.innerHTML = users.map(u => `<div class="member-item" onclick="openUserModal('${u.id}')"><span style="color:${u.online ? '#10b981' : '#64748b'}">●</span><span style="color:${u.equipped_color || '#f8fafc'}">${u.username}</span></div>`).join('');
  }
}
async function botPost(text) {
  if (!window.sbRest) return;
  await window.sbRest('messages', 'POST', { username: 'ZynkBot', avatar: 'logo.png', role: 'SYSTEM', color: '#06b6d4', content: text }, window.authToken);
  await pollChatAndMembers();
}

document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inp = document.getElementById('chat-input');
  const raw = inp.value.trim();
  if (!raw) return;
  const p = window.userProfile;
  if (!p) return window.notify?.('Sign in to send messages in Zynk Chat!', true);
  if (p.is_muted) return window.notify?.('You are muted in Zynk Chat.', true);
  inp.value = '';

  const isStaff = p.role === 'FOUNDER' || p.role === 'MODERATOR';
  const isFounder = p.role === 'FOUNDER';

  if (raw.startsWith('/')) {
    const parts = raw.split(' ');
    const cmd = parts.at(0).toLowerCase();
    const targetName = parts.at(1)?.replace(/^@/, '');
    const amt = parseInt(parts.at(2), 10);

    if (cmd === '/help') return botPost('Commands: /help, /credits, /pay @user <amt>' + (isStaff ? ' | Staff: /warn @user, /mute @user, /clear' : '') + (isFounder ? ' | Founder: /give @user <amt>, /announce <msg>' : ''));
    if (cmd === '/credits') return botPost(`@${p.username} balance: ${p.credits} Z-Credits (Level ${Math.floor((p.xp || 0) / 1000) + 1})`);
    if (cmd === '/clear' && isStaff) {
      await window.sbRest('messages?id=gt.0', 'DELETE', null, window.authToken);
      if (msgBox) msgBox.innerHTML = '';
      lastMsgId = 0;
      return botPost(`Chat cleared by @${p.username}.`);
    }
    if (cmd === '/announce' && isFounder) return botPost(`[BROADCAST] ${parts.slice(1).join(' ')}`);
    if (cmd === '/mute' && isStaff && targetName) {
      await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { is_muted: true }, window.authToken);
      return botPost(`@${targetName} was muted by @${p.username}.`);
    }
    if (cmd === '/warn' && isStaff && targetName) {
      return botPost(`@${targetName} received a staff warning from @${p.username}.`);
    }
    if (cmd === '/give' && isFounder && targetName && amt > 0) {
      const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
      const u = Array.isArray(found) ? found.at(0) : null;
      if (!u) return window.notify(`User @${targetName} not found.`, true);
      await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
      await window.refreshMyProfile();
      return botPost(`Founder @${p.username} granted +${amt} Z-Credits to @${u.username}!`);
    }
    if (cmd === '/pay' && targetName && amt > 0) {
      if (p.credits < amt) return window.notify('Not enough Z-Credits.', true);
      const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
      const u = Array.isArray(found) ? found.at(0) : null;
      if (!u) return window.notify(`User @${targetName} not found.`, true);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - amt }, window.authToken);
      await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: u.credits + amt }, window.authToken);
      await window.refreshMyProfile();
      return botPost(`@${p.username} sent ${amt} Z-Credits to @${u.username}!`);
    }
  }

  await window.sbRest('messages', 'POST', { user_id: p.id, username: p.username, avatar: p.avatar, role: p.role, is_beta: p.is_beta, color: p.equipped_color, content: raw }, window.authToken);
  await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 5, xp: (p.xp || 0) + 25, msg_count: (p.msg_count || 0) + 1 }, window.authToken);
  await window.refreshMyProfile();
  await pollChatAndMembers();
});

setInterval(pollChatAndMembers, 2500);
pollChatAndMembers();
