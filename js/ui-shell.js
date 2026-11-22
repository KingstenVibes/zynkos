const root = document.getElementById('zynk-root');
function mk(tag, cls, html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const authModal = mk('div', 'startup-gate', `
  <div class="glass-card startup-box">
    <div class="brand-logo" style="margin:0 auto 8px;width:46px;height:46px;font-size:1.4rem;">Z</div>
    <h2 id="auth-title" style="text-align:center;">ZynkOS // System Access</h2>
    <p class="sub-text" style="text-align:center;">Sign in or create an account to boot.</p>
    <input id="auth-user" class="tool-input hidden" placeholder="Username (e.g. UserName)" />
    <input id="auth-email" class="tool-input" type="email" placeholder="Email Address" />
    <input id="auth-pass" class="tool-input" type="password" placeholder="Password (6+ chars)" />
    <label class="remember-row"><input type="checkbox" id="remember-me" checked /><span>Remember me</span></label>
    <button id="auth-submit-btn" class="btn-neon" style="width:100%">Boot Into ZynkOS</button>
    <button id="auth-toggle-btn" class="btn-outline" style="width:100%">Need an account? Switch to Create Account</button>
    <button id="auth-close-btn" class="btn-ghost">Continue as Guest</button>
  </div>
`);
authModal.id = 'auth-modal';

const userModal = mk('div', 'modal-backdrop hidden', '<div class="glass-card profile-modal" id="user-modal-content"></div>');
userModal.id = 'user-modal';
const shell = mk('div', 'os-shell');
const dock = mk('aside', 'left-dock', `
  <div class="dock-top">
    <img src="logo.png" alt="ZynkOS" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" />
    <span class="brand-title">ZynkOS</span>
    <button class="collapse-btn" id="toggle-dock">☰</button>
  </div>
  <div class="dock-section">CORE</div>
  <button class="dock-btn active" data-tab="home-view"><span class="sym">⌂</span><span class="lbl">Dashboard</span></button>
  <button class="dock-btn" data-tab="chat-view"><span class="sym">◈</span><span class="lbl">Zynk Chat</span></button>
  <button class="dock-btn" data-tab="vortex-view"><span class="sym">❖</span><span class="lbl">Vortex Guild</span></button>
  <button class="dock-btn" data-tab="game-view"><span class="sym">▶</span><span class="lbl">UGS Arcade</span></button>
  <button class="dock-btn" data-tab="ranks-view"><span class="sym">▲</span><span class="lbl">Ranks</span></button>
  <button class="dock-btn" data-tab="store-view"><span class="sym">⊞</span><span class="lbl">Zynk Store</span></button>
  <div class="dock-section">SOCIAL</div>
  <button class="dock-btn" data-tab="profile-view"><span class="sym">◉</span><span class="lbl">My Profile</span></button>
  <button class="dock-btn" data-tab="achieve-view"><span class="sym">★</span><span class="lbl">Achievements</span></button>
  <button class="dock-btn" data-tab="leader-view"><span class="sym">≡</span><span class="lbl">Leaderboards</span></button>
  <button class="dock-btn" data-tab="tools-view"><span class="sym">⌘</span><span class="lbl">Utility Tools</span></button>
  <div class="dock-section">ACCESS</div>
  <button class="dock-btn hidden" id="nav-beta-btn" data-tab="beta-view"><span class="sym">⚛</span><span class="lbl">Beta Lab</span></button>
  <button class="dock-btn hidden" id="nav-admin-btn" data-tab="admin-view"><span class="sym">⚡</span><span class="lbl">Founder Panel</span></button>
  <button class="dock-btn" data-tab="settings-view"><span class="sym">⚙</span><span class="lbl">Settings</span></button>
  <div class="dock-footer" onclick="openTab('settings-view')">
    <div class="dock-clock"><span id="dock-hr">10</span>:<span id="dock-min">14</span></div>
    <span class="lbl clock-sub">Local Time</span>
  </div>
`);
dock.id = 'left-dock';
const stage = mk('main', 'center-stage', `
  <section id="home-view" class="tab-view active">
    <div class="hero-stage"><canvas id="wireframe-bg"></canvas>
      <div class="hero-clock-overlay">
        <div class="hero-day" id="hero-day">SATURDAY</div>
        <div class="hero-time-row"><span class="hero-time" id="hero-time">10:14</span><span class="hero-ampm" id="hero-ampm">PM</span></div>
        <div class="hero-date" id="hero-date">11.21.26</div>
        <button class="tz-hint" onclick="openTab('settings-view')"><span id="current-tz-label">Local Time</span> • Change in Settings ↗</button>
      </div>
    </div>
    <div class="bento-wrapper">
      <div class="status-bar"><span><i class="dot-emerald"></i> ZynkOS Network Live</span><div style="display:flex;gap:10px;align-items:center;"><span class="mono-dim" id="status-tz">TZ: Auto</span><button class="btn-outline" id="top-auth-btn" style="padding:4px 10px;font-size:0.74rem;">Sign Out</button></div></div>
      <div class="bento-grid">
        <div class="glass-card"><div class="profile-top"><div class="user-block"><img id="hud-avatar-img" class="avatar-img" src="https://dicebear.com" /><div><div class="hello-tag" id="hud-role-tag">[GUEST] • [CIRCUIT]</div><h2 class="username" id="hud-username">Guest Operator</h2><div class="badges-row"><span class="pill" id="hud-credits">0 Z-Credits</span><span class="pill" id="hud-rank-pill">Rank: Circuit</span></div></div></div><button class="btn-outline" onclick="openTab('profile-view')">Edit Profile</button></div><div class="level-box"><div class="level-header"><span>NEURAL SYNC LEVEL</span><span class="mono-dim" id="hud-xp-text">0 / 1,000 XP</span></div><div class="level-num" id="hud-lvl">◈ LEVEL 1</div><div class="xp-track"><div class="xp-fill" id="hud-xp-bar" style="width:0%"></div></div></div></div>
        <div class="glass-card"><h3>ZynkOS Feed</h3><div class="sub-label">SYSTEM BROADCASTS</div><div class="announce-item featured"><strong>ZYNKOS v2.0 ONLINE ⚡</strong><p>Native Zynk Chat, Vortex Guild, UGS HTML Arcade, Founder Panel & Beta Lab are live.</p></div></div>
      </div>
    </div>
  </section>
  <section id="chat-view" class="tab-view"><div class="native-chat-layout"><div class="native-chat-main"><div class="view-topbar"><div><h2># zynk-global</h2><p class="sub-text">Type <code>/help</code> for ZynkBot, Mod & Founder commands</p></div><span class="credit-pill" id="chat-credits">0 Z-Credits</span></div><div class="native-messages" id="native-messages"></div><form class="native-input-row" id="native-chat-form"><input id="native-msg-input" placeholder="Message #zynk-global..." autocomplete="off" /><button type="submit" class="btn-neon">Send</button></form></div><aside class="member-sidebar" id="member-sidebar"></aside></div></section>
  <section id="vortex-view" class="tab-view"><div style="flex:1;width:100%;height:100%" id="vortex-slot"></div></section>
  <section id="game-view" class="tab-view"><div id="custom-game-container" style="flex:1;display:flex;flex-direction:column;"></div></section>
  <section id="ranks-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Ranks</h2></div><button class="btn-neon" id="claim-monthly-btn">Claim Monthly Stipend</button></div><div class="cards-grid" id="ranks-grid"></div></section>
  <section id="store-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Zynk Store</h2></div><span class="credit-pill" id="store-credits">0 Z-Credits</span></div><div class="cards-grid" id="store-grid"></div></section>
  <section id="profile-view" class="tab-view padded-view"><div id="my-profile-container"></div></section>
  <section id="achieve-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Achievements</h2></div></div><div class="cards-grid" id="achieve-grid"></div></section>
  <section id="leader-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Global Leaderboards</h2></div></div><div class="glass-card" id="leaderboard-list"></div></section>
  <section id="tools-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Utility Tools</h2></div></div><div class="cards-grid" id="tools-grid"></div></section>
  <section id="beta-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>⚛ ZynkOS Beta Lab</h2></div></div><div class="cards-grid" id="beta-grid"></div></section>
  <section id="admin-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>⚡ Founder Developer Panel</h2></div></div><div id="admin-panel-container"></div></section>
  <section id="settings-view" class="tab-view padded-view"><div class="glass-card settings-card"><h2>System Settings</h2><div id="settings-controls"></div><div class="settings-actions"><button id="save-settings-btn" class="btn-neon">Save Preferences</button><button id="about-blank-btn" class="btn-outline">↗ Open in about:blank</button><span id="save-msg" class="save-msg"></span></div></div></section>
`);

shell.append(dock, stage);
root.append(authModal, userModal, shell);
