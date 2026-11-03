// Dental arch curve, FDI numbering and tooth placement.
// World frame: +X = patient's left, +Y = up, +Z = anterior. Occlusal plane y = 0.
import * as THREE from 'three';
import { TOOTH_SPECS } from './tooth.js';

/**
 * Bonwill-Hawley style arch: an anterior circular segment (radius R) that continues as straight,
 * slightly diverging posterior segments. Offset inward by `inset`, parametrised by arc length s
 * (signed; + = patient's left).
 */
export class ArchCurve {
  constructor({ R = 23, slope = 3.5, inset = 0, zShift = 0 } = {}) {
    this.inset = inset; this.zShift = zShift;
    this.pts = []; this.len = [];
    // x where the circle tangent reaches the posterior slope
    const xT = slope * R / Math.sqrt(1 + slope * slope);
    const zT = Math.sqrt(R * R - xT * xT) - R;
    let L = 0, prev = null;
    for (let x = 0; x <= 48; x += 0.05) {
      let z, nx, nz;
      if (x <= xT) { z = Math.sqrt(Math.max(0, R * R - x * x)) - R; nx = x / R; nz = (z + R) / R; }
      else { z = zT - slope * (x - xT); nx = slope; nz = 1; }
      const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
      const p = [x - inset * nx, z - inset * nz + zShift];
      if (prev) L += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      this.pts.push(p); this.len.push(L); prev = p;
    }
    this.total = L;
  }
  /** Returns { x, z, tx, tz, nx, nz } at signed arc length s. Tangent points away from the midline, normal outward. */
  at(s) {
    const sign = s < 0 ? -1 : 1, a = Math.min(Math.abs(s), this.total - 0.1);
    let i = 0; while (i < this.len.length - 2 && this.len[i + 1] < a) i++;
    const t = (a - this.len[i]) / Math.max(1e-6, this.len[i + 1] - this.len[i]);
    const p0 = this.pts[i], p1 = this.pts[i + 1];
    const x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t;
    let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
    // outward normal: rotate tangent by -90° (for +x side); z-forward is outward at the midline
    let nx = tz, nz = -tx; if (nz < 0) { nx = -nx; nz = -nz; }
    return { x: sign * x, z, tx: sign * tx, tz, nx: sign * nx, nz };
  }
}

export const UPPER_ARCH = new ArchCurve({ R: 23, slope: 3.5, inset: 0, zShift: 0 });
export const LOWER_ARCH = new ArchCurve({ R: 23, slope: 3.5, inset: 2.4, zShift: -0.4 });

// Quadrants: 1 upper right, 2 upper left, 3 lower left, 4 lower right (FDI). Primary: 5,6,7,8.
export const QUADRANTS = [
  { q: 1, arch: 'U', side: 'R', primary: false }, { q: 2, arch: 'U', side: 'L', primary: false },
  { q: 3, arch: 'L', side: 'L', primary: false }, { q: 4, arch: 'L', side: 'R', primary: false },
  { q: 5, arch: 'U', side: 'R', primary: true }, { q: 6, arch: 'U', side: 'L', primary: true },
  { q: 7, arch: 'L', side: 'L', primary: true }, { q: 8, arch: 'L', side: 'R', primary: true },
];
const PRIMARY_POS = ['A', 'B', 'C', 'D', 'E'];

/** Universal numbering (1–32 / A–T) from FDI. */
export function universalFromFDI(fdi) {
  const q = Math.floor(fdi / 10), p = fdi % 10;
  if (q === 1) return String(9 - p);
  if (q === 2) return String(8 + p);
  if (q === 3) return String(25 - p);
  if (q === 4) return String(24 + p);
  const letters = 'ABCDEFGHIJKLMNOPQRST';
  if (q === 5) return letters[5 - p];
  if (q === 6) return letters[4 + p];
  if (q === 7) return letters[15 - p];
  if (q === 8) return letters[14 + p];
  return '';
}

/** Palmer notation string (e.g. "UR6"). */
export function palmerFromFDI(fdi) {
  const q = Math.floor(fdi / 10), p = fdi % 10;
  const side = (q === 1 || q === 4 || q === 5 || q === 8) ? 'R' : 'L';
  const arch = (q <= 2 || q === 5 || q === 6) ? 'U' : 'L';
  const sym = q >= 5 ? PRIMARY_POS[p - 1] : String(p);
  return `${arch}${side}${sym}`;
}

/** All tooth descriptors (52 teeth: 32 permanent + 20 primary). */
export function allTeeth() {
  const out = [];
  for (const Q of QUADRANTS) {
    const count = Q.primary ? 5 : 8;
    for (let p = 1; p <= count; p++) {
      const specKey = Q.arch + (Q.primary ? PRIMARY_POS[p - 1] : String(p));
      const fdi = Q.q * 10 + p;
      out.push({ fdi, pos: p, quadrant: Q.q, arch: Q.arch, side: Q.side, primary: Q.primary, specKey, spec: TOOTH_SPECS[specKey] });
    }
  }
  return out;
}

// Labial inclination (degrees, crown tips outward) by arch + position.
const INCLINE = { U: [0, 17, 14, 9, 4, 3, 0, -2, -4], L: [0, 4, 3, 1, 0, 0, -2, -4, -6] };

/**
 * Compute a world matrix for a tooth.
 * s: arc-length of the tooth centre from the midline (positive). side 'L' => +X.
 * verticalOffset: extra y (eruption animation).
 */
export function toothMatrix(tooth, s, verticalOffset = 0) {
  const arch = tooth.arch === 'U' ? UPPER_ARCH : LOWER_ARCH;
  const sgn = tooth.side === 'L' ? 1 : -1;
  const a = arch.at(sgn * s);
  const H = tooth.spec.crownH;
  const spee = 0.0007 * s * s; // curve of Spee (mm)
  const anterior = tooth.pos <= 3;
  let y;
  if (tooth.arch === 'U') y = H - (anterior ? (tooth.primary ? 1.0 : 2.0) : 0.5) - spee * 0.5;
  else y = -H + spee - (anterior ? 0.2 : 0);
  y += verticalOffset;
  const X = new THREE.Vector3(-a.tx, 0, -a.tz);          // mesial: toward the midline
  const Y = new THREE.Vector3(0, tooth.arch === 'U' ? -1 : 1, 0);
  const Z = new THREE.Vector3(a.nx, 0, a.nz);            // buccal/labial: outward
  const basis = new THREE.Matrix4().makeBasis(X, Y, Z);
  const incl = THREE.MathUtils.degToRad(INCLINE[tooth.arch][tooth.pos] * (tooth.primary ? 0.6 : 1));
  const tilt = new THREE.Matrix4().makeRotationX(incl);
  const m = new THREE.Matrix4().makeTranslation(a.x, y, a.z).multiply(basis).multiply(tilt);
  return m;
}

/** Positions (arc length of centres) for an ordered list of mesiodistal widths from the midline. */
export function layoutWidths(widths, gap = 0.15) {
  let s = 0; const out = [];
  for (const w of widths) { out.push(s + w / 2); s += w + gap; }
  return out;
}

/** Adult arch length to the distal of the third molar (for gums/bone). */
export function archExtent(archKey) {
  const widths = [1, 2, 3, 4, 5, 6, 7, 8].map(p => TOOTH_SPECS[archKey + p].md);
  return widths.reduce((a, b) => a + b + 0.15, 0);
}
