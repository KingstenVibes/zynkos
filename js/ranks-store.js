window.RANKS = [
  { name: 'Circuit', cost: 0, mult: 1.0, discount: 0, color: '#94a3b8', perks: 'Base ZynkOS access' },
  { name: 'Cyber', cost: 500, mult: 1.15, discount: 0.05, color: '#06b6d4', perks: '+5% XP, 5% Store discount' },
  { name: 'Phantom', cost: 1500, mult: 1.3, discount: 0.10, color: '#a855f7', perks: '+10% XP, 10% Store discount' },
  { name: 'Sovereign', cost: 3500, mult: 1.5, discount: 0.15, color: '#f59e0b', perks: '+20% XP, 15% Store discount' },
  { name: 'Apex', cost: 7500, mult: 2.0, discount: 0.25, color: '#10b981', perks: '2.0x XP, 25% Store discount' }
];

window.ROLE_COLORS = {
  FOUNDER: '#f59e0b', 'HEAD DEV': '#ec4899', DEVELOPER: '#38bdf8',
  ADMIN: '#f43f5e', MODERATOR: '#06b6d4', BETA: '#a855f7',
  UPLOADER: '#10b981', DESIGNER: '#ec4899', VIP: '#eab308', SUPPORTER: '#38bdf8',
  OG: '#10b981', MEMBER: '#94a3b8'
};

window.ROLE_BADGE_SVGS = {
  FOUNDER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20v3H2v-3zm1-9l5 4 4-8 4 8 5-4-2 8H5l-2-8z"/></svg>`,
  'HEAD DEV': `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  DEVELOPER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  ADMIN: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  MODERATOR: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  BETA: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 3h6v5l4 9a2 2 0 0 1-1.8 2.8H6.8A2 2 0 0 1 5 17l4-9V3z"/></svg>`,
  UPLOADER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  DESIGNER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`,
  VIP: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  SUPPORTER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  OG: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`
};

window.renderRoleBadgeIcons = function(u) {
  if (!u) return '';
  const roles = [...new Set([(u.role || 'MEMBER').toUpperCase(), ...(Array.isArray(u.extra_roles) ? u.extra_roles.map(r => r.toUpperCase()) : [])])];
  return roles.filter(r => window.ROLE_BADGE_SVGS[r]).map(r => {
    const col = window.ROLE_COLORS[r] || '#10b981';
    return `<span class="role-badge-icon" title="${r}" style="color:${col};border:1px solid ${col}55;">${window.ROLE_BADGE_SVGS[r]}</span>`;
  }).join('');
};

window.renderRoleChips = function(u) {
  if (!u) return '';
  const all = [{ r: (u.role || 'MEMBER').toUpperCase(), bg: 'rgba(255,255,255,0.06)' }];
  const rankObj = window.RANKS[u.rank_index || 0];
  if (rankObj && rankObj.cost > 0) all.push({ r: rankObj.name.toUpperCase(), bg: 'rgba(16,185,129,0.12)' });
  (Array.isArray(u.extra_roles) ? u.extra_roles : []).forEach(er => {
    const up = er.toUpperCase();
    if (!all.some(x => x.r === up)) all.push({ r: up, bg: 'rgba(255,255,255,0.06)' });
  });
  return all.map(x => {
    const col = window.ROLE_COLORS[x.r] || '#10b981';
    const ic = window.ROLE_BADGE_SVGS[x.r] || `<span class="role-dot" style="background:${col}"></span>`;
    return `<span class="role-chip" style="background:${x.bg};color:${col};">${ic}<span>${x.r}</span></span>`;
  }).join('');
};

