let uploadedImg = '';
let activeFounderTab = 'ANNOUNCE';

async function renderAdminAndBeta() {
  const p = window.userProfile;
  const adminBox = document.getElementById('admin-panel-container');
  const betaGrid = document.getElementById('beta-grid');
  const isFounder = p && p.role === 'FOUNDER';
  const isBeta = (p && (p.is_beta || p.role === 'BETA')) || isFounder;

  if (betaGrid && isBeta) {
    betaGrid.innerHTML = `
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 1</span><h3>Live Page Theme Switcher</h3><p class="sub-text">Test steady page color themes before public release.</p><div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn-outline" data-th="default">Emerald</button><button class="btn-outline" data-th="theme-cyber">Cyber Cyan</button><button class="btn-outline" data-th="theme-crimson">Crimson</button><button class="btn-outline" data-th="theme-gold">Gold</button><button class="btn-outline" data-th="theme-violet">Violet</button></div></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 2</span><h3>Beta Tester Stipend</h3><p class="sub-text">Claim +250 Z-Credits for testing experimental ZynkOS builds.</p><button class="btn-neon" id="beta-bonus-btn">Claim +250 Z-Credits</button></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 3</span><h3>Compact HUD Mode</h3><p class="sub-text">Toggle high-density spacing across ZynkOS panels.</p><button class="btn-outline" id="beta-compact-btn">Toggle Compact HUD</button></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 4</span><h3>Neural XP Overdrive</h3><p class="sub-text">Test instant +150 Neural Sync XP progression.</p><button class="btn-outline" id="beta-xp-btn">Test +150 XP</button></div>`;

    betaGrid.querySelectorAll('[data-th]').forEach(b => (b.onclick = async () => {
      document.body.className = b.dataset.th === 'default' ? '' : b.dataset.th;
      if (p) await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { profile_theme: b.dataset.th }, window.authToken);
      window.notify(`Applied theme: ${b.textContent}`);
    }));
    document.getElementById('beta-bonus-btn').onclick = async () => {
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 250 }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Beta +250 Z-Credits added!');
    };
    document.getElementById('beta-compact-btn').onclick = () => {
      document.body.style.zoom = document.body.style.zoom === '0.92' ? '1' : '0.92';
      window.notify('Toggled Compact HUD scale.');
    };
    document.getElementById('beta-xp-btn').onclick = async () => {
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { xp: (p.xp || 0) + 150 }, window.authToken);
      await window.refreshMyProfile();
      window.notify('+150 Neural Sync XP granted!');
    };
  }

  if (!adminBox || !isFounder) return;
  const fTabs = [
    { id: 'ANNOUNCE', label: '📢 Broadcast Announcements' },
    { id: 'SHOP', label: '🖼 Shop Upload & Daily Deals' },
    { id: 'ROLES', label: '⚡ Roles & Ranks' },
    { id: 'SECRETS', label: '🔒 Secret Quest Guide (Founder Only)' }
  ];

  adminBox.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      ${fTabs.map(t => `<button class="${activeFounderTab === t.id ? 'btn-neon' : 'btn-outline'}" data-ftab="${t.id}">${t.label}</button>`).join('')}
    </div>
    <div id="founder-subview"></div>`;

  adminBox.querySelectorAll('[data-ftab]').forEach(b => (b.onclick = () => { activeFounderTab = b.dataset.ftab; renderAdminAndBeta(); }));
  const sub = document.getElementById('founder-subview');

  if (activeFounderTab === 'ANNOUNCE') {
    const anns = await window.sbRest('announcements?order=id.desc&limit=20').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>📢 Broadcast System Announcement</h3>
          <label class="sub-text">Choose Announcement Icon / Emoji:</label>
          <select id="ann-icon" class="tool-input"><option value="📢">📢 Megaphone</option><option value="🚀">🚀 Launch / Update</option><option value="🔥">🔥 Hot / Event</option><option value="🎁">🎁 Giveaway / Reward</option><option value="⚡">⚡ System Alert</option><option value="🛠️">🛠️ Maintenance / Fix</option><option value="👑">👑 Founder Note</option></select>
          <input id="ann-title" class="tool-input" placeholder="Announcement Title" />
          <textarea id="ann-body" class="tool-input" rows="4" placeholder="Write your announcement message..."></textarea>
          <button id="ann-post-btn" class="btn-neon" style="width:100%">Publish to Home Feed</button>
        </div>
        <div class="glass-card">
          <h3>Past Broadcasts (${(anns || []).length})</h3>
          <div style="max-height:310px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            ${(anns || []).map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(4,7,11,0.7);border-radius:8px;"><div><strong>${a.icon} ${a.title}</strong><div class="sub-text">${a.body}</div></div><button class="btn-ghost" data-del-ann="${a.id}">✕</button></div>`).join('') || '<p class="sub-text">No broadcasts yet.</p>'}
          </div>
        </div>
      </div>`;
    document.getElementById('ann-post-btn').onclick = async () => {
      const title = document.getElementById('ann-title').value.trim();
      const body = document.getElementById('ann-body').value.trim();
      if (!title || !body) return window.notify('Enter both title and message.', true);
      await window.sbRest('announcements', 'POST', { icon: document.getElementById('ann-icon').value, title, body, author: p.username }, window.authToken);
      window.notify('Announcement published to Dashboard!');
      window.dispatchEvent(new Event('zynk-profile-updated'));
    };
    sub.querySelectorAll('[data-del-ann]').forEach(b => (b.onclick = async () => {
      await window.sbRest(`announcements?id=eq.${b.dataset.delAnn}`, 'DELETE', null, window.authToken);
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }));
  }
  if (activeFounderTab === 'SHOP') {
    const storeItems = await window.sbRest('store_items?order=id.asc').catch(() => []);
    const reqs = await window.sbRest('shop_requests?order=id.desc').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🖼 Upload Store Item / Theme</h3>
          <input id="adm-item-name" class="tool-input" placeholder="Item Name" />
          <input id="adm-item-file" type="file" accept="image/*" class="tool-input" />
          <input id="adm-item-img" class="tool-input" placeholder="Or paste image URL..." />
          <div style="display:flex;gap:8px;">
            <select id="adm-item-type" class="tool-input"><option value="avatar">Avatar</option><option value="frame">Avatar Frame</option><option value="banner">Profile Banner</option><option value="theme">Steady Page Theme</option><option value="color">Name Color</option><option value="badge">Badge</option></select>
            <select id="adm-item-rarity" class="tool-input"><option value="COMMON">COMMON</option><option value="RARE">RARE</option><option value="EPIC">EPIC</option><option value="LEGENDARY">LEGENDARY</option></select>
          </div>
          <input id="adm-item-val" class="tool-input" placeholder="Frame/Color Hex (#06b6d4) or Theme (theme-cyber)" />
          <input id="adm-item-cost" type="number" class="tool-input" value="150" placeholder="Z-Credits Cost" />
          <label class="remember-row"><input type="checkbox" id="adm-item-deal" /><span>🔥 Feature as Daily Deal (10% Off)</span></label>
          <button class="btn-neon" id="adm-add-item-btn" style="width:100%">Publish to Store</button>
        </div>
        <div class="glass-card">
          <h3>🔥 Daily Deals & User Requests</h3>
          ${(storeItems || []).map(it => `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span>${it.name}</span><button class="${it.is_daily_deal ? 'btn-neon' : 'btn-outline'}" data-deal-id="${it.id}" data-deal-on="${it.is_daily_deal ? '1' : '0'}">${it.is_daily_deal ? '10% OFF ON' : 'Set Deal'}</button></div>`).join('')}
          <h4 style="margin-top:14px;">💡 User Shop Requests (${(reqs || []).length})</h4>
          ${(reqs || []).map(r => `<div style="display:flex;justify-content:space-between;padding:5px 0;"><span><strong>${r.item_name}</strong> (${r.category}) by @${r.username}</span><button class="btn-ghost" data-del-req="${r.id}">✕</button></div>`).join('') || '<p class="sub-text">No requests.</p>'}
        </div>
      </div>`;
    document.getElementById('adm-item-file').onchange = (e) => {
      const f = e.target.files?.at(0);
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { uploadedImg = r.result; window.notify('Image ready!'); };
      r.readAsDataURL(f);
    };
    document.getElementById('adm-add-item-btn').onclick = async () => {
      const name = document.getElementById('adm-item-name').value.trim();
      const img = uploadedImg || document.getElementById('adm-item-img').value.trim();
      if (!name) return window.notify('Enter item name.', true);
      await window.sbRest('store_items', 'POST', { name, image_url: img, item_type: document.getElementById('adm-item-type').value, rarity: document.getElementById('adm-item-rarity').value, item_value: document.getElementById('adm-item-val').value.trim() || img || '#10b981', cost: parseInt(document.getElementById('adm-item-cost').value, 10) || 100, is_daily_deal: document.getElementById('adm-item-deal').checked }, window.authToken);
      uploadedImg = '';
      window.notify('Published to Store!');
      window.dispatchEvent(new Event('zynk-profile-updated'));
    };
    sub.querySelectorAll('[data-deal-id]').forEach(b => (b.onclick = async () => {
      await window.sbRest(`store_items?id=eq.${b.dataset.dealId}`, 'PATCH', { is_daily_deal: b.dataset.dealOn !== '1' }, window.authToken);
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }));
    sub.querySelectorAll('[data-del-req]').forEach(b => (b.onclick = async () => {
      await window.sbRest(`shop_requests?id=eq.${b.dataset.delReq}`, 'DELETE', null, window.authToken);
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }));
  }
  if (activeFounderTab === 'ROLES') {
    sub.innerHTML = `
      <div class="glass-card" style="max-width:520px;">
        <h3>⚡ Grant User Roles & Paid Ranks</h3>
        <input id="adm-target-user" class="tool-input" placeholder="Exact Username" />
        <label class="sub-text">Primary Role:</label>
        <select id="adm-target-role" class="tool-input"><option value="MEMBER">MEMBER</option><option value="SUPPORTER">SUPPORTER</option><option value="VIP">VIP</option><option value="UPLOADER">UPLOADER</option><option value="BETA">BETA TESTER</option><option value="MODERATOR">MODERATOR</option><option value="FOUNDER">FOUNDER</option></select>
        <label class="sub-text">Extra Badge Roles (hold Ctrl to pick multiple):</label>
        <select id="adm-extra-roles" multiple class="tool-input" style="height:105px;"><option value="SUPPORTER">SUPPORTER</option><option value="VIP">VIP</option><option value="UPLOADER">UPLOADER</option><option value="DESIGNER">DESIGNER</option><option value="OG">OG OPERATOR</option></select>
        <label class="sub-text">Paid Rank Override:</label>
        <select id="adm-target-rank" class="tool-input"><option value="">Keep Current Rank</option><option value="1">Pulse</option><option value="2">Nova ($4.99)</option><option value="3">Titan ($9.99)</option><option value="4">Apex ($19.99)</option></select>
        <button class="btn-neon" id="adm-grant-btn" style="width:100%">Apply Roles & Rank</button>
      </div>`;
    document.getElementById('adm-grant-btn').onclick = async () => {
      const target = document.getElementById('adm-target-user').value.trim();
      const role = document.getElementById('adm-target-role').value;
      const extras = Array.from(document.getElementById('adm-extra-roles').selectedOptions).map(o => o.value);
      const rankVal = document.getElementById('adm-target-rank').value;
      if (!target) return window.notify('Enter username.', true);
      const patch = { role, extra_roles: extras, is_beta: role === 'BETA' || role === 'FOUNDER' };
      if (rankVal !== '') patch.rank_index = parseInt(rankVal, 10);
      await window.sbRest(`users?username=ilike.${encodeURIComponent(target)}`, 'PATCH', patch, window.authToken);
      window.notify(`Updated ${target}!`);
    };
  }

  if (activeFounderTab === 'SECRETS') {
    const customSecrets = await window.sbRest('achievements_list?is_secret=eq.true&order=id.asc').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🔒 Founder-Only Secret Quest Solution Key</h3>
          <p class="sub-text" style="margin-bottom:12px;">Only you (FOUNDER) can see how these secret quests are unlocked:</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:10px;background:#04070b;border-radius:8px;"><strong>🌙 Night Owl Protocol (+500 Z-Credits):</strong> Open Quests between 10:00 PM and 4:59 AM local time.</div>
            <div style="padding:10px;background:#04070b;border-radius:8px;"><strong>💠 Cyan Overclock (+400 Z-Credits):</strong> Equip the <code>Cyber Cyan</code> steady page theme in Settings or My Profile.</div>
            <div style="padding:10px;background:#04070b;border-radius:8px;"><strong>⏱ Military Precision (+350 Z-Credits):</strong> Switch Clock Format to <code>24-Hour (Military)</code> in Settings.</div>
            <div style="padding:10px;background:#04070b;border-radius:8px;"><strong>🕵️ Ghost Protocol (+450 Z-Credits):</strong> Enable any Tab Disguise (Clever, Classroom, Drive, or Docs) in Settings.</div>
            ${(customSecrets || []).map(s => `<div style="padding:10px;background:#04070b;border-radius:8px;"><strong>${s.title} (+${s.reward_credits}):</strong> ${s.secret_hint || s.description}</div>`).join('')}
          </div>
        </div>
        <div class="glass-card">
          <h3>➕ Create New Normal or Secret Quest</h3>
          <input id="adm-ach-title" class="tool-input" placeholder="Quest Title" />
          <input id="adm-ach-desc" class="tool-input" placeholder="Public Description" />
          <input id="adm-ach-hint" class="tool-input" placeholder="Founder-Only Secret Solution / How to Complete" />
          <div style="display:flex;gap:8px;"><input id="adm-ach-cred" type="number" class="tool-input" value="250" /><input id="adm-ach-xp" type="number" class="tool-input" value="300" /></div>
          <label class="remember-row"><input type="checkbox" id="adm-ach-sec" /><span>🔒 Hide conditions as a Secret Quest</span></label>
          <button class="btn-neon" id="adm-add-ach-btn" style="width:100%">Publish Quest</button>
        </div>
      </div>`;
    document.getElementById('adm-add-ach-btn').onclick = async () => {
      const title = document.getElementById('adm-ach-title').value.trim();
      if (!title) return window.notify('Enter quest title.', true);
      await window.sbRest('achievements_list', 'POST', { title, description: document.getElementById('adm-ach-desc').value.trim(), secret_hint: document.getElementById('adm-ach-hint').value.trim(), reward_credits: parseInt(document.getElementById('adm-ach-cred').value, 10) || 100, reward_xp: parseInt(document.getElementById('adm-ach-xp').value, 10) || 250, is_secret: document.getElementById('adm-ach-sec').checked }, window.authToken);
      window.notify('Quest published!');
      renderAdminAndBeta();
    };
  }
}

window.addEventListener('zynk-profile-updated', renderAdminAndBeta);
window.addEventListener('DOMContentLoaded', renderAdminAndBeta);
