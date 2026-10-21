/* isi kartu diatur di index.html (window.KARTU); ini hanya nilai cadangan */
var DEF = { nama: "Sahabat", dari: "Temanmu", foto: "", caption: "", doa: "Semoga permintaanmu terkabul, {nama}.",
  hadiah: "Satu kejutan kecil untukmu.", pesan: ["Selamat ulang tahun, {nama}."], harapan: ["Sehat selalu", "Bahagia"] };
var CONFIG = window.KARTU || {};
for (var key in DEF) if (CONFIG[key] == null || (key !== "foto" && key !== "caption" && CONFIG[key] === "") || (key === "pesan" && !CONFIG.pesan.length)) CONFIG[key] = DEF[key];

/* lewat tautan: ...#Budi-Santoso  atau  ...#Budi-Santoso~Rina (nama~pengirim) */
try {
  var hp = decodeURIComponent(location.hash.slice(1)).split("~");
  if (hp[0].trim()) CONFIG.nama = hp[0].replace(/-/g, " ").trim();
  if (hp[1] && hp[1].trim()) CONFIG.dari = hp[1].replace(/-/g, " ").trim();
} catch (e) {}

var $ = function (id) { return document.getElementById(id); };
var scene = $("scene"), front = $("front"), seal = $("seal"), action = $("action"), hint = $("hint");
var stage = "intro", actionTimer = 0, sealTimer = 0;
var REDUCED = matchMedia("(prefers-reduced-motion:reduce)").matches;

function fill() {
  var n = CONFIG.nama;
  $("nm").textContent = n; $("forname").textContent = "untuk " + n; $("cap").textContent = (CONFIG.caption || n).replace("{nama}", n);
  $("initial").textContent = n.charAt(0).toUpperCase();
  $("doa").textContent = CONFIG.doa.replace("{nama}", n);
  $("letterName").textContent = n; $("letterMessage").textContent = CONFIG.hadiah; $("letterFrom").textContent = CONFIG.dari;
  $("msg").innerHTML = "";
  CONFIG.pesan.forEach(function (t, i) {
    var p = document.createElement("p"); p.className = "line"; p.style.setProperty("--i", i + 2);
    p.textContent = t.replace("{nama}", n); $("msg").appendChild(p);
  });
  var sg = $("sg"); sg.className = "sign line"; sg.style.setProperty("--i", CONFIG.pesan.length + 2);
  sg.textContent = "\u2013 " + CONFIG.dari;
  setPhoto(CONFIG.foto, n);
}
function setPhoto(src, n) {
  var ph = $("ph"); ph.classList.remove("loaded"); ph.style.backgroundImage = "";
  $("phTxt").textContent = n.charAt(0).toUpperCase();   /* tanpa foto: huruf awal nama sebagai pengganti */
  if (!src) return;
  var im = new Image();
  im.onload = function () { ph.style.backgroundImage = 'url("' + src + '")'; $("phTxt").textContent = ""; ph.classList.add("loaded"); };
  im.src = src;
}

/* ---------- kanvas efek: konfeti, kilau, kelopak ---------- */
var cv = $("fx"), cx = cv.getContext("2d"), parts = [], petals = [], running = false, petalsOn = false;
var DPR = Math.min(2, window.devicePixelRatio || 1), VW = innerWidth, VH = innerHeight;
function fit() {
  VW = innerWidth; VH = innerHeight;
  cv.width = VW * DPR; cv.height = VH * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
fit(); addEventListener("resize", fit);

var CONF = ["#ffffff", "#f6d9cc", "#e8b4a0", "#d98ca0", "#c9a46a", "#f9c9d8"];
function confetti(n, ox, oy, color) {
  var burst = !!color, cols = burst ? [color, "#fff4ee", color] : CONF;
  for (var i = 0; i < n; i++) {
    var a = -Math.PI / 2 + (Math.random() - .5) * (burst ? 6.28 : 1.7);
    var v = (burst ? 2 : 4.5) + Math.random() * (burst ? 4 : 7);
    parts.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 4 + Math.random() * 5, h: 2 + Math.random() * 2.5,
      round: Math.random() < .35, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - .5) * .25, l: 120 + Math.random() * 60 });
  }
  kick();
}
function lightBurst(ox, oy, n) {
  for (var i = 0; i < n; i++) {
    var l = 60 + Math.random() * 50;
    parts.push({ x: ox + (Math.random() - .5) * 8, y: oy + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 1.6, vy: -(.5 + Math.random() * 2.2),
      s: .9 + Math.random() * 1.8, l: l, l0: l, spark: 1 });
  }
  kick();
}

