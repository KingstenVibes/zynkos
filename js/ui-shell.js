window.openTab = function(tabId) {
  if (!tabId) return;
  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const isBeta = p && (p.role === 'FOUNDER' || p.role === 'BETA' || p.is_beta || (p.extra_roles || []).includes('BETA'));
  if (tabId === 'admin-view' && !isFounder) return;
  if (tabId === 'beta-view' && !isBeta) return;

  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('active', v.id === tabId));
};

const root = document.getElementById('zynk-root');
const ic = window.ZYNK_ICONS || {};
function mk(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const halo = mk('div', '');
halo.id = 'mouse-halo';
document.addEventListener('mousemove', (e) => {
  halo.style.setProperty('--mx', e.clientX + 'px');
  halo.style.setProperty('--my', e.clientY + 'px');
});

const authModal = mk('div', 'startup-gate', `
  <div class="glass-card startup-box">
    <img src="logo.png" alt="ZynkOS" style="width:54px;height:54px;margin:0 auto 10px;border-radius:12px;object-fit:cover;display:block;" />
    <h2 id="auth-title" style="text-align:center;">ZynkOS // System Access</h2>
    <p class="sub-text" style="text-align:center;margin-bottom:14px;">Sign in with your username or email to boot.</p>
    <input id="auth-user" class="tool-input hidden" type="text" placeholder="Username (e.g. yourname)" />
    <input id="auth-email" class="tool-input" type="text" placeholder="Username or Email Address" />
    <input id="auth-pass" class="tool-input" type="password" placeholder="Password (6+ chars)" />
    <label class="remember-row"><input type="checkbox" id="remember-me" checked /><span>Remember me</span></label>
    <button class="btn-neon" id="auth-submit-btn" style="width:100%">Boot Into ZynkOS</button>
    <button class="btn-outline" id="auth-toggle-btn" style="width:100%;margin-top:8px;">Need an account? Switch to Create Account</button>
    <button class="btn-ghost" id="auth-close-btn" style="width:100%;margin-top:6px;">Continue as Guest</button>
  </div>
`);
authModal.id = 'auth-modal';

const userModal = mk('div', 'modal-backdrop hidden', `<div class="glass-card profile-modal" id="user-modal-content"></div>`);
userModal.id = 'user-modal';
const shell = mk('div', 'os-shell');
const dock = mk('aside', 'left-dock', `
  <div class="dock-top">
    <img src="logo.png" alt="ZynkOS" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;" />
    <span class="brand-title">ZynkOS</span>
    <button type="button" class="collapse-btn" id="toggle-dock" onclick="document.getElementById('left-dock').classList.toggle('expanded')" title="Expand / Collapse Sidebar">${ic.arrow || '▶'}</button>
  </div>
  <div class="dock-section">
    <button type="button" class="dock-btn active" data-tab="dash-view" onclick="openTab('dash-view')"><span class="sym">${ic.home || '⌂'}</span><span class="lbl">Dashboard</span></button>
    <button type="button" class="dock-btn" data-tab="chat-view" onclick="openTab('chat-view')"><span class="sym">${ic.chat || '💬'}</span><span class="lbl">Zynk Chat</span></button>
    <button type="button" class="dock-btn" data-tab="vortex-view" onclick="openTab('vortex-view')"><span class="sym">${ic.vortex || '❖'}</span><span class="lbl">Vortex Guild</span></button>
    <button type="button" class="dock-btn" data-tab="arcade-view" onclick="openTab('arcade-view')"><span class="sym">${ic.arcade || '🎮'}</span><span class="lbl">UGS Arcade</span></button>
    <button type="button" class="dock-btn" data-tab="ranks-view" onclick="openTab('ranks-view')"><span class="sym">${ic.ranks || '★'}</span><span class="lbl">Ranks</span></button>
    <button type="button" class="dock-btn" data-tab="store-view" onclick="openTab('store-view')"><span class="sym">${ic.store || '🛒'}</span><span class="lbl">Zynk Store</span></button>
  </div>
  <div class="dock-section">
    <button type="button" class="dock-btn" data-tab="profile-view" onclick="openTab('profile-view')"><span class="sym">${ic.profile || '👤'}</span><span class="lbl">My Profile & Vault</span></button>
    <button type="button" class="dock-btn" data-tab="achieve-view" onclick="openTab('achieve-view')"><span class="sym">${ic.quests || '🏆'}</span><span class="lbl">Quests</span></button>
    <button type="button" class="dock-btn" data-tab="leader-view" onclick="openTab('leader-view')"><span class="sym">${ic.leader || '📊'}</span><span class="lbl">Leaderboards</span></button>
    <button type="button" class="dock-btn" data-tab="tools-view" onclick="openTab('tools-view')"><span class="sym">${ic.tools || '⌘'}</span><span class="lbl">Utility Tools</span></button>
    <button type="button" class="dock-btn" data-tab="partners-view" onclick="openTab('partners-view')"><span class="sym">${ic.vortex || '🤝'}</span><span class="lbl">Partners</span></button>
    <button type="button" class="dock-btn" data-tab="credits-view" onclick="openTab('credits-view')"><span class="sym">${ic.ranks || '◈'}</span><span class="lbl">Credits & Team</span></button>
    <button type="button" class="dock-btn" data-tab="rules-view" onclick="openTab('rules-view')"><span class="sym">📜</span><span class="lbl">Rules & Terms</span></button>
    <button type="button" class="dock-btn hidden" id="nav-beta-btn" style="display:none;" data-tab="beta-view" onclick="openTab('beta-view')"><span class="sym">${ic.beta || '⚛'}</span><span class="lbl">Beta Lab</span></button>
    <button type="button" class="dock-btn hidden" id="nav-admin-btn" style="display:none;" data-tab="admin-view" onclick="openTab('admin-view')"><span class="sym">${ic.admin || '⚡'}</span><span class="lbl">Founder Panel</span></button>
    <button type="button" class="dock-btn" data-tab="settings-view" onclick="openTab('settings-view')"><span class="sym">${ic.settings || '⚙'}</span><span class="lbl">Settings</span></button>
  </div>
  <div class="dock-clock"><span id="dock-hr">12</span><span class="dock-sep">:</span><span id="dock-min">00</span></div>
`);
dock.id = 'left-dock';
const main = mk('main', 'main-viewport', `
  <section id="dash-view" class="tab-view active">
    <div class="dash-topbar">
      <div class="status-pill"><span class="pulse-dot"></span> ZynkOS Network Live</div>
      <div class="top-actions"><span class="mono-dim" id="tz-badge">Local Time</span><button class="btn-outline" id="top-auth-btn">Sign Out</button></div>
    </div>

    <div class="bento-grid" style="padding-bottom:10px;">
      <div class="glass-card profile-card" style="grid-column:span 2;">
        <div class="profile-row">
          <img class="avatar-ring" id="hud-avatar-img" src="logo.png" alt="Avatar" />
          <div class="profile-meta">
            <div id="hud-role-tag" class="badges-row" style="margin-bottom:4px;"></div>
            <h2 id="hud-username" style="font-size:1.45rem;">Guest Member</h2>
            <div class="stats-inline"><span id="hud-credits">0 Z-Credits</span> • <span id="hud-rank-pill">Rank: Circuit</span></div>
          </div>
          <button class="btn-outline" onclick="openTab('profile-view')">Edit Profile</button>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-labels"><span id="hud-lvl">LEVEL 1</span><span id="hud-xp-text">0 / 1,000 XP</span></div>
          <div class="xp-track"><div class="xp-fill" id="hud-xp-bar" style="width:0%"></div></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
          <button class="btn-neon" onclick="openTab('chat-view')">Open Zynk Chat</button>
          <button class="btn-outline" onclick="openTab('store-view')">Browse Zynk Store</button>
          <button class="btn-outline" onclick="openTab('achieve-view')">View Quests</button>
          <button class="btn-outline" onclick="openTab('leader-view')">Leaderboards</button>
        </div>
      </div>

      <div class="glass-card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;">
        <div class="hero-day" id="hero-day" style="font-size:0.8rem;">SUNDAY</div>
        <div class="hero-time-row"><span id="hero-time" style="font-size:3.1rem;">12:00</span><span class="hero-ampm" id="hero-ampm">PM</span></div>
        <div class="hero-date" id="hero-date" style="font-size:0.88rem;">01.01.26</div>
        <div class="hero-tz" id="hero-tz">Local Time • Change in Settings</div>
      </div>
    </div>

    <div class="bento-grid" style="padding-top:8px;">
      <div class="glass-card" style="display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div class="card-head"><span>🎁 Daily Member Stipend</span><span class="mono-dim">+150 Z-CREDITS</span></div>
          <p class="sub-text" style="margin-bottom:14px;">Claim your daily Z-Credit bonus every 24 hours to unlock Store gear.</p>
        </div>
        <button class="btn-neon" id="dash-daily-btn" style="width:100%;">Claim +150 Daily Z-Credits</button>
      </div>

      <div class="glass-card" style="grid-column:span 2;">
        <div class="card-head"><span>📢 System Announcements</span><span class="mono-dim">BROADCAST FEED</span></div>
        <div id="dash-announcements-list" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px;"></div>
      </div>
    </div>
  </section>

  <section id="chat-view" class="tab-view chat-layout">
    <div class="chat-main">
      <div class="view-topbar"><div><h2># zynk-global</h2><span class="sub-text">Type / for commands or @ to mention & ping a member</span></div><span class="pill" id="chat-credits">0 Z-Credits</span></div>
      <div class="chat-feed" id="chat-messages"></div>
      <div id="chat-ac-box" class="autocomplete-pop hidden"></div>
      <form class="chat-input-bar" id="chat-form"><input type="text" id="chat-input" placeholder="Message #zynk-global... (Type / or @)" autocomplete="off" /><button type="submit" class="btn-neon">Send</button></form>
    </div>
    <aside class="members-panel"><div class="members-head">ONLINE MEMBERS</div><div id="online-members-list"></div></aside>
  </section>

  <section id="vortex-view" class="tab-view full-embed" style="flex-direction:column;">
    <div class="view-topbar" style="padding:10px 20px;border-bottom:1px solid var(--border-glass);background:rgba(4,7,11,0.85);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="status-pill"><span class="pulse-dot"></span> Vortex Guild Live</span>
        <span class="mono-dim">Powered by <a href="https://vortexos.net" target="_blank" rel="noopener" style="color:var(--neon-emerald);text-decoration:none;font-weight:700;">VortexOS.net ↗</a></span>
      </div>
      <button type="button" class="btn-outline" style="padding:5px 12px;font-size:0.8rem;" onclick="window.open('https://vortexos.net')">Open Fullscreen ↗</button>
    </div>
    <iframe src="https://vortexos.net" title="VortexOS Guild Chat" allow="clipboard-read; clipboard-write" style="flex:1;width:100%;height:100%;border:none;background:#04070b;"></iframe>
  </section>

  <section id="arcade-view" class="tab-view full-embed"><div id="custom-game-container" style="width:100%;height:100%;display:flex;"></div></section>
  <section id="ranks-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Ranks</h2><span class="sub-text">Member ranks & perks</span></div></div><div id="ranks-grid"></div></section>
  <section id="store-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Zynk Store</h2><span class="sub-text">Daily deals, avatars, frames, themes & gifting</span></div><span class="pill" id="store-credits">0 Z-Credits</span></div><div id="store-grid"></div></section>
  <section id="profile-view" class="tab-view padded-view"><div id="my-profile-container"></div></section>
  <section id="achieve-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Quests & Daily Rewards</h2><span class="sub-text">Daily, Weekly & Secret challenges</span></div></div><div id="achieve-grid"></div></section>
  <section id="leader-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Global Leaderboards</h2><span class="sub-text">Top ZynkOS members ranked by Z-Credits & XP</span></div></div><div class="glass-card" id="leaderboard-list"></div></section>
  <section id="tools-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Utility Tools</h2></div></div><div class="cards-grid" id="tools-grid"></div></section>
  <section id="partners-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Partners</h2><span class="sub-text">The projects & communities we collaborate with</span></div></div><div id="partners-container"></div></section>
  <section id="credits-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Credits & Team</h2><span class="sub-text">Founders, developers, designers & contributors</span></div></div><div id="credits-container"></div></section>
  <section id="rules-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Rules, Privacy Policy & Terms</h2><span class="sub-text">Community guidelines, 13+ age requirement & platform policies</span></div></div><div id="rules-container"></div></section>
  <section id="beta-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Beta Lab</h2><span class="sub-text">Experimental themes, HUD scale & tester rewards</span></div></div><div class="cards-grid" id="beta-grid"></div></section>
  <section id="admin-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Founder Command Panel</h2><span class="sub-text">Broadcasts, store items, partners, team credits & roles</span></div></div><div id="admin-panel-container"></div></section>
  <section id="settings-view" class="tab-view padded-view"><div id="settings-shell"></div></section>
`);

shell.append(dock, main);
root.append(halo, authModal, userModal, shell);
