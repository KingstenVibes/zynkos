const vortexSlot = document.getElementById('vortex-slot');
if (vortexSlot) {
  vortexSlot.innerHTML = `
    <div style="margin:auto;max-width:460px;text-align:center;padding:32px;" class="glass-card">
      <h2 style="color:#10b981;margin-bottom:8px;">❖ ZynkOS Vortex Guild</h2>
      <p class="sub-text" style="margin-bottom:16px;">Vortex blocks direct iframe embedding, so launch your guild in a dedicated tab or stealth window.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a href="https://vortexos.net" target="_blank" class="btn-neon" style="text-decoration:none;">↗ Open Vortex Guild</a>
      </div>
    </div>`;
}

const gameBox = document.getElementById('custom-game-container');
if (gameBox) {
  gameBox.innerHTML = `
    <div style="margin:auto;text-align:center;padding:30px;color:#94a3b8;">
      <h2 style="color:#10b981;margin-bottom:8px;">UGS HTML Ultimate Games // Standby</h2>
      <p>Ready whenever you want to drop in your UGS single-file HTML games.</p>
    </div>`;
}
