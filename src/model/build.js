// Assembles the complete oral model (teeth + tissues) and keeps a registry of selectable structures.
import * as THREE from 'three';
import { buildTooth } from './tooth.js';
import { allTeeth, toothMatrix, layoutWidths, universalFromFDI, palmerFromFDI } from './arch.js';
import { buildTissues } from './softtissue.js';
import { makeMaterial } from './materials.js';
import { buildCatalog } from '../data/structures.js';
import { POSITION_NAMES, TOOTH_KNOWLEDGE } from '../data/teeth.js';
import { PERMANENT_ERUPTION, PRIMARY_ERUPTION } from '../data/eruption.js';
import { clamp, smoothstep } from './loft.js';

const PRIMARY_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function materialKindFor(id) {
  if (id.startsWith('gum')) return 'gum';
  if (id.startsWith('maxilla') || id.startsWith('mandible') || id.startsWith('ramus')) return 'bone';
  if (id.startsWith('condyle')) return 'condyle';
  if (id.startsWith('disc')) return 'disc';
  if (id === 'palate_hard') return 'palate';
  if (id === 'palate_soft') return 'softPalate';
  if (id === 'uvula') return 'uvula';
  if (id === 'tongue') return 'tongue';
  if (/^(ian|mental|incisive|lingualn|psa|gpn)_/.test(id)) return 'nerve';
  if (/^(iaa|linguala|faciala)_/.test(id)) return 'vessel';
  if (/^(parotid|submandibular|sublingual)_/.test(id)) return 'gland';
  if (/^(stensen|wharton)_/.test(id)) return 'duct';
  return 'default';
}

export function toothName(tooth) {
  const arch = tooth.arch === 'U' ? { zh: '上颌', en: 'Upper' } : { zh: '下颌', en: 'Lower' };
  const side = tooth.side === 'L' ? { zh: '左侧', en: 'left' } : { zh: '右侧', en: 'right' };
  const posKey = tooth.primary ? PRIMARY_LETTERS[tooth.pos - 1] : tooth.pos;
  const pn = POSITION_NAMES[posKey];
  return { zh: `${arch.zh}${side.zh}${pn.zh}`, en: `${arch.en} ${side.en} ${pn.en}` };
}

