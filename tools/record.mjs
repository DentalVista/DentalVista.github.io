// Record the demo video: scripted scenes rendered frame by frame in headless Chrome (GPU), then muxed with the narration.
// usage: node tools/record.mjs [--fps 30] [--w 1920] [--h 1080] [--quick]
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30), W = +arg('w', 1920), H = +arg('h', 1080), QUICK = process.argv.includes('--quick'), MUX_ONLY = process.argv.includes('--mux-only');
const script = JSON.parse(fs.readFileSync('video/script.json', 'utf8'));
const durations = JSON.parse(fs.readFileSync('video/vo/durations.json', 'utf8'));
const MIN = { splash: 7, reveal: 8, hero: 10, layers: 11, select: 11, section: 12, eruption: 13, caries: 12, chew: 11, tours: 11, quiz: 10, end: 9 };
const PAD = 1.3;

// timeline
let t0 = 0;
const scenes = script.map(l => {
  const audio = durations[l.id] || 4;
  const dur = Math.max(audio + PAD, MIN[l.scene] || 6);
  const s = { ...l, start: t0, dur, audio };
  t0 += dur; return s;
});
const total = t0;
console.log(`timeline: ${scenes.length} scenes, ${total.toFixed(1)} s, ${Math.round(total * FPS)} frames`);

const framesDir = path.resolve('video/frames');
if (!MUX_ONLY) { fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir, { recursive: true }); }

