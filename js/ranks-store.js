window.RANKS = [
  { name: 'Circuit', cost: 0, priceLabel: 'FREE', monthly: 100, discount: 0, color: '#94a3b8', perks: 'Base ZynkOS Access' },
  { name: 'Pulse', cost: 250, priceLabel: 'Coming Soon', monthly: 250, discount: 0.05, color: '#10b981', perks: 'Coming Soon' },
  { name: 'Nova', cost: -1, priceLabel: 'Coming Soon', monthly: 600, discount: 0.10, color: '#06b6d4', perks: 'Coming Soon' },
  { name: 'Titan', cost: -1, priceLabel: 'Coming Soon', monthly: 1200, discount: 0.15, color: '#a855f7', perks: 'Coming Soon' },
  { name: 'Apex', cost: -1, priceLabel: 'Coming Soon', monthly: 2500, discount: 0.20, color: '#f59e0b', perks: 'Coming Soon' }
];

window.ROLE_COLORS = {
  FOUNDER: '#f59e0b', ADMIN: '#f43f5e', MODERATOR: '#06b6d4', BETA: '#a855f7',
  UPLOADER: '#10b981', DESIGNER: '#ec4899', VIP: '#eab308', SUPPORTER: '#38bdf8',
  OG: '#f97316', MEMBER: '#94a3b8'
};

window.renderRoleChips = function(u) {
  if (!u) return '<span class="role-chip"><span class="role-dot" style="background:#94a3b8"></span>GUEST</span>';
  const rank = window.RANKS.at(u.rank_index || 0);
  const all = [u.role, ...(rank && rank.name !== 'Circuit' ? [rank.name.toUpperCase()] : []), ...(u.extra_roles || [])];
  return [...new Set(all)].map(r => {
    const col = window.ROLE_COLORS[r.toUpperCase()] || '#10b981';
    return `<span class="role-chip"><span class="role-dot" style="background:${col}"></span>${r}</span>`;
  }).join('');
};

let activeShopFilter = 'ALL';
let activeShopSort = 'DEFAULT';

