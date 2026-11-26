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
  const fullStatsHtml = fullMode ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px;"><div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">CREDITS</div><strong>${u.credits}</strong></div><div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">MESSAGES</div><strong>${u.msg_count || 0}</strong></div><div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">FRIENDS</div><strong>${(u.friends || []).length}</strong></div><div style="padding:10px;border-radius:10px;background:#04070b;text-align:center;"><div class="mono-dim">STREAK</div><strong>${u.daily_streak || 0}d</strong></div></div>` : '';

  box.style.maxWidth = fullMode ? '540px' : '420px';
  box.innerHTML = `<div class="banner-hero" style="background:${bannerBg}"><button class="btn-outline" id="close-user-modal" style="position:absolute;top:10px;right:10px;background:rgba(4,7,11,0.75);padding:5px 10px;">✕</button><img class="banner-avatar" style="border-color:${u.equipped_color};${frameGlow}" src="${safeAvatar(u.avatar)}" /></div><div class="profile-body"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;"><div><h2 style="color:${u.equipped_color};font-size:1.35rem;">${u.username}</h2><div class="mono-dim" style="margin-top:2px;">${statusLine}</div></div><span class="pill" style="border-color:#10b981;color:#10b981;">LVL ${Math.floor((u.xp || 0) / 1000) + 1}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">${friendBtn}${dmBtn}${!fullMode ? `<button type="button" class="btn-outline" onclick="openUserModal('${u.id}', true)">View Full Profile</button>` : ''}</div>${fullStatsHtml}<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);"><div class="mono-dim" style="font-weight:700;margin-bottom:4px;">ABOUT ME</div><p class="sub-text">${safeBio}</p></div><div style="margin-top:12px;"><div class="mono-dim" style="font-weight:700;margin-bottom:6px;">ROLES ${!isSelf && mutualCount ? `• ${mutualCount} MUTUAL FRIEND(S)` : ''}</div><div class="badges-row">${chipsHtml}</div></div></div>`;
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
      <div class="glass-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.userCheck} Friends (${myFriends.length}) & Requests (${myReqs.length})</h3></div>${myReqs.length ? `<div style="margin-bottom:12px;"><div class="mono-dim" style="margin-bottom:6px;">INCOMING REQUESTS</div>${myReqs.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#04070b;border-radius:8px;margin-bottom:6px;"><span><strong>@${r.username}</strong></span><button class="btn-neon" style="padding:4px 10px;font-size:0.78rem;" onclick="acceptFriendRequest('${r.id}')">Accept</button></div>`).join('')}</div>` : ''}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">${myFriends.map(f => `<div style="padding:10px;border-radius:10px;background:#04070b;display:flex;justify-content:space-between;align-items:center;"><div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="openUserModal('${f.id}')"><img src="${safeAvatar(f.avatar)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" /><div><strong style="color:${f.equipped_color || '#f8fafc'}">${f.username}</strong><div class="mono-dim">${f.online ? 'Online' : 'Offline'}</div></div></div><button class="btn-ghost" style="color:#f43f5e;" title="Unfriend" onclick="removeFriend('${f.id}')">✕</button></div>`).join('') || '<p class="sub-text">No friends added yet—click any member in Zynk Chat to send a friend request!</p>'}</div></div>
      <div class="glass-card" style="border-color:${standingCol}55;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.shield} Account Standing: <span style="color:${standingCol}">${standingLabel}</span></h3><span class="pill" style="border-color:${standingCol};color:${standingCol};">${infList.length} Record(s)</span></div><div style="display:flex;flex-direction:column;gap:6px;">${infList.map(x => `<div style="padding:8px 12px;border-radius:8px;background:#04070b;display:flex;justify-content:space-between;"><span><strong style="color:#f59e0b">${x.type}:</strong> ${x.reason}</span><span class="mono-dim">by @${x.by} • ${x.at}</span></div>`).join('') || '<div class="mono-dim">Your account is in good standing. No active or expired infractions.</div>'}</div></div>
      <div class="glass-card"><h3 style="display:flex;align-items:center;gap:8px;">${PROF_SVG.bag} My Visual Inventory (${ownedList.length} Items Owned)</h3><div class="cards-grid" id="inv-visual-grid" style="margin-top:12px;"></div></div>
    </div>`;
  document.getElementById('save-my-profile').onclick = async () => {
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { bio: document.getElementById('edit-bio').value }, window.authToken);
    await window.logAudit?.('PROFILE_BIO', `@${p.username}`, 'Updated bio');
    await window.refreshMyProfile();
    window.notify('Profile bio saved!');
  };

  document.getElementById('reset-my-gear').onclick = async () => {
    await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar: 'logo.png', banner: 'linear-gradient(135deg,#064e3b,#0f172a)', avatar_frame: 'none' }, window.authToken);
    await window.refreshMyProfile();
    window.notify('Reset avatar, banner & frame to defaults.');
  };

  document.getElementById('upload-pfp-btn').onclick = () => {
    if (!canUploadPfp) { window.notify('Unlock "Custom PFP Upload Pass" in Zynk Store first!', true); return window.openTab?.('store-view'); }
    document.getElementById('custom-pfp-inp').click();
  };

  document.getElementById('upload-ban-btn').onclick = () => {
    if (!canUploadBanner) { window.notify('Unlock "Custom Banner Upload Pass" in Zynk Store first!', true); return window.openTab?.('store-view'); }
    document.getElementById('custom-ban-inp').click();
  };

  const compressProfileImg = (file, maxW, maxH) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('Could not read file'));
    r.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('Invalid image file'));
      im.onload = () => {
        const sc = Math.min(1, maxW / im.width, maxH / im.height);
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(im.width * sc));
        cv.height = Math.max(1, Math.round(im.height * sc));
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/webp', 0.8));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });

  document.getElementById('custom-pfp-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    e.target.value = '';
    if (!f) return;
    try {
      window.notify('Uploading Custom PFP...');
      const dataUrl = await compressProfileImg(f, 150, 150);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { avatar: dataUrl }, window.authToken);
      await window.logAudit?.('PROFILE_PFP', `@${p.username}`, 'Updated custom PFP');
      await window.refreshMyProfile();
      window.notify('Custom Profile Picture saved!');
    } catch (err) { window.notify('PFP upload failed: ' + err.message, true); }
  };

  document.getElementById('custom-ban-inp').onchange = async (e) => {
    const f = e.target.files?.at(0);
    e.target.value = '';
    if (!f) return;
    try {
      window.notify('Uploading Custom Banner...');
      const dataUrl = await compressProfileImg(f, 560, 180);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { banner: dataUrl }, window.authToken);
      await window.logAudit?.('PROFILE_BANNER', `@${p.username}`, 'Updated custom banner');
      await window.refreshMyProfile();
      window.notify('Custom Profile Banner saved!');
    } catch (err) { window.notify('Banner upload failed: ' + err.message, true); }
  };
  const invGrid = document.getElementById('inv-visual-grid');
  ownedList.forEach(it => {
    const t = it.item_type || 'avatar';
    const val = it.item_value || it.image_url;
    const isEq = (t === 'avatar' && p.avatar === val) || (t === 'frame' && p.avatar_frame === val) || (t === 'banner' && p.banner === val) || (t === 'theme' && p.profile_theme === val) || (t === 'color' && p.equipped_color === val);
    let preview = `<img src="${safeAvatar(it.image_url)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:8px;" />`;
    if (t === 'frame') preview = `<div style="width:64px;height:64px;border-radius:50%;margin:0 auto 8px;border:3px solid ${val};box-shadow:0 0 14px ${val};"></div>`;
    if (t === 'banner') preview = `<div style="height:44px;border-radius:8px;margin-bottom:8px;background:${val.startsWith('http') || val.startsWith('data:') ? `url('${val}') center/cover` : val};"></div>`;
    if (t === 'theme' || t === 'color') preview = `<div style="height:44px;border-radius:8px;margin-bottom:8px;background:${t === 'color' ? val : '#04070b'};border:1px solid var(--neon-emerald);display:flex;align-items:center;justify-content:center;font-weight:700;">${it.name}</div>`;

    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.padding = '12px';
    card.innerHTML = `${preview}<div class="mono-dim">${t.toUpperCase()}</div><strong>${it.name}</strong><button class="${isEq ? 'btn-neon' : 'btn-outline'}" style="width:100%;margin-top:8px;">${isEq ? 'Equipped' : 'Equip'}</button>`;
    card.querySelector('button').onclick = async () => {
      const patch = t === 'avatar' ? { avatar: val } : t === 'frame' ? { avatar_frame: val } : t === 'banner' ? { banner: val } : t === 'theme' ? { profile_theme: val } : { equipped_color: val };
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', patch, window.authToken);
      if (t === 'theme') window.applySavedTheme?.(val);
      await window.refreshMyProfile();
      window.notify(`Equipped ${it.name}!`);
    };
    invGrid.appendChild(card);
  });
}

function renderDailyMysteryCards() {
  const host = document.getElementById('daily-cards-row');
  if (!host) return;
  const p = window.userProfile;
  const streak = p?.daily_streak || 0;
  const mult = Math.min(3, 1 + Math.floor(streak / 3) * 0.25);
  const stEl = document.getElementById('daily-streak-badge');
  if (stEl) stEl.textContent = `${streak} DAY STREAK (${mult}x)`;

  const last = p?.last_daily || 0;
  const onCooldown = p && (Date.now() - last) < 86400000;
  const hrsLeft = onCooldown ? Math.ceil((86400000 - (Date.now() - last)) / 3600000) : 0;

  if (onCooldown) {
    host.innerHTML = `<div class="mystery-card flipped" style="grid-column:1/-1;"><strong style="color:#10b981;font-size:1.05rem;">Daily Mystery Card Claimed!</strong><p class="sub-text" style="margin-top:4px;">Streak: <strong>${streak} Day(s)</strong> (${mult}x Reward Multiplier) • Next draw in <strong>${hrsLeft} hour(s)</strong>.</p></div>`;
    return;
  }

  host.innerHTML = [0, 1, 2].map(i => `<div class="mystery-card" data-cidx="${i}"><div style="color:#10b981;">${PROF_SVG.gift}</div><strong style="margin-top:6px;">Card #${i + 1}</strong><span class="mono-dim">Mystery Draw</span></div>`).join('');
  host.querySelectorAll('.mystery-card').forEach(card => {
    card.onclick = async () => {
      if (!p) return window.notify('Sign in to claim your Daily Mystery Card!', true);
      const roll = Math.random();
      const base = roll < 0.15 ? { rarity: 'EPIC', col: '#a855f7', z: 450, xp: 300 } : roll < 0.45 ? { rarity: 'UNCOMMON', col: '#06b6d4', z: 250, xp: 175 } : { rarity: 'COMMON', col: '#10b981', z: 125, xp: 100 };
      const finalZ = Math.round(base.z * mult);
      const finalXp = Math.round(base.xp * mult);
      const nextStreak = (Date.now() - last) < 172800000 ? streak + 1 : 1;
      card.classList.add('flipped');
      card.style.borderColor = base.col;
      card.innerHTML = `<span class="pill" style="border-color:${base.col};color:${base.col};">${base.rarity} (${mult}x)</span><strong style="font-size:1.1rem;margin-top:6px;color:${base.col};">+${finalZ} Z</strong><span class="mono-dim">+${finalXp} XP • Day ${nextStreak}</span>`;
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + finalZ, xp: (p.xp || 0) + finalXp, last_daily: Date.now(), daily_streak: nextStreak, dailies_claimed: (p.dailies_claimed || 0) + 1 }, window.authToken);
      setTimeout(() => window.refreshMyProfile(), 1400);
    };
  });
}
async function renderPartnersTab() {
  const grid = document.getElementById('partners-grid');
  if (!grid || !window.sbRest) return;
  const rows = await window.sbRest('zynk_partners?order=id.asc').catch(() => []);
  const list = Array.isArray(rows) ? rows : [];
  grid.innerHTML = list.map(pt => `
    <div class="glass-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <img src="${safeAvatar(pt.image_url)}" style="width:52px;height:52px;border-radius:12px;object-fit:cover;border:1px solid var(--neon-emerald);" />
          <div>
            <span class="pill" style="border-color:#06b6d4;color:#06b6d4;font-size:0.7rem;">${pt.tag || 'PARTNER'}</span>
            <h3 style="margin-top:4px;">${pt.name}</h3>
          </div>
        </div>
        <p class="sub-text">${pt.description || 'Official ZynkOS Network Partner.'}</p>
      </div>
      ${pt.url ? `<a href="${pt.url}" target="_blank" rel="noopener" class="btn-neon" style="text-align:center;text-decoration:none;">Visit ${pt.name} ↗</a>` : ''}
    </div>`).join('') || `<div class="glass-card" style="grid-column:1/-1;"><p class="sub-text">Official partners will appear here soon!</p></div>`;
}

