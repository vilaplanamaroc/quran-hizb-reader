const TOTAL = 60;
const KEY = "hizb_progress_v1";

let state = {
  done: Array(TOTAL).fill(false),
  selected: null
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.done) && s.done.length === TOTAL) state.done = s.done;
    }
  } catch {}
}

function save() {
  localStorage.setItem(KEY, JSON.stringify({ done: state.done }));
}

function countDone() {
  return state.done.filter(Boolean).length;
}

function renderStats() {
  const done = countDone();
  const left = TOTAL - done;
  const pct = Math.round((done / TOTAL) * 100);
  document.getElementById("stats").textContent =
    `مقروء: ${done} حزب • متبقي: ${left} • التقدم: ${pct}%`;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 1; i <= TOTAL; i++) {
    const btn = document.createElement("button");
    btn.className = "hizbBtn";
    if (state.done[i - 1]) btn.classList.add("done");
    if (state.selected === i) btn.classList.add("active");

    btn.innerHTML = `حزب ${i} ${state.done[i-1] ? `<span class="badge">✓</span>` : ""}`;
    btn.onclick = () => selectHizb(i);
    grid.appendChild(btn);
  }
}

function renderSelected() {
  const box = document.getElementById("selected");
  const btnDone = document.getElementById("btnDone");
  const btnUndo = document.getElementById("btnUndo");

  if (!state.selected) {
    box.innerHTML = "اختر حزباً من اللائحة";
    btnDone.disabled = true;
    btnUndo.disabled = true;
    return;
  }

  const i = state.selected;
  const isDone = state.done[i - 1];

  box.innerHTML = isDone
    ? `<div><strong>حزب ${i}</strong><div class="badge">معلّم كمقروء ✓</div></div>`
    : `<div><strong>حزب ${i}</strong><div class="badge">غير معلّم بعد</div></div>`;

  btnDone.disabled = isDone;   // ماشي ضروري تقدر تخليه يخدم دائماً، لكن هكا أوضح
  btnUndo.disabled = !isDone;
}

function selectHizb(i) {
  state.selected = i;
  renderAll();
}

function markDone() {
  if (!state.selected) return;
  state.done[state.selected - 1] = true;
  save();
  renderAll();
}

function undoDone() {
  if (!state.selected) return;
  state.done[state.selected - 1] = false;
  save();
  renderAll();
}

function resetAll() {
  const ok = confirm("واش متأكد بغيتي تصفّر جميع الأحزاب؟");
  if (!ok) return;
  state.done = Array(TOTAL).fill(false);
  state.selected = null;
  save();
  renderAll();
}

function renderAll() {
  renderStats();
  renderGrid();
  renderSelected();
}

function init() {
  load();

  document.getElementById("btnDone").onclick = markDone;
  document.getElementById("btnUndo").onclick = undoDone;
  document.getElementById("btnReset").onclick = resetAll;

  renderAll();
}

window.addEventListener("load", init);
