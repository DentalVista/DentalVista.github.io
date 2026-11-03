// Application shell: header, side panels, toolbar, settings, tooltip, toasts, splash, footer.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { h, clear, icon } from './dom.js';
import { t, setLang, getLang } from '../data/i18n.js';
import { SYSTEMS, REGIONS } from '../data/structures.js';
import { applyState } from '../model/materials.js';
import { renderSystemsPanel, renderRhythmPanel, renderSearchPanel, renderQuizPanel, renderToursPanel, renderKnowledge } from './panels.js';

const LOGO_URL = './brand/logo.png';
const FREEDOMAI_URL = 'https://www.freedomai.cn/';

export class App {
  constructor({ container, viewer, model, section, interact, anim }) {
    Object.assign(this, { container, viewer, model, section, interact, anim });
    this.nav = 'systems';
    this.theme = localStorage.getItem('dv.theme') || 'light';
    this.systemState = Object.fromEntries(SYSTEMS.map(s => [s.id, 'solid']));
    this.region = 'all';
    this.toothLayerState = { enamel: 'solid', dentin: 'solid', pulp: 'solid' };
    this.hoverLabels = true;
    this.tour = null;
    setLang(localStorage.getItem('dv.lang') || 'zh');
    this.applyTheme(this.theme);
    this.build();
    this.bind();
  }

  // ---------- layout ----------
  build() {
    let ui = this.container.querySelector('.ui');
    if (ui) ui.remove();
    ui = h('div', { class: 'ui' });
    this.ui = ui;
    this.container.appendChild(ui);

    // header
    const navItems = ['systems', 'rhythm', 'knowledge', 'tours', 'search', 'quiz'];
    this.navEl = h('nav', { class: 'nav' }, navItems.map(k => h('button', { class: 'navbtn' + (this.nav === k ? ' active' : ''), dataset: { nav: k }, onClick: () => this.setNav(k) }, t('nav.' + k))));
    const header = h('header', { class: 'header' },
      h('a', { class: 'brand', href: FREEDOMAI_URL, target: '_blank', rel: 'noopener', title: 'FreedomAI 自由动脉' }, h('img', { src: LOGO_URL, alt: 'FreedomAI 自由动脉' })),
      h('div', { class: 'wordmark' }, h('span', { class: 'wm-cn' }, t('appTitle')), h('span', { class: 'wm-dot' }, '·'), h('span', { class: 'wm-en' }, 'Dental', h('b', {}, 'Vista'))),
      this.navEl,
      h('div', { class: 'hdr-right' },
        h('button', { class: 'chip', onClick: () => this.toggleLang(), title: 'Language' }, getLang() === 'zh' ? '🇬🇧 English' : '🇨🇳 中文'),
        h('button', { class: 'iconbtn', title: t('fullscreen'), onClick: () => this.fullscreen() }, icon('full')),
        h('button', { class: 'iconbtn', title: t('help'), onClick: () => this.showHelp() }, icon('help')),
      ),
    );
    ui.appendChild(header);

    // left panel
    this.leftPanel = h('aside', { class: 'panel left' });
    this.rightPanel = h('aside', { class: 'panel right' });
    ui.append(this.leftPanel, this.rightPanel);
    this.renderLeft();
    this.renderRight();

    // toolbar
    this.toolbar = this.buildToolbar();
    ui.appendChild(this.toolbar);

    // tooltip, toast, tour card, footer
    this.tooltip = h('div', { class: 'tooltip hidden' });
    this.toastEl = h('div', { class: 'toast hidden' });
    this.tourCard = h('div', { class: 'tourcard hidden' });
    this.footer = h('footer', { class: 'footer' }, h('span', {}, t('footer')), h('span', { class: 'sep' }, '·'), h('a', { href: 'https://arxiv.org/abs/2512.11558', target: '_blank', rel: 'noopener' }, 'DentalGPT'), h('span', { class: 'sep' }, '·'), h('a', { href: FREEDOMAI_URL, target: '_blank', rel: 'noopener' }, 'freedomai.cn'));
    this.hint = h('div', { class: 'hint' }, t('intro2'));
    ui.append(this.tooltip, this.toastEl, this.tourCard, this.footer, this.hint);
  }

