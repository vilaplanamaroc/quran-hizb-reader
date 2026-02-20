const TOTAL = 60;
const PROGRESS_KEY = "hizb_done_v2";

// QuranFoundation API (verses by hizb)  [oai_citation:1‡api-docs.quran.foundation](https://api-docs.quran.foundation/docs/content_apis_versioned/verses-by-hizb-number/)
const API_BASE = "https://api.alquran.cloud/v1";

let selected = null;
let done = Array(TOTAL).fill(false);

const el = (id) => document.getElementById(id);

function setStatus(msg) {
  const s = el("status");
  if (s) s.textContent = msg;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (Array.isArray(s.done) && s.done.length === TOTAL) done = s.done;
  } catch {}
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ done }));
}

function renderStats() {
  const d = done.filter(Boolean).length;
  const left = TOTAL - d;
  const pct = Math.round((d / TOTAL) * 100);
  const stats = el("stats");
  if (stats) stats.textContent = `مقروء: ${d} حزب • متبقي: ${left} • ${pct}%`;
}

function renderGrid() {
  const grid = el("hizbGrid") || el("grid"); // support both ids
  if (!grid) return;

  grid.innerHTML = "";
  for (let i = 1; i <= TOTAL; i++) {
    const b = document.createElement("button");
    b.className = "hizbBtn";
    if (done[i - 1]) b.classList.add("done");
    if (selected === i) b.classList.add("active");
    b.textContent = `حزب ${i}`;
    b.onclick = () => openHizb(i);
    grid.appendChild(b);
  }
}

function setButtons() {
  const btnDone = el("btnDone") || el("doneBtn");
  const btnUndo = el("btnUndo") || el("undoBtn");
  if (!btnDone || !btnUndo) return;

  if (!selected) {
    btnDone.disabled = true;
    btnUndo.disabled = true;
    return;
  }
  btnDone.disabled = done[selected - 1];
  btnUndo.disabled = !done[selected - 1];
}

function showReader(html) {
  const r = el("reader") || el("readingBox");
  if (r) r.innerHTML = html;
}

function setTitle(t) {
  const v = el("viewTitle") || el("hTitle");
  if (v) v.textContent = t;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchAllVersesByHizb(hizbNumber) {
  // API paginated, max per_page 50  [oai_citation:2‡api-docs.quran.foundation](https://api-docs.quran.foundation/docs/content_apis_versioned/verses-by-hizb-number/)
  const perPage = 50;
  let page = 1;
  let all = [];
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/hizb/${hizbNumber}/quran-uthmani`;

    const data = await fetchJson(url);

    const verses = data.verses || [];
    all = all.concat(verses);

    const pagination = data.pagination || {};
    totalPages = pagination.total_pages || pagination.totalPages || totalPages;
    page++;
  }

  return all;
}

function renderVerses(verses) {
  if (!verses.length) {
    showReader(`<div class="empty">ما لقيناش آيات فهاد الحزب.</div>`);
    return;
  }

  // Group by chapter_id to show سورة header
  const byChapter = new Map();
  for (const v of verses) {
    const ch = v.chapter_id ?? v.chapterId ?? v.chapter;
    if (!byChapter.has(ch)) byChapter.set(ch, []);
    byChapter.get(ch).push(v);
  }

  // Keep chapter order as they appear
  const orderedChapters = [];
  for (const v of verses) {
    const ch = v.chapter_id ?? v.chapterId ?? v.chapter;
    if (!orderedChapters.includes(ch)) orderedChapters.push(ch);
  }

  let html = "";
  for (const ch of orderedChapters) {
    html += `<div class="suraHeader">سورة رقم ${ch}</div>`;
    const items = byChapter.get(ch) || [];
    for (const v of items) {
      const txt = v.text_uthmani || "";
      const ay = v.verse_number || v.verseNumber || "";
      html += `<div class="ayahLine"><span class="ayahText">${txt}</span> <span class="ayahNum">﴿${ay}﴾</span></div>`;
    }
  }

  showReader(html);
}

async function openHizb(hizbNumber) {
  selected = hizbNumber;
  renderGrid();
  renderStats();
  setButtons();

  setTitle(`حزب ${hizbNumber}`);
  showReader(`<div class="loading">تحميل نص الحزب...</div>`);
  setStatus("جلب الآيات من الإنترنت...");

  try {
    const verses = await fetchAllVersesByHizb(hizbNumber);
    renderVerses(verses);
    setStatus(`جاهز. قرأ حزب ${hizbNumber} ثم اضغط "تمّ".`);
  } catch (e) {
    showReader(`<div class="error">وقع مشكل فالجلب. جرّب ريفريش أو شبكة أخرى.<br><small>${String(e.message || e)}</small></div>`);
    setStatus("خطأ في الجلب");
  }
}

function markDone() {
  const btnDone = el("btnDone") || el("doneBtn");
  if (!selected) return;
  done[selected - 1] = true;
  saveProgress();
  renderGrid();
  renderStats();
  setButtons();
  if (btnDone) btnDone.disabled = true;
  setStatus(`تمّ تعليم حزب ${selected} كمقروء.`);
}

function undoDone() {
  if (!selected) return;
  done[selected - 1] = false;
  saveProgress();
  renderGrid();
  renderStats();
  setButtons();
  setStatus(`تمّ إلغاء تعليم حزب ${selected}.`);
}

function bindButtons() {
  const btnDone = el("btnDone") || el("doneBtn");
  const btnUndo = el("btnUndo") || el("undoBtn");
  if (btnDone) btnDone.onclick = markDone;
  if (btnUndo) btnUndo.onclick = undoDone;
}

window.addEventListener("load", () => {
  loadProgress();
  bindButtons();
  renderGrid();
  renderStats();
  setButtons();
  setStatus("اختر حزباً للقراءة.");
});
