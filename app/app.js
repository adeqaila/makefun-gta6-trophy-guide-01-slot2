// Leonida Ledger: GTA VI trophy tracker. Loads app/data/trophies.json, renders the
// checklist with a guide panel, saves progress in localStorage, and exports/imports it.
const STORE_KEY = 'leonida-ledger-progress-v1';
const SPOILER_KEY = 'leonida-ledger-spoiler-v1';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const searchBox = document.getElementById('searchBox');
const filterNote = document.getElementById('filterNote');
const spoilerBtn = document.getElementById('spoilerToggle');

let trophies = [];
let earned = new Set(readStored(STORE_KEY, []));
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let activeFilter = 'all';
let selectedId = 28;

function readStored(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
  document.getElementById('savedNote').textContent = 'Saved in this browser';
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function isStory(t) {
  return t.kind === 'story';
}

function hiddenBySpoiler(t) {
  return spoilerOn && isStory(t) && !earned.has(t.name);
}

function displayName(t) {
  return hiddenBySpoiler(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
}

function displayDescription(t) {
  return hiddenBySpoiler(t) ? 'Spoiler shield is on. Tick this trophy off when you earn it to reveal its name and description.' : t.description;
}

function flagText(t) {
  if (t.missable) return 'Possibly missable';
  if (t.atRisk) return 'At risk';
  return '';
}

function matchesFilter(t) {
  if (activeFilter === 'story') return isStory(t);
  if (activeFilter === 'missable') return t.missable || t.atRisk;
  if (activeFilter === 'collectibles') return t.kind === 'collectibles';
  if (activeFilter === 'activities') return t.kind === 'activities';
  if (activeFilter === 'online') return t.kind === 'online';
  if (activeFilter === 'notearned') return !earned.has(t.name);
  return true;
}

function matchesSearch(t) {
  const q = searchBox.value.trim().toLowerCase();
  if (!q) return true;
  return (t.name + ' ' + t.description).toLowerCase().includes(q);
}

function renderProgress() {
  document.getElementById('earnedCount').textContent = String(earned.size);
  document.getElementById('progressFill').style.width = `${(earned.size / trophies.length) * 100}%`;
}

function renderAudit() {
  const cited = trophies.filter((t) => t.sources && t.sources.length > 0).length;
  const sites = [...new Set(trophies.flatMap((t) => (t.sources || []).map((s) => s.site)))];
  const disputes = trophies.filter((t) => t.dispute).length;
  document.getElementById('auditCited').textContent = `${cited}/${trophies.length}`;
  document.getElementById('auditSites').textContent = String(sites.length);
  document.getElementById('auditDisputes').textContent = String(disputes);
  document.getElementById('auditText').textContent =
    `${trophies.length}/${trophies.length} official trophies listed, ${cited}/${trophies.length} guides with named sources, ` +
    `${sites.length} source sites, ${disputes} disputes where sources disagree and both versions are shown.`;
}

function renderList() {
  const shown = trophies.filter((t) => matchesFilter(t) && matchesSearch(t));
  filterNote.textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (activeFilter === 'online' ? ' — the official list has no online trophies.' : '');
  listEl.replaceChildren();
  if (shown.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No trophies match this filter.';
    listEl.append(li);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    if (t.id === selectedId) li.classList.add('selected');
    if (earned.has(t.name)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveProgress();
      renderProgress();
      renderList();
      renderDetail();
    });
    const wrap = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = displayName(t) + (earned.has(t.name) ? ' ✓' : '');
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = displayDescription(t);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const grade = document.createElement('span');
    grade.className = `grade ${t.grade}`;
    grade.textContent = gradeLabel(t);
    meta.append(grade, document.createTextNode(`  #${t.id} of 55  ·  ${t.kind}`));
    const flag = flagText(t);
    if (flag) {
      const flagEl = document.createElement('span');
      flagEl.className = 'flag';
      flagEl.textContent = `  ·  ${flag}`;
      meta.append(flagEl);
    }
    if (t.count) {
      meta.append(document.createTextNode(`  ·  count ${t.count}`));
    }
    wrap.append(name, desc, meta);
    li.append(box, wrap);
    li.addEventListener('click', (event) => {
      if (event.target !== box) {
        selectedId = t.id;
        renderList();
        renderDetail();
      }
    });
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  if (!t) return;
  detailEl.replaceChildren();
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description · ${gradeLabel(t)} · #${t.id} of 55`;
  const heading = document.createElement('h2');
  heading.textContent = displayName(t);
  const desc = document.createElement('p');
  desc.textContent = displayDescription(t);
  detailEl.append(official, heading, desc);
  if (hiddenBySpoiler(t)) {
    const note = document.createElement('p');
    note.textContent = 'The guide for this story trophy stays hidden until you earn it. Turn the spoiler shield off above to read it now.';
    detailEl.append(note);
    return;
  }
  if (t.missable && t.lastChance) {
    const last = document.createElement('p');
    last.className = 'last-chance';
    last.textContent = `Last chance: ${t.lastChance}`;
    detailEl.append(last);
  } else if (t.atRisk) {
    const last = document.createElement('p');
    last.className = 'last-chance';
    last.textContent = 'At risk: failing this the wrong way costs the attempt — save first, then try again.';
    detailEl.append(last);
  }
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  detailEl.append(guide);
  const sources = document.createElement('p');
  sources.className = 'sources';
  const label = document.createElement('b');
  label.textContent = 'Sources: ';
  sources.append(label);
  sources.append(document.createTextNode((t.sources || []).map((s) => `${s.name} (${s.site})`).join('; ') + '.'));
  detailEl.append(sources);
  if (t.dispute) {
    const box = document.createElement('p');
    box.className = 'dispute-box';
    box.textContent = `Sources differ — both versions shown: ${t.dispute}`;
    detailEl.append(box);
  }
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = earned.has(t.name) ? 'Mark as not earned' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name);
    else earned.add(t.name);
    saveProgress();
    renderProgress();
    renderList();
    renderDetail();
  });
  detailEl.append(earnedBtn);
}

