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
    const faction = (body?.faction ?? undefined);
    const gender  = (body?.gender  ?? undefined);
    const leader  = (typeof body?.leader === "boolean") ? !!body.leader : undefined;
    const allegiances = Array.isArray(body?.allegiances) ? body.allegiances.filter(x => typeof x === "string") : undefined;
    const blueOrder = (typeof body?.blueOrder === "boolean") ? !!body.blueOrder : undefined;

    if (!name || typeof name !== "string") {
      return respond({ error: "Missing 'name' string" }, 400);
    }

    // Back-compat normalize
    const rec = typeof current[name] === "string"
      ? { faction: current[name], gender: "", leader: false, allegiances: [], blueOrder: false }
      : (current[name] || { faction: "", gender: "", leader: false, allegiances: [], blueOrder: false });

    // Merge only provided fields to avoid overwriting unrelated info
    if (faction !== undefined) {
      const f = (faction ?? "").toString();
      rec.faction = (f && f !== "None / Unassigned") ? f : (f === "" ? "" : (rec.faction || ""));
    }
    if (gender !== undefined && (gender === "boy" || gender === "girl" || gender === "")) rec.gender = gender;
    if (leader !== undefined) rec.leader = !!leader;
    if (allegiances !== undefined) rec.allegiances = allegiances;
    if (blueOrder !== undefined) rec.blueOrder = !!blueOrder;

    const empty = !(rec.faction) && !(rec.gender) && !rec.leader && (!rec.allegiances || rec.allegiances.length === 0) && !rec.blueOrder;
    if (empty) delete current[name];
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
