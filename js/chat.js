const msgBox = document.getElementById('native-messages');
const memberBox = document.getElementById('member-sidebar');
const BOT_AVATAR = "data:image/svg+xml,<svg xmlns='http://w3.org' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23080d14'/><text x='50' y='66' font-size='52' text-anchor='middle' fill='%2306b6d4'>◈</text></svg>";

function renderMessage(m) {
  const div = document.createElement('div');
  div.className = `chat-msg ${m.is_bot ? 'bot-msg' : ''}`;
  div.innerHTML = `
    <img class="msg-avatar" src="${m.avatar}" alt="${m.username}" data-uid="${m.uid || ''}" />
    <div>
      <div>
        <span class="role-chip" style="background:${m.color}22;color:${m.color}">${m.role}</span>
        <strong class="clickable-user" style="color:${m.color}" data-uid="${m.uid || ''}">${m.username}</strong>
      </div>
      <div style="margin-top:3px;">${m.content}</div>
    </div>
  `;
  div.querySelectorAll('[data-uid]').forEach(el => {
    if (el.dataset.uid) el.onclick = () => window.openUserModal(el.dataset.uid);
  });
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function loadChatAndMembers() {
  const { data: msgs } = await window.sb.from('messages').select('*').order('created_at', { ascending: true }).limit(60);
  msgBox.innerHTML = '';
  renderMessage({ username: 'ZynkBot', avatar: BOT_AVATAR, role: 'BOT', color: '#06b6d4', content: 'Connected to ZynkOS Grid. Type <code>/help</code> for commands.', is_bot: true });
  (msgs || []).forEach(renderMessage);

  await refreshMemberList();

  window.sb.channel('zynk-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => renderMessage(payload.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => refreshMemberList())
    .subscribe();
}

async function refreshMemberList() {
  const { data: users } = await window.sb.from('users').select('*').order('username', { ascending: true });
  if (!users) return;
  const online = users.filter(u => u.online);
  const offline = users.filter(u => !u.online);

  const rowHtml = (u, isOnline) => `
    <div class="member-row ${isOnline ? '' : 'offline'}" data-uid="${u.id}">
      <img class="member-mini-av" src="${u.avatar}" />
      <span class="status-dot" style="background:${isOnline ? '#10b981' : '#64748b'}"></span>
      <strong style="color:${u.equipped_color}">${u.username}</strong>
    </div>`;

  memberBox.innerHTML = `
    <div class="member-cat">ONLINE — ${online.length}</div>
    ${online.map(u => rowHtml(u, true)).join('') || '<div class="mono-dim">No one online</div>'}
    <div class="member-cat">OFFLINE — ${offline.length}</div>
    ${offline.map(u => rowHtml(u, false)).join('') || '<div class="mono-dim">None</div>'}
  `;
  memberBox.querySelectorAll('[data-uid]').forEach(el => {
    el.onclick = () => window.openUserModal(el.dataset.uid);
  });
}

async function botReply(text) {
  await window.sb.from('messages').insert({
    uid: '00000000-0000-0000-0000-000000000000',
    username: 'ZynkBot',
    avatar: BOT_AVATAR,
    role: 'BOT',
    color: '#06b6d4',
    content: text,
    is_bot: true
  });
}

document.getElementById('native-chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!window.currentUser || !window.userProfile) {
    document.getElementById('auth-modal').classList.remove('hidden');
    return;
  }
  const input = document.getElementById('native-msg-input');
  const raw = input.value.trim();
  if (!raw) return;
  input.value = '';

  const p = window.userProfile;
  await window.sb.from('messages').insert({
    uid: p.id, username: p.username, avatar: p.avatar, role: p.role, color: p.equipped_color, content: raw, is_bot: false
  });

  if (raw.startsWith('/')) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === '/help') {
      await botReply('Commands: <code>/pay @username amount</code> • <code>/daily</code> • <code>/roll</code> • <code>/bal</code>');
    } else if (cmd === '/bal') {
      await botReply(`${p.username} holds <strong>${p.credits} Z-Credits</strong>.`);
    } else if (cmd === '/daily') {
      await window.sb.from('users').update({ credits: p.credits + 100 }).eq('id', p.id);
      await window.refreshMyProfile();
      await botReply(`Daily drop claimed! <strong>+100 Z-Credits</strong> sent to ${p.username}.`);
    } else if (cmd === '/roll') {
      const n = Math.floor(Math.random() * 100) + 1;
      await botReply(`🎲 ${p.username} rolled <strong>${n}</strong> / 100!`);
    } else if (cmd === '/pay') {
      const targetName = (parts[1] || '').replace(/^@/, '');
      const amt = parseInt(parts[2], 10);
      if (!targetName || !amt || amt <= 0 || amt > p.credits) {
        return await botReply('Usage: <code>/pay @username amount</code> (check your Z-Credit balance).');
      }
      const { data: targetUser } = await window.sb.from('users').select('*').ilike('username', targetName).single();
      if (!targetUser) return await botReply(`User <strong>@${targetName}</strong> not found.`);
      if (targetUser.id === p.id) return await botReply('You cannot pay yourself.');

      await window.sb.from('users').update({ credits: p.credits - amt }).eq('id', p.id);
      await window.sb.from('users').update({ credits: targetUser.credits + amt }).eq('id', targetUser.id);
      await window.refreshMyProfile();
      await botReply(`💸 <strong>${p.username}</strong> paid <strong>${amt} Z-Credits</strong> to <strong>${targetUser.username}</strong>!`);
    }
  } else {
    const mult = p.rank_index === 3 ? 2 : p.rank_index === 2 ? 1.35 : p.rank_index === 1 ? 1.15 : 1;
    await window.sb.from('users').update({ xp: p.xp + Math.round(25 * mult), credits: p.credits + 5 }).eq('id', p.id);
    await window.refreshMyProfile();
  }
});

loadChatAndMembers();
