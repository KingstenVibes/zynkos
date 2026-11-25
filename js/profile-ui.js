const PROF_SVG = {
  userPlus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  userCheck: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  userMinus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  msg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  gift: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  bag: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  scroll: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
};

function safeAvatar(url) {
  return url && !String(url).includes('dicebear') ? url : 'logo.png';
}

function formatAgo(ts) {
  if (!ts) return '';
  const diff = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

window.sendFriendRequest = async function(targetUid) {
  const me = window.userProfile;
  if (!me) return window.notify('Sign in to add friends!', true);
  if (String(me.id) === String(targetUid)) return;
  const rows = await window.sbRest(`users?id=eq.${targetUid}&select=id,username,friends,friend_requests`);
  const target = Array.isArray(rows) ? rows.at(0) : null;
  if (!target) return;
  const reqs = Array.isArray(target.friend_requests) ? target.friend_requests : [];
  if (!reqs.includes(me.id)) {
    await window.sbRest(`users?id=eq.${target.id}`, 'PATCH', { friend_requests: [...reqs, me.id] }, window.authToken);
  }
  window.notify(`Friend request sent to @${target.username}!`);
  window.openUserModal(targetUid);
};

window.acceptFriendRequest = async function(fromUid) {
  const me = window.userProfile;
  if (!me) return;
  const rows = await window.sbRest(`users?id=eq.${fromUid}&select=id,username,friends`);
  const other = Array.isArray(rows) ? rows.at(0) : null;
  const myFriends = [...new Set([...(Array.isArray(me.friends) ? me.friends : []), fromUid])];
  const myReqs = (Array.isArray(me.friend_requests) ? me.friend_requests : []).filter(id => String(id) !== String(fromUid));
  await window.sbRest(`users?id=eq.${me.id}`, 'PATCH', { friends: myFriends, friend_requests: myReqs }, window.authToken);
  if (other) {
    const otherFriends = [...new Set([...(Array.isArray(other.friends) ? other.friends : []), me.id])];
    await window.sbRest(`users?id=eq.${other.id}`, 'PATCH', { friends: otherFriends }, window.authToken);
  }
  await window.refreshMyProfile();
  window.notify(`You are now friends with @${other?.username || 'member'}!`);
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

  const infList = Array.isArray(p.infractions) ? p.infractions : [];
  const isMutedNow = p.is_muted || (p.mute_until && p.mute_until > Date.now());
  const isBannedNow = p.ban_until && p.ban_until > Date.now();
  const standingLabel = isBannedNow ? 'Suspended' : isMutedNow ? 'Limited (Muted)' : infList.length ? 'Good (Past Warnings)' : 'All Good';
  const standingCol = isBannedNow ? '#f43f5e' : isMutedNow ? '#f59e0b' : '#10b981';

  const friendIds = Array.isArray(p.friends) ? p.friends : [];
  const reqIds = Array.isArray(p.friend_requests) ? p.friend_requests : [];
  const allUsers = await window.sbRest('users?select=id,username,avatar,role,equipped_color,online').catch(() => []);
  const myFriends = (allUsers || []).filter(u => friendIds.includes(u.id));
  const myReqs = (allUsers || []).filter(u => reqIds.includes(u.id));

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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.userCheck} Friends (${myFriends.length}) & Requests (${myReqs.length})</h3>
        </div>
        ${myReqs.length ? `<div style="margin-bottom:12px;"><div class="mono-dim" style="margin-bottom:6px;">INCOMING REQUESTS</div>${myReqs.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#04070b;border-radius:8px;margin-bottom:6px;"><span><strong>@${r.username}</strong></span><button class="btn-neon" style="padding:4px 10px;font-size:0.78rem;" onclick="acceptFriendRequest('${r.id}')">Accept</button></div>`).join('')}</div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">
          ${myFriends.map(f => `<div style="padding:10px;border-radius:10px;background:#04070b;display:flex;justify-content:space-between;align-items:center;"><div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="openUserModal('${f.id}')"><img src="${safeAvatar(f.avatar)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" /><div><strong style="color:${f.equipped_color || '#f8fafc'}">${f.username}</strong><div class="mono-dim">${f.online ? 'Online' : 'Offline'}</div></div></div><button class="btn-ghost" style="color:#f43f5e;" title="Unfriend" onclick="removeFriend('${f.id}')">✕</button></div>`).join('') || '<p class="sub-text">No friends added yet—click any member in Zynk Chat to send a friend request!</p>'}
        </div>
      </div>

      <div class="glass-card" style="border-color:${standingCol}55;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.shield} Account Standing: <span style="color:${standingCol}">${standingLabel}</span></h3>
          <span class="pill" style="border-color:${standingCol};color:${standingCol};">${infList.length} Record(s)</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${infList.map(x => `<div style="padding:8px 12px;border-radius:8px;background:#04070b;display:flex;justify-content:space-between;"><span><strong style="color:#f59e0b">${x.type}:</strong> ${x.reason}</span><span class="mono-dim">by @${x.by} • ${x.at}</span></div>`).join('') || '<div class="mono-dim">Your account is in good standing. No active or expired infractions.</div>'}
        </div>
      </div>

      <div class="glass-card">
        <h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.bag} My Visual Inventory (${ownedList.length} Items Owned)</h3>
        <div class="cards-grid" id="inv-visual-grid" style="margin-top:12px;"></div>
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
        <h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.scroll} Partner Requirements</h3>
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
          <strong>${a.title}</strong>
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
    { id: 'q_daily', cat: 'DAILY', title: 'Daily Mystery Card', desc: 'Pick 1 of 3 mystery cards every 24 hours & build your streak.', cred: 150, xp: 100, cur: Date.now() - (p?.last_daily || 0) >= 86400000 ? 1 : 0, max: 1, isDaily: true },
    { id: 'q_msg1', cat: 'DAILY', title: 'First Transmission', desc: 'Send at least 1 message in Zynk Chat.', cred: 75, xp: 100, cur: Math.min(1, msgs), max: 1 },
    { id: 'q_msg15', cat: 'DAILY', title: 'Daily Chatter', desc: 'Send 15 messages in Zynk Chat.', cred: 200, xp: 250, cur: Math.min(15, msgs), max: 15 },
    { id: 'q_bio', cat: 'DAILY', title: 'Identity Configured', desc: 'Customize your About Me bio on My Profile.', cred: 100, xp: 150, cur: p?.bio && !p.bio.startsWith('New ZynkOS') ? 1 : 0, max: 1 },
    { id: 'q_stk1', cat: 'DAILY', title: 'Sticker Creator', desc: 'Upload 1 custom sticker in Zynk Chat.', cred: 150, xp: 200, cur: Math.min(1, stkCnt), max: 1 },
    { id: 'q_msg50', cat: 'WEEKLY', title: 'Signal Regular', desc: 'Send 50 messages in Zynk Chat.', cred: 500, xp: 600, cur: Math.min(50, msgs), max: 50 },
    { id: 'q_msg150', cat: 'WEEKLY', title: 'Network Veteran', desc: 'Send 150 messages in Zynk Chat.', cred: 1200, xp: 1500, cur: Math.min(150, msgs), max: 150 },
    { id: 'q_msg500', cat: 'WEEKLY', title: 'Chat Legend', desc: 'Send 500 messages in Zynk Chat.', cred: 3500, xp: 4000, cur: Math.min(500, msgs), max: 500 },
    { id: 'q_shop2', cat: 'WEEKLY', title: 'Gear Buyer', desc: 'Own 2 items from Zynk Store.', cred: 250, xp: 300, cur: Math.min(2, ownedCnt), max: 2 },
    { id: 'q_shop6', cat: 'WEEKLY', title: 'Vault Collector', desc: 'Own 6 items from Zynk Store.', cred: 750, xp: 900, cur: Math.min(6, ownedCnt), max: 6 },
    { id: 'q_shop15', cat: 'WEEKLY', title: 'Royal Armory', desc: 'Own 15 items from Zynk Store.', cred: 2000, xp: 2500, cur: Math.min(15, ownedCnt), max: 15 },
    { id: 'q_lvl5', cat: 'WEEKLY', title: 'Neural Level 5', desc: 'Reach Level 5 (4,000+ XP).', cred: 600, xp: 750, cur: Math.min(5, myLvl), max: 5 },
    { id: 'q_lvl10', cat: 'WEEKLY', title: 'Neural Level 10', desc: 'Reach Level 10 (9,000+ XP).', cred: 1500, xp: 2000, cur: Math.min(10, myLvl), max: 10 },
    { id: 'q_rich5k', cat: 'WEEKLY', title: 'Credit Hoarder', desc: 'Hold 5,000+ Z-Credits at once.', cred: 600, xp: 750, cur: Math.min(5000, creds), max: 5000 },
    { id: 'q_rich25k', cat: 'WEEKLY', title: 'Zynk Tycoon', desc: 'Hold 25,000+ Z-Credits at once.', cred: 2500, xp: 3000, cur: Math.min(25000, creds), max: 25000 },
    { id: 'sec_night', cat: 'SECRET', isSecret: true, title: 'Midnight Operator', desc: '??? [Secret Quest — Condition Hidden]', cred: 650, xp: 750, cur: new Date().getHours() <= 3 ? 1 : 0, max: 1 },
    { id: 'sec_cyber', cat: 'SECRET', isSecret: true, title: 'Cyan Overclock', desc: '??? [Secret Quest — Condition Hidden]', cred: 450, xp: 500, cur: document.body.classList.contains('theme-cyber') ? 1 : 0, max: 1 },
    { id: 'sec_24h', cat: 'SECRET', isSecret: true, title: 'Military Precision', desc: '??? [Secret Quest — Condition Hidden]', cred: 400, xp: 450, cur: localStorage.getItem('zynk_format') === '24' ? 1 : 0, max: 1 },
    { id: 'sec_cloak', cat: 'SECRET', isSecret: true, title: 'Ghost Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: ['clever', 'classroom', 'drive', 'docs'].includes(localStorage.getItem('zynk_cloak')) ? 1 : 0, max: 1 },
    { id: 'sec_violet', cat: 'SECRET', isSecret: true, title: 'Void Resonance', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: document.body.classList.contains('theme-violet') ? 1 : 0, max: 1 },
    { id: 'sec_zoom', cat: 'SECRET', isSecret: true, title: 'Micro Vision', desc: '??? [Secret Quest — Condition Hidden]', cred: 350, xp: 400, cur: localStorage.getItem('zynk_zoom') === '0.9' ? 1 : 0, max: 1 }
  ];
