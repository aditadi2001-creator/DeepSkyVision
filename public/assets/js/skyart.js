// Procedural sky art. Used for the hero comparison and for clearly-labelled
// "sample frame" placeholders in the gallery until real images are added.
// Deterministic: the same seed always draws the same sky.

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const rnd = mulberry32(seed);
  const N = 256;
  const perm = new Uint16Array(N * 2);
  const g = new Float32Array(N);
  for (let i = 0; i < N; i++) { g[i] = rnd(); perm[i] = i; }
  for (let i = N - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < N; i++) perm[i + N] = perm[i];
  const sm = (t) => t * t * (3 - 2 * t);
  const val = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const a = g[perm[perm[X] + Y] & 255];
    const b = g[perm[perm[X + 1] + Y] & 255];
    const c = g[perm[perm[X] + Y + 1] & 255];
    const d = g[perm[perm[X + 1] + Y + 1] & 255];
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y, oct = 5) => {
    let s = 0, amp = 0.5, f = 1, tot = 0;
    for (let i = 0; i < oct; i++) { s += amp * val(x * f, y * f); tot += amp; f *= 2; amp *= 0.5; }
    return s / tot;
  };
}

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Each "field" returns linear colour (0..1) for the finished picture and a
// luminance for the raw single frame, at a given normalised position.
function nebulaField(seed) {
  const n1 = makeNoise(seed), n2 = makeNoise(seed + 101);
  const cx = 0.5 + (mulberry32(seed)() - 0.5) * 0.2, cy = 0.5 + (mulberry32(seed + 3)() - 0.5) * 0.12;
  const rot = 0.4 + (seed % 5) * 0.28;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const ridge = (n) => { const r = 1 - Math.abs(2 * n - 1); return r * r; };
  return (u, v, aspect) => {
    const px = u * aspect * 2.0, py = v * 2.0;
    const q1 = n1(px, py, 4), q2 = n1(px + 5.2, py + 1.3, 4);
    const wx = px + 2.7 * q1, wy = py + 2.7 * q2;
    const dx = (u - cx) * aspect, dy = v - cy;
    const rx = dx * cr + dy * sr, ry = -dx * sr + dy * cr;
    const env = Math.exp(-((rx * rx) / 0.5 + (ry * ry) / 0.2));
    const envO = Math.exp(-((rx * rx) / 0.22 + (ry * ry) / 0.09));

    const cloud = smooth(0.38, 0.85, n2(wx * 1.1, wy * 1.1, 6));
    const fil = ridge(n2(wx * 1.9 + 7, wy * 1.9 + 3, 5));
    const fine = ridge(n1(wx * 3.6 + 20, wy * 3.6 + 11, 4));
    const H = env * (cloud * 0.8 + fil * 0.7 + fine * 0.18);
    const O = envO * (smooth(0.42, 0.88, n1(wx * 1.3 + 40, wy * 1.3 + 10, 5)) * 0.85 + fine * 0.3);
    const S = env * smooth(0.42, 0.9, n2(wx * 0.9 + 60, wy * 0.9 + 80, 5)) * 0.75;
    const dust = 1 - 0.6 * smooth(0.52, 0.8, n1(px * 2.6 + 70, py * 2.6 + 90, 5)) * env;

    // Hubble palette: S→red, Hα→green, OIII→blue, then neutralise the green cast
    let r = S * 0.95 + H * 0.62;
    let g = H * 0.9 + O * 0.5 + S * 0.2;
    let b = O * 1.05 + H * 0.1;
    g -= 0.8 * Math.max(0, g - (r + b) / 2);
    return { r: r * dust, g: g * dust, b: b * dust, L: (H + O * 0.7 + S * 0.6) / 2.1, floor: 0.004 };
  };
}

