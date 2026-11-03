// Side-panel contents: systems, dynamics, search, quiz, lessons and the knowledge card.
import { h, clear, icon } from './dom.js';
import { t, getLang } from '../data/i18n.js';
import { SYSTEMS, REGIONS } from '../data/structures.js';
import { TISSUE_LAYERS } from '../data/teeth.js';
import { MILESTONES } from '../data/eruption.js';
import { TOURS } from '../data/tours.js';
import { TOOTH_SPECS } from '../model/tooth.js';

const STATES = ['solid', 'translucent', 'wire', 'hidden'];

function segmented(value, onPick, keys = STATES) {
  return h('div', { class: 'seg' }, keys.map(k => h('button', { class: 'segbtn' + (value === k ? ' on' : ''), title: t('states.' + k), onClick: (e) => { onPick(k); e.currentTarget.parentElement.querySelectorAll('.segbtn').forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, t('states.' + k).slice(0, getLang() === 'zh' ? 3 : 5))));
}

export function renderSystemsPanel(app) {
  const regionChips = h('div', { class: 'chips wrap' }, REGIONS.map(r => h('button', { class: 'chip' + (app.region === r.id ? ' active' : ''), onClick: (e) => { app.setRegion(r.id); e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === e.target)); } }, t(r))));
  const rows = SYSTEMS.map(sys => {
    const count = app.model.list().filter(e => e.system === sys.id && e.visible).length;
    const row = h('div', { class: 'layer-row' },
      h('span', { class: 'swatch', style: { background: sys.color } }),
      h('span', { class: 'layer-name' }, t(sys), h('small', {}, count)),
      segmented(app.systemState[sys.id], (st) => app.setSystemState(sys.id, st)),
    );
    if (sys.id === 'teeth') {
      const sub = h('div', { class: 'sublayers' },
        ['enamel', 'dentin', 'pulp'].map(layer => h('div', { class: 'layer-row sub' },
          h('span', { class: 'swatch', style: { background: layer === 'enamel' ? '#f4efe3' : layer === 'dentin' ? '#e9cf96' : '#d14a52' } }),
          h('span', { class: 'layer-name' }, t('layers.' + layer)),
          segmented(app.toothLayerState[layer], (st) => app.setToothLayerState(layer, st)),
        )),
      );
      return [row, sub];
    }
    return row;
  });
  return h('div', { class: 'panel-body' },
    h('h3', {}, t('regions')), regionChips,
    h('h3', {}, t('systemsHdr'), h('button', { class: 'link', onClick: () => app.showAll() }, t('showAll'))),
    h('div', { class: 'layers' }, rows),
    h('div', { class: 'legend' }, STATES.map(s => h('span', {}, t('states.' + s))).flatMap((x, i, a) => i < a.length - 1 ? [x, ' · '] : [x])),
  );
}

