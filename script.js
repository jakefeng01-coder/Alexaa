// ---------- Date ----------
const todayEl = document.getElementById("today");
try {
  const d = new Date();
  todayEl.textContent = d.toLocaleDateString(undefined, { month:"long", day:"numeric", year:"numeric" });
} catch {}

// ---------- 3D Tilt Card (fancy) ----------
const card = document.getElementById("card");
let tiltRAF = null;

function onMove(e){
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;  // 0..1
  const y = (e.clientY - rect.top) / rect.height;  // 0..1
  const rx = (0.5 - y) * 10; // deg
  const ry = (x - 0.5) * 12;

  if (tiltRAF) cancelAnimationFrame(tiltRAF);
  tiltRAF = requestAnimationFrame(() => {
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-1px)`;
  });
}
function onLeave(){
  card.style.transform = `rotateX(0deg) rotateY(0deg) translateY(0px)`;
}
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseleave", onLeave);

// ---------- Buttons ----------
const yesBtn = document.getElementById("yes");
const noBtn  = document.getElementById("no");
const result = document.getElementById("result");
const again  = document.getElementById("again");

// Classy “No”: gently slides away within card area
let noDodges = 0;
function dodgeNo(){
  const wrap = document.querySelector(".stage");
  const bounds = wrap.getBoundingClientRect();
  const rect = noBtn.getBoundingClientRect();

  const pad = 16;
  const maxX = bounds.left + bounds.width - rect.width - pad;
  const minX = bounds.left + pad;
  const maxY = bounds.top + bounds.height - rect.height - pad;
  const minY = bounds.top + pad;

  const x = Math.random() * (maxX - minX) + minX;
  const y = Math.random() * (maxY - minY) + minY;

  noBtn.style.position = "fixed";
  noBtn.style.left = `${x}px`;
  noBtn.style.top  = `${y}px`;

  noDodges++;
  // after a few dodges, make it "more willing" by slowly drifting closer to Yes
  if (noDodges > 6) {
    noBtn.textContent = "Okay fine… 😳";
  }
}
noBtn.addEventListener("mouseenter", dodgeNo);
noBtn.addEventListener("touchstart", (e)=>{ e.preventDefault(); dodgeNo(); }, {passive:false});

yesBtn.addEventListener("click", ()=>{
  result.classList.remove("hidden");
  sparkleBurst(55);
});

// ---------- Music toggle ----------
const musicBtn = document.getElementById("musicBtn");
const music = document.getElementById("music");
const musicText = document.getElementById("musicText");

let musicOn = false;
musicBtn.addEventListener("click", async ()=>{
  musicOn = !musicOn;
  if (musicOn) {
    try { await music.play(); } catch {}
    musicText.textContent = "music: on";
  } else {
    music.pause();
    musicText.textContent = "music: off";
  }
});

again.addEventListener("click", ()=> sparkleBurst(45));

// ---------- Sparkles canvas (premium) ----------
const sparkCanvas = document.getElementById("sparkles");
const sctx = sparkCanvas.getContext("2d");
function resizeSpark(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  sparkCanvas.width = Math.floor(innerWidth * dpr);
  sparkCanvas.height = Math.floor(innerHeight * dpr);
  sparkCanvas.style.width = innerWidth + "px";
  sparkCanvas.style.height = innerHeight + "px";
  sctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resizeSpark);
resizeSpark();

const bursts = [];
function r(a,b){ return Math.random()*(b-a)+a; }

function sparkleBurst(n){
  const cx = innerWidth/2, cy = innerHeight/2;
  for(let i=0;i<n;i++){
    bursts.push({
      x: cx + r(-20,20),
      y: cy + r(-20,20),
      vx: r(-5.2,5.2),
      vy: r(-9.5,-3.8),
      g: r(0.14,0.22),
      life: r(55,90),
      size: r(1.4,2.8),
      tw: r(0,6.28),
      hue: r(325, 350) // pink-ish
    });
  }
}

function drawSpark(){
  sctx.clearRect(0,0,innerWidth,innerHeight);

  for(let i=bursts.length-1;i>=0;i--){
    const p = bursts[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.life -= 1;
    p.tw += 0.18;

    const a = Math.max(0, p.life/90);
    const twinkle = (Math.sin(p.tw)+1)/2;

    sctx.globalAlpha = a * (0.55 + twinkle*0.45);
    sctx.beginPath();
    sctx.arc(p.x, p.y, p.size + twinkle*1.8, 0, Math.PI*2);
    sctx.fillStyle = `hsla(${p.hue}, 90%, 70%, 1)`;
    sctx.shadowColor = `hsla(${p.hue}, 95%, 70%, .55)`;
    sctx.shadowBlur = 18;
    sctx.fill();

    // tiny star streak
    sctx.globalAlpha = a * 0.35;
    sctx.beginPath();
    sctx.moveTo(p.x, p.y);
    sctx.lineTo(p.x - p.vx*1.2, p.y - p.vy*1.2);
    sctx.strokeStyle = `hsla(${p.hue}, 90%, 78%, 1)`;
    sctx.lineWidth = 1;
    sctx.stroke();

    if (p.life <= 0) bursts.splice(i,1);
  }

  requestAnimationFrame(drawSpark);
}
drawSpark();

// ---------- Bokeh background ----------
const bokeh = document.getElementById("bokeh");
const bctx = bokeh.getContext("2d");

function resizeBokeh(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  bokeh.width = Math.floor(innerWidth * dpr);
  bokeh.height = Math.floor(innerHeight * dpr);
  bokeh.style.width = innerWidth + "px";
  bokeh.style.height = innerHeight + "px";
  bctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resizeBokeh);
resizeBokeh();

const blobs = Array.from({length: 18}, () => ({
  x: r(0, innerWidth),
  y: r(0, innerHeight),
  rad: r(60, 150),
  vx: r(-0.15, 0.15),
  vy: r(-0.12, 0.12),
  a: r(0.06, 0.14)
}));

function drawBokeh(){
  bctx.clearRect(0,0,innerWidth,innerHeight);
  for(const b of blobs){
    b.x += b.vx; b.y += b.vy;
    if (b.x < -200) b.x = innerWidth + 200;
    if (b.x > innerWidth + 200) b.x = -200;
    if (b.y < -200) b.y = innerHeight + 200;
    if (b.y > innerHeight + 200) b.y = -200;

    const g = bctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rad);
    g.addColorStop(0, `rgba(255,123,191,${b.a})`);
    g.addColorStop(0.55, `rgba(255,154,213,${b.a*0.55})`);
    g.addColorStop(1, `rgba(255,255,255,0)`);
    bctx.fillStyle = g;
    bctx.beginPath();
    bctx.arc(b.x, b.y, b.rad, 0, Math.PI*2);
    bctx.fill();
  }
  requestAnimationFrame(drawBokeh);
}
drawBokeh();

// ---------- Petals ----------
const petals = document.getElementById("petals");
const pctx = petals.getContext("2d");
function resizePetals(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  petals.width = Math.floor(innerWidth * dpr);
  petals.height = Math.floor(innerHeight * dpr);
  petals.style.width = innerWidth + "px";
  petals.style.height = innerHeight + "px";
  pctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resizePetals);
resizePetals();

const pet = Array.from({length: 28}, () => ({
  x: r(0, innerWidth),
  y: r(-innerHeight, 0),
  s: r(10, 22),
  vx: r(-0.35, 0.35),
  vy: r(0.35, 0.95),
  rot: r(0, 6.28),
  vr: r(-0.02, 0.02),
  a: r(0.18, 0.35)
}));

function drawPetal(x,y,s,rot,a){
  pctx.save();
  pctx.translate(x,y);
  pctx.rotate(rot);
  pctx.globalAlpha = a;

  const g = pctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, "rgba(255,154,213,.95)");
  g.addColorStop(1, "rgba(255,209,234,.92)");
  pctx.fillStyle = g;
  pctx.shadowColor = "rgba(255,123,191,.18)";
  pctx.shadowBlur = 18;

  pctx.beginPath();
  pctx.moveTo(0, -s*0.6);
  pctx.bezierCurveTo(s*0.75, -s*0.2, s*0.55, s*0.9, 0, s*0.9);
  pctx.bezierCurveTo(-s*0.55, s*0.9, -s*0.75, -s*0.2, 0, -s*0.6);
  pctx.closePath();
  pctx.fill();

  pctx.restore();
}

function tickPetals(){
  pctx.clearRect(0,0,innerWidth,innerHeight);
  for(const f of pet){
    f.x += f.vx;
    f.y += f.vy;
    f.rot += f.vr;

    if (f.y > innerHeight + 40){
      f.y = -60;
      f.x = r(0, innerWidth);
    }
    if (f.x < -60) f.x = innerWidth + 60;
    if (f.x > innerWidth + 60) f.x = -60;

    drawPetal(f.x, f.y, f.s, f.rot, f.a);
  }
  requestAnimationFrame(tickPetals);
}
tickPetals();
