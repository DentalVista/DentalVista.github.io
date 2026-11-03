// Procedural soft tissue, bone, nerves, vessels and glands around the dental arches.
// World frame: +X patient's left, +Y up, +Z anterior. Occlusal plane y = 0. Units mm.
import * as THREE from 'three';
import { sweep, quadSection, curveFrames, tube, blob, thickSurface, ellipsoid, smoothstep, lerp, clamp, mergeGeometries } from './loft.js';
import { UPPER_ARCH, LOWER_ARCH, layoutWidths } from './arch.js';
import { TOOTH_SPECS } from './tooth.js';

const SEC_N = 36;

/** Arch frames for a sweep from s=-S..+S at height y, with b pointing `up` (+1) or down (-1). */
function archFrames(arch, S, y, upSign, count = 110) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const s = -S + (2 * S * i) / (count - 1);
    const a = arch.at(s);
    frames.push({ p: [a.x, y, a.z], n: [a.nx, 0, a.nz], b: [0, upSign, 0], s });
  }
  return frames;
}

/** Scallop function for gingival margins: 0 at tooth centres, 1 between teeth. */
function makeScallop(archKey) {
  const widths = [1, 2, 3, 4, 5, 6, 7, 8].map(p => TOOTH_SPECS[archKey + p].md);
  const centres = layoutWidths(widths);
  const extent = centres[7] + widths[7] / 2;
  return (s) => {
    const a = Math.abs(s);
    if (a > extent + 1) return 0.35;
    for (let i = 0; i < 8; i++) {
      const c = centres[i], w = widths[i] + 0.15;
      if (a <= c + w / 2) {
        const t = (a - c) / (w / 2); // -1..1
        return 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, -1, 1));
      }
    }
    return 0.35;
  };
}

/**
 * Gingiva sweep. For the lower arch, "top" of the section faces the teeth (+y); for the upper it faces -y.
 * recession (0..1) and inflammation (0..1) are used by the periodontal animation.
 */
export function gumGeometry(archKey, { recession = 0, papillaH = 2.6, S = 74 } = {}) {
  const arch = archKey === 'U' ? UPPER_ARCH : LOWER_ARCH;
  const cejY = archKey === 'U' ? 9.2 : -8.6; // approximate cervical level
  const up = archKey === 'U' ? -1 : 1;        // section "top" faces the crowns
  const scallop = makeScallop(archKey);
  const frames = archFrames(arch, S, cejY, up, 150);
  const sec = (i, f) => {
    const s = f.s;
    const sc = scallop(s);
    const fade = 1 - smoothstep(66, 74, Math.abs(s));
    const base = quadSection(SEC_N, { right: 7.6, left: 6.4, top: 1.4, bottom: archKey === 'U' ? 18 : 13.5, e: 2.4, cy: -recession * 2.5 });
    return base.map(([u, v]) => {
      if (archKey === 'U') { const k = smoothstep(-8, -18, v); u *= 1 - 0.45 * k * k; }
      // raise the papillae between the teeth on the upper (tooth-facing) part of the section
      const tf = smoothstep(-1, 1.2, v);
      const buccal = smoothstep(-2, 2, u);
      const amp = papillaH * (0.55 + 0.45 * buccal) * fade;
      let v2 = v + tf * sc * amp;
      // thin the gum where it meets the crown (sulcus) – pull inward near the top centre
      return [u, v2];
    });
  };
  return sweep(frames, sec);
}