function syncHud() {
  const p = window.userProfile;
  if (!p) return;
  const savedTh = localStorage.getItem('zynk_theme');
  const activeTh = savedTh || p.profile_theme || 'default';
  document.body.className = activeTh === 'default' ? '' : activeTh;

  const rank = window.RANKS.at(p.rank_index || 0) || window.RANKS.at(0);
  const lvl = Math.floor((p.xp || 0) / 1000) + 1;
  document.getElementById('hud-username').textContent = p.username;
  document.getElementById('hud-role-tag').innerHTML = window.renderRoleChips(p);
  document.getElementById('hud-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('chat-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('store-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('hud-rank-pill').textContent = `Rank: ${rank.name}`;
  document.getElementById('hud-lvl').textContent = `◈ LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${(p.xp || 0) % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${((p.xp || 0) % 1000) / 10}%`;
  const av = document.getElementById('hud-avatar-img');
  if (av) {
    av.src = p.avatar && !p.avatar.includes('dicebear') ? p.avatar : 'logo.png';
    av.style.borderColor = p.equipped_color || '#10b981';
    av.style.boxShadow = p.avatar_frame && p.avatar_frame !== 'none' ? `0 0 0 3px ${p.avatar_frame}, 0 0 18px ${p.avatar_frame}` : 'none';
  }
}

async function openGiftSearchModal(item, finalCost) {
  const p = window.userProfile;
  if (!p) return window.notify('Sign in first!', true);
  if (p.credits < finalCost) return window.notify(`Need ${finalCost} Z-Credits to gift.`, true);

  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const members = await window.sbRest('users?select=id,username,role,avatar,equipped_color,owned_items&order=username.asc&limit=150').catch(() => []);
  const others = (members || []).filter(m => String(m.id) !== String(p.id));

  box.innerHTML = `
    <div style="padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>🎁 Gift "${item.name}"</h3>
        <button class="btn-ghost" id="close-gift-modal">✕</button>
      </div>
      <p class="sub-text" style="margin-bottom:12px;">Cost: <strong style="color:#10b981">${finalCost} Z-Credits</strong> • Type a username and click to send:</p>
      <input id="gift-search-inp" class="tool-input" placeholder="Search member username..." autocomplete="off" />
      <div id="gift-results-list" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('close-gift-modal').onclick = () => modal.classList.add('hidden');

  const listEl = document.getElementById('gift-results-list');
  const draw = (q) => {
    const matches = others.filter(m => m.username.toLowerCase().includes(q.toLowerCase()));
    listEl.innerHTML = matches.map(m => {
      const av = m.avatar && !m.avatar.includes('dicebear') ? m.avatar : 'logo.png';
      return `<div class="ac-item" data-gid="${m.id}" style="border-radius:8px;background:rgba(4,7,11,0.75);">
        <div style="display:flex;align-items:center;gap:10px;"><img src="${av}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" /><strong style="color:${m.equipped_color || '#f8fafc'}">@${m.username}</strong></div>
        <span class="btn-neon" style="padding:4px 10px;font-size:0.75rem;">Send Gift</span>
      </div>`;
    }).join('') || '<p class="sub-text">No matching members found.</p>';

    listEl.querySelectorAll('[data-gid]').forEach(el => (el.onclick = async () => {
      const friend = matches.find(x => String(x.id) === el.dataset.gid);
      if (!friend) return;
      modal.classList.add('hidden');
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - finalCost }, window.authToken);
      await window.sbRest(`users?id=eq.${friend.id}`, 'PATCH', { owned_items: [...new Set([...(friend.owned_items || []), item.id])] }, window.authToken);
      await window.refreshMyProfile();
      window.notify(`🎁 Gifted ${item.name} to @${friend.username}!`);
    }));
  };
  draw('');
  document.getElementById('gift-search-inp').oninput = (e) => draw(e.target.value);
}
async function renderRanksAndStore() {
  syncHud();
  const p = window.userProfile;

  const rGrid = document.getElementById('ranks-grid');
  if (rGrid) {
    rGrid.style.display = 'block';
    rGrid.innerHTML = `
      <div class="glass-card" style="max-width:520px;margin:40px auto;text-align:center;padding:36px 24px;">
        <span class="rarity-tag">ZYNKOS RANKS & PERKS</span>
        <h2 style="font-size:1.8rem;margin:8px 0 10px;">Coming Soon</h2>
        <p class="sub-text" style="margin-bottom:20px;">Member ranks, store discounts, and rank perks are currently being finalized. Check back soon!</p>
        <button class="btn-neon" onclick="openTab('dash-view')">Back to Dashboard</button>
      </div>`;
  }

  const sGrid = document.getElementById('store-grid');
  if (sGrid && window.sbRest) {
    const items = await window.sbRest('store_items?order=id.asc').catch(() => []);
    const rarityColors = { COMMON: '#94a3b8', RARE: '#06b6d4', EPIC: '#a855f7', LEGENDARY: '#f59e0b' };
    const myRank = window.RANKS.at(p?.rank_index || 0) || window.RANKS.at(0);
    const rankDisc = myRank.discount || 0;

    const cats = [
      { id: 'ALL', label: '✨ All Gear' },
      { id: 'DEALS', label: '🔥 Daily Deals (10% Off)' },
      { id: 'avatar', label: '🖼 Avatars' },
      { id: 'frame', label: '💠 Avatar Frames' },
      { id: 'theme', label: '🌌 Banners & Themes' },
      { id: 'cosmetic', label: '⚡ Colors & Badges' },
      { id: 'REQUEST', label: '💡 Request Item' }
    ];

    sGrid.innerHTML = `
      <div class="store-layout">
        <div class="glass-card" style="padding:14px;">
          <div class="mono-dim" style="margin-bottom:8px;font-weight:700;">CATEGORIES</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
            ${cats.map(c => `<button class="${activeShopFilter === c.id ? 'btn-neon' : 'btn-outline'}" style="text-align:left;width:100%;" data-sfilt="${c.id}">${c.label}</button>`).join('')}
          </div>
          <div class="mono-dim" style="margin-bottom:6px;font-weight:700;">SORT BY</div>
          <select id="shop-sort-sel" class="tool-input" style="margin-bottom:0;">
            <option value="DEFAULT">Featured Order</option>
            <option value="LOW">Price: Low to High</option>
            <option value="HIGH">Price: High to Low</option>
          </select>
        </div>
        <div id="shop-body-area"></div>
      </div>`;

    const sortSel = document.getElementById('shop-sort-sel');
    sortSel.value = activeShopSort;
    sortSel.onchange = () => { activeShopSort = sortSel.value; renderRanksAndStore(); };
    sGrid.querySelectorAll('[data-sfilt]').forEach(b => (b.onclick = () => { activeShopFilter = b.dataset.sfilt; renderRanksAndStore(); }));
    const area = document.getElementById('shop-body-area');

    if (activeShopFilter === 'REQUEST') {
      area.innerHTML = `
        <div class="glass-card" style="max-width:480px;">
          <h3>💡 Request a Shop Item</h3>
          <p class="sub-text" style="margin:6px 0 12px;">Suggest a custom avatar, frame, banner, or theme to be added to Zynk Store!</p>
          <input id="req-item-name" class="tool-input" placeholder="Item Name (e.g. Emerald Matrix Frame)" />
          <select id="req-item-cat" class="tool-input"><option value="Avatar">Avatar</option><option value="Avatar Frame">Avatar Frame</option><option value="Banner / Theme">Banner / Theme</option><option value="Badge / Color">Badge / Color</option></select>
          <input id="req-item-notes" class="tool-input" placeholder="Color or style details (optional)" />
          <button id="send-shop-req-btn" class="btn-neon" style="width:100%">Submit Shop Request</button>
        </div>`;
      document.getElementById('send-shop-req-btn').onclick = async () => {
        if (!p) return window.notify('Sign in to request items!', true);
        const name = document.getElementById('req-item-name').value.trim();
        if (!name) return window.notify('Enter an item name first.', true);
        await window.sbRest('shop_requests', 'POST', { username: p.username, item_name: name, category: document.getElementById('req-item-cat').value, notes: document.getElementById('req-item-notes').value.trim() }, window.authToken);
        window.notify('Shop request submitted!');
      };
      return;
    }
    const getVisual = (it) => {
      const myAv = p?.avatar && !p.avatar.includes('dicebear') ? p.avatar : 'logo.png';
      const themeColors = { 'theme-cyber': '#06b6d4', 'theme-crimson': '#f43f5e', 'theme-gold': '#f59e0b', 'theme-violet': '#a855f7', default: '#10b981' };
      const imgSrc = it.image_url || (String(it.item_value || '').startsWith('data:image') || String(it.item_value || '').startsWith('http') ? it.item_value : '');
      if (imgSrc) return `<div style="height:135px;border-radius:12px;margin-bottom:10px;overflow:hidden;background:#04070b;border:1px solid rgba(255,255,255,0.12);"><img src="${imgSrc}" alt="${it.name}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
      if (it.item_type === 'avatar') return `<div style="height:135px;display:flex;align-items:center;justify-content:center;background:#04070b;border-radius:12px;margin-bottom:10px;"><img src="logo.png" style="width:76px;height:76px;border-radius:50%;object-fit:cover;border:2px solid #10b981;" /></div>`;
      if (it.item_type === 'frame') return `<div style="height:135px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,${it.item_value}22,#04070b);border-radius:12px;margin-bottom:10px;"><img src="${myAv}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px ${it.item_value},0 0 20px ${it.item_value};" /></div>`;
      if (it.item_type === 'theme') {
        const c = themeColors[it.item_value] || it.item_value || '#10b981';
        return `<div style="height:135px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:radial-gradient(circle at top,${c}38,#04070b);border:1px solid ${c};border-radius:12px;margin-bottom:10px;"><span style="color:${c};font-weight:800;letter-spacing:1.5px;">STEADY THEME</span><span style="font-size:0.78rem;color:#cbd5e1;margin-top:4px;">${it.name}</span></div>`;
      }
      if (it.item_type === 'color') return `<div style="height:135px;display:flex;align-items:center;justify-content:center;background:#04070b;border-radius:12px;margin-bottom:10px;"><strong style="color:${it.item_value};font-size:1.1rem;">@${p?.username || 'Member'}</strong></div>`;
      return `<div style="height:135px;display:flex;align-items:center;justify-content:center;background:#04070b;border-radius:12px;margin-bottom:10px;"><span class="pill" style="border-color:#10b981;font-size:0.95rem;">${it.item_value || '★'} ${it.name}</span></div>`;
    };

    let filtered = (items || []).filter(it => {
      if (activeShopFilter === 'ALL') return true;
      if (activeShopFilter === 'DEALS') return it.is_daily_deal;
      if (activeShopFilter === 'theme') return it.item_type === 'banner' || it.item_type === 'theme';
      if (activeShopFilter === 'cosmetic') return it.item_type === 'color' || it.item_type === 'badge';
      return it.item_type === activeShopFilter;
    });
    if (activeShopSort === 'LOW') filtered.sort((a, b) => a.cost - b.cost);
    if (activeShopSort === 'HIGH') filtered.sort((a, b) => b.cost - a.cost);

    area.className = 'cards-grid';
    area.innerHTML = filtered.length ? '' : '<div class="glass-card"><p class="sub-text">No items in this category yet—check back soon!</p></div>';

    filtered.forEach(it => {
      const totalDisc = Math.min(0.5, (it.is_daily_deal ? 0.10 : 0) + rankDisc);
      const finalCost = Math.max(1, Math.floor(it.cost * (1 - totalDisc)));
      const owned = Array.isArray(p?.owned_items) && p.owned_items.includes(it.id);
      const rCol = it.is_daily_deal ? '#f59e0b' : (rarityColors[it.rarity] || '#10b981');
      const imgSrc = it.image_url || (String(it.item_value || '').startsWith('data:image') || String(it.item_value || '').startsWith('http') ? it.item_value : '');
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.borderColor = `${rCol}55`;
      card.innerHTML = `${getVisual(it)}<div style="display:flex;justify-content:space-between;align-items:center;"><span class="rarity-tag" style="color:${rCol}">${totalDisc > 0 ? `🔥 ${Math.round(totalDisc * 100)}% OFF` : it.rarity}</span><span class="mono-dim">${it.item_type.toUpperCase()}</span></div><h3 style="margin:2px 0;">${it.name}</h3><p class="sub-text" style="margin-bottom:12px;">${totalDisc > 0 ? `<s>${it.cost}</s> → <strong style="color:#f59e0b">${finalCost} Z-Credits</strong>` : `${finalCost} Z-Credits`}</p><div style="display:flex;gap:8px;"><button class="${owned ? 'btn-outline' : 'btn-neon'} buy-btn" style="flex:1">${owned ? 'Equip' : 'Buy'}</button><button class="btn-outline gift-btn" title="Gift to member">🎁</button></div>`;

      const buyBtn = card.querySelector('.buy-btn');
      buyBtn.onclick = async () => {
        if (!p) return window.notify('Sign in first!', true);
        if (!owned && p.credits < finalCost) return window.notify('Not enough Z-Credits!', true);
        buyBtn.disabled = true;
        const nextOwned = owned ? (p.owned_items || []) : [...(p.owned_items || []), it.id];
        const up = owned ? {} : { credits: p.credits - finalCost, owned_items: nextOwned };
        if (it.item_type === 'avatar' && imgSrc) up.avatar = imgSrc;
        if (it.item_type === 'frame') up.avatar_frame = it.item_value;
        if (it.item_type === 'banner' && imgSrc) up.banner = imgSrc;
        if (it.item_type === 'theme') { up.profile_theme = it.item_value; localStorage.setItem('zynk_theme', it.item_value); }
        if (it.item_type === 'color') up.equipped_color = it.item_value;
        if (it.item_type === 'badge') up.equipped_badge = it.item_value;
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', up, window.authToken);
        await window.refreshMyProfile();
        window.notify(owned ? `Equipped ${it.name}!` : `Purchased & equipped ${it.name}!`);
      };

      card.querySelector('.gift-btn').onclick = () => openGiftSearchModal(it, finalCost);
      area.appendChild(card);
    });
  }
}

window.addEventListener('zynk-profile-updated', renderRanksAndStore);
window.addEventListener('DOMContentLoaded', renderRanksAndStore);