async function renderCreditsTab() {
  const grid = document.getElementById('credits-grid');
  if (!grid || !window.sbRest) return;
  const [customRows, staffUsers] = await Promise.all([
    window.sbRest('zynk_credits?order=id.asc').catch(() => []),
    window.sbRest('users?role=in.(FOUNDER,HEAD%20DEV,DEVELOPER,ADMIN,MODERATOR,DESIGNER,BETA)&select=id,username,avatar,role,equipped_color,bio&order=xp.desc').catch(() => [])
  ]);

  const seen = new Set();
  const cards = [];

  (Array.isArray(customRows) ? customRows : []).forEach(c => {
    seen.add(c.name.toLowerCase());
    cards.push(`
      <div class="glass-card" style="display:flex;align-items:center;gap:14px;">
        <img src="${safeAvatar(c.image_url)}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid var(--neon-emerald);" />
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong>${c.name}</strong>
            <span class="pill" style="border-color:#f59e0b;color:#f59e0b;font-size:0.7rem;">${c.role_label || 'Contributor'}</span>
          </div>
          <p class="sub-text" style="margin-top:4px;">${c.description || 'ZynkOS Contributor'}</p>
        </div>
        ${c.user_uid ? `<button class="btn-outline" style="padding:6px 12px;font-size:0.8rem;" onclick="openUserModal('${c.user_uid}')">View Profile</button>` : ''}
      </div>`);
  });

  (Array.isArray(staffUsers) ? staffUsers : []).forEach(u => {
    if (seen.has(u.username.toLowerCase())) return;
    cards.push(`
      <div class="glass-card" style="display:flex;align-items:center;gap:14px;cursor:pointer;" onclick="openUserModal('${u.id}')">
        <img src="${safeAvatar(u.avatar)}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid ${u.equipped_color || '#10b981'};" />
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="color:${u.equipped_color || '#10b981'}">${u.username}</strong>
            <span class="pill" style="font-size:0.7rem;">${u.role}</span>
          </div>
          <p class="sub-text" style="margin-top:4px;">${String(u.bio || 'ZynkOS Staff & Team Member.').slice(0, 80)}</p>
        </div>
      </div>`);
  });

  grid.innerHTML = cards.join('');
}
let activeLegalTab = 'RULES';

