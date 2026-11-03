// DentalVista · 口腔解剖 — entry point.
import * as THREE from 'three';
import { Viewer } from './viewer/scene.js';
import { OralModel } from './model/build.js';
import { SectionTool } from './viewer/section.js';
import { Interaction } from './viewer/interact.js';
import { Animations } from './viewer/animations.js';
import { App } from './ui/app.js';
import { TOURS } from './data/tours.js';

const container = document.getElementById('app');
const loading = document.createElement('div');
loading.className = 'loading';
loading.innerHTML = '<div class="spin"></div><div>加载中 · Loading</div>';
container.appendChild(loading);

const viewer = new Viewer(container);
await new Promise(r => requestAnimationFrame(r));
const model = new OralModel();
viewer.scene.add(model.root);
const section = new SectionTool(viewer, model);
const interact = new Interaction(viewer, model, section);
const anim = new Animations(viewer, model, section, interact);
const app = new App({ container, viewer, model, section, interact, anim });
loading.remove();

// initial camera
viewer.camera.position.set(0, 40, 250);
viewer.controls.target.set(0, -2, -30);
viewer.controls.update();

const params = new URLSearchParams(location.search);
const skipIntro = params.has('nointro') || navigator.webdriver;

async function intro() {
  viewer.autoRotate = true;
  await app.splash();
  viewer.autoRotate = false;
  // assembly: run the eruption timeline quickly as a reveal
  anim.start('eruption'); anim.speed = 7; anim.playing = true;
  await new Promise(r => setTimeout(r, 3300));
  anim.stop(); anim.speed = 1;
  app.resetView();
}
if (skipIntro) { anim.stop(); } else intro();

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ---- QA / scripting hooks ----
// ---- recording helpers (used by tools/record.mjs) ----
const captionEl = document.createElement('div'); captionEl.className = 'caption hidden'; container.appendChild(captionEl);
function caption(zh, en) { if (!zh) { captionEl.classList.add('hidden'); return; } captionEl.innerHTML = `<b>${zh}</b>${en ? `<span>${en}</span>` : ''}`; captionEl.classList.remove('hidden'); }
function endCard(on) {
  document.querySelector('.endcard')?.remove();
  if (!on) return;
  const el = document.createElement('div'); el.className = 'splash endcard';
  el.innerHTML = `<div class="splash-card"><img class="splash-logo" src="./brand/logo.png" alt="FreedomAI"><h1><span class="wm-en">Dental<b>Vista</b></span><span class="wm-cn">口腔解剖</span></h1><p class="tag">可交互的三维口腔解剖教学平台</p><p class="url">dentalvista.github.io</p><p class="sub">自由动脉 FreedomAI · 让每个人都享有平等的医疗保健</p></div>`;
  container.querySelector('.ui').appendChild(el);
}
function orbit(deg, dist, height, target = [0, -4, -30]) {
  const a = THREE.MathUtils.degToRad(deg);
  viewer.camera.position.set(target[0] + Math.sin(a) * dist, target[1] + height, target[2] + Math.cos(a) * dist);
  viewer.controls.target.set(...target); viewer.controls.update();
}

