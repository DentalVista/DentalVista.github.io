// Section (cut-away) tool: a global clipping plane plus stencil-based solid caps per tissue type.
import * as THREE from 'three';

const CAP_ORDER = ['gum', 'bone', 'condyle', 'disc', 'palate', 'softPalate', 'uvula', 'tongue', 'gland', 'duct', 'enamel', 'dentin', 'pulp', 'nerve', 'vessel', 'lesion', 'default'];

function capKindFor(entry, layer) {
  if (entry.type === 'tooth') return layer; // enamel / dentin / pulp
  const id = entry.id;
  if (id.startsWith('gum')) return 'gum';
  if (/^(maxilla|mandible|ramus)/.test(id)) return 'bone';
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
  if (id.startsWith('lesion')) return 'lesion';
  return 'default';
}

export class SectionTool {
  constructor(viewer, model) {
    this.viewer = viewer; this.model = model;
    this.plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5);
    this.enabled = false;
    this.axis = 'x'; this.flipped = false; this.t = 0.5;
    this.bounds = new THREE.Box3(new THREE.Vector3(-70, -60, -105), new THREE.Vector3(70, 40, 15));
    this.stencilMeshes = []; // { mesh, entry }
    this.caps = new Map();   // kind -> cap mesh
    this.group = new THREE.Group(); this.group.name = 'sectionCaps'; this.group.visible = false;
    viewer.scene.add(this.group);
    this._buildStencils();
  }

  _stencilMaterial(side, inc) {
    const m = new THREE.MeshBasicMaterial();
    m.depthWrite = false; m.depthTest = false; m.colorWrite = false; m.stencilWrite = true; m.stencilFunc = THREE.AlwaysStencilFunc;
    m.side = side;
    const op = inc ? THREE.IncrementWrapStencilOp : THREE.DecrementWrapStencilOp;
    m.stencilFail = op; m.stencilZFail = op; m.stencilZPass = op;
    return m;
  }

  _buildStencils() {
    const mats = {};
    const matFor = (kind) => {
      if (!mats[kind]) mats[kind] = { back: this._stencilMaterial(THREE.BackSide, true), front: this._stencilMaterial(THREE.FrontSide, false) };
      return mats[kind];
    };
    for (const entry of this.model.list()) {
      for (const mesh of entry.meshes) {
        const kind = capKindFor(entry, mesh.userData.layer);
        this.attach(mesh, kind, entry);
      }
    }
    // cap planes
    CAP_ORDER.forEach((kind, i) => {
      const color = this._capColor(kind);
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.85, metalness: 0,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
        polygonOffset: true, polygonOffsetFactor: -1 - i * 0.5, polygonOffsetUnits: -1 - i,
      });
      const cap = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat);
      cap.renderOrder = 10 + i * 2 + 1;
      cap.name = 'cap_' + kind;
      cap.onAfterRender = (renderer) => renderer.clearStencil();
      this.group.add(cap);
      this.caps.set(kind, cap);
    });
  }

  _capColor(kind) {
    const c = {
      enamel: 0xf4efe3, dentin: 0xe2c384, pulp: 0xc33a44, gum: 0xd9777b, bone: 0xd9cfb3, condyle: 0xd6cdb4, disc: 0xcdc6b7,
      palate: 0xd68f90, softPalate: 0xc9777c, uvula: 0xc9777c, tongue: 0xbf4f5a, gland: 0xdbb28f, duct: 0xe4d6c2, nerve: 0xe6c94d,
      vessel: 0xa82424, lesion: 0x3e2515, default: 0xaaaaaa,
    };
    return c[kind] ?? 0xaaaaaa;
  }

  /** Attach stencil helper meshes to a structure mesh (also used for dynamically created meshes). */
  attach(mesh, kind, entry) {
    const i = Math.max(0, CAP_ORDER.indexOf(kind));
    const back = new THREE.Mesh(mesh.geometry, this._stencilMaterial(THREE.BackSide, true));
    const front = new THREE.Mesh(mesh.geometry, this._stencilMaterial(THREE.FrontSide, false));
    back.renderOrder = front.renderOrder = 10 + i * 2;
    back.name = front.name = '_stencil';
    back.userData.stencil = front.userData.stencil = true;
    back.visible = front.visible = false;
    mesh.add(back, front);
    this.stencilMeshes.push({ mesh, back, front, entry });
  }

  /** Called whenever visibility / state changes so stencil passes match what is drawn solid. */
  refresh() {
    for (const s of this.stencilMeshes) {
      const on = this.enabled && s.entry.visible && s.mesh.visible && !s.mesh.material.transparent;
      s.back.visible = s.front.visible = on;
    }
  }

  enable(axis = this.axis) {
    this.enabled = true; this.axis = axis;
    this.viewer.renderer.clippingPlanes = [this.plane];
    this.group.visible = true;
    this.update();
    this.refresh();
  }
  disable() {
    this.enabled = false;
    this.viewer.renderer.clippingPlanes = [];
    this.group.visible = false;
    this.refresh();
  }
  setAxis(axis) { this.axis = axis; if (this.enabled) this.update(); }
  setPosition(t) { this.t = t; if (this.enabled) this.update(); }
  flip() { this.flipped = !this.flipped; if (this.enabled) this.update(); }

  /** Place the plane at parameter t (0..1) across the model bounds along the axis. */
  update() {
    const n = new THREE.Vector3(this.axis === 'x' ? 1 : 0, this.axis === 'y' ? 1 : 0, this.axis === 'z' ? 1 : 0);
    if (!this.flipped) n.negate();
    const min = this.bounds.min[this.axis], max = this.bounds.max[this.axis];
    const pos = min + (max - min) * this.t;
    // plane: n . p + c = 0 keeps the half-space where n . p + c >= 0
    const c = -n[this.axis] * pos;
    this.plane.set(n, c);
    // caps sit on the plane, nudged to the kept side
    const point = new THREE.Vector3().copy(n).multiplyScalar(-c).addScaledVector(n, 0.03);
    for (const cap of this.caps.values()) {
      cap.position.copy(point);
      cap.lookAt(point.clone().add(n));
    }
  }

  /** World-space plane position (mm) along the axis. */
  get position() { const min = this.bounds.min[this.axis], max = this.bounds.max[this.axis]; return min + (max - min) * this.t; }

  /** Is a world point visible (on the kept side)? */
  isVisible(p) { return !this.enabled || this.plane.distanceToPoint(p) >= 0; }

  /** Move the plane to cut through a given world point along the current axis. */
  cutThrough(point, axis = this.axis) {
    this.axis = axis;
    const min = this.bounds.min[axis], max = this.bounds.max[axis];
    this.t = (point[axis] - min) / (max - min);
    if (this.enabled) this.update();
  }
}
