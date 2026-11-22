const msgBox = document.getElementById('native-messages');
const memberBox = document.getElementById('member-sidebar');
const BOT_AV = "data:image/svg+xml,<svg xmlns='http://w3.org' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23080d14'/><text x='50' y='66' font-size='52' text-anchor='middle' fill='%2306b6d4'>◈</text></svg>";
let lastMsgId = 0;

function appendMsg(m) {
  const div = document.createElement('div');
  div.className = `chat-msg ${m.is_bot ? 'bot-msg' : ''}`;
  div.innerHTML = `
    <img class="msg-avatar" src="${m.avatar}" data-uid="${m.uid || ''}" />
    <div>
      <div><span class="role-chip" style="background:${m.color}22;color:${m.color}">${m.role}</span><strong class="clickable-user" style="color:${m.color}" data-uid="${m.uid || ''}">${m.username}</strong></div>
      <div style="margin-top:3px;">${m.content}</div>
    </div>`;
  div.querySelectorAll('[data-uid]').forEach(el => { if (el.dataset.uid) el.onclick = () => window.openUserModal?.(el.dataset.uid); });
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function pollChatAndMembers() {
  if (!window.sbRest) return;
  try {
    const msgs = await window.sbRest(`messages?id=gt.${lastMsgId}&order=id.asc&limit=50`);
    (msgs || []).forEach(m => { lastMsgId = Math.max(lastMsgId, m.id); appendMsg(m); });

    const users = await window.sbRest('users?order=username.asc');
    if (users && memberBox) {
      const on = users.filter(u => u.online), off = users.filter(u => !u.online);
      const row = (u, isOn) => `<div class="member-row ${isOn ? '' : 'offline'}" data-uid="${u.id}"><img class="member-mini-av" src="${u.avatar}" /><span class="status-dot" style="background:${isOn ? '#10b981' : '#64748b'}"></span><strong style="color:${u.equipped_color}">${u.username}</strong></div>`;
      memberBox.innerHTML = `<div class="member-cat">ONLINE — ${on.length}</div>${on.map(u => row(u, true)).join('') || '<div class="mono-dim">None</div>'}<div class="member-cat">OFFLINE — ${off.length}</div>${off.map(u => row(u, false)).join('') || '<div class="mono-dim">None</div>'}`;
      memberBox.querySelectorAll('[data-uid]').forEach(el => (el.onclick = () => window.openUserModal?.(el.dataset.uid)));
    }
  } catch {}
}
async function botSay(text) {
  await window.sbRest('messages', 'POST', { uid: '00000000-0000-0000-0000-000000000000', username: 'ZynkBot', avatar: BOT_AV, role: 'BOT', color: '#06b6d4', content: text, is_bot: true }, window.authToken);
  await pollChatAndMembers();
}

document.getElementById('native-chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = window.userProfile;
  if (!p) return window.notify?.('Sign in to chat!', true);
  if (p.role === 'MUTED') return window.notify?.('You are muted in Zynk Chat.', true);
  const input = document.getElementById('native-msg-input');
  const raw = input.value.trim();
  if (!raw) return;
  input.value = '';

  const isStaff = p.role === 'FOUNDER' || p.role === 'MODERATOR';
  const isFounder = p.role === 'FOUNDER';

  if (raw.startsWith('/')) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const targetName = (parts[1] || '').replace(/^@/, '');
    const amt = parseInt(parts[2], 10);

    if (cmd === '/help') return botSay('User: <code>/pay @user amt</code>, <code>/daily</code>, <code>/roll</code>, <code>/bal</code> | Mod: <code>/mute @user</code>, <code>/unmute @user</code>, <code>/warn @user reason</code>, <code>/announce msg</code>, <code>/clear</code> | Founder: <code>/give @user amt</code>');
    if (cmd === '/bal') return botSay(`${p.username} has <strong>${p.credits} Z-Credits</strong>.`);
    if (cmd === '/daily') {
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 100 }, window.authToken);
      await window.refreshMyProfile?.();
      return botSay(`+100 Daily Z-Credits claimed by ${p.username}!`);
    }
    if (cmd === '/roll') return botSay(`🎲 ${p.username} rolled <strong>${Math.floor(Math.random() * 100) + 1}</strong> / 100!`);
    if (cmd === '/clear' && isStaff) {
      await window.sbRest('messages?id=gt.0', 'DELETE', null, window.authToken);
      msgBox.innerHTML = '';
      return botSay(`🧹 Chat cleared by ${p.username}.`);
    }
    if (cmd === '/announce' && isStaff) return botSay(`📢 <strong>ANNOUNCEMENT:</strong> ${parts.slice(1).join(' ')}`);
    if (cmd === '/warn' && isStaff) return botSay(`⚠️ <strong>@${targetName}</strong> was warned by ${p.username}: ${parts.slice(2).join(' ') || 'Follow rules'}`);
    if ((cmd === '/mute' || cmd === '/unmute') && isStaff) {
      const nextRole = cmd === '/mute' ? 'MUTED' : 'MEMBER';
      await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`, 'PATCH', { role: nextRole }, window.authToken);
      return botSay(`${cmd === '/mute' ? '🔇 Muted' : '🔊 Unmuted'} <strong>@${targetName}</strong>.`);
    }
    if ((cmd === '/pay' || (cmd === '/give' && isFounder)) && targetName && amt > 0) {
      if (cmd === '/pay' && amt > p.credits) return window.notify?.('Insufficient Z-Credits.', true);
      const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(targetName)}`);
      const tUser = found?.[0];
      if (!tUser) return window.notify?.(`User @${targetName} not found.`, true);
      if (cmd === '/pay') await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - amt }, window.authToken);
      await window.sbRest(`users?id=eq.${tUser.id}`, 'PATCH', { credits: tUser.credits + amt }, window.authToken);
      await window.refreshMyProfile?.();
      return botSay(cmd === '/give' ? `⚡ Founder <strong>${p.username}</strong> minted <strong>+${amt} Z-Credits</strong> to <strong>${tUser.username}</strong>!` : `💸 <strong>${p.username}</strong> paid <strong>${amt} Z-Credits</strong> to <strong>${tUser.username}</strong>!`);
    }
  }

  await window.sbRest('messages', 'POST', { uid: p.id, username: p.username, avatar: p.avatar, role: p.role, color: p.equipped_color, content: raw, is_bot: false }, window.authToken);
  await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 5, xp: p.xp + 25 }, window.authToken);
  await window.refreshMyProfile?.();
  await pollChatAndMembers();
});

setInterval(pollChatAndMembers, 3500);
pollChatAndMembers();