/** Alveolar bone (maxilla alveolar process / mandible body) – sits inside the gingiva. */
export function alveolarGeometry(archKey, { boneLoss = 0 } = {}) {
  const arch = archKey === 'U' ? UPPER_ARCH : LOWER_ARCH;
  const cejY = archKey === 'U' ? 9.2 : -8.6;
  const up = archKey === 'U' ? -1 : 1;
  if (archKey === 'U') {
    const frames = archFrames(arch, 72, cejY, up, 120);
    return sweep(frames, (i, f) => {
      const fade = 1 - smoothstep(62, 72, Math.abs(f.s));
      const sec = quadSection(SEC_N, { right: 6.3 * (0.6 + 0.4 * fade), left: 5.0, top: 1.5, bottom: 15.5, e: 2.0, cy: -(1.8 + boneLoss * 4 + 1.5) });
      // taper the upper part into a rounded ridge (v < 0 points up in the maxillary frame)
      return sec.map(([u, v]) => { const k = smoothstep(-6, -16, v); return [u * (1 - 0.6 * k * k), v]; });
    });
  }
  // mandible body: 3-D path that continues into the rami
  const pts = [];
  const sideCtrl = (sgn) => [[sgn * 44, -14, -74], [sgn * 39, -12, -66], [sgn * 34, -10.5, -58]];
  for (const p of sideCtrl(-1)) pts.push(p);
  for (let s = -62; s <= 62; s += 4) { const a = arch.at(s); pts.push([a.x, cejY, a.z]); }
  for (const p of sideCtrl(1).reverse()) pts.push(p);
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const frames = curveFrames(curve, 160, new THREE.Vector3(0, 1, 0));
  // make sure n points outward (away from the arch interior at z = -30)
  for (const f of frames) {
    const dx = f.p[0] - 0, dz = f.p[2] + 32;
    if (f.n[0] * dx + f.n[2] * dz < 0) { f.n = f.n.map(v => -v); }
    f.b = [0, 1, 0];
  }
  return sweep(frames, (i, f) => {
    const u = i / (frames.length - 1);
    const mid = 1 - Math.abs(u - 0.5) * 2;      // 1 at the chin, 0 at the rami
    const chin = smoothstep(0.75, 1, mid);
    const ramusEnd = smoothstep(0.0, 0.12, Math.min(u, 1 - u));
    const bottom = lerp(24, 29, chin) + 2 * (1 - ramusEnd);
    const sec = quadSection(SEC_N, { right: 6.2 + chin * 1.2, left: 5.0, top: 1.5, bottom, e: 2.2, cy: -(1.6 + boneLoss * 4 + 1.5) });
    // mental protuberance: push the lower-outer part of the section forward at the chin
    return sec.map(([x, y]) => {
      const low = smoothstep(-6, -26, y);
      return [x + chin * low * 3.2 * smoothstep(-2, 4, x), y];
    });
  });
}

/** Ramus plate from a lateral outline, extruded along x. Returns geometry centred at x=0 (mirror for the other side). */
export function ramusGeometry() {
  // outline in (z, y)
  const shape = new THREE.Shape();
  const o = [
    [-54, -33], [-62, -36], [-72, -36.5], [-82, -34], [-88, -28], [-91, -18], [-92, -6], [-91, 2], [-92, 8], [-90, 11.5],
    [-86, 9], [-82, 5], [-76, 2.5], [-70, 3], [-66, 7], [-63, 12], [-61, 13], [-59, 9], [-58, 2], [-57, -8], [-56, -18], [-55, -27],
  ];
  shape.moveTo(o[0][0], o[0][1]);
  for (let i = 1; i < o.length; i++) shape.lineTo(o[i][0], o[i][1]);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: true, bevelThickness: 2.4, bevelSize: 2.2, bevelSegments: 6, curveSegments: 12 });
  // extrude goes along +z of the shape space; rotate so that shape (z,y) maps to world (z,y) and depth along x
  g.rotateY(-Math.PI / 2); // shape x -> world z, extrusion -> world -x
  g.translate(2.5, 0, 0);   // centre the plate on x = 0
  g.computeVertexNormals();
  return g;
}

export function condyleGeometry() {
  return ellipsoid(9.5, 5, 4.6, (x, y, z) => [x, y + 0.08 * x * x * 0.1, z]);
}

export function discGeometry() {
  return ellipsoid(10.5, 1.6, 6.5, (x, y, z, nx, ny) => [x, y + (ny > 0 ? -0.8 * (1 - Math.abs(nx)) : 0), z]);
}

