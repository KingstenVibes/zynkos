const msgBox = document.getElementById('native-messages');
const memberBox = document.getElementById('member-sidebar');

const members = [
  { name: 'KingstenVibes', role: 'FOUNDER', color: '#10b981', online: true },
  { name: 'ZynkBot', role: 'SYSTEM BOT', color: '#06b6d4', online: true },
  { name: 'CyberNova', role: 'NOVA', color: '#06b6d4', online: true },
  { name: 'VexOperator', role: 'PULSE', color: '#10b981', online: false },
  { name: 'ShadowByte', role: 'CIRCUIT', color: '#94a3b8', online: false }
];

function renderMembers() {
  const online = members.filter(m => m.online);
  const offline = members.filter(m => !m.online);
  memberBox.innerHTML = `
    <div class="member-cat">ONLINE — ${online.length}</div>
    ${online.map(m => `<div class="member-row"><span class="status-dot" style="background:#10b981"></span><strong style="color:${m.color}">${m.name}</strong></div>`).join('')}
    <div class="member-cat">OFFLINE — ${offline.length}</div>
    ${offline.map(m => `<div class="member-row offline"><span class="status-dot" style="background:#64748b"></span><span>${m.name}</span></div>`).join('')}
  `;
}

function postChat(user, role, color, text, isBot = false) {
  const div = document.createElement('div');
  div.className = `chat-msg ${isBot ? 'bot-msg' : ''}`;
  div.innerHTML = `<span class="role-chip" style="background:${color}22;color:${color}">${role}</span><strong style="color:${color}">${user}:</strong> ${text}`;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

postChat('ZynkBot', 'BOT', '#06b6d4', 'Welcome to #zynk-global! Type <code>/help</code> to see commands.', true);

document.getElementById('native-chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('native-msg-input');
  const raw = input.value.trim();
  if (!raw) return;
  input.value = '';

  const s = window.zynkState;
  const rank = window.RANKS[s.rankIndex];
  postChat(s.username, s.role, s.equippedColor, raw);

  if (raw.startsWith('/')) {
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === '/help') {
      postChat('ZynkBot', 'BOT', '#06b6d4', 'Commands: <code>/pay @user amount</code> • <code>/daily</code> • <code>/roll</code> • <code>/bal</code> • <code>/clear</code>', true);
    } else if (cmd === '/bal') {
      postChat('ZynkBot', 'BOT', '#06b6d4', `${s.username}, you have <strong>${s.credits} Z-Credits</strong> (${rank.name} Rank).`, true);
    } else if (cmd === '/daily') {
      s.credits += 100;
      window.saveZynk();
      postChat('ZynkBot', 'BOT', '#06b6d4', `Daily drop claimed! <strong>+100 Z-Credits</strong> added to ${s.username}.`, true);
    } else if (cmd === '/roll') {
      const roll = Math.floor(Math.random() * 100) + 1;
      postChat('ZynkBot', 'BOT', '#06b6d4', `🎲 ${s.username} rolled <strong>${roll}</strong> / 100!`, true);
    } else if (cmd === '/pay') {
      const target = parts[1] || '@user';
      const amt = parseInt(parts[2], 10);
      if (!amt || amt <= 0 || amt > s.credits) {
        return postChat('ZynkBot', 'BOT', '#ef4444', 'Invalid amount or insufficient Z-Credits.', true);
      }
      s.credits -= amt;
      window.saveZynk();
      postChat('ZynkBot', 'BOT', '#10b981', `💸 ${s.username} sent <strong>${amt} Z-Credits</strong> to <strong>${target}</strong>!`, true);
    } else if (cmd === '/clear') {
      msgBox.innerHTML = '';
    }
  } else {
    const mult = s.rankIndex === 3 ? 2 : s.rankIndex === 2 ? 1.35 : s.rankIndex === 1 ? 1.15 : 1;
    s.xp += Math.round(25 * mult);
    s.credits += 5;
    window.saveZynk();
  }
});

renderMembers();
