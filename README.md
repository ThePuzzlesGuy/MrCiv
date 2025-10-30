# Minecraft Faction Roster (Static) — With Heads

- Each player shows their **Minecraft head** via Minotar (`/helm/<username>/<size>.png`).
- Hover a name to see `Faction: <name>`.
- Click a name to change the faction (saved to **localStorage**).
- Export/Import `assignments.json` to share global defaults by committing to the repo.

## Deploy on Netlify (GitHub)

1. Push this folder to a new GitHub repo.
2. In Netlify, **New site from Git**, pick your repo.
3. Build command: _none_ ; Publish directory: `/` (root).

## Files
- `index.html` — UI
- `style.css` — styles
- `script.js` — logic + Minotar heads
- `assignments.json` — default mapping (empty by default)