/** Hard palate: thick vault spanning the upper arch. */
export function palateGeometry(kind = 'hard') {
  const crestY = 10.5, inner = 5.2;
  const halfW = (z) => {
    // inner boundary of the upper alveolar ridge at depth z (sample arch and offset inward)
    let best = 0;
    for (let s = 0; s <= 70; s += 1) { const a = UPPER_ARCH.at(s); if (Math.abs(a.z - z) < 1.2) best = Math.max(best, a.x - inner); }
    if (best === 0) best = 2;
    return best + 1.2;
  };
  const z0 = -4, zHardEnd = -52, zSoftEnd = -78;
  const geom = (u, v) => {
    const z = kind === 'hard' ? lerp(z0, zHardEnd, v) : lerp(zHardEnd - 2, zSoftEnd, v);
    const w = kind === 'hard' ? halfW(z) : lerp(halfW(zHardEnd), 20, v);
    const x = (u * 2 - 1) * w;
    return { x, z, w };
  };
  // bottom (oral) surface: the vault
  const f = (u, v) => {
    const { x, z, w } = geom(u, v);
    const lateral = Math.pow(Math.max(0, 1 - (x / (w + 0.5)) ** 2), 0.75);
    if (kind === 'hard') { const depth = 9.5 * smoothstep(-4, -30, z) + 1.5; return [x, crestY + 1.5 + depth * lateral, z]; }
    return [x, crestY + 12.5 - 13 * v * v + 1.5 * lateral, z];
  };
  // top (nasal) surface: nearly flat plate hidden inside the alveolar ridge
  const f2 = (u, v) => {
    const { x, z, w } = geom(u, v);
    const lateral = Math.max(0, 1 - (x / (w + 0.5)) ** 2);
    if (kind === 'hard') return [x, crestY + 14.5 + 1.5 * lateral, z];
    return [x, crestY + 16.5 - 13 * v * v + 1.0 * lateral, z];
  };
  return thickSurface(f, 40, kind === 'hard' ? 40 : 20, 3, f2);
}

export function uvulaGeometry() {
  return ellipsoid(3.2, 7, 3, (x, y, z, nx, ny) => [x * (1 - 0.3 * Math.max(0, ny)), y, z]);
}

export function tongueGeometry() {
  const rx = 21, ry = 8.5, rz = 31;
  return ellipsoid(rx, ry, rz, (x, y, z, nx, ny, nz) => {
    const front = Math.max(0, nz);
    x *= 1 - 0.38 * front * front;          // taper the tip
    if (ny < 0) y *= 0.55;                    // flatter underside
    if (ny > 0) y -= 1.6 * Math.exp(-((x / 4.5) ** 2)) * (1 - front * 0.6); // median sulcus
    y += 7 * Math.max(0, -nz) ** 2;           // dorsum rises toward the oropharynx
    return [x, y, z];
  }, 56);
}

/** Point list helpers (mirrored by sign). */
const M = (sgn, pts) => pts.map(([x, y, z]) => [sgn * x, y, z]);

export function nervePaths(sgn) {
  return {
    ian: M(sgn, [[43, -6, -80], [38, -17, -67], [33, -24, -54], [29, -26, -42], [25, -25, -30], [22, -23, -20]]),
    mental: M(sgn, [[22, -23, -20], [25.5, -20, -17], [29, -16, -14], [30, -9, -12]]),
    incisive: M(sgn, [[22, -23, -20], [17, -24, -13], [10, -24, -7], [3, -23, -3]]),
    lingual: M(sgn, [[41, -3, -78], [33, -8, -62], [25, -12, -46], [17, -14, -32], [11, -13, -20], [8, -12, -16]]),
    psa: M(sgn, [[36, 20, -60], [33, 23, -50], [30, 24, -40], [27, 25, -30], [22, 26, -20], [15, 27, -10], [7, 27, -4], [2, 26, -2]]),
    greaterPalatine: M(sgn, [[15, 14, -52], [14, 14, -42], [12.5, 13.5, -30], [10, 13, -18], [6, 12.5, -9], [2, 12.5, -6]]),
  };
}

