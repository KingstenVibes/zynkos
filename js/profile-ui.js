window.openUserModal = async function(uid) {
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  if (!modal || !box || !window.sbRest) return;
  const rows = await window.sbRest(`users?id=eq.${uid}`);
  const u = Array.isArray(rows) ? rows.at(0) : null;
  if (!u) return;
  const rank = window.RANKS?.at(u.rank_index || 0) || { name: 'Circuit' };
  const av = u.avatar && !u.avatar.startsWith('https://dicebear.com') ? u.avatar : `https://dicebear.com{encodeURIComponent(u.username)}`;
  const frameGlow = u.avatar_frame && u.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${u.avatar_frame},0 0 18px ${u.avatar_frame};` : '';
  const extras = (u.extra_roles || []).map(r => `<span class="pill">${r}</span>`).join('');
  box.innerHTML = `
    <div class="banner-hero" style="background:${u.banner || 'linear-gradient(135deg,#064e3b,#0f172a)'}">
      <img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${av}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><h2 style="color:${u.equipped_color}">${u.username}</h2><span class="mono-dim">[${u.role}] • [${rank.name}] • ${u.online ? '🟢 Online' : '⚫ Offline'}</span></div>
        <button class="btn-outline" id="close-user-modal">Close</button>
      </div>
      <p class="sub-text" style="margin:10px 0;">${u.bio || 'New ZynkOS Operator.'}</p>
      <div class="badges-row"><span class="pill">${u.credits} Z-Credits</span><span class="pill">Level ${Math.floor((u.xp || 0) / 1000) + 1}</span>${extras}</div>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('close-user-modal').onclick = () => modal.classList.add('hidden');
};