const ROADMAP = [
  { stage: 1, title: 'Chapters 1–2 — learn Leonida', text: 'Play the opening missions and finish Chapters 1 and 2. Do the Chapter 1 balcony meditation the first time it is offered, and start the stranger strands as they appear.' },
  { stage: 2, title: 'Chapters 3–4 and the finale', text: 'Finish Chapters 3 and 4 and the final mission. Before the finale, clear every missable whose last chance is tied to the story ending.' },
  { stage: 3, title: 'Stranger strands and side missions', text: 'Complete the strands for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus two more strangers, until 8 strands are done. These also feed the 100% checklist.' },
  { stage: 4, title: 'Collectibles sweep', text: 'Meditation spots, card sets, WAiNK It locations, vehicle discovery, garage properties and full exploration of Leonida. Do them as one driving tour, not as separate grinds.' },
  { stage: 5, title: 'Activities', text: 'Shooting Range golds, drone races at every location, 20 different race wins, 250 stunts, 50 challenges, fishing, the arcade and bowling. One attempt at each activity type also clears Master of None.' },
  { stage: 6, title: 'Combat and heists', text: 'Wanted-level escapes with your partner, shop and jewelry robberies, bank vaults, the armored truck, gang operations and the Rhino. Save before the one-attempt robberies.' },
  { stage: 7, title: 'Money and leisure', text: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, register 10 vehicles to Scooter Bros, enjoy the Ocean Beach cocktail, and chase the strange events.' },
  { stage: 8, title: 'Cleanup and 100% completion', text: 'Check the in-game completion stats, fill the gaps — usually a collectible set or a stranger strand — and let A Long Road pop at 100%.' },
  { stage: 9, title: 'Platinum', text: 'Vice Got a Price! pops when the other 54 are done. Roughly 200 hours in total, difficulty 4/10, one playthrough plus chapter replay.' },
];

function renderRoadmap() {
  const ol = document.getElementById('roadmapStages');
  for (const step of ROADMAP) {
    const count = trophies.filter((t) => t.stage === step.stage).length;
    const li = document.createElement('li');
    const title = document.createElement('b');
    title.textContent = step.title;
    const countEl = document.createElement('span');
    countEl.className = 'count';
    countEl.textContent = `${count} trophies`;
    const text = document.createElement('p');
    text.textContent = step.text;
    li.append(title, countEl, text);
    ol.append(li);
  }
}

function renderMissables() {
  const rows = document.getElementById('missRows');
  const flagged = trophies.filter((t) => t.missable || t.atRisk);
  for (const t of flagged) {
    const tr = document.createElement('tr');
    const flag = document.createElement('td');
    flag.textContent = t.missable ? 'Possibly missable' : 'At risk';
    const name = document.createElement('td');
    name.textContent = t.name;
    const last = document.createElement('td');
    last.textContent = t.lastChance || 'Save before you try it';
    const what = document.createElement('td');
    what.textContent = t.dispute ? t.dispute : 'Do it early; a failed attempt can be retried from a save.';
    tr.append(flag, name, last, what);
    rows.append(tr);
  }
}

function renderSources() {
  const sites = [...new Set(trophies.flatMap((t) => (t.sources || []).map((s) => `${s.name} (${s.site})`)))];
  const list = document.getElementById('sourceList');
  for (const s of sites.sort()) {
    const li = document.createElement('li');
    li.textContent = s;
    list.append(li);
  }
  const disputes = document.getElementById('disputeList');
  for (const t of trophies.filter((x) => x.dispute)) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = `${t.name}: `;
    li.append(b, document.createTextNode(t.dispute));
    disputes.append(li);
  }
}

function setSpoiler(on) {
  spoilerOn = on;
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  spoilerBtn.setAttribute('aria-pressed', String(on));
  spoilerBtn.textContent = on ? 'ON — 12 story masked' : 'OFF — story names shown';
  renderList();
  renderDetail();
}

spoilerBtn.addEventListener('click', () => setSpoiler(!spoilerOn));

document.getElementById('exportBtn').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', earned: [...earned].sort(), exportedAt: new Date().toISOString() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names || []).filter((n) => known.has(n)));
    saveProgress();
    renderProgress();
    renderList();
    renderDetail();
  } catch {
    document.getElementById('savedNote').textContent = 'Import failed: that file is not valid progress.';
  }
  event.target.value = '';
});

document.querySelectorAll('#filters button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderList();
  });
});

document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

searchBox.addEventListener('input', renderList);

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
setSpoiler(spoilerOn);
renderProgress();
renderAudit();
renderList();
renderDetail();
renderRoadmap();
renderMissables();
renderSources();
