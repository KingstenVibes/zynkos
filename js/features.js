const userData = JSON.parse(localStorage.getItem('zynkos_profile')) || {
  credits: 500,
  xp: 350,
  owned: ['emerald'],
  equipped: '#10b981',
  claimed: []
};

function saveUser() {
  localStorage.setItem('zynkos_profile', JSON.stringify(userData));
  const lvl = Math.floor(userData.xp / 1000) + 1;
  document.getElementById('hud-credits').textContent = `${userData.credits} Z-Credits`;
  document.getElementById('store-credits').textContent = `${userData.credits} Z-Credits`;
  document.getElementById('hud-lvl').textContent = `◈ LEVEL ${lvl}`;
  document.getElementById('hud-xp-text').textContent = `${userData.xp % 1000} / 1,000 XP`;
  document.getElementById('hud-xp-bar').style.width = `${(userData.xp % 1000) / 10}%`;
  document.getElementById('profile-avatar').style.borderColor = userData.equipped;
  document.getElementById('profile-avatar').style.color = userData.equipped;
}

const storeItems = [
  { id: 'emerald', name: 'Emerald Core', rarity: 'COMMON', cost: 0, color: '#10b981' },
  { id: 'cyan', name: 'Cyber Cyan Aura', rarity: 'RARE', cost: 150, color: '#06b6d4' },
  { id: 'violet', name: 'Quantum Violet', rarity: 'EPIC', cost: 300, color: '#8b5cf6' },
  { id: 'gold', name: 'Solar Overdrive', rarity: 'LEGENDARY', cost: 450, color: '#f59e0b' }
];

function renderStore() {
  const grid = document.getElementById('store-grid');
  grid.innerHTML = '';
  storeItems.forEach(item => {
    const owned = userData.owned.includes(item.id);
    const equipped = userData.equipped === item.color;
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div>
        <span class="rarity-tag">${item.rarity}</span>
        <h4 style="color:${item.color}; margin-top:4px;">${item.name}</h4>
        <p class="sub-text">${owned ? 'Owned' : item.cost + ' Z-Credits'}</p>
      </div>
      <button class="btn-neon">${equipped ? 'Equipped' : owned ? 'Equip' : 'Unlock'}</button>
    `;
    card.querySelector('button').onclick = () => {
      if (owned) {
        userData.equipped = item.color;
      } else if (userData.credits >= item.cost) {
        userData.credits -= item.cost;
        userData.owned.push(item.id);
        userData.equipped = item.color;
      } else {
        return alert('Not enough Z-Credits!');
      }
      saveUser();
      renderStore();
    };
    grid.appendChild(card);
  });
}

const achievements = [
  { id: 'first_boot', title: 'System Boot', desc: 'Log into ZynkOS for the first time.', reward: 100 },
  { id: 'explorer', title: 'OS Explorer', desc: 'Check out the Zynk Store and Utility Tools.', reward: 150 },
  { id: 'gamer', title: 'Arcade Challenger', desc: 'Launch a custom game inside ZynkOS.', reward: 200 }
];

function renderAchievements() {
  const grid = document.getElementById('achieve-grid');
  grid.innerHTML = '';
  achievements.forEach(a => {
    const done = userData.claimed.includes(a.id);
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div>
        <span class="rarity-tag">+${a.reward} Z-CREDITS</span>
        <h4 style="margin-top:4px;">${a.title}</h4>
        <p class="sub-text">${a.desc}</p>
      </div>
      <button class="btn-neon" ${done ? 'disabled style="opacity:0.5"' : ''}>${done ? 'Claimed ✓' : 'Claim Reward'}</button>
    `;
    card.querySelector('button').onclick = () => {
      if (done) return;
      userData.claimed.push(a.id);
      userData.credits += a.reward;
      userData.xp += 250;
      saveUser();
      renderAchievements();
    };
    grid.appendChild(card);
  });
}

const leaders = [
  { name: 'KingstenVibes', credits: userData.credits },
  { name: 'CyberNova', credits: 420 },
  { name: 'VexOperator', credits: 310 }
];
const lbList = document.getElementById('leaderboard-list');
leaders.sort((a, b) => b.credits - a.credits).forEach((p, idx) => {
  const row = document.createElement('div');
  row.className = 'lb-row';
  row.innerHTML = `<span><strong>#${idx + 1}</strong> ${p.name}</span><span class="mono-dim">${p.credits} Z-Credits</span>`;
  lbList.appendChild(row);
});

document.getElementById('gen-pass-btn').addEventListener('click', () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('gen-pass-out').value = out;
});

document.getElementById('color-picker').addEventListener('input', (e) => {
  document.getElementById('color-hex-out').value = e.target.value;
});

saveUser();
renderStore();
renderAchievements();
