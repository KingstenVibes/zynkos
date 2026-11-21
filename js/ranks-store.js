window.RANKS = [
  { name: 'Circuit', cost: 0, monthly: 100, color: '#94a3b8', perks: ['Base ZynkOS Access', '100 Monthly Z-Credits', 'Standard Chat Tag'] },
  { name: 'Pulse', cost: 250, monthly: 300, color: '#10b981', perks: ['All Circuit Perks', '300 Monthly Z-Credits', '+15% Chat XP Boost', 'Emerald Pulse Tag'] },
  { name: 'Nova', cost: 600, monthly: 750, color: '#06b6d4', perks: ['All Pulse & Circuit Perks', '750 Monthly Z-Credits', '+35% Chat XP Boost', 'Custom Bio Highlights'] },
  { name: 'Apex', cost: 1200, monthly: 1500, color: '#f59e0b', perks: ['All Lower Rank Perks', '1,500 Monthly Z-Credits', '2x Chat XP Multiplier', 'Apex Gold Crown Tag'] }
];

const STORE_ITEMS = [
  { id: 'core_emerald', name: 'Emerald Core', type: 'color', val: '#10b981', cost: 0, svg: '<circle cx="40" cy="30" r="18" fill="none" stroke="#10b981" stroke-width="4"/><circle cx="40" cy="30" r="8" fill="#10b981"/>' },
  { id: 'core_cyan', name: 'Cyber Cyan Frame', type: 'color', val: '#06b6d4', cost: 150, svg: '<rect x="20" y="10" width="40" height="40" rx="10" fill="none" stroke="#06b6d4" stroke-width="4"/><circle cx="40" cy="30" r="8" fill="#06b6d4"/>' },
  { id: 'core_violet', name: 'Quantum Violet', type: 'color', val: '#8b5cf6', cost: 300, svg: '<polygon points="40,8 60,48 20,48" fill="none" stroke="#8b5cf6" stroke-width="4"/>' },
  { id: 'badge_crown', name: 'Apex Crown Icon', type: 'badge', val: '♛', cost: 250, svg: '<text x="40" y="40" font-size="32" text-anchor="middle" fill="#f59e0b">♛</text>' },
  { id: 'badge_bolt', name: 'Overdrive Bolt', type: 'badge', val: '⚡', cost: 200, svg: '<text x="40" y="40" font-size="32" text-anchor="middle" fill="#22d3ee">⚡</text>' }
];

const ACHIEVEMENTS = [
  { id: 'boot', title: 'First Boot', desc: 'Create your ZynkOS account.', reward: 100 },
  { id: 'chatter', title: 'Grid Communicator', desc: 'Send a message in Zynk Chat.', reward: 150 },
  { id: 'spender', title: 'Vault Collector', desc: 'Unlock an item in Zynk Store.', reward: 200 },
  { id: 'apex', title: 'Rank Climber', desc: 'Upgrade your ZynkOS Rank tier.', reward: 400 }
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
  const rank = window.RANKS[p.rank_index] || window.RANKS[0];
  const lvl = Math.floor(p.xp / 1000) + 1;
  document.getElementById('hud-username').textContent = p.username;
  document.getElementById('hud-role-tag').textContent = `[${p.role}] • [${rank.name.toUpperCase()}]`;
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

function renderAllEconomy() {
  syncHud();
  const p = window.userProfile;
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

  const sGrid = document.getElementById('store-grid');
  sGrid.innerHTML = '';
  STORE_ITEMS.forEach(it => {
    const owned = p && (p.owned_items || []).includes(it.id);
    const eq = p && ((it.type === 'color' && p.equipped_color === it.val) || (it.type === 'badge' && p.equipped_badge === it.val));
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `<div class="item-preview"><svg width="80" height="60">${it.svg}</svg></div><div><h4>${it.name}</h4><p class="sub-text">${owned ? 'Owned' : it.cost + ' Z-Credits'}</p></div><button class="btn-neon">${eq ? 'Equipped ✓' : owned ? 'Equip' : 'Buy'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
      const updates = {};
      if (!owned) {
        if (p.credits < it.cost) return alert('Not enough Z-Credits!');
        updates.credits = p.credits - it.cost;
        updates.owned_items = [...(p.owned_items || []), it.id];
      }
      if (it.type === 'color') updates.equipped_color = it.val;
      if (it.type === 'badge') updates.equipped_badge = it.val;
      await window.sb.from('users').update(updates).eq('id', p.id);
      await window.refreshMyProfile();
    };
    sGrid.appendChild(card);
  });

  const aGrid = document.getElementById('achieve-grid');
  aGrid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const done = p && (p.claimed || []).includes(a.id);
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `<div><span class="mono-dim" style="color:#10b981">+${a.reward} Z-CREDITS</span><h4 style="margin-top:4px">${a.title}</h4><p class="sub-text">${a.desc}</p></div><button class="btn-neon" ${done ? 'disabled style="opacity:0.5"' : ''}>${done ? 'Claimed ✓' : 'Claim'}</button>`;
    card.querySelector('button').onclick = async () => {
      if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
      if (done) return;
      await window.sb.from('users').update({ credits: p.credits + a.reward, xp: p.xp + 300, claimed: [...(p.claimed || []), a.id] }).eq('id', p.id);
      await window.refreshMyProfile();
    };
    aGrid.appendChild(card);
  });
}

document.getElementById('claim-monthly-btn').onclick = async () => {
  const p = window.userProfile;
  if (!p) return document.getElementById('auth-modal').classList.remove('hidden');
  const reward = (window.RANKS[p.rank_index] || window.RANKS[0]).monthly;
  await window.sb.from('users').update({ credits: p.credits + reward }).eq('id', p.id);
  await window.refreshMyProfile();
  alert(`Claimed ${reward} Z-Credits for your rank!`);
};

window.addEventListener('zynk-profile-updated', renderAllEconomy);
renderAllEconomy();
