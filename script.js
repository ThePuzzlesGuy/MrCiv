
// v7 counters patch
const NAMES = [
  "Steve",
  "Alex"
];
const FACTIONS = [
  "The Peak",
  "HD Clan",
  "Greeko Boys",
  "Men in Suits",
  "The Veterans",
  "Goober Bay",
  "The Pharaonate",
  "Ironcrest Clan",
  "Boys Next Door",
  "F.U.N. Fellas",
  "The Archivists' Library",
  "The Blue Order",
  "Domnul University",
  "DUDE CITY",
  "The Egalitarian Order",
  "Brociples",
  "None / Unassigned"
];
const API = "/.netlify/functions/assignments";

const grid = document.getElementById("grid");
const template = document.getElementById("cardTemplate");
const search = document.getElementById("search");
const factionFilter = document.getElementById("factionFilter");
const leadersOnly = document.getElementById("leadersOnly");
const modal = document.getElementById("editorModal");
const modalTitle = document.getElementById("modalTitle");
const modalFaction = document.getElementById("modalFaction");
const modalAllegiances = document.getElementById("modalAllegiances");
const modalForm = document.getElementById("modalForm");

// counters
const countBoysEl = document.getElementById("count-boys");
const countGirlsEl = document.getElementById("count-girls");
const aliveBoysEl = document.getElementById("alive-boys");
const aliveGirlsEl = document.getElementById("alive-girls");

function headURL(name, size=100) { return `https://minotar.net/helm/${encodeURIComponent(name)}/${size}.png`; }

let state = { assignments: {}, cards: new Map(), current: null };

function populateFactionControls() {
  const opts = ['<option value="">All factions</option>'].concat(FACTIONS.map(f => `<option value="${f}">${f}</option>`));
  factionFilter.innerHTML = opts.join("");
  if (modalFaction) modalFaction.innerHTML = FACTIONS.map(f => `<option value="${f}">${f}</option>`).join("");
  if (modalAllegiances) modalAllegiances.innerHTML = FACTIONS.filter(f => f !== "None / Unassigned").map(f => `<option value="${f}">${f}</option>`).join("");
}

function recOf(n) { return state.assignments[n]; }
function factionOf(n) { const r = recOf(n); return !r ? "" : (typeof r === "string" ? r : (r.faction || "")); }
function genderOf(n)  { const r = recOf(n); return (!r || typeof r === "string") ? "" : (r.gender || ""); }
function leaderOf(n)  { const r = recOf(n); return (!r || typeof r === "string") ? false : !!r.leader; }
function deputyOf(n)  { const r = recOf(n); return (!r || typeof r === "string") ? false : !!r.deputy; }
function statusOf(n)  { const r = recOf(n); return (!r || typeof r === "string") ? "alive" : (r.status || "alive"); }
function allegsOf(n)  { const r = recOf(n); return (!r || typeof r === "string") ? [] : (Array.isArray(r.allegiances) ? r.allegiances : []); }
function blueOrderOf(n){ const r = recOf(n); return (!r || typeof r === "string") ? false : !!r.blueOrder; }

function setCardGenderClass(card, gender){ card.classList.remove("boy","girl"); if(gender==="boy")card.classList.add("boy"); if(gender==="girl")card.classList.add("girl"); }
function setCardLeaderClass(card, isLeader){ card.classList.toggle("leader", !!isLeader); }
function setCardDeputyClass(card, isDeputy){ card.classList.toggle("deputy", !!isDeputy); }
function setCardStatusClass(card, status){ card.classList.toggle("dead", status === "dead"); }

function updateTitleTooltip(node, name) {
  const faction = factionOf(name) || "None / Unassigned";
  const allegs = allegsOf(name);
  const extra = allegs.length ? ` | Allegiances: ${allegs.join(", ")}` : "";
  const isLeader = leaderOf(name) || deputyOf(name) ? " | Leader: Yes" : "";
  const status = statusOf(name);
  node.title = `Faction: ${faction}${extra} | Status: ${status}${isLeader}`;
}

function makeCard(name) {
  const node = template.content.firstElementChild.cloneNode(true);
  const nameEl = node.querySelector(".name");
  const tagEl = node.querySelector(".faction-tag");
  const img = node.querySelector(".head");
  const btn = node.querySelector(".head-btn");
  const badge = node.querySelector(".badge-blueorder");

  nameEl.textContent = name;
  img.src = headURL(name, 100);
  img.alt = name + " head";
  if (badge) badge.src = "assets/blueorder.png";

  const faction = factionOf(name) || "None / Unassigned";
  tagEl.textContent = faction + (allegsOf(name).length ? "  🤝" : "");
  updateTitleTooltip(node, name);

  setCardGenderClass(node, genderOf(name));
  setCardLeaderClass(node, leaderOf(name));
  setCardDeputyClass(node, deputyOf(name));
  setCardStatusClass(node, statusOf(name));
  node.classList.toggle("has-blueorder", blueOrderOf(name));

  btn.addEventListener("click", () => openModal(name));

  state.cards.set(name, node);
  return node;
}

