"""
DentalVista · Blender companion.

Imports the baked GLB (tools/export-glb.mjs), sorts every structure into collections
(Teeth / Gingiva / Bone / TMJ / Palate / Tongue / Nerves / Vessels / Glands), assigns
Principled BSDF materials with the site's palette, smooths the meshes, saves an editable
.blend and renders a turntable still for the README.

usage (headless):
  "D:/tools/blender-4.5.15-windows-x64/blender.exe" -b --python blender/import_glb.py -- \
      public/models/dentalvista.glb blender/dentalvista.blend [preview.png]
"""
import sys, os, math
import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
glb = os.path.abspath(argv[0] if len(argv) > 0 else "public/models/dentalvista.glb")
out_blend = os.path.abspath(argv[1] if len(argv) > 1 else "blender/dentalvista.blend")
preview = os.path.abspath(argv[2]) if len(argv) > 2 else None

PALETTE = {
    "enamel": (0.96, 0.94, 0.89), "dentin": (0.91, 0.81, 0.59), "pulp": (0.82, 0.29, 0.32),
    "gingiva": (0.91, 0.54, 0.55), "bone": (0.91, 0.88, 0.80), "tmj": (0.85, 0.82, 0.75),
    "palate": (0.89, 0.63, 0.63), "tongue": (0.83, 0.39, 0.44), "nerve": (0.95, 0.85, 0.35),
    "vessel": (0.78, 0.19, 0.18), "gland": (0.91, 0.77, 0.64),
}
COLLECTIONS = {
    "teeth": "Teeth", "gingiva": "Gingiva", "bone": "Bone", "tmj": "TMJ", "palate": "Palate",
    "tongue": "Tongue", "nerve": "Nerves", "vessel": "Vessels", "gland": "Glands",
}

def system_of(name):
    n = name.lower()
    if n.startswith("t") and n[1:3].isdigit(): return "teeth"
    if n.startswith("gum"): return "gingiva"
    if n.startswith(("maxilla", "mandible", "ramus")): return "bone"
    if n.startswith(("condyle", "disc")): return "tmj"
    if n.startswith(("palate", "uvula")): return "palate"
    if n.startswith("tongue"): return "tongue"
    if n.startswith(("ian", "mental", "incisive", "lingualn", "psa", "gpn")): return "nerve"
    if n.startswith(("iaa", "linguala", "faciala")): return "vessel"
    if n.startswith(("parotid", "submandibular", "sublingual", "stensen", "wharton")): return "gland"
    return "bone"

# ---- reset scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=glb)
# the model is authored in millimetres; set display units after the import so nothing is rescaled
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'MILLIMETERS'
scene.unit_settings.scale_length = 0.001

# collections
cols = {}
for key, label in COLLECTIONS.items():
    c = bpy.data.collections.new(label)
    scene.collection.children.link(c)
    cols[key] = c

def material_for(key, name):
    mat = bpy.data.materials.get("DV_" + name)
    if mat: return mat
    mat = bpy.data.materials.new("DV_" + name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    col = PALETTE.get(name, PALETTE.get(key, (0.8, 0.8, 0.8)))
    bsdf.inputs["Base Color"].default_value = (*col, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.3 if name in ("enamel", "vessel") else 0.55
    if name in ("enamel", "gingiva", "tongue", "vessel"):
        bsdf.inputs["Coat Weight"].default_value = 0.6
    if name == "enamel":
        bsdf.inputs["Subsurface Weight"].default_value = 0.15
        bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.6)
    return mat

count = 0
for ob in list(bpy.data.objects):
    if ob.type != 'MESH':
        continue
    name = ob.name
    # tooth meshes are named t11_enamel etc; use the layer as material name
    parent_name = ob.parent.name if ob.parent else name
    key = system_of(parent_name if parent_name.startswith("t") else name)
    layer = name.split("_")[-1] if key == "teeth" and "_" in name else key
    mat = material_for(key, layer if layer in ("enamel", "dentin", "pulp") else key)
    ob.data.materials.clear(); ob.data.materials.append(mat)
    # smooth shading
    for p in ob.data.polygons: p.use_smooth = True
    try:
        bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(45))
    except Exception:
        pass
    # move to collection
    for c in ob.users_collection: c.objects.unlink(ob)
    cols[key].objects.link(ob)
    count += 1
# move empties (tooth groups, jaw groups) to Teeth / root
for ob in bpy.data.objects:
    if ob.type == 'EMPTY':
        for c in ob.users_collection: c.objects.unlink(ob)
        (cols["teeth"] if ob.name.startswith("t") else scene.collection).objects.link(ob)

print(f"DentalVista: {count} meshes organised")

# ---- camera / light for a preview ----
cam_data = bpy.data.cameras.new("Camera"); cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam); scene.camera = cam
# glTF (Y-up, mm) imports as Blender Z-up: three (x, y, z) -> blender (x, -z, y). Model centre ~ (0, 40, -10).
target = bpy.data.objects.new("CameraTarget", None); target.location = (0, 35, -8); scene.collection.objects.link(target)
cam.location = (200, -210, 120); cam_data.lens = 55; cam_data.clip_end = 5000
tr = cam.constraints.new('TRACK_TO'); tr.target = target; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN')); sun.data.energy = 3.0
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(40)); scene.collection.objects.link(sun)
world = bpy.data.worlds.new("World"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.93, 0.95, 0.98, 1); world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print("saved", out_blend)

if preview:
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'SceneEEVEE') else 'BLENDER_EEVEE'
    scene.render.resolution_x = 1600; scene.render.resolution_y = 1000; scene.render.film_transparent = False
    scene.render.filepath = preview
    bpy.ops.render.render(write_still=True)
    print("rendered", preview)
