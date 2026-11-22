let uploadedImg = '';

async function renderAdminAndBeta() {
  const p = window.userProfile;
  const adminBox = document.getElementById('admin-panel-container');
  const betaGrid = document.getElementById('beta-grid');

  if (betaGrid) {
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
      if (!p) return;
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 250 }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Beta +250 Z-Credits added!');
    };
    document.getElementById('beta-compact-btn').onclick = () => {
      document.body.style.zoom = document.body.style.zoom === '0.92' ? '1' : '0.92';
      window.notify('Toggled Compact HUD scale.');
    };
    document.getElementById('beta-xp-btn').onclick = async () => {
      if (!p) return;
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { xp: (p.xp || 0) + 150 }, window.authToken);
      await window.refreshMyProfile();
      window.notify('+150 Neural Sync XP granted!');
    };
  }

  if (!adminBox || !p || p.role !== 'FOUNDER') return;
  const storeItems = await window.sbRest('store_items?order=id.asc').catch(() => []);
  const requests = await window.sbRest('shop_requests?order=id.desc').catch(() => []);

  adminBox.innerHTML = `
    <div class="bento-grid">
      <div class="glass-card">
        <h3>🖼 Founder Shop & Theme Upload Studio</h3>
        <input id="adm-item-name" class="tool-input" placeholder="Item Name (e.g. Neon Dragon Frame)" />
        <label class="sub-text">Upload Image File (Avatars / Banners / Frame Previews):</label>
        <input id="adm-item-file" type="file" accept="image/*" class="tool-input" />
        <input id="adm-item-img" class="tool-input" placeholder="Or paste image URL..." />
        <div style="display:flex;gap:8px;">
          <select id="adm-item-type" class="tool-input"><option value="avatar">Avatar</option><option value="frame">Avatar Frame</option><option value="banner">Profile Banner</option><option value="theme">Steady Page Theme</option><option value="color">Name Color</option><option value="badge">Badge</option></select>
          <select id="adm-item-rarity" class="tool-input"><option value="COMMON">COMMON</option><option value="RARE">RARE</option><option value="EPIC">EPIC</option><option value="LEGENDARY">LEGENDARY</option></select>
        </div>
        <input id="adm-item-val" class="tool-input" placeholder="Frame/Color Hex (#06b6d4) or Theme (theme-cyber / theme-crimson / theme-gold / theme-violet)" />
        <div style="display:flex;gap:8px;">
          <input id="adm-item-cost" type="number" class="tool-input" value="150" placeholder="Z-Credits Cost" />
          <select id="adm-item-rank" class="tool-input"><option value="0">Circuit+</option><option value="1">Pulse+</option><option value="2">Nova+</option><option value="3">Titan+</option><option value="4">Apex</option></select>
        </div>
        <label class="remember-row"><input type="checkbox" id="adm-item-deal" /><span>🔥 Feature as Daily Deal (10% Off)</span></label>
        <button class="btn-neon" id="adm-add-item-btn" style="width:100%">Publish to Zynk Store</button>
      </div>

      <div class="glass-card">
        <h3>⚡ Roles, Paid Ranks & Quests</h3>
        <input id="adm-target-user" class="tool-input" placeholder="Exact Username" />
        <div style="display:flex;gap:8px;">
          <select id="adm-target-role" class="tool-input"><option value="MEMBER">MEMBER</option><option value="BETA">BETA</option><option value="MODERATOR">MODERATOR</option><option value="FOUNDER">FOUNDER</option></select>
          <select id="adm-target-rank" class="tool-input"><option value="">Keep Current Rank</option><option value="1">Grant Pulse</option><option value="2">Grant Nova ($4.99)</option><option value="3">Grant Titan ($9.99)</option><option value="4">Grant Apex ($19.99)</option></select>
        </div>
        <button class="btn-outline" id="adm-grant-btn" style="width:100%;margin-bottom:14px;">Update User Role / Rank</button>
        <hr style="border-color:rgba(255,255,255,0.08);margin:12px 0;" />
        <h4>Create Global Quest</h4>
        <input id="adm-ach-title" class="tool-input" placeholder="Quest Title" />
        <input id="adm-ach-desc" class="tool-input" placeholder="Quest Requirement" />
        <div style="display:flex;gap:8px;"><input id="adm-ach-cred" type="number" class="tool-input" value="100" /><input id="adm-ach-xp" type="number" class="tool-input" value="250" /></div>
        <button class="btn-neon" id="adm-add-ach-btn" style="width:100%">Publish Quest</button>
      </div>
    </div>

    <div class="bento-grid" style="margin-top:16px;">
      <div class="glass-card">
        <h3>🔥 Manage Daily Deals (10% Off Toggle)</h3>
        ${(storeItems || []).map(it => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span><strong>${it.name}</strong> (${it.item_type})</span><button class="${it.is_daily_deal ? 'btn-neon' : 'btn-outline'}" data-deal-id="${it.id}" data-deal-on="${it.is_daily_deal ? '1' : '0'}">${it.is_daily_deal ? '🔥 10% OFF ON' : 'Set Daily Deal'}</button></div>`).join('') || '<p class="sub-text">No store items yet.</p>'}
      </div>
      <div class="glass-card">
        <h3>💡 User Shop Requests (${(requests || []).length})</h3>
        ${(requests || []).map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><div><strong>${r.item_name}</strong> <span class="mono-dim">[${r.category}] by @${r.username}</span><div class="sub-text">${r.notes || ''}</div></div><button class="btn-ghost" data-del-req="${r.id}">✕</button></div>`).join('') || '<p class="sub-text">No shop requests yet.</p>'}
      </div>
    </div>`;

  document.getElementById('adm-item-file').onchange = (e) => {
    const f = e.target.files?.at(0);
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { uploadedImg = r.result; window.notify('Image loaded & ready to publish!'); };
    r.readAsDataURL(f);
  };

  document.getElementById('adm-add-item-btn').onclick = async () => {
    const name = document.getElementById('adm-item-name').value.trim();
    const img = uploadedImg || document.getElementById('adm-item-img').value.trim();
    if (!name) return window.notify('Enter an item name.', true);
    await window.sbRest('store_items', 'POST', { name, image_url: img, item_type: document.getElementById('adm-item-type').value, rarity: document.getElementById('adm-item-rarity').value, item_value: document.getElementById('adm-item-val').value.trim() || img || '#10b981', cost: parseInt(document.getElementById('adm-item-cost').value, 10) || 100, req_rank: parseInt(document.getElementById('adm-item-rank').value, 10) || 0, is_daily_deal: document.getElementById('adm-item-deal').checked }, window.authToken);
    uploadedImg = '';
    window.notify('Published to Zynk Store!');
    window.dispatchEvent(new Event('zynk-profile-updated'));
  };

  document.getElementById('adm-grant-btn').onclick = async () => {
    const target = document.getElementById('adm-target-user').value.trim();
    const role = document.getElementById('adm-target-role').value;
    const rankVal = document.getElementById('adm-target-rank').value;
    if (!target) return window.notify('Enter a username.', true);
    const patch = { role, is_beta: role === 'BETA' || role === 'FOUNDER' };
    if (rankVal !== '') patch.rank_index = parseInt(rankVal, 10);
    await window.sbRest(`users?username=ilike.${encodeURIComponent(target)}`, 'PATCH', patch, window.authToken);
    window.notify(`Updated ${target} (${role})!`);
  };

  document.getElementById('adm-add-ach-btn').onclick = async () => {
    const title = document.getElementById('adm-ach-title').value.trim();
    if (!title) return window.notify('Enter a quest title.', true);
    await window.sbRest('achievements_list', 'POST', { title, description: document.getElementById('adm-ach-desc').value.trim(), reward_credits: parseInt(document.getElementById('adm-ach-cred').value, 10) || 100, reward_xp: parseInt(document.getElementById('adm-ach-xp').value, 10) || 250 }, window.authToken);
    window.notify('Global Quest published!');
    window.dispatchEvent(new Event('zynk-profile-updated'));
  };

  adminBox.querySelectorAll('[data-deal-id]').forEach(b => (b.onclick = async () => {
    await window.sbRest(`store_items?id=eq.${b.dataset.dealId}`, 'PATCH', { is_daily_deal: b.dataset.dealOn !== '1' }, window.authToken);
    window.notify('Updated Daily Deal status!');
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }));

  adminBox.querySelectorAll('[data-del-req]').forEach(b => (b.onclick = async () => {
    await window.sbRest(`shop_requests?id=eq.${b.dataset.delReq}`, 'DELETE', null, window.authToken);
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }));
}

window.addEventListener('zynk-profile-updated', renderAdminAndBeta);
window.addEventListener('DOMContentLoaded', renderAdminAndBeta);