/* kelopak: dibentuk dengan kurva bezier, jatuh pelan sambil berputar */
var PCOL = ["255,214,226", "250,184,204", "244,163,187", "253,232,238", "248,200,214"];
function addPetal(y) {
  if (REDUCED) return;
  petals.push({ x: Math.random() * VW, y: y != null ? y : -24, s: 8 + Math.random() * 8, vy: .7 + Math.random() * .8,
    ph: Math.random() * 6.28, sw: .5 + Math.random() * .7, r: Math.random() * 6.28, vr: (Math.random() - .5) * .03,
    f: Math.random() * 6.28, vf: .025 + Math.random() * .03, c: PCOL[Math.floor(Math.random() * PCOL.length)], a: .55 + Math.random() * .35 });
}
function petalPath(s) {
  var L = s * 1.7, W = s;
  cx.beginPath(); cx.moveTo(0, -L / 2);
  cx.bezierCurveTo(W * .95, -L * .38, W * .7, L * .42, 0, L / 2);
  cx.bezierCurveTo(-W * .7, L * .42, -W * .95, -L * .38, 0, -L / 2);
  cx.closePath();
}
setInterval(function () { if (petalsOn && !document.hidden && petals.length < 14) { addPetal(); kick(); } }, 1100);

function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
function loop() {
  cx.clearRect(0, 0, VW, VH);
  parts = parts.filter(function (p) { return p.l > 0 && p.y < VH + 20; });
  petals = petals.filter(function (p) { return p.y < VH + 40; });

  petals.forEach(function (p) {
    p.y += p.vy; p.ph += .035; p.x += Math.sin(p.ph) * p.sw; p.r += p.vr; p.f += p.vf;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, .3 + .7 * Math.abs(Math.cos(p.f)));
    cx.globalAlpha = p.a; cx.fillStyle = "rgb(" + p.c + ")"; petalPath(p.s); cx.fill();
    cx.globalAlpha = p.a * .35; cx.fillStyle = "#fff"; cx.scale(.5, .55); petalPath(p.s); cx.fill();
    cx.restore();
  });

  parts.forEach(function (p) {
    p.x += p.vx; p.y += p.vy; p.l--;
    if (p.spark) {
      var al = p.l / p.l0;
      cx.fillStyle = "#ffe3d3";
      cx.globalAlpha = al * .85; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.3); cx.fill();
      cx.globalAlpha = al * .14; cx.beginPath(); cx.arc(p.x, p.y, p.s * 3.2, 0, 6.3); cx.fill();
      cx.globalAlpha = 1; return;
    }
    p.vy += .2; p.vx *= .987; p.r += p.vr;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.l / 40); cx.fillStyle = p.c;
    if (p.round) { cx.beginPath(); cx.arc(0, 0, p.w * .35, 0, 6.3); cx.fill(); } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cx.restore();
  });
  if (parts.length || petals.length || petalsOn) requestAnimationFrame(loop); else running = false;
}

