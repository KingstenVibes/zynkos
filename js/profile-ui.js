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
  const frameGlow = u.avatar_frame && u.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${u.avatar_frame},0 0 18px ${u.avatar_frame};` : '';
  const bannerBg = u.banner && (u.banner.startsWith('http') || String(u.banner).startsWith('data:')) ? `url('${u.banner}') center/cover` : (u.banner || 'linear-gradient(135deg,#064e3b,#0f172a)');
  const chipsHtml = window.renderRoleChips ? window.renderRoleChips(u) : `<span class="role-chip">${u.role}</span>`;

  box.innerHTML = `
    <div class="banner-hero" style="background:${bannerBg}">
      <button class="btn-outline" id="close-user-modal" style="position:absolute;top:10px;right:10px;background:rgba(4,7,11,0.75);padding:5px 10px;">✕</button>
      <img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${safeAvatar(u.avatar)}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h2 style="color:${u.equipped_color};font-size:1.35rem;">${u.username}</h2>
          <div class="mono-dim" style="margin-top:2px;">${u.online ? '🟢 Online • Active in ZynkOS' : '⚫ Offline'} • Level ${Math.floor((u.xp || 0) / 1000) + 1}</div>
        </div>
        <span class="pill" style="border-color:#10b981;color:#10b981;">${u.credits} Z</span>
      </div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
        <div class="mono-dim" style="font-weight:700;margin-bottom:4px;">ABOUT ME</div>
        <p class="sub-text">${u.bio || 'New ZynkOS Member.'}</p>
      </div>
      <div style="margin-top:14px;">
        <div class="mono-dim" style="font-weight:700;margin-bottom:6px;">ROLES</div>
        <div class="badges-row">${chipsHtml}</div>
      </div>
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
  const frameGlow = p.avatar_frame && p.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${p.avatar_frame},0 0 18px ${p.avatar_frame};` : '';
  const bannerBg = p.banner && (p.banner.startsWith('http') || p.banner.startsWith('data:')) ? `url('${p.banner}') center/cover` : (p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)');

  box.innerHTML = `
    <div style="max-width:860px;margin:auto;display:flex;flex-direction:column;gap:20px;">
      <div class="glass-card" style="padding:0;overflow:hidden;">
        <div class="banner-hero" style="background:${bannerBg}">
          <img class="banner-avatar" style="border-color:${p.equipped_color};${frameGlow}" src="${safeAvatar(p.avatar)}" />
        </div>
        <div class="profile-body">
          <h2 style="color:${p.equipped_color}">${p.username}</h2>
          <div class="badges-row" style="margin:6px 0 14px;">${window.renderRoleChips ? window.renderRoleChips(p) : ''}</div>
          <div class="setting-group"><label>About Me / Bio</label><input id="edit-bio" class="tool-input" value="${p.bio || ''}" /></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button id="save-my-profile" class="btn-neon">Save Bio</button>
            <button id="reset-my-gear" class="btn-outline">Reset Avatar & Banner to Default</button>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <h3>🎒 My Visual Inventory (${ownedList.length} Items Owned)</h3>
        <p class="sub-text" style="margin:4px 0 14px;">Everything you own from Zynk Store—click Equip or Unequip with live image previews:</p>
        <div class="cards-grid" id="inv-visual-grid"></div>
      </div>
    </div>`;

  document.getElementById('save-my-profile').onclick = async () => {
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { bio: document.getElementById('edit-bio').value.trim() }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Profile bio saved!');
  };

  document.getElementById('reset-my-gear').onclick = async () => {
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar: 'logo.png', banner: 'linear-gradient(135deg,#064e3b,#0f172a)', avatar_frame: 'none' }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Reset avatar, banner & frame to defaults.');
  };

  const invGrid = document.getElementById('inv-visual-grid');
  if (!ownedList.length) {
    invGrid.innerHTML = '<p class="sub-text">No store items owned yet—visit Zynk Store to unlock avatars, frames & banners!</p>';
  } else {
    ownedList.forEach(it => {
      const imgSrc = it.image_url || (String(it.item_value || '').startsWith('data:image') || String(it.item_value || '').startsWith('http') ? it.item_value : '');
      const isEq = (it.item_type === 'avatar' && p.avatar === imgSrc) || (it.item_type === 'banner' && p.banner === imgSrc) || (it.item_type === 'frame' && p.avatar_frame === it.item_value) || (it.item_type === 'theme' && document.body.className === it.item_value) || (it.item_type === 'color' && p.equipped_color === it.item_value);
      const vis = imgSrc ? `<div style="height:120px;border-radius:10px;overflow:hidden;margin-bottom:8px;background:#04070b;"><img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>` : `<div style="height:120px;border-radius:10px;margin-bottom:8px;background:#04070b;display:flex;align-items:center;justify-content:center;"><span class="pill" style="border-color:${it.item_value || '#10b981'}">${it.name}</span></div>`;
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '12px';
      card.innerHTML = `${vis}<div class="mono-dim">${it.item_type.toUpperCase()}</div><h4 style="margin:2px 0 8px;">${it.name}</h4><button class="${isEq ? 'btn-outline' : 'btn-neon'}" style="width:100%">${isEq ? 'Unequip' : 'Equip'}</button>`;
      card.querySelector('button').onclick = async () => {
        const up = {};
        if (it.item_type === 'avatar') up.avatar = isEq ? 'logo.png' : imgSrc;
        if (it.item_type === 'banner') up.banner = isEq ? 'linear-gradient(135deg,#064e3b,#0f172a)' : imgSrc;
        if (it.item_type === 'frame') up.avatar_frame = isEq ? 'none' : it.item_value;
        if (it.item_type === 'theme') { const nextTh = isEq ? 'default' : it.item_value; up.profile_theme = nextTh; localStorage.setItem('zynk_theme', nextTh); }
        if (it.item_type === 'color') up.equipped_color = isEq ? '#10b981' : it.item_value;
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', up, window.authToken);
        await window.refreshMyProfile();
        window.notify(isEq ? `Unequipped ${it.name}` : `Equipped ${it.name}!`);
      };
      invGrid.appendChild(card);
    });
  }
}
async function renderPartnersAndCredits() {
  if (!window.sbRest) return;

  const pBox = document.getElementById('partners-container');
  if (pBox) {
    const partners = await window.sbRest('zynk_partners?order=id.asc').catch(() => []);
    const defaults = [
      { name: 'VortexOS', tag: 'PARTNER NETWORK', description: 'Vortex is a next-gen community and messaging platform built for instant collaboration.', url: 'https://vortexos.net', image_url: 'logo.png' }
    ];
    const list = (partners && partners.length) ? partners : defaults;

    pBox.innerHTML = `
      <div class="cards-grid" style="margin-bottom:22px;">
        ${list.map(pt => `
          <div class="glass-card" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <img src="${safeAvatar(pt.image_url)}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;border:1px solid var(--neon-emerald);" />
                <div>
                  <span class="rarity-tag">${pt.tag || 'PARTNER'}</span>
                  <h3>${pt.name}</h3>
                </div>
              </div>
              <p class="sub-text" style="margin-bottom:14px;">${pt.description || 'Official ZynkOS Partner.'}</p>
            </div>
            ${pt.url ? `<button class="btn-neon" style="width:100%" onclick="window.open('${pt.url}','_blank')">Visit ${pt.name} ↗</button>` : ''}
          </div>`).join('')}
      </div>
      <div class="glass-card" style="max-width:520px;">
        <h3>📋 Partner Requirements</h3>
        <ul style="margin:10px 0 0 18px;color:var(--text-dim);line-height:1.8;font-size:0.88rem;">
          <li>Active ZynkOS Account & verified community presence</li>
          <li>Active website, web app, or community server</li>
          <li>Mutual link or banner placement with ZynkOS</li>
        </ul>
      </div>`;
  }

  const cBox = document.getElementById('credits-container');
  if (cBox) {
    const team = await window.sbRest('zynk_credits?order=id.asc').catch(() => []);
    const ownerRow = await window.sbRest('users?username=ilike.KingstenVibes&select=id,username,avatar,bio').catch(() => []);
    const owner = Array.isArray(ownerRow) ? ownerRow.at(0) : null;

    const ownerCard = `
      <div class="glass-card" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-color:rgba(245,158,11,0.45);">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="${safeAvatar(owner?.avatar)}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid #f59e0b;" />
          <div>
            <div style="display:flex;align-items:center;gap:8px;"><strong style="font-size:1.1rem;color:#f59e0b;">KingstenVibes</strong><span class="role-chip"><span class="role-dot" style="background:#f59e0b"></span>Owner & Founder</span></div>
            <p class="sub-text" style="margin-top:4px;">${owner?.bio || 'Creator, Lead Architect & Founder of ZynkOS.'}</p>
          </div>
        </div>
        ${owner ? `<button class="btn-outline" onclick="openUserModal('${owner.id}')">View Profile</button>` : ''}
      </div>`;

    const extraCards = (team || []).map(m => `
      <div class="glass-card" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="${safeAvatar(m.image_url)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--neon-emerald);" />
          <div>
            <div style="display:flex;align-items:center;gap:8px;"><strong style="font-size:1.05rem;">${m.name}</strong><span class="role-chip"><span class="role-dot" style="background:#10b981"></span>${m.role_label || 'Contributor'}</span></div>
            <p class="sub-text" style="margin-top:4px;">${m.description || 'ZynkOS Contributor'}</p>
          </div>
        </div>
        ${m.user_uid ? `<button class="btn-outline" onclick="openUserModal('${m.user_uid}')">View Profile</button>` : ''}
      </div>`).join('');

    cBox.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;max-width:780px;">${ownerCard}${extraCards}</div>`;
  }
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
    const users = await window.sbRest('users?role=neq.FOUNDER&hide_leaderboard=neq.true&order=credits.desc,xp.desc&limit=30').catch(() => []);
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

  const msgs = p?.msg_count || 0;
  const ownedCnt = (p?.owned_items || []).length;
  const stkCnt = Array.isArray(p?.stickers) ? p.stickers.length : 0;
  const myLvl = Math.floor((p?.xp || 0) / 1000) + 1;
  const creds = p?.credits || 0;

  const builtInQuests = [
    { id: 'q_daily', cat: 'DAILY', title: '🎁 Daily Member Stipend', desc: 'Claim +150 Z-Credits every 24 hours.', cred: 150, xp: 100, cur: Date.now() - (p?.last_daily || 0) >= 86400000 ? 1 : 0, max: 1, isDaily: true },
    { id: 'q_msg1', cat: 'DAILY', title: '💬 First Transmission', desc: 'Send at least 1 message in Zynk Chat.', cred: 75, xp: 100, cur: Math.min(1, msgs), max: 1 },
    { id: 'q_msg15', cat: 'DAILY', title: '🗨️ Daily Chatter', desc: 'Send 15 messages in Zynk Chat.', cred: 200, xp: 250, cur: Math.min(15, msgs), max: 15 },
    { id: 'q_bio', cat: 'DAILY', title: '🪪 Identity Configured', desc: 'Customize your About Me bio on My Profile.', cred: 100, xp: 150, cur: p?.bio && !p.bio.startsWith('New ZynkOS') ? 1 : 0, max: 1 },
    { id: 'q_stk1', cat: 'DAILY', title: '🏷 Sticker Creator', desc: 'Upload 1 custom sticker in Zynk Chat.', cred: 150, xp: 200, cur: Math.min(1, stkCnt), max: 1 },
    { id: 'q_msg50', cat: 'WEEKLY', title: '📡 Signal Regular', desc: 'Send 50 messages in Zynk Chat.', cred: 500, xp: 600, cur: Math.min(50, msgs), max: 50 },
    { id: 'q_msg150', cat: 'WEEKLY', title: '🔥 Network Veteran', desc: 'Send 150 messages in Zynk Chat.', cred: 1200, xp: 1500, cur: Math.min(150, msgs), max: 150 },
    { id: 'q_msg500', cat: 'WEEKLY', title: '👑 Chat Legend', desc: 'Send 500 messages in Zynk Chat.', cred: 3500, xp: 4000, cur: Math.min(500, msgs), max: 500 },
    { id: 'q_shop2', cat: 'WEEKLY', title: '🛒 Gear Buyer', desc: 'Own 2 items from Zynk Store.', cred: 250, xp: 300, cur: Math.min(2, ownedCnt), max: 2 },
    { id: 'q_shop6', cat: 'WEEKLY', title: '🎒 Vault Collector', desc: 'Own 6 items from Zynk Store.', cred: 750, xp: 900, cur: Math.min(6, ownedCnt), max: 6 },
    { id: 'q_shop15', cat: 'WEEKLY', title: '💎 Royal Armory', desc: 'Own 15 items from Zynk Store.', cred: 2000, xp: 2500, cur: Math.min(15, ownedCnt), max: 15 },
    { id: 'q_lvl5', cat: 'WEEKLY', title: '🧬 Neural Level 5', desc: 'Reach Level 5 (4,000+ XP).', cred: 600, xp: 750, cur: Math.min(5, myLvl), max: 5 },
    { id: 'q_lvl10', cat: 'WEEKLY', title: '🚀 Neural Level 10', desc: 'Reach Level 10 (9,000+ XP).', cred: 1500, xp: 2000, cur: Math.min(10, myLvl), max: 10 },
    { id: 'q_rich5k', cat: 'WEEKLY', title: '💰 Credit Hoarder', desc: 'Hold 5,000+ Z-Credits at once.', cred: 600, xp: 750, cur: Math.min(5000, creds), max: 5000 },
    { id: 'q_rich25k', cat: 'WEEKLY', title: '🏦 Zynk Tycoon', desc: 'Hold 25,000+ Z-Credits at once.', cred: 2500, xp: 3000, cur: Math.min(25000, creds), max: 25000 },
    { id: 'sec_night', cat: 'SECRET', isSecret: true, title: '🌙 Midnight Operator', desc: '??? [Secret Quest — Condition Hidden]', cred: 650, xp: 750, cur: new Date().getHours() <= 3 ? 1 : 0, max: 1 },
    { id: 'sec_cyber', cat: 'SECRET', isSecret: true, title: '💠 Cyan Overclock', desc: '??? [Secret Quest — Condition Hidden]', cred: 450, xp: 500, cur: document.body.classList.contains('theme-cyber') ? 1 : 0, max: 1 },
    { id: 'sec_24h', cat: 'SECRET', isSecret: true, title: '⏱ Military Precision', desc: '??? [Secret Quest — Condition Hidden]', cred: 400, xp: 450, cur: localStorage.getItem('zynk_format') === '24' ? 1 : 0, max: 1 },
    { id: 'sec_cloak', cat: 'SECRET', isSecret: true, title: '🕵️ Ghost Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: ['clever', 'classroom', 'drive', 'docs'].includes(localStorage.getItem('zynk_cloak')) ? 1 : 0, max: 1 },
    { id: 'sec_violet', cat: 'SECRET', isSecret: true, title: '🔮 Void Resonance', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: document.body.classList.contains('theme-violet') ? 1 : 0, max: 1 },
    { id: 'sec_zoom', cat: 'SECRET', isSecret: true, title: '🔬 Micro Vision', desc: '??? [Secret Quest — Condition Hidden]', cred: 350, xp: 400, cur: localStorage.getItem('zynk_zoom') === '0.9' ? 1 : 0, max: 1 }
  ];
  const customQuests = await window.sbRest('achievements_list?order=id.asc').catch(() => []);
  const allQuests = [
    ...builtInQuests,
    ...(customQuests || []).map(q => ({ id: `db_${q.id}`, cat: q.is_secret ? 'SECRET' : 'WEEKLY', title: q.title, desc: q.is_secret ? '??? [Secret Quest — Condition Hidden]' : q.description, cred: q.reward_credits, xp: q.reward_xp, isSecret: q.is_secret, cur: 1, max: 1 }))
  ];

  const isClaimed = (q) => !q.isDaily && (p?.claimed || []).includes(q.id);
  const dailyList = allQuests.filter(q => q.cat === 'DAILY' && !isClaimed(q));
  const weeklyList = allQuests.filter(q => q.cat === 'WEEKLY' && !isClaimed(q));
  const secretList = allQuests.filter(q => q.cat === 'SECRET' && !isClaimed(q));
  const doneList = allQuests.filter(q => isClaimed(q));

  aGrid.style.display = 'block';
  aGrid.innerHTML = `
    <h3 style="color:#10b981;margin-bottom:10px;">⚡ Daily Quests (${dailyList.length})</h3>
    <div class="cards-grid" id="q-sec-daily" style="margin-bottom:24px;"></div>
    <h3 style="color:#06b6d4;margin-bottom:10px;">📅 Weekly & Milestone Quests (${weeklyList.length})</h3>
    <div class="cards-grid" id="q-sec-weekly" style="margin-bottom:24px;"></div>
    <h3 style="color:#a855f7;margin-bottom:10px;">🔒 Secret Quests (${secretList.length})</h3>
    <div class="cards-grid" id="q-sec-secret" style="margin-bottom:24px;"></div>
    <h3 style="color:#94a3b8;margin-bottom:10px;">✅ Completed Quests (${doneList.length})</h3>
    <div class="cards-grid" id="q-sec-done"></div>`;

  const renderCard = (q, targetId, isDone) => {
    const box = document.getElementById(targetId);
    if (!box) return;
    const canClaim = Boolean(p) && q.cur >= q.max && !isDone;
    const pct = Math.min(100, Math.round((q.cur / q.max) * 100));
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="pill" style="padding:3px 9px;font-size:0.74rem;color:#10b981;">+${q.cred} Z-Credits</span>
        <span class="pill" style="padding:3px 9px;font-size:0.74rem;color:#06b6d4;">+${q.xp} XP</span>
      </div>
      <h3>${q.title}</h3>
      <p class="sub-text" style="margin:6px 0 10px;">${q.desc}</p>
      ${!q.isSecret ? `<div class="xp-labels"><span>Progress</span><span>${q.cur} / ${q.max}</span></div><div class="xp-track" style="margin-bottom:12px;"><div class="xp-fill" style="width:${pct}%"></div></div>` : ''}
      <button class="${canClaim ? 'btn-neon' : 'btn-outline'}" style="width:100%" ${q.isDaily ? 'id="daily-quest-btn"' : ''} ${canClaim ? '' : 'disabled'}>${isDone ? '✓ Completed' : canClaim ? 'Claim Reward' : q.isSecret ? '🔒 Discover Secret' : 'In Progress'}</button>`;

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

  dailyList.forEach(q => renderCard(q, 'q-sec-daily', false));
  weeklyList.forEach(q => renderCard(q, 'q-sec-weekly', false));
  secretList.forEach(q => renderCard(q, 'q-sec-secret', false));
  doneList.forEach(q => renderCard(q, 'q-sec-done', true));
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

window.addEventListener('zynk-profile-updated', () => { renderMyProfileTab(); renderLeaderboardQuestsAndAnnouncements(); renderPartnersAndCredits(); });
window.addEventListener('DOMContentLoaded', () => { renderMyProfileTab(); renderLeaderboardQuestsAndAnnouncements(); renderPartnersAndCredits(); });
