// Parametric tooth generator. Local frame: +x mesial, +y toward the incisal/occlusal surface, +z buccal/labial.
// Origin at the centre of the cervical line (CEJ). Units in millimetres.
import * as THREE from 'three';
import { superPt, profile, smoothstep, loftRings, mergeGeometries, clamp, lerp } from './loft.js';

const PROFILES = {
  incisor:  { x: [[0, .74], [.55, .95], [.9, 1], [1, .93]],  z: [[0, .95], [.28, 1], [.65, .62], [1, .12]], n: 2.3, cingulum: 0.14, fillet: 0.45 },
  canine:   { x: [[0, .76], [.5, 1], [.8, .9], [1, .45]],    z: [[0, .9], [.3, 1], [.72, .72], [1, .3]],   n: 2.2, cingulum: 0.12, fillet: 0.9 },
  premolar: { x: [[0, .84], [.45, 1], [.85, .95], [1, .8]],  z: [[0, .86], [.4, 1], [.85, .95], [1, .76]], n: 2.35, cingulum: 0, fillet: 1.0 },
  molar:    { x: [[0, .86], [.4, 1], [.85, .97], [1, .88]],  z: [[0, .86], [.4, 1], [.85, .97], [1, .86]], n: 2.8, cingulum: 0, fillet: 1.0 },
};

// cusps: [u (mesial +), w (buccal +), height mm, sigma]
const CUSPS = {
  upperMolar:  [[0.5, 0.5, 2.0, 0.42], [-0.5, 0.5, 1.7, 0.4], [0.45, -0.5, 2.2, 0.48], [-0.5, -0.5, 1.3, 0.4]],
  upperMolar2: [[0.5, 0.5, 2.0, 0.42], [-0.5, 0.5, 1.6, 0.4], [0.45, -0.5, 2.1, 0.48], [-0.5, -0.5, 0.9, 0.38]],
  upperMolar3: [[0.5, 0.5, 1.8, 0.45], [-0.5, 0.5, 1.4, 0.42], [0.2, -0.5, 1.9, 0.52]],
  lowerMolar1: [[0.55, 0.5, 2.0, 0.4], [-0.1, 0.55, 1.8, 0.38], [-0.75, 0.25, 1.4, 0.36], [0.5, -0.5, 2.1, 0.42], [-0.4, -0.5, 1.9, 0.4]],
  lowerMolar2: [[0.5, 0.5, 2.0, 0.42], [-0.5, 0.5, 1.8, 0.4], [0.5, -0.5, 2.0, 0.42], [-0.5, -0.5, 1.8, 0.4]],
  lowerMolar3: [[0.5, 0.5, 1.7, 0.45], [-0.5, 0.5, 1.5, 0.42], [0.5, -0.5, 1.7, 0.45], [-0.5, -0.5, 1.5, 0.42]],
  upperPremolar: [[0, 0.5, 2.6, 0.5], [0, -0.5, 2.1, 0.5]],
  lowerPremolar1: [[0, 0.35, 3.0, 0.55], [0, -0.62, 0.9, 0.4]],
  lowerPremolar2: [[0, 0.4, 2.6, 0.5], [0.35, -0.6, 1.2, 0.35], [-0.35, -0.6, 1.2, 0.35]],
  canine: [[0, 0.1, 3.2, 0.62]],
  none: [],
};

