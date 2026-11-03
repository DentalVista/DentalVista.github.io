// Renderer, camera, lights, post-processing and camera animation.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export const BRAND = { blue: 0x2457b8, red: 0xd9342b };

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Viewer {
  constructor(container) {
    this.container = container;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.classList.add('gl');
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 2, 3000);
    camera.position.set(0, 60, 260);
    this.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.target.set(0, 0, -30);
    controls.minDistance = 20; controls.maxDistance = 900;
    controls.rotateSpeed = 0.8;
    this.controls = controls;

    // lights
    const key = new THREE.DirectionalLight(0xfff6ea, 2.1);
    key.position.set(90, 160, 140); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -140; key.shadow.camera.right = 140; key.shadow.camera.top = 140; key.shadow.camera.bottom = -140;
    key.shadow.camera.near = 20; key.shadow.camera.far = 600; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.6; key.shadow.radius = 4;
    scene.add(key); this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xdbe8ff, 0.9); fill.position.set(-140, 40, 60); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(20, 80, -220); scene.add(rim);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa4b4, 0.5); scene.add(hemi);
    this.lights = { key, fill, rim, hemi };

    // shadow catcher
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.ShadowMaterial({ opacity: 0.16 }));
    sc.rotation.x = -Math.PI / 2; sc.position.y = -62; sc.receiveShadow = true; sc.name = 'shadowCatcher';
    scene.add(sc); this.shadowCatcher = sc;

    // post-processing
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType, stencilBuffer: true, depthBuffer: true });
    const composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    const outline = new OutlinePass(new THREE.Vector2(size.x, size.y), scene, camera);
    outline.edgeStrength = 5; outline.edgeGlow = 0.35; outline.edgeThickness = 1.6; outline.pulsePeriod = 0;
    outline.visibleEdgeColor.set(BRAND.blue); outline.hiddenEdgeColor.set(0x7fa3e8);
    composer.addPass(outline);
    composer.addPass(new OutputPass());
    this.composer = composer; this.outline = outline;

    // label renderer (DOM)
    const labels = new CSS2DRenderer();
    labels.setSize(container.clientWidth, container.clientHeight);
    labels.domElement.className = 'labels';
    container.appendChild(labels.domElement);
    this.labels = labels;

    this.tick = [];           // per-frame callbacks (dt seconds)
    this.clock = new THREE.Clock();
    this.flight = null;
    this.autoRotate = false;
    this.fps = 60; this._fpsAcc = 0; this._fpsN = 0;
    this._pixelScale = 1;

    window.addEventListener('resize', () => this.resize());
    renderer.setAnimationLoop(() => this._frame());
  }

  /** Recording mode: stop the real-time loop; frames are produced by step(dt). */
  beginStepping() { this.renderer.setAnimationLoop(null); this.stepping = true; }
  step(dt) { this._frame(dt); }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.outline.setSize(w, h);
    this.labels.setSize(w, h);
  }

  _frame(fixed = null) {
    const raw = fixed !== null ? fixed : this.clock.getDelta();
    const dt = fixed !== null ? fixed : Math.min(0.05, raw);
    if (this.flight) this._stepFlight(fixed !== null ? fixed : Math.min(0.5, raw));
    this.controls.autoRotate = this.autoRotate && !this.flight;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.update();
    for (const fn of this.tick) fn(dt);
    this.composer.render();
    this.labels.render(this.scene, this.camera);
    // adaptive pixel ratio: lower when the frame rate drops
    this._fpsAcc += dt; this._fpsN++;
    if (this._fpsAcc > 1.5) {
      this.fps = this._fpsN / this._fpsAcc; this._fpsAcc = 0; this._fpsN = 0;
      const want = this.fps < 28 ? Math.max(1, Math.min(window.devicePixelRatio, 1.25)) : Math.min(window.devicePixelRatio, 2);
      if (want !== this.renderer.getPixelRatio()) { this.renderer.setPixelRatio(want); this.resize(); }
    }
  }

  /** Animate the camera to a position / target. */
  flyTo(position, target, duration = 1.0) {
    const from = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    const to = { p: new THREE.Vector3().copy(position), t: new THREE.Vector3().copy(target) };
    return new Promise(resolve => { this.flight = { from, to, t: 0, duration, resolve }; });
  }
  _stepFlight(dt) {
    const f = this.flight; f.t += dt / f.duration;
    const k = easeInOut(Math.min(1, f.t));
    this.camera.position.lerpVectors(f.from.p, f.to.p, k);
    this.controls.target.lerpVectors(f.from.t, f.to.t, k);
    if (f.t >= 1) { this.flight = null; f.resolve(); }
  }

  /** Fit a Box3 into view from the current direction (or a given direction). */
  frameBox(box, dir = null, duration = 0.9, padding = 1.25) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5 * padding;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const dist = radius / Math.sin(fov / 2);
    const d = dir ? dir.clone().normalize() : this.camera.position.clone().sub(this.controls.target).normalize();
    return this.flyTo(center.clone().addScaledVector(d, dist), center, duration);
  }

  /** Preset directions (patient's frame: +X = patient's left). */
  preset(name, box, duration = 0.9) {
    const dirs = {
      front: [0, 0.08, 1], back: [0, 0.08, -1], left: [1, 0.05, 0], right: [-1, 0.05, 0], top: [0, 1, 0.001], bottom: [0, -1, 0.001],
      iso: [0.7, 0.45, 0.8],
    };
    return this.frameBox(box, new THREE.Vector3(...dirs[name]), duration);
  }

  setOutline(objects) { this.outline.selectedObjects = objects; }

  /** Capture the current frame (PNG data URL). */
  capture() {
    this.composer.render();
    return this.renderer.domElement.toDataURL('image/png');
  }
}