if (!MUX_ONLY) {
const server = await createServer({ root: process.cwd(), server: { port: 5181, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://localhost:5181/?nointro', { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction('window.__dv && window.__dv.ready', { timeout: 60000 });
// fonts / layout settle
await new Promise(r => setTimeout(r, 1500));

// ---- in-page scene definitions ----
await page.evaluate(() => {
  const dv = window.__dv, { app, viewer, model, section, interact, anim, THREE } = dv;
  const once = {};
  const at = (key, t, when, fn) => { if (t >= when && !once[key]) { once[key] = true; fn(); } };
  const hideSys = (list) => { for (const s of list) app.setSystemState(s, 'hidden'); };
  window.__rec = {
    setup: {
      splash(s) { dv.endCard(false); dv.caption(null); app.applyTheme('light'); app.setNav('systems'); app.showAll(); section.disable(); app.refreshSectionBtns(); interact.select(null); viewer.autoRotate = false; dv.orbit(35, 250, 60); app.splash(); },
      reveal(s) { document.querySelector('.splash .btn')?.click(); dv.caption(s.zh, s.en); anim.start('eruption'); anim.speed = 22 / (1.1 * (s.dur - 2.2)); anim.playing = true; },
      hero(s) { anim.stop(); app.showAll(); dv.caption(s.zh, s.en); },
      layers(s) { app.setNav('systems'); dv.caption(s.zh, s.en); },
      select(s) { app.showAll(); app.setNav('knowledge'); dv.caption(s.zh, s.en); app.selectById('t16'); },
      section(s) {
        app.setNav('systems'); dv.caption(s.zh, s.en); interact.select(null);
        app.setSystemState('gingiva', 'translucent'); hideSys(['bone', 'tongue', 'palate', 'nerve', 'vessel', 'gland', 'tmj']); app.renderLeft();
        const c = model.centerOf('t36'); window.__secC = c.clone();
        section.enable('x'); section.cutThrough(c, 'x'); app.refreshSectionBtns(); interact.select(model.get('t36'));
        viewer.flyTo(new THREE.Vector3(c.x + 62, c.y + 8, c.z + 8), new THREE.Vector3(c.x, c.y - 3, c.z), 1.6);
      },
      eruption(s) { section.disable(); app.refreshSectionBtns(); interact.select(null); app.showAll(); app.setNav('rhythm'); dv.caption(s.zh, s.en); anim.start('eruption'); anim.speed = 22 / (1.1 * (s.dur - 1.5)); anim.playing = true; app.renderLeft(); app.setSystemState('gingiva', 'translucent'); dv.orbit(15, 235, 45); },
      caries(s) { anim.stop(); app.showAll(); app.setNav('rhythm'); dv.caption(s.zh, s.en); anim.start('caries'); anim.speed = 1 / (0.045 * (s.dur - 2.5)); anim.playing = true; app.renderLeft(); },
      chew(s) { anim.stop(); app.showAll(); app.setNav('rhythm'); dv.caption(s.zh, s.en); anim.start('chew'); anim.speed = 1; anim.playing = true; app.renderLeft(); app.setSystemState('bone', 'translucent'); app.setSystemState('gingiva', 'translucent'); app.setSystemState('gland', 'hidden'); dv.orbit(75, 215, 25, [0, -10, -40]); },
      tours(s) { anim.stop(); app.showAll(); app.setNav('tours'); dv.caption(s.zh, s.en); window.__tours.then(T => { app.startTour(T[4]); app.renderLeft(); }); },
      quiz(s) { app.endTour(); app.setNav('quiz'); dv.caption(s.zh, s.en); app.leftPanel.querySelector('.btn.primary')?.click(); },
      end(s) { app.setNav('systems'); interact.select(null); section.disable(); app.refreshSectionBtns(); app.showAll(); dv.caption(null); dv.orbit(40, 260, 70); dv.endCard(true); },
    },
    frame: {
      splash(t) { dv.orbit(35 + t * 3, 250, 60); },
      reveal(t, s) { dv.orbit(45 + t * 5, 235, 50); at('revealStop', t, s.dur - 1.2, () => { anim.stop(); }); },
      hero(t) { dv.orbit(85 - t * 7, 225, 42); },
      layers(t) { dv.orbit(15 + t * 6, 205, 32); at('l1', t, 1.2, () => { app.setSystemState('gingiva', 'translucent'); app.renderLeft(); }); at('l2', t, 3.4, () => { app.setSystemState('bone', 'translucent'); app.renderLeft(); }); at('l3', t, 5.6, () => { app.setSystemState('tongue', 'hidden'); app.setSystemState('palate', 'hidden'); app.renderLeft(); }); at('l4', t, 7.8, () => { app.setSystemState('teeth', 'translucent'); app.renderLeft(); }); },
      select(t) { },
      section(t) { if (window.__secC && !viewer.flight) { const c = window.__secC; section.cutThrough(new THREE.Vector3(c.x + 2.5 * Math.sin((t - 2) * 0.7), c.y, c.z), 'x'); app.refreshSectionBtns(); } },
      eruption(t) { dv.orbit(15 + t * 2.5, 235, 45); },
      caries(t) { },
      chew(t) { dv.orbit(75 + t * 4, 215, 25, [0, -10, -40]); },
      tours(t) { at('t1', t, 4.2, () => app.tourStep(1)); at('t2', t, 7.8, () => app.tourStep(1)); },
      quiz(t) { at('q1', t, 3.2, () => { const st = app.quiz; const i = st?.current?.options?.findIndex(o => o.ok); const btns = app.leftPanel.querySelectorAll('.btn.option'); if (i >= 0 && btns[i]) btns[i].click(); }); at('q2', t, 6.0, () => app.leftPanel.querySelector('.btn.primary')?.click()); },
      end(t) { dv.orbit(40 + t * 2.5, 260, 70); },
    },
  };
  window.__tours = import('/src/data/tours.js').then(m => m.TOURS);
  dv.beginStepping();
});

// ---- render frames ----
const totalFrames = Math.round(total * FPS);
const dt = 1 / FPS;
let frame = 0, sceneIdx = -1;
const tStart = Date.now();
for (let f = 0; f < totalFrames; f++) {
  const t = f / FPS;
  const idx = scenes.findIndex(s => t >= s.start && t < s.start + s.dur);
  const s = scenes[idx];
  if (idx !== sceneIdx) {
    sceneIdx = idx;
    await page.evaluate((s) => window.__rec.setup[s.scene](s), s);
    // let DOM transitions settle a little (real time)
    await new Promise(r => setTimeout(r, 250));
    console.log(`scene ${s.id} ${s.scene} @ ${t.toFixed(1)}s`);
  }
  await page.evaluate((scene, tl, s, dt) => { window.__rec.frame[scene](tl, s); window.__dv.step(dt); }, s.scene, t - s.start, s, dt);
  if (QUICK && f % 15 !== 0) continue;
  await page.screenshot({ path: path.join(framesDir, String(frame).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  frame++;
  if (f % 150 === 0) console.log(`  ${f}/${totalFrames} frames, ${((Date.now() - tStart) / 1000).toFixed(0)} s`);
}
await browser.close(); await server.close();
}

// ---- audio: narration placed on the timeline ----
const inputs = [], filters = [], mixIns = [];
scenes.forEach((s, i) => {
  inputs.push('-i', `video/vo/${s.id}.mp3`);
  const ms = Math.round((s.start + 0.4) * 1000);
  filters.push(`[${i + 1}:a]aresample=48000,adelay=${ms}|${ms}[a${i}]`); mixIns.push(`[a${i}]`);
});
filters.push(`${mixIns.join('')}amix=inputs=${scenes.length}:dropout_transition=0,volume=${scenes.length},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
fs.mkdirSync('video/out', { recursive: true });
const fpsOut = QUICK ? FPS / 15 : FPS;
const out = 'video/out/DentalVista_demo.mp4';
const args = ['-y', '-framerate', String(fpsOut), '-i', path.join(framesDir, '%05d.jpg'), ...inputs,
  '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fpsOut),
  '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out];
const r = spawnSync(ffmpeg.path, args, { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr.slice(-2000)); process.exit(1); }
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
process.exit(0);
