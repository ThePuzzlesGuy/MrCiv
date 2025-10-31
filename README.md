# Minecraft Faction Roster — Global Persistence (Netlify Blobs)

- Shared, persisted assignments using **Netlify Functions** + **Netlify Blobs**.
- Heads via Minotar `helm/<username>/100.png`.
- API:
  - `GET /.netlify/functions/assignments` → map
  - `POST` with `{ "name": "Player", "faction": "The Peak" }`
  - `POST` with `{ "bulk": { ... } }` to replace

Deploy: connect repo to Netlify. Functions require Node 18+. Netlify will install dependencies from `package.json`.