/* gerak halus: pegas untuk sampul + paralaks yang di-lerp; loop berhenti saat diam */
var tgx = 0, tgy = 0, cgx = 0, cgy = 0, calm = false, co = 0, cvel = 0, coT = 0, coOn = false, mRun = false, mLast = 0, mKey = "";
function setCover() {
  scene.style.setProperty("--co", co.toFixed(4));
  scene.style.setProperty("--lf", (Math.sin(Math.PI * Math.min(1, Math.max(0, co))) * 18).toFixed(2));
}
function motion() { if (!mRun) { mRun = true; mLast = performance.now(); requestAnimationFrame(mStep); } }
function mStep(t) {
  var dt = Math.min(.05, (t - mLast) / 1000), busy = false; mLast = t;
  if (coOn) {
    var k = 12, c = 2 * Math.sqrt(k);
    cvel += ((coT - co) * k - cvel * c) * dt; co += cvel * dt;
    if (Math.abs(coT - co) < .0005 && Math.abs(cvel) < .003) { co = coT; cvel = 0; coOn = false; }
    setCover(); busy = coOn;
  }
  var kk = Math.min(1, dt * 5), ax = calm ? 0 : tgx, ay = calm ? 0 : tgy;
  cgx += (ax - cgx) * kk; cgy += (ay - cgy) * kk;
  var key = cgx.toFixed(3) + cgy.toFixed(3);
  if (key !== mKey) {
    mKey = key;
    $("par").style.setProperty("--ry", (cgx * 8).toFixed(2) + "deg"); $("par").style.setProperty("--rx", (-cgy * 6).toFixed(2) + "deg");
    var r = document.documentElement.style; r.setProperty("--px", (cgx * 2).toFixed(3)); r.setProperty("--py", (cgy * 2).toFixed(3));
  }
  if (Math.abs(ax - cgx) > .002 || Math.abs(ay - cgy) > .002) busy = true;
  if (busy) requestAnimationFrame(mStep); else mRun = false;
}

addEventListener("pointermove", function (e) {
  var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  calm = stage === "gift" || stage === "end"; tgx = x; tgy = y; motion();
  var r = document.documentElement.style;
  r.setProperty("--mx", (50 + x * 80) + "%"); r.setProperty("--my", (30 + y * 60) + "%");
});

/* ---------- suara (WebAudio, tanpa file) ---------- */
var ac, master, muted = false;
function initAudio() {
  if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (A) { ac = new A(); master = ac.createGain(); master.gain.value = .065; master.connect(ac.destination); } }
  if (ac && ac.state === "suspended") ac.resume();
}
function note(f, t, d, type) {
  if (!ac || muted) return;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = type || "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2, t + .035); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05);
}
function chime() { if (!ac || muted) return; var t = ac.currentTime; note(587.33, t, .7); note(783.99, t + .14, .85); }
function tickSnd() { if (ac && !muted) note(659.25, ac.currentTime, .12); }
function popSnd() { if (ac && !muted) note(739.99, ac.currentTime, .18); }
function musicBox() {
  if (!ac || muted) return;
  var t = ac.currentTime + .08, seq = [523.25, 659.25, 783.99];
  seq.forEach(function (f, i) { note(f, t + i * .2, .8); });
}
$("mute").onclick = function () {
  muted = !muted; this.setAttribute("aria-pressed", !muted);
  this.textContent = muted ? "Audio: mati" : "Audio: aktif";
  if (!muted) initAudio();
};

/* ---------- gelembung harapan ---------- */
var BCOL = ["#e8d4c4", "#d9c8b8", "#e2c4c7", "#eee3d4", "#d6c7c5", "#e7d6c8"], toastT = 0;
function toast(t) { var el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("show"); }, 2000); }
function spawnBalloon() {
  var box = $("balloons");
  if (document.hidden || box.children.length > 1) return;
  var b = document.createElement("button"), s = 28 + Math.random() * 22;
  b.className = "bl"; b.type = "button"; b.setAttribute("aria-label", "Gelembung harapan");
  b.style.cssText = "left:" + (4 + Math.random() * 88) + "%;width:" + s + "px;height:" + s + "px;--c:" + BCOL[Math.floor(Math.random() * BCOL.length)] +
    ";animation-duration:" + (20 + Math.random() * 10) + "s," + (4 + Math.random() * 2) + "s";
  b.addEventListener("pointerdown", function (e) {
    e.preventDefault(); initAudio(); var r = b.getBoundingClientRect(), col = b.style.getPropertyValue("--c").trim();
    confetti(8, r.left + r.width / 2, r.top + r.height / 2, col); lightBurst(r.left + r.width / 2, r.top + r.height / 2, 5); popSnd();
    toast(CONFIG.harapan[Math.floor(Math.random() * CONFIG.harapan.length)]); b.remove();
  });
  b.addEventListener("animationend", function (e) { if (e.animationName === "blUp") b.remove(); });
  box.appendChild(b);
}
if (!REDUCED) { setInterval(spawnBalloon, 7600); setTimeout(spawnBalloon, 1800); }

