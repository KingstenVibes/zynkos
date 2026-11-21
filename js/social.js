function renderSocial() {
  const s = window.zynkState;
  const rank = window.RANKS[s.rankIndex];
  document.getElementById('social-container').innerHTML = `
    <div class="bento-grid">
      <div class="glass-card">
        <h3>Operator Profile & Roles</h3>
        <p class="sub-text" style="margin:8px 0;">${s.bio}</p>
        <div class="badges-row" style="margin-bottom:14px;">
          <span class="pill" style="color:#10b981;border-color:#10b981">${s.role}</span>
          <span class="pill" style="color:${rank.color}">${rank.name} Tier</span>
          <span class="pill">Verified Operator</span>
        </div>
        <div class="setting-group">
          <label>Update Bio</label>
          <input id="bio-input" class="tool-input" value="${s.bio}" />
          <button class="btn-neon" id="save-bio-btn">Save Bio</button>
        </div>
      </div>
      <div class="glass-card">
        <h3>Friends (${s.friends.length}) & Following (${s.following.length})</h3>
        <div style="display:flex;gap:8px;margin:10px 0;">
          <input id="add-friend-input" class="tool-input" style="margin:0" placeholder="Enter username..." />
          <button class="btn-neon" id="add-friend-btn">Add</button>
        </div>
        <div class="sub-label" style="margin-top:10px;">FRIENDS</div>
        ${s.friends.map(f => `<div class="lb-row"><span>● ${f}</span><span class="mono-dim">Friend</span></div>`).join('')}
        <div class="sub-label" style="margin-top:12px;">FOLLOWING</div>
        ${s.following.map(f => `<div class="lb-row"><span>↗ ${f}</span><span class="mono-dim">Following</span></div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('save-bio-btn').onclick = () => {
    s.bio = document.getElementById('bio-input').value.trim() || s.bio;
    window.saveZynk();
    renderSocial();
  };

  document.getElementById('add-friend-btn').onclick = () => {
    const name = document.getElementById('add-friend-input').value.trim();
    if (!name || s.friends.includes(name)) return;
    s.friends.push(name);
    if (!s.following.includes(name)) s.following.push(name);
    window.saveZynk();
    renderSocial();
  };
}

const ACHIEVEMENTS = [
  { id: 'boot', title: 'First Boot', desc: 'Initialize ZynkOS for the first time.', reward: 100 },
  { id: 'chatter', title: 'Grid Communicator', desc: 'Send a message in Zynk Chat.', reward: 150 },
  { id: 'spender', title: 'Vault Collector', desc: 'Unlock an item in the Zynk Store.', reward: 200 },
  { id: 'social', title: 'Network Builder', desc: 'Add a friend to your ZynkOS network.', reward: 250 },
  { id: 'apex', title: 'Rank Climber', desc: 'Upgrade your ZynkOS Rank tier.', reward: 400 }
];

function renderAchievements() {
  const grid = document.getElementById('achieve-grid');
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const done = window.zynkState.claimed.includes(a.id);
    const card = document.createElement('div');
    card.className = 'glass-card item-card';
    card.innerHTML = `
      <div><span class="mono-dim" style="color:#10b981">+${a.reward} Z-CREDITS</span><h4 style="margin-top:4px">${a.title}</h4><p class="sub-text">${a.desc}</p></div>
      <button class="btn-neon" ${done ? 'disabled style="opacity:0.5"' : ''}>${done ? 'Claimed ✓' : 'Claim'}</button>
    `;
    card.querySelector('button').onclick = () => {
      if (done) return;
      window.zynkState.claimed.push(a.id);
      window.zynkState.credits += a.reward;
      window.zynkState.xp += 300;
      window.saveZynk();
      renderAchievements();
    };
    grid.appendChild(card);
  });
}

const lb = document.getElementById('leaderboard-list');
[
  { name: window.zynkState.username, credits: window.zynkState.credits },
  { name: 'CyberNova', credits: 680 },
  { name: 'VexOperator', credits: 490 },
  { name: 'ShadowByte', credits: 310 }
].sort((a, b) => b.credits - a.credits).forEach((u, i) => {
  lb.innerHTML += `<div class="lb-row"><span><strong>#${i + 1}</strong> ${u.name}</span><span class="mono-dim">${u.credits} Z-Credits</span></div>`;
});

renderSocial();
renderAchievements();
