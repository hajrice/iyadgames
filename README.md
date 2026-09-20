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

One-time setup (the app name `iyad-world` and region `fra` are in `fly.toml`):

```bash
brew install flyctl
fly auth login
fly apps create iyad-world
fly volumes create data --region fra --size 1
fly deploy
```

Then point the domain at it:

```bash
fly certs add iyad.world
fly certs add www.iyad.world
fly ips list
```

Add DNS records at your registrar: an `A` record for `@` and `www` → the IPv4 from `fly ips list`,
and an `AAAA` record → the IPv6. Fly issues the HTTPS certificate automatically once DNS resolves
(`fly certs check iyad.world`).

Every later release is just:

```bash
fly deploy
```

Scores live on the `data` volume at `/data`, so they survive deploys and restarts.
To back them up: `fly ssh console -C "cat /data/results.json" > backup.json`.

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
