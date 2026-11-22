// 1. Mount Vortex Guild Live Chat inside the Vortex Guild tab
const vortexSlot = document.getElementById('vortex-slot');
if (vortexSlot) {
  const vFrame = document.createElement('iframe');
  vFrame.src = 'https://vortexos.net';
  vFrame.title = 'ZynkOS Vortex Guild';
  vFrame.allow = 'clipboard-write';
  vFrame.style.cssText = 'width:100%;height:100%;border:none;';
  vortexSlot.appendChild(vFrame);
}

// 2. Clean Placeholder for UGS HTML Ultimate Games (Ready for later)
const gameBox = document.getElementById('custom-game-container');
if (gameBox) {
  gameBox.innerHTML = `
    <div style="margin:auto;text-align:center;padding:30px;color:#94a3b8;">
      <h2 style="color:#10b981;margin-bottom:8px;">UGS HTML Ultimate Games // Standby</h2>
      <p>Arcade module is wired up and ready whenever you want to add your UGS HTML game files.</p>
    </div>
  `;
}
