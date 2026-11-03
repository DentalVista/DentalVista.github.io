// "口腔律动" — physiological / pathological demonstrations: chewing, eruption timeline, caries, brushing, periodontitis.
import * as THREE from 'three';
import { gumGeometry, alveolarGeometry } from '../model/softtissue.js';
import { makeMaterial, PALETTE } from '../model/materials.js';
import { LOWER_ARCH, UPPER_ARCH } from '../model/arch.js';
import { smoothstep, lerp, clamp } from '../model/loft.js';

export const MODES = ['chew', 'eruption', 'caries', 'brushing', 'perio'];

export class Animations extends EventTarget {
  constructor(viewer, model, section, interact) {
    super();
    this.viewer = viewer; this.model = model; this.section = section; this.interact = interact;
    this.mode = null;
    this.playing = true;
    this.speed = 1; this.amplitude = 1;
    this.progress = 0;       // 0..1 for timeline-style modes
    this.age = 0;            // eruption
    this.phase = 0;          // chew
    this.jawOpen = 0;        // manual jaw opening (display setting)
    this._lesion = null; this._brush = null;
    this._perioLevel = -1;
    viewer.tick.push((dt) => this.tick(dt));
  }

  start(mode) {
    if (this.mode === mode) return;
    this.stop();
    this.mode = mode; this.playing = true; this.progress = 0;
    if (mode === 'eruption') { this.age = 0; this.model.setAge(0); }
    if (mode === 'caries') this._startCaries();
    if (mode === 'brushing') this._startBrushing();
    if (mode === 'perio') this._applyPerio(0);
    this.dispatchEvent(new CustomEvent('mode', { detail: { mode } }));
  }

  stop() {
    const prev = this.mode;
    if (prev === 'chew') this.model.setJawOpen(this.jawOpen);
    if (prev === 'eruption') { this.model.setAdult(); }
    if (prev === 'caries') this._endCaries();
    if (prev === 'brushing') this._endBrushing();
    if (prev === 'perio') this._applyPerio(0);
    this.mode = null; this.playing = false;
    this.dispatchEvent(new CustomEvent('mode', { detail: { mode: null } }));
  }

  setProgress(p) { this.progress = clamp(p, 0, 1); this._applyProgress(); }
  setAge(a) { this.age = clamp(a, 0, 22); this.model.setAge(this.age); }

  tick(dt) {
    if (!this.mode) { this.model.applyLayout(0.2); return; }
    const adv = this.playing ? dt * this.speed : 0;
    switch (this.mode) {
      case 'chew': {
        this.phase = (this.phase + adv * 0.9) % 1;
        const open = 0.5 - 0.5 * Math.cos(this.phase * Math.PI * 2);
        const lateral = Math.sin(this.phase * Math.PI * 2) * 0.35;
        this.model.setJawOpen(open * 0.55 * this.amplitude, lateral * this.amplitude);
        break;
      }
      case 'eruption': {
        if (this.playing) { this.age += adv * 1.1; if (this.age > 22.5) this.age = 0; this.model.setAge(this.age); }
        this.model.applyLayout(0.12);
        break;
      }
      case 'caries': case 'brushing': case 'perio': {
        if (this.playing) { this.progress += adv * (this.mode === 'brushing' ? 0.03 : 0.045); if (this.progress > 1) this.progress = this.mode === 'brushing' ? 0 : 1; }
        this._applyProgress(dt);
        break;
      }
    }
    this.dispatchEvent(new CustomEvent('tick'));
  }

  _applyProgress(dt = 0) {
    if (this.mode === 'caries') this._updateCaries();
    else if (this.mode === 'brushing') this._updateBrushing(dt);
    else if (this.mode === 'perio') this._applyPerio(this.progress);
  }

