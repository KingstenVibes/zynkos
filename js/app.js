document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.view).classList.add('active');
  });
});

const canvas = document.getElementById('arcade-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('arcade-score');
const hudStats = document.getElementById('hud-stats');

let player, bullets, score = 0, highScore = 0, loop, keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

document.getElementById('start-game-btn').addEventListener('click', () => {
  player = { x: 300, y: 310, r: 8, speed: 5 };
  bullets = [];
  score = 0;
  scoreDisplay.textContent = 'Score: 0';
  clearInterval(loop);
  loop = setInterval(tick, 1000 / 60);
});

function tick() {
  if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(10, player.x - player.speed);
  if (keys['ArrowRight'] || keys['d']) player.x = Math.min(590, player.x + player.speed);
  if (keys['ArrowUp'] || keys['w']) player.y = Math.max(10, player.y - player.speed);
  if (keys['ArrowDown'] || keys['s']) player.y = Math.min(350, player.y + player.speed);

  if (Math.random() < 0.16) {
    bullets.push({ x: Math.random() * 600, y: 0, vy: 3 + Math.random() * 3, r: 5 });
  }

  ctx.clearRect(0, 0, 600, 360);
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ec4899';
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.vy;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) {
      clearInterval(loop);
      if (score > highScore) {
        highScore = score;
        hudStats.textContent = `High Score: ${highScore}`;
      }
      alert(`Game Over! Score: ${score}`);
      return;
    }

    if (b.y > 360) {
      bullets.splice(i, 1);
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
    }
  }
}