  renderLeft() {
    clear(this.leftPanel);
    const map = { systems: renderSystemsPanel, rhythm: renderRhythmPanel, search: renderSearchPanel, quiz: renderQuizPanel, tours: renderToursPanel };
    const fn = map[this.nav];
    if (fn) { this.leftPanel.classList.remove('hidden'); this.leftPanel.appendChild(fn(this)); }
    else this.leftPanel.classList.add('hidden');
  }
  renderRight() {
    clear(this.rightPanel);
    this.rightPanel.appendChild(renderKnowledge(this, this.interact.selected));
    this.rightPanel.classList.toggle('hidden', this.nav !== 'knowledge' && !this.interact.selected);
  }

  buildToolbar() {
    const tools = ['browse', 'hide', 'isolate', 'measure', 'pin'];
    this.toolBtns = {};
    const toolGroup = h('div', { class: 'tb-group' }, tools.map(k => (this.toolBtns[k] = h('button', { class: 'tb' + (this.interact.tool === k ? ' active' : ''), title: t('tools.' + k), onClick: () => this.setTool(k) }, icon(k), h('span', { class: 'lbl' }, t('tools.' + k))))));
    // section
    this.secBtns = {};
    const secAxes = [['x', 'sagittal'], ['z', 'coronal'], ['y', 'transverse']];
    this.secSlider = h('input', { type: 'range', min: 0, max: 1000, value: 500, class: 'slider sec', onInput: (e) => this.section.setPosition(e.target.value / 1000) });
    const secGroup = h('div', { class: 'tb-group sec' },
      h('span', { class: 'tb-label' }, icon('section'), t('section')),
      secAxes.map(([ax, name]) => (this.secBtns[ax] = h('button', { class: 'tb small', onClick: () => this.toggleSection(ax) }, t(name)))),
      this.secSlider,
      h('button', { class: 'tb small', title: t('flip'), onClick: () => this.section.flip() }, '⇄'),
    );
    const viewGroup = h('div', { class: 'tb-group' },
      ['front', 'left', 'right', 'top', 'bottom', 'back', 'iso'].map(v => h('button', { class: 'tb small', onClick: () => this.view(v) }, t('views.' + v))),
      h('button', { class: 'tb small', title: t('resetView'), onClick: () => this.resetView() }, icon('rotate')),
    );
    const actGroup = h('div', { class: 'tb-group' },
      h('button', { class: 'tb', title: t('undo'), onClick: () => this.interact.undo() }, icon('undo')),
      h('button', { class: 'tb', title: t('redo'), onClick: () => this.interact.redo() }, icon('redo')),
      h('button', { class: 'tb', title: t('screenshot'), onClick: () => this.screenshot() }, icon('camera')),
      h('button', { class: 'tb', title: t('exportGlb'), onClick: () => this.exportGLB() }, icon('export')),
      h('button', { class: 'tb', title: t('settings'), onClick: () => this.toggleSettings() }, icon('settings')),
    );
    this.settingsPop = this.buildSettings();
    return h('div', { class: 'toolbar' }, toolGroup, secGroup, viewGroup, actGroup, this.settingsPop);
  }

