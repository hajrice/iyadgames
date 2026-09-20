# Iyad Games — Match Day Maths

Football-themed maths game for a classroom. Kids sign in with a name, pick a face and a crest,
then play 60-second maths matches to climb the league. Points go on a shared leaderboard
(winner today / winner this week) that everyone sees on the front page.

## Run it

```bash
npm start
```

Open http://localhost:3000. No dependencies — just Node 18+.

Scores and player profiles are saved as JSON in `data/` (created automatically).
Back that folder up if you care about the leaderboard history.

## Deploying to Fly.io (iyad.world)

Deploys happen from GitHub, not from a laptop: every push to `main` runs
`.github/workflows/fly-deploy.yml`, which builds the Dockerfile on Fly's builders and
releases it. You can also trigger it by hand from the repo's **Actions** tab.

One-time setup:

1. In the Fly dashboard create an app named **`iyad-world`** (any region — `fly.toml`
   pins machines to `fra`). Don't use "Launch from GitHub"; a plain empty app is enough.
2. Fly dashboard → **Tokens** → create a **Deploy token** for `iyad-world`.
3. GitHub repo → **Settings → Secrets and variables → Actions** → new secret
   `FLY_API_TOKEN` with that token.
4. Push to `main` (or run the workflow manually). The first run also creates the 1 GB
   `data` volume that holds scores.

Domain:

- Fly dashboard → app → **Certificates** → add `iyad.world` and `www.iyad.world`.
- At your registrar add DNS: `A` records for `@` and `www` → the app's IPv4, `AAAA` → its IPv6
  (both shown on the certificate page). HTTPS is issued automatically once DNS resolves.

Scores live on the `data` volume at `/data`, so they survive deploys and restarts.
To back them up (needs flyctl locally): `fly ssh console -a iyad-world -C "cat /data/results.json" > backup.json`.

## Limits

- Max 15 players (change `MAX_PLAYERS` in `server.js`).
- If the API is unreachable (e.g. opening `public/index.html` straight from disk), the game
  still works but keeps scores only in that browser and shows an "offline" badge.

## Sound effects

All sounds are synthesised in the browser (no files needed). To use real recordings instead,
drop MP3s into `public/sounds/` and list their names in `public/sounds/manifest.json`, e.g.

```json
["goal", "win", "cheer1", "cheer2"]
```

Names: `goal`, `miss`, `whistle`, `hatTrick`, `onFire`, `badge`, `champion`, `golden`, `goldenGoal`,
`win`, `hello`, `tick`, `flip`, and `cheer1`…`cheer6` (random cheers when a league-table row is tapped).
Any name not in the manifest keeps its synthesised version. Keep files short (under 3 s) and CC0/licensed.
