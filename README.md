# Mr. Beast Civilization Roster — F.U.N. Edition (Global)

- Header updated per request.
- **Search** bar filters by player name.
- **Faction filter** dropdown lists all known factions and filters members.
- Clicking a player's **head opens a modal** to set **Boy/Girl** + **Faction**.
  - Boy = blue border; Girl = pink border.
- Global persistence via Netlify Functions + Blobs.
- Schema: `{{ [name]: {{ faction: string, gender: "boy"|"girl"|"" }} }}`
- Backward compatible with earlier `{ name: "Faction" }` values.

## Deploy
1. Push to GitHub, connect to Netlify.
2. No build command, publish dir `/`. Node 18+ for Functions.
