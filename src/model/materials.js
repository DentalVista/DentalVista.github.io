// Material factory. Every structure gets its own material instance so display states can be set per structure.
import * as THREE from 'three';

export const PALETTE = {
  enamel: 0xffffff, dentin: 0xe9cf96, pulp: 0xd14a52, primaryEnamel: 0xf8f8f4,
  gum: 0xe8898c, bone: 0xe9e1cc, condyle: 0xe4dcc6, disc: 0xd8d2c2,
  palate: 0xe3a2a2, softPalate: 0xd98c90, uvula: 0xd37f86, tongue: 0xd4636f,
  nerve: 0xf3d85a, vessel: 0xc8302f, gland: 0xe9c4a2, duct: 0xf1e4cf,
  lesion: 0x5a3a24,
};

export function makeMaterial(kind) {
  switch (kind) {
    case 'enamel':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.enamel, vertexColors: true, roughness: 0.26, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.22, sheen: 0.35, sheenColor: new THREE.Color(0xfff4e8), sheenRoughness: 0.6, side: THREE.DoubleSide });
    case 'primaryEnamel':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.primaryEnamel, vertexColors: true, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25, side: THREE.DoubleSide });
    case 'dentin':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.dentin, roughness: 0.62, clearcoat: 0.1, side: THREE.DoubleSide });
    case 'pulp':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.pulp, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide });
    case 'gum':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.gum, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color(0xffb0b0), side: THREE.DoubleSide });
    case 'bone':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.bone, roughness: 0.78, side: THREE.DoubleSide });
    case 'condyle':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.condyle, roughness: 0.7, side: THREE.DoubleSide });
    case 'disc':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.disc, roughness: 0.55, clearcoat: 0.3, side: THREE.DoubleSide });
    case 'palate':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.palate, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
    case 'softPalate':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.softPalate, roughness: 0.5, clearcoat: 0.45, side: THREE.DoubleSide });
    case 'uvula':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.uvula, roughness: 0.5, clearcoat: 0.45, side: THREE.DoubleSide });
    case 'tongue':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.tongue, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0xff9aa0), side: THREE.DoubleSide });
    case 'nerve':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.nerve, roughness: 0.5, emissive: 0x2a2000, side: THREE.DoubleSide });
    case 'vessel':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.vessel, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide });
    case 'gland':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.gland, roughness: 0.65, side: THREE.DoubleSide });
    case 'duct':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.duct, roughness: 0.5, side: THREE.DoubleSide });
    case 'lesion':
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.lesion, roughness: 0.9, side: THREE.DoubleSide });
    default:
      return new THREE.MeshPhysicalMaterial({ color: 0xcccccc, roughness: 0.6, side: THREE.DoubleSide });
  }
}

/** Apply a display state to a material: 'solid' | 'translucent' | 'wire'. */
export function applyState(mat, state) {
  if (!mat.userData.base) mat.userData.base = { opacity: mat.opacity, transparent: mat.transparent };
  if (state === 'translucent') {
    mat.transparent = true; mat.opacity = 0.22; mat.depthWrite = false; mat.wireframe = false;
  } else if (state === 'wire') {
    mat.transparent = true; mat.opacity = 0.5; mat.depthWrite = false; mat.wireframe = true;
  } else {
    mat.transparent = false; mat.opacity = 1; mat.depthWrite = true; mat.wireframe = false;
  }
  mat.needsUpdate = true;
}
