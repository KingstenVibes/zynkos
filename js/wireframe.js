const canvas = document.getElementById('wireframe-bg');
const ctx = canvas.getContext('2d');
let angle = 0;

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resize);
resize();

function drawWireframe() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 1;
  const horizon = h * 0.52;

  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * 38, horizon);
    ctx.lineTo(w / 2 + i * 165, h);
    ctx.stroke();
  }
  for (let y = 0; y < 8; y++) {
    const py = horizon + Math.pow(y / 8, 1.7) * (h - horizon);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }

  const gx = w * 0.8;
  const gy = h * 0.55;
  const r = 105;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';

  for (let i = 0; i < 6; i++) {
    const lon = angle + (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.ellipse(gx, gy, Math.abs(Math.cos(lon)) * r, r, 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.38)';
  ctx.beginPath();
  ctx.ellipse(gx, gy, r * 1.38, r * 0.32, -0.2, 0, Math.PI * 2);
  ctx.stroke();

  angle += 0.006;
  requestAnimationFrame(drawWireframe);
}

drawWireframe();
