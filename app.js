// Quran Hizb Reader (60) + Mark Done
// Data source: Qurani.ai Hizb endpoint (works in browser)
// Example: https://api.qurani.ai/gw/qh/v1/hizb/1/quran-uthmani?limit=2000&offset=0

const TOTAL = 60;
const PROGRESS_KEY = "hizb_done_v3";
const API_BASE = "https://api.qurani.ai/gw/qh/v1";

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
  const grid = el("hizbGrid") || el("grid"); // supports both layouts
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

function setTitle(t) {
  const v = el("viewTitle") || el("hTitle");
  if (v) v.textContent = t;
}

function showReader(html) {
  const r = el("reader") || el("readingBox");
  if (r) r.innerHTML = html;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchHizbAyahs(hizbNumber) {
  const url = `${API_BASE}/hizb/${hizbNumber}/quran-uthmani?limit=2000&offset=0`;
  const json = await fetchJson(url);

  // Shape confirmed by you:
  // { code:200, status:"OK", data:{ number:1, ayahs:[...] } }
  const ayahs = json?.data?.ayahs || [];
  return ayahs;
}

function renderAyahs(ayahs) {
  if (!ayahs.length) {
    showReader(`<div class="empty">ما لقيناش آيات فهاد الحزب.</div>`);
    return;
  }

  let html = "";
  let currentSurah = null;

  for (const a of ayahs) {
    const sNum = a?.surah?.number;
    const sName = a?.surah?.name || (sNum ? `سورة ${sNum}` : "سورة");

    if (currentSurah !== sNum) {
      currentSurah = sNum;
      html += `<div class="suraHeader">${sName}${sNum ? ` (${sNum})` : ""}</div>`;
    }

    const text = a.text || "";
    const numInSurah = a.numberInSurah ?? "";

    html += `<div class="ayahLine">
      <span class="ayahText">${text}</span>
      <span class="ayahNum">﴿${numInSurah}﴾</span>
    </div>`;
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
    const ayahs = await fetchHizbAyahs(hizbNumber);
    renderAyahs(ayahs);
    setStatus(`جاهز. قرأ حزب ${hizbNumber} ثم اضغط "تمّ".`);
  } catch (e) {
    showReader(
      `<div class="error">وقع مشكل فالجلب. جرّب ريفريش أو شبكة أخرى.<br><small>${String(
        e.message || e
      )}</small></div>`
    );
    setStatus("خطأ في الجلب");
  }
}

function markDone() {
  if (!selected) return;
  done[selected - 1] = true;
  saveProgress();
  renderGrid();
  renderStats();
  setButtons();
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