function renderMyProfileTab() {
  const box = document.getElementById('my-profile-container');
  const p = window.userProfile;
  if (!box) return;
  if (!p) { box.innerHTML = `<div class="glass-card"><h2>Sign in to customize your profile</h2></div>`; return; }

  const av = p.avatar && !p.avatar.startsWith('https://dicebear.com') ? p.avatar : `https://dicebear.com{encodeURIComponent(p.username)}`;
  const frameGlow = p.avatar_frame && p.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${p.avatar_frame},0 0 18px ${p.avatar_frame};` : '';
  box.innerHTML = `
    <div class="glass-card" style="padding:0;overflow:hidden;max-width:680px;margin:auto;">
      <div class="banner-hero" style="background:${p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)'}">
        <img class="banner-avatar" style="border-color:${p.equipped_color};${frameGlow}" src="${av}" />
      </div>
      <div class="profile-body">
        <h2 style="color:${p.equipped_color}">${p.username}</h2>
        <div class="setting-group"><label>Avatar Frame Color</label><select id="edit-frame" class="tool-input"><option value="none">None</option><option value="#10b981">Emerald Pulse</option><option value="#06b6d4">Cyber Cyan</option><option value="#f59e0b">Solar Gold</option><option value="#a855f7">Violet Neon</option></select></div>
        <div class="setting-group"><label>Steady Page Theme</label><select id="edit-theme" class="tool-input"><option value="default">Default Emerald</option><option value="theme-cyber">Cyber Cyan</option><option value="theme-crimson">Crimson Ops</option><option value="theme-gold">Solar Gold</option><option value="theme-violet">Violet Pulse</option></select></div>
        <div class="setting-group"><label>Bio</label><input id="edit-bio" class="tool-input" value="${p.bio || ''}" /></div>
        <button id="save-my-profile" class="btn-neon">Save Profile & Theme</button>
      </div>
    </div>`;
  document.getElementById('edit-frame').value = p.avatar_frame || 'none';
  document.getElementById('edit-theme').value = p.profile_theme || 'default';
  document.getElementById('save-my-profile').onclick = async () => {
    const th = document.getElementById('edit-theme').value;
    document.body.className = th === 'default' ? '' : th;
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar_frame: document.getElementById('edit-frame').value, profile_theme: th, bio: document.getElementById('edit-bio').value.trim() }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Profile & page theme saved!');
  };
}
async function renderLeaderboardQuestsAndAnnouncements() {
  if (!window.sbRest) return;
  const p = window.userProfile;

  // 1. Dashboard Announcements Feed
  const annBox = document.getElementById('dash-announcements-list');
  if (annBox) {
    const anns = await window.sbRest('announcements?order=id.desc&limit=25').catch(() => []);
    annBox.innerHTML = (anns || []).length ? anns.map(a => `
      <div style="padding:12px;border-radius:12px;background:rgba(4,7,11,0.75);border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong>${a.icon || '📢'} ${a.title}</strong>
          <span class="mono-dim">by @${a.author || 'Founder'}</span>
        </div>
        <p class="sub-text">${a.body}</p>
      </div>`).join('') : '<p class="sub-text">No system broadcasts yet.</p>';
  }

  // 2. Leaderboard WITH Profile Pictures
  const lb = document.getElementById('leaderboard-list');
  if (lb) {
    const users = await window.sbRest('users?order=credits.desc,xp.desc&limit=25').catch(() => []);
    lb.innerHTML = (users || []).map((u, idx) => {
      const av = u.avatar && !u.avatar.startsWith('https://dicebear.com') ? u.avatar : `https://dicebear.com{encodeURIComponent(u.username)}`;
      return `<div onclick="openUserModal('${u.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 6px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;">
        <div style="display:flex;align-items:center;gap:12px;">
          <strong style="width:28px;color:${idx === 0 ? '#f59e0b' : '#94a3b8'}">#${idx + 1}</strong>
          <img src="${av}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid ${u.equipped_color || '#10b981'};" />
          <div><strong style="color:${u.equipped_color || '#f8fafc'}">${u.username}</strong><div class="mono-dim">[${u.role}] • Level ${Math.floor((u.xp || 0) / 1000) + 1}</div></div>
        </div>
        <span class="pill">${u.credits} Z-Credits</span>
      </div>`;
    }).join('');
  }

  // 3. Quests Separated into Uncompleted, Completed & Secret Quests
  const aGrid = document.getElementById('achieve-grid');
  if (!aGrid) return;

  const builtInQuests = [
    { id: 'q_daily', title: '🎁 Daily Operator Stipend', desc: 'Claim +150 Z-Credits every 24 hours.', cred: 150, xp: 100, isDaily: true, ready: () => Date.now() - (p?.last_daily || 0) >= 86400000 },
    { id: 'q_msg1', title: '💬 First Transmission', desc: 'Send your first message in Zynk Chat.', cred: 100, xp: 150, ready: () => (p?.msg_count || 0) >= 1 },
    { id: 'q_msg10', title: '📡 Chat Regular', desc: 'Send 10 messages in Zynk Chat.', cred: 250, xp: 300, ready: () => (p?.msg_count || 0) >= 10 },
    { id: 'q_msg50', title: '🔥 Network Broadcaster', desc: 'Send 50 messages in Zynk Chat.', cred: 600, xp: 750, ready: () => (p?.msg_count || 0) >= 50 },
    { id: 'q_bio', title: '🪪 Identity Configured', desc: 'Customize your bio on My Profile.', cred: 100, xp: 150, ready: () => p?.bio && p.bio !== 'New ZynkOS Operator.' },
    { id: 'q_shop1', title: '🛒 First Gear Purchase', desc: 'Own at least 1 item from Zynk Store.', cred: 150, xp: 200, ready: () => (p?.owned_items || []).length >= 1 },
    { id: 'q_shop5', title: '💎 Vault Collector', desc: 'Own 5 or more items from Zynk Store.', cred: 500, xp: 600, ready: () => (p?.owned_items || []).length >= 5 },
    { id: 'q_pulse', title: '⚡ Pulse Operator', desc: 'Unlock Pulse Rank or higher.', cred: 200, xp: 300, ready: () => (p?.rank_index || 0) >= 1 },
    { id: 'q_lvl3', title: '🧬 Neural Level 3', desc: 'Reach Level 3 (2,000+ XP).', cred: 350, xp: 400, ready: () => (p?.xp || 0) >= 2000 },
    { id: 'q_rich', title: '🏦 Credit Tycoon', desc: 'Hold 1,500+ Z-Credits at once.', cred: 400, xp: 500, ready: () => (p?.credits || 0) >= 1500 },
    // Secret Quests (condition hidden from non-founders!)
    { id: 'sec_night', isSecret: true, title: '🌙 Night Owl Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 500, ready: () => new Date().getHours() >= 22 || new Date().getHours() <= 4 },
    { id: 'sec_cyber', isSecret: true, title: '💠 Cyan Overclock', desc: '??? [Secret Quest — Condition Hidden]', cred: 400, xp: 450, ready: () => p?.profile_theme === 'theme-cyber' },
    { id: 'sec_24h', isSecret: true, title: '⏱ Military Precision', desc: '??? [Secret Quest — Condition Hidden]', cred: 350, xp: 400, ready: () => localStorage.getItem('zynk_format') === '24' },
    { id: 'sec_cloak', isSecret: true, title: '🕵️ Ghost Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 450, xp: 500, ready: () => (localStorage.getItem('zynk_cloak') || 'none') !== 'none' }
  ];

  const customQuests = await window.sbRest('achievements_list?order=id.asc').catch(() => []);
  const allQuests = [
    ...builtInQuests,
    ...(customQuests || []).map(q => ({ id: `db_${q.id}`, title: q.title, desc: q.is_secret ? '??? [Secret Quest — Condition Hidden]' : q.description, cred: q.reward_credits, xp: q.reward_xp, isSecret: q.is_secret, ready: () => true }))
  ];

  const uncompleted = allQuests.filter(q => !q.isSecret && !(p?.claimed || []).includes(q.id));
  const completed = allQuests.filter(q => !q.isDaily && (p?.claimed || []).includes(q.id));
  const secrets = allQuests.filter(q => q.isSecret && !(p?.claimed || []).includes(q.id));

  aGrid.style.display = 'block';
  aGrid.innerHTML = `
    <h3 style="color:#10b981;margin-bottom:10px;">📋 Uncompleted Quests (${uncompleted.length})</h3>
    <div class="cards-grid" id="q-sec-open" style="margin-bottom:24px;"></div>
    <h3 style="color:#a855f7;margin-bottom:10px;">🔒 Secret Quests (${secrets.length})</h3>
    <div class="cards-grid" id="q-sec-secret" style="margin-bottom:24px;"></div>
    <h3 style="color:#94a3b8;margin-bottom:10px;">✅ Completed Quests (${completed.length})</h3>
    <div class="cards-grid" id="q-sec-done"></div>`;

  const renderCard = (q, targetId, isDone) => {
    const box = document.getElementById(targetId);
    if (!box) return;
    const canClaim = p && q.ready() && !isDone;
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `<span class="rarity-tag" style="color:${q.isSecret ? '#a855f7' : '#10b981'}">+${q.cred} Z-Credits • +${q.xp} XP</span><h3>${q.title}</h3><p class="sub-text" style="margin:6px 0 12px;">${q.desc}</p><button class="${canClaim ? 'btn-neon' : 'btn-outline'}" ${q.isDaily ? 'id="daily-quest-btn"' : ''} ${canClaim ? '' : 'disabled'}>${isDone ? '✓ Completed' : canClaim ? 'Claim Reward' : q.isSecret ? '🔒 Discover Secret' : 'In Progress'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p || !canClaim) return;
      const patch = { credits: p.credits + q.cred, xp: (p.xp || 0) + q.xp };
      if (q.isDaily) patch.last_daily = Date.now();
      else patch.claimed = [...(p.claimed || []), q.id];
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', patch, window.authToken);
      await window.refreshMyProfile();
      window.notify(`Quest Complete! +${q.cred} Z-Credits & +${q.xp} XP`);
    };
    box.appendChild(card);
  };

  uncompleted.forEach(q => renderCard(q, 'q-sec-open', false));
  secrets.forEach(q => renderCard(q, 'q-sec-secret', false));
  completed.forEach(q => renderCard(q, 'q-sec-done', true));
}

document.addEventListener('click', async (e) => {
  if (e.target.id === 'dash-daily-btn') {
    const p = window.userProfile;
    if (!p) return window.notify('Sign in to claim daily Z-Credits!', true);
    if (Date.now() - (p.last_daily || 0) < 86400000) return window.notify('Daily reward is still on cooldown!', true);
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 150, xp: (p.xp || 0) + 100, last_daily: Date.now() }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Claimed +150 Daily Z-Credits!');
  }
});

setInterval(() => {
  const p = window.userProfile;
  if (!p) return;
  const rem = 86400000 - (Date.now() - (p.last_daily || 0));
  const label = rem <= 0 ? 'Claim +150 Daily Z-Credits' : `⏳ Next Claim in ${String(Math.floor(rem / 3600000)).padStart(2, '0')}:${String(Math.floor((rem % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((rem % 60000) / 1000)).padStart(2, '0')}`;
  ['daily-quest-btn', 'dash-daily-btn'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.disabled = rem > 0; b.className = rem <= 0 ? 'btn-neon' : 'btn-outline'; b.textContent = label; }
  });
}, 1000);

window.addEventListener('zynk-profile-updated', () => { renderMyProfileTab(); renderLeaderboardQuestsAndAnnouncements(); });
window.addEventListener('DOMContentLoaded', () => { renderMyProfileTab(); renderLeaderboardQuestsAndAnnouncements(); });
