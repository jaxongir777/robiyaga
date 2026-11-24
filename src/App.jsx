import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const NAME = "Robiya"; // pochta ochilganda chiqadigan ism

function createEngine(cv, onPhase) {
  const ctx = cv.getContext("2d");
  const R = Math.random;
  const PI = Math.PI;

  let W = 0, H = 0, dpr = 1;
  let P = [], stars = [], L = {};
  let stage = "idle", pt = 0, last = 0, raf = 0;
  let px = -999, py = -999, alive = true, timer = 0;
  const o = [0, 0, 0, 0, 0];

  function sample(draw) {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true });
    draw(g);
    const d = g.getImageData(0, 0, W, H).data;
    const out = [];
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 150) out.push([x, y, d[i], d[i + 1], d[i + 2]]);
      }
    }
    return out;
  }

  function heart(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.6, y - s * 0.1, x, y + s * 0.9);
    g.fill();
  }

  function drawEnv(g) {
    const { cx, cy, ew, eh } = L;
    const x0 = cx - ew / 2;
    const y0 = cy - eh / 2;
    const hy = cy + eh * 0.06;

    g.lineWidth = Math.max(2.5, ew / 100);
    g.strokeStyle = "#f6d8a6";
    g.lineJoin = "round";
    g.strokeRect(x0, y0, ew, eh);

    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(cx, hy);
    g.lineTo(x0 + ew, y0);
    g.stroke();

    g.beginPath();
    g.moveTo(x0, y0 + eh);
    g.lineTo(x0 + ew * 0.3, y0 + eh * 0.58);
    g.moveTo(x0 + ew, y0 + eh);
    g.lineTo(x0 + ew * 0.7, y0 + eh * 0.58);
    g.stroke();

    g.fillStyle = "#f3c8ff";
    heart(g, cx, hy + eh * 0.03, ew * 0.045);

    g.fillStyle = "#f2ecff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = Math.round(ew * 0.085) + 'px "Press Start 2P",monospace';
    g.fillText("FOR YOU", cx, y0 + eh * 0.8);
  }

  function textDraw(y, fs) {
    return (g) => {
      g.font = fs + 'px "Great Vibes","Snell Roundhand",cursive';
      g.textAlign = "center";
      g.textBaseline = "middle";
      const w = g.measureText(NAME).width;
      const gr = g.createLinearGradient(L.cx - w / 2, 0, L.cx + w / 2, 0);
      gr.addColorStop(0, "#ffe6f1");
      gr.addColorStop(1, "#ff9cc6");
      g.fillStyle = gr;
      g.fillText(NAME, L.cx, y);
    };
  }

  const pick = (a) => (a.length ? a[(R() * a.length) | 0] : [W / 2, H / 2, 255, 200, 220]);

  function build() {
    const m = document.createElement("canvas").getContext("2d");
    m.font = '100px "Great Vibes",cursive';
    const w100 = m.measureText(NAME).width || 260;
    const ew = Math.min(W * 0.72, H * 0.5, 420);
    const fsC = Math.min(H * 0.26, 200, (100 * W * 0.84) / w100);
    const fsF = fsC * 0.62;

    L = {
      cx: W / 2,
      cy: H * 0.42,
      ew,
      eh: ew * 0.62,
      Rr: Math.min(W * 0.2, H * 0.1, 100),
      roseY: H * 0.29,
      nameY: H * 0.74,
      fsF,
    };

    const env = sample(drawEnv);
    const n1 = sample(textDraw(H * 0.5, fsC));
    const n2 = sample(textDraw(L.nameY, fsF));
    const Rpts = sample((g) => {
      g.font = "bold " + Math.round(L.Rr * 1.35) + "px Arial,Helvetica,sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#fff";
      g.fillText(NAME[0].toUpperCase(), W / 2, H / 2);
    }).map((a) => [a[0] - W / 2, a[1] - H / 2]);

    const want = Math.round(Math.min(7000, Math.max(3200, (W * H) / 190)));
    while (P.length < want) {
      P.push({
        x: R() * W,
        y: R() * H,
        vx: 0,
        vy: 0,
        r: 255,
        g: 150,
        b: 200,
        sz: 1 + R() * 1.1,
        a: R() * PI * 2,
        rho: Math.sqrt(R()),
        l: R(),
        q: R(),
        s: R() * 6.28,
        k: 0,
      });
    }
    P.length = want;

    P.forEach((p, i) => {
      const q = R();
      p.k = q < 0.62 ? 0 : q < 0.9 ? 1 : 2;
      p.sp = i / want < 0.42 ? 0 : 1;
      p.E =
        i < want * 0.78
          ? pick(env)
          : [L.cx - L.ew / 2 + R() * L.ew, L.cy - L.eh / 2 + R() * L.eh, 120, 95, 70];
      p.N1 = pick(n1);
      p.N2 = pick(n2);
      p.R = Rpts.length ? Rpts[(R() * Rpts.length) | 0] : [0, 0];
    });
  }

  function roseT(p, t) {
    const { cx, Rr, roseY } = L;
    const u = Rr * 0.07;
    const th = t * 1.1;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    let x, y, z;

    if (p.k === 0) {
      const a = p.a;
      const s = p.l < 0.45 ? 1 : 0.25 + 0.75 * p.l;
      x = 16 * Math.pow(Math.sin(a), 3) * s;
      y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a) + 2.5) * s;
      z = (p.q < 0.5 ? 1 : -1) * 9 * Math.sqrt(Math.max(0, 1 - s * s)) * (0.7 + 0.3 * p.rho);
      y = -y;
    } else {
      x = p.R[0] / u;
      y = p.R[1] / u;
      z = 0;
    }

    const xr = x * cs + z * sn;
    const zr = -x * sn + z * cs;
    o[0] = cx + xr * u;
    o[1] = roseY + y * u + zr * u * 0.12;

    const ph = t * 0.9 + y * 0.06 + zr * 0.04;
    const scan = Math.sin(y * 0.9 - t * 4) > 0.92 ? 70 : 0;

    if (p.k === 0) {
      o[2] = 215 + 40 * Math.sin(ph) + scan;
      o[3] = 70 + 90 * (0.5 + 0.5 * Math.sin(ph + 2)) + scan;
      o[4] = 235;
    } else {
      o[2] = 255;
      o[3] = 215 + scan / 3;
      o[4] = 245;
    }
  }

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, window.innerWidth | 0);
    H = Math.max(1, window.innerHeight | 0);
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    stars = Array.from({ length: 140 }, () => [R() * W, R() * H, R() * 6.28, 0.5 + R()]);
    build();
  }

  function frame(ts) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    const t = ts / 1000;
    last = ts;

    if (stage !== "idle") {
      pt += dt;
      const s = pt < 1.9 ? "vortex" : pt < 5.4 ? "name" : "final";
      if (s !== stage) {
        stage = s;
        if (s === "final") onPhase("final");
      }
    }

    const k = { idle: 0.05, vortex: 0.07, name: 0.045, final: 0.04 }[stage];
    const { cx } = L;
    const VR = Math.min(W * 0.36, H * 0.3, 230);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    for (const s of stars) {
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * s[3] + s[2]));
      ctx.fillStyle = "#fff";
      ctx.fillRect(s[0], s[1], 1.2, 1.2);
    }

    ctx.globalAlpha = 0.9;
    for (const p of P) {
      let tx, ty, tr, tg, tb;
      if (stage === "idle") {
        tx = p.E[0] + Math.sin(t * 1.5 + p.s);
        ty = p.E[1] + Math.cos(t * 1.3 + p.s);
        tr = p.E[2];
        tg = p.E[3];
        tb = p.E[4];
      } else if (stage === "vortex") {
        const ang = p.a + t * (2.2 + 2 * (1 - p.rho));
        const rr = p.rho * VR;
        tx = cx + Math.cos(ang) * rr;
        ty = L.cy + Math.sin(ang) * rr * 0.42;
        tr = 255;
        tg = 40 + p.rho * 80;
        tb = 100 + p.rho * 60;
      } else if (stage === "name" || p.sp === 0) {
        const n = stage === "name" ? p.N1 : p.N2;
        tx = n[0] + Math.sin(t * 2 + p.s) * 0.5;
        ty = n[1] + Math.cos(t * 2 + p.s) * 0.5;
        tr = n[2];
        tg = n[3];
        tb = n[4];
      } else {
        roseT(p, t);
        tx = o[0];
        ty = o[1];
        tr = o[2];
        tg = o[3];
        tb = o[4];
      }

      p.vx = (p.vx + (tx - p.x) * k) * 0.84;
      p.vy = (p.vy + (ty - p.y) * k) * 0.84;

      const dx = p.x - px;
      const dy = p.y - py;
      const d = dx * dx + dy * dy;
      if (d < 6400 && d > 0) {
        const f = ((1 - d / 6400) * 3) / Math.sqrt(d);
        p.vx += dx * f;
        p.vy += dy * f;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.r += (tr - p.r) * 0.08;
      p.g += (tg - p.g) * 0.08;
      p.b += (tb - p.b) * 0.08;

      ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
      ctx.fillRect(p.x, p.y, p.sz, p.sz);
    }
  }

  const move = (e) => {
    px = e.clientX;
    py = e.clientY;
  };
  const leave = () => {
    px = py = -999;
  };
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(size, 150);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerleave", leave);
  window.addEventListener("pointerup", leave);
  window.addEventListener("resize", onResize);

  const fonts = Promise.race([
    Promise.all([
      document.fonts.load('100px "Great Vibes"'),
      document.fonts.load('20px "Press Start 2P"'),
    ]).catch(() => 0),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  fonts.then(() => {
    if (!alive) return;
    size();
    raf = requestAnimationFrame(frame);
  });

  return {
    open() {
      if (stage !== "idle") return;
      stage = "vortex";
      pt = 0;
      onPhase("opening");
    },
    reset() {
      stage = "idle";
      pt = 0;
      onPhase("idle");
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", leave);
      window.removeEventListener("resize", onResize);
    },
  };
}

export default function App() {
  const cv = useRef(null);
  const eng = useRef(null);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    document.title = `${NAME} uchun`;
    const href =
      "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Press+Start+2P&display=swap";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!cv.current) return;
    eng.current = createEngine(cv.current, setPhase);
    return () => eng.current?.destroy();
  }, []);

  return (
    <div className="app">
      <canvas ref={cv} />
      <button
        className={`btn open ${phase === "idle" ? "show" : ""}`}
        onClick={() => eng.current?.open()}
      >
        Ochish
      </button>
      <button
        className={`btn again ${phase === "final" ? "show" : ""}`}
        onClick={() => eng.current?.reset()}
      >
        Qayta
      </button>
    </div>
  );
}