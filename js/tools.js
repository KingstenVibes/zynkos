document.getElementById('tools-grid').innerHTML = `
  <div class="glass-card">
    <h4>Password Generator</h4>
    <p class="sub-text">Generate a 16-character secure key.</p>
    <input id="t-pass" class="tool-input" readonly value="Click Generate..." />
    <button class="btn-neon" id="t-pass-btn">Generate</button>
  </div>
  <div class="glass-card">
    <h4>Color Hex Inspector</h4>
    <p class="sub-text">Pick a color and copy its hex code.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
      <input type="color" id="t-color" value="#10b981" style="height:36px;width:48px;border:none;background:none" />
      <input id="t-hex" class="tool-input" style="margin:0" readonly value="#10b981" />
    </div>
  </div>
  <div class="glass-card">
    <h4>Base64 Encoder / Decoder</h4>
    <p class="sub-text">Encode or decode text strings.</p>
    <input id="t-b64" class="tool-input" placeholder="Enter text..." />
    <div style="display:flex;gap:8px">
      <button class="btn-neon" id="t-enc">Encode</button>
      <button class="btn-outline" id="t-dec">Decode</button>
    </div>
  </div>
  <div class="glass-card">
    <h4>Text & Word Counter</h4>
    <p class="sub-text">Count characters and words instantly.</p>
    <input id="t-txt" class="tool-input" placeholder="Type or paste text..." />
    <div class="mono-dim" id="t-count">0 words • 0 chars</div>
  </div>
`;

document.getElementById('t-pass-btn').onclick = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  document.getElementById('t-pass').value = Array.from({ length: 16 }, () => c[Math.floor(Math.random() * c.length)]).join('');
};
document.getElementById('t-color').oninput = (e) => (document.getElementById('t-hex').value = e.target.value);
document.getElementById('t-enc').onclick = () => {
  const el = document.getElementById('t-b64');
  el.value = btoa(el.value);
};
document.getElementById('t-dec').onclick = () => {
  const el = document.getElementById('t-b64');
  try { el.value = atob(el.value); } catch { alert('Invalid Base64 text'); }
};
document.getElementById('t-txt').oninput = (e) => {
  const v = e.target.value.trim();
  const words = v ? v.split(/\s+/).length : 0;
  document.getElementById('t-count').textContent = `${words} words • ${e.target.value.length} chars`;
};
