// Generic procedural-geometry helpers (units: millimetres, Y up).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { mergeGeometries };

/** Superellipse point in the XZ plane: half-widths a (x), b (z), exponent n (2 = ellipse, 4 = rounded square). */
export function superPt(a, b, n, theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const e = 2 / n;
  return [a * Math.sign(c) * Math.pow(Math.abs(c), e), b * Math.sign(s) * Math.pow(Math.abs(s), e)];
}

/** Piece-wise smooth 1-D interpolation through [[t, value], ...] keypoints (monotone t). */
export function profile(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      const s = u * u * (3 - 2 * u); // smoothstep
      return v0 + (v1 - v0) * s;
    }
  }
  return keys[keys.length - 1][1];
}

export const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/**
 * Loft a list of rings (each an array of N [x,y,z] points, same N) into a closed mesh.
 * Optional caps: a centre vertex fan at the start and end ring.
 */
export function loftRings(rings, { capStart = true, capEnd = true, startCenter = null, endCenter = null } = {}) {
  const N = rings[0].length, R = rings.length;
  const pos = [];
  for (const ring of rings) for (const p of ring) pos.push(p[0], p[1], p[2]);
  const idx = [];
  for (let r = 0; r < R - 1; r++) {
    for (let i = 0; i < N; i++) {
      const a = r * N + i, b = r * N + (i + 1) % N, c = (r + 1) * N + i, d = (r + 1) * N + (i + 1) % N;
      idx.push(a, c, b, b, c, d);
    }
  }
  let vCount = R * N;
  if (capStart) {
    const c = startCenter || centroid(rings[0]);
    pos.push(c[0], c[1], c[2]);
    const ci = vCount++;
    for (let i = 0; i < N; i++) idx.push(ci, (i + 1) % N, i);
  }
  if (capEnd) {
    const c = endCenter || centroid(rings[R - 1]);
    pos.push(c[0], c[1], c[2]);
    const ci = vCount++;
    const base = (R - 1) * N;
    for (let i = 0; i < N; i++) idx.push(ci, base + i, base + (i + 1) % N);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function centroid(ring) {
  let x = 0, y = 0, z = 0;
  for (const p of ring) { x += p[0]; y += p[1]; z += p[2]; }
  const n = ring.length;
  return [x / n, y / n, z / n];
}

/** Flip triangle winding (after a mirroring transform). */
export function flipWinding(g) {
  const idx = g.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  g.index.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Apply a Matrix4 and fix winding if the matrix is left-handed. */
export function applyBasis(g, m) {
  g.applyMatrix4(m);
  if (m.determinant() < 0) flipWinding(g); else g.computeVertexNormals();
  return g;
}

/**
 * Sweep a cross-section along a path.
 * frames: array of { p:[x,y,z], n:[x,y,z] (cross-section "x"), b:[x,y,z] (cross-section "y") }
 * section(i, frame) -> array of [u, v] points (same length for every i).
 */
export function sweep(frames, section, opts = {}) {
  const rings = frames.map((f, i) => {
    const sec = section(i, f);
    return sec.map(([u, v]) => [
      f.p[0] + f.n[0] * u + f.b[0] * v,
      f.p[1] + f.n[1] * u + f.b[1] * v,
      f.p[2] + f.n[2] * u + f.b[2] * v,
    ]);
  });
  return loftRings(rings, opts);
}

/** Four-quadrant superellipse section: different radii per quadrant (right/top/left/bottom). */
export function quadSection(count, { right, left, top, bottom, e = 2.5, cx = 0, cy = 0 }) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const rx = c >= 0 ? right : left, ry = s >= 0 ? top : bottom;
    pts.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / e)]);
  }
  return pts;
}