export function renderRhythmPanel(app) {
  const anim = app.anim;
  const modes = ['chew', 'eruption', 'caries', 'brushing', 'perio'];
  const cards = modes.map(m => h('button', { class: 'card' + (anim.mode === m ? ' active' : ''), onClick: () => { if (anim.mode === m) anim.stop(); else anim.start(m); app.renderLeft(); } },
    h('b', {}, t('rhythm.' + m)), h('p', {}, t('rhythm.' + m + 'Desc'))));
  const body = h('div', { class: 'panel-body' }, h('h3', {}, t('nav.rhythm')), h('div', { class: 'cards' }, cards));
  if (anim.mode) {
    const ctl = h('div', { class: 'controls' });
    const playBtn = h('button', { class: 'btn ghost', onClick: () => { anim.playing = !anim.playing; playBtn.replaceChildren(icon(anim.playing ? 'pause' : 'play'), ' ' + t(anim.playing ? 'rhythm.pause' : 'rhythm.play')); } }, icon(anim.playing ? 'pause' : 'play'), ' ' + t(anim.playing ? 'rhythm.pause' : 'rhythm.play'));
    const stopBtn = h('button', { class: 'btn ghost', onClick: () => { anim.stop(); app.renderLeft(); } }, icon('stop'), ' ' + t('rhythm.stop'));
    ctl.append(h('div', { class: 'row' }, playBtn, stopBtn));
    ctl.append(h('div', { class: 'row' }, h('label', {}, t('rhythm.speed')), h('input', { type: 'range', min: 10, max: 300, value: anim.speed * 100, class: 'slider', onInput: (e) => { anim.speed = e.target.value / 100; } })));
    if (anim.mode === 'chew') ctl.append(h('div', { class: 'row' }, h('label', {}, t('rhythm.amplitude')), h('input', { type: 'range', min: 20, max: 150, value: anim.amplitude * 100, class: 'slider', onInput: (e) => { anim.amplitude = e.target.value / 100; } })));
    if (anim.mode === 'eruption') {
      const ageLbl = h('span', { class: 'val' });
      const slider = h('input', { type: 'range', min: 0, max: 220, value: anim.age * 10, class: 'slider', onInput: (e) => { anim.playing = false; anim.setAge(e.target.value / 10); playBtn.replaceChildren(icon('play'), ' ' + t('rhythm.play')); } });
      const ms = h('ul', { class: 'milestones' }, MILESTONES.map(m => h('li', { dataset: { age: m.age } }, h('b', {}, m.age + ' ' + t('rhythm.years')), ' ', t(m))));
      ctl.append(h('div', { class: 'row' }, h('label', {}, t('rhythm.age')), slider, ageLbl), ms);
      anim.addEventListener('tick', () => { if (anim.mode !== 'eruption') return; ageLbl.textContent = anim.age.toFixed(1) + ' ' + t('rhythm.years'); if (anim.playing) slider.value = anim.age * 10; ms.querySelectorAll('li').forEach(li => li.classList.toggle('on', +li.dataset.age <= anim.age + 0.01)); });
    } else if (anim.mode !== 'chew') {
      const stageLbl = h('div', { class: 'stage' });
      const slider = h('input', { type: 'range', min: 0, max: 1000, value: anim.progress * 1000, class: 'slider', onInput: (e) => { anim.playing = false; anim.setProgress(e.target.value / 1000); playBtn.replaceChildren(icon('play'), ' ' + t('rhythm.play')); } });
      ctl.append(h('div', { class: 'row' }, h('label', {}, t('rhythm.stage')), slider), stageLbl);
      const stagesKey = { caries: 'rhythm.cariesStages', brushing: 'rhythm.brushStages', perio: 'rhythm.perioStages' }[anim.mode];
      const update = () => { if (!stagesKey || anim.mode === 'chew') return; const st = t(stagesKey); const list = h('ol', { class: 'stages' }, st.map((s, i) => h('li', { class: i === (anim.stage || 0) ? 'on' : i < (anim.stage || 0) ? 'done' : '' }, s))); stageLbl.replaceChildren(list); if (anim.playing) slider.value = anim.progress * 1000; };
      update(); anim.addEventListener('tick', () => { if (anim.mode) update(); });
    }
    body.append(ctl);
  }
  return body;
}