/* ---------- partikel cahaya yang membentuk nama ---------- */
var nfx = $("nfx"), nx = nfx.getContext("2d"), veil = $("veil"), veilSub = $("veilSub");
var NP = [], nRaf = 0, nStart = 0, nLast = 0, nCb = null, nVeilOff = false;
var T_DISP = 5.8, T_END = 8.2;   /* detik: mulai menghambur, selesai total */
var NCOL = ["#fffaf0", "#f5e5d0", "#e8c9bd", "#f1d9df"];

function nameTargets(text) {
  var fs = Math.min(150, VW * .2), maxW = VW * .86;
  var m = document.createElement("canvas").getContext("2d");
  m.font = "italic 500 " + fs + "px 'Cormorant Garamond', Georgia, serif";
  var tw = m.measureText(text).width;
  if (tw > maxW) { fs *= maxW / tw; tw = maxW; }
  var off = document.createElement("canvas"), o = off.getContext("2d");
  off.width = Math.ceil(tw + fs * .6); off.height = Math.ceil(fs * 1.8);
  o.font = "italic 500 " + fs + "px 'Cormorant Garamond', Georgia, serif"; o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#fff";
  o.fillText(text, off.width / 2, off.height / 2);
  var d = o.getImageData(0, 0, off.width, off.height).data, step = Math.max(2, Math.round(fs / 20)), pts, x, y;
  do {
    pts = [];
    for (y = 0; y < off.height; y += step) for (x = 0; x < off.width; x += step)
      if (d[(y * off.width + x) * 4 + 3] > 128) pts.push([x + (Math.random() - .5) * step * .6, y + (Math.random() - .5) * step * .6]);
    step++;
  } while (pts.length > 3200);
  var cy = VH * .46, x0 = (VW - off.width) / 2, y0 = cy - off.height / 2;
  for (var i = 0; i < pts.length; i++) { pts[i][0] += x0; pts[i][1] += y0; }
  return { pts: pts, fs: fs, cy: cy };
}
function nameFX(ox, oy, cb) {
  if (REDUCED) { cb(); return; }
  var go = function () {
    var T = nameTargets(CONFIG.nama), i, q, minX = 1e9, maxX = -1e9;
    nfx.width = VW * DPR; nfx.height = VH * DPR; nx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (i = 0; i < T.pts.length; i++) { q = T.pts[i][0]; if (q < minX) minX = q; if (q > maxX) maxX = q; }
    var span = Math.max(1, maxX - minX);
    NP = [];
    for (i = 0; i < T.pts.length; i++) {
      q = T.pts[i];
      NP.push({ tx: q[0], ty: q[1], x: ox + (Math.random() - .5) * 12, y: oy + (Math.random() - .5) * 12, vx: 0, vy: 0,
        d: Math.random() * .7, go: 0, dv: 0, ph: Math.random() * 6.28, s: .95 + Math.random() * .75,
        col: NCOL[Math.floor(Math.random() * NCOL.length)], out: (q[0] - minX) / span * .7 + Math.random() * .2,
        halo: i % 4 === 0, star: i % 37 === 0 });
    }
    veilSub.style.top = (T.cy + T.fs * .76) + "px";
    veil.classList.add("on");
    nStart = nLast = performance.now(); nCb = cb; nVeilOff = false;
    cancelAnimationFrame(nRaf); nRaf = requestAnimationFrame(nameLoop);
  };
  if (document.fonts && document.fonts.load) document.fonts.load("italic 500 64px 'Cormorant Garamond'", CONFIG.nama).then(go, go); else go();
}
function nameLoop(now) {
  var t = (now - nStart) / 1000, dt = Math.min(.033, (now - nLast) / 1000), i, p, a, u;
  nLast = now;
  nx.clearRect(0, 0, VW, VH); nx.globalCompositeOperation = "lighter";
  for (i = 0; i < NP.length; i++) {
    p = NP[i];
    if (t < p.d) continue;
    if (!p.go) { p.go = 1; p.vx = (Math.random() - .5) * 42; p.vy = -(18 + Math.random() * 42); }
    if (t < T_DISP + p.out) {
      /* menuju titik huruf dengan pegas lembut, lalu berkilau pelan */
      var gx = p.tx + Math.sin(t * .7 + p.ph) * .35, gy = p.ty + Math.cos(t * .8 + p.ph) * .35;
      p.vx += ((gx - p.x) * 7.5 - p.vx * 4.2) * dt; p.vy += ((gy - p.y) * 7.5 - p.vy * 4.2) * dt;
      a = Math.min(1, (t - p.d) * 2.6) * (.86 + .14 * Math.sin(t * 1.5 + p.ph));
    } else {
      /* memudar perlahan dari kiri ke kanan */
      u = t - (T_DISP + p.out);
      if (!p.dv) { p.dv = 1; p.vx = (Math.random() - .5) * 10; p.vy = -(4 + Math.random() * 12); }
      p.vy -= 4 * dt; a = Math.max(0, 1 - u / 1.7) * .72;
      if (a <= 0) continue;
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    nx.fillStyle = p.col;
    if (p.halo) { nx.globalAlpha = a * .14; nx.beginPath(); nx.arc(p.x, p.y, p.s * 3, 0, 6.283); nx.fill(); }
    nx.globalAlpha = a; nx.beginPath(); nx.arc(p.x, p.y, p.s, 0, 6.283); nx.fill();
    if (p.star) {
      nx.globalAlpha = a * (.2 + .2 * Math.sin(t * 2 + p.ph));
      nx.strokeStyle = "#fffaf0"; nx.lineWidth = .6;
      nx.beginPath(); nx.moveTo(p.x - p.s * 2.2, p.y); nx.lineTo(p.x + p.s * 2.2, p.y);
      nx.moveTo(p.x, p.y - p.s * 2.2); nx.lineTo(p.x, p.y + p.s * 2.2); nx.stroke();
    }
  }
  nx.globalAlpha = 1; nx.globalCompositeOperation = "source-over";
  if (t > T_DISP + .3 && nCb) { var f = nCb; nCb = null; f(); }
  if (t > T_DISP + .4 && !nVeilOff) { nVeilOff = true; veil.classList.remove("on"); }
  if (t < T_END) nRaf = requestAnimationFrame(nameLoop); else stopName();
}
function stopName() {
  cancelAnimationFrame(nRaf); NP = []; nCb = null; veil.classList.remove("on");
  nx.setTransform(1, 0, 0, 1, 0, 0); nx.clearRect(0, 0, nfx.width, nfx.height);
}

/* ---------- alur ---------- */
function setAction(label, show) { action.textContent = label || action.textContent; action.classList.toggle("show", !!show); }
function openCard() {
  if (stage !== "intro") return;
  stage = "reading"; pressing = false; cancelAnimationFrame(rafP);
  var sr = seal.getBoundingClientRect(), sxp = sr.left + sr.width / 2, syp = sr.top + sr.height / 2;
  seal.classList.remove("holding"); hint.classList.add("hide");
  scene.classList.add("opened"); chime();
  if (REDUCED) { co = coT = 1; setCover(); } else setTimeout(function () { coT = 1; coOn = true; motion(); }, 500);
  if (navigator.vibrate) navigator.vibrate(40);
  /* segel pecah jadi kilau, lalu cahaya dan beberapa kelopak saat halaman mulai terlihat */
  lightBurst(sxp, syp, 22);
  setTimeout(function () {
    lightBurst(innerWidth * .5, innerHeight * .5, 14);
    for (var i = 0; i < 4; i++) addPetal(-Math.random() * 160);
    kick();
  }, 1600);
  actionTimer = setTimeout(function () { setAction("Lanjut", true); }, (2.5 + (CONFIG.pesan.length + 3) * .5 + .8) * 1000);
}
function toWish() {
  stage = "wish"; scene.classList.add("wish"); setAction("Tiup lilin", true);
  petalsOn = !REDUCED; for (var i = 0; i < 4; i++) addPetal(-20 - Math.random() * 300); kick();
}
function blow() {
  if (stage !== "wish") return;
  var fl = $("candle").querySelector(".flame").getBoundingClientRect(), ox = fl.left + fl.width / 2, oy = fl.top + fl.height / 2;
  stage = "done"; petalsOn = false; petals = []; setAction("", false); $("candle").classList.add("lean");
  setTimeout(function () { scene.classList.add("blown"); $("candle").classList.remove("lean"); lightBurst(ox, oy, 26); }, 320);
  kick();
  setTimeout(musicBox, 500);
  setTimeout(function () { nameFX(ox, oy, function () { setAction("Lihat surat kecil", true); }); }, 700);
}
function toGift() {
  stage = "gift"; petalsOn = false; scene.classList.add("gift"); calm = true; motion();
  $("letter").classList.remove("open"); $("letter").setAttribute("aria-expanded", "false");
  $("letterHint").textContent = "Ketuk segelnya untuk membuka surat."; $("letterHint").classList.remove("open");
  setAction("Buka surat kecil", true);
}
function openLetter() {
  if (stage !== "gift") return;
  stage = "end"; $("letter").classList.add("open"); $("letter").setAttribute("aria-expanded", "true");
  $("letterHint").textContent = "Semoga ini membuatmu tersenyum."; $("letterHint").classList.add("open");
  chime(); var r = $("letter").getBoundingClientRect(); lightBurst(r.left + r.width / 2, r.top + r.height * .43, 12);
  setAction("Ulangi kartu", true);
}
function boot() {
  clearTimeout(actionTimer); clearTimeout(sealTimer); stage = "intro"; P = 0; pressing = false;
  petalsOn = false; petals = []; parts = []; stopName();
  scene.classList.remove("ready", "opened", "wish", "blown", "gift");
  co = coT = cvel = 0; coOn = false; calm = false; setCover(); $("candle").classList.remove("lean");
  setP(0); seal.classList.remove("holding", "in"); hint.classList.remove("hide"); setAction("", false);
  $("letter").classList.remove("open"); $("letter").setAttribute("aria-expanded", "false");
  $("letterHint").textContent = "Ketuk segelnya untuk membuka surat."; $("letterHint").classList.remove("open");
  fill(); void scene.offsetWidth; scene.classList.add("ready");
  sealTimer = setTimeout(function () { seal.classList.add("in"); }, 1700);   /* segel muncul setelah sampul tertata */
}
action.onclick = function () {
  initAudio();
  if (stage === "reading") toWish(); else if (stage === "wish") blow(); else if (stage === "done") toGift(); else if (stage === "gift") openLetter(); else if (stage === "end") boot();
};
$("candle").onclick = blow;
$("letter").onclick = openLetter;

/* ---------- membuka segel: ketuk beberapa kali ATAU tahan ---------- */
var P = 0, pressing = false, downAt = 0, lastT = 0, rafP = 0;
function setP(v) {
  P = Math.min(1, Math.max(0, v));
  seal.style.setProperty("--p", P * 360 + "deg"); seal.style.setProperty("--s", P.toFixed(2));
  scene.style.setProperty("--pr", P.toFixed(3));
  if (P >= 1 && stage === "intro") openCard();
}
function loopP(t) {
  if (!pressing || stage !== "intro") return;
  setP(P + (t - lastT) / 1400); lastT = t; rafP = requestAnimationFrame(loopP);
}
front.addEventListener("pointerdown", function (e) {
  if (stage !== "intro") return;
  if (e.target.closest && e.target.closest(".polaroid")) return;
  initAudio(); pressing = true; downAt = performance.now(); lastT = downAt;
  seal.classList.add("holding"); try { front.setPointerCapture(e.pointerId); } catch (x) {}
  rafP = requestAnimationFrame(loopP);
});
function release() {
  if (!pressing) return;
  pressing = false; cancelAnimationFrame(rafP); seal.classList.remove("holding");
  if (stage === "intro" && performance.now() - downAt < 280) { tickSnd(); setP(P + .36); }
}
front.addEventListener("pointerup", release);
front.addEventListener("pointercancel", release);
seal.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); initAudio(); setP(1); } });
front.addEventListener("contextmenu", function (e) { e.preventDefault(); });

boot();