// developmental grooves: { axis: 'u' | 'w' (direction the groove runs), at, depth, width, from, to }
const GROOVES = {
  upperMolar:  [{ axis: 'u', at: 0, depth: 0.94, width: 0.24, from: -0.75, to: 0.75 }, { axis: 'w', at: 0, depth: 0.68, width: 0.21, from: 0.1, to: 0.95 }],
  upperMolar2: [{ axis: 'u', at: 0, depth: 0.94, width: 0.24, from: -0.75, to: 0.75 }, { axis: 'w', at: 0, depth: 0.68, width: 0.21, from: 0.1, to: 0.95 }],
  upperMolar3: [{ axis: 'u', at: 0, depth: 0.81, width: 0.25, from: -0.7, to: 0.7 }],
  lowerMolar1: [{ axis: 'u', at: 0, depth: 1.01, width: 0.24, from: -0.85, to: 0.8 }, { axis: 'w', at: 0.2, depth: 0.68, width: 0.20, from: 0.1, to: 0.95 }, { axis: 'w', at: -0.45, depth: 0.54, width: 0.18, from: 0.1, to: 0.95 }, { axis: 'w', at: 0.05, depth: 0.47, width: 0.18, from: -0.95, to: -0.1 }],
  lowerMolar2: [{ axis: 'u', at: 0, depth: 1.01, width: 0.24, from: -0.8, to: 0.8 }, { axis: 'w', at: 0, depth: 0.68, width: 0.20, from: 0.1, to: 0.95 }, { axis: 'w', at: 0, depth: 0.47, width: 0.18, from: -0.95, to: -0.1 }],
  lowerMolar3: [{ axis: 'u', at: 0, depth: 0.81, width: 0.25, from: -0.75, to: 0.75 }, { axis: 'w', at: 0, depth: 0.54, width: 0.21, from: 0.1, to: 0.9 }],
  upperPremolar: [{ axis: 'u', at: 0, depth: 0.74, width: 0.22, from: -0.6, to: 0.6 }],
  lowerPremolar1: [{ axis: 'u', at: -0.05, depth: 0.41, width: 0.22, from: -0.5, to: 0.5 }],
  lowerPremolar2: [{ axis: 'u', at: 0, depth: 0.61, width: 0.22, from: -0.6, to: 0.6 }, { axis: 'w', at: 0, depth: 0.47, width: 0.20, from: -0.9, to: -0.1 }],
  canine: [],
  none: [],
};

/**
 * Tooth specs. key = arch (U/L) + position 1..8 (permanent) or A..E (primary).
 * crownH, md (mesiodistal), bl (buccolingual), rootL in mm. Average values after Wheeler's Dental Anatomy.
 */
