let uploadedItemImg = '';

function renderAdminAndBeta() {
  const p = window.userProfile;
  const adminBox = document.getElementById('admin-panel-container');
  const betaGrid = document.getElementById('beta-grid');

  if (betaGrid) {
    betaGrid.innerHTML = `
      <div class="glass-card">
        <span class="mono-dim" style="color:#06b6d4">EXPERIMENTAL BUILD v2.0</span>
        <h3 style="margin:6px 0">Neural Overclock Theme</h3>
        <p class="sub-text">Beta Tester exclusive UI accent preview and early FriendJam mechanics.</p>
        <button class="btn-neon" style="margin-top:12px" onclick="document.documentElement.style.setProperty('--neon-emerald','#22d3ee')">Activate Cyan Overclock</button>
      </div>
      <div class="glass-card">
        <span class="mono-dim" style="color:#10b981">BETA REWARD</span>
        <h3 style="margin:6px 0">Tester Stipend (+250 Z)</h3>
        <p class="sub-text">Test economy syncing before public release.</p>
        <button class="btn-neon" style="margin-top:12px" id="beta-bonus-btn">Claim Test Credits</button>
      </div>
    `;
    document.getElementById('beta-bonus-btn').onclick = async () => {
      if (!p) return;
      await window.sb.from('users').update({ credits: p.credits + 250 }).eq('id', p.id);
      await window.refreshMyProfile();
      alert('+250 Test Z-Credits added!');
    };
  }

  if (!adminBox || !p || p.role !== 'FOUNDER') return;

  adminBox.innerHTML = `
    <div class="bento-grid">
      <div class="glass-card">
        <h3>Add Store Item (No Code)</h3>
        <input id="adm-item-name" class="tool-input" placeholder="Item Name (e.g. Obsidian Crown)" />
        <label class="mono-dim">Upload Item Image (PNG/JPG/GIF)</label>
        <input id="adm-item-file" type="file" accept="image/*" class="tool-input" />
        <input id="adm-item-cost" type="number" class="tool-input" placeholder="Cost in Z-Credits (e.g. 250)" />
        <div style="display:flex;gap:8px;">
          <select id="adm-item-rarity" class="tool-input"><option>COMMON</option><option>RARE</option><option>EPIC</option><option>LEGENDARY</option></select>
          <select id="adm-item-role" class="tool-input"><option value="ANY">Any Role</option><option value="FOUNDER">Founder Only</option><option value="MODERATOR">Moderator+</option></select>
          <select id="adm-item-rank" class="tool-input"><option value="0">Any Rank</option><option value="1">Pulse+</option><option value="2">Nova+</option><option value="3">Apex Only</option></select>
        </div>
        <div style="display:flex;gap:8px;">
          <select id="adm-item-type" class="tool-input"><option value="badge">Chat/Level Badge</option><option value="color">Avatar Border Color</option></select>
          <input id="adm-item-val" class="tool-input" placeholder="Badge symbol (♛) or Hex (#06b6d4)" />
        </div>
        <button class="btn-neon" id="adm-add-item-btn">Publish to Store</button>
      </div>

      <div class="glass-card">
        <h3>Create Achievement & Grant Roles</h3>
        <input id="adm-ach-title" class="tool-input" placeholder="Achievement Title" />
        <input id="adm-ach-desc" class="tool-input" placeholder="Description" />
        <div style="display:flex;gap:8px;">
          <input id="adm-ach-cred" type="number" class="tool-input" placeholder="Z-Credits (e.g. 200)" />
          <input id="adm-ach-xp" type="number" class="tool-input" placeholder="XP (e.g. 300)" />
        </div>
        <button class="btn-neon" id="adm-add-ach-btn">Publish Achievement</button>

        <hr style="border-color:rgba(255,255,255,0.08);margin:16px 0;" />
        <h4>Grant Beta Tester / Role to User</h4>
        <input id="adm-target-user" class="tool-input" placeholder="Exact Username" />
        <div style="display:flex;gap:8px;">
          <select id="adm-target-role" class="tool-input"><option value="MEMBER">MEMBER</option><option value="MODERATOR">MODERATOR</option><option value="FOUNDER">FOUNDER</option></select>
          <select id="adm-target-beta" class="tool-input"><option value="true">Beta Tester: YES</option><option value="false">Beta Tester: NO</option></select>
        </div>
        <button class="btn-outline" id="adm-grant-btn">Update User Permissions</button>
      </div>
    </div>
  `;

  document.getElementById('adm-item-file').onchange = (e) => {
    const file = e.target.files;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (uploadedItemImg = reader.result);
    reader.readAsDataURL(file);
  };

  document.getElementById('adm-add-item-btn').onclick = async () => {
    const name = document.getElementById('adm-item-name').value.trim();
    const cost = parseInt(document.getElementById('adm-item-cost').value, 10) || 100;
    if (!name || !uploadedItemImg) return alert('Enter a name and upload an image!');
    await window.sb.from('store_items').insert({
      name,
      image_url: uploadedItemImg,
      rarity: document.getElementById('adm-item-rarity').value,
      cost,
      req_role: document.getElementById('adm-item-role').value,
      req_rank: parseInt(document.getElementById('adm-item-rank').value, 10),
      item_type: document.getElementById('adm-item-type').value,
      item_value: document.getElementById('adm-item-val').value.trim() || '★'
    });
    alert('Item published to Zynk Store!');
    window.dispatchEvent(new Event('zynk-store-refresh'));
  };

  document.getElementById('adm-add-ach-btn').onclick = async () => {
    const title = document.getElementById('adm-ach-title').value.trim();
    const description = document.getElementById('adm-ach-desc').value.trim();
    if (!title || !description) return alert('Fill out title and description.');
    await window.sb.from('achievements_list').insert({
      title,
      description,
      reward_credits: parseInt(document.getElementById('adm-ach-cred').value, 10) || 100,
      reward_xp: parseInt(document.getElementById('adm-ach-xp').value, 10) || 250
    });
    alert('Achievement published!');
    window.dispatchEvent(new Event('zynk-store-refresh'));
  };

  document.getElementById('adm-grant-btn').onclick = async () => {
    const target = document.getElementById('adm-target-user').value.trim();
    if (!target) return;
    await window.sb.from('users').update({
      role: document.getElementById('adm-target-role').value,
      is_beta: document.getElementById('adm-target-beta').value === 'true'
    }).ilike('username', target);
    alert(`Updated ${target}'s role & beta access!`);
  };
}

window.addEventListener('zynk-profile-updated', renderAdminAndBeta);
renderAdminAndBeta();
