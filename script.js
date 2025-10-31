// Allegiances support (multi-select), with hover tooltip combining main faction + allegiances.
// Does NOT overwrite unrelated fields; preserves existing data on the server.

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

function headURL(name, size=100) { return `https://minotar.net/helm/${encodeURIComponent(name)}/${size}.png`; }

let state = { assignments: {}, cards: new Map(), current: null };

if (typeof window.NAMES === "undefined") { window.NAMES = []; }

function populateFactionControls() {
  const opts = ['<option value="">All factions</option>']
    .concat(FACTIONS.map(f => `<option value="${f}">${f}</option>`));
  if (factionFilter) factionFilter.innerHTML = opts.join("");
  if (modalFaction) modalFaction.innerHTML = FACTIONS.map(f => `<option value="${f}">${f}</option>`).join("");
  if (modalAllegiances) modalAllegiances.innerHTML = FACTIONS
    .filter(f => f !== "None / Unassigned")
    .map(f => `<option value="${f}">${f}</option>`).join("");
}

function factionOf(n) { const r = state.assignments[n]; return !r ? "" : (typeof r === "string" ? r : (r.faction || "")); }
function genderOf(n)  { const r = state.assignments[n]; return (!r || typeof r === "string") ? "" : (r.gender || ""); }
function leaderOf(n)  { const r = state.assignments[n]; return (!r || typeof r === "string") ? false : !!r.leader; }
function allegsOf(n)  { const r = state.assignments[n]; return (!r || typeof r === "string") ? [] : (Array.isArray(r.allegiances) ? r.allegiances : []); }

function setCardGenderClass(card, gender){ card.classList.remove("boy","girl"); if(gender==="boy")card.classList.add("boy"); if(gender==="girl")card.classList.add("girl"); }
function setCardLeaderClass(card, isLeader){ card.classList.toggle("leader", !!isLeader); }

function updateTitleTooltip(node, name) {
  const faction = factionOf(name) || "None / Unassigned";
  const allegs = allegsOf(name);
  const extra = allegs.length ? ` | Allegiances: ${allegs.join(", ")}` : "";
  node.title = `Faction: ${faction}${extra}`;
}

function makeCard(name) {
  const node = template.content.firstElementChild.cloneNode(true);
  const nameEl = node.querySelector(".name");
  const tagEl = node.querySelector(".faction-tag");
  const img = node.querySelector(".head");
  const btn = node.querySelector(".head-btn");

  nameEl.textContent = name;
  img.src = headURL(name, 100);
  img.alt = name + " head";

  const faction = factionOf(name) || "None / Unassigned";
  tagEl.textContent = faction + (allegsOf(name).length ? "  🤝" : "");
  updateTitleTooltip(node, name);

  setCardGenderClass(node, genderOf(name));
  setCardLeaderClass(node, leaderOf(name));

  btn.addEventListener("click", () => openModal(name));

  state.cards.set(name, node);
  return node;
}

function renderAll() {
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  const q = (search?.value || "").trim().toLowerCase();
  const f = factionFilter?.value || "";
  const leadersOnlyChecked = leadersOnly?.checked;

  (window.NAMES || []).forEach((name) => {
    const faction = factionOf(name) || "None / Unassigned";
    const isLeader = leaderOf(name);

    if (q && !name.toLowerCase().includes(q)) return;
    if (f && faction !== f) return;
    if (leadersOnlyChecked && !isLeader) return;

    const card = state.cards.get(name) || makeCard(name);
    card.querySelector(".faction-tag").textContent = faction + (allegsOf(name).length ? "  🤝" : "");
    updateTitleTooltip(card, name);
    setCardGenderClass(card, genderOf(name));
    setCardLeaderClass(card, isLeader);
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function openModal(name) {
  state.current = name;
  modalTitle.textContent = "Edit — " + name;

  const g = genderOf(name);
  modalForm.querySelectorAll('input[name="gender"]').forEach(r => (r.checked = (r.value === g)));
  if (!modalForm.querySelector('input[name="gender"]:checked')) modalForm.querySelector('#g-none').checked = true;

  const faction = factionOf(name) || "None / Unassigned";
  modalFaction.value = faction;

  const leader = leaderOf(name);
  modalForm.querySelector('#leader-yes').checked = !!leader;
  modalForm.querySelector('#leader-no').checked  = !leader;

  const allegs = new Set(allegsOf(name));
  ;[...modalAllegiances.options].forEach(opt => opt.selected = allegs.has(opt.value));

  modal.showModal();
}

function selectedAllegiances() { return [...modalAllegiances.options].filter(o => o.selected).map(o => o.value); }

async function saveModal() {
  const name = state.current; if (!name) return;
  const gender = modalForm.querySelector('input[name="gender"]:checked')?.value || "";
  const faction = (modalFaction.value === "None / Unassigned") ? "" : modalFaction.value;
  const leader = modalForm.querySelector('#leader-yes')?.checked === true;
  const allegiances = selectedAllegiances().filter(a => a && a !== "None / Unassigned");

  // optimistic merge (preserve other fields)
  const prev = state.assignments[name] || {};
  state.assignments[name] = {
    faction: (faction ?? prev.faction ?? ""),
    gender:  (gender  ?? prev.gender  ?? ""),
    leader:  (typeof leader === "boolean" ? leader : !!prev.leader),
    allegiances: Array.isArray(allegiances) ? allegiances : (prev.allegiances || []),
  };
  renderAll();

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, faction, gender, leader, allegiances })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e) {
    alert("Failed to save. Reloading...");
    location.reload();
  }
}

modal.addEventListener("close", () => { state.current = null; });
document.getElementById("saveBtn").addEventListener("click", async (e) => { e.preventDefault(); await saveModal(); modal.close(); });
search?.addEventListener("input", renderAll);
factionFilter?.addEventListener("change", renderAll);
leadersOnly?.addEventListener("change", renderAll);

async function loadAll() {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load assignments");
  const map = await res.json();

  const normalized = {};
  for (const name of (window.NAMES || [])) {
    const v = map[name];
    if (!v) continue;
    if (typeof v === "string") normalized[name] = { faction: v, gender: "", leader: false, allegiances: [] };
    else normalized[name] = {
      faction: v.faction || "",
      gender:  v.gender  || "",
      leader:  !!v.leader,
      allegiances: Array.isArray(v.allegiances) ? v.allegiances : []
    };
  }
  return normalized;
}

function init() { populateFactionControls(); loadAll().then(d => { state.assignments = d; renderAll(); }).catch(() => renderAll()); }
init();
