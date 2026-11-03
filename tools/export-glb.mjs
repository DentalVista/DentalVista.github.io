// Bake the procedural oral model to a GLB file (Node, no browser needed).
// usage: node tools/export-glb.mjs [out.glb]   (default: blender/dentalvista.glb)
// The GLB keeps one node per structure (t11 … t85, gum_upper, mandible, ian_L …) so Blender can edit it.
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OralModel } from '../src/model/build.js';

// minimal FileReader polyfill for the exporter
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buf => { this.result = buf; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(buf => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64'); this.onloadend?.(); }); }
};

const out = path.resolve(process.argv[2] || 'blender/dentalvista.glb');
fs.mkdirSync(path.dirname(out), { recursive: true });

const model = new OralModel();
model.root.updateMatrixWorld(true);
// strip helper objects: the exporter only needs structure meshes
model.root.traverse(o => { if (o.userData?.stencil) o.visible = false; });
for (const e of model.list()) if (e.type === 'tissue') { e.visible = true; e.node.visible = true; }
// name materials for Blender
for (const e of model.list()) for (const [k, m] of Object.entries(e.materials)) m.name = e.type === 'tooth' ? k : e.system;

const exporter = new GLTFExporter();
const t0 = Date.now();
exporter.parse(model.root, (buf) => {
  fs.writeFileSync(out, Buffer.from(buf));
  const mb = (fs.statSync(out).size / 1e6).toFixed(1);
  console.log(`wrote ${out} (${mb} MB, ${model.list().length} structures, ${Date.now() - t0} ms)`);
}, (err) => { console.error(err); process.exit(1); }, { binary: true, onlyVisible: true });
