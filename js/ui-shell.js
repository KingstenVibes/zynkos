const root = document.getElementById('zynk-root');
const ic = window.ZYNK_ICONS || {};
function mk(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const authModal = mk('div', 'startup-gate', `
  <div class="glass-card startup-box">
    <img src="logo.png" alt="ZynkOS" style="width:52px;height:52px;margin:0 auto 10px;border-radius:12px;object-fit:cover;display:block;" />
    <h2 id="auth-title" style="text-align:center;">ZynkOS // System Access</h2>
    <p class="sub-text" style="text-align:center;margin-bottom:14px;">Sign in or create an account to boot.</p>
    <input id="auth-user" class="tool-input hidden" type="text" placeholder="Username (e.g. yourname)" />
    <input id="auth-email" class="tool-input" type="email" placeholder="Email Address" />
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
    <img src="logo.png" alt="ZynkOS" style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex-shrink:0;" />
    <span class="brand-title">ZynkOS</span>
    <button class="collapse-btn" id="toggle-dock" title="Expand / Collapse Sidebar">${ic.arrow || '▶'}</button>
  </div>
  <div class="dock-section">
    <button class="dock-btn active" data-tab="dash-view"><span class="sym">${ic.home}</span><span class="lbl">Dashboard</span></button>
    <button class="dock-btn" data-tab="chat-view"><span class="sym">${ic.chat}</span><span class="lbl">Zynk Chat</span></button>
    <button class="dock-btn" data-tab="vortex-view"><span class="sym">${ic.vortex}</span><span class="lbl">Vortex Guild</span></button>
    <button class="dock-btn" data-tab="arcade-view"><span class="sym">${ic.arcade}</span><span class="lbl">UGS Arcade</span></button>
    <button class="dock-btn" data-tab="ranks-view"><span class="sym">${ic.ranks}</span><span class="lbl">Ranks</span></button>
    <button class="dock-btn" data-tab="store-view"><span class="sym">${ic.store}</span><span class="lbl">Zynk Store</span></button>
  </div>
  <div class="dock-section">
    <button class="dock-btn" data-tab="profile-view"><span class="sym">${ic.profile}</span><span class="lbl">My Profile</span></button>
    <button class="dock-btn" data-tab="achieve-view"><span class="sym">${ic.quests}</span><span class="lbl">Quests</span></button>
    <button class="dock-btn" data-tab="leader-view"><span class="sym">${ic.leader}</span><span class="lbl">Leaderboards</span></button>
    <button class="dock-btn" data-tab="tools-view"><span class="sym">${ic.tools}</span><span class="lbl">Utility Tools</span></button>
    <button class="dock-btn" data-tab="browser-view"><span class="sym">${ic.browser}</span><span class="lbl">Zynk Browser</span></button>
    <button class="dock-btn" data-tab="support-view"><span class="sym">${ic.support}</span><span class="lbl">Support & Ideas</span></button>
    <button class="dock-btn hidden" id="nav-beta-btn" data-tab="beta-view"><span class="sym">${ic.beta}</span><span class="lbl">Beta Lab</span></button>
    <button class="dock-btn hidden" id="nav-admin-btn" data-tab="admin-view"><span class="sym">${ic.admin}</span><span class="lbl">Founder Panel</span></button>
    <button class="dock-btn" data-tab="settings-view"><span class="sym">${ic.settings}</span><span class="lbl">Settings</span></button>
  </div>
  <div class="dock-clock"><span id="dock-hr">12</span><span class="dock-sep">:</span><span id="dock-min">00</span></div>
`);
dock.id = 'left-dock';
const main = mk('main', 'main-viewport', `
  <section id="dash-view" class="tab-view active">
    <div class="hero-stage">
      <div class="hero-day" id="hero-day">SUNDAY</div>
      <div class="hero-time-row"><span id="hero-time">12:00</span><span class="hero-ampm" id="hero-ampm">PM</span></div>
      <div class="hero-date" id="hero-date">01.01.26</div>
      <div class="hero-tz" id="hero-tz">Local Time • Change in Settings</div>
    </div>
    <div class="dash-topbar">
      <div class="status-pill"><span class="pulse-dot"></span> ZynkOS Network Live</div>
      <div class="top-actions"><span class="mono-dim" id="tz-badge">TZ: Local</span><button class="btn-outline" id="top-auth-btn">Sign Out</button></div>
    </div>
    <div class="bento-grid">
      <div class="glass-card profile-card">
        <div class="profile-row">
          <img class="avatar-ring" id="hud-avatar-img" src="https://dicebear.com" alt="Avatar" />
          <div class="profile-meta">
            <div class="role-badge" id="hud-role-tag">[GUEST]</div>
            <h2 id="hud-username">Guest Operator</h2>
            <div class="stats-inline"><span id="hud-credits">0 Z-Credits</span> • <span id="hud-rank-pill">Rank: Circuit</span></div>
          </div>
          <button class="btn-outline" onclick="openTab('profile-view')">Edit Profile</button>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-labels"><span id="hud-lvl">LEVEL 1</span><span id="hud-xp-text">0 / 1,000 XP</span></div>
          <div class="xp-track"><div class="xp-fill" id="hud-xp-bar" style="width:0%"></div></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-head"><span>ZynkOS Feed</span><span class="mono-dim">SYSTEM BROADCASTS</span></div>
        <h3 style="margin-bottom:6px;">ZynkOS v2.0 ONLINE</h3>
        <p class="sub-text">Custom SVG icons, Zynk Browser, Support Hub, Daily Deals, Gifting, Quests, and Founder Upload Studio are live.</p>
      </div>
    </div>
  </section>

  <section id="chat-view" class="tab-view chat-layout">
    <div class="chat-main">
      <div class="view-topbar"><div><h2># zynk-global</h2><span class="sub-text">Type /help for ZynkBot, Mod & Founder commands</span></div><span class="pill" id="chat-credits">0 Z-Credits</span></div>
      <div class="chat-feed" id="chat-messages"></div>
      <form class="chat-input-bar" id="chat-form"><input type="text" id="chat-input" placeholder="Message #zynk-global..." autocomplete="off" /><button type="submit" class="btn-neon">Send</button></form>
    </div>
    <aside class="members-panel"><div class="members-head">ONLINE OPERATORS</div><div id="online-members-list"></div></aside>
  </section>

  <section id="vortex-view" class="tab-view full-embed"><div id="vortex-slot" style="width:100%;height:100%;display:flex;"></div></section>
  <section id="arcade-view" class="tab-view full-embed"><div id="custom-game-container" style="width:100%;height:100%;display:flex;"></div></section>
  <section id="ranks-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Ranks</h2><span class="sub-text">Unlock Pulse with Z-Credits or upgrade to higher tiers</span></div></div><div class="cards-grid" id="ranks-grid"></div></section>
  <section id="store-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Zynk Store</h2><span class="sub-text">Daily deals, avatars, frames, themes & gifting</span></div><span class="pill" id="store-credits">0 Z-Credits</span></div><div class="cards-grid" id="store-grid"></div></section>
  <section id="profile-view" class="tab-view padded-view"><div id="my-profile-container"></div></section>
  <section id="achieve-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Quests & Daily Rewards</h2><span class="sub-text">Complete quests and claim daily Z-Credits</span></div></div><div class="cards-grid" id="achieve-grid"></div></section>
  <section id="leader-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Global Leaderboards</h2><span class="sub-text">Top ZynkOS operators ranked by Z-Credits & XP</span></div></div><div class="glass-card" id="leaderboard-list"></div></section>
  <section id="tools-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Utility Tools</h2></div></div><div class="cards-grid" id="tools-grid"></div></section>
  <section id="browser-view" class="tab-view padded-view"><div id="browser-container" style="max-width:860px;margin:auto;width:100%;"></div></section>
  <section id="support-view" class="tab-view padded-view"><div id="support-container" style="max-width:860px;margin:auto;width:100%;"></div></section>
  <section id="beta-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>ZynkOS Beta Lab</h2><span class="sub-text">Experimental themes, HUD scale & tester rewards</span></div></div><div class="cards-grid" id="beta-grid"></div></section>
  <section id="admin-view" class="tab-view padded-view"><div class="view-topbar"><div><h2>Founder Command Panel</h2><span class="sub-text">Upload shop items, manage daily deals, requests & roles</span></div></div><div id="admin-panel-container"></div></section>
  <section id="settings-view" class="tab-view padded-view">
    <div class="glass-card settings-box">
      <h2>System Settings</h2>
      <div id="settings-controls"></div>
      <div class="settings-actions"><button class="btn-neon" id="save-settings-btn">Save Preferences</button><button class="btn-outline" id="about-blank-btn">Open in about:blank</button></div>
    </div>
  </section>
`);

shell.append(dock, main);
root.append(authModal, userModal, shell);
