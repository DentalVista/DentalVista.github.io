// Pointer interaction: hover, select, hide, isolate, measure and annotation pins.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { applyState } from '../model/materials.js';

export class Interaction extends EventTarget {
  constructor(viewer, model, section) {
    super();
    this.viewer = viewer; this.model = model; this.section = section;
    this.ray = new THREE.Raycaster();
    this.ray.firstHitOnly = false;
    this.mouse = new THREE.Vector2();
    this.tool = 'browse'; // browse | hide | isolate | measure | pin | quiz
    this.hover = null; this.selected = null;
    this.measure = { points: [], objects: [] };
    this.pins = [];
    this.history = []; this.future = [];
    this.helpers = new THREE.Group(); this.helpers.name = 'helpers';
    viewer.scene.add(this.helpers);
    this._pickables = null;
    const el = viewer.renderer.domElement;
    this._down = null;
    el.addEventListener('pointermove', (e) => this._onMove(e));
    el.addEventListener('pointerdown', (e) => { this._down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    el.addEventListener('pointerup', (e) => this._onUp(e));
    el.addEventListener('pointerleave', () => this._setHover(null));
  }

  invalidate() { this._pickables = null; }

  pickables() {
    if (!this._pickables) {
      this._pickables = [];
      for (const e of this.model.list()) {
        if (!e.visible) continue;
        for (const m of e.meshes) if (e.state !== 'translucent' || this.tool === 'browse') this._pickables.push(m);
      }
      if (this._extraPickables) this._pickables.push(...this._extraPickables);
    }
    return this._pickables;
  }

  /** Raycast under the pointer; returns { entry, point, mesh } or null. Respects the section plane. */
  pick(e) {
    const rect = this.viewer.renderer.domElement.getBoundingClientRect();
    this.mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.viewer.camera);
    const hits = this.ray.intersectObjects(this.pickables(), false);
    for (const h of hits) {
      if (!h.object.visible || !h.object.parent?.visible) continue;
      if (!this.section.isVisible(h.point)) continue;
      const id = h.object.userData.id;
      const entry = this.model.get(id);
      if (!entry) continue;
      if (entry.type === 'tooth' && !entry.node.visible) continue;
      return { entry, point: h.point, mesh: h.object, face: h.face };
    }
    return null;
  }

  _onMove(e) {
    if (this._moveT && performance.now() - this._moveT < 30) return;
    this._moveT = performance.now();
    const hit = this.pick(e);
    this._setHover(hit ? hit.entry : null, e);
    if (this.tool === 'measure' && this.measure.points.length === 1 && hit) this._previewMeasure(hit.point);
  }

  _setHover(entry, e) {
    if (this.hover === entry) { if (entry) this.dispatchEvent(new CustomEvent('hovermove', { detail: { entry, x: e?.clientX, y: e?.clientY } })); return; }
    if (this.hover) this._tint(this.hover, false);
    this.hover = entry;
    if (entry) this._tint(entry, true);
    this.viewer.renderer.domElement.style.cursor = entry ? (this.tool === 'browse' ? 'pointer' : 'crosshair') : '';
    this.dispatchEvent(new CustomEvent('hover', { detail: { entry, x: e?.clientX, y: e?.clientY } }));
  }

  _tint(entry, on) {
    for (const m of Object.values(entry.materials)) {
      if (!m.userData.baseEmissive) m.userData.baseEmissive = m.emissive.clone();
      if (on) { m.emissive.set(0x2457b8); m.emissiveIntensity = 0.28; }
      else { m.emissive.copy(m.userData.baseEmissive); m.emissiveIntensity = 1; }
    }
  }

  _onUp(e) {
    if (!this._down) return;
    const dx = e.clientX - this._down.x, dy = e.clientY - this._down.y, dt = performance.now() - this._down.t;
    this._down = null;
    if (Math.hypot(dx, dy) > 6 || dt > 600) return; // drag, not click
    const hit = this.pick(e);
    switch (this.tool) {
      case 'browse': this.select(hit ? hit.entry : null); break;
      case 'hide': if (hit) this.setVisible(hit.entry.id, false, true); break;
      case 'isolate': if (hit) this.isolate(hit.entry.id); break;
      case 'measure': if (hit) this._addMeasurePoint(hit.point); break;
      case 'pin': if (hit) this.addPin(hit.point, hit.entry); break;
      case 'quiz': this.dispatchEvent(new CustomEvent('quizpick', { detail: { entry: hit ? hit.entry : null } })); break;
    }
  }

  select(entry, { silent = false } = {}) {
    this.selected = entry;
    this.viewer.setOutline(entry ? entry.meshes.filter(m => m.visible) : []);
    if (!silent) this.dispatchEvent(new CustomEvent('select', { detail: { entry } }));
  }

  setVisible(id, visible, record = false) {
    const e = this.model.get(id); if (!e) return;
    if (record) this._push({ type: 'visible', id, before: e.visible, after: visible });
    e.visible = visible;
    if (visible) e.userShown = true;
    e.node.visible = visible;
    if (e.type === 'tooth') this.model.applyLayout(1);
    if (!visible && this.selected === e) this.select(null);
    this.invalidate(); this.section.refresh();
    this.dispatchEvent(new CustomEvent('visibility', { detail: { id, visible } }));
  }

  setState(id, state) {
    const e = this.model.get(id); if (!e) return;
    e.state = state;
    for (const m of Object.values(e.materials)) applyState(m, state);
    this.section.refresh();
    this.invalidate();
  }

  isolate(id) {
    const before = this.model.list().map(e => [e.id, e.visible]);
    for (const e of this.model.list()) { e.visible = e.id === id; e.node.visible = e.visible; }
    this.model.applyLayout(1);
    this._push({ type: 'bulk', before, after: this.model.list().map(e => [e.id, e.visible]) });
    this.invalidate(); this.section.refresh();
    this.dispatchEvent(new CustomEvent('visibility', { detail: { id: '*', visible: null } }));
  }

  showAll() {
    const before = this.model.list().map(e => [e.id, e.visible]);
    for (const e of this.model.list()) { const on = !(e.defaultHidden && !e.userShown); e.visible = on; e.node.visible = on; }
    this.model.applyLayout(1);
    this._push({ type: 'bulk', before, after: this.model.list().map(e => [e.id, e.visible]) });
    this.invalidate(); this.section.refresh();
    this.dispatchEvent(new CustomEvent('visibility', { detail: { id: '*', visible: true } }));
  }

  // ---- undo / redo ----
  _push(action) { this.history.push(action); if (this.history.length > 100) this.history.shift(); this.future.length = 0; }
  _apply(action, dir) {
    if (action.type === 'visible') { const e = this.model.get(action.id); e.visible = dir === 'undo' ? action.before : action.after; e.node.visible = e.visible; }
    else if (action.type === 'bulk') { for (const [id, v] of (dir === 'undo' ? action.before : action.after)) { const e = this.model.get(id); e.visible = v; e.node.visible = v; } }
    else if (action.type === 'pin') { if ((dir === 'undo') !== action.removed) this._removePinObj(action.pin); else this._addPinObj(action.pin); }
    else if (action.type === 'measure') { if (dir === 'undo') this._removeMeasureObj(action.objs); else this.helpers.add(...action.objs); }
    this.model.applyLayout(1); this.invalidate(); this.section.refresh();
    this.dispatchEvent(new CustomEvent('visibility', { detail: { id: '*', visible: null } }));
  }
  undo() { const a = this.history.pop(); if (!a) return; this.future.push(a); this._apply(a, 'undo'); }
  redo() { const a = this.future.pop(); if (!a) return; this.history.push(a); this._apply(a, 'redo'); }

  // ---- measurement ----
  _sphere(p, color = 0x2457b8, r = 0.8) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color, depthTest: false }));
    m.position.copy(p); m.renderOrder = 999; return m;
  }
  _addMeasurePoint(p) {
    const pts = this.measure.points;
    pts.push(p.clone());
    const s = this._sphere(p); this.helpers.add(s); this.measure.objects.push(s);
    if (pts.length === 2) {
      this._clearPreview();
      const d = pts[0].distanceTo(pts[1]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x2457b8, depthTest: false }));
      line.renderOrder = 998;
      const div = document.createElement('div'); div.className = 'label measure'; div.textContent = d.toFixed(1) + ' mm';
      const label = new CSS2DObject(div); label.position.copy(pts[0]).lerp(pts[1], 0.5);
      this.helpers.add(line, label);
      const objs = [...this.measure.objects, line, label];
      this._push({ type: 'measure', objs });
      this.measure = { points: [], objects: [] };
      this.dispatchEvent(new CustomEvent('measured', { detail: { distance: d } }));
    }
  }
  _previewMeasure(p) {
    this._clearPreview();
    const a = this.measure.points[0];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, p]), new THREE.LineDashedMaterial({ color: 0x2457b8, dashSize: 1.5, gapSize: 1, depthTest: false }));
    line.computeLineDistances(); line.renderOrder = 998; line.name = '_preview';
    this.helpers.add(line); this._preview = line;
  }
  _clearPreview() { if (this._preview) { this.helpers.remove(this._preview); this._preview = null; } }
  _removeMeasureObj(objs) { for (const o of objs) { this.helpers.remove(o); if (o.element) o.element.remove(); } }
  clearMeasures() { for (const a of this.history.filter(h => h.type === 'measure')) this._removeMeasureObj(a.objs); this.history = this.history.filter(h => h.type !== 'measure'); this._clearPreview(); this.measure = { points: [], objects: [] }; }

  // ---- pins ----
  addPin(p, entry) {
    const n = this.pins.length + 1;
    const div = document.createElement('div'); div.className = 'label pin';
    div.innerHTML = `<span class="num">${n}</span><span class="txt" contenteditable="true" spellcheck="false">${entry ? (entry.name[document.documentElement.lang === 'en' ? 'en' : 'zh']) : ''}</span>`;
    const label = new CSS2DObject(div); label.position.copy(p);
    const dot = this._sphere(p, 0xd9342b, 0.9);
    const pin = { label, dot, n };
    this._addPinObj(pin);
    this._push({ type: 'pin', pin, removed: false });
  }
  _addPinObj(pin) { this.helpers.add(pin.label, pin.dot); this.pins.push(pin); }
  _removePinObj(pin) { this.helpers.remove(pin.label, pin.dot); pin.label.element.remove(); this.pins = this.pins.filter(p => p !== pin); }
  clearPins() { for (const p of [...this.pins]) this._removePinObj(p); this.history = this.history.filter(h => h.type !== 'pin'); }

  setTool(tool) {
    this.tool = tool;
    this._clearPreview(); this.measure = { points: [], objects: [] };
    this.invalidate();
    this.dispatchEvent(new CustomEvent('tool', { detail: { tool } }));
  }
}
