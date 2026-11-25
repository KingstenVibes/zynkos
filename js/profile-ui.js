const PROF_SVG = {
  userPlus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  userCheck: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  userMinus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  msg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  gift: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  bag: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  scroll: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
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

window.removeFriend = async function(targetUid) {
  const me = window.userProfile;
  if (!me) return;
  const myFriends = (Array.isArray(me.friends) ? me.friends : []).filter(id => String(id) !== String(targetUid));
  await window.sbRest(`users?id=eq.${me.id}`, 'PATCH', { friends: myFriends }, window.authToken);
  const rows = await window.sbRest(`users?id=eq.${targetUid}&select=id,friends`).catch(() => []);
  const other = Array.isArray(rows) ? rows.at(0) : null;
  if (other) {
    const otherFriends = (Array.isArray(other.friends) ? other.friends : []).filter(id => String(id) !== String(me.id));
    await window.sbRest(`users?id=eq.${other.id}`, 'PATCH', { friends: otherFriends }, window.authToken);
  }
  await window.refreshMyProfile();
  window.notify('Friend removed.');
};
window.openUserModal = async function(uid, fullMode = false) {
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  if (!modal || !box || !window.sbRest) return;
  const rows = await window.sbRest(`users?id=eq.${uid}`);
  const u = Array.isArray(rows) ? rows.at(0) : null;
  if (!u) return;

  const me = window.userProfile;
  const myFriends = Array.isArray(me?.friends) ? me.friends : [];
  const theirReqs = Array.isArray(u.friend_requests) ? u.friend_requests : [];
  const myReqs = Array.isArray(me?.friend_requests) ? me.friend_requests : [];
  const isSelf = me && String(me.id) === String(u.id);
  const isFriend = myFriends.includes(u.id);
  const isPending = theirReqs.includes(me?.id);
  const hasIncoming = myReqs.includes(u.id);

  let friendBtn = '';
  if (me && !isSelf) {
    if (isFriend) friendBtn = `<button type="button" class="btn-outline" style="color:#f43f5e;border-color:#f43f5e;display:inline-flex;align-items:center;gap:6px;" onclick="removeFriend('${u.id}');document.getElementById('user-modal').classList.add('hidden');">${PROF_SVG.userMinus} Unfriend</button>`;
    else if (hasIncoming) friendBtn = `<button type="button" class="btn-neon" style="display:inline-flex;align-items:center;gap:6px;" onclick="acceptFriendRequest('${u.id}');openUserModal('${u.id}');">${PROF_SVG.userCheck} Accept Request</button>`;
    else if (isPending) friendBtn = `<button type="button" class="btn-outline" disabled>Request Pending</button>`;
    else friendBtn = `<button type="button" class="btn-neon" style="display:inline-flex;align-items:center;gap:6px;" onclick="sendFriendRequest('${u.id}')">${PROF_SVG.userPlus} Add Friend</button>`;
  }

  const dmBtn = (me && !isSelf) ? `<button type="button" class="btn-outline" style="display:inline-flex;align-items:center;gap:6px;" onclick="document.getElementById('user-modal').classList.add('hidden');openTab('chat-view');window.switchChatChannel('dm_${[String(me.id), String(u.id)].sort().join('_')}','@${u.username}');">${PROF_SVG.msg} Message</button>` : '';
  const frameGlow = u.avatar_frame && u.avatar_frame !== 'none' ? `box-shadow:0 0 0 3px ${u.avatar_frame},0 0 18px ${u.avatar_frame};` : '';
  const bannerBg = u.banner && (u.banner.startsWith('http') || String(u.banner).startsWith('data:')) ? `url('${u.banner}') center/cover` : (u.banner || 'linear-gradient(135deg,#064e3b,#0f172a)');
  const chipsHtml = window.renderRoleChips ? window.renderRoleChips(u) : `<span class="role-chip">${u.role}</span>`;
  const statusLine = u.online ? `Online • ${u.activity_text || 'Active in ZynkOS'}` : `Offline${u.last_channel ? ` • Last chatted in ${u.last_channel}` : ''}${u.last_seen ? ` (${formatAgo(u.last_seen)})` : ''}`;
  const safeBio = String(u.bio || 'New ZynkOS Member.').replace(/</g, '&lt;').replace(/\n/g, '<br>');

  const mutualCount = isSelf ? 0 : myFriends.filter(id => (Array.isArray(u.friends) ? u.friends : []).includes(id)).length;
  const fullStatsHtml = fullMode ? `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px;">
      <div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">CREDITS</div><strong>${u.credits}</strong></div>
      <div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">MESSAGES</div><strong>${u.msg_count || 0}</strong></div>
      <div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">FRIENDS</div><strong>${(u.friends || []).length}</strong></div>
      <div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">STREAK</div><strong>${u.daily_streak || 0}d</strong></div>
    </div>` : '';

  box.style.maxWidth = fullMode ? '540px' : '420px';
  box.innerHTML = `
    <div class="banner-hero" style="background:${bannerBg}">
      <button class="btn-outline" id="close-user-modal" style="position:absolute;top:10px;right:10px;background:rgba(4,7,11,0.75);padding:5px 10px;">✕</button>
      <img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${safeAvatar(u.avatar)}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
        <div>
          <h2 style="color:${u.equipped_color};font-size:1.35rem;">${u.username}</h2>
          <div class="mono-dim" style="margin-top:2px;">${statusLine}</div>
        </div>
        <span class="pill" style="border-color:#10b981;color:#10b981;">LVL ${Math.floor((u.xp || 0) / 1000) + 1}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
        ${friendBtn}
        ${dmBtn}
        ${!fullMode ? `<button type="button" class="btn-outline" onclick="openUserModal('${u.id}', true)">View Full Profile</button>` : ''}
      </div>
      ${fullStatsHtml}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
        <div class="mono-dim" style="font-weight:700;margin-bottom:4px;">ABOUT ME</div>
        <p class="sub-text">${safeBio}</p>
      </div>
      <div style="margin-top:12px;">
        <div class="mono-dim" style="font-weight:700;margin-bottom:6px;">ROLES ${!isSelf && mutualCount ? `• ${mutualCount} MUTUAL FRIEND(S)` : ''}</div>
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
  const bannerBg = p.banner && (p.banner.startsWith('http') || String(p.banner).startsWith('data:')) ? `url('${p.banner}') center/cover` : (p.banner || 'linear-gradient(135deg,#064e3b,#0f172a)');

  const isPrivileged = ['FOUNDER', 'HEAD DEV', 'DEVELOPER', 'ADMIN', 'MODERATOR'].includes((p.role || '').toUpperCase());
  const canUploadPfp = isPrivileged || (p.owned_items || []).includes('pwr_pfp');
  const canUploadBanner = isPrivileged || (p.owned_items || []).includes('pwr_ban');

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
          <div class="setting-group"><label>About Me / Bio (Press Enter for new lines)</label><textarea id="edit-bio" class="tool-input" rows="4" style="resize:vertical;line-height:1.5;">${p.bio || ''}</textarea></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <button id="save-my-profile" class="btn-neon">Save Bio</button>
            <button id="reset-my-gear" class="btn-outline">Reset Avatar & Banner</button>
            <input type="file" id="custom-pfp-inp" accept="image/*" style="position:fixed;left:-9999px;opacity:0;" />
            <input type="file" id="custom-ban-inp" accept="image/*" style="position:fixed;left:-9999px;opacity:0;" />
            <button id="upload-pfp-btn" class="btn-outline">${canUploadPfp ? 'Upload Custom PFP' : 'Upload Custom PFP (Store Pass)'}</button>
            <button id="upload-ban-btn" class="btn-outline">${canUploadBanner ? 'Upload Custom Banner' : 'Upload Custom Banner (Store Pass)'}</button>
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
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { bio: document.getElementById('edit-bio').value }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Profile bio saved!');
  };

  document.getElementById('reset-my-gear').onclick = async () => {
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar: 'logo.png', banner: 'linear-gradient(135deg,#064e3b,#0f172a)', avatar_frame: 'none' }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Reset avatar, banner & frame to defaults.');
  };

  document.getElementById('upload-pfp-btn').onclick = () => {
    if (!canUploadPfp) {
      window.notify('Unlock "Custom PFP Upload Pass" in Zynk Store first!', true);
      return window.openTab?.('store-view');
    }
    document.getElementById('custom-pfp-inp').click();
  };

  document.getElementById('upload-ban-btn').onclick = () => {
    if (!canUploadBanner) {
      window.notify('Unlock "Custom Banner Upload Pass" in Zynk Store first!', true);
      return window.openTab?.('store-view');
    }
    document.getElementById('custom-ban-inp').click();
  };

  const compressProfileImg = (file, maxDim) => new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, maxDim / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * sc);
        cv.height = Math.round(im.height * sc);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/webp', 0.85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });

  document.getElementById('custom-pfp-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    const dataUrl = await compressProfileImg(f, 256);
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar: dataUrl }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Custom Profile Picture uploaded! Keep it SFW.');
  };

  document.getElementById('custom-ban-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    const dataUrl = await compressProfileImg(f, 720);
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { banner: dataUrl }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Custom Profile Banner uploaded! Keep it SFW.');
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
  const friendCnt = Array.isArray(p?.friends) ? p.friends.length : 0;
  const streakCnt = p?.daily_streak || 0;
  const myLvl = Math.floor((p?.xp || 0) / 1000) + 1;
  const creds = p?.credits || 0;
  const hasCustomAv = p?.avatar && p.avatar !== 'logo.png' && !p.avatar.includes('dicebear') ? 1 : 0;
  const equippedCnt = (hasCustomAv ? 1 : 0) + (p?.avatar_frame && p.avatar_frame !== 'none' ? 1 : 0) + (p?.banner && !p.banner.startsWith('linear-gradient') ? 1 : 0);

  const builtInQuests = [
    { id: 'q_daily', cat: 'DAILY', title: 'Daily Mystery Card', desc: 'Pick 1 of 3 mystery cards every 24 hours & build your streak.', cred: 150, xp: 100, cur: Date.now() - (p?.last_daily || 0) >= 86400000 ? 1 : 0, max: 1, isDaily: true },
    { id: 'q_msg1', cat: 'DAILY', title: 'First Transmission', desc: 'Send at least 1 message in Zynk Chat.', cred: 75, xp: 100, cur: Math.min(1, msgs), max: 1 },
    { id: 'q_msg15', cat: 'DAILY', title: 'Daily Chatter', desc: 'Send 15 messages in Zynk Chat.', cred: 200, xp: 250, cur: Math.min(15, msgs), max: 15 },
    { id: 'q_bio', cat: 'DAILY', title: 'Identity Configured', desc: 'Customize your About Me bio on My Profile.', cred: 100, xp: 150, cur: p?.bio && !p.bio.startsWith('New ZynkOS') ? 1 : 0, max: 1 },
    { id: 'q_av', cat: 'DAILY', title: 'New Look', desc: 'Equip a custom avatar from Zynk Store.', cred: 125, xp: 150, cur: hasCustomAv, max: 1 },
    { id: 'q_stk1', cat: 'DAILY', title: 'Sticker Creator', desc: 'Upload 1 custom sticker in Zynk Chat.', cred: 150, xp: 200, cur: Math.min(1, stkCnt), max: 1 },
    { id: 'q_msg50', cat: 'WEEKLY', title: 'Signal Regular', desc: 'Send 50 messages in Zynk Chat.', cred: 500, xp: 600, cur: Math.min(50, msgs), max: 50 },
    { id: 'q_msg150', cat: 'WEEKLY', title: 'Network Veteran', desc: 'Send 150 messages in Zynk Chat.', cred: 1200, xp: 1500, cur: Math.min(150, msgs), max: 150 },
    { id: 'q_msg500', cat: 'WEEKLY', title: 'Chat Legend', desc: 'Send 500 messages in Zynk Chat.', cred: 3500, xp: 4000, cur: Math.min(500, msgs), max: 500 },
    { id: 'q_dressed', cat: 'WEEKLY', title: 'Dressed Up', desc: 'Equip 2 cosmetic items (avatar, frame, or banner).', cred: 300, xp: 350, cur: Math.min(2, equippedCnt), max: 2 },
    { id: 'q_friends3', cat: 'WEEKLY', title: 'Social Butterfly', desc: 'Add 3 friends on ZynkOS.', cred: 450, xp: 500, cur: Math.min(3, friendCnt), max: 3 },
    { id: 'q_streak7', cat: 'WEEKLY', title: 'Daily Grind', desc: 'Reach a 7-day Daily Mystery Card streak.', cred: 700, xp: 800, cur: Math.min(7, streakCnt), max: 7 },
    { id: 'q_shop2', cat: 'WEEKLY', title: 'Gear Buyer', desc: 'Own 2 items from Zynk Store.', cred: 250, xp: 300, cur: Math.min(2, ownedCnt), max: 2 },
    { id: 'q_shop6', cat: 'WEEKLY', title: 'Vault Collector', desc: 'Own 6 items from Zynk Store.', cred: 750, xp: 900, cur: Math.min(6, ownedCnt), max: 6 },
    { id: 'q_shop15', cat: 'WEEKLY', title: 'Royal Armory', desc: 'Own 15 items from Zynk Store.', cred: 2000, xp: 2500, cur: Math.min(15, ownedCnt), max: 15 },
    { id: 'q_lvl5', cat: 'WEEKLY', title: 'Neural Level 5', desc: 'Reach Level 5 (4,000+ XP).', cred: 600, xp: 750, cur: Math.min(5, myLvl), max: 5 },
    { id: 'q_lvl10', cat: 'WEEKLY', title: 'Neural Level 10', desc: 'Reach Level 10 (9,000+ XP).', cred: 1500, xp: 2000, cur: Math.min(10, myLvl), max: 10 },
    { id: 'q_rich5k', cat: 'WEEKLY', title: 'Credit Hoarder', desc: 'Hold 5,000+ Z-Credits at once.', cred: 600, xp: 750, cur: Math.min(5000, creds), max: 5000 },
    { id: 'q_rich25k', cat: 'WEEKLY', title: 'Zynk Tycoon', desc: 'Hold 25,000+ Z-Credits at once.', cred: 2500, xp: 3000, cur: Math.min(25000, creds), max: 25000 },
    { id: 'q_rich50k', cat: 'WEEKLY', title: 'High Roller', desc: 'Hold 50,000+ Z-Credits at once.', cred: 5000, xp: 6000, cur: Math.min(50000, creds), max: 50000 },
    { id: 'sec_night', cat: 'SECRET', isSecret: true, title: 'Midnight Operator', desc: '??? [Secret Quest — Condition Hidden]', cred: 650, xp: 750, cur: new Date().getHours() <= 3 ? 1 : 0, max: 1 },
    { id: 'sec_cyber', cat: 'SECRET', isSecret: true, title: 'Cyan Overclock', desc: '??? [Secret Quest — Condition Hidden]', cred: 450, xp: 500, cur: document.body.classList.contains('theme-cyber') ? 1 : 0, max: 1 },
    { id: 'sec_24h', cat: 'SECRET', isSecret: true, title: 'Military Precision', desc: '??? [Secret Quest — Condition Hidden]', cred: 400, xp: 450, cur: localStorage.getItem('zynk_format') === '24' ? 1 : 0, max: 1 },
    { id: 'sec_cloak', cat: 'SECRET', isSecret: true, title: 'Ghost Protocol', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: ['clever', 'classroom', 'drive', 'docs'].includes(localStorage.getItem('zynk_cloak')) ? 1 : 0, max: 1 },
    { id: 'sec_violet', cat: 'SECRET', isSecret: true, title: 'Void Resonance', desc: '??? [Secret Quest — Condition Hidden]', cred: 500, xp: 600, cur: document.body.classList.contains('theme-violet') ? 1 : 0, max: 1 },
    { id: 'sec_zoom', cat: 'SECRET', isSecret: true, title: 'Micro Vision', desc: '??? [Secret Quest — Condition Hidden]', cred: 350, xp: 400, cur: localStorage.getItem('zynk_zoom') === '0.9' ? 1 : 0, max: 1 }
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
    <h3 style="color:#10b981;margin-bottom:10px;">Daily Quests (${dailyList.length})</h3>
    <div class="cards-grid" id="q-sec-daily" style="margin-bottom:24px;"></div>
    <h3 style="color:#06b6d4;margin-bottom:10px;">Weekly & Milestone Quests (${weeklyList.length})</h3>
    <div class="cards-grid" id="q-sec-weekly" style="margin-bottom:24px;"></div>
    <h3 style="color:#a855f7;margin-bottom:10px;">Secret Quests (${secretList.length})</h3>
    <div class="cards-grid" id="q-sec-secret" style="margin-bottom:24px;"></div>
    <h3 style="color:#94a3b8;margin-bottom:10px;">Completed Quests (${doneList.length})</h3>
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
      <button class="${canClaim ? 'btn-neon' : 'btn-outline'}" style="width:100%" ${q.isDaily ? 'id="daily-quest-btn"' : ''} ${canClaim ? '' : 'disabled'}>${isDone ? 'Completed' : canClaim ? (q.isDaily ? 'Pick Daily Mystery Card' : 'Claim Reward') : q.isSecret ? 'Discover Secret' : 'In Progress'}</button>`;

    const btn = card.querySelector('button');
    btn.onclick = async () => {
      if (q.isDaily) return window.openDailyPickerModal();
      if (!p || !canClaim || btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'Claiming...';
      const patch = { credits: p.credits + q.cred, xp: (p.xp || 0) + q.xp, claimed: [...new Set([...(p.claimed || []), q.id])] };
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
let activeLegalTab = 'RULES';

function renderRulesAndLegal() {
  const box = document.getElementById('rules-container');
  if (!box) return;

  const tabs = [
    { id: 'RULES', label: 'Community Rules' },
    { id: 'TOS', label: 'Terms of Service' },
    { id: 'PRIVACY', label: 'Privacy Policy' }
  ];

  const cardStyle = 'padding:14px 16px;border-radius:12px;background:rgba(4,7,11,0.75);border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;';

  let contentHtml = '';
  if (activeLegalTab === 'RULES') {
    const rules = [
      { num: '01', title: 'Minimum Age Requirement (13+)', desc: 'You must be at least 13 years old to create an account, participate in Zynk Chat, or use ZynkOS services. Underage accounts will be suspended immediately.' },
      { num: '02', title: 'Be Respectful — Zero Harassment or Hate Speech', desc: 'Treat every member with respect. Harassment, bullying, slurs, discrimination, doxxing, or threats of any kind are strictly prohibited.' },
      { num: '03', title: 'Keep It Safe for Work (No NSFW or Gore)', desc: 'Do not post, upload, or link sexually explicit content, graphic violence, or disturbing media in Zynk Chat, avatars, banners, or custom stickers.' },
      { num: '04', title: 'No Spam, Flooding, or Unsolicited Self-Promo', desc: 'Avoid message spamming, copypasta flooding, ping abuse (@mentions), or advertising external servers/links without Founder or Staff approval.' },
      { num: '05', title: 'No Exploiting, Alt Farming, or Scamming', desc: 'Do not exploit bugs, farm Z-Credits/XP with alternate accounts, or attempt to scam other members during trades or gifts. Report bugs to Staff.' },
      { num: '06', title: 'Follow Staff Instructions & Channel Topics', desc: 'Listen to Moderators, Admins, and the Founder. Use #updates only for official broadcasts and keep conversations civil.' }
    ];
    contentHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.shield} ZynkOS Community Guidelines</h3>
        <span class="pill" style="border-color:#f59e0b;color:#f59e0b;">13+ REQUIRED • ENFORCED BY STAFF</span>
      </div>
      ${rules.map(r => `<div style="${cardStyle}"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><span class="mono-dim" style="color:var(--neon-emerald);font-weight:700;">RULE ${r.num}</span><strong>${r.title}</strong></div><p class="sub-text">${r.desc}</p></div>`).join('')}`;
  }

  if (activeLegalTab === 'TOS') {
    contentHtml = `
      <h3 style="margin-bottom:12px;">Terms of Service</h3>
      <div style="${cardStyle}"><strong>1. Acceptance of Terms</strong><p class="sub-text" style="margin-top:4px;">By accessing or creating an account on ZynkOS, you confirm that you are at least 13 years of age and agree to abide by these Terms of Service and our Community Rules.</p></div>
      <div style="${cardStyle}"><strong>2. Accounts & Security</strong><p class="sub-text" style="margin-top:4px;">You are responsible for keeping your login credentials secure and for all activity under your account. Sharing or selling accounts is not permitted.</p></div>
      <div style="${cardStyle}"><strong>3. Virtual Currency & Store Items (Z-Credits)</strong><p class="sub-text" style="margin-top:4px;">Z-Credits, XP, badges, avatars, and themes are virtual items with no real-world monetary value and cannot be exchanged for cash. Staff may adjust balances if obtained through exploits.</p></div>
      <div style="${cardStyle}"><strong>4. User-Generated Content</strong><p class="sub-text" style="margin-top:4px;">You retain ownership of content you upload, but grant ZynkOS permission to display it within the platform. Staff reserve the right to remove content or mute/ban accounts that violate our rules.</p></div>
      <div style="${cardStyle}"><strong>5. Service Availability</strong><p class="sub-text" style="margin-top:4px;">ZynkOS is provided "as is" and may be updated, modified, or temporarily offline for maintenance at any time.</p></div>`;
  }

  if (activeLegalTab === 'PRIVACY') {
    contentHtml = `
      <h3 style="margin-bottom:12px;">Privacy Policy</h3>
      <div style="${cardStyle}"><strong>1. Information We Collect</strong><p class="sub-text" style="margin-top:4px;">We store your chosen username, email address (for authentication), encrypted password hash, profile customizations, and chat messages needed to operate ZynkOS.</p></div>
      <div style="${cardStyle}"><strong>2. How We Use Your Data</strong><p class="sub-text" style="margin-top:4px;">Your data is used strictly to run platform features such as Zynk Chat, Private DMs, Quests, Leaderboards, and Store Inventory. We never sell your personal information to third parties.</p></div>
      <div style="${cardStyle}"><strong>3. Private Direct Messages & Controls</strong><p class="sub-text" style="margin-top:4px;">Private DMs are restricted via database security policies so only participants can access them. You can hide yourself from the Global Leaderboard anytime in Settings -> Privacy & Safety.</p></div>
      <div style="${cardStyle}"><strong>4. Local Storage & Preferences</strong><p class="sub-text" style="margin-top:4px;">ZynkOS uses browser local storage to remember your active session, steady page theme, clock format, and tab cloaking settings.</p></div>`;
  }

  box.innerHTML = `
    <div style="max-width:840px;margin:auto;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${tabs.map(t => `<button type="button" class="${activeLegalTab === t.id ? 'btn-neon' : 'btn-outline'}" data-ltab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="glass-card">${contentHtml}</div>
    </div>`;

  box.querySelectorAll('[data-ltab]').forEach(b => (b.onclick = () => {
    activeLegalTab = b.dataset.ltab;
    renderRulesAndLegal();
  }));
}
window.launchConfetti = function() {
  const colors = ['#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#f43f5e'];
  for (let i = 0; i < 42; i++) {
    const c = document.createElement('div');
    c.className = 'zynk-confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2900);
  }
};

const STREAK_LADDER = [
  { day: 1, bonus: 50 }, { day: 2, bonus: 75 }, { day: 3, bonus: 100 },
  { day: 5, bonus: 175 }, { day: 7, bonus: 300 }, { day: 10, bonus: 500 },
  { day: 14, bonus: 800 }, { day: 15, bonus: 1000 }, { day: 20, bonus: 1500 },
  { day: 30, bonus: 3000 }
];

window.openDailyPickerModal = function() {
  const p = window.userProfile;
  if (!p) return window.notify('Sign in to claim your Daily Reward!', true);
  if (Date.now() - (p.last_daily || 0) < 86400000) return window.notify('Daily reward is still on cooldown!', true);

  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const nextStreak = (p.daily_streak || 0) + 1;
  const hit = STREAK_LADDER.find(s => s.day === nextStreak) || (nextStreak > 30 ? { day: nextStreak, bonus: 3000 } : null);
  const streakBonus = hit ? hit.bonus : 0;

  const pool = [
    { tier: 'COMMON', color: '#94a3b8', cred: 150, xp: 100 },
    { tier: 'UNCOMMON', color: '#10b981', cred: 300, xp: 200 },
    { tier: 'EPIC', color: '#a855f7', cred: 600, xp: 400 }
  ].sort(() => Math.random() - 0.5);

  box.style.maxWidth = '500px';
  box.innerHTML = `
    <div style="padding:24px;text-align:center;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span class="pill" style="color:#f59e0b;border-color:#f59e0b;">Day ${nextStreak} Streak</span>
        <button class="btn-ghost" onclick="document.getElementById('user-modal').classList.add('hidden')">✕</button>
      </div>
      <h2 style="margin-bottom:4px;">Pick a Daily Mystery Card!</h2>
      <p class="sub-text" style="margin-bottom:14px;">Choose 1 of the 3 mystery cards below to reveal today's Z-Credits & XP:</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
        ${pool.map((c, i) => `
          <div class="glass-card" data-pick-card="${i}" style="padding:18px 10px;cursor:pointer;border-color:rgba(255,255,255,0.18);transition:0.2s;">
            <div style="color:var(--neon-emerald);display:flex;justify-content:center;margin-bottom:6px;">${PROF_SVG.gift}</div>
            <strong style="font-size:0.85rem;">Mystery #${i + 1}</strong>
            <div class="mono-dim" style="margin-top:4px;">Click to Reveal</div>
          </div>`).join('')}
      </div>
      <div class="mono-dim" style="text-align:left;font-weight:700;margin-bottom:6px;">STREAK MILESTONE LADDER</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
        ${STREAK_LADDER.map(s => {
          const done = nextStreak >= s.day;
          return `<div style="padding:6px 4px;border-radius:8px;background:${done ? 'rgba(16,185,129,0.18)' : '#04070b'};border:1px solid ${done ? '#10b981' : 'rgba(255,255,255,0.08)'};font-size:0.72rem;">
            <strong style="color:${done ? '#10b981' : '#f8fafc'}">Day ${s.day}</strong><div class="mono-dim">+${s.bonus} Z</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  modal.classList.remove('hidden');

  let picked = false;
  box.querySelectorAll('[data-pick-card]').forEach(cardEl => (cardEl.onclick = async () => {
    if (picked) return;
    picked = true;
    window.launchConfetti();
    const chosen = pool[parseInt(cardEl.dataset.pickCard, 10)];
    box.querySelectorAll('[data-pick-card]').forEach((el, idx) => {
      const item = pool[idx];
      el.style.borderColor = item.color;
      el.style.opacity = idx === parseInt(cardEl.dataset.pickCard, 10) ? '1' : '0.45';
      el.innerHTML = `<span class="rarity-tag" style="color:${item.color}">${item.tier}</span><h3 style="margin:6px 0 2px;">+${item.cred} Z</h3><div class="mono-dim">+${item.xp} XP</div>`;
    });

    const totalCred = chosen.cred + streakBonus;
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', {
      credits: p.credits + totalCred,
      xp: (p.xp || 0) + chosen.xp,
      last_daily: Date.now(),
      daily_streak: nextStreak
    }, window.authToken);
    await window.refreshMyProfile();
    window.notify(`${chosen.tier}! +${totalCred} Z-Credits${streakBonus ? ` (Includes +${streakBonus} Z Day ${nextStreak} Milestone!)` : ''}`);
  }));
};

function checkLevelUpCelebration() {
  const p = window.userProfile;
  if (!p) return;
  const curLvl = Math.floor((p.xp || 0) / 1000) + 1;
  const key = `zynk_lvl_${p.id}`;
  const prevLvl = parseInt(localStorage.getItem(key) || String(curLvl), 10);
  localStorage.setItem(key, String(curLvl));
  if (curLvl > prevLvl) {
    window.launchConfetti();
    const modal = document.getElementById('user-modal');
    const box = document.getElementById('user-modal-content');
    if (modal && box) {
      box.style.maxWidth = '420px';
      box.innerHTML = `
        <div style="padding:28px;text-align:center;">
          <span class="rarity-tag" style="color:#f59e0b">NEURAL RANK ASCENSION</span>
          <h2 style="font-size:1.8rem;margin:8px 0;color:#10b981;">LEVEL UP!</h2>
          <p class="sub-text" style="margin-bottom:16px;">Congratulations <strong>@${p.username}</strong> — you reached <strong>Level ${curLvl}</strong>!</p>
          <button type="button" class="btn-neon" style="width:100%" onclick="document.getElementById('user-modal').classList.add('hidden')">Awesome!</button>
        </div>`;
      modal.classList.remove('hidden');
    }
  }
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'dash-daily-btn') window.openDailyPickerModal();
});

setInterval(() => {
  const p = window.userProfile;
  if (!p) return;
  const rem = 86400000 - (Date.now() - (p.last_daily || 0));
  const label = rem <= 0 ? 'Pick Daily Mystery Card' : `Next Card in ${String(Math.floor(rem / 3600000)).padStart(2, '0')}:${String(Math.floor((rem % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((rem % 60000) / 1000)).padStart(2, '0')}`;
  ['daily-quest-btn', 'dash-daily-btn'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.disabled = rem > 0; b.className = rem <= 0 ? 'btn-neon' : 'btn-outline'; b.textContent = label; }
  });
}, 1000);

window.addEventListener('zynk-profile-updated', () => {
  checkLevelUpCelebration();
  renderMyProfileTab();
  renderLeaderboardQuestsAndAnnouncements();
  renderPartnersAndCredits();
});
window.addEventListener('DOMContentLoaded', () => {
  if (window.activeLegalTabOverride) activeLegalTab = window.activeLegalTabOverride;
  renderMyProfileTab();
  renderLeaderboardQuestsAndAnnouncements();
  renderPartnersAndCredits();
  renderRulesAndLegal();
});