export const TOOTH_SPECS = {
  U1: { kind: 'incisor', crownH: 10.5, md: 8.5, bl: 7.0, rootL: 13, roots: 'single', cusps: 'none', fossa: 0 },
  U2: { kind: 'incisor', crownH: 9.0, md: 6.5, bl: 6.0, rootL: 13, roots: 'single', cusps: 'none', fossa: 0 },
  U3: { kind: 'canine', crownH: 10.0, md: 7.5, bl: 8.0, rootL: 17, roots: 'single', cusps: 'canine', fossa: 0 },
  U4: { kind: 'premolar', crownH: 8.5, md: 7.0, bl: 9.0, rootL: 14, roots: 'two-bl', cusps: 'upperPremolar', fossa: 0.9 },
  U5: { kind: 'premolar', crownH: 8.5, md: 7.0, bl: 9.0, rootL: 14, roots: 'single', cusps: 'upperPremolar', fossa: 0.9 },
  U6: { kind: 'molar', crownH: 7.5, md: 10.0, bl: 11.0, rootL: 13, roots: 'three', cusps: 'upperMolar', fossa: 1.4 },
  U7: { kind: 'molar', crownH: 7.0, md: 9.0, bl: 11.0, rootL: 12, roots: 'three', cusps: 'upperMolar2', fossa: 1.4 },
  U8: { kind: 'molar', crownH: 6.5, md: 8.5, bl: 10.0, rootL: 11, roots: 'fused3', cusps: 'upperMolar3', fossa: 0.8 },
  L1: { kind: 'incisor', crownH: 9.0, md: 5.0, bl: 6.0, rootL: 12.5, roots: 'single', cusps: 'none', fossa: 0 },
  L2: { kind: 'incisor', crownH: 9.5, md: 5.5, bl: 6.5, rootL: 14, roots: 'single', cusps: 'none', fossa: 0 },
  L3: { kind: 'canine', crownH: 11.0, md: 7.0, bl: 7.5, rootL: 16, roots: 'single', cusps: 'canine', fossa: 0 },
  L4: { kind: 'premolar', crownH: 8.5, md: 7.0, bl: 7.5, rootL: 14, roots: 'single', cusps: 'lowerPremolar1', fossa: 0.4 },
  L5: { kind: 'premolar', crownH: 8.0, md: 7.0, bl: 8.0, rootL: 14.5, roots: 'single', cusps: 'lowerPremolar2', fossa: 0.6 },
  L6: { kind: 'molar', crownH: 7.5, md: 11.0, bl: 10.5, rootL: 14, roots: 'two-md', cusps: 'lowerMolar1', fossa: 1.5 },
  L7: { kind: 'molar', crownH: 7.0, md: 10.5, bl: 10.0, rootL: 13, roots: 'two-md', cusps: 'lowerMolar2', fossa: 1.5 },
  L8: { kind: 'molar', crownH: 7.0, md: 10.0, bl: 9.5, rootL: 11, roots: 'fused2', cusps: 'lowerMolar3', fossa: 0.8 },
  // primary (deciduous) teeth: A central incisor, B lateral, C canine, D first molar, E second molar
  UA: { kind: 'incisor', crownH: 6.0, md: 6.5, bl: 5.0, rootL: 10, roots: 'single', cusps: 'none', fossa: 0, primary: true },
  UB: { kind: 'incisor', crownH: 5.6, md: 5.1, bl: 4.8, rootL: 11, roots: 'single', cusps: 'none', fossa: 0, primary: true },
  UC: { kind: 'canine', crownH: 6.5, md: 7.0, bl: 6.5, rootL: 13, roots: 'single', cusps: 'canine', fossa: 0, primary: true },
  UD: { kind: 'molar', crownH: 5.1, md: 7.3, bl: 8.5, rootL: 10, roots: 'three', cusps: 'upperMolar2', fossa: 0.7, primary: true },
  UE: { kind: 'molar', crownH: 5.7, md: 8.5, bl: 10.0, rootL: 11, roots: 'three', cusps: 'upperMolar', fossa: 0.8, primary: true },
  LA: { kind: 'incisor', crownH: 5.0, md: 4.2, bl: 4.0, rootL: 9, roots: 'single', cusps: 'none', fossa: 0, primary: true },
  LB: { kind: 'incisor', crownH: 5.2, md: 4.1, bl: 4.3, rootL: 10, roots: 'single', cusps: 'none', fossa: 0, primary: true },
  LC: { kind: 'canine', crownH: 6.0, md: 5.9, bl: 5.5, rootL: 11.5, roots: 'single', cusps: 'canine', fossa: 0, primary: true },
  LD: { kind: 'molar', crownH: 6.0, md: 7.7, bl: 7.0, rootL: 10, roots: 'two-md', cusps: 'lowerMolar2', fossa: 0.7, primary: true },
  LE: { kind: 'molar', crownH: 5.5, md: 9.9, bl: 8.7, rootL: 11, roots: 'two-md', cusps: 'lowerMolar1', fossa: 0.9, primary: true },
};

const THETA_N = 48, V_N = 14, LID_N = 11;

function cuspField(cusps, scale, fossa, u, w, grooves = []) {
  let y = -fossa * (1 - clamp(u * u + w * w, 0, 1));
  for (const [cu, cw, A, s] of cusps) {
    const du = u - cu, dw = w - cw;
    y += A * Math.exp(-(du * du + dw * dw) / (s * s));
  }
  for (const g of grooves) {
    const along = g.axis === 'u' ? u : w, across = g.axis === 'u' ? w : u;
    const win = smoothstep(g.from - 0.15, g.from + 0.1, along) * (1 - smoothstep(g.to - 0.1, g.to + 0.15, along));
    const d = (across - g.at) / g.width;
    y -= g.depth * Math.exp(-d * d) * win;
  }
  return y * scale;
}

const COL_CERV = new THREE.Color(0xe6d6b8), COL_INC = new THREE.Color(0xfbfaf6);

/**
 * Crown loft (closed). inset(v) shrinks the half-widths (enamel/dentin/pulp layers).
 */