function renderAll() {
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  const q = (search.value || "").trim().toLowerCase();
  const f = factionFilter.value || "";
  const leadersOnlyChecked = leadersOnly.checked;

  NAMES.forEach((name) => {
    const faction = factionOf(name) || "None / Unassigned";
    const isLeaderish = leaderOf(name) || deputyOf(name);

    if (q && !name.toLowerCase().includes(q)) return;
    if (f && faction !== f) return;
    if (leadersOnlyChecked && !isLeaderish) return;

    const card = state.cards.get(name) || makeCard(name);
    card.querySelector(".faction-tag").textContent = faction + (allegsOf(name).length ? "  🤝" : "");
    updateTitleTooltip(card, name);
    setCardGenderClass(card, genderOf(name));
    setCardLeaderClass(card, leaderOf(name));
    setCardDeputyClass(card, deputyOf(name));
    setCardStatusClass(card, statusOf(name));
    card.classList.toggle("has-blueorder", blueOrderOf(name));
    frag.appendChild(card);
  });

  grid.appendChild(frag);
  updateCounters(); // refresh header counts
}

function openModal(name) {
  state.current = name;
  modalTitle.textContent = "Edit — " + name;

  const g = genderOf(name);
  modalForm.querySelectorAll('input[name="gender"]').forEach(r => (r.checked = (r.value === g)));
  if (!modalForm.querySelector('input[name="gender"]:checked')) modalForm.querySelector('#g-none').checked = true;

  const st = statusOf(name);
  modalForm.querySelector('#s-alive').checked = (st !== "dead");
  modalForm.querySelector('#s-dead').checked  = (st === "dead");

  const faction = factionOf(name) || "None / Unassigned";
  modalFaction.value = faction;

  const leader = leaderOf(name);
  const deputy = deputyOf(name);
  modalForm.querySelector('#leader-yes').checked = !!leader;
  modalForm.querySelector('#leader-no').checked  = !leader;
  modalForm.querySelector('#deputy-yes').checked = !!deputy;
  modalForm.querySelector('#deputy-no').checked  = !deputy;

  const allegs = new Set(allegsOf(name));
  [...modalAllegiances.options].forEach(opt => opt.selected = allegs.has(opt.value));

  const bo = blueOrderOf(name);
  modalForm.querySelector('#blueorder-yes').checked = !!bo;
  modalForm.querySelector('#blueorder-no').checked  = !bo;

  modal.showModal();
}

function selectedAllegiances() { return [...modalAllegiances.options].filter(o => o.selected).map(o => o.value); }

async function saveModal() {
  const name = state.current; if (!name) return;
  const gender = modalForm.querySelector('input[name="gender"]:checked')?.value || "";
  const status = modalForm.querySelector('input[name="status"]:checked')?.value || (modalForm.querySelector('#s-dead').checked ? "dead" : "alive");
  const faction = (modalFaction.value === "None / Unassigned") ? "" : modalFaction.value;
  const leader = modalForm.querySelector('#leader-yes')?.checked === true;
  const deputy = modalForm.querySelector('#deputy-yes')?.checked === true;
  const allegiances = selectedAllegiances().filter(a => a && a !== "None / Unassigned");
  const blueOrder = modalForm.querySelector('#blueorder-yes')?.checked === true;

  const prev = state.assignments[name] || {};
  state.assignments[name] = {
    faction: (faction ?? prev.faction ?? ""),
    gender:  (gender  ?? prev.gender  ?? ""),
    leader:  (typeof leader === "boolean" ? leader : !!prev.leader),
    deputy:  (typeof deputy === "boolean" ? deputy : !!prev.deputy),
    status:  (status === "dead" ? "dead" : "alive"),
    allegiances: Array.isArray(allegiances) ? allegiances : (prev.allegiances || []),
    blueOrder: (typeof blueOrder === "boolean" ? blueOrder : !!prev.blueOrder),
  };
  renderAll();

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, faction, gender, leader, deputy, status, allegiances, blueOrder })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e) {
    alert("Failed to save. Reloading...");
    location.reload();
  }
}

modal.addEventListener("close", () => { state.current = null; });
document.getElementById("saveBtn").addEventListener("click", async (e) => { e.preventDefault(); await saveModal(); modal.close(); });
search.addEventListener("input", renderAll);
factionFilter.addEventListener("change", renderAll);
leadersOnly.addEventListener("change", renderAll);

function updateCounters() {
  let boys = 0, girls = 0, aliveBoys = 0, aliveGirls = 0;
  for (const name of NAMES) {
    const g = genderOf(name);
    const alive = statusOf(name) !== "dead";
    if (g === "boy") { boys++; if (alive) aliveBoys++; }
    else if (g === "girl") { girls++; if (alive) aliveGirls++; }
  }
  if (countBoysEl) countBoysEl.textContent = boys;
  if (countGirlsEl) countGirlsEl.textContent = girls;
  if (aliveBoysEl) aliveBoysEl.textContent = aliveBoys;
  if (aliveGirlsEl) aliveGirlsEl.textContent = aliveGirls;
}

async function loadAll() {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load assignments");
  const map = await res.json();

  const normalized = {};
  for (const name of NAMES) {
    const v = map[name];
    if (!v) continue;
    if (typeof v === "string") normalized[name] = { faction: v, gender: "", leader: false, deputy: false, status: "alive", allegiances: [], blueOrder: false };
    else normalized[name] = {
      faction: v.faction || "",
      gender:  v.gender  || "",
      leader:  !!v.leader,
      deputy:  !!v.deputy,
      status:  (v.status === "dead" ? "dead" : "alive"),
      allegiances: Array.isArray(v.allegiances) ? v.allegiances : [],
      blueOrder: !!v.blueOrder
    };
  }
  return normalized;
}

function init() { populateFactionControls(); loadAll().then(d => { state.assignments = d; renderAll(); }).catch(() => renderAll()); }
init();