function galaxyField(seed) {
  const n1 = makeNoise(seed), n2 = makeNoise(seed + 55);
  const tilt = 0.35 + (seed % 7) * 0.12, cr = Math.cos(tilt), sr = Math.sin(tilt);
  return (u, v, aspect) => {
    const dx = (u - 0.5) * aspect, dy = v - 0.5;
    let x = dx * cr + dy * sr, y = (-dx * sr + dy * cr) / 0.42; // inclined disc
    const r = Math.hypot(x, y) + 1e-4, th = Math.atan2(y, x);
    const arms = 0.5 + 0.5 * Math.cos(2 * (th - 3.1 * Math.log(r + 0.08)));
    const disc = Math.exp(-r * 4.2);
    const core = Math.exp(-r * r * 220) * 1.35 + Math.exp(-r * 14) * 0.5;
    const hii = smooth(0.62, 0.9, n2(x * 22, y * 22, 3)) * arms * disc;
    const dust = 1 - 0.7 * smooth(0.5, 0.78, n1(x * 7 + th, y * 7, 5)) * arms * Math.exp(-r * 3);
    const body = (disc * (0.3 + 0.7 * arms) * (0.75 + 0.5 * n1(x * 9, y * 9, 4))) * dust;
    const warm = clamp(core * 1.1);
    return {
      r: body * 0.55 + warm * 1.0 + hii * 1.1,
      g: body * 0.72 + warm * 0.82 + hii * 0.35,
      b: body * 1.0 + warm * 0.55 + hii * 0.45,
      L: body * 0.5 + core * 0.6,
      floor: 0.01,
    };
  };
}

function hazeField(seed) {
  const n1 = makeNoise(seed);
  return (u, v, aspect) => {
    const h = n1(u * aspect * 3, v * 3, 5);
    const m = Math.exp(-(((u - 0.5) * aspect) ** 2 + (v - 0.5) ** 2) * 2.2);
    const d = smooth(0.4, 0.8, h) * m * 0.22;
    return { r: d * 0.6, g: d * 0.75, b: d * 1.0, L: d * 0.5, floor: 0.012 };
  };
}

function milkywayField(seed) {
  const n1 = makeNoise(seed), n2 = makeNoise(seed + 9);
  const ang = -0.55;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return (u, v, aspect) => {
    const x = (u - 0.5) * aspect, y = v - 0.46;
    const along = x * ca + y * sa, across = -x * sa + y * ca;
    const band = Math.exp(-(across * across) / 0.028);
    const core = Math.exp(-((along + 0.05) ** 2) / 0.1);
    const clouds = smooth(0.3, 0.85, n1(along * 6 + 3, across * 9, 6));
    const rift = smooth(0.52, 0.76, n2(along * 5, across * 14 + 4, 5)) * band * 0.85;
    const dens = band * (0.25 + 0.75 * clouds) * (0.45 + 0.8 * core);
    const L = clamp(dens * (1 - rift));
    return {
      r: L * (0.55 + 0.5 * core) + 0.01,
      g: L * (0.55 + 0.25 * core) + 0.015,
      b: L * 0.62 + 0.03,
      L, floor: 0.02,
    };
  };
}

const FIELDS = { nebula: nebulaField, galaxy: galaxyField, cluster: hazeField, milkyway: milkywayField };
const STAR_TINTS = [[255, 226, 190], [255, 255, 255], [190, 214, 255], [255, 240, 214], [255, 204, 160]];

