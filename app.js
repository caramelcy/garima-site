const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- ambient molecular network ---------- */
(function () {
  const c = document.getElementById("net");
  if (!c || reduced) return;
  const x = c.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let w, h, pts = [];
  function init() {
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    const N = Math.min(72, Math.floor(innerWidth / 17));
    pts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .3 * dpr, vy: (Math.random() - .5) * .3 * dpr,
      r: (Math.random() * 1.6 + 1) * dpr
    }));
  }
  function tick() {
    const LINK = 130 * dpr;
    x.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < LINK) {
          x.strokeStyle = "rgba(96,165,250," + ((1 - d / LINK) * .5).toFixed(3) + ")";
          x.lineWidth = dpr * .7;
          x.beginPath(); x.moveTo(pts[i].x, pts[i].y); x.lineTo(pts[j].x, pts[j].y); x.stroke();
        }
      }
    x.fillStyle = "rgba(125,211,252,.85)";
    for (const p of pts) { x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
    requestAnimationFrame(tick);
  }
  init(); tick();
  addEventListener("resize", init);
})();

/* ---------- force-extension curve ---------- */
(function () {
  const path = document.getElementById("fc");
  if (!path) return;
  const X0 = 46, X1 = 406, YB = 205, S = (205 - 58) / 1200, peakF = 1180, at = .62;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - .5; };
  let d = "", px = 0, py = 0;
  for (let i = 0; i <= 280; i++) {
    const t = i / 280; let f;
    if (t < at) { const r = t / at; f = peakF * Math.pow(r, 1.25) + rnd() * 70 * Math.min(1, r * 3); }
    else if (t < at + .035) { const r = (t - at) / .035; f = peakF * (1 - r) * (1 - r) + rnd() * 50; }
    else f = rnd() * 130;
    f = Math.max(f, -90);
    const X = X0 + t * (X1 - X0), Y = YB - f * S;
    d += (i ? "L" : "M") + X.toFixed(1) + " " + Y.toFixed(1);
    if (Math.abs(t - at) < .004) { px = X; py = Y; }
  }
  path.setAttribute("d", d);
  ["pk", "pk2"].forEach(id => {
    const e = document.getElementById(id);
    if (e) { e.setAttribute("cx", px); e.setAttribute("cy", py); }
  });
  const tx = document.getElementById("pkt");
  if (tx) { tx.setAttribute("x", px); tx.setAttribute("y", py - 14); }
})();

/* ---------- bead-spring chain: load, rupture, rebind ---------- */
(function () {
  const svg = document.getElementById("chain");
  if (!svg || reduced) return;
  const NS = "http://www.w3.org/2000/svg";
  const N = 7, X0 = 40, GAP = 52, Y = 90;
  const beads = [], springs = [];

  for (let i = 0; i < N - 1; i++) {
    const s = document.createElementNS(NS, "path");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "#38BDF8");
    s.setAttribute("stroke-width", "1.6");
    s.setAttribute("stroke-opacity", ".75");
    svg.appendChild(s); springs.push(s);
  }
  for (let i = 0; i < N; i++) {
    const b = document.createElementNS(NS, "circle");
    b.setAttribute("r", i === N - 1 ? 8 : 6.5);
    b.setAttribute("fill", i === N - 1 ? "#A78BFA" : "#22D3EE");
    b.setAttribute("filter", "url(#glow)");
    svg.appendChild(b); beads.push(b);
  }
  const label = document.getElementById("chainLabel");

  function coil(x1, x2, y, turns) {
    const len = x2 - x1, amp = Math.max(3, 11 - len * .04);
    let p = "M" + x1 + " " + y;
    for (let i = 1; i <= turns * 2; i++) {
      const t = i / (turns * 2);
      p += "L" + (x1 + len * t).toFixed(1) + " " + (y + (i % 2 ? -amp : amp)).toFixed(1);
    }
    return p + "L" + x2 + " " + y;
  }

  let t = 0;
  function frame() {
    t += 0.006;
    const cyc = t % 1;                       // 0..1 loop
    let stretch = 0, broken = false, sep = 0;
    if (cyc < .55) { stretch = cyc / .55; }                 // loading
    else if (cyc < .8) { broken = true; sep = (cyc - .55) / .25; stretch = 1; }  // ruptured
    else { broken = true; sep = 1 - (cyc - .8) / .2; stretch = 1; }              // rebinding

    const pull = stretch * 34;
    for (let i = 0; i < N; i++) {
      let x = X0 + i * GAP;
      if (i === N - 1) x += pull + (broken ? sep * 70 : 0);
      else x += (i / (N - 1)) * pull * .35;
      const y = Y + Math.sin(t * 3 + i) * 1.6;
      beads[i].setAttribute("cx", x.toFixed(1));
      beads[i].setAttribute("cy", y.toFixed(1));
      beads[i]._x = x; beads[i]._y = y;
    }
    for (let i = 0; i < N - 1; i++) {
      const a = beads[i], b = beads[i + 1];
      const last = i === N - 2;
      if (last && broken) {
        springs[i].setAttribute("stroke-opacity", (0.25 * (1 - sep)).toFixed(2));
        springs[i].setAttribute("stroke", "#FB5E5E");
      } else {
        springs[i].setAttribute("stroke-opacity", ".75");
        springs[i].setAttribute("stroke", last && stretch > .8 ? "#FB5E5E" : "#38BDF8");
      }
      springs[i].setAttribute("d", coil(a._x + 7, b._x - 7, Y, 5));
    }
    if (label) {
      label.textContent = broken
        ? (sep > .5 && cyc < .8 ? "ruptured" : "rebinding")
        : (stretch > .8 ? "loading — near rupture" : "bound, under load");
      label.setAttribute("fill", broken ? "#FB5E5E" : (stretch > .8 ? "#FBBF24" : "#5D7086"));
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- scroll reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .1, rootMargin: "0px 0px -50px" });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- nav ---------- */
const nav = document.getElementById("nav");
if (nav) addEventListener("scroll", () => nav.classList.toggle("stuck", scrollY > 30), { passive: true });
const burger = document.getElementById("burger");
if (burger) burger.addEventListener("click", () => {
  const m = document.getElementById("menu");
  const open = m.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});

/* ---------- card cursor glow ---------- */
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX - r.left) + "px");
    card.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
});

/* ---------- count-up stats ---------- */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
  let s = null;
  const step = ts => {
    if (!s) s = ts;
    const p = Math.min((ts - s) / 1200, 1);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = (target % 1 ? v.toFixed(1) : Math.round(v)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  cio.unobserve(el);
}), { threshold: .6 });
document.querySelectorAll("[data-count]").forEach(el => cio.observe(el));