export class OralModel {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'DentalVista';
    this.structures = new Map();
    this.teeth = [];
    this.catalog = buildCatalog();
    this.layoutTargets = new Map(); // tooth id -> { s, offset }
    this.dentition = 'adult';
    // upper (fixed to the skull) and lower (mandible, pivoting at the condylar axis) groups
    this.pivot = new THREE.Vector3(0, 11, -90);
    this.upperGroup = new THREE.Group(); this.upperGroup.name = 'upperJaw';
    this.lowerGroup = new THREE.Group(); this.lowerGroup.name = 'lowerJaw';
    this.lowerInner = new THREE.Group(); this.lowerInner.name = 'lowerJawInner';
    this.lowerGroup.position.copy(this.pivot); this.lowerInner.position.copy(this.pivot).negate();
    this.lowerGroup.add(this.lowerInner);
    this.root.add(this.upperGroup, this.lowerGroup);
    this._buildTeeth();
    this._buildTissues();
    this.setAdult();
  }

  _buildTeeth() {
    for (const t of allTeeth()) {
      const g = buildTooth(t.specKey, { mirror: t.side === 'R' });
      const node = new THREE.Group();
      node.name = 't' + t.fdi;
      node.matrixAutoUpdate = false;
      const mats = {
        enamel: makeMaterial(t.primary ? 'primaryEnamel' : 'enamel'),
        dentin: makeMaterial('dentin'),
        pulp: makeMaterial('pulp'),
      };
      const meshes = {};
      for (const layer of ['enamel', 'dentin', 'pulp']) {
        const m = new THREE.Mesh(g[layer], mats[layer]);
        m.name = `t${t.fdi}_${layer}`;
        m.castShadow = layer === 'enamel'; m.receiveShadow = true;
        m.userData = { id: 't' + t.fdi, layer };
        meshes[layer] = m; node.add(m);
      }
      const id = 't' + t.fdi;
      const entry = {
        id, type: 'tooth', system: 'teeth', tooth: t, node, meshes: Object.values(meshes), layerMeshes: meshes, materials: mats,
        name: toothName(t), regions: ['all', t.arch === 'U' ? 'upper' : 'lower', t.pos <= 3 ? 'anterior' : 'posterior', t.side === 'L' ? 'left' : 'right'],
        knowledge: TOOTH_KNOWLEDGE[t.specKey], specKey: t.specKey, fdi: t.fdi, universal: universalFromFDI(t.fdi), palmer: palmerFromFDI(t.fdi),
        state: 'solid', visible: true, metrics: g.metrics,
        cur: { s: 0, offset: 0 }, target: { s: 0, offset: 0, present: true },
      };
      this.structures.set(id, entry);
      this.teeth.push(entry);
      (t.arch === 'U' ? this.upperGroup : this.lowerInner).add(node);
    }
  }

  _buildTissues() {
    const geos = buildTissues();
    const FIXED = new Set(['disc_L', 'disc_R', 'parotid_L', 'parotid_R', 'faciala_L', 'faciala_R', 'stensen_L', 'stensen_R']);
    for (const [id, geo] of Object.entries(geos)) {
      const cat = this.catalog[id];
      if (!cat) { console.warn('no catalog entry for', id); continue; }
      const mat = makeMaterial(materialKindFor(id));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = id; mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { id };
      const lower = !FIXED.has(id) && (cat.regions.includes('lower') || cat.regions.includes('floor'));
      (lower ? this.lowerInner : this.upperGroup).add(mesh);
      // the facial artery lies in the cheek and would block close-up views of the teeth: hidden until asked for
      const defaultHidden = id.startsWith('faciala');
      mesh.visible = !defaultHidden;
      this.structures.set(id, {
        id, type: 'tissue', system: cat.system, node: mesh, meshes: [mesh], materials: { main: mat }, name: cat.name,
        regions: ['all', ...cat.regions], knowledge: cat, state: 'solid', visible: !defaultHidden, defaultHidden, userShown: false,
      });
    }
  }

  /** Adult permanent dentition: all 32 permanent teeth in occlusion, primary teeth hidden. */
  setAdult() {
    this.dentition = 'adult';
    for (const arch of ['U', 'L']) for (const side of ['L', 'R']) {
      const perm = this.teeth.filter(e => !e.tooth.primary && e.tooth.arch === arch && e.tooth.side === side).sort((a, b) => a.tooth.pos - b.tooth.pos);
      const pos = layoutWidths(perm.map(e => e.tooth.spec.md));
      perm.forEach((e, i) => { e.target = { s: pos[i], offset: 0, present: true }; });
      for (const e of this.teeth.filter(e => e.tooth.primary && e.tooth.arch === arch && e.tooth.side === side)) e.target = { s: e.cur.s, offset: 0, present: false };
    }
    this.applyLayout(1);
  }

  /** Dentition at a given age (years) for the eruption timeline. */
  setAge(age) {
    this.dentition = 'age';
    const rise = (start, dur) => smoothstep(start, start + dur, age);
    for (const arch of ['U', 'L']) for (const side of ['L', 'R']) {
      const slotW = [], occupants = [];
      for (let slot = 1; slot <= 8; slot++) {
        const perm = this.teeth.find(e => !e.tooth.primary && e.tooth.arch === arch && e.tooth.side === side && e.tooth.pos === slot);
        const prim = slot <= 5 ? this.teeth.find(e => e.tooth.primary && e.tooth.arch === arch && e.tooth.side === side && e.tooth.pos === slot) : null;
        const pe = PERMANENT_ERUPTION[perm.specKey];
        let fPerm = rise(pe, 1.2);
        let fPrim = 0;
        if (prim) {
          const pr = PRIMARY_ERUPTION[prim.specKey];
          fPrim = rise(pr.erupt, 0.6) * (1 - smoothstep(pr.shed - 0.4, pr.shed, age));
          // the successor starts moving only once the primary tooth is shed
          fPerm = rise(Math.max(pe, pr.shed - 0.2), 1.2);
        }
        let occupant = null, width = 0;
        if (prim && fPrim > 0.001 && fPerm < 0.5) { occupant = prim; width = prim.tooth.spec.md; prim.target = { ...prim.target, present: true, offset: this._offsetFor(prim, fPrim) }; perm.target = { ...perm.target, present: fPerm > 0.001, offset: this._offsetFor(perm, fPerm) }; }
        else if (fPerm > 0.001) { occupant = perm; width = perm.tooth.spec.md; perm.target = { ...perm.target, present: true, offset: this._offsetFor(perm, fPerm) }; if (prim) prim.target = { ...prim.target, present: fPrim > 0.001, offset: this._offsetFor(prim, fPrim) }; }
        else { perm.target = { ...perm.target, present: false }; if (prim) prim.target = { ...prim.target, present: false }; }
        // a permanent tooth erupting behind a still-present primary tooth shares its slot
        slotW.push(width); occupants.push({ perm, prim, occupant });
      }
      const pos = layoutWidths(slotW.map(w => (w > 0 ? w : 0)), 0.15);
      occupants.forEach((o, i) => {
        const s = slotW[i] > 0 ? pos[i] : (i > 0 ? pos[i - 1] + slotW[i - 1] / 2 + o.perm.tooth.spec.md / 2 : o.perm.tooth.spec.md / 2);
        o.perm.target.s = s; if (o.prim) o.prim.target.s = s;
      });
    }
  }

  _offsetFor(entry, f) {
    const sign = entry.tooth.arch === 'U' ? 1 : -1;
    return sign * (1 - clamp(f, 0, 1)) * (entry.tooth.spec.crownH + 5);
  }

  /** Move teeth toward their targets. k = 1 snaps immediately. */
  applyLayout(k = 0.15) {
    for (const e of this.teeth) {
      const tgt = e.target;
      if (tgt.present) {
        if (!e.node.visible) { e.cur.s = tgt.s; e.cur.offset = tgt.offset; }
        e.cur.s += (tgt.s - e.cur.s) * k; e.cur.offset += (tgt.offset - e.cur.offset) * k;
        e.node.visible = e.visible;
        e.node.matrix.copy(toothMatrix(e.tooth, e.cur.s, e.cur.offset));
        e.node.matrixWorldNeedsUpdate = true;
      } else {
        e.node.visible = false;
      }
    }
  }

  /** Open the mandible: f = 0 closed .. 1 wide open (rotation about the condylar axis + forward translation). */
  setJawOpen(f, lateral = 0) {
    this.lowerGroup.rotation.x = f * THREE.MathUtils.degToRad(24);
    this.lowerGroup.position.set(this.pivot.x + lateral * 4, this.pivot.y - f * 1.5, this.pivot.z + f * 7);
    this.lowerGroup.rotation.y = lateral * 0.06;
  }

  get(id) { return this.structures.get(id); }
  list() { return [...this.structures.values()]; }

  /** World-space centre of a structure. */
  centerOf(id, target = new THREE.Vector3()) {
    const e = this.get(id); if (!e) return target;
    const box = new THREE.Box3();
    for (const m of e.meshes) { m.updateWorldMatrix(true, false); box.expandByObject(m); }
    return box.getCenter(target);
  }
  boxOf(id) {
    const e = this.get(id); const box = new THREE.Box3();
    if (e) for (const m of e.meshes) { m.updateWorldMatrix(true, false); box.expandByObject(m); }
    return box;
  }
}
