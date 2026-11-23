function safeAvatar(url) {
  return url && !String(url).includes('dicebear') ? url : 'logo.png';
}

window.openUserModal = async function(uid) {
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  if (!modal || !box || !window.sbRest) return;
  const rows = await window.sbRest(`users?id=eq.${uid}`);
  const u = Array.isArray(rows) ? rows.at(0) : null;
  if (!u) return;
  const rank = window.RANKS?.at(u.rank_index || 0) || { name: 'Circuit' };
  const frameGlow = u.avatar_frame && u.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${u.avatar_frame},0 0 18px ${u.avatar_frame};` : '';
  const extras = (u.extra_roles || []).map(r => `<span class="pill">${r}</span>`).join('');
  box.innerHTML = `
    <div class="banner-hero" style="background:${u.banner && (u.banner.startsWith('http') || String(u.banner).startsWith('data:')) ? `url('${u.banner}') center/cover` : (u.banner || 'linear-gradient(135deg,#064e3b,#0f172a)')}">
      <img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${safeAvatar(u.avatar)}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><h2 style="color:${u.equipped_color}">${u.username}</h2><span class="mono-dim">[${u.role}] • [${rank.name}] • ${u.online ? '🟢 Online' : '⚫ Offline'}</span></div>
        <button class="btn-outline" id="close-user-modal">Close</button>
      </div>
      <p class="sub-text" style="margin:10px 0;">${u.bio || 'New ZynkOS Member.'}</p>
      <div class="badges-row"><span class="pill">${u.credits} Z-Credits</span><span class="pill">Level ${Math.floor((u.xp || 0) / 1000) + 1}</span>${extras}</div>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('close-user-modal').onclick = () => modal.classList.add('hidden');
};

