// 1. ZYNK BROWSER (Built-In DuckDuckGo Search Page)
const bBox = document.getElementById('browser-container');
if (bBox) {
  bBox.innerHTML = `
    <div class="glass-card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span style="font-size:1.5rem;">🦆</span>
        <div><h2 style="margin:0;">Zynk Browser // DuckDuckGo Engine</h2><p class="sub-text">Instant private answers inside ZynkOS or launch full DuckDuckGo results.</p></div>
      </div>
      <form id="ddg-form" style="display:flex;gap:8px;flex-wrap:wrap;">
        <input id="ddg-query" class="tool-input" style="flex:1;margin:0;" placeholder="Search anything with DuckDuckGo..." autocomplete="off" />
        <button type="submit" class="btn-neon">Search</button>
        <button type="button" id="ddg-ext-btn" class="btn-outline">Full Results ↗</button>
      </form>
    </div>
    <div id="ddg-results"></div>`;

  const runSearch = async (q) => {
    const out = document.getElementById('ddg-results');
    if (!q) return;
    out.innerHTML = '<div class="glass-card"><p class="sub-text">Searching DuckDuckGo...</p></div>';
    try {
      const res = await fetch(`https://duckduckgo.com{encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
      const data = await res.json();
      const topics = (data.RelatedTopics || []).flatMap(t => t.Topics ? t.Topics : [t]).filter(t => t.Text && t.FirstURL).slice(0, 8);
      out.innerHTML = `
        ${data.AbstractText ? `<div class="glass-card" style="margin-bottom:12px;border-color:#10b981;"><span class="rarity-tag">INSTANT ANSWER</span><h3>${data.Heading || q}</h3><p class="sub-text" style="margin:8px 0;">${data.AbstractText}</p>${data.AbstractURL ? `<a href="${data.AbstractURL}" target="_blank" class="btn-outline" style="text-decoration:none;display:inline-block;">Read Source ↗</a>` : ''}</div>` : ''}
        ${topics.map(t => `<div class="glass-card" style="margin-bottom:10px;"><a href="${t.FirstURL}" target="_blank" style="color:#10b981;font-weight:700;text-decoration:none;">${t.Text.split(' - ').at(0)} ↗</a><p class="sub-text" style="margin-top:4px;">${t.Text}</p></div>`).join('')}
        <div class="glass-card" style="text-align:center;"><p class="sub-text" style="margin-bottom:10px;">Want full web, image, and video results for <strong>"${q}"</strong>?</p><a href="https://duckduckgo.com{encodeURIComponent(q)}" target="_blank" class="btn-neon" style="text-decoration:none;">Open Full DuckDuckGo Page ↗</a></div>`;
    } catch {
      out.innerHTML = `<div class="glass-card" style="text-align:center;"><p class="sub-text" style="margin-bottom:10px;">Instant preview unavailable on this network—open full DuckDuckGo results directly:</p><a href="https://duckduckgo.com{encodeURIComponent(q)}" target="_blank" class="btn-neon" style="text-decoration:none;">Open DuckDuckGo for "${q}" ↗</a></div>`;
    }
  };

  document.getElementById('ddg-form').onsubmit = (e) => { e.preventDefault(); runSearch(document.getElementById('ddg-query').value.trim()); };
  document.getElementById('ddg-ext-btn').onclick = () => {
    const q = document.getElementById('ddg-query').value.trim();
    window.open(q ? `https://duckduckgo.com{encodeURIComponent(q)}` : 'https://duckduckgo.com', '_blank');
  };
}

// 2. SUPPORT, BUGS & IDEAS PAGE
async function renderSupportPage() {
  const sBox = document.getElementById('support-container');
  if (!sBox || !window.sbRest) return;
  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const tickets = await window.sbRest('support_tickets?order=id.desc').catch(() => []);

  sBox.innerHTML = `
    <div class="glass-card" style="margin-bottom:18px;">
      <h2>🎫 Support, Bug Reports & Feature Ideas</h2>
      <p class="sub-text" style="margin-bottom:12px;">Need help, found a bug, or have an idea for ZynkOS? Submit it below and the Founder can reply directly.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="sup-cat" class="tool-input" style="max-width:190px;"><option value="💡 Feature Idea">💡 Feature Idea</option><option value="🐛 Bug Report">🐛 Bug Report</option><option value="🛟 Account Support">🛟 Account Support</option></select>
        <input id="sup-subj" class="tool-input" style="flex:1;" placeholder="Short title (e.g. Add Snake to UGS Arcade)" />
      </div>
      <textarea id="sup-desc" class="tool-input" rows="3" placeholder="Describe your idea, bug, or question..."></textarea>
      <button id="sup-submit-btn" class="btn-neon">Submit Ticket / Idea</button>
    </div>
    <h3 style="margin-bottom:10px;color:#10b981;">Community Tickets & Ideas (${(tickets || []).length})</h3>
    ${(tickets || []).map(t => `
      <div class="glass-card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><span class="rarity-tag">${t.category} • ${t.status}</span> <strong>${t.subject}</strong> <span class="mono-dim">by @${t.username}</span></div>
          ${isFounder ? `<div style="display:flex;gap:6px;"><button class="btn-outline" data-reply-id="${t.id}">Reply</button><button class="btn-ghost" data-del-tic="${t.id}">✕</button></div>` : ''}
        </div>
        <p class="sub-text" style="margin-top:6px;">${t.details || ''}</p>
        ${t.founder_reply ? `<div style="margin-top:8px;padding:8px 12px;border-left:3px solid #10b981;background:rgba(16,185,129,0.08);border-radius:6px;"><strong>⚡ Founder Reply:</strong> ${t.founder_reply}</div>` : ''}
      </div>`).join('') || '<p class="sub-text">No tickets or ideas submitted yet.</p>'}`;

  document.getElementById('sup-submit-btn').onclick = async () => {
    if (!p) return window.notify('Sign in to submit a ticket or idea!', true);
    const subject = document.getElementById('sup-subj').value.trim();
    if (!subject) return window.notify('Enter a short title first.', true);
    await window.sbRest('support_tickets', 'POST', { username: p.username, category: document.getElementById('sup-cat').value, subject, details: document.getElementById('sup-desc').value.trim() }, window.authToken);
    window.notify('Submitted! Thank you for helping improve ZynkOS.');
    renderSupportPage();
  };

  sBox.querySelectorAll('[data-reply-id]').forEach(b => (b.onclick = async () => {
    const rep = prompt('Write your Founder reply (marks ticket as RESOLVED):');
    if (!rep) return;
    await window.sbRest(`support_tickets?id=eq.${b.dataset.replyId}`, 'PATCH', { founder_reply: rep, status: 'RESOLVED' }, window.authToken);
    window.notify('Reply posted!');
    renderSupportPage();
  }));

  sBox.querySelectorAll('[data-del-tic]').forEach(b => (b.onclick = async () => {
    await window.sbRest(`support_tickets?id=eq.${b.dataset.delTic}`, 'DELETE', null, window.authToken);
    renderSupportPage();
  }));
}

window.addEventListener('zynk-profile-updated', renderSupportPage);
window.addEventListener('DOMContentLoaded', renderSupportPage);