function crownGeometry(spec, { inset = () => 0, hOffset = 0, cuspScale = 1, extraBottom = 0, mirror = false, primaryBulge = 0, vertexColors = false, filletScale = 1 } = {}) {
  const P = PROFILES[spec.kind];
  const cusps = CUSPS[spec.cusps].map(c => [mirror ? -c[0] : c[0], c[1], c[2] * 1.2 * (spec.primary ? 0.65 : 1), c[3] * 0.88]);
  const grooves = (GROOVES[spec.cusps] || []).map(g => (mirror && g.axis === 'w') ? { ...g, at: -g.at } : (mirror && g.axis === 'u') ? { ...g, from: -g.to, to: -g.from } : g);
  const H = spec.crownH + hOffset;
  const Rf = Math.min(P.fillet * filletScale * (spec.primary ? 0.8 : 1), H * 0.3);
  const Hs = H - Rf; // height of the side wall; the lid fillet brings it to H
  const fossa = spec.fossa * (spec.primary ? 0.7 : 1);
  const rings = [], vs = [];
  const ring = (v, scaleXY = 1, yOverride = null) => {
    let wx = (spec.md / 2) * profile(P.x, v) * scaleXY, wz = (spec.bl / 2) * profile(P.z, v) * scaleXY;
    if (primaryBulge) { const b = 1 + primaryBulge * Math.exp(-(((v - 0.22) / 0.22) ** 2)); wx *= b; wz *= b; }
    const ins = inset(v);
    wx = Math.max(0.25, wx - ins); wz = Math.max(0.22, wz - ins);
    const pts = [];
    for (let i = 0; i < THETA_N; i++) {
      const th = (i / THETA_N) * Math.PI * 2;
      const [ux, uz] = superPt(1, 1, P.n, th);
      let m = 1;
      if (P.cingulum) m += P.cingulum * Math.exp(-(((v - 0.28) / 0.22) ** 2)) * Math.pow(Math.max(0, -uz), 2);
      const x = wx * ux * m, z = wz * uz * m;
      const y = yOverride !== null ? yOverride : v * Hs + smoothstep(0.55, 1, v) * cuspField(cusps, cuspScale, fossa, ux, uz, grooves);
      pts.push([x, y, z]);
    }
    return pts;
  };
  if (extraBottom > 0) { rings.push(ring(0, 0.8, -extraBottom)); vs.push(0); }
  for (let k = 0; k <= V_N; k++) { rings.push(ring(k / V_N)); vs.push(k / V_N); }
  // lid (occlusal/incisal surface) rings with a rounded shoulder (fillet) at the rim
  const topWx = Math.max(0.25, (spec.md / 2) * profile(P.x, 1) - inset(1)), topWz = Math.max(0.22, (spec.bl / 2) * profile(P.z, 1) - inset(1));
  const s0 = 0.8;
  for (let k = 1; k < LID_N; k++) {
    const s = 1 - k / LID_N;
    const q = s > s0 ? (s - s0) / (1 - s0) : 0;
    const drop = Rf * (1 - Math.sqrt(Math.max(0, 1 - q * q)));
    const pts = [];
    for (let i = 0; i < THETA_N; i++) {
      const th = (i / THETA_N) * Math.PI * 2;
      const [ux, uz] = superPt(1, 1, P.n, th);
      pts.push([s * topWx * ux, H - drop + cuspField(cusps, cuspScale, fossa, s * ux, s * uz, grooves), s * topWz * uz]);
    }
    rings.push(pts); vs.push(1);
  }
  const g = loftRings(rings, { startCenter: [0, extraBottom > 0 ? -extraBottom : 0, 0], endCenter: [0, H + cuspField(cusps, cuspScale, fossa, 0, 0, grooves), 0] });
  if (vertexColors) {
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color();
    const pos = g.attributes.position;
    // occlusal relief: darken grooves and fossae slightly (cheap cavity shading)
    let yMax = -1e9, yMin = 1e9;
    for (let i = (V_N + 1 + (extraBottom > 0 ? 1 : 0)) * THETA_N; i < n; i++) { const y = pos.getY(i); yMax = Math.max(yMax, y); yMin = Math.min(yMin, y); }
    const lidStart = (V_N + 1 + (extraBottom > 0 ? 1 : 0)) * THETA_N - THETA_N * 3;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / THETA_N), v = r < vs.length ? vs[r] : (i === n - 1 ? 1 : 0);
      c.copy(COL_CERV).lerp(COL_INC, smoothstep(0.1, 0.9, v));
      if (i >= lidStart && yMax - yMin > 0.5 && cusps.length) {
        const depth = (yMax - pos.getY(i)) / (yMax - yMin);
        c.lerp(new THREE.Color(0xb3a07d), Math.pow(Math.max(0, depth - 0.22) / 0.78, 1.3) * 0.8);
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return g;
}

/** One root cone (closed), from y0 downward. roundEnd: dome the end instead of a point (used for root trunks). */
function rootGeometry({ cx = 0, cz = 0, a, b, n = 2.2, y0 = 0, length, curve = [0, 0], tipFrac = 0.07, roundEnd = false }) {
  const R = 14, rings = [];
  for (let k = 0; k <= R; k++) {
    const t = k / R;
    let w = lerp(1, tipFrac, Math.pow(t, 1.9));
    if (roundEnd && t > 0.6) { const q = (t - 0.6) / 0.4; w *= Math.sqrt(Math.max(0.02, 1 - q * q * 0.98)); }
    const x0 = cx + curve[0] * t * t, z0 = cz + curve[1] * t * t;
    const pts = [];
    for (let i = 0; i < THETA_N; i++) {
      const th = (i / THETA_N) * Math.PI * 2;
      const [ux, uz] = superPt(1, 1, n, th);
      pts.push([x0 + a * w * ux, y0 - length * t, z0 + b * w * uz]);
    }
    rings.push(pts);
  }
  const tipDrop = roundEnd ? 0.05 : 0.5;
  return loftRings(rings, { startCenter: [cx, y0 + 0.3, cz], endCenter: [cx + curve[0], y0 - length - tipDrop, cz + curve[1]] });
}

/** Describe the roots of a tooth as a trunk plus individual roots. */
function rootPlan(spec, mirror) {
  const P = PROFILES[spec.kind];
  const a0 = (spec.md / 2) * profile(P.x, 0) * 0.97, b0 = (spec.bl / 2) * profile(P.z, 0) * 0.97;
  const L = spec.rootL, m = mirror ? -1 : 1;
  const dist = -1.2 * m; // slight distal curvature of apices
  switch (spec.roots) {
    case 'single':
      return { trunk: null, roots: [{ cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: L, curve: [dist, 0] }] };
    case 'two-bl': {
      const tl = 0.42 * L;
      return { trunk: { cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: tl, tipFrac: 0.86, roundEnd: true, curve: [0, 0] },
        roots: [
          { cx: 0, cz: 0.4 * b0, a: 0.74 * a0, b: 0.46 * b0, y0: -tl + 2.2, length: L - tl + 1.5, curve: [dist, 0.8] },
          { cx: 0, cz: -0.4 * b0, a: 0.74 * a0, b: 0.46 * b0, y0: -tl + 2.2, length: L - tl + 1.5, curve: [dist, -0.8] },
        ] };
    }
    case 'two-md': {
      const tl = 0.32 * L;
      return { trunk: { cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: tl, tipFrac: 0.88, roundEnd: true, curve: [0, 0] },
        roots: [
          { cx: 0.4 * a0 * m, cz: 0, a: 0.38 * a0, b: 0.86 * b0, y0: -tl + 2.2, length: L - tl + 1.5, curve: [-0.6 * m, 0] },
          { cx: -0.4 * a0 * m, cz: 0, a: 0.34 * a0, b: 0.8 * b0, y0: -tl + 2.2, length: L - tl + 0.8, curve: [-1.2 * m, 0] },
        ] };
    }
    case 'three': {
      const tl = 0.38 * L;
      return { trunk: { cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: tl, tipFrac: 0.88, roundEnd: true, curve: [0, 0] },
        roots: [
          { cx: 0.38 * a0 * m, cz: 0.42 * b0, a: 0.34 * a0, b: 0.42 * b0, y0: -tl + 2.2, length: L - tl + 1.5, curve: [0.3 * m, 1.2] },
          { cx: -0.4 * a0 * m, cz: 0.42 * b0, a: 0.3 * a0, b: 0.38 * b0, y0: -tl + 2.2, length: L - tl + 0.8, curve: [-1.0 * m, 1.0] },
          { cx: 0, cz: -0.46 * b0, a: 0.48 * a0, b: 0.44 * b0, y0: -tl + 2.2, length: L - tl + 2, curve: [0, -2.4] },
        ] };
    }
    case 'fused3': {
      const tl = 0.62 * L;
      return { trunk: { cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: tl, tipFrac: 0.75, roundEnd: true, curve: [-0.6 * m, 0] },
        roots: [
          { cx: 0.28 * a0 * m, cz: 0.32 * b0, a: 0.32 * a0, b: 0.36 * b0, y0: -tl + 2.5, length: L - tl + 2, curve: [-0.8 * m, 0.4] },
          { cx: -0.28 * a0 * m, cz: 0.32 * b0, a: 0.3 * a0, b: 0.34 * b0, y0: -tl + 2.5, length: L - tl + 1.5, curve: [-1.2 * m, 0.4] },
          { cx: 0, cz: -0.38 * b0, a: 0.4 * a0, b: 0.36 * b0, y0: -tl + 2.5, length: L - tl + 2, curve: [-0.8 * m, -0.8] },
        ] };
    }
    case 'fused2': {
      const tl = 0.6 * L;
      return { trunk: { cx: 0, cz: 0, a: a0, b: b0, y0: 0.2, length: tl, tipFrac: 0.75, roundEnd: true, curve: [-0.8 * m, 0] },
        roots: [
          { cx: 0.33 * a0 * m, cz: 0, a: 0.34 * a0, b: 0.8 * b0, y0: -tl + 2.5, length: L - tl + 2, curve: [-1.0 * m, 0] },
          { cx: -0.33 * a0 * m, cz: 0, a: 0.32 * a0, b: 0.75 * b0, y0: -tl + 2.5, length: L - tl + 1.5, curve: [-1.4 * m, 0] },
        ] };
    }
  }
  throw new Error('unknown roots ' + spec.roots);
}

/**
 * Build the three tissue layers of one tooth.
 * Returns { enamel, dentin, pulp } geometries plus metrics.
 */
export function buildTooth(specKey, { mirror = false } = {}) {
  const spec = TOOTH_SPECS[specKey];
  const primaryBulge = spec.primary ? 0.1 : 0;
  const plan = rootPlan(spec, mirror);
  const rootGeos = [];
  if (plan.trunk) rootGeos.push(rootGeometry(plan.trunk));
  for (const r of plan.roots) rootGeos.push(rootGeometry(r));

  const enamel = crownGeometry(spec, { mirror, primaryBulge, vertexColors: true });
  const dentinCrown = crownGeometry(spec, { mirror, primaryBulge, inset: v => 0.12 + 1.0 * v, hOffset: -1.1, cuspScale: 0.82 });
  const dentin = mergeGeometries([dentinCrown, ...rootGeos], false);

  const pr = spec.primary;
  const chamberDepth = spec.kind === 'molar' ? 2.2 : spec.kind === 'premolar' ? 1.6 : 1.0;
  const pulpChamber = crownGeometry(spec, {
    mirror, primaryBulge, inset: v => (pr ? 2.0 + 0.8 * v : 2.9 + 1.1 * v), hOffset: pr ? -3.0 : -4.3,
    cuspScale: 0.4, extraBottom: chamberDepth, filletScale: 0.5,
  });
  const canals = plan.roots.map(r => rootGeometry({ ...r, a: Math.max(0.3, r.a * 0.22), b: Math.max(0.3, r.b * 0.24), length: r.length * 0.92, y0: r.y0 + 0.3, tipFrac: 0.3 }));
  if (plan.trunk) canals.push(rootGeometry({ ...plan.trunk, a: plan.trunk.a * 0.36, b: plan.trunk.b * 0.36, length: plan.trunk.length * 0.8, y0: plan.trunk.y0 - 0.3, tipFrac: 0.8, roundEnd: true }));
  const pulp = mergeGeometries([pulpChamber, ...canals], false);

  const apexY = -spec.rootL - 0.5;
  return { enamel, dentin, pulp, spec, metrics: { crownH: spec.crownH, apexY, md: spec.md, bl: spec.bl, rootL: spec.rootL } };
}
