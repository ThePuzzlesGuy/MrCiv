# Minecraft Faction Roster (Static)

A zero-backend site that lists **only** your provided Minecraft usernames. Hover a name to see:
```
Faction: <name>
```
Click a name to change its faction. Edits are saved to the visitor's **browser** (localStorage).

> **Global edits?** Since this is a static site (no server), changes are not auto-shared. To make global updates:
> 1) Click **Export Assignments** to download `assignments.json`.
> 2) Commit that file to the repo (overwrite the existing `assignments.json`).
> 3) Netlify will redeploy and everyone will see the updated assignments as defaults.

## Deploy on Netlify (GitHub)

1. Push this folder to a new GitHub repo.
2. In Netlify, **New site from Git**, pick your repo.
3. Build command: _none_ ; Publish directory: `/` (root).
4. Deploy.

## Files
- `index.html` — UI
- `style.css` — styles
- `script.js` — logic, includes the full name list + faction options
- `assignments.json` — default mapping (empty by default). You can export and commit a new one later.

## Editing Faction Options
Open `script.js` and edit the `FACTIONS` array. The current defaults are taken from your event list.

## Accessibility & UX
- Fully keyboard accessible (Enter to open editor, Tab/Shift+Tab to move, Escape by clicking Cancel).
- Clear hover and focus states.
- Lightweight: pure HTML/CSS/JS. No frameworks.
