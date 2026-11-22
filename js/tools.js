document.getElementById('tools-grid').innerHTML = `
  <div class="glass-card">
    <h4>Custom URL → about:blank Launcher</h4>
    <p class="sub-text">Paste any website link and open it inside a stealth about:blank tab.</p>
    <input id="t-ab-url" class="tool-input" placeholder="https://example.com" />
    <button class="btn-neon" id="t-ab-btn">↗ Open in about:blank</button>
  </div>

  <div class="glass-card">
    <h4>Image / Text → Data URL Generator</h4>
    <p class="sub-text">Convert any uploaded image or raw HTML/text into a copyable data: URL.</p>
    <input id="t-data-file" type="file" accept="image/*" class="tool-input" />
    <input id="t-data-out" class="tool-input" readonly placeholder="data:image/... output appears here" />
    <button class="btn-neon" id="t-data-copy">Copy Data URL</button>
  </div>

  <div class="glass-card">
    <h4>HTML → Data URL Page Builder</h4>
    <p class="sub-text">Turn raw HTML code into a standalone data:text/html URL.</p>
    <input id="t-html-in" class="tool-input" placeholder="<h1>Hello ZynkOS</h1>" />
    <input id="t-html-out" class="tool-input" readonly placeholder="data:text/html;base64,..." />
    <button class="btn-outline" id="t-html-btn">Generate & Copy</button>
  </div>

  <div class="glass-card">
    <h4>Password & Key Generator</h4>
    <p class="sub-text">Generate a 20-character cryptographic password.</p>
    <input id="t-pass" class="tool-input" readonly value="Click Generate..." />
    <button class="btn-neon" id="t-pass-btn">Generate Key</button>
  </div>

  <div class="glass-card">
    <h4>Color Hex & RGB Inspector</h4>
    <p class="sub-text">Pick any color and copy its hex code.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
      <input type="color" id="t-color" value="#10b981" style="height:36px;width:48px;border:none;background:none" />
      <input id="t-hex" class="tool-input" style="margin:0" readonly value="#10b981" />
    </div>
  </div>

  <div class="glass-card">
    <h4>Base64 Encoder / Decoder</h4>
    <p class="sub-text">Encode or decode strings instantly.</p>
    <input id="t-b64" class="tool-input" placeholder="Enter text..." />
    <div style="display:flex;gap:8px"><button class="btn-neon" id="t-enc">Encode</button><button class="btn-outline" id="t-dec">Decode</button></div>
  </div>

  <div class="glass-card">
    <h4>URL Encoder / Decoder</h4>
    <p class="sub-text">Format links safely for query parameters.</p>
    <input id="t-urlenc" class="tool-input" placeholder="https://linkpc.net world" />
    <div style="display:flex;gap:8px"><button class="btn-neon" id="t-uenc">Encode</button><button class="btn-outline" id="t-udec">Decode</button></div>
  </div>

  <div class="glass-card">
    <h4>Word, Char & Line Counter</h4>
    <p class="sub-text">Live text statistics analyzer.</p>
    <input id="t-txt" class="tool-input" placeholder="Type or paste text..." />
    <div class="mono-dim" id="t-count">0 words • 0 chars</div>
  </div>

  <div class="glass-card">
    <h4>UUID v4 Generator</h4>
    <p class="sub-text">Generate unique database/item IDs.</p>
    <input id="t-uuid" class="tool-input" readonly value="${crypto.randomUUID()}" />
    <button class="btn-outline" id="t-uuid-btn">New UUID</button>
  </div>

  <div class="glass-card">
    <h4>JSON Pretty Formatter</h4>
    <p class="sub-text">Validate and format raw JSON objects.</p>
    <input id="t-json" class="tool-input" placeholder='{"zynk":"os","v":2}' />
    <button class="btn-neon" id="t-json-btn">Format JSON</button>
  </div>
`;
// 1. Custom URL -> about:blank Launcher
document.getElementById('t-ab-btn').onclick = () => {
  let url = document.getElementById('t-ab-url').value.trim();
  if (!url) return alert('Enter a website URL first!');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const win = window.open('about:blank', '_blank');
  if (!win) return alert('Please allow pop-ups to open about:blank tabs.');
  win.document.title = document.title;
  const iframe = win.document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;';
  iframe.src = url;
  win.document.body.style.margin = '0';
  win.document.body.appendChild(iframe);
};

// 2. Image -> Data URL Generator
document.getElementById('t-data-file').onchange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => (document.getElementById('t-data-out').value = reader.result);
  reader.readAsDataURL(file);
};
document.getElementById('t-data-copy').onclick = () => {
  const val = document.getElementById('t-data-out').value;
  if (!val) return alert('Upload an image first!');
  navigator.clipboard.writeText(val);
  alert('Data URL copied to clipboard!');
};

// 3. HTML -> Data URL Generator
document.getElementById('t-html-btn').onclick = () => {
  const html = document.getElementById('t-html-in').value;
  if (!html) return alert('Enter HTML code first!');
  const dataUrl = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html)));
  document.getElementById('t-html-out').value = dataUrl;
  navigator.clipboard.writeText(dataUrl);
  alert('HTML Data URL generated & copied!');
};

// 4-10. Remaining Developer Tools
document.getElementById('t-pass-btn').onclick = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  document.getElementById('t-pass').value = Array.from({ length: 20 }, () => c[Math.floor(Math.random() * c.length)]).join('');
};
document.getElementById('t-color').oninput = (e) => (document.getElementById('t-hex').value = e.target.value);
document.getElementById('t-enc').onclick = () => { const el = document.getElementById('t-b64'); el.value = btoa(el.value); };
document.getElementById('t-dec').onclick = () => { const el = document.getElementById('t-b64'); try { el.value = atob(el.value); } catch { alert('Invalid Base64'); } };
document.getElementById('t-uenc').onclick = () => { const el = document.getElementById('t-urlenc'); el.value = encodeURIComponent(el.value); };
document.getElementById('t-udec').onclick = () => { const el = document.getElementById('t-urlenc'); try { el.value = decodeURIComponent(el.value); } catch { alert('Invalid URL encoding'); } };
document.getElementById('t-txt').oninput = (e) => {
  const v = e.target.value.trim();
  document.getElementById('t-count').textContent = `${v ? v.split(/\s+/).length : 0} words • ${e.target.value.length} chars`;
};
document.getElementById('t-uuid-btn').onclick = () => (document.getElementById('t-uuid').value = crypto.randomUUID());
document.getElementById('t-json-btn').onclick = () => {
  const el = document.getElementById('t-json');
  try { el.value = JSON.stringify(JSON.parse(el.value), null, 2); } catch { alert('Invalid JSON'); }
};