export function renderSearchPanel(app) {
  const results = h('div', { class: 'results' });
  const entries = app.model.list();
  const run = (q) => {
    clear(results);
    q = q.trim().toLowerCase();
    let list = entries;
    if (q) list = entries.filter(e => e.name.zh.toLowerCase().includes(q) || e.name.en.toLowerCase().includes(q) || (e.type === 'tooth' && (String(e.fdi).includes(q) || e.universal.toLowerCase() === q || e.palmer.toLowerCase() === q)) || e.id.includes(q));
    if (currentSystem) list = list.filter(e => e.system === currentSystem);
    if (currentRegion && currentRegion !== 'all') list = list.filter(e => e.regions.includes(currentRegion));
    results.append(h('div', { class: 'count' }, list.length + ' ' + t('search.results')));
    for (const e of list.slice(0, 120)) {
      results.append(h('button', { class: 'result', onClick: () => app.selectById(e.id) },
        h('span', { class: 'swatch', style: { background: SYSTEMS.find(s => s.id === e.system)?.color } }),
        h('span', { class: 'r-name' }, t(e.name), h('small', {}, getLang() === 'zh' ? e.name.en : e.name.zh)),
        e.type === 'tooth' ? h('span', { class: 'fdi' }, e.fdi) : null));
    }
  };
  let currentSystem = null, currentRegion = 'all';
  const input = h('input', { type: 'search', class: 'search', placeholder: t('search.placeholder'), onInput: (e) => run(e.target.value) });
  const sysChips = h('div', { class: 'chips wrap' }, SYSTEMS.map(s => h('button', { class: 'chip', onClick: (e) => { currentSystem = currentSystem === s.id ? null : s.id; e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === e.target && currentSystem)); run(input.value); } }, t(s))));
  const regChips = h('div', { class: 'chips wrap' }, REGIONS.map(r => h('button', { class: 'chip' + (r.id === 'all' ? ' active' : ''), onClick: (e) => { currentRegion = r.id; e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === e.target)); run(input.value); } }, t(r))));
  run('');
  setTimeout(() => input.focus(), 50);
  return h('div', { class: 'panel-body' }, h('div', { class: 'searchbox' }, icon('search'), input), h('h3', {}, t('search.bySystem')), sysChips, h('h3', {}, t('search.byRegion')), regChips, results);
}

export function renderToursPanel(app) {
  return h('div', { class: 'panel-body' }, h('h3', {}, t('nav.tours')),
    h('div', { class: 'cards' }, TOURS.map(tour => h('button', { class: 'card' + (app.tour?.def === tour ? ' active' : ''), onClick: () => { app.startTour(tour); app.renderLeft(); } },
      h('b', {}, t(tour.title)), h('p', {}, t(tour.summary)), h('small', {}, `${tour.steps.length} ${t('tours.step')} · ${tour.minutes} ${t('tours.minutes')}`)))));
}

// ---------------- quiz ----------------
export function renderQuizPanel(app) {
  const body = h('div', { class: 'panel-body quiz' });
  const state = app.quiz || (app.quiz = { mode: 'identify', q: 0, score: 0, streak: 0, best: +(localStorage.getItem('dv.best') || 0), current: null, answered: false, active: false });
  const pool = () => app.model.list().filter(e => e.visible && (state.mode === 'fdi' ? e.type === 'tooth' && !e.tooth.primary : (e.type !== 'tooth' || !e.tooth.primary)));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const newQuestion = () => {
    const p = pool(); const target = pick(p);
    let options = [];
    if (state.mode === 'fdi') { const nums = new Set([target.fdi]); while (nums.size < 4) nums.add(pick(p).fdi); options = [...nums].sort(() => Math.random() - 0.5).map(n => ({ label: String(n), ok: n === target.fdi })); }
    else if (state.mode === 'identify') { const set = new Set([target.id]); while (set.size < 4) set.add(pick(p).id); options = [...set].sort(() => Math.random() - 0.5).map(id => ({ label: t(app.model.get(id).name), ok: id === target.id })); }
    state.current = { target, options }; state.answered = false;
    if (state.mode === 'find') { app.interact.select(null); app.setTool('quiz'); }
    else { app.interact.select(target, { silent: true }); app.viewer.frameBox(app.model.boxOf(target.id), null, 0.8, 2.6); }
    render();
  };
  const answer = (ok, labelOfTruth) => {
    if (state.answered) return;
    state.answered = true; state.lastOk = ok; state.truth = labelOfTruth;
    if (ok) { state.score++; state.streak++; } else state.streak = 0;
    if (state.mode === 'find') app.interact.select(state.current.target);
    render();
  };
  const next = () => { state.q++; if (state.q >= 5) { state.active = false; state.best = Math.max(state.best, state.score); localStorage.setItem('dv.best', state.best); app.setTool('browse'); render(); } else newQuestion(); };
  if (!app._quizBound) { app._quizBound = true; app.interact.addEventListener('quizpick', (e) => { if (!state.active || state.mode !== 'find' || state.answered) return; const hit = e.detail.entry; answer(!!hit && hit.id === state.current.target.id, t(state.current.target.name)); }); }
  const render = () => {
    clear(body);
    body.append(h('h3', {}, t('quiz.title')), h('p', { class: 'slogan' }, t('quiz.slogan')));
    if (!state.active) {
      body.append(h('div', { class: 'cards' }, ['identify', 'find', 'fdi'].map(m => h('button', { class: 'card' + (state.mode === m ? ' active' : ''), onClick: () => { state.mode = m; render(); } }, h('b', {}, t('quiz.modes.' + m)), h('p', {}, t('quiz.modeDesc.' + m))))));
      if (state.q >= 5) body.append(h('div', { class: 'scorebox' }, h('b', {}, t('quiz.done')), h('span', {}, `${t('quiz.score')} ${state.score} / 5 · ${t('quiz.best')} ${state.best} / 5`)));
      body.append(h('button', { class: 'btn primary', onClick: () => { state.q = 0; state.score = 0; state.streak = 0; state.active = true; newQuestion(); } }, state.q >= 5 ? t('quiz.again') : t('quiz.start')));
      return;
    }
    const cur = state.current;
    body.append(h('div', { class: 'qhead' }, h('span', {}, `${t('quiz.question')} ${state.q + 1} ${t('quiz.of')}`), h('span', {}, `${t('quiz.score')} ${state.score} · ${t('quiz.streak')} ${state.streak}`)));
    if (state.mode === 'find') body.append(h('div', { class: 'qprompt' }, t('quiz.findPrompt'), h('b', {}, t(cur.target.name))));
    else body.append(h('div', { class: 'options' }, cur.options.map(o => h('button', { class: 'btn option' + (state.answered ? (o.ok ? ' ok' : ' no') : ''), onClick: () => answer(o.ok, cur.options.find(x => x.ok).label) }, o.label))));
    if (state.answered) body.append(h('div', { class: 'feedback ' + (state.lastOk ? 'ok' : 'no') }, state.lastOk ? t('quiz.correct') : `${t('quiz.wrong')} ${state.truth}`), h('button', { class: 'btn primary', onClick: next }, t('quiz.next')));
  };
  render();
  return body;
}