function drawStars(ctx, w, h, rnd, { count, raw, cluster, spikes }) {
  const k = w / 1200;
  for (let i = 0; i < count; i++) {
    let x, y;
    if (cluster) {
      // Gaussian-ish concentration towards the centre
      const a = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 1.7) * 0.5;
      x = (0.5 + Math.cos(a) * rr * (h / w) * 1.9) * w;
      y = (0.5 + Math.sin(a) * rr) * h;
    } else { x = rnd() * w; y = rnd() * h; }
    const mag = Math.pow(rnd(), 3.2);
    if (raw && mag < 0.28) continue;
    const t = STAR_TINTS[(rnd() * STAR_TINTS.length) | 0];
    const core = (0.45 + mag * 2.4) * k;
    const halo = core * (raw ? 3 : 2.6 + mag * 4.2);
    const alpha = raw ? 0.3 + mag * 0.5 : 0.3 + mag * 0.7;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, halo);
    gr.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},${alpha})`);
    gr.addColorStop(0.14, `rgba(${t[0]},${t[1]},${t[2]},${alpha * 0.5})`);
    gr.addColorStop(0.42, `rgba(${t[0]},${t[1]},${t[2]},${alpha * 0.1})`);
    gr.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(x - halo, y - halo, halo * 2, halo * 2);
    if (!raw) {
      ctx.fillStyle = `rgba(255,255,255,${0.55 + mag * 0.45})`;
      ctx.beginPath(); ctx.arc(x, y, core * 0.62, 0, 6.2832); ctx.fill();
    }
    if (spikes && !raw && mag > 0.86) {
      const len = core * (14 + mag * 22);
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.785);
      for (let s = 0; s < 4; s++) {
        const lg = ctx.createLinearGradient(0, 0, len, 0);
        lg.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},0.55)`);
        lg.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`);
        ctx.fillStyle = lg; ctx.fillRect(0, -0.6 * k, len, 1.2 * k);
        ctx.rotate(1.5708);
      }
      ctx.restore();
    }
  }
}

function drawHorizon(ctx, w, h, rnd) {
  ctx.fillStyle = "#03050a";
  ctx.beginPath(); ctx.moveTo(0, h);
  let y = h * 0.9;
  for (let x = 0; x <= w; x += w / 60) {
    y += (rnd() - 0.5) * h * 0.035; y = clamp(y, h * 0.84, h * 0.95);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  const gl = ctx.createLinearGradient(0, h * 0.8, 0, h);
  gl.addColorStop(0, "rgba(233,169,75,0)"); gl.addColorStop(1, "rgba(233,169,75,0.12)");
  ctx.globalCompositeOperation = "destination-over";
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Paint a procedural sky onto a canvas.
 * opts: { seed, kind: nebula|galaxy|cluster|milkyway, width, height, mode: final|raw }
 */
export function paintSky(canvas, opts = {}) {
  const { seed = 1, kind = "nebula", width = 640, height = 480, mode = "final" } = opts;
  const raw = mode === "raw";
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  const aspect = width / height;

  const lw = Math.min(width, 800, Math.max(200, Math.round(width / 1.5)));
  const lh = Math.max(1, Math.round((lw * height) / width));
  const field = document.createElement("canvas");
  field.width = lw; field.height = lh;
  const fctx = field.getContext("2d");
  const img = fctx.createImageData(lw, lh);
  const d = img.data;
  const sample = (FIELDS[kind] || nebulaField)(seed);
  const gamma = raw ? 0.9 : 0.62;

  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      const s = sample(x / lw, y / lh, aspect);
      const i = (y * lw + x) * 4;
      if (raw) {
        // One unstretched-looking sub: dim signal on top of light-pollution glow
        const glow = 0.07 + 0.12 * (y / lh) + 0.03 * Math.sin(x / lw * 3.1);
        const sig = Math.pow(clamp(s.L), gamma) * 0.14;
        d[i] = (glow * 1.05 + sig) * 255;
        d[i + 1] = (glow * 0.92 + sig) * 255;
        d[i + 2] = (glow * 0.82 + sig) * 255;
      } else {
        const bg = [6, 10, 22];
        d[i] = bg[0] + Math.pow(clamp(s.r + s.floor), gamma) * 255 * 0.98;
        d[i + 1] = bg[1] + Math.pow(clamp(s.g + s.floor), gamma) * 255 * 0.98;
        d[i + 2] = bg[2] + Math.pow(clamp(s.b + s.floor), gamma) * 255 * 0.98;
      }
      d[i + 3] = 255;
    }
  }
  fctx.putImageData(img, 0, 0);
  ctx.fillStyle = raw ? "#1a1c22" : "#060a16";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(field, 0, 0, width, height);

  const rnd = mulberry32(seed * 7919 + 13);
  const area = (width * height) / (1200 * 800);
  const base = kind === "cluster" ? 1500 : kind === "milkyway" ? 900 : kind === "galaxy" ? 420 : 620;
  drawStars(ctx, width, height, rnd, {
    count: Math.round(base * Math.max(0.35, area)) * (raw ? 1 : 1),
    raw, cluster: kind === "cluster", spikes: kind !== "milkyway",
  });
  if (!raw && kind === "milkyway") drawHorizon(ctx, width, height, rnd);

  if (raw) {
    // Fine sensor grain — one short frame is mostly noise
    const g = ctx.getImageData(0, 0, width, height), p = g.data;
    const gr = mulberry32(seed + 4242);
    for (let i = 0; i < p.length; i += 4) {
      const n = (gr() + gr() + gr() - 1.5) * 34;
      p[i] += n; p[i + 1] += n; p[i + 2] += n;
    }
    ctx.putImageData(g, 0, 0);
  } else if (kind !== "milkyway") {
    // gentle vignette
    const vg = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}
