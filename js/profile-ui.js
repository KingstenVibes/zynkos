window.openUserModal = async function(uid) {
  const { data: u } = await window.sb.from('users').select('*').eq('id', uid).single();
  if (!u) return;
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const rankName = window.RANKS[u.rank_index]?.name || 'Circuit';
  const me = window.userProfile;
  const isMe = me && me.id === u.id;
  const isFriend = me && (me.friends || []).includes(u.username);
  const isFollowing = me && (me.following || []).includes(u.username);

  box.innerHTML = `
    <div class="banner-hero" style="background:${u.banner.startsWith('http') || u.banner.startsWith('data:') ? `url(${u.banner}) center/cover` : u.banner}">
      <img class="banner-avatar" src="${u.avatar}" style="border-color:${u.equipped_color}" />
    </div>
    <div class="profile-body">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2 style="color:${u.equipped_color}">${u.username}</h2>
          <span class="mono-dim">${u.online ? '● Online' : '○ Offline'} • [${u.role}] • [${rankName}]${u.is_beta ? ' • [BETA]' : ''}</span>
        </div>
        <button class="btn-outline" id="close-user-modal">✕</button>
      </div>
      <p class="sub-text" style="margin:12px 0;">${u.bio}</p>
      <div class="badges-row" style="margin-bottom:14px;">
        <span class="pill">${u.credits} Z-Credits</span>
        <span class="pill">Level ${Math.floor(u.xp / 1000) + 1}</span>
        <span class="pill">${(u.friends || []).length} Friends</span>
      </div>
      ${!isMe && me ? `<div style="display:flex;gap:8px;"><button class="btn-neon" id="modal-friend-btn">${isFriend ? 'Friends ✓' : '+ Add Friend'}</button><button class="btn-outline" id="modal-follow-btn">${isFollowing ? 'Following ✓' : '+ Follow'}</button></div>` : ''}
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('close-user-modal').onclick = () => modal.classList.add('hidden');

  if (!isMe && me) {
    document.getElementById('modal-friend-btn').onclick = async () => {
      const next = isFriend ? me.friends.filter(x => x !== u.username) : [...(me.friends || []), u.username];
      await window.sb.from('users').update({ friends: next }).eq('id', me.id);
      await window.refreshMyProfile();
      window.openUserModal(uid);
    };
    document.getElementById('modal-follow-btn').onclick = async () => {
      const next = isFollowing ? me.following.filter(x => x !== u.username) : [...(me.following || []), u.username];
      await window.sb.from('users').update({ following: next }).eq('id', me.id);
      await window.refreshMyProfile();
      window.openUserModal(uid);
    };
  }
};

function renderMyProfileTab() {
  const box = document.getElementById('my-profile-container');
  const p = window.userProfile;
  if (!p) {
    box.innerHTML = `<div class="glass-card" style="max-width:460px;margin:auto;text-align:center;"><h3>Sign In Required</h3><p class="sub-text" style="margin:10px 0 16px;">Create an account to upload your profile picture, banner, bio, and manage friends.</p><button class="btn-neon" onclick="document.getElementById('auth-modal').classList.remove('hidden')">Sign In / Create Account</button></div>`;
    return;
  }
  const rankName = window.RANKS[p.rank_index]?.name || 'Circuit';
  box.innerHTML = `
    <div class="glass-card" style="padding:0;overflow:hidden;max-width:680px;margin:auto;">
      <div class="banner-hero" style="background:${p.banner.startsWith('http') || p.banner.startsWith('data:') ? `url(${p.banner}) center/cover` : p.banner}">
        <img class="banner-avatar" src="${p.avatar}" style="border-color:${p.equipped_color}" />
      </div>
      <div class="profile-body">
        <h2>${p.username}</h2>
        <div class="badges-row" style="margin:6px 0 14px;">
          <span class="pill" style="color:#10b981">[${p.role}]</span>
          <span class="pill">[${rankName}]</span>
          <span class="pill">${(p.friends || []).length} Friends • ${(p.following || []).length} Following</span>
        </div>
        <div class="setting-group"><label>Upload Profile Picture</label><input id="upload-avatar-file" type="file" accept="image/*" class="tool-input" /></div>
        <div class="setting-group"><label>Upload Banner Image</label><input id="upload-banner-file" type="file" accept="image/*" class="tool-input" /></div>
        <div class="setting-group"><label>Bio</label><input id="edit-bio" class="tool-input" value="${p.bio}" /></div>
        <button class="btn-neon" id="save-my-profile" style="margin-top:10px;">Save Profile Changes</button>
      </div>
    </div>
  `;

  let newAvatar = p.avatar;
  let newBanner = p.banner;
  document.getElementById('upload-avatar-file').onchange = (e) => {
    const f = e.target.files;
    if (!f) return;
    const r = new FileReader();
    r.onload = () => (newAvatar = r.result);
    r.readAsDataURL(f);
  };
  document.getElementById('upload-banner-file').onchange = (e) => {
    const f = e.target.files;
    if (!f) return;
    const r = new FileReader();
    r.onload = () => (newBanner = r.result);
    r.readAsDataURL(f);
  };
  document.getElementById('save-my-profile').onclick = async () => {
    await window.sb.from('users').update({
      avatar: newAvatar,
      banner: newBanner,
      bio: document.getElementById('edit-bio').value.trim() || p.bio
    }).eq('id', p.id);
    await window.refreshMyProfile();
    alert('Profile picture, banner & bio saved!');
  };
}

async function renderLeaderboard() {
  const lb = document.getElementById('leaderboard-list');
  const { data: users } = await window.sb.from('users').select('*').order('credits', { ascending: false }).limit(20);
  if (!users || !users.length) {
    lb.innerHTML = '<p class="sub-text">No registered operators yet—create an account to claim #1!</p>';
    return;
  }
  lb.innerHTML = users.map((u, i) => `
    <div class="lb-row" data-uid="${u.id}">
      <div style="display:flex;align-items:center;gap:10px;">
        <strong>#${i + 1}</strong>
        <img class="member-mini-av" src="${u.avatar}" />
        <span style="color:${u.equipped_color};font-weight:700;">${u.username}</span>
      </div>
      <span class="mono-dim">${u.credits} Z-Credits</span>
    </div>
  `).join('');
  lb.querySelectorAll('[data-uid]').forEach(el => (el.onclick = () => window.openUserModal(el.dataset.uid)));
}

window.addEventListener('zynk-profile-updated', () => {
  renderMyProfileTab();
  renderLeaderboard();
});
renderMyProfileTab();
renderLeaderboard();
