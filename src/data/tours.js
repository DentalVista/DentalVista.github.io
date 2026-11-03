// Guided lessons (教学路线). Each step declares what the viewer should show.
// step: { text:{zh,en}, select?: id, focus?: id | 'all', dir?: presetName, layers?: {system: state}, show?: [ids], hideAll?: bool,
//         section?: {axis, through?: id, t?: number, flip?: bool} | null, mode?: {name, progress?, age?, playing?}, jaw?: number }

export const TOURS = [
  {
    id: 'types', minutes: 4, title: { zh: '牙齿的分类与功能', en: 'Tooth types and functions' },
    summary: { zh: '切牙、尖牙、前磨牙、磨牙——形态如何服务于功能。', en: 'Incisors, canines, premolars, molars — how form follows function.' },
    steps: [
      { text: { zh: '恒牙共 32 颗，每个象限 8 颗：2 切牙、1 尖牙、2 前磨牙、3 磨牙。先看整体牙弓。', en: 'The permanent dentition has 32 teeth, 8 per quadrant: 2 incisors, 1 canine, 2 premolars, 3 molars. Start with the whole arch.' }, focus: 'all', dir: 'front', layers: { gingiva: 'translucent', bone: 'hidden', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'hidden' }, section: null, select: null },
      { text: { zh: '切牙（上颌中切牙 11）：铲形牙冠、宽切缘，负责切断食物；舌面有舌隆突。', en: 'Incisors (upper central 11): shovel-shaped crown with a wide incisal edge for cutting; note the cingulum on the lingual side.' }, select: 't11', focus: 't11', dir: 'iso' },
      { text: { zh: '尖牙（13）：单个尖锐牙尖，全口最长的牙根，撕裂食物，也是侧方运动的引导者。', en: 'Canines (13): a single pointed cusp and the longest root; they tear food and guide lateral movements.' }, select: 't13', focus: 't13', dir: 'iso' },
      { text: { zh: '前磨牙（14）：两个牙尖，兼具撕裂与研磨；上颌第一前磨牙常有颊、腭两个牙根。', en: 'Premolars (14): two cusps for tearing and grinding; the upper first premolar usually has buccal and palatal roots.' }, select: 't14', focus: 't14', dir: 'iso' },
      { text: { zh: '磨牙（16）：宽大𬌗面、4–5 个牙尖和多个牙根，负责研磨。上颌第一磨牙有斜嵴，三根。', en: 'Molars (16): broad occlusal table, 4–5 cusps and multiple roots for grinding. The upper first molar has an oblique ridge and three roots.' }, select: 't16', focus: 't16', dir: 'bottom' },
      { text: { zh: '下颌第一磨牙（46）五个牙尖、两根，是最早萌出的恒牙（六龄牙），也是 Angle 分类的关键。', en: 'The lower first molar (46) has five cusps and two roots; it is the first permanent tooth to erupt and the key to Angle\'s classification.' }, select: 't46', focus: 't46', dir: 'top' },
    ],
  },
  {
    id: 'fdi', minutes: 3, title: { zh: 'FDI 牙位记录法', en: 'FDI tooth numbering' },
    summary: { zh: '两位数编号：象限 + 牙位。', en: 'Two digits: quadrant + position.' },
    steps: [
      { text: { zh: 'FDI（ISO 3950）用两位数表示牙位：第一位是象限，第二位是从中线数起的牙位（1–8）。', en: 'FDI (ISO 3950) uses two digits: the first is the quadrant, the second the position counted from the midline (1–8).' }, focus: 'all', dir: 'front', layers: { gingiva: 'translucent', bone: 'hidden', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'hidden' }, section: null },
      { text: { zh: '象限 1 = 患者右上。从患者的角度看，右侧在屏幕左边。这是 11：右上中切牙。', en: 'Quadrant 1 = patient\'s upper right — on the left of the screen when facing the patient. This is 11, the upper right central incisor.' }, select: 't11', focus: 'all', dir: 'front' },
      { text: { zh: '象限 2 = 左上。21 是左上中切牙，编号顺时针递增：1 → 2 → 3 → 4。', en: 'Quadrant 2 = upper left. 21 is the upper left central incisor; quadrants run clockwise 1 → 2 → 3 → 4.' }, select: 't21' },
      { text: { zh: '象限 3 = 左下（31），象限 4 = 右下（41）。', en: 'Quadrant 3 = lower left (31), quadrant 4 = lower right (41).' }, select: 't31' },
      { text: { zh: '第二位数从中切牙 1 数到第三磨牙 8：这是 48，右下第三磨牙（智齿）。', en: 'The second digit counts from the central incisor (1) to the third molar (8): this is 48, the lower right wisdom tooth.' }, select: 't48', focus: 't48', dir: 'iso' },
      { text: { zh: '乳牙用象限 5–8，牙位 1–5。例如 55 是右上第二乳磨牙。萌出时间轴里可以看到它们。', en: 'Primary teeth use quadrants 5–8 and positions 1–5; 55 is the upper right primary second molar. See them in the eruption timeline.' }, mode: { name: 'eruption', age: 4, playing: false }, focus: 'all', dir: 'front', select: 't55' },
    ],
  },
  {
    id: 'tissues', minutes: 3, title: { zh: '牙的组织结构', en: 'Tooth tissues' },
    summary: { zh: '釉质、牙本质、牙髓——用剖面看进牙齿内部。', en: 'Enamel, dentine, pulp — a section view inside a tooth.' },
    steps: [
      { text: { zh: '把矢状剖面推到 36 牙中央：外层白色为釉质，人体最硬的组织。', en: 'Cut sagittally through tooth 36: the outer white layer is enamel, the hardest tissue in the body.' }, select: 't36', focus: 't36', dir: 'left', section: { axis: 'x', through: 't36' }, layers: { gingiva: 'translucent', bone: 'hidden', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'hidden' }, mode: null },
      { text: { zh: '釉质只覆盖牙冠，在牙尖处最厚（2–2.5 mm），颈部几乎为零。', en: 'Enamel covers only the crown; it is thickest at the cusps (2–2.5 mm) and vanishes at the neck.' } },
      { text: { zh: '黄色为牙本质：牙体的主体，含牙本质小管，终生由成牙本质细胞形成。', en: 'Yellow is dentine: the bulk of the tooth, permeated by tubules and formed throughout life by odontoblasts.' } },
      { text: { zh: '红色为牙髓：髓腔与根管内的血管神经组织，经根尖孔与牙周相通。髓角伸向牙尖。', en: 'Red is the pulp: vessels and nerves in the chamber and canals, communicating with the periodontium through the apex. Pulp horns point toward the cusps.' } },
      { text: { zh: '牙根表面的牙骨质和牙周膜把牙固定在牙槽骨中；打开骨骼图层看牙根如何埋在骨内。', en: 'Cementum and the periodontal ligament anchor the root in alveolar bone; show the bone layer to see the roots embedded.' }, layers: { bone: 'translucent' } },
    ],
  },
  {
    id: 'eruption', minutes: 4, title: { zh: '牙齿萌出的时间表', en: 'The eruption timetable' },
    summary: { zh: '从第一颗乳牙到智齿。', en: 'From the first primary tooth to the wisdom teeth.' },
    steps: [
      { text: { zh: '出生时口内无牙。约 6–10 个月，下颌乳中切牙最先萌出。', en: 'No teeth at birth. The lower primary central incisors are first, at about 6–10 months.' }, mode: { name: 'eruption', age: 0.9, playing: false }, focus: 'all', dir: 'front', layers: { gingiva: 'translucent', bone: 'hidden', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'hidden' }, section: null, select: null },
      { text: { zh: '约 2.5–3 岁，20 颗乳牙全部就位：每个象限 2 切牙、1 尖牙、2 乳磨牙。', en: 'By 2.5–3 years all 20 primary teeth are in place: 2 incisors, 1 canine and 2 molars per quadrant.' }, mode: { name: 'eruption', age: 3, playing: false } },
      { text: { zh: '6 岁：第一恒磨牙在乳磨牙远中萌出（不替换任何乳牙），下前牙开始替换——替牙期开始。', en: 'Age 6: the first permanent molars erupt behind the primary molars (replacing nothing) and the lower incisors begin to change — mixed dentition begins.' }, mode: { name: 'eruption', age: 6.8, playing: false }, select: 't46' },
      { text: { zh: '9–12 岁：尖牙与前磨牙替换乳尖牙、乳磨牙；乳磨牙较宽，多出的"剩余间隙"帮助磨牙调整位置。', en: 'Ages 9–12: canines and premolars replace their predecessors; the wider primary molars leave "leeway space" that lets the molars adjust.' }, mode: { name: 'eruption', age: 10.5, playing: false }, select: null },
      { text: { zh: '12–13 岁：第二磨牙萌出，28 颗恒牙就位。', en: 'Ages 12–13: second molars erupt — 28 permanent teeth.' }, mode: { name: 'eruption', age: 13, playing: false } },
      { text: { zh: '17–21 岁：第三磨牙萌出（若有空间）。恒牙列完成，共 32 颗。', en: 'Ages 17–21: third molars erupt if there is room. The permanent dentition is complete at 32.' }, mode: { name: 'eruption', age: 21, playing: false } },
    ],
  },
  {
    id: 'ianb', minutes: 4, title: { zh: '下牙槽神经阻滞麻醉的解剖', en: 'Anatomy of the inferior alveolar nerve block' },
    summary: { zh: '下颌孔、翼下颌间隙、舌神经。', en: 'Mandibular foramen, pterygomandibular space, lingual nerve.' },
    steps: [
      { text: { zh: '下颌神经阻滞需要把麻药送到下牙槽神经进入下颌孔之前。先把颌骨调成半透明，露出神经。', en: 'The block must bathe the inferior alveolar nerve before it enters the mandibular foramen. Make the bone translucent to reveal the nerve.' }, focus: 'all', dir: 'left', layers: { gingiva: 'hidden', bone: 'translucent', tongue: 'hidden', palate: 'hidden', nerve: 'solid', vessel: 'solid', gland: 'hidden', tmj: 'solid', teeth: 'translucent' }, section: null, mode: null, select: 'ian_L' },
      { text: { zh: '下颌支（升支）内侧面中央是下颌孔，约在𬌗平面上方 1 cm，前方有下颌小舌遮挡。', en: 'The mandibular foramen lies centrally on the medial surface of the ramus, ~1 cm above the occlusal plane, guarded by the lingula.' }, select: 'ramus_L', focus: 'ramus_L', dir: 'back' },
      { text: { zh: '下牙槽神经在下颌管内前行，与下牙槽动脉伴行，供应同侧全部下颌牙。', en: 'The nerve runs forward in the mandibular canal with the inferior alveolar artery, supplying every tooth on that side.' }, select: 'ian_L', focus: 'ian_L', dir: 'left' },
      { text: { zh: '出颏孔后成为颏神经，支配下唇与颏部——麻醉成功的标志是下唇发麻。', en: 'After the mental foramen it becomes the mental nerve to the lip and chin — lip numbness signals a successful block.' }, select: 'mental_L', focus: 'mental_L', dir: 'iso' },
      { text: { zh: '舌神经在下颌支内侧、更靠前内走行，常被同时麻醉（舌麻）；拔除第三磨牙时须保护它。', en: 'The lingual nerve runs more anteromedially inside the ramus and is usually anaesthetised too (numb tongue); protect it during third-molar surgery.' }, select: 'lingualn_L', focus: 'lingualn_L', dir: 'top' },
      { text: { zh: '进针点：翼下颌皱襞外侧、对侧前磨牙方向进针，触及骨面后回抽再注射。', en: 'Needle entry: lateral to the pterygomandibular raphe, approaching from the opposite premolars; contact bone, aspirate, inject.' }, select: 'ramus_L', focus: 'all', dir: 'front', layers: { teeth: 'solid' } },
    ],
  },
  {
    id: 'caries', minutes: 3, title: { zh: '龋病如何一步步破坏牙齿', en: 'How caries destroys a tooth' },
    summary: { zh: '从白垩斑到根尖脓肿。', en: 'From white spot to periapical abscess.' },
    steps: [
      { text: { zh: '菌斑产酸使釉质脱矿，最早的表现是釉质白垩斑——此时仍可通过氟化物再矿化。', en: 'Plaque acids demineralise enamel; the earliest sign is a chalky white spot, still reversible with fluoride.' }, mode: { name: 'caries', progress: 0.1, playing: false }, layers: { gingiva: 'translucent', bone: 'hidden', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'hidden', teeth: 'solid' } },
      { text: { zh: '釉质被穿透形成龋洞。釉质无细胞、不能自我修复，需要充填治疗。', en: 'Enamel is breached and a cavity forms. Enamel cannot repair itself; a restoration is needed.' }, mode: { name: 'caries', progress: 0.35, playing: false } },
      { text: { zh: '进入牙本质后，病变沿牙本质小管迅速扩展，呈底在内的锥形；出现冷热酸甜敏感。', en: 'In dentine the lesion spreads rapidly along the tubules in a cone shape; the tooth becomes sensitive to cold, heat and sweet.' }, mode: { name: 'caries', progress: 0.6, playing: false } },
      { text: { zh: '细菌到达牙髓引起牙髓炎：自发痛、夜间痛、放射痛。此时需要根管治疗。', en: 'Bacteria reach the pulp causing pulpitis: spontaneous, nocturnal, radiating pain. Root canal treatment is required.' }, mode: { name: 'caries', progress: 0.8, playing: false } },
      { text: { zh: '牙髓坏死后感染经根尖孔进入牙槽骨，形成根尖周脓肿，可伴肿胀与瘘管。', en: 'After pulp necrosis the infection exits through the apex into bone, forming a periapical abscess with swelling or a sinus tract.' }, mode: { name: 'caries', progress: 1, playing: false } },
    ],
  },
  {
    id: 'glands', minutes: 3, title: { zh: '三对大唾液腺', en: 'The three major salivary glands' },
    summary: { zh: '腮腺、下颌下腺、舌下腺及其导管开口。', en: 'Parotid, submandibular, sublingual and where their ducts open.' },
    steps: [
      { text: { zh: '每天约 1–1.5 升唾液来自三对大唾液腺和无数小唾液腺。把颌骨和牙龈调淡，露出腺体。', en: 'About 1–1.5 litres of saliva a day come from three pairs of major glands and countless minor ones. Fade the bone and gums to see them.' }, focus: 'all', dir: 'iso', layers: { gingiva: 'translucent', bone: 'translucent', tongue: 'translucent', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'solid', tmj: 'hidden', teeth: 'translucent' }, section: null, mode: null, select: 'parotid_L' },
      { text: { zh: '腮腺最大，位于耳前、下颌支外侧，分泌稀薄的浆液性唾液；面神经从中穿过。', en: 'The parotid is the largest, in front of the ear over the ramus, secreting thin serous saliva; the facial nerve passes through it.' }, select: 'parotid_L', focus: 'parotid_L', dir: 'left' },
      { text: { zh: '腮腺导管跨过咬肌，开口于上颌第二磨牙相对的颊黏膜。', en: 'Its duct crosses masseter and opens on the cheek opposite the upper second molar.' }, select: 'stensen_L', focus: 'stensen_L', dir: 'left' },
      { text: { zh: '下颌下腺位于下颌骨体内下方，产生静息唾液的 65–70%。', en: 'The submandibular gland lies below and inside the body of the mandible and produces 65–70% of resting saliva.' }, select: 'submandibular_L', focus: 'submandibular_L', dir: 'bottom' },
      { text: { zh: '其导管（Wharton 导管）沿口底前行，开口于舌系带两侧的舌下阜——导管长且向上，是结石的好发部位。', en: 'Its (Wharton\'s) duct runs forward along the floor of the mouth to the sublingual caruncle beside the frenulum — long and ascending, hence prone to stones.' }, select: 'wharton_L', focus: 'wharton_L', dir: 'top' },
      { text: { zh: '舌下腺最小，位于舌下襞黏膜下，分泌黏液；多条小导管直接开口于口底。', en: 'The sublingual gland is the smallest, under the sublingual fold, secreting mucus through several small ducts.' }, select: 'sublingual_L', focus: 'sublingual_L', dir: 'top' },
    ],
  },
  {
    id: 'tmj', minutes: 3, title: { zh: '颞下颌关节与开口运动', en: 'The TMJ and mouth opening' },
    summary: { zh: '转动 + 滑动的双腔关节。', en: 'A two-compartment joint: rotation plus translation.' },
    steps: [
      { text: { zh: '颞下颌关节由髁突、关节盘和颞骨关节窝组成，左右联动。', en: 'The TMJ consists of the condyle, articular disc and the glenoid fossa of the temporal bone; the two sides move together.' }, focus: 'condyle_L', dir: 'left', layers: { gingiva: 'translucent', bone: 'solid', tongue: 'hidden', palate: 'hidden', nerve: 'hidden', vessel: 'hidden', gland: 'hidden', tmj: 'solid', teeth: 'solid' }, section: null, select: 'condyle_L', mode: null },
      { text: { zh: '关节盘把关节腔分成上、下两腔：小开口时髁突在下腔内转动（铰链）。', en: 'The disc divides the joint into upper and lower compartments: in early opening the condyle rotates in the lower compartment (hinge).' }, select: 'disc_L', jaw: 0.3 },
      { text: { zh: '继续张大时，髁突与关节盘一起在上腔内向前滑动到关节结节下方。', en: 'In wider opening the condyle and disc glide forward together in the upper compartment, down the articular eminence.' }, jaw: 0.9 },
      { text: { zh: '咀嚼是开口、侧方移动与闭口的循环；播放咀嚼动画观察。', en: 'Chewing cycles through opening, lateral shift and closing; play the animation to watch.' }, mode: { name: 'chew', playing: true }, focus: 'all', dir: 'iso', select: null },
    ],
  },
];
