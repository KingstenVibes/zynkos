window.openUserModal = async function(uid) {
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  if (!modal || !box || !window.sbRest) return;
  const rows = await window.sbRest(`users?id=eq.${uid}`);
  const u = Array.isArray(rows) ? rows.at(0) : null;
  if (!u) return;
  const rank = window.RANKS?.at(u.rank_index || 0) || { name: 'Circuit' };
  const frameGlow = u.avatar_frame && u.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${u.avatar_frame},0 0 18px ${u.avatar_frame};` : '';
  box.innerHTML = `
    <div class="banner-hero" style="background:${u.banner || 'linear-gradient(135deg,#064e3b,#0f172a)'}">
      <img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${u.avatar}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><h2 style="color:${u.equipped_color}">${u.username}</h2><span class="mono-dim">[${u.role}] • [${rank.name}] • ${u.online ? '🟢 Online' : '⚫ Offline'}</span></div>
        <button class="btn-outline" id="close-user-modal">Close</button>
      </div>
      <p class="sub-text" style="margin:10px 0;">${u.bio || 'New ZynkOS Operator.'}</p>
      <div class="badges-row"><span class="pill">${u.credits} Z-Credits</span><span class="pill">Level ${Math.floor((u.xp || 0) / 1000) + 1}</span></div>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('close-user-modal').onclick = () => modal.classList.add('hidden');
};

function renderMyProfileTab() {
  const box = document.getElementById('my-profile-container');
  const p = window.userProfile;
  if (!box) return;
  if (!p) { box.innerHTML = `<div class="glass-card"><h2>Sign in to customize your profile</h2></div>`; return; }

  const frameGlow = p.avatar_frame && p.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${p.avatar_frame},0 0 18px ${p.avatar_frame};` : '';
  box.innerHTML = `
    <div class="glass-card" style="padding:0;overflow:hidden;max-width:680px;margin:auto;">
      <div class="banner-hero" style="background:${p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)'}">
        <img class="banner-avatar" style="border-color:${p.equipped_color};${frameGlow}" src="${p.avatar}" />
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

async function renderLeaderboardAndQuests() {
  const lb = document.getElementById('leaderboard-list');
  if (lb && window.sbRest) {
    const users = await window.sbRest('users?order=credits.desc&limit=20').catch(() => []);
    lb.innerHTML = (users || []).map((u, idx) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span><strong>#${idx + 1}</strong> <span style="color:${u.equipped_color}">${u.username}</span></span><span>${u.credits} Z-Credits • Lvl ${Math.floor((u.xp || 0) / 1000) + 1}</span></div>`).join('');
  }

  const aGrid = document.getElementById('achieve-grid');
  const p = window.userProfile;
  if (!aGrid || !window.sbRest) return;

  const builtInQuests = [
    { id: 'q_daily', title: '🎁 Daily Login Reward', desc: 'Claim +150 Z-Credits every 24 hours.', cred: 150, xp: 100, isDaily: true, ready: () => Date.now() - (p?.last_daily || 0) >= 86400000 },
    { id: 'q_msg1', title: '💬 First Transmission', desc: 'Send at least 1 message in Zynk Chat.', cred: 100, xp: 150, ready: () => (p?.msg_count || 0) >= 1 || (p?.xp || 0) > 100 },
    { id: 'q_msg10', title: '📡 Active Operator', desc: 'Reach Level 2 (1,000+ Neural Sync XP).', cred: 300, xp: 400, ready: () => (p?.xp || 0) >= 1000 },
    { id: 'q_shop', title: '🛒 First Store Gear', desc: 'Own at least 1 item from Zynk Store.', cred: 150, xp: 200, ready: () => (p?.owned_items || []).length >= 1 }
  ];

  const customQuests = await window.sbRest('achievements_list?order=id.asc').catch(() => []);
  aGrid.innerHTML = '';

  builtInQuests.forEach(q => {
    const claimed = !q.isDaily && (p?.claimed || []).includes(q.id);
    const canClaim = p && q.ready() && !claimed;
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `<span class="rarity-tag">+${q.cred} Z-Credits • +${q.xp} XP</span><h3>${q.title}</h3><p class="sub-text">${q.desc}</p><button class="${canClaim ? 'btn-neon' : 'btn-outline'}" ${q.isDaily ? 'id="daily-quest-btn"' : ''} ${canClaim ? '' : 'disabled'}>${claimed ? '✓ Completed' : canClaim ? 'Claim Reward' : 'Locked'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p || !canClaim) return;
      const patch = { credits: p.credits + q.cred, xp: (p.xp || 0) + q.xp };
      if (q.isDaily) patch.last_daily = Date.now();
      else patch.claimed = [...(p.claimed || []), q.id];
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', patch, window.authToken);
      await window.refreshMyProfile();
      window.notify(`Claimed +${q.cred} Z-Credits & +${q.xp} XP!`);
    };
    aGrid.appendChild(card);
  });

  (customQuests || []).forEach(q => {
    const qKey = `db_${q.id}`;
    const claimed = (p?.claimed || []).includes(qKey);
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `<span class="rarity-tag">+${q.reward_credits} Z-Credits</span><h3>${q.title}</h3><p class="sub-text">${q.description}</p><button class="${claimed ? 'btn-outline' : 'btn-neon'}" ${claimed ? 'disabled' : ''}>${claimed ? '✓ Claimed' : 'Claim Quest'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + q.reward_credits, xp: (p.xp || 0) + q.reward_xp, claimed: [...(p.claimed || []), qKey] }, window.authToken);
      await window.refreshMyProfile();
      window.notify(`Quest completed: +${q.reward_credits} Z-Credits!`);
    };
    aGrid.appendChild(card);
  });
}

setInterval(() => {
  const btn = document.getElementById('daily-quest-btn');
  const p = window.userProfile;
  if (!btn || !p) return;
  const rem = 86400000 - (Date.now() - (p.last_daily || 0));
  if (rem <= 0) {
    btn.disabled = false;
    btn.className = 'btn-neon';
    btn.textContent = 'Claim +150 Daily Z-Credits';
  } else {
    const h = String(Math.floor(rem / 3600000)).padStart(2, '0');
    const m = String(Math.floor((rem % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((rem % 60000) / 1000)).padStart(2, '0');
    btn.disabled = true;
    btn.textContent = `⏳ Next Claim in ${h}:${m}:${s}`;
  }
}, 1000);

window.addEventListener('zynk-profile-updated', () => { renderMyProfileTab(); renderLeaderboardAndQuests(); });
window.addEventListener('DOMContentLoaded', () => { renderMyProfileTab(); renderLeaderboardAndQuests(); });