async function renderMyProfileTab() {
  const box = document.getElementById('my-profile-container');
  const p = window.userProfile;
  if (!box) return;
  if (!p) { box.innerHTML = `<div class="glass-card"><h2>Sign in to customize your profile</h2></div>`; return; }

  const allItems = await window.sbRest('store_items?order=id.asc').catch(() => []);
  const ownedList = (allItems || []).filter(it => (p.owned_items || []).includes(it.id));
  const ownedAvatars = ownedList.filter(it => it.item_type === 'avatar');
  const ownedBanners = ownedList.filter(it => it.item_type === 'banner');
  const ownedFrames = ownedList.filter(it => it.item_type === 'frame');

  const frameGlow = p.avatar_frame && p.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${p.avatar_frame},0 0 18px ${p.avatar_frame};` : '';
  const bannerBg = p.banner && (p.banner.startsWith('http') || p.banner.startsWith('data:')) ? `url('${p.banner}') center/cover` : (p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)');

  box.innerHTML = `
    <div class="glass-card" style="padding:0;overflow:hidden;max-width:720px;margin:auto;">
      <div class="banner-hero" style="background:${bannerBg}">
        <img class="banner-avatar" style="border-color:${p.equipped_color};${frameGlow}" src="${safeAvatar(p.avatar)}" />
      </div>
      <div class="profile-body">
        <h2 style="color:${p.equipped_color}">${p.username}</h2>
        <div class="setting-group"><label>Equipped Avatar</label><select id="edit-avatar" class="tool-input"><option value="logo.png">ZynkOS Default Logo</option>${ownedAvatars.map(a => `<option value="${a.image_url || a.item_value}">${a.name}</option>`).join('')}</select></div>
        <div class="setting-group"><label>Equipped Banner</label><select id="edit-banner" class="tool-input"><option value="linear-gradient(135deg,#064e3b,#0f172a)">Default Emerald Gradient</option>${ownedBanners.map(b => `<option value="${b.image_url || b.item_value}">${b.name}</option>`).join('')}</select></div>
        <div class="setting-group"><label>Avatar Frame Color</label><select id="edit-frame" class="tool-input"><option value="none">None</option><option value="#10b981">Emerald Pulse</option><option value="#06b6d4">Cyber Cyan</option><option value="#f59e0b">Solar Gold</option><option value="#a855f7">Violet Neon</option>${ownedFrames.map(f => `<option value="${f.item_value}">${f.name}</option>`).join('')}</select></div>
        <div class="setting-group"><label>Steady Page Theme</label><select id="edit-theme" class="tool-input"><option value="default">Default Emerald</option><option value="theme-cyber">Cyber Cyan</option><option value="theme-crimson">Crimson Ops</option><option value="theme-gold">Solar Gold</option><option value="theme-violet">Violet Pulse</option></select></div>
        <div class="setting-group"><label>Bio</label><input id="edit-bio" class="tool-input" value="${p.bio || ''}" /></div>
        <button id="save-my-profile" class="btn-neon">Save Profile, Avatar & Theme</button>
      </div>
    </div>`;

  document.getElementById('edit-avatar').value = safeAvatar(p.avatar);
  document.getElementById('edit-banner').value = p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)';
  document.getElementById('edit-frame').value = p.avatar_frame || 'none';
  document.getElementById('edit-theme').value = localStorage.getItem('zynk_theme') || p.profile_theme || 'default';

  document.getElementById('save-my-profile').onclick = async () => {
    const th = document.getElementById('edit-theme').value;
    localStorage.setItem('zynk_theme', th);
    document.body.className = th === 'default' ? '' : th;
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', {
      avatar: document.getElementById('edit-avatar').value,
      banner: document.getElementById('edit-banner').value,
      avatar_frame: document.getElementById('edit-frame').value,
      profile_theme: th,
      bio: document.getElementById('edit-bio').value.trim()
    }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Profile, avatar & theme saved!');
  };
}
async function renderLeaderboardQuestsAndAnnouncements() {
  if (!window.sbRest) return;
  const p = window.userProfile;

  const annBox = document.getElementById('dash-announcements-list');
  if (annBox) {
    const anns = await window.sbRest('announcements?order=id.desc&limit=25').catch(() => []);
    annBox.innerHTML = (anns || []).length ? anns.map(a => `
      <div style="padding:12px;border-radius:12px;background:rgba(4,7,11,0.75);border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong>${a.icon || '📢'} ${a.title}</strong>
          <span class="mono-dim">by @${a.author || 'Staff'}</span>
        </div>
        <p class="sub-text">${a.body}</p>
      </div>`).join('') : '<p class="sub-text">No system broadcasts yet.</p>';
  }

  const lb = document.getElementById('leaderboard-list');
  if (lb) {
    const users = await window.sbRest('users?role=neq.FOUNDER&order=credits.desc,xp.desc&limit=30').catch(() => []);
    lb.innerHTML = (users || []).length ? users.map((u, idx) => `
      <div onclick="openUserModal('${u.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;">
        <div style="display:flex;align-items:center;gap:12px;">
          <strong style="width:28px;color:${idx === 0 ? '#f59e0b' : '#94a3b8'}">#${idx + 1}</strong>
          <img src="${safeAvatar(u.avatar)}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid ${u.equipped_color || '#10b981'};background:#04070b;" />
          <div><strong style="color:${u.equipped_color || '#f8fafc'}">${u.username}</strong><div class="mono-dim">[${u.role}] • Level ${Math.floor((u.xp || 0) / 1000) + 1}</div></div>
        </div>
        <span class="pill">${u.credits} Z-Credits</span>
      </div>`).join('') : '<p class="sub-text">No ranked members yet.</p>';
  }

  const aGrid = document.getElementById('achieve-grid');
  if (!aGrid) return;

  const myLvl = Math.floor((p?.xp || 0) / 1000) + 1;
  const builtInQuests = [
    { id: 'q_daily', title: '🎁 Daily Member Stipend', desc: 'Claim +150 Z-Credits every 24 hours.', cred: 150, xp: 100, isDaily: true, ready: () => Date.now() - (p?.last_daily || 0) >= 86400000 },
    { id: 'q_msg1', title: '💬 First Transmission', desc: 'Send your first message in Zynk Chat.', cred: 75, xp: 100, ready: () => (p?.msg_count || 0) >= 1 },
    { id: 'q_msg15', title: '🗨️ Active Chatter', desc: 'Send 15 messages in Zynk Chat.', cred: 200, xp: 250, ready: () => (p?.msg_count || 0) >= 15 },
    { id: 'q_msg50', title: '📡 Signal Regular', desc: 'Send 50 messages in Zynk Chat.', cred: 500, xp: 600, ready: () => (p?.msg_count || 0) >= 50 },
    { id: 'q_msg150', title: '🔥 Network Veteran', desc: 'Send 150 messages in Zynk Chat.', cred: 1200, xp: 1500, ready: () => (p?.msg_count || 0) >= 150 },
    { id: 'q_msg500', title: '👑 Chat Legend', desc: 'Send 500 messages in Zynk Chat.', cred: 3500, xp: 4000, ready: () => (p?.msg_count || 0) >= 500 },
    { id: 'q_bio', title: '🪪 Identity Configured', desc: 'Customize your bio on My Profile.', cred: 100, xp: 150, ready: () => Boolean(p?.bio && !p.bio.startsWith('New ZynkOS')) },
    { id: 'q_stk1', title: '🏷 Sticker Creator', desc: 'Upload your first custom chat sticker.', cred: 150, xp: 200, ready: () => Array.isArray(p?.stickers) && p.stickers.length >= 1 },
    { id: 'q_shop2', title: '🛒 Gear Buyer', desc: 'Own at least 2 items from Zynk Store.', cred: 250, xp: 300, ready: () => (p?.owned_items || []).length >= 2 },
    { id: 'q_shop6', title: '🎒 Vault Collector', desc: 'Own 6 or more items from Zynk Store.', cred: 750, xp: 900, ready: () => (p?.owned_items || []).length >= 6 },
    { id: 'q_shop15', title: '💎 Royal Armory', desc: 'Own 15 or more items from Zynk Store.', cred: 2000, xp: 2500, ready: () => (p?.owned_items || []).length >= 15 },
    { id: 'q_pulse', title: '⚡ Pulse Member', desc: 'Unlock Pulse Rank or higher.', cred: 200, xp: 300, ready: () => (p?.rank_index || 0) >= 1 },
    { id: 'q_lvl5', title: '🧬 Neural Level 5', desc: 'Reach Level 5 (4,000+ XP).', cred: 600, xp: 750, ready: () => myLvl >= 5 },
    { id: 'q_lvl10', title: '🚀 Neural Level 10', desc: 'Reach Level 10 (9,000+ XP).', cred: 1500, xp: 2000, ready: () => myLvl >= 10 },
    { id: 'q_lvl20', title: '🌌 Ascended Level 20', desc: 'Reach Level 20 (19,000+ XP).', cred: 4000, xp: 5000, ready: () => myLvl >= 20 },
    { id: 'q_rich5k', title: '💰 Credit Hoarder', desc: 'Hold 5,000+ Z-Credits at once.', cred: 600, xp: 750, ready: () => (p?.credits || 0) >= 5000 },
    { id: 'q_rich25k', title: '🏦 Zynk Tycoon', desc: 'Hold 25,000+ Z-Credits at once.', cred: 2500, xp: 3000, ready: () => (p?.credits || 0) >= 25000 },
    { id: 'sec_night', isSecret: true, title: '🌙 Midnight Operator', desc: '??? [Secret Quest — Condition Hidden]', cred: 650, xp: 750, ready: () => new Date().getHours() >= 0 && new Date().getHours() <= 3 },
    { id: 'sec_cyber', isSecret: true, title: '💠 Cyan Overclock', desc: '??? [Secret Quest — Condition Hidden]', cred: 450, xp: 500, ready: () => document.body.classList.contains('theme-cyber') },
    { id: 'sec_24h', isSecret: true, title: '⏱ Military Precision', desc: '??? [Secret Quest — Condition Hidden]', cred: 400, xp: 450, ready: () => localStorage.getItem('zynk_format') === '24' },
    { id: 'sec_cloak', isSecret: true, title: '🕵️ Ghost Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, ready: () => ['clever', 'classroom', 'drive', 'docs'].includes(localStorage.getItem('zynk_cloak')) },
    { id: 'sec_violet', isSecret: true, title: '🔮 Void Resonance', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, ready: () => document.body.classList.contains('theme-violet') },
    { id: 'sec_zoom', isSecret: true, title: '🔬 Micro Vision', desc: '??? [Secret Quest — Condition Hidden]', cred: 350, xp: 400, ready: () => localStorage.getItem('zynk_zoom') === '0.9' }
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
    const canClaim = Boolean(p) && q.ready() && !isDone;
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `<span class="rarity-tag" style="color:${q.isSecret ? '#a855f7' : '#10b981'}">+${q.cred} Z-Credits • +${q.xp} XP</span><h3>${q.title}</h3><p class="sub-text" style="margin:6px 0 12px;">${q.desc}</p><button class="${canClaim ? 'btn-neon' : 'btn-outline'}" ${q.isDaily ? 'id="daily-quest-btn"' : ''} ${canClaim ? '' : 'disabled'}>${isDone ? '✓ Completed' : canClaim ? 'Claim Reward' : q.isSecret ? '🔒 Discover Secret' : 'In Progress'}</button>`;
    const btn = card.querySelector('button');
    btn.onclick = async () => {
      if (!p || !canClaim || btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'Claiming...';
      const patch = { credits: p.credits + q.cred, xp: (p.xp || 0) + q.xp };
      if (q.isDaily) patch.last_daily = Date.now();
      else patch.claimed = [...new Set([...(p.claimed || []), q.id])];
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
    e.target.disabled = true;
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