window.__dv = {
  ready: true, app, viewer, model, section, interact, anim, THREE, caption, endCard, orbit,
  beginStepping: () => { viewer.beginStepping(); viewer.controls.enableDamping = false; },
  step: (dt) => viewer.step(dt),
  views: {
    hero: async () => { app.showAll(); section.disable(); app.refreshSectionBtns(); interact.select(null); await viewer.flyTo(new THREE.Vector3(120, 70, 190), new THREE.Vector3(0, -4, -30), 0.01); },
    front: async () => { app.showAll(); await viewer.flyTo(new THREE.Vector3(0, 30, 240), new THREE.Vector3(0, -2, -30), 0.01); },
    selectMolar: async () => { app.setNav('knowledge'); app.selectById('t16'); await wait(1200); },
    sectionTooth: async () => { app.setNav('systems'); for (const s of ['bone', 'tongue', 'palate', 'nerve', 'vessel', 'gland', 'tmj']) app.setSystemState(s, 'hidden'); app.setSystemState('gingiva', 'translucent'); section.enable('x'); section.cutThrough(model.centerOf('t36'), 'x'); app.refreshSectionBtns(); interact.select(model.get('t36')); const c = model.centerOf('t36'); await viewer.flyTo(new THREE.Vector3(c.x + 60, c.y + 6, c.z + 6), new THREE.Vector3(c.x, c.y - 3, c.z), 0.01); },
    nerves: async () => { app.showAll(); section.disable(); app.refreshSectionBtns(); app.setSystemState('bone', 'translucent'); app.setSystemState('gingiva', 'hidden'); app.setSystemState('tongue', 'hidden'); app.setSystemState('gland', 'hidden'); app.setSystemState('teeth', 'translucent'); interact.select(model.get('ian_L')); await viewer.flyTo(new THREE.Vector3(210, 30, 10), new THREE.Vector3(0, -12, -45), 0.01); },
    occlusalLower: async () => { anim.stop(); section.disable(); app.refreshSectionBtns(); app.showAll(); app.setSystemState('palate', 'hidden'); app.setRegion('lower'); app.setSystemState('tongue', 'hidden'); interact.select(null); await viewer.flyTo(new THREE.Vector3(0, 160, -28), new THREE.Vector3(0, 0, -30), 0.01); },
    eruption8: async () => { app.showAll(); app.setRegion('all'); app.setNav('rhythm'); anim.start('eruption'); anim.playing = false; anim.setAge(8); app.renderLeft(); for (let i = 0; i < 40; i++) model.applyLayout(0.5); app.setSystemState('gingiva', 'translucent'); await viewer.flyTo(new THREE.Vector3(60, 40, 220), new THREE.Vector3(0, -2, -30), 0.01); },
    caries: async () => { anim.stop(); app.showAll(); app.setNav('rhythm'); anim.start('caries'); anim.playing = false; anim.setProgress(0.75); app.renderLeft(); await wait(1400); },
    brushing: async () => { anim.stop(); app.showAll(); app.setNav('rhythm'); anim.start('brushing'); anim.playing = false; anim.setProgress(0.12); app.renderLeft(); for (let i = 0; i < 30; i++) anim._updateBrushing(0.016); await wait(1400); },
    perio: async () => { anim.stop(); app.showAll(); app.setNav('rhythm'); anim.start('perio'); anim.playing = false; anim.setProgress(0.85); app.renderLeft(); app.setSystemState('tongue', 'hidden'); await viewer.flyTo(new THREE.Vector3(40, 10, 150), new THREE.Vector3(0, -6, -20), 0.01); },
    glands: async () => { anim.stop(); app.showAll(); app.setNav('tours'); app.startTour(TOURS[6]); app.tour.i = 3; await app.applyTourStep(); app.renderTourCard(); await wait(1300); },
    quiz: async () => { app.endTour(); app.setNav('quiz'); app.leftPanel.querySelector('.btn.primary')?.click(); await wait(1200); },
    dark: async () => { app.setNav('search'); app.applyTheme('dark'); app.showAll(); section.disable(); app.refreshSectionBtns(); app.selectById('tongue'); await wait(1200); },
    splash: async () => { app.applyTheme('light'); app.setNav('systems'); anim.stop(); section.disable(); app.refreshSectionBtns(); app.showAll(); interact.select(null); viewer.autoRotate = false; await viewer.flyTo(new THREE.Vector3(120, 60, 200), new THREE.Vector3(0, -4, -30), 0.01); app.splash(); await wait(400); },
    chew: async () => { app.applyTheme('light'); app.setNav('rhythm'); anim.start('chew'); app.renderLeft(); anim.phase = 0.5; anim.playing = false; anim.tick(0); await viewer.flyTo(new THREE.Vector3(170, 30, 60), new THREE.Vector3(0, -10, -40), 0.01); },
  },
};