function renderRulesAndLegalTab() {
  const host = document.getElementById('rules-legal-container');
  if (!host) return;
  if (window.activeLegalTabOverride) {
    activeLegalTab = window.activeLegalTabOverride;
    window.activeLegalTabOverride = null;
  }

  host.innerHTML = `
    <div style="max-width:860px;margin:auto;">
      <div class="view-topbar">
        <div>
          <h1 style="display:flex;align-items:center;gap:10px;">${PROF_SVG.scroll} Rules, Privacy Policy & Terms</h1>
          <p class="sub-text">Community guidelines, 13+ age requirement & platform policies</p>
        </div>
      </div>
      <div class="store-tabs" style="margin-bottom:16px;">
        <button class="${activeLegalTab === 'RULES' ? 'btn-neon' : 'btn-outline'}" data-ltab="RULES">Community Rules</button>
        <button class="${activeLegalTab === 'TOS' ? 'btn-neon' : 'btn-outline'}" data-ltab="TOS">Terms of Service</button>
        <button class="${activeLegalTab === 'PRIVACY' ? 'btn-neon' : 'btn-outline'}" data-ltab="PRIVACY">Privacy Policy</button>
      </div>
      <div class="glass-card" id="legal-doc-body" style="line-height:1.7;"></div>
    </div>`;

  host.querySelectorAll('[data-ltab]').forEach(b => (b.onclick = () => { activeLegalTab = b.dataset.ltab; renderRulesAndLegalTab(); }));
  const body = document.getElementById('legal-doc-body');

  if (activeLegalTab === 'RULES') {
    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h2>ZynkOS Community Guidelines</h2>
        <span class="pill" style="border-color:#10b981;color:#10b981;">13+ REQUIRED • ENFORCED BY STAFF</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 01 — Minimum Age Requirement (13+)</strong><p class="sub-text">You must be at least 13 years old to create an account, participate in Zynk Chat, or use ZynkOS services. Underage accounts will be suspended immediately.</p></div>
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 02 — Be Respectful — Zero Harassment or Hate Speech</strong><p class="sub-text">Treat every member with respect. Harassment, bullying, slurs, discrimination, doxxing, or threats of any kind are strictly prohibited.</p></div>
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 03 — Keep It Safe For Work (No NSFW or Gore)</strong><p class="sub-text">Do not post, upload, or link sexually explicit content, graphic violence, or disturbing media in Zynk Chat, avatars, banners, or custom stickers.</p></div>
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 04 — No Spam, Flooding, or Unsolicited Self-Promo</strong><p class="sub-text">Avoid message spamming, copypasta flooding, ping abuse (mass @mentions), or advertising external servers/links without Founder or Staff approval.</p></div>
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 05 — No Exploiting, Alt-Farming, or Economy Abuse</strong><p class="sub-text">Do not use scripts, bugs, or alternate accounts to farm Z-Credits, XP, Daily Mystery Cards, or leaderboard ranks.</p></div>
        <div style="padding:12px 14px;border-radius:10px;background:#04070b;"><strong style="color:#10b981;">RULE 06 — Follow Staff Instructions & Ban Evasion Policy</strong><p class="sub-text">Listen to Moderators, Admins, Developers, and the Founder. Creating new accounts to bypass a mute or ban will result in a permanent ban.</p></div>
      </div>`;
  } else if (activeLegalTab === 'TOS') {
    body.innerHTML = `
      <h2 style="margin-bottom:10px;">Terms of Service</h2>
      <p class="sub-text" style="margin-bottom:12px;">Last Updated: November 2026 • By accessing ZynkOS (<strong>zynkos.linkpc.net</strong>), you agree to these Terms.</p>
      <p style="margin-bottom:10px;"><strong>1. Eligibility (13+ Only):</strong> ZynkOS is intended strictly for users aged 13 and older. By registering an account, you confirm that you meet this minimum age requirement.</p>
      <p style="margin-bottom:10px;"><strong>2. Virtual Currency & Items:</strong> Z-Credits, XP, Ranks, Mystery Cards, and Store items are virtual platform rewards with zero real-world monetary value and cannot be exchanged for real currency.</p>
      <p style="margin-bottom:10px;"><strong>3. User Content & Moderation:</strong> You are responsible for all messages, custom avatars, banners, and stickers you upload. Staff reserve the right to remove content, mute, or suspend accounts that violate Community Rules.</p>
      <p><strong>4. Service Availability:</strong> ZynkOS is provided "as is" and features may be updated, balanced, or reset at the discretion of the Founder.</p>`;
  } else {
    body.innerHTML = `
      <h2 style="margin-bottom:10px;">Privacy Policy</h2>
      <p class="sub-text" style="margin-bottom:12px;">Last Updated: November 2026 • Your privacy matters on ZynkOS.</p>
      <p style="margin-bottom:10px;"><strong>1. Information We Collect:</strong> We store your email address (used solely for authentication), chosen username, encrypted password hash, profile customizations, chat messages, and virtual Z-Credit/XP progress.</p>
      <p style="margin-bottom:10px;"><strong>2. How We Use Data:</strong> Your data is used exclusively to operate ZynkOS features, sync your profile across sessions, and enforce community safety.</p>
      <p style="margin-bottom:10px;"><strong>3. Third-Party Services:</strong> Authentication and database storage are powered by Supabase. Optional Vortex Guild chat connects via VortexOS when you explicitly sign in with Vortex.</p>
      <p><strong>4. Account Deletion:</strong> You may permanently delete your account and associated profile data at any time inside <strong>Settings → Account & Danger Zone</strong>.</p>`;
  }
}

window.addEventListener('DOMContentLoaded', () => { renderMyProfileTab(); renderDailyMysteryCards(); renderPartnersTab(); renderCreditsTab(); renderRulesAndLegalTab(); });
window.addEventListener('zynk-profile-updated', () => { renderMyProfileTab(); renderDailyMysteryCards(); renderPartnersTab(); renderCreditsTab(); renderRulesAndLegalTab(); });
