window.RANKS = [
  { name: 'Circuit', cost: 0, priceLabel: 'FREE', monthly: 100, color: '#94a3b8', perks: 'Base ZynkOS Access, 100 Monthly Z-Credits, Standard Chat' },
  { name: 'Pulse', cost: 250, priceLabel: '250 Z-Credits', monthly: 250, color: '#10b981', perks: 'All Circuit Perks, 250 Monthly Z-Credits, +25% Chat XP' },
  { name: 'Nova', cost: -1, priceLabel: '$4.99 / mo', monthly: 600, color: '#06b6d4', perks: 'All Pulse Perks, 600 Monthly Z-Credits, +50% Chat XP' },
  { name: 'Titan', cost: -1, priceLabel: '$9.99 / mo', monthly: 1200, color: '#a855f7', perks: 'All Nova Perks, 1,200 Monthly Z-Credits, Custom Frame Glow' },
  { name: 'Apex', cost: -1, priceLabel: '$19.99 / mo', monthly: 2500, color: '#f59e0b', perks: 'All Titan Perks, 2,500 Monthly Z-Credits, Priority Access' }
];

let activeShopFilter = 'ALL';

function syncHud() {
  const p = window.userProfile;
  if (!p) return;
  if (p.profile_theme && p.profile_theme !== 'default') document.body.className = p.profile_theme;
  const rank = window.RANKS.at(p.rank_index || 0) || window.RANKS.at(0);
  const lvl = Math.floor((p.xp || 0) / 1000) + 1;
  const extras = (p.extra_roles || []).length ? ' • ' + p.extra_roles.map(r => `[${r}]`).join(' ') : '';
  document.getElementById('hud-username').textContent = p.username;
  document.getElementById('hud-role-tag').textContent = `[${p.role}] • [${rank.name.toUpperCase()}]${p.is_beta ? ' • [BETA]' : ''}${extras}`;
  document.getElementById('hud-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('chat-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('store-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('hud-rank-pill').textContent = `Rank: ${rank.name}`;
  document.getElementById('hud-lvl').textContent = `◈ LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${(p.xp || 0) % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${((p.xp || 0) % 1000) / 10}%`;
  const av = document.getElementById('hud-avatar-img');
  if (av) {
    av.src = p.avatar && !p.avatar.startsWith('https://dicebear.com') ? p.avatar : `https://dicebear.com{encodeURIComponent(p.username)}`;
    av.style.borderColor = p.equipped_color || '#10b981';
    av.style.boxShadow = p.avatar_frame && p.avatar_frame !== 'none' ? `0 0 0 3px ${p.avatar_frame}, 0 0 18px ${p.avatar_frame}` : 'none';
  }
}

async function renderRanksAndStore() {
  syncHud();
  const p = window.userProfile;

  const rGrid = document.getElementById('ranks-grid');
  if (rGrid) {
    rGrid.innerHTML = '';
    window.RANKS.forEach((r, idx) => {
      const owned = p && (p.rank_index || 0) >= idx;
      const isCreditRank = r.cost >= 0;
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.innerHTML = `<span class="rarity-tag" style="color:${r.color}">${r.priceLabel}</span><h3>${r.name}</h3><p class="sub-text" style="margin:8px 0 14px;">${r.perks}</p><button class="${owned ? 'btn-outline' : 'btn-neon'}" style="width:100%" ${owned ? 'disabled' : ''}>${owned ? '✓ Unlocked' : isCreditRank ? `Unlock (${r.cost} Z-Credits)` : `💳 ${r.priceLabel} (Checkout Soon)`}</button>`;
      card.querySelector('button').onclick = async () => {
        if (!p) return window.notify('Sign in first!', true);
        if (!isCreditRank) return window.notify(`${r.name} (${r.priceLabel}) requires real-money checkout—payment gateway coming soon!`, true);
        if (p.credits < r.cost) return window.notify('Not enough Z-Credits!', true);
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - r.cost, rank_index: idx }, window.authToken);
        await window.refreshMyProfile();
        window.notify(`Unlocked ${r.name} Rank!`);
      };
      rGrid.appendChild(card);
    });
  }
  const sGrid = document.getElementById('store-grid');
  if (sGrid && window.sbRest) {
    const items = await window.sbRest('store_items?order=id.asc').catch(() => []);
    const rarityColors = { COMMON: '#94a3b8', RARE: '#06b6d4', EPIC: '#a855f7', LEGENDARY: '#f59e0b' };
    const tabs = [
      { id: 'ALL', label: '✨ All Gear' },
      { id: 'DEALS', label: '🔥 Daily Deals (10% Off)' },
      { id: 'avatar', label: '🖼 Avatars' },
      { id: 'frame', label: '💠 Avatar Frames' },
      { id: 'theme', label: '🌌 Banners & Themes' },
      { id: 'cosmetic', label: '⚡ Colors & Badges' },
      { id: 'REQUEST', label: '💡 Request Item' }
    ];

    sGrid.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
        ${tabs.map(t => `<button class="${activeShopFilter === t.id ? 'btn-neon' : 'btn-outline'}" data-sfilt="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="shop-body-area"></div>`;

    sGrid.querySelectorAll('[data-sfilt]').forEach(b => (b.onclick = () => { activeShopFilter = b.dataset.sfilt; renderRanksAndStore(); }));
    const area = document.getElementById('shop-body-area');

    if (activeShopFilter === 'REQUEST') {
      area.innerHTML = `
        <div class="glass-card" style="max-width:480px;">
          <h3>💡 Request a Shop Item</h3>
          <p class="sub-text" style="margin:6px 0 12px;">Suggest a custom avatar, frame, banner, or theme for the Founder to upload!</p>
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
        window.notify('Shop request sent to the Founder!');
      };
      return;
    }

    const getVisual = (it) => {
      const myAv = p?.avatar && !p.avatar.startsWith('https://dicebear.com') ? p.avatar : 'https://dicebear.com';
      const themeColors = { 'theme-cyber': '#06b6d4', 'theme-crimson': '#f43f5e', 'theme-gold': '#f59e0b', 'theme-violet': '#a855f7', default: '#10b981' };
      if (it.image_url) return `<img src="${it.image_url}" alt="${it.name}" style="width:100%;height:130px;object-fit:cover;border-radius:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.1);" />`;
      if (it.item_type === 'frame') return `<div style="height:130px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,${it.item_value}22,#04070b);border-radius:12px;margin-bottom:10px;"><img src="${myAv}" style="width:74px;height:74px;border-radius:50%;box-shadow:0 0 0 3px ${it.item_value},0 0 22px ${it.item_value};" /></div>`;
      if (it.item_type === 'theme') {
        const c = themeColors[it.item_value] || it.item_value || '#10b981';
        return `<div style="height:130px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:radial-gradient(circle at top,${c}38,#04070b);border:1px solid ${c};border-radius:12px;margin-bottom:10px;"><span style="color:${c};font-weight:800;letter-spacing:1.5px;">STEADY THEME</span><span style="font-size:0.78rem;color:#cbd5e1;margin-top:4px;">${it.name}</span></div>`;
      }
      if (it.item_type === 'color') return `<div style="height:130px;display:flex;align-items:center;justify-content:center;background:#04070b;border-radius:12px;margin-bottom:10px;"><strong style="color:${it.item_value};font-size:1.15rem;">@${p?.username || 'Operator'}</strong></div>`;
      return `<div style="height:130px;display:flex;align-items:center;justify-content:center;background:#04070b;border-radius:12px;margin-bottom:10px;"><span class="pill" style="border-color:#10b981;font-size:1rem;">${it.item_value || '★'} ${it.name}</span></div>`;
    };

    const filtered = (items || []).filter(it => {
      if (activeShopFilter === 'ALL') return true;
      if (activeShopFilter === 'DEALS') return it.is_daily_deal;
      if (activeShopFilter === 'theme') return it.item_type === 'banner' || it.item_type === 'theme';
      if (activeShopFilter === 'cosmetic') return it.item_type === 'color' || it.item_type === 'badge';
      return it.item_type === activeShopFilter;
    });

    area.className = 'cards-grid';
    area.innerHTML = filtered.length ? '' : '<div class="glass-card"><p class="sub-text">No items in this category yet—upload some in your Founder Panel!</p></div>';

    filtered.forEach(it => {
      const finalCost = it.is_daily_deal ? Math.floor(it.cost * 0.9) : it.cost;
      const owned = p && (p.owned_items || []).includes(it.id);
      const rCol = it.is_daily_deal ? '#f59e0b' : (rarityColors[it.rarity] || '#10b981');
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.borderColor = `${rCol}55`;
      card.innerHTML = `${getVisual(it)}<div style="display:flex;justify-content:space-between;align-items:center;"><span class="rarity-tag" style="color:${rCol}">${it.is_daily_deal ? '🔥 10% OFF DEAL' : it.rarity}</span><span class="mono-dim">${it.item_type.toUpperCase()}</span></div><h3 style="margin:2px 0;">${it.name}</h3><p class="sub-text" style="margin-bottom:12px;">${it.is_daily_deal ? `<s>${it.cost}</s> → <strong style="color:#f59e0b">${finalCost} Z-Credits</strong>` : `${finalCost} Z-Credits`}</p><div style="display:flex;gap:8px;"><button class="${owned ? 'btn-outline' : 'btn-neon'} buy-btn" style="flex:1">${owned ? 'Equip' : 'Buy'}</button><button class="btn-outline gift-btn" title="Gift to @user">🎁 Gift</button></div>`;

      card.querySelector('.buy-btn').onclick = async () => {
        if (!p) return window.notify('Sign in first!', true);
        if (!owned && p.credits < finalCost) return window.notify('Not enough Z-Credits!', true);
        const up = owned ? {} : { credits: p.credits - finalCost, owned_items: [...(p.owned_items || []), it.id] };
        if (it.item_type === 'avatar') up.avatar = it.image_url;
        if (it.item_type === 'frame') up.avatar_frame = it.item_value;
        if (it.item_type === 'banner') up.banner = it.image_url;
        if (it.item_type === 'theme') up.profile_theme = it.item_value;
        if (it.item_type === 'color') up.equipped_color = it.item_value;
        if (it.item_type === 'badge') up.equipped_badge = it.item_value;
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', up, window.authToken);
        await window.refreshMyProfile();
        window.notify(owned ? `Equipped ${it.name}!` : `Purchased & equipped ${it.name}!`);
      };

      card.querySelector('.gift-btn').onclick = async () => {
        if (!p) return window.notify('Sign in first!', true);
        if (p.credits < finalCost) return window.notify(`Need ${finalCost} Z-Credits to gift.`, true);
        const who = prompt(`Gift "${it.name}" (${finalCost} Z-Credits) to username:`)?.trim().replace(/^@/, '');
        if (!who) return;
        const res = await window.sbRest(`users?username=ilike.${encodeURIComponent(who)}`);
        const friend = Array.isArray(res) ? res.at(0) : null;
        if (!friend) return window.notify(`User @${who} not found.`, true);
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { credits: p.credits - finalCost }, window.authToken);
        await window.sbRest(`users?id=eq.${friend.id}`, 'PATCH', { owned_items: [...new Set([...(friend.owned_items || []), it.id])] }, window.authToken);
        await window.refreshMyProfile();
        window.notify(`🎁 Gifted ${it.name} to ${friend.username}!`);
      };
      area.appendChild(card);
    });
  }
}

window.addEventListener('zynk-profile-updated', renderRanksAndStore);
window.addEventListener('DOMContentLoaded', renderRanksAndStore);