  buildSettings() {
    const themeBtns = ['light', 'warm', 'dark'].map(th => h('button', { class: 'chip' + (this.theme === th ? ' active' : ''), onClick: (e) => { this.applyTheme(th); e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === e.target)); } }, t('themes.' + th)));
    const jaw = h('input', { type: 'range', min: 0, max: 100, value: Math.round(this.anim.jawOpen * 100), class: 'slider', onInput: (e) => { this.anim.jawOpen = e.target.value / 100; if (!this.anim.mode) this.model.setJawOpen(this.anim.jawOpen); } });
    const auto = h('input', { type: 'checkbox', checked: this.viewer.autoRotate, onChange: (e) => { this.viewer.autoRotate = e.target.checked; } });
    const shadows = h('input', { type: 'checkbox', checked: this.viewer.renderer.shadowMap.enabled, onChange: (e) => { this.viewer.renderer.shadowMap.enabled = e.target.checked; this.viewer.shadowCatcher.visible = e.target.checked; this.model.root.traverse(o => { if (o.material) o.material.needsUpdate = true; }); } });
    const labels = h('input', { type: 'checkbox', checked: this.hoverLabels, onChange: (e) => { this.hoverLabels = e.target.checked; } });
    const pop = h('div', { class: 'popover hidden' },
      h('div', { class: 'pop-title' }, t('settings'), h('button', { class: 'iconbtn', onClick: () => this.toggleSettings(false) }, icon('close'))),
      h('div', { class: 'row' }, h('label', {}, t('theme')), h('div', { class: 'chips' }, themeBtns)),
      h('div', { class: 'row' }, h('label', {}, t('jawOpen')), jaw),
      h('div', { class: 'row' }, h('label', {}, t('autoRotate')), auto),
      h('div', { class: 'row' }, h('label', {}, t('shadows')), shadows),
      h('div', { class: 'row' }, h('label', {}, t('labelsOn')), labels),
      h('div', { class: 'note' }, t('modelNote')),
    );
    return pop;
  }
  toggleSettings(force) { const on = force !== undefined ? force : this.settingsPop.classList.contains('hidden'); this.settingsPop.classList.toggle('hidden', !on); }

  // ---------- behaviour ----------
  bind() {
    this.interact.addEventListener('select', (e) => { this.renderRight(); if (e.detail.entry) this.rightPanel.classList.remove('hidden'); });
    this.interact.addEventListener('hover', (e) => this.updateTooltip(e.detail));
    this.interact.addEventListener('hovermove', (e) => this.updateTooltip(e.detail));
    this.interact.addEventListener('tool', (e) => { for (const [k, b] of Object.entries(this.toolBtns)) b.classList.toggle('active', k === e.detail.tool); });
    this.interact.addEventListener('visibility', () => { if (this.nav === 'systems') this.renderLeft(); });
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.interact.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); this.interact.redo(); }
      else if (e.key === 'Escape') { this.setTool('browse'); this.toggleSettings(false); if (this.tour) this.endTour(); }
      else if (e.key.toLowerCase() === 'f') this.focusSelected();
      else if (e.key.toLowerCase() === 'h' && this.interact.selected) this.interact.setVisible(this.interact.selected.id, false, true);
    });
  }

  setNav(k) {
    this.nav = k;
    this.navEl.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.nav === k));
    if (k !== 'quiz' && this.interact.tool === 'quiz') this.setTool('browse');
    this.renderLeft(); this.renderRight();
  }
  setTool(k) { this.interact.setTool(k); }
  toggleLang() { setLang(getLang() === 'zh' ? 'en' : 'zh'); localStorage.setItem('dv.lang', getLang()); this.build(); if (this.tour) this.renderTourCard(); }
  applyTheme(th) { this.theme = th; document.body.dataset.theme = th; localStorage.setItem('dv.theme', th); const dark = th === 'dark'; this.viewer.lights.hemi.intensity = dark ? 0.35 : 0.5; this.viewer.shadowCatcher.material.opacity = dark ? 0.35 : 0.16; }
  fullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }

  updateTooltip({ entry, x, y }) {
    if (!entry || !this.hoverLabels || this.interact.tool === 'quiz') { this.tooltip.classList.add('hidden'); return; }
    clear(this.tooltip);
    this.tooltip.append(h('b', {}, t(entry.name)), entry.type === 'tooth' ? h('span', { class: 'fdi' }, 'FDI ' + entry.fdi) : h('span', { class: 'en' }, getLang() === 'zh' ? entry.name.en : entry.name.zh));
    this.tooltip.classList.remove('hidden');
    const rect = this.container.getBoundingClientRect();
    this.tooltip.style.left = (x - rect.left + 14) + 'px'; this.tooltip.style.top = (y - rect.top + 14) + 'px';
  }

  toast(msg, ms = 2200) { this.toastEl.textContent = msg; this.toastEl.classList.remove('hidden'); clearTimeout(this._toastT); this._toastT = setTimeout(() => this.toastEl.classList.add('hidden'), ms); }

  modelBox() {
    const box = new THREE.Box3();
    for (const e of this.model.list()) if (e.visible && e.node.visible) box.union(this.model.boxOf(e.id));
    if (box.isEmpty()) box.set(new THREE.Vector3(-60, -50, -100), new THREE.Vector3(60, 40, 10));
    return box;
  }
  view(name) { this.viewer.preset(name, this.modelBox()); }
  resetView() { this.viewer.flyTo(new THREE.Vector3(0, 40, 250), new THREE.Vector3(0, -2, -30), 1.0); }
  focusSelected() { const e = this.interact.selected; if (e) this.viewer.frameBox(this.model.boxOf(e.id), null, 0.8, 2.2); }
  selectById(id, fly = true) {
    const e = this.model.get(id); if (!e) return;
    if (!e.visible) this.interact.setVisible(id, true, true);
    this.interact.select(e);
    if (fly) this.viewer.frameBox(this.model.boxOf(id), this.viewDirFor(e), 0.9, 2.4);
  }
  /** Preferred viewing direction for a structure: teeth are viewed from their buccal side and slightly from the occlusal side. */
  viewDirFor(e) {
    if (e.type !== 'tooth') return null;
    const m = e.node.matrixWorld;
    const buccal = new THREE.Vector3().setFromMatrixColumn(m, 2).normalize();
    const occl = new THREE.Vector3().setFromMatrixColumn(m, 1).normalize();
    const zBias = e.tooth.pos <= 3 ? 0.3 : -0.25; // anterior teeth from the front, posterior teeth slightly from behind
    return buccal.multiplyScalar(0.8).addScaledVector(occl, 0.45).add(new THREE.Vector3(0, 0, zBias)).normalize();
  }

  toggleSection(axis) {
    if (this.section.enabled && this.section.axis === axis) this.section.disable();
    else { this.section.enable(axis); this.secSlider.value = Math.round(this.section.t * 1000); }
    this.refreshSectionBtns();
  }
  refreshSectionBtns() { for (const [ax, b] of Object.entries(this.secBtns)) b.classList.toggle('active', this.section.enabled && this.section.axis === ax); this.secSlider.value = Math.round(this.section.t * 1000); }

  // ---------- layers ----------
  setSystemState(sys, state) {
    this.systemState[sys] = state;
    for (const e of this.model.list()) {
      if (e.system !== sys) continue;
      this._applyEntryState(e);
    }
    this.model.applyLayout(1);
    this.interact.invalidate(); this.section.refresh();
    if (this.interact.selected) this.interact.select(this.interact.selected, { silent: true });
  }
  _applyEntryState(e) {
    const sysState = this.systemState[e.system];
    const inRegion = this.region === 'all' || e.regions.includes(this.region) || (this.region === 'floor' && e.regions.includes('floor'));
    const visible = sysState !== 'hidden' && inRegion && !(e.defaultHidden && !e.userShown);
    e.visible = visible; e.node.visible = visible;
    const st = sysState === 'hidden' ? 'solid' : sysState;
    e.state = st;
    for (const m of Object.values(e.materials)) applyState(m, st);
    if (e.type === 'tooth') for (const [layer, mesh] of Object.entries(e.layerMeshes)) { const ls = this.toothLayerState[layer]; mesh.visible = ls !== 'hidden'; if (st === 'solid') applyState(mesh.material, ls === 'hidden' ? 'solid' : ls); }
  }
  setRegion(r) { this.region = r; for (const e of this.model.list()) this._applyEntryState(e); this.model.applyLayout(1); this.interact.invalidate(); this.section.refresh(); }
  setToothLayerState(layer, state) {
    this.toothLayerState[layer] = state;
    for (const e of this.model.teeth) this._applyEntryState(e);
    this.interact.invalidate(); this.section.refresh();
  }
  showAll() { this.region = 'all'; for (const k of Object.keys(this.systemState)) this.systemState[k] = 'solid'; for (const k of Object.keys(this.toothLayerState)) this.toothLayerState[k] = 'solid'; this.interact.showAll(); for (const e of this.model.list()) this._applyEntryState(e); this.interact.invalidate(); this.section.refresh(); this.renderLeft(); }

  // ---------- tours ----------
  startTour(tour) { this.tour = { def: tour, i: 0 }; this.applyTourStep(); this.renderTourCard(); }
  endTour() { this.tour = null; this.tourCard.classList.add('hidden'); this.anim.stop(); this.section.disable(); this.refreshSectionBtns(); this.showAll(); this.model.setJawOpen(this.anim.jawOpen); this.interact.select(null); }
  tourStep(d) { if (!this.tour) return; this.tour.i = Math.max(0, Math.min(this.tour.def.steps.length - 1, this.tour.i + d)); this.applyTourStep(); this.renderTourCard(); }
  async applyTourStep() {
    const step = this.tour.def.steps[this.tour.i];
    if (step.layers) { for (const [sys, st] of Object.entries(step.layers)) this.setSystemState(sys, st); if (this.nav === 'systems') this.renderLeft(); }
    if ('mode' in step) {
      if (step.mode === null) this.anim.stop();
      else {
        this.anim.start(step.mode.name);
        if (step.mode.age !== undefined) this.anim.setAge(step.mode.age);
        if (step.mode.progress !== undefined) this.anim.setProgress(step.mode.progress);
        this.anim.playing = step.mode.playing !== false;
        if (this.nav === 'rhythm') this.renderLeft();
      }
    }
    if ('jaw' in step) this.model.setJawOpen(step.jaw);
    if ('section' in step) {
      if (step.section === null) this.section.disable();
      else { this.section.enable(step.section.axis); if (step.section.flip !== undefined) { this.section.flipped = step.section.flip; } if (step.section.through) this.section.cutThrough(this.model.centerOf(step.section.through), step.section.axis); else if (step.section.t !== undefined) this.section.setPosition(step.section.t); }
      this.refreshSectionBtns();
    }
    if ('select' in step) { this.interact.select(step.select ? this.model.get(step.select) : null); }
    if (step.focus) {
      const box = step.focus === 'all' ? this.modelBox() : this.model.boxOf(step.focus);
      const dirs = { front: [0, 0.08, 1], back: [0, 0.08, -1], left: [1, 0.05, 0], right: [-1, 0.05, 0], top: [0, 1, 0.001], bottom: [0, -1, 0.001], iso: [0.7, 0.45, 0.8] };
      await this.viewer.frameBox(box, step.dir ? new THREE.Vector3(...dirs[step.dir]) : null, 1.1, step.focus === 'all' ? 1.2 : 2.6);
    }
  }
  renderTourCard() {
    const tr = this.tour; if (!tr) return;
    const step = tr.def.steps[tr.i];
    clear(this.tourCard);
    this.tourCard.append(
      h('div', { class: 'tc-head' }, h('span', { class: 'tc-title' }, t(tr.def.title)), h('span', { class: 'tc-step' }, `${t('tours.step')} ${tr.i + 1} / ${tr.def.steps.length}`), h('button', { class: 'iconbtn', title: t('tours.exit'), onClick: () => this.endTour() }, icon('close'))),
      h('p', { class: 'tc-text' }, t(step.text)),
      h('div', { class: 'tc-dots' }, tr.def.steps.map((_, i) => h('span', { class: 'dot' + (i === tr.i ? ' on' : i < tr.i ? ' done' : ''), onClick: () => { tr.i = i; this.applyTourStep(); this.renderTourCard(); } }))),
      h('div', { class: 'tc-actions' },
        h('button', { class: 'btn ghost', disabled: tr.i === 0, onClick: () => this.tourStep(-1) }, t('tours.prev')),
        tr.i < tr.def.steps.length - 1 ? h('button', { class: 'btn primary', onClick: () => this.tourStep(1) }, t('tours.next')) : h('button', { class: 'btn primary', onClick: () => this.endTour() }, t('done')),
      ),
    );
    this.tourCard.classList.remove('hidden');
  }

  // ---------- capture / export ----------
  screenshot() {
    const data = this.viewer.capture();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      const dark = this.theme === 'dark';
      const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
      if (dark) { grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#1e293b'); } else if (this.theme === 'warm') { grad.addColorStop(0, '#f3efe8'); grad.addColorStop(1, '#e6e0d6'); } else { grad.addColorStop(0, '#f6f8fc'); grad.addColorStop(1, '#e9eef7'); }
      ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const logo = new Image(); logo.src = LOGO_URL;
      const finish = () => {
        const s = c.width / 1600;
        const pad = 28 * s, lw = 200 * s, lh = lw * 90 / 282;
        if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, c.width - lw - pad, c.height - lh - pad, lw, lh);
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(20,30,50,0.8)';
        ctx.font = `${Math.round(20 * s)}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
        const sel = this.interact.selected;
        ctx.fillText('DentalVista · ' + t('appTitle') + (sel ? '  —  ' + t(sel.name) + (sel.type === 'tooth' ? ` (FDI ${sel.fdi})` : '') : ''), pad, c.height - pad - 6 * s);
        const a = document.createElement('a'); a.download = `DentalVista_${sel ? sel.id : 'view'}_${Date.now()}.png`; a.href = c.toDataURL('image/png'); a.click();
        this.toast(t('toastShot'));
      };
      if (logo.complete) finish(); else { logo.onload = finish; logo.onerror = finish; }
    };
    img.src = data;
  }

  exportGLB() {
    const exporter = new GLTFExporter();
    exporter.parse(this.model.root, (buf) => {
      const blob = new Blob([buf], { type: 'model/gltf-binary' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'DentalVista_oral_anatomy.glb'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      this.toast(t('toastGlb'), 3000);
    }, (err) => { console.error(err); this.toast('Export failed'); }, { binary: true, onlyVisible: true });
  }

  showHelp() {
    const body = t('helpBody');
    const ov = h('div', { class: 'overlay', onClick: (e) => { if (e.target === ov) ov.remove(); } },
      h('div', { class: 'dialog' },
        h('div', { class: 'pop-title' }, t('help'), h('button', { class: 'iconbtn', onClick: () => ov.remove() }, icon('close'))),
        h('ul', { class: 'help-list' }, body.map(l => h('li', {}, l))),
        h('div', { class: 'note' }, t('modelNote')),
        h('div', { class: 'refs' }, h('b', {}, t('knowledgeTabs.refs')), h('ol', {}, t('refs').map(r => h('li', {}, r)))),
      ));
    this.ui.appendChild(ov);
  }

  /** Splash screen; resolves when the user enters. */
  splash() {
    return new Promise(resolve => {
      const ov = h('div', { class: 'splash' },
        h('div', { class: 'splash-card' },
          h('img', { class: 'splash-logo', src: LOGO_URL, alt: 'FreedomAI 自由动脉' }),
          h('h1', {}, h('span', { class: 'wm-en' }, 'Dental', h('b', {}, 'Vista')), h('span', { class: 'wm-cn' }, t('appTitle'))),
          h('p', { class: 'tag' }, t('tagline')),
          h('p', { class: 'sub' }, t('intro1')),
          h('button', { class: 'btn primary big', onClick: () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 700); resolve(); } }, t('enter')),
          h('p', { class: 'tiny' }, t('intro2')),
        ),
        h('div', { class: 'splash-foot' }, h('span', {}, '© 2026 ' + t('brand') + ' FreedomAI'), h('span', { class: 'lang', onClick: () => { this.toggleLang(); ov.remove(); this.splash().then(resolve); } }, getLang() === 'zh' ? 'English' : '中文')),
      );
      this.ui.appendChild(ov);
    });
  }
}