  // ---------- caries on tooth 36 ----------
  _startCaries() {
    const e = this.model.get('t36');
    const geo = new THREE.SphereGeometry(1, 28, 20);
    const lesion = new THREE.Mesh(geo, makeMaterial('lesion'));
    lesion.name = 'lesion'; lesion.userData.id = 'lesion';
    e.node.add(lesion);
    this._lesion = lesion; this._lesionEntry = { id: 'lesion', visible: true, state: 'solid', meshes: [lesion], materials: { main: lesion.material }, type: 'tissue' };
    this.section.attach(lesion, 'lesion', this._lesionEntry);
    // abscess at the mesial root apex
    const abscess = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), new THREE.MeshPhysicalMaterial({ color: 0xb0313a, roughness: 0.6, side: THREE.DoubleSide }));
    abscess.position.set(2.2, -e.tooth.spec.rootL - 1.2, 0); abscess.scale.setScalar(0.001); abscess.name = 'abscess';
    e.node.add(abscess); this._abscess = abscess;
    this.section.attach(abscess, 'vessel', this._lesionEntry);
    // cut through the tooth and look at it
    const c = this.model.centerOf('t36');
    this.section.enable('x'); this.section.flipped = false; this.section.cutThrough(c, 'x');
    this.section.refresh();
    this.viewer.flyTo(new THREE.Vector3(c.x + 70, c.y + 8, c.z + 10), new THREE.Vector3(c.x, c.y - 4, c.z), 1.2);
    this._pulpBase = e.materials.pulp.color.clone();
    this._updateCaries();
  }
  _updateCaries() {
    const e = this.model.get('t36'); if (!e || !this._lesion) return;
    const p = this.progress, H = e.tooth.spec.crownH;
    // stage 0-0.2 white spot, 0.2-0.45 enamel cavity, 0.45-0.7 dentine, 0.7-0.85 pulpitis, 0.85-1 periapical abscess
    const grow = smoothstep(0.05, 0.85, p);
    const r = 0.7 + 3.4 * grow;
    this._lesion.scale.set(r * 0.9, r * 1.25, r * 0.9);
    this._lesion.position.set(0.3, H - 0.4 - 4.2 * grow, 0.4);
    const col = this._lesion.material.color;
    if (p < 0.2) col.set(0xf2eedd).lerp(new THREE.Color(0xc9b89a), p / 0.2); else col.set(PALETTE.lesion).lerp(new THREE.Color(0x2d1a0c), smoothstep(0.2, 0.8, p));
    const pulpInflamed = smoothstep(0.65, 0.85, p);
    e.materials.pulp.color.copy(this._pulpBase).lerp(new THREE.Color(0x6e0f1a), pulpInflamed);
    const ab = smoothstep(0.85, 1, p);
    this._abscess.scale.setScalar(Math.max(0.001, ab * 3.2));
    this.stage = p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.7 ? 2 : p < 0.85 ? 3 : 4;
  }
  _endCaries() {
    const e = this.model.get('t36');
    if (this._lesion) { e.node.remove(this._lesion); this._lesion = null; }
    if (this._abscess) { e.node.remove(this._abscess); this._abscess = null; }
    this.section.stencilMeshes = this.section.stencilMeshes.filter(s => s.entry !== this._lesionEntry);
    if (this._pulpBase) e.materials.pulp.color.copy(this._pulpBase);
    this.section.disable();
  }

  // ---------- brushing (Bass technique) ----------
  _startBrushing() {
    const g = new THREE.Group(); g.name = 'toothbrush';
    const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x2457b8, roughness: 0.35, clearcoat: 0.8 });
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(4.5, 95, 6, 16), handleMat); handle.rotation.z = Math.PI / 2; handle.position.x = 58; handle.scale.set(1, 1, 0.6);
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(3, 22, 4, 12), handleMat); neck.rotation.z = Math.PI / 2; neck.position.x = 12; neck.scale.set(1, 1, 0.6);
    const head = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4 }));
    head.position.set(0, 0, 0);
    const bristles = new THREE.Group();
    for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 9, 8), new THREE.MeshPhysicalMaterial({ color: (i + j) % 2 ? 0xd9342b : 0xffffff, roughness: 0.6 }));
      b.position.set(i * 3.4, j * 2.8, -6.5); b.rotation.x = Math.PI / 2; bristles.add(b);
    }
    g.add(handle, neck, head, bristles);
    this.viewer.scene.add(g); this._brush = g;
    this._brushAvg = new THREE.Vector3(); this._brushQuat = new THREE.Quaternion();
    this.model.setJawOpen(0.25);
    this.viewer.flyTo(new THREE.Vector3(110, 30, 150), new THREE.Vector3(0, -2, -25), 1.2);
  }
  _updateBrushing(dt) {
    const p = this.progress; const b = this._brush; if (!b) return;
    // four phases: lower buccal, upper buccal, lower occlusal, lower lingual
    const phase = Math.floor(p * 4), f = (p * 4) % 1;
    const s = lerp(-58, 58, phase % 2 === 0 ? f : 1 - f);
    const arch = phase === 1 ? UPPER_ARCH : LOWER_ARCH;
    const a = arch.at(s);
    const n = new THREE.Vector3(a.nx, 0, a.nz), t = new THREE.Vector3(a.tx, 0, a.tz);
    const pos = new THREE.Vector3(a.x, 0, a.z);
    const up = new THREE.Vector3(0, 1, 0);
    const wobble = Math.sin(performance.now() * 0.02) * 1.3;
    let target, look;
    if (phase === 0) { pos.y = -6; target = pos.clone().addScaledVector(n, 9); look = n.clone().multiplyScalar(-1).addScaledVector(up, -0.9).normalize(); }
    else if (phase === 1) { pos.y = 6; target = pos.clone().addScaledVector(n, 9); look = n.clone().multiplyScalar(-1).addScaledVector(up, 0.9).normalize(); }
    else if (phase === 2) { pos.y = 2; target = pos.clone().addScaledVector(up, 8); look = up.clone().multiplyScalar(-1); }
    else { pos.y = -6; target = pos.clone().addScaledVector(n, -8); look = n.clone().addScaledVector(up, -0.9).normalize(); }
    target.addScaledVector(t, wobble);
    // orient: brush -z (bristles) toward `look`, brush +x (handle) roughly along the tangent away from the midline
    const m = new THREE.Matrix4();
    const zAxis = look.clone().negate();
    let xAxis = t.clone().multiplyScalar(s < 0 ? -1 : 1);
    if (phase === 2) xAxis = t.clone().multiplyScalar(s < 0 ? -1 : 1);
    xAxis.sub(zAxis.clone().multiplyScalar(xAxis.dot(zAxis))).normalize();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis);
    m.makeBasis(xAxis, yAxis, zAxis);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    b.position.lerp(target, 0.25); b.quaternion.slerp(q, 0.2);
    this.stage = phase;
  }
  _endBrushing() {
    if (this._brush) { this.viewer.scene.remove(this._brush); this._brush = null; }
    this.model.setJawOpen(this.jawOpen);
  }

  // ---------- periodontitis ----------
  _applyPerio(level) {
    const q = Math.round(level * 24) / 24; // quantise to limit rebuilds
    if (q === this._perioLevel) return;
    this._perioLevel = q;
    for (const [id, arch] of [['gum_lower', 'L'], ['gum_upper', 'U']]) {
      const e = this.model.get(id); if (!e) continue;
      const geo = gumGeometry(arch, { recession: q, papillaH: lerp(2.6, 0.6, q) });
      this._swapGeometry(e.meshes[0], geo);
      e.materials.main.color.set(PALETTE.gum).lerp(new THREE.Color(0xc0303a), smoothstep(0.05, 0.6, q) * 0.8);
      e.materials.main.roughness = lerp(0.42, 0.25, smoothstep(0.05, 0.6, q));
    }
    for (const [id, arch] of [['mandible', 'L'], ['maxilla', 'U']]) {
      const e = this.model.get(id); if (!e) continue;
      this._swapGeometry(e.meshes[0], alveolarGeometry(arch, { boneLoss: q }));
    }
    this.stage = q < 0.1 ? 0 : q < 0.35 ? 1 : q < 0.7 ? 2 : 3;
  }
  _swapGeometry(mesh, geo) {
    const old = mesh.geometry; mesh.geometry = geo;
    for (const c of mesh.children) if (c.userData.stencil) c.geometry = geo;
    old.dispose();
  }
}