let activeShopFilter = 'ALL';
let activeShopSort = 'DEFAULT';
function syncHud() {
  const p = window.userProfile;
  if (!p) return;
  const rank = window.RANKS[p.rank_index || 0] || window.RANKS;
  document.getElementById('hud-username').textContent = p.username;
  document.getElementById('hud-username').style.color = p.equipped_color || '#f8fafc';
  document.getElementById('hud-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('hud-rank-pill').textContent = `Rank: ${rank.name}`;
  document.getElementById('hud-role-tag').innerHTML = window.renderRoleChips(p);
  document.getElementById('chat-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('store-credits').textContent = `${p.credits} Z-Credits`;

  const xp = p.xp || 0;
  const lvl = Math.floor(xp / 1000) + 1;
  document.getElementById('hud-lvl').textContent = `LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${xp % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${(xp % 1000) / 10}%`;

  const stPill = document.getElementById('dash-streak-pill');
  if (stPill) stPill.textContent = `${p.daily_streak || 0} DAY STREAK (+${(p.daily_streak || 0) * 5}% DAILY)`;

  const av = p.avatar && !p.avatar.includes('dicebear') ? p.avatar : 'logo.png';
  const hudAv = document.getElementById('hud-avatar-img');
  if (hudAv) {
    hudAv.src = av;
    hudAv.style.borderColor = p.equipped_color || '#10b981';
    hudAv.style.boxShadow = p.avatar_frame && p.avatar_frame !== 'none' ? `0 0 0 3px ${p.avatar_frame}, 0 0 18px ${p.avatar_frame}` : 'none';
  }
}

window.openGiftSearchModal = async function(item, finalCost) {
  const p = window.userProfile;
  if (!p) return window.notify('Sign in first!', true);
  if (p.credits < finalCost) return window.notify('Not enough Z-Credits to gift!', true);

  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const users = await window.sbRest('users?select=id,username,avatar,role,equipped_color,owned_items').catch(() => []);
  const others = (users || []).filter(u => String(u.id) !== String(p.id));

  box.style.maxWidth = '430px';
  box.innerHTML = `
    <div style="padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>Gift "${item.name}" (${finalCost} Z)</h3>
        <button class="btn-ghost" onclick="document.getElementById('user-modal').classList.add('hidden')">✕</button>
      </div>
      <input id="gift-search-inp" class="tool-input" placeholder="Search member username..." autocomplete="off" />
      <div id="gift-results-list" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
    </div>`;
  modal.classList.remove('hidden');

  const resList = document.getElementById('gift-results-list');
  const renderList = (q) => {
    const matches = others.filter(u => u.username.toLowerCase().includes(q.toLowerCase()));
    resList.innerHTML = matches.map(u => `
      <div class="ac-item" data-gift-uid="${u.id}" style="border-radius:8px;background:#04070b;">
        <strong style="color:${u.equipped_color || '#10b981'}">@${u.username}</strong>
        <button type="button" class="btn-neon" style="padding:4px 10px;font-size:0.78rem;">Send Gift</button>
      </div>`).join('') || '<p class="sub-text">No matching members found.</p>';

    resList.querySelectorAll('[data-gift-uid]').forEach(row => (row.onclick = async () => {
      const target = matches.find(x => String(x.id) === row.dataset.giftUid);
      if (!target) return;
      modal.classList.add('hidden');
      const nextOwned = [...new Set([...(target.owned_items || []), item.id])];
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - finalCost, items_bought: (p.items_bought || 0) + 1 }, window.authToken);
      await window.sbRest(`users?id=eq.${target.id}`, 'PATCH', { owned_items: nextOwned }, window.authToken);
      await window.refreshMyProfile();
      window.notify(`Gifted "${item.name}" to @${target.username}!`);
    }));
  };
  renderList('');
  document.getElementById('gift-search-inp').oninput = (e) => renderList(e.target.value);
};
function formatCdText(ms) {
  if (ms <= 0) return '';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

async function renderRanksAndStore() {
  syncHud();
  const p = window.userProfile;
  const rGrid = document.getElementById('ranks-grid');
  if (rGrid) {
    rGrid.className = 'cards-grid';
    rGrid.innerHTML = '';
    window.RANKS.forEach((r, idx) => {
      const owned = (p?.rank_index || 0) >= idx;
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.innerHTML = `<span class="rarity-tag" style="color:${r.color}">TIER ${idx + 1}</span><h3>${r.name}</h3><p class="sub-text" style="margin:6px 0 12px;">${r.perks}</p><button class="${owned ? 'btn-outline' : 'btn-neon'}" style="width:100%" ${owned ? 'disabled' : ''}>${owned ? 'Unlocked' : `Unlock (${r.cost} Z)`}</button>`;
      card.querySelector('button').onclick = async () => {
        if (!p) return window.notify('Sign in first!', true);
        if (p.credits < r.cost) return window.notify('Not enough Z-Credits!', true);
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - r.cost, rank_index: idx }, window.authToken);
        await window.refreshMyProfile();
        window.notify(`Rank upgraded to ${r.name}!`);
      };
      rGrid.appendChild(card);
    });
  }

  const sGrid = document.getElementById('store-grid');
  if (!sGrid || !window.sbRest) return;
  const dbItems = await window.sbRest('store_items?order=id.asc').catch(() => []);
  const curRank = window.RANKS[p?.rank_index || 0] || window.RANKS;

  const surgeRem = (7 * 86400000) - (Date.now() - (p?.last_surge || 0));
  const restoreRem = (2 * 86400000) - (Date.now() - (p?.last_restore || 0));

  const powerUps = [
    { id: 'pwr_2x', name: '2x XP & Z-Credits Booster (24h)', cost: 650, rarity: 'EPIC', desc: 'Doubles all XP and Z-Credits earned from chatting for 24 hours!', pwrKey: 'boost2x', cdRem: 0 },
    { id: 'pwr_pfp', name: 'Custom PFP Upload Pass', cost: 1000, rarity: 'LEGENDARY', desc: 'Unlocks uploading ANY custom image for your Profile Picture in My Profile!', pwrKey: 'customPfp', cdRem: 0 },
    { id: 'pwr_ban', name: 'Custom Banner Upload Pass', cost: 1250, rarity: 'MYTHIC', desc: 'Unlocks uploading ANY custom banner image on My Profile!', pwrKey: 'customBanner', cdRem: 0 },
    { id: 'pwr_surge', name: 'Streak +1 Power Surge (Weekly)', cost: 750, rarity: 'EPIC', desc: 'Adds +1 Day to your Daily Streak (+5% Daily Mystery Card bonus per day). Limit: 1 per 7 days.', pwrKey: 'streakUp', cdRem: surgeRem },
    { id: 'pwr_restore', name: 'Streak Restore Voucher (2d Cooldown)', cost: 900, rarity: 'EXOTIC', desc: 'Restores your highest saved Daily Streak if your streak ever resets to 0. Limit: 1 per 2 days.', pwrKey: 'streakRestore', cdRem: restoreRem }
  ];

  const cats = [
    { id: 'ALL', label: 'All Store Items' },
    { id: 'POWER', label: 'Power-Ups & Passes' },
    { id: 'DEALS', label: 'Daily Deals (10% Off)' },
    { id: 'avatar', label: 'Avatars' },
    { id: 'frame', label: 'Avatar Frames' },
    { id: 'banner', label: 'Banners & Themes' },
    { id: 'color', label: 'Colors & Badges' }
  ];

  sGrid.className = 'store-layout';
  sGrid.innerHTML = `
    <div class="glass-card" style="padding:14px;">
      <div class="mono-dim" style="margin-bottom:8px;font-weight:700;">CATEGORIES</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${cats.map(c => `<button class="${activeShopFilter === c.id ? 'btn-neon' : 'btn-outline'}" style="text-align:left;width:100%;" data-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="mono-dim" style="margin:14px 0 6px;font-weight:700;">SORT BY</div>
      <select id="shop-sort-sel" class="tool-input" style="margin-bottom:0;">
        <option value="DEFAULT">Featured Order</option>
        <option value="LOW">Price: Low to High</option>
        <option value="HIGH">Price: High to Low</option>
      </select>
    </div>
    <div id="shop-body-area"></div>`;

  sGrid.querySelectorAll('[data-cat]').forEach(b => (b.onclick = () => { activeShopFilter = b.dataset.cat; renderRanksAndStore(); }));
  const sortSel = document.getElementById('shop-sort-sel');
  sortSel.value = activeShopSort;
  sortSel.onchange = () => { activeShopSort = sortSel.value; renderRanksAndStore(); };
  const bodyArea = document.getElementById('shop-body-area');
  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'cards-grid';
  bodyArea.appendChild(cardsWrap);

  if (activeShopFilter === 'ALL' || activeShopFilter === 'POWER') {
    powerUps.forEach(pw => {
      const owned = (p?.owned_items || []).includes(pw.id);
      const isPerm = pw.pwrKey === 'customPfp' || pw.pwrKey === 'customBanner';
      const onCd = pw.cdRem > 0;
      const disabled = (owned && isPerm) || onCd;
      const btnText = (owned && isPerm) ? 'Unlocked' : onCd ? `Cooldown: ${formatCdText(pw.cdRem)}` : `Activate (${pw.cost} Z)`;
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.borderColor = 'rgba(6,182,212,0.35)';
      card.innerHTML = `<span class="rarity-tag rar-${pw.rarity}">POWER-UP • ${pw.rarity}</span><h3 style="margin:4px 0;">${pw.name}</h3><p class="sub-text" style="margin-bottom:12px;">${pw.desc}</p><button class="${disabled ? 'btn-outline' : 'btn-neon'}" style="width:100%" ${disabled ? 'disabled' : ''}>${btnText}</button>`;
      card.querySelector('button').onclick = async () => {
        if (!p || disabled) return;
        if (p.credits < pw.cost) return window.notify('Not enough Z-Credits!', true);
        const nextSt = (p.daily_streak || 0) + 1;
        const patch = { credits: p.credits - pw.cost, items_bought: (p.items_bought || 0) + 1, owned_items: [...new Set([...(p.owned_items || []), pw.id])] };
        if (pw.pwrKey === 'boost2x') patch.boost_until = Date.now() + 86400000;
        if (pw.pwrKey === 'streakUp') {
          patch.daily_streak = nextSt;
          patch.saved_streak = Math.max(p.saved_streak || 0, nextSt);
          patch.last_surge = Date.now();
        }
        if (pw.pwrKey === 'streakRestore') {
          const restored = Math.max(p.daily_streak || 0, p.saved_streak || 1);
          patch.daily_streak = restored;
          patch.last_restore = Date.now();
        }
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', patch, window.authToken);
        await window.refreshMyProfile();
        window.notify(`Activated: ${pw.name}!`);
      };
      cardsWrap.appendChild(card);
    });
  }

  let filtered = activeShopFilter === 'POWER' ? [] : (dbItems || []).slice();
  if (activeShopFilter === 'DEALS') filtered = filtered.filter(i => i.is_daily_deal);
  else if (activeShopFilter === 'banner') filtered = filtered.filter(i => i.item_type === 'banner' || i.item_type === 'theme');
  else if (activeShopFilter === 'color') filtered = filtered.filter(i => i.item_type === 'color' || i.item_type === 'badge');
  else if (activeShopFilter !== 'ALL') filtered = filtered.filter(i => i.item_type === activeShopFilter);

  if (activeShopSort === 'LOW') filtered.sort((a, b) => a.cost - b.cost);
  if (activeShopSort === 'HIGH') filtered.sort((a, b) => b.cost - a.cost);

  filtered.forEach(it => {
    const owned = (p?.owned_items || []).includes(it.id);
    const dealMult = it.is_daily_deal ? 0.9 : 1;
    const finalCost = Math.max(10, Math.round(it.cost * dealMult * (1 - curRank.discount)));
    const imgSrc = it.image_url || (String(it.item_value || '').startsWith('data:image') || String(it.item_value || '').startsWith('http') ? it.item_value : '');
    const vis = imgSrc ? `<div style="height:125px;border-radius:10px;overflow:hidden;margin-bottom:8px;background:#04070b;"><img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>` : `<div style="height:125px;border-radius:10px;margin-bottom:8px;background:#04070b;display:flex;align-items:center;justify-content:center;"><span class="pill" style="border-color:${it.item_value || '#10b981'}">${it.name}</span></div>`;
    const rar = (it.rarity || 'COMMON').toUpperCase();

    const card = document.createElement('div');
    card.className = 'glass-card';
    card.innerHTML = `${vis}<div style="display:flex;justify-content:space-between;"><span class="rarity-tag rar-${rar}">${rar}</span><span class="mono-dim">${it.item_type.toUpperCase()}</span></div><h3 style="margin:2px 0;">${it.name}</h3><div class="sub-text" style="margin-bottom:10px;">${finalCost} Z-Credits</div><div style="display:flex;gap:6px;"><button class="${owned ? 'btn-outline' : 'btn-neon'}" data-buy="1" style="flex:1">${owned ? 'Equip' : 'Buy'}</button><button class="btn-outline" data-gift="1">Gift</button></div>`;

    card.querySelector('[data-buy]').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      if (!owned && p.credits < finalCost) return window.notify('Not enough Z-Credits!', true);
      const nextOwned = owned ? (p.owned_items || []) : [...(p.owned_items || []), it.id];
      const up = { credits: owned ? p.credits : p.credits - finalCost, owned_items: nextOwned, items_bought: owned ? (p.items_bought || 0) : (p.items_bought || 0) + 1 };
      if (it.item_type === 'avatar') up.avatar = imgSrc || 'logo.png';
      if (it.item_type === 'frame') up.avatar_frame = it.item_value;
      if (it.item_type === 'banner') up.banner = imgSrc;
      if (it.item_type === 'theme') { up.profile_theme = it.item_value; localStorage.setItem('zynk_theme', it.item_value); }
      if (it.item_type === 'color') up.equipped_color = it.item_value;
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', up, window.authToken);
      await window.refreshMyProfile();
      window.notify(owned ? `Equipped ${it.name}!` : `Purchased & equipped ${it.name}!`);
    };
    card.querySelector('[data-gift]').onclick = () => window.openGiftSearchModal(it, finalCost);
    cardsWrap.appendChild(card);
  });
}

window.addEventListener('zynk-profile-updated', renderRanksAndStore);
window.addEventListener('DOMContentLoaded', renderRanksAndStore);

