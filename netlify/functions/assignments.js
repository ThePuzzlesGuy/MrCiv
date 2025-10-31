import { getStore } from "@netlify/blobs";

const STORE = "faction-roster";
const KEY = "assignments.json";

export default async (req, context) => {
  const store = getStore(STORE);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method === "GET") {
    const raw = await store.get(KEY, { consistency: "strong" });
    const json = raw ? JSON.parse(raw) : {};
    return respond(json);
  }

  if (req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}

    let current = {};
    const raw = await store.get(KEY, { consistency: "strong" });
    if (raw) current = JSON.parse(raw);

    if (body && body.bulk && typeof body.bulk === "object") {
      await store.set(KEY, JSON.stringify(body.bulk));
      return respond({ ok: true, replaced: true });
    }

    const name    = body?.name;
    const faction = (body?.faction ?? "").toString();
    const gender  = (body?.gender  ?? "").toString();   // "", "boy", "girl"
    const leader  = !!body?.leader;                     // boolean

    if (!name || typeof name !== "string") {
      return respond({ error: "Missing 'name' string" }, 400);
    }

    // Back-compat normalize
    const rec = typeof current[name] === "string"
      ? { faction: current[name], gender: "", leader: false }
      : (current[name] || { faction: "", gender: "", leader: false });

    rec.faction = (faction && faction !== "None / Unassigned") ? faction : "";
    if (gender === "boy" || gender === "girl" || gender === "") rec.gender = gender;
    rec.leader = !!leader;

    if (!rec.faction && !rec.gender && !rec.leader) delete current[name];
    else current[name] = rec;

    await store.set(KEY, JSON.stringify(current));
    return respond({ ok: true });
  }

  return respond({ error: "Method not allowed" }, 405);
};

function respond(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