export function vesselPaths(sgn) {
  return {
    iaa: M(sgn, [[44, -4, -81], [39, -15, -68], [34, -22, -55], [30, -24, -43], [26, -23, -31], [23, -21, -21], [18, -22, -14], [10, -22, -8]]),
    lingualA: M(sgn, [[24, -16, -62], [18, -12, -48], [12, -7, -34], [6, -4, -20], [3, -3, -8]]),
    facialA: M(sgn, [[46, -34, -72], [46, -26, -58], [44, -16, -44], [41, -6, -30], [38, 2, -20], [36, 10, -12], [35, 18, -6]]),
  };
}

export function ductPaths(sgn) {
  return {
    stensen: M(sgn, [[52, 2, -72], [47, 4, -60], [41, 6, -50], [35.5, 5, -42]]),
    wharton: M(sgn, [[24, -32, -48], [18, -24, -38], [11, -16, -26], [5, -11, -14], [2, -10, -9]]),
  };
}

/** Build every soft/hard tissue mesh geometry keyed by id. */
export function buildTissues() {
  const out = {};
  out.gum_upper = gumGeometry('U');
  out.gum_lower = gumGeometry('L');
  out.maxilla = alveolarGeometry('U');
  out.mandible = alveolarGeometry('L');
  const ramus = ramusGeometry();
  for (const [key, sgn] of [['L', 1], ['R', -1]]) {
    const r = ramus.clone();
    const m = new THREE.Matrix4().makeTranslation(sgn * 44.5, 0, 0).multiply(new THREE.Matrix4().makeRotationZ(sgn * -0.07));
    r.applyMatrix4(m); if (sgn < 0) { /* mirrored x via translation only; outline symmetric so no winding issue */ }
    r.computeVertexNormals();
    out['ramus_' + key] = r;
    const c = condyleGeometry(); c.translate(sgn * 50, 11, -90); out['condyle_' + key] = c;
    const d = discGeometry(); d.translate(sgn * 50, 17.5, -90); out['disc_' + key] = d;
    const N = nervePaths(sgn), V = vesselPaths(sgn), D = ductPaths(sgn);
    out['ian_' + key] = tube(N.ian, 1.1, { seg: 48 });
    out['mental_' + key] = tube(N.mental, 0.8, { seg: 24 });
    out['incisive_' + key] = tube(N.incisive, 0.6, { seg: 24 });
    out['lingualn_' + key] = tube(N.lingual, 0.9, { seg: 48 });
    out['psa_' + key] = tube(N.psa, 0.75, { seg: 56 });
    out['gpn_' + key] = tube(N.greaterPalatine, 0.65, { seg: 40 });
    out['iaa_' + key] = tube(V.iaa, 0.7, { seg: 56 });
    out['linguala_' + key] = tube(V.lingualA, 0.75, { seg: 40 });
    out['faciala_' + key] = tube(V.facialA, 0.65, { seg: 48 });
    const par = blob(12.5, 18, 9, { bumps: 0.1, seed: 1 + sgn }); par.translate(sgn * 57, -8, -88); out['parotid_' + key] = par;
    out['stensen_' + key] = tube(D.stensen, 0.7, { seg: 32 });
    const sm = blob(13, 9.5, 16, { bumps: 0.09, seed: 2.3 + sgn }); sm.translate(sgn * 31, -40, -56); out['submandibular_' + key] = sm;
    out['wharton_' + key] = tube(D.wharton, 0.55, { seg: 40 });
    const sl = blob(6, 5, 14, { bumps: 0.1, seed: 3.1 + sgn }); sl.rotateY(sgn * 0.5); sl.translate(sgn * 15, -12, -24); out['sublingual_' + key] = sl;
  }
  out.palate_hard = palateGeometry('hard');
  out.palate_soft = palateGeometry('soft');
  const uv = uvulaGeometry(); uv.translate(0, 6.5, -79); out.uvula = uv;
  const tg = tongueGeometry(); tg.translate(0, -2.5, -34); out.tongue = tg;
  return out;
}
