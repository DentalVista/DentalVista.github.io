// UI strings. t(key) picks the active language.
export const STRINGS = {
  appTitle: { zh: '口腔解剖', en: 'Oral Anatomy' },
  brand: { zh: '自由动脉', en: 'FreedomAI' },
  tagline: { zh: '可交互的三维口腔解剖教学平台', en: 'Interactive 3D oral anatomy for teaching' },
  enter: { zh: '进入三维口腔', en: 'Enter the 3D mouth' },
  intro1: { zh: '52 颗牙齿 · 颌骨 · 牙龈 · 腭与舌 · 神经血管 · 唾液腺', en: '52 teeth · jaws · gingiva · palate & tongue · nerves & vessels · salivary glands' },
  intro2: { zh: '拖动旋转 · 滚轮缩放 · 点击查看结构知识', en: 'Drag to rotate · scroll to zoom · click a structure to learn' },
  nav: { systems: { zh: '口腔结构', en: 'Structures' }, rhythm: { zh: '口腔律动', en: 'Dynamics' }, knowledge: { zh: '结构知识', en: 'Knowledge' }, tours: { zh: '教学路线', en: 'Lessons' }, search: { zh: '查找与浏览', en: 'Search' }, quiz: { zh: '解剖挑战', en: 'Challenge' } },
  regions: { zh: '区域', en: 'Region' }, systemsHdr: { zh: '系统图层', en: 'System layers' },
  states: { solid: { zh: '实体', en: 'Solid' }, translucent: { zh: '半透明', en: 'Translucent' }, wire: { zh: '线框', en: 'Wire' }, hidden: { zh: '隐藏', en: 'Hidden' } },
  dentition: { zh: '牙列', en: 'Dentition' }, permanent: { zh: '恒牙', en: 'Permanent' }, primary: { zh: '乳牙', en: 'Primary' },
  layers: { enamel: { zh: '釉质', en: 'Enamel' }, dentin: { zh: '牙本质', en: 'Dentine' }, pulp: { zh: '牙髓', en: 'Pulp' } },
  showAll: { zh: '全部显示', en: 'Show all' }, resetView: { zh: '重置视图', en: 'Reset view' },
  tools: { browse: { zh: '浏览', en: 'Browse' }, hide: { zh: '点击隐藏', en: 'Click to hide' }, isolate: { zh: '隔离', en: 'Isolate' }, measure: { zh: '测量', en: 'Measure' }, pin: { zh: '标注', en: 'Annotate' } },
  section: { zh: '剖面', en: 'Section' }, sagittal: { zh: '矢状', en: 'Sagittal' }, coronal: { zh: '冠状', en: 'Coronal' }, transverse: { zh: '水平', en: 'Transverse' }, flip: { zh: '翻转', en: 'Flip' }, off: { zh: '关闭', en: 'Off' },
  views: { front: { zh: '前', en: 'Front' }, back: { zh: '后', en: 'Back' }, left: { zh: '左', en: 'Left' }, right: { zh: '右', en: 'Right' }, top: { zh: '上', en: 'Top' }, bottom: { zh: '下', en: 'Bottom' }, iso: { zh: '斜', en: 'Iso' } },
  screenshot: { zh: '截图', en: 'Screenshot' }, exportGlb: { zh: '导出 GLB', en: 'Export GLB' }, undo: { zh: '撤销', en: 'Undo' }, redo: { zh: '重做', en: 'Redo' },
  settings: { zh: '显示设置', en: 'Display' }, theme: { zh: '背景', en: 'Background' }, themes: { light: { zh: '柔白', en: 'Soft white' }, warm: { zh: '暖灰', en: 'Warm grey' }, dark: { zh: '深色', en: 'Dark' } },
  jawOpen: { zh: '开口度', en: 'Mouth opening' }, autoRotate: { zh: '自动旋转', en: 'Auto-rotate' }, shadows: { zh: '阴影', en: 'Shadows' }, labelsOn: { zh: '悬停标签', en: 'Hover labels' },
  help: { zh: '帮助', en: 'Help' }, fullscreen: { zh: '全屏', en: 'Fullscreen' }, done: { zh: '完成', en: 'Done' },
  helpBody: { zh: ['拖动：旋转  ·  滚轮 / 双指：缩放  ·  右键拖动 / 双指拖动：平移', '单击结构：查看知识；工具栏可切换 隐藏 / 隔离 / 测量 / 标注', '剖面：选择矢状、冠状或水平面并拖动滑块，切面以实体显示', 'Ctrl+Z 撤销，Ctrl+Y 重做，Esc 退出当前工具，F 聚焦所选结构', '口腔律动：咀嚼、萌出时间轴、龋病进展、刷牙、牙周炎', '解剖挑战：每轮 5 题，主动回忆让知识留得更久'], en: ['Drag: rotate · wheel / pinch: zoom · right-drag / two fingers: pan', 'Click a structure for its knowledge card; tools: hide / isolate / measure / annotate', 'Section: choose sagittal, coronal or transverse and drag the slider; cut faces are solid', 'Ctrl+Z undo, Ctrl+Y redo, Esc leaves the tool, F frames the selection', 'Dynamics: chewing, eruption timeline, caries, brushing, periodontitis', 'Challenge: 5 questions per round — active recall makes knowledge stick'] },
  knowledgeTabs: { overview: { zh: '概述', en: 'Overview' }, location: { zh: '所在区域', en: 'Location' }, points: { zh: '知识要点', en: 'Key points' }, clinical: { zh: '临床联系', en: 'Clinical' }, related: { zh: '相关结构', en: 'Related' }, refs: { zh: '参考资料', en: 'References' } },
  noSelection: { zh: '点击模型中的任意结构，这里会显示它的解剖知识。', en: 'Click any structure in the model to read about it here.' },
  tipSelect: { zh: '提示：按住 Shift 点击可连续比较；按 F 聚焦。', en: 'Tip: press F to frame the selection.' },
  askAI: { zh: '向 DentalGPT 提问', en: 'Ask DentalGPT' },
  copyPrompt: { zh: '已复制提问内容，正在打开 FreedomAI', en: 'Prompt copied — opening FreedomAI' },
  fdi: { zh: 'FDI 牙位', en: 'FDI' }, universal: { zh: '通用编号', en: 'Universal' }, palmer: { zh: 'Palmer', en: 'Palmer' },
  erupt: { zh: '萌出', en: 'Eruption' }, shed: { zh: '脱落', en: 'Shed' }, rootDone: { zh: '牙根完成', en: 'Root complete' }, rootsN: { zh: '牙根', en: 'Roots' }, canalsN: { zh: '根管', en: 'Canals' }, cuspsN: { zh: '牙尖', en: 'Cusps' },
  dims: { zh: '平均尺寸', en: 'Average size' }, crownH: { zh: '冠高', en: 'Crown' }, md: { zh: '近远中径', en: 'MD' }, bl: { zh: '颊舌径', en: 'BL' }, rootL: { zh: '根长', en: 'Root' },
  tissueLayers: { zh: '组织层', en: 'Tissue layers' },
  rhythm: {
    chew: { zh: '咀嚼与开口', en: 'Chewing & opening' }, chewDesc: { zh: '下颌绕髁突转动并向前滑动；观察髁突与关节盘的运动。', en: 'The mandible rotates about the condyles and glides forward; watch the condyle and disc.' },
    eruption: { zh: '萌出时间轴', en: 'Eruption timeline' }, eruptionDesc: { zh: '从 0 到 22 岁：乳牙萌出、替牙期、恒牙列完成。', en: 'From birth to 22: primary teeth, mixed dentition, full permanent dentition.' },
    caries: { zh: '龋病进展', en: 'Caries progression' }, cariesDesc: { zh: '36 牙的剖面：白垩斑 → 釉质龋洞 → 牙本质龋 → 牙髓炎 → 根尖周脓肿。', en: 'Section of tooth 36: white spot → enamel cavity → dentine caries → pulpitis → periapical abscess.' },
    brushing: { zh: '巴氏刷牙法', en: 'Bass brushing' }, brushingDesc: { zh: '刷毛与牙面成 45°，指向龈沟，短距离水平颤动，颊 → 腭 → 𬌗面。', en: 'Bristles at 45° into the sulcus with short vibrating strokes: buccal → occlusal → lingual.' },
    perio: { zh: '牙周炎进展', en: 'Periodontitis' }, perioDesc: { zh: '牙龈炎 → 附着丧失 → 牙槽骨吸收 → 牙根暴露。', en: 'Gingivitis → attachment loss → alveolar bone loss → root exposure.' },
    speed: { zh: '速度', en: 'Speed' }, amplitude: { zh: '幅度', en: 'Amplitude' }, play: { zh: '播放', en: 'Play' }, pause: { zh: '暂停', en: 'Pause' }, stop: { zh: '停止', en: 'Stop' }, age: { zh: '年龄', en: 'Age' }, years: { zh: '岁', en: 'y' }, stage: { zh: '阶段', en: 'Stage' },
    cariesStages: { zh: ['釉质白垩斑（可再矿化）', '釉质龋洞', '牙本质龋，冷热敏感', '牙髓炎，自发痛、夜间痛', '根尖周脓肿'], en: ['Enamel white spot (reversible)', 'Enamel cavity', 'Dentine caries — sensitivity', 'Pulpitis — spontaneous, nocturnal pain', 'Periapical abscess'] },
    brushStages: { zh: ['下颌颊侧：45° 指向龈沟，颤动', '上颌颊侧：45° 向上指向龈沟', '𬌗面：前后短距离刷', '下颌舌侧：竖放刷头，上下提拉'], en: ['Lower buccal: 45° into the sulcus, vibrate', 'Upper buccal: 45° upward into the sulcus', 'Occlusal: short back-and-forth strokes', 'Lower lingual: brush upright, sweep up'] },
    perioStages: { zh: ['健康：龈沟 ≤3 mm，探诊不出血', '牙龈炎：红肿、探诊出血，可逆', '早中期牙周炎：附着丧失、骨吸收', '重度牙周炎：牙根暴露、牙齿松动'], en: ['Healthy: sulcus ≤3 mm, no bleeding', 'Gingivitis: red, swollen, bleeds — reversible', 'Early/moderate periodontitis: attachment and bone loss', 'Severe periodontitis: exposed roots, mobility'] },
  },
  search: { placeholder: { zh: '搜索结构、FDI 牙位、英文名…', en: 'Search structures, FDI numbers, names…' }, bySystem: { zh: '按系统', en: 'By system' }, byRegion: { zh: '按区域', en: 'By region' }, results: { zh: '个结果', en: 'results' } },
  quiz: {
    title: { zh: '解剖挑战', en: 'Anatomy challenge' }, slogan: { zh: '主动回忆，让解剖记得更牢', en: 'Active recall makes anatomy stick' },
    modes: { identify: { zh: '结构识别', en: 'Identify' }, find: { zh: '解剖寻找', en: 'Locate' }, fdi: { zh: 'FDI 编号', en: 'FDI numbering' } },
    modeDesc: { identify: { zh: '模型高亮一个结构，选出它的名称', en: 'A structure is highlighted — choose its name' }, find: { zh: '给出名称，在模型中点击它', en: 'Click the named structure in the model' }, fdi: { zh: '高亮一颗牙，选出它的 FDI 编号', en: 'A tooth is highlighted — choose its FDI number' } },
    start: { zh: '开始 5 题', en: 'Start 5 questions' }, next: { zh: '下一题', en: 'Next' }, again: { zh: '再来一轮', en: 'Play again' }, correct: { zh: '正确！', en: 'Correct!' }, wrong: { zh: '不对，答案是', en: 'Not quite — it is' },
    question: { zh: '第', en: 'Q' }, of: { zh: '题 / 共 5 题', en: ' of 5' }, score: { zh: '得分', en: 'Score' }, streak: { zh: '连对', en: 'Streak' }, findPrompt: { zh: '请在模型中点击：', en: 'Click in the model:' }, done: { zh: '本轮完成', en: 'Round complete' }, best: { zh: '最佳', en: 'Best' },
  },
  tours: { start: { zh: '开始', en: 'Start' }, prev: { zh: '上一步', en: 'Previous' }, next: { zh: '下一步', en: 'Next' }, exit: { zh: '退出课程', en: 'Exit lesson' }, step: { zh: '步骤', en: 'Step' }, minutes: { zh: '分钟', en: 'min' } },
  footer: { zh: '© 2026 自由动脉 FreedomAI · 本平台仅用于教学与学习，不作临床诊断依据', en: '© 2026 FreedomAI · For education only, not for clinical use' },
  refs: { zh: ['Nelson SJ. Wheeler\'s Dental Anatomy, Physiology and Occlusion. 11th ed.', '皮昕 主编.《口腔解剖生理学》第 8 版. 人民卫生出版社.', 'Standring S. Gray\'s Anatomy. 42nd ed.', 'FDI World Dental Federation. Two-digit tooth numbering system (ISO 3950).', 'DentalGPT: Incentivizing Multimodal Complex Reasoning in Dentistry (arXiv 2512.11558).'], en: ['Nelson SJ. Wheeler\'s Dental Anatomy, Physiology and Occlusion. 11th ed.', 'Pi X (ed.). Oral Anatomy and Physiology, 8th ed. People\'s Medical Publishing House.', 'Standring S. Gray\'s Anatomy. 42nd ed.', 'FDI World Dental Federation. Two-digit tooth numbering system (ISO 3950).', 'DentalGPT: Incentivizing Multimodal Complex Reasoning in Dentistry (arXiv 2512.11558).'] },
  modelNote: { zh: '模型为参数化示意模型（平均尺寸），非真实个体扫描。', en: 'Parametric schematic model built from average dimensions, not a scan of an individual.' },
  toastShot: { zh: '截图已保存', en: 'Screenshot saved' }, toastGlb: { zh: 'GLB 已导出（可在 Blender 中打开）', en: 'GLB exported (opens in Blender)' },
  lang: { zh: '中文', en: 'English' },
};

let lang = 'zh';
export function setLang(l) { lang = l; document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'; }
export function getLang() { return lang; }
/** Resolve a {zh,en} object or a dotted key path. */
export function t(key) {
  if (key && typeof key === 'object') return key[lang] ?? key.zh;
  const parts = key.split('.');
  let cur = STRINGS;
  for (const p of parts) { cur = cur?.[p]; if (cur === undefined) return key; }
  if (cur && typeof cur === 'object' && (lang in cur)) return cur[lang];
  return cur;
}
