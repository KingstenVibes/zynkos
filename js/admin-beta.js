let uploadedImg = '';
let activeFounderTab = 'ANNOUNCE';
let selectedMember = null;

function compressImageFile(file, maxDim = 320) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function renderAdminAndBeta() {
  const p = window.userProfile;
  const adminBox = document.getElementById('admin-panel-container');
  const betaGrid = document.getElementById('beta-grid');
  const isFounder = p && p.role === 'FOUNDER';
  const isBeta = p && (p.role === 'FOUNDER' || p.role === 'BETA' || p.is_beta || (p.extra_roles || []).includes('BETA'));

  if (betaGrid && isBeta) {
    const betaClaimed = Array.isArray(p?.claimed) && p.claimed.includes('beta_stipend_v2');
    betaGrid.innerHTML = `
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 1</span><h3>Live Page Theme Switcher</h3><p class="sub-text">Test steady page color themes before public release.</p><div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn-outline" data-th="default">Emerald</button><button class="btn-outline" data-th="theme-cyber">Cyber Cyan</button><button class="btn-outline" data-th="theme-crimson">Crimson</button><button class="btn-outline" data-th="theme-gold">Gold</button><button class="btn-outline" data-th="theme-violet">Violet</button></div></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 2</span><h3>Beta Tester Stipend</h3><p class="sub-text">One-time +250 Z-Credits reward for testing ZynkOS builds.</p><button class="${betaClaimed ? 'btn-outline' : 'btn-neon'}" id="beta-bonus-btn" ${betaClaimed ? 'disabled' : ''}>${betaClaimed ? '✓ Claimed' : 'Claim +250 Z-Credits'}</button></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 3</span><h3>Compact HUD Mode</h3><p class="sub-text">Toggle high-density spacing across ZynkOS panels.</p><button class="btn-outline" id="beta-compact-btn">Toggle Compact HUD</button></div>
      <div class="glass-card"><span class="rarity-tag" style="color:#06b6d4">BETA FEATURE 4</span><h3>Neural XP Overdrive</h3><p class="sub-text">Preview live XP bar scaling and level progression.</p><button class="btn-outline" id="beta-xp-btn">Toggle XP Bar Preview</button></div>`;

    betaGrid.querySelectorAll('[data-th]').forEach(b => (b.onclick = async () => {
      localStorage.setItem('zynk_theme', b.dataset.th);
      document.body.className = b.dataset.th === 'default' ? '' : b.dataset.th;
      if (p) await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { profile_theme: b.dataset.th }, window.authToken);
      window.notify(`Applied theme: ${b.textContent}`);
    }));

    const bBtn = document.getElementById('beta-bonus-btn');
    bBtn.onclick = async () => {
      if (betaClaimed || bBtn.disabled) return;
      bBtn.disabled = true;
      bBtn.textContent = 'Claiming...';
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits + 250, claimed: [...new Set([...(p.claimed || []), 'beta_stipend_v2'])] }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Beta +250 Z-Credits claimed!');
    };

    document.getElementById('beta-compact-btn').onclick = () => {
      document.body.style.zoom = document.body.style.zoom === '0.92' ? '1' : '0.92';
      window.notify('Toggled Compact HUD scale.');
    };

    document.getElementById('beta-xp-btn').onclick = () => {
      const bar = document.getElementById('hud-xp-bar');
      if (bar) bar.style.width = bar.style.width === '100%' ? '25%' : '100%';
      window.notify('Previewed Neural XP bar animation!');
    };
  }

  if (!adminBox || !isFounder) return;

  const fTabs = [
    { id: 'ANNOUNCE', label: '📢 Broadcasts' },
    { id: 'SHOP', label: '🖼 Shop & Deals' },
    { id: 'PARTNERS', label: '🤝 Partners & Credits' },
    { id: 'ROLES', label: '⚡ Members & Roles' },
    { id: 'SECRETS', label: '🔒 Quests & Secrets' }
  ];

  adminBox.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      ${fTabs.map(t => `<button class="${activeFounderTab === t.id ? 'btn-neon' : 'btn-outline'}" data-ftab="${t.id}">${t.label}</button>`).join('')}
    </div>
    <div id="founder-subview"></div>`;

  adminBox.querySelectorAll('[data-ftab]').forEach(b => (b.onclick = () => { activeFounderTab = b.dataset.ftab; renderAdminAndBeta(); }));
  const sub = document.getElementById('founder-subview');

  if (activeFounderTab === 'ANNOUNCE') {
    const anns = await window.sbRest('announcements?order=id.desc&limit=25').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>📢 Broadcast System Announcement</h3>
          <select id="ann-icon" class="tool-input" style="margin-top:8px;"><option value="📢">📢 Megaphone</option><option value="🚀">🚀 Launch / Update</option><option value="🔥">🔥 Hot / Event</option><option value="🎁">🎁 Giveaway / Reward</option><option value="⚡">⚡ System Alert</option><option value="🛠️">🛠️ Maintenance / Fix</option><option value="👑">👑 Founder Note</option></select>
          <input id="ann-title" class="tool-input" placeholder="Announcement Title" />
          <textarea id="ann-body" class="tool-input" rows="4" placeholder="Write your announcement message..."></textarea>
          <button id="ann-post-btn" class="btn-neon" style="width:100%">Publish to Home Feed</button>
        </div>
        <div class="glass-card">
          <h3>Past Broadcasts (${(anns || []).length})</h3>
          <div style="max-height:310px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            ${(anns || []).map(a => `<div id="ann-row-${a.id}" style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(4,7,11,0.7);border-radius:8px;"><div><strong>${a.icon} ${a.title}</strong><div class="sub-text">${a.body}</div></div><button class="btn-ghost" data-del-ann="${a.id}">✕</button></div>`).join('') || '<p class="sub-text">No broadcasts yet.</p>'}
          </div>
        </div>
      </div>`;
    document.getElementById('ann-post-btn').onclick = async () => {
      const title = document.getElementById('ann-title').value.trim();
      const body = document.getElementById('ann-body').value.trim();
      if (!title || !body) return window.notify('Enter both title and message.', true);
      await window.sbRest('announcements', 'POST', { icon: document.getElementById('ann-icon').value, title, body, author: p.username }, window.authToken);
      window.notify('Announcement published!');
      renderAdminAndBeta();
    };
    sub.querySelectorAll('[data-del-ann]').forEach(b => (b.onclick = async () => {
      const id = b.dataset.delAnn;
      document.getElementById(`ann-row-${id}`)?.remove();
      await window.sbRest(`announcements?id=eq.${id}`, 'DELETE', null, window.authToken);
    }));
  }
  if (activeFounderTab === 'SHOP') {
    const storeItems = await window.sbRest('store_items?order=id.asc').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🖼 Upload Store Item / Theme</h3>
          <input id="adm-item-name" class="tool-input" style="margin-top:8px;" placeholder="Item Name" />
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
          <h3>🗑 Manage Store Items & Daily Deals (${(storeItems || []).length})</h3>
          <div style="max-height:320px;overflow-y:auto;margin-top:8px;">
            ${(storeItems || []).map(it => `<div id="st-row-${it.id}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span>${it.name} <span class="mono-dim">(${it.item_type})</span></span><div style="display:flex;gap:6px;"><button class="${it.is_daily_deal ? 'btn-neon' : 'btn-outline'}" style="padding:4px 8px;font-size:0.75rem;" data-deal-id="${it.id}" data-deal-on="${it.is_daily_deal ? '1' : '0'}">${it.is_daily_deal ? '10% OFF' : 'Deal'}</button><button class="btn-outline" style="padding:4px 8px;font-size:0.75rem;color:#f43f5e;border-color:#f43f5e;" data-del-item="${it.id}">Delete</button></div></div>`).join('') || '<p class="sub-text">No store items yet.</p>'}
          </div>
        </div>
      </div>`;

    document.getElementById('adm-item-file').onchange = async (e) => {
      const f = e.target.files?.at(0);
      if (!f) return;
      uploadedImg = await compressImageFile(f, 340);
      window.notify('Image compressed & ready to publish!');
    };

    document.getElementById('adm-add-item-btn').onclick = async () => {
      const name = document.getElementById('adm-item-name').value.trim();
      const img = uploadedImg || document.getElementById('adm-item-img').value.trim();
      const rawVal = document.getElementById('adm-item-val').value.trim();
      if (!name) return window.notify('Enter item name.', true);
      await window.sbRest('store_items', 'POST', { name, image_url: img, item_type: document.getElementById('adm-item-type').value, rarity: document.getElementById('adm-item-rarity').value, item_value: rawVal || img || '#10b981', cost: parseInt(document.getElementById('adm-item-cost').value, 10) || 100, is_daily_deal: document.getElementById('adm-item-deal').checked }, window.authToken);
      uploadedImg = '';
      window.notify('Published to Store!');
      renderAdminAndBeta();
    };

    sub.querySelectorAll('[data-deal-id]').forEach(b => (b.onclick = async () => {
      await window.sbRest(`store_items?id=eq.${b.dataset.dealId}`, 'PATCH', { is_daily_deal: b.dataset.dealOn !== '1' }, window.authToken);
      renderAdminAndBeta();
    }));

    sub.querySelectorAll('[data-del-item]').forEach(b => (b.onclick = async () => {
      const id = b.dataset.delItem;
      document.getElementById(`st-row-${id}`)?.remove();
      await window.sbRest(`store_items?id=eq.${id}`, 'DELETE', null, window.authToken);
      window.notify('Deleted item from Store!');
    }));
  }

  if (activeFounderTab === 'PARTNERS') {
    const partners = await window.sbRest('zynk_partners?order=id.asc').catch(() => []);
    const credits = await window.sbRest('zynk_credits?order=id.asc').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🤝 Add Partner</h3>
          <input id="pt-name" class="tool-input" style="margin-top:8px;" placeholder="Partner Name (e.g. VortexOS)" />
          <input id="pt-tag" class="tool-input" value="PARTNER" placeholder="Tag (e.g. PARTNER NETWORK)" />
          <input id="pt-url" class="tool-input" placeholder="Website URL (https://...)" />
          <input id="pt-desc" class="tool-input" placeholder="Short description..." />
          <button class="btn-neon" id="add-pt-btn" style="width:100%">Add Partner</button>
          <div style="margin-top:12px;">
            ${(partners || []).map(x => `<div id="pt-row-${x.id}" style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span>${x.name}</span><button class="btn-ghost" data-del-pt="${x.id}">✕</button></div>`).join('')}
          </div>
        </div>
        <div class="glass-card">
          <h3>◈ Add Team / Credits Member</h3>
          <input id="cr-name" class="tool-input" style="margin-top:8px;" placeholder="Member Name" />
          <input id="cr-role" class="tool-input" placeholder="Role (e.g. Lead Designer, Beta Tester)" />
          <input id="cr-desc" class="tool-input" placeholder="What they contributed..." />
          <input id="cr-uid" class="tool-input" placeholder="Optional User ID (for View Profile button)" />
          <input id="cr-file" type="file" accept="image/*" class="tool-input" />
          <button class="btn-neon" id="add-cr-btn" style="width:100%">Add to Credits Page</button>
          <div style="margin-top:12px;">
            ${(credits || []).map(x => `<div id="cr-row-${x.id}" style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><span>${x.name} (${x.role_label})</span><button class="btn-ghost" data-del-cr="${x.id}">✕</button></div>`).join('')}
          </div>
        </div>
      </div>`;

    let crImg = 'logo.png';
    document.getElementById('cr-file').onchange = async (e) => {
      const f = e.target.files?.at(0);
      if (f) crImg = await compressImageFile(f, 200);
    };

    document.getElementById('add-pt-btn').onclick = async () => {
      const name = document.getElementById('pt-name').value.trim();
      if (!name) return window.notify('Enter partner name.', true);
      await window.sbRest('zynk_partners', 'POST', { name, tag: document.getElementById('pt-tag').value.trim(), url: document.getElementById('pt-url').value.trim(), description: document.getElementById('pt-desc').value.trim() }, window.authToken);
      window.notify('Partner added!');
      renderAdminAndBeta();
    };

    document.getElementById('add-cr-btn').onclick = async () => {
      const name = document.getElementById('cr-name').value.trim();
      if (!name) return window.notify('Enter member name.', true);
      await window.sbRest('zynk_credits', 'POST', { name, role_label: document.getElementById('cr-role').value.trim() || 'Contributor', description: document.getElementById('cr-desc').value.trim(), user_uid: document.getElementById('cr-uid').value.trim(), image_url: crImg }, window.authToken);
      window.notify('Added to Credits page!');
      renderAdminAndBeta();
    };

    sub.querySelectorAll('[data-del-pt]').forEach(b => (b.onclick = async () => {
      const id = b.dataset.delPt;
      document.getElementById(`pt-row-${id}`)?.remove();
      await window.sbRest(`zynk_partners?id=eq.${id}`, 'DELETE', null, window.authToken);
    }));

    sub.querySelectorAll('[data-del-cr]').forEach(b => (b.onclick = async () => {
      const id = b.dataset.delCr;
      document.getElementById(`cr-row-${id}`)?.remove();
      await window.sbRest(`zynk_credits?id=eq.${id}`, 'DELETE', null, window.authToken);
    }));
  }
  if (activeFounderTab === 'ROLES') {
    const allMembers = await window.sbRest('users?order=username.asc&limit=200').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🔍 Find & Select Member</h3>
          <input id="adm-search-user" class="tool-input" style="margin-top:8px;" placeholder="Type letters of username to filter..." autocomplete="off" />
          <div id="adm-user-results" style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
        </div>
        <div class="glass-card" id="adm-user-editor">
          <h3>⚡ Edit Selected Member</h3>
          <p class="sub-text">Click a member on the left to activate their Roles, Ranks, and Z-Credits.</p>
        </div>
      </div>`;

    const resList = document.getElementById('adm-user-results');
    const editor = document.getElementById('adm-user-editor');

    const activateMember = (u) => {
      selectedMember = u;
      editor.innerHTML = `
        <h3>⚡ Editing: <span style="color:#10b981">@${u.username}</span></h3>
        <p class="mono-dim" style="margin-bottom:10px;">Current Balance: ${u.credits} Z-Credits • Role: [${u.role}]</p>
        <label class="sub-text">Primary Role:</label>
        <select id="ed-role" class="tool-input"><option value="MEMBER">MEMBER</option><option value="SUPPORTER">SUPPORTER</option><option value="VIP">VIP</option><option value="UPLOADER">UPLOADER</option><option value="DESIGNER">DESIGNER</option><option value="BETA">BETA TESTER</option><option value="MODERATOR">MODERATOR</option><option value="ADMIN">ADMIN</option><option value="FOUNDER">FOUNDER</option></select>
        <label class="sub-text">Extra Badge Roles (Ctrl+Click for multiple):</label>
        <select id="ed-extras" multiple class="tool-input" style="height:95px;"><option value="SUPPORTER">SUPPORTER</option><option value="VIP">VIP</option><option value="UPLOADER">UPLOADER</option><option value="DESIGNER">DESIGNER</option><option value="OG">OG MEMBER</option><option value="BETA">BETA</option></select>
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="ed-cred-amt" type="number" class="tool-input" style="margin:0;flex:1;" value="500" placeholder="Z-Credits amount" />
          <button type="button" class="btn-outline" id="ed-add-cred">+ Add Credits</button>
          <button type="button" class="btn-outline" id="ed-set-cred">Set Exact</button>
        </div>
        <button type="button" class="btn-neon" id="ed-save-all" style="width:100%;margin-top:12px;">Save Member Roles</button>`;

      document.getElementById('ed-role').value = u.role || 'MEMBER';
      Array.from(document.getElementById('ed-extras').options).forEach(opt => {
        opt.selected = (u.extra_roles || []).includes(opt.value);
      });

      document.getElementById('ed-add-cred').onclick = async () => {
        const add = parseInt(document.getElementById('ed-cred-amt').value, 10) || 0;
        const next = (u.credits || 0) + add;
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: next }, window.authToken);
        u.credits = next;
        window.notify(`Added +${add} Z-Credits to @${u.username} (Now: ${next})`);
        if (u.id === p.id) await window.refreshMyProfile();
        activateMember(u);
      };

      document.getElementById('ed-set-cred').onclick = async () => {
        const exact = Math.max(0, parseInt(document.getElementById('ed-cred-amt').value, 10) || 0);
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { credits: exact }, window.authToken);
        u.credits = exact;
        window.notify(`Set @${u.username} balance to ${exact} Z-Credits`);
        if (u.id === p.id) await window.refreshMyProfile();
        activateMember(u);
      };

      document.getElementById('ed-save-all').onclick = async () => {
        const role = document.getElementById('ed-role').value;
        const extras = Array.from(document.getElementById('ed-extras').selectedOptions).map(o => o.value);
        const is_beta = role === 'BETA' || role === 'FOUNDER' || extras.includes('BETA');
        await window.sbRest(`users?id=eq.${u.id}`, 'PATCH', { role, extra_roles: extras, is_beta }, window.authToken);
        Object.assign(u, { role, extra_roles: extras, is_beta });
        window.notify(`Saved roles for @${u.username}!`);
        if (u.id === p.id) await window.refreshMyProfile();
      };
    };

    const renderMatches = (q) => {
      const list = (allMembers || []).filter(m => m.username.toLowerCase().includes(q.toLowerCase()));
      resList.innerHTML = list.map(m => `<div class="ac-item" data-pick="${m.id}" style="border-radius:8px;background:rgba(4,7,11,0.7);"><span><strong>@${m.username}</strong> <span class="mono-dim">[${m.role}]</span></span><span class="pill">${m.credits} Z</span></div>`).join('') || '<p class="sub-text">No matching members.</p>';
      resList.querySelectorAll('[data-pick]').forEach(el => (el.onclick = () => {
        const found = list.find(x => String(x.id) === el.dataset.pick);
        if (found) activateMember(found);
      }));
    };

    renderMatches('');
    document.getElementById('adm-search-user').oninput = (e) => renderMatches(e.target.value);
    if (selectedMember) activateMember(selectedMember);
  }

  if (activeFounderTab === 'SECRETS') {
    const customQuests = await window.sbRest('achievements_list?order=id.desc').catch(() => []);
    sub.innerHTML = `
      <div class="bento-grid" style="padding:0;">
        <div class="glass-card">
          <h3>🔒 Founder-Only Secret Quest Solution Key</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:290px;overflow-y:auto;margin-top:8px;">
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>🌙 Midnight Operator (+650 Z):</strong> Open Quests between 12:00 AM and 3:59 AM local time.</div>
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>💠 Cyan Overclock (+450 Z):</strong> Equip the <code>Cyber Cyan</code> steady page theme.</div>
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>⏱ Military Precision (+400 Z):</strong> Switch Clock Format to <code>24-Hour (Military)</code> in Settings.</div>
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>🕵️ Ghost Protocol (+500 Z):</strong> Enable any Tab Disguise in Settings.</div>
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>🔮 Void Resonance (+500 Z):</strong> Equip the <code>Violet Pulse</code> steady page theme.</div>
            <div style="padding:8px;background:#04070b;border-radius:8px;"><strong>🔬 Micro Vision (+350 Z):</strong> Set UI Interface Scale to <code>90% (Compact)</code> in Settings.</div>
            ${(customQuests || []).map(s => `<div style="padding:8px;background:#04070b;border-radius:8px;display:flex;justify-content:space-between;align-items:center;"><div><strong>${s.is_secret ? '🔒 ' : '📋 '}${s.title} (+${s.reward_credits} Z):</strong> ${s.secret_hint || s.description}</div><button class="btn-ghost" data-del-q="${s.id}">✕</button></div>`).join('')}
          </div>
        </div>
        <div class="glass-card">
          <h3>➕ Create Normal or Secret Quest</h3>
          <input id="adm-ach-title" class="tool-input" style="margin-top:8px;" placeholder="Quest Title" />
          <input id="adm-ach-desc" class="tool-input" placeholder="Public Description (hidden if Secret Quest is checked)" />
          <input id="adm-ach-hint" class="tool-input" placeholder="Founder-Only Secret Solution / How to Complete" />
          <div style="display:flex;gap:8px;"><input id="adm-ach-cred" type="number" class="tool-input" value="250" placeholder="Z-Credits" /><input id="adm-ach-xp" type="number" class="tool-input" value="300" placeholder="XP" /></div>
          <label class="remember-row"><input type="checkbox" id="adm-ach-sec" /><span>🔒 Publish as Secret Quest</span></label>
          <button class="btn-neon" id="adm-add-ach-btn" style="width:100%">Publish Quest</button>
        </div>
      </div>`;
    document.getElementById('adm-add-ach-btn').onclick = async () => {
      const title = document.getElementById('adm-ach-title').value.trim();
      if (!title) return window.notify('Enter quest title.', true);
      await window.sbRest('achievements_list', 'POST', { title, description: document.getElementById('adm-ach-desc').value.trim() || 'Complete this ZynkOS challenge.', secret_hint: document.getElementById('adm-ach-hint').value.trim(), reward_credits: parseInt(document.getElementById('adm-ach-cred').value, 10) || 100, reward_xp: parseInt(document.getElementById('adm-ach-xp').value, 10) || 250, is_secret: document.getElementById('adm-ach-sec').checked }, window.authToken);
      window.notify('Quest published!');
      renderAdminAndBeta();
    };
    sub.querySelectorAll('[data-del-q]').forEach(b => (b.onclick = async () => {
      await window.sbRest(`achievements_list?id=eq.${b.dataset.delQ}`, 'DELETE', null, window.authToken);
      renderAdminAndBeta();
    }));
  }
}

window.addEventListener('zynk-profile-updated', renderAdminAndBeta);
window.addEventListener('DOMContentLoaded', renderAdminAndBeta);