/** Frames along a 3-D curve (THREE.Curve) with a fixed "up" binormal, n = tangent x up. */
export function curveFrames(curve, count, up = new THREE.Vector3(0, 1, 0)) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const p = curve.getPointAt(t), tan = curve.getTangentAt(t).normalize();
    let n = new THREE.Vector3().crossVectors(tan, up);
    if (n.lengthSq() < 1e-6) n = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(1, 0, 0));
    n.normalize();
    const b = new THREE.Vector3().crossVectors(n, tan).normalize();
    frames.push({ p: p.toArray(), n: n.toArray(), b: b.toArray(), t: tan.toArray(), u: t });
  }
  return frames;
}

/** Lumpy blob (for glands): sphere displaced by a sum of sines. */
export function blob(rx, ry, rz, { seg = 36, bumps = 0.12, seed = 1 } = {}) {
  const g = new THREE.SphereGeometry(1, seg, seg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + bumps * (Math.sin(5.1 * x + seed) * Math.sin(4.3 * y - seed) + 0.6 * Math.sin(7.7 * z + 2 * seed) * Math.cos(3.1 * x));
    p.setXYZ(i, x * d * rx, y * d * ry, z * d * rz);
  }
  g.computeVertexNormals();
  return g;
}

/** Tube along points (CatmullRom), closed geometry. */
export function tube(points, radius, { seg = 64, radial = 10, radiusFn = null } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const frames = curveFrames(curve, seg, new THREE.Vector3(0.02, 1, 0.01).normalize());
  return sweep(frames, (i) => {
    const r = radiusFn ? radiusFn(i / (seg - 1)) : radius;
    const pts = [];
    for (let k = 0; k < radial; k++) { const a = k / radial * Math.PI * 2; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
    return pts;
  });
}

/** Thick shell from a parametric surface f(u,v)->[x,y,z], offset along the normal by thickness. Closed mesh. */
export function thickSurface(f, nu, nv, thickness, f2 = null) {
  const grid = (off) => {
    const pts = [];
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv;
        if (off !== 0 && f2) { pts.push(new THREE.Vector3(...f2(u, v))); continue; }
        const p = new THREE.Vector3(...f(u, v));
        if (off === 0) { pts.push(p); continue; }
        const du = new THREE.Vector3(...f(Math.min(1, u + 1e-3), v)).sub(new THREE.Vector3(...f(Math.max(0, u - 1e-3), v)));
        const dv = new THREE.Vector3(...f(u, Math.min(1, v + 1e-3))).sub(new THREE.Vector3(...f(u, Math.max(0, v - 1e-3))));
        const nrm = new THREE.Vector3().crossVectors(du, dv).normalize();
        pts.push(p.addScaledVector(nrm, off));
      }
    }
    return pts;
  };
  const top = grid(0), bot = grid(thickness);
  const pos = [], idx = [];
  const push = (p) => { pos.push(p.x, p.y, p.z); return pos.length / 3 - 1; };
  const topIdx = top.map(push), botIdx = bot.map(push);
  const at = (arr, i, j) => arr[j * (nu + 1) + i];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = at(topIdx, i, j), b = at(topIdx, i + 1, j), c = at(topIdx, i, j + 1), d = at(topIdx, i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
    const a2 = at(botIdx, i, j), b2 = at(botIdx, i + 1, j), c2 = at(botIdx, i, j + 1), d2 = at(botIdx, i + 1, j + 1);
    idx.push(a2, b2, c2, b2, d2, c2);
  }
  const rim = (ia, ja, ib, jb) => {
    const a = at(topIdx, ia, ja), b = at(topIdx, ib, jb), a2 = at(botIdx, ia, ja), b2 = at(botIdx, ib, jb);
    idx.push(a, b, a2, b, b2, a2);
  };
  for (let i = 0; i < nu; i++) { rim(i, 0, i + 1, 0); rim(i + 1, nv, i, nv); }
  for (let j = 0; j < nv; j++) { rim(0, j + 1, 0, j); rim(nu, j, nu, j + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Ellipsoid with optional per-vertex deform callback (x,y,z)->[x,y,z]. */
export function ellipsoid(rx, ry, rz, deform = null, seg = 48) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * rx, y = p.getY(i) * ry, z = p.getZ(i) * rz;
    if (deform) [x, y, z] = deform(x, y, z, p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
