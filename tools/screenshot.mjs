// Visual QA: start the Vite dev server, open the app in headless Chrome, run scripted views, save PNGs.
// usage: node tools/screenshot.mjs [viewName ...]   (no args = all views)
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:'));
const outDir = path.join(root, 'shots');
fs.mkdirSync(outDir, { recursive: true });

const server = await createServer({ root, server: { port: 5179, strictPort: true }, logLevel: 'error' });
await server.listen();
const url = 'http://localhost:5179/';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1600,1000'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') errors.push(m.type() + ': ' + m.text()); });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction('window.__dv && window.__dv.ready === true', { timeout: 60000 }).catch(() => { console.log('READY TIMEOUT'); console.log(errors.join('\n')); process.exit(1); });

const want = process.argv.slice(2);
const views = await page.evaluate(() => Object.keys(window.__dv.views || {}));
for (const v of views) {
  if (want.length && !want.includes(v)) continue;
  await page.evaluate(async (name) => { await window.__dv.views[name](); }, v);
  await page.waitForFunction('!window.__dv.viewer.flight', { timeout: 60000 }).catch(() => console.log('flight timeout', v));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))));
  await page.screenshot({ path: path.join(outDir, v + '.png') });
  console.log('shot', v);
}
if (errors.length) console.log('CONSOLE:\n' + errors.slice(0, 30).join('\n'));
await browser.close();
await server.close();