// ---------------- knowledge card ----------------
export function renderKnowledge(app, entry) {
  const lang = getLang();
  if (!entry) return h('div', { class: 'panel-body knowledge empty' }, h('h3', {}, t('nav.knowledge')), h('p', {}, t('noSelection')), h('p', { class: 'tiny' }, t('tipSelect')));
  const k = entry.knowledge || {};
  const sysDef = SYSTEMS.find(s => s.id === entry.system);
  const head = h('div', { class: 'k-head' },
    h('div', { class: 'k-title' }, h('h2', {}, t(entry.name)), h('div', { class: 'k-en' }, lang === 'zh' ? entry.name.en : entry.name.zh)),
    h('div', { class: 'k-actions' },
      h('button', { class: 'iconbtn', title: 'Focus (F)', onClick: () => app.focusSelected() }, icon('focus')),
      h('button', { class: 'iconbtn', title: t('tools.hide'), onClick: () => app.interact.setVisible(entry.id, false, true) }, icon('hide')),
      h('button', { class: 'iconbtn', title: t('tools.isolate'), onClick: () => app.interact.isolate(entry.id) }, icon('isolate')),
      h('button', { class: 'iconbtn', onClick: () => { app.interact.select(null); } }, icon('close'))),
  );
  const badges = h('div', { class: 'badges' }, h('span', { class: 'badge sys', style: { '--c': sysDef?.color } }, t(sysDef)));
  if (entry.type === 'tooth') badges.append(h('span', { class: 'badge' }, `${t('fdi')} ${entry.fdi}`), h('span', { class: 'badge' }, `${t('universal')} ${entry.universal}`), h('span', { class: 'badge' }, `${t('palmer')} ${entry.palmer}`));

  const sections = [];
  sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.overview')), h('p', {}, t(k.overview || { zh: '', en: '' }))));
  if (entry.type === 'tooth') {
    const sp = TOOTH_SPECS[entry.specKey];
    const facts = [
      [t('erupt'), t(k.erupt)], k.shed ? [t('shed'), t(k.shed)] : null, k.rootDone ? [t('rootDone'), t(k.rootDone)] : null,
      [t('rootsN'), String(k.roots)], [t('canalsN'), k.canals], [t('cuspsN'), t(k.cusps)],
    ].filter(Boolean);
    sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.location')),
      h('table', { class: 'facts' }, facts.map(([a, b]) => h('tr', {}, h('th', {}, a), h('td', {}, b)))),
      h('div', { class: 'dims' }, h('b', {}, t('dims')), ` ${t('crownH')} ${sp.crownH} · ${t('md')} ${sp.md} · ${t('bl')} ${sp.bl} · ${t('rootL')} ${sp.rootL} mm`)));
  } else {
    const regs = entry.regions.filter(r => r !== 'all').map(r => t(REGIONS.find(x => x.id === r) || { zh: r, en: r }));
    sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.location')), h('div', { class: 'chips' }, regs.map(r => h('span', { class: 'chip static' }, r)))));
  }
  if (k.points) sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.points')), h('ul', { class: 'points' }, t(k.points).map(p => h('li', {}, p)))));
  if (k.clinical) sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.clinical')), h('ul', { class: 'points clinical' }, t(k.clinical).map(p => h('li', {}, p)))));
  if (entry.type === 'tooth') {
    const layerChips = h('div', { class: 'chips wrap' }, Object.entries(TISSUE_LAYERS).map(([key, L]) => h('button', { class: 'chip', onClick: (e) => { const box = e.currentTarget.parentElement.nextSibling; box.textContent = t(L.text); box.classList.remove('hidden'); } }, t(L.name))));
    sections.push(h('section', {}, h('h4', {}, t('tissueLayers')), layerChips, h('p', { class: 'layer-text hidden' })));
  }
  // related
  const related = [];
  if (entry.type === 'tooth') {
    const tt = entry.tooth;
    const neighbour = (pos) => app.model.teeth.find(e => e.tooth.arch === tt.arch && e.tooth.side === tt.side && e.tooth.primary === tt.primary && e.tooth.pos === pos);
    for (const n of [neighbour(tt.pos - 1), neighbour(tt.pos + 1)]) if (n) related.push(n.id);
    const opp = app.model.teeth.find(e => e.tooth.arch !== tt.arch && e.tooth.side === tt.side && e.tooth.primary === tt.primary && e.tooth.pos === tt.pos); if (opp) related.push(opp.id);
    related.push(tt.arch === 'U' ? 'gum_upper' : 'gum_lower', tt.arch === 'U' ? 'maxilla' : 'mandible', tt.arch === 'U' ? 'psa_' + tt.side : 'ian_' + tt.side);
  } else for (const r of (k.related || [])) { if (r === 'teeth') continue; related.push(r); }
  const relChips = related.filter(id => app.model.get(id)).map(id => h('button', { class: 'chip', onClick: () => app.selectById(id) }, t(app.model.get(id).name)));
  if (relChips.length) sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.related')), h('div', { class: 'chips wrap' }, relChips)));
  sections.push(h('section', {}, h('h4', {}, t('knowledgeTabs.refs')), h('ol', { class: 'refs-list' }, t('refs').slice(0, 3).map(r => h('li', {}, r)))));

  const ai = h('button', { class: 'btn ai', onClick: () => {
    const q = lang === 'zh' ? `请从口腔解剖与临床角度介绍：${entry.name.zh}（${entry.name.en}${entry.type === 'tooth' ? '，FDI ' + entry.fdi : ''}）。包括形态特点、毗邻关系、神经血管供应和临床意义。` : `Explain the anatomy and clinical relevance of the ${entry.name.en}${entry.type === 'tooth' ? ' (FDI ' + entry.fdi + ')' : ''}: morphology, relations, nerve and blood supply, clinical significance.`;
    navigator.clipboard?.writeText(q).catch(() => {});
    window.open('https://www.freedomai.cn/', '_blank', 'noopener');
    app.toast(t('copyPrompt'), 2600);
  } }, icon('ai'), ' ' + t('askAI'));

  return h('div', { class: 'panel-body knowledge' }, head, badges, ...sections, ai);
}
