window.zynkState = JSON.parse(localStorage.getItem('zynkos_state')) || {
  username: 'KingstenVibes',
  role: 'FOUNDER',
  status: 'online',
  bio: 'Building ZynkOS — Neural Hub & Arcade.',
  credits: 500,
  xp: 350,
  rankIndex: 0,
  lastMonthly: 0,
  ownedItems: ['core_emerald'],
  equippedColor: '#10b981',
  equippedBadge: '◈',
  claimed: [],
  friends: ['CyberNova', 'VexOperator'],
  following: ['Evicly', 'CyberNova']
};

window.RANKS = [
  { name: 'Circuit', cost: 0, monthly: 100, color: '#94a3b8', perks: ['Base ZynkOS Access', '100 Monthly Z-Credits', 'Standard Chat Tag'] },
  { name: 'Pulse', cost: 250, monthly: 300, color: '#10b981', perks: ['All Circuit Perks', '300 Monthly Z-Credits', '+15% Chat XP Boost', 'Emerald Pulse Tag'] },
  { name: 'Nova', cost: 600, monthly: 750, color: '#06b6d4', perks: ['All Pulse & Circuit Perks', '750 Monthly Z-Credits', '+35% Chat XP Boost', 'Custom Bio Highlights'] },
  { name: 'Apex', cost: 1200, monthly: 1500, color: '#f59e0b', perks: ['All Lower Rank Perks', '1,500 Monthly Z-Credits', '2x Chat XP Multiplier', 'Apex Gold Crown Tag'] }
];

window.saveZynk = function() {
  localStorage.setItem('zynkos_state', JSON.stringify(window.zynkState));
  const s = window.zynkState;
  const rank = window.RANKS[s.rankIndex];
  const lvl = Math.floor(s.xp / 1000) + 1;

  document.getElementById('hud-username').textContent = s.username;
  document.getElementById('hud-role-tag').textContent = `[${s.role}] • [${rank.name.toUpperCase()}]`;
  document.getElementById('hud-credits').textContent = `${s.credits} Z-Credits`;
  document.getElementById('hud-rank-pill').textContent = `Rank: ${rank.name}`;
  document.getElementById('store-credits').textContent = `${s.credits} Z-Credits`;
  document.getElementById('chat-credits').textContent = `${s.credits} Z-Credits`;
  document.getElementById('hud-lvl').textContent = `${s.equippedBadge} LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${s.xp % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${(s.xp % 1000) / 10}%`;

  const av = document.getElementById('profile-avatar');
  av.textContent = s.username.charAt(0).toUpperCase();
  av.style.borderColor = s.equippedColor;
  av.style.color = s.equippedColor;
};

function renderRanks() {
  const grid = document.getElementById('ranks-grid');
  grid.innerHTML = '';
  window.RANKS.forEach((r, idx) => {
    const owned = window.zynkState.rankIndex >= idx;
    const isCurrent = window.zynkState.rankIndex === idx;
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div>
        <span class="mono-dim" style="color:${r.color}">TIER ${idx + 1}</span>
        <h3 style="color:${r.color}; margin:4px 0;">${r.name}</h3>
        <ul class="perk-list">${r.perks.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <button class="btn-neon" ${owned ? 'style="opacity:0.7"' : ''}>
        ${isCurrent ? 'Active Rank ✓' : owned ? 'Unlocked (Inherited)' : `Upgrade (${r.cost} Z)`}
      </button>
    `;
    card.querySelector('button').onclick = () => {
      if (owned) return;
      if (window.zynkState.credits < r.cost) return alert(`You need ${r.cost} Z-Credits for ${r.name}!`);
      window.zynkState.credits -= r.cost;
      window.zynkState.rankIndex = idx;
      window.saveZynk();
      renderRanks();
    };
    grid.appendChild(card);
  });
}

document.getElementById('claim-monthly-btn').addEventListener('click', () => {
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  if (now - window.zynkState.lastMonthly < monthMs) {
    return alert('Monthly stipend already claimed! Check back next month.');
  }
  const reward = window.RANKS[window.zynkState.rankIndex].monthly;
  window.zynkState.credits += reward;
  window.zynkState.lastMonthly = now;
  window.saveZynk();
  alert(`Claimed ${reward} Z-Credits for your ${window.RANKS[window.zynkState.rankIndex].name} rank!`);
});

const STORE_ITEMS = [
  { id: 'core_emerald', name: 'Emerald Core', type: 'color', val: '#10b981', cost: 0, svg: '<circle cx="40" cy="30" r="18" fill="none" stroke="#10b981" stroke-width="4"/><circle cx="40" cy="30" r="8" fill="#10b981"/>' },
  { id: 'core_cyan', name: 'Cyber Cyan Frame', type: 'color', val: '#06b6d4', cost: 150, svg: '<rect x="20" y="10" width="40" height="40" rx="10" fill="none" stroke="#06b6d4" stroke-width="4"/><circle cx="40" cy="30" r="8" fill="#06b6d4"/>' },
  { id: 'core_violet', name: 'Quantum Violet', type: 'color', val: '#8b5cf6', cost: 300, svg: '<polygon points="40,8 60,48 20,48" fill="none" stroke="#8b5cf6" stroke-width="4"/>' },
  { id: 'badge_crown', name: 'Apex Crown Icon', type: 'badge', val: '♛', cost: 250, svg: '<text x="40" y="40" font-size="32" text-anchor="middle" fill="#f59e0b">♛</text>' },
  { id: 'badge_bolt', name: 'Overdrive Bolt', type: 'badge', val: '⚡', cost: 200, svg: '<text x="40" y="40" font-size="32" text-anchor="middle" fill="#22d3ee">⚡</text>' }
];

function renderStore() {
  const grid = document.getElementById('store-grid');
  grid.innerHTML = '';
  STORE_ITEMS.forEach(it => {
    const owned = window.zynkState.ownedItems.includes(it.id);
    const equipped = (it.type === 'color' && window.zynkState.equippedColor === it.val) || (it.type === 'badge' && window.zynkState.equippedBadge === it.val);
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div class="item-preview"><svg width="80" height="60">${it.svg}</svg></div>
      <div><h4>${it.name}</h4><p class="sub-text">${owned ? 'Owned' : it.cost + ' Z-Credits'}</p></div>
      <button class="btn-neon">${equipped ? 'Equipped ✓' : owned ? 'Equip' : 'Buy'}</button>
    `;
    card.querySelector('button').onclick = () => {
      if (!owned) {
        if (window.zynkState.credits < it.cost) return alert('Not enough Z-Credits!');
        window.zynkState.credits -= it.cost;
        window.zynkState.ownedItems.push(it.id);
      }
      if (it.type === 'color') window.zynkState.equippedColor = it.val;
      if (it.type === 'badge') window.zynkState.equippedBadge = it.val;
      window.saveZynk();
      renderStore();
    };
    grid.appendChild(card);
  });
}

window.saveZynk();
renderRanks();
renderStore();
