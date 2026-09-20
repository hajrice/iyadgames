// Iyad Games — tiny zero-dependency server.
// Serves ./public and a small JSON API backed by files in ./data.
//   node server.js            → http://localhost:3000
//   PORT=8080 node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const DATA = process.env.DATA_DIR || path.join(__dirname, "data");   // on Fly this is the mounted volume
const RESULTS = path.join(DATA, "results.json");
const PLAYERS = path.join(DATA, "players.json");
const MAX_PLAYERS = 15;

fs.mkdirSync(DATA, { recursive: true });
const readJSON = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json" };
const send = (res, status, body, type = "application/json") => { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(type.startsWith("application/json") ? JSON.stringify(body) : body); };
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = ""; req.on("data", (c) => { raw += c; if (raw.length > 20000) { reject(new Error("too big")); req.destroy(); } });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("bad json")); } });
});
const cleanName = (s) => String(s || "").replace(/[^\p{L}\p{N} '\-]/gu, "").trim().slice(0, 20);
const key = (name) => cleanName(name).toLowerCase();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    // ---- API ----
    if (url.pathname === "/api/players" && req.method === "GET") {
      return send(res, 200, Object.values(readJSON(PLAYERS, {})));
    }
    if (url.pathname === "/api/players" && req.method === "POST") {
      const b = await readBody(req);
      const name = cleanName(b.name); if (!name) return send(res, 400, { error: "name required" });
      const players = readJSON(PLAYERS, {});
      const k = key(name);
      if (!players[k] && Object.keys(players).length >= MAX_PLAYERS) return send(res, 409, { error: `Class is full (${MAX_PLAYERS} players). Ask your teacher.` });
      players[k] = { name, avatar: Number(b.avatar) || 0, crest: String(b.crest || "").slice(0, 30),
                     season: b.season && typeof b.season === "object" ? b.season : (players[k]?.season ?? null),
                     badges: Array.isArray(b.badges) ? b.badges.map(String).slice(0, 50) : (players[k]?.badges ?? []),
                     best: Math.max(0, Number(b.best) || 0), total: Math.max(0, Number(b.total) || 0), updated: Date.now() };
      writeJSON(PLAYERS, players);
      return send(res, 200, players[k]);
    }
    if (url.pathname === "/api/results" && req.method === "GET") {
      const days = Math.min(60, Number(url.searchParams.get("days")) || 8);
      const cutoff = Date.now() - days * 86400000;
      return send(res, 200, readJSON(RESULTS, []).filter((r) => r.ts >= cutoff));
    }
    if (url.pathname === "/api/results" && req.method === "POST") {
      const b = await readBody(req);
      const name = cleanName(b.name); if (!name) return send(res, 400, { error: "name required" });
      const r = { name, avatar: Number(b.avatar) || 0, crest: String(b.crest || "").slice(0, 30),
                  points: Math.max(0, Math.min(1000, Number(b.points) || 0)), correct: Number(b.correct) || 0, wrong: Number(b.wrong) || 0,
                  outcome: ["win", "draw", "loss"].includes(b.outcome) ? b.outcome : "loss", ts: Date.now() };
      const results = readJSON(RESULTS, []); results.push(r);
      writeJSON(RESULTS, results.slice(-5000));
      return send(res, 200, r);
    }
    if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "not found" });

    // ---- Static ----
    let file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
    if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden", "text/plain");
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`Iyad Games running on http://localhost:${PORT} (data in ${DATA})`));
