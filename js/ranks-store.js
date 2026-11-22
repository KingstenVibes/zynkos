window.RANKS = [
  { name: 'Circuit', cost: 0, monthly: 100, color: '#94a3b8', perks: ['Base ZynkOS Access', '100 Monthly Z-Credits', 'Standard Chat Tag'] },
  { name: 'Pulse', cost: 250, monthly: 300, color: '#10b981', perks: ['All Circuit Perks', '300 Monthly Z-Credits', '+15% Chat XP Boost', 'Emerald Pulse Tag'] },
  { name: 'Nova', cost: 600, monthly: 750, color: '#06b6d4', perks: ['All Pulse & Circuit Perks', '750 Monthly Z-Credits', '+35% Chat XP Boost', 'Custom Bio Highlights'] },
  { name: 'Apex', cost: 1200, monthly: 1500, color: '#f59e0b', perks: ['All Lower Rank Perks', '1,500 Monthly Z-Credits', '2x Chat XP Multiplier', 'Apex Gold Crown Tag'] }
];

function syncHud() {
  const p = window.userProfile;
  if (!p) {
    document.getElementById('hud-username').textContent = 'Guest Operator';
    document.getElementById('hud-role-tag').textContent = '[GUEST] • [CIRCUIT]';
    document.getElementById('hud-credits').textContent = '0 Z-Credits';
    document.getElementById('store-credits').textContent = '0 Z-Credits';
    document.getElementById('chat-credits').textContent = '0 Z-Credits';
    return;
  }
  const rank = window.RANKS[p.rank_index] || window.RANKS;
  const lvl = Math.floor(p.xp / 1000) + 1;
  document.getElementById('hud-username').textContent = p.username;
  document.getElementById('hud-role-tag').textContent = `[${p.role}] • [${rank.name.toUpperCase()}]${p.is_beta ? ' • [BETA]' : ''}`;
  document.getElementById('hud-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('hud-rank-pill').textContent = `Rank: ${rank.name}`;
  document.getElementById('store-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('chat-credits').textContent = `${p.credits} Z-Credits`;
  document.getElementById('hud-lvl').textContent = `${p.equipped_badge} LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${p.xp % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${(p.xp % 1000) / 10}%`;
  const av = document.getElementById('hud-avatar-img');
  av.src = p.avatar;
  av.style.borderColor = p.equipped_color;
}

async function renderAllEconomy() {
  syncHud();
  const p = window.userProfile;

  // 1. Render Cascading Ranks
  const rGrid = document.getElementById('ranks-grid');
  rGrid.innerHTML = '';
  window.RANKS.forEach((r, idx) => {
    const owned = p && p.rank_index >= idx;
    const active = p && p.rank_index === idx;
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `<div><span class="mono-dim" style="color:${r.color}">TIER ${idx + 1}</span><h3 style="color:${r.color};margin:4px 0">${r.name}</h3><ul class="perk-list">${r.perks.map(x => `<li>${x}</li>`).join('')}</ul></div><button class="btn-neon">${active ? 'Active ✓' : owned ? 'Unlocked' : `Upgrade (${r.cost} Z)`}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
      if (owned || p.credits < r.cost) return alert(owned ? 'Already unlocked!' : 'Not enough Z-Credits!');
      await window.sb.from('users').update({ credits: p.credits - r.cost, rank_index: idx }).eq('id', p.id);
      await window.refreshMyProfile();
    };
    rGrid.appendChild(card);
  });

  // 2. Load Dynamic Store Items from Supabase
  const { data: items } = await window.sb.from('store_items').select('*').order('id', { ascending: true });
  const sGrid = document.getElementById('store-grid');
  sGrid.innerHTML = (items && items.length) ? '' : '<p class="sub-text">No custom items published yet—Founders can add items in the Founder Panel!</p>';
  (items || []).forEach(it => {
    const itemKey = `db_${it.id}`;
    const owned = p && (p.owned_items || []).includes(itemKey);
    const eq = p && ((it.item_type === 'color' && p.equipped_color === it.item_value) || (it.item_type === 'badge' && p.equipped_badge === it.item_value));
    const roleLocked = it.req_role !== 'ANY' && (!p || (p.role !== it.req_role && p.role !== 'FOUNDER'));
    const rankLocked = p && p.rank_index < (it.req_rank || 0);
    const reqLabel = `${it.rarity} • ${it.req_role !== 'ANY' ? it.req_role + ' ONLY' : window.RANKS[it.req_rank || 0].name + '+'}`;

    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div class="item-preview"><img src="${it.image_url}" style="max-height:66px;max-width:100%;border-radius:8px;object-fit:contain;" /></div>
      <div><span class="mono-dim" style="color:#06b6d4">${reqLabel}</span><h4>${it.name}</h4><p class="sub-text">${owned ? 'Owned' : it.cost + ' Z-Credits'}</p></div>
      <button class="btn-neon">${eq ? 'Equipped ✓' : owned ? 'Equip' : roleLocked || rankLocked ? 'Locked 🔒' : 'Buy'}</button>
    `;
    card.querySelector('button').onclick = async () => {
      if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
      if (!owned) {
        if (roleLocked) return alert(`Requires ${it.req_role} role!`);
        if (rankLocked) return alert(`Requires ${window.RANKS[it.req_rank].name} rank or higher!`);
        if (p.credits < it.cost) return alert('Not enough Z-Credits!');
      }
      const updates = {};
      if (!owned) {
        updates.credits = p.credits - it.cost;
        updates.owned_items = [...(p.owned_items || []), itemKey];
      }
      if (it.item_type === 'color') updates.equipped_color = it.item_value;
      if (it.item_type === 'badge') updates.equipped_badge = it.item_value;
      await window.sb.from('users').update(updates).eq('id', p.id);
      await window.refreshMyProfile();
    };
    sGrid.appendChild(card);
  });

  // 3. Load Dynamic Achievements from Supabase
  const { data: achs } = await window.sb.from('achievements_list').select('*').order('id', { ascending: true });
  const aGrid = document.getElementById('achieve-grid');
  aGrid.innerHTML = (achs && achs.length) ? '' : '<p class="sub-text">No achievements published yet—Founders can create them in the Founder Panel!</p>';
  (achs || []).forEach(a => {
    const achKey = `ach_${a.id}`;
    const done = p && (p.claimed || []).includes(achKey);
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `<div><span class="mono-dim" style="color:#10b981">+${a.reward_credits} Z • +${a.reward_xp} XP</span><h4 style="margin-top:4px">${a.title}</h4><p class="sub-text">${a.description}</p></div><button class="btn-neon" ${done ? 'disabled style="opacity:0.5"' : ''}>${done ? 'Claimed ✓' : 'Claim'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
      if (done) return;
      await window.sb.from('users').update({ credits: p.credits + a.reward_credits, xp: p.xp + a.reward_xp, claimed: [...(p.claimed || []), achKey] }).eq('id', p.id);
      await window.refreshMyProfile();
    };
    aGrid.appendChild(card);
  });
}

document.getElementById('claim-monthly-btn').onclick = async () => {
  const p = window.userProfile;
  if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
  const reward = (window.RANKS[p.rank_index] || window.RANKS).monthly;
  await window.sb.from('users').update({ credits: p.credits + reward }).eq('id', p.id);
  await window.refreshMyProfile();
  alert(`Claimed ${reward} Z-Credits for your rank!`);
};

window.addEventListener('zynk-profile-updated', renderAllEconomy);
window.addEventListener('zynk-store-refresh', renderAllEconomy);
renderAllEconomy();
