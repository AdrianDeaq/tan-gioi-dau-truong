'use strict';
/* =====================================================================
 * Tân Giới Đấu Trường 3D — multiplayer server (Express + Socket.IO)
 *
 * Design: lightweight RELAY.
 *   - every client simulates its own player (combat code is the original game engine)
 *   - the server validates / rate-limits messages, batches positions into 15Hz snapshots,
 *     relays skill casts + grabs, and keeps the kill/death scoreboard.
 *   - rooms: open the game with ?room=name to play in a private room (default "main").
 * ===================================================================== */
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = parseInt(process.env.PORT || '3000', 10);
const MAX_PER_ROOM = Math.max(2, parseInt(process.env.MAX_PLAYERS || '16', 10));
const TICK_MS = 66;            // snapshot rate (~15 Hz)
const BOARD_MS = 1000;         // scoreboard broadcast throttle
const WORLD_LIMIT = 56;

const TRAIT_IDS = ['tan_pham', 'tan_giac', 'tan_pha', 'tan_vuong', 'tan_hoang', 'tan_than', 'tan_de'];
const KITS = ['melee', 'magic'];
const SKILLS = ['dash_q', 'melee_z', 'melee_x', 'melee_c', 'magic_z', 'magic_x', 'magic_c'];

/* ---------- helpers ---------- */
const num = (v, min, max, def = 0) => {
  v = Number(v);
  if (!Number.isFinite(v)) return def;
  return Math.min(max, Math.max(min, v));
};
const cleanName = n =>
  String(n == null ? '' : n).replace(/[<>&"'`\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
const cleanRoom = r =>
  String(r == null ? '' : r).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'main';
const cleanId = v => (typeof v === 'string' && v.length <= 40 ? v : null);

function cleanState(s, prev) {
  s = s || {};
  const p = prev || {};
  let x = num(s.x, -WORLD_LIMIT, WORLD_LIMIT, p.x || 0);
  let z = num(s.z, -WORLD_LIMIT, WORLD_LIMIT, p.z || 0);
  const d = Math.hypot(x, z);
  if (d > WORLD_LIMIT) { x *= WORLD_LIMIT / d; z *= WORLD_LIMIT / d; }
  return {
    x, z,
    f: num(s.f, -10, 10, p.f || 0),
    hp: Math.round(num(s.hp, 0, 1000, 1000)),
    tr: TRAIT_IDS.includes(s.tr) ? s.tr : (p.tr || 'tan_pham'),
    ks: Math.round(num(s.ks, 0, 999, 0)),
    kit: KITS.includes(s.kit) ? s.kit : 'melee',
    dead: s.dead ? 1 : 0,
    stn: num(s.stn, 0, 10, 0),
    bl: num(s.bl, 0, 10, 0),
    el: num(s.el, 0, 10, 0)
  };
}

/* ---------- http ---------- */
const app = express();
app.disable('x-powered-by');

app.get('/healthz', (req, res) => {
  let players = 0;
  rooms.forEach(r => { players += r.players.size; });
  res.json({ ok: true, rooms: rooms.size, players, uptime: Math.round(process.uptime()) });
});

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders(res, file) {
    if (/\.(html|js)$/i.test(file)) res.setHeader('Cache-Control', 'no-cache');
    else if (/\.png$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

const server = http.createServer(app);
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 20000,
  maxHttpBufferSize: 4096          // all messages are tiny; reject anything bigger
});

/* ---------- rooms ---------- */
const rooms = new Map();           // name -> { name, players: Map(id -> P), dirty: Set(id), boardDirty, lastBoard }

function getRoom(name) {
  let r = rooms.get(name);
  if (!r) {
    r = { name, players: new Map(), dirty: new Set(), boardDirty: false, lastBoard: 0 };
    rooms.set(name, r);
  }
  return r;
}

const publicPlayer = p => ({ id: p.id, name: p.name, s: p.s });
const boardOf = room =>
  Array.from(room.players.values()).map(p => ({ id: p.id, n: p.name, k: p.kills, d: p.deaths, t: p.s.tr }));

// simple token bucket: ~90 msgs/s burst 120 (positions 15/s + casts are far below this)
function allow(p) {
  const now = Date.now();
  p.tokens = Math.min(120, p.tokens + (now - p.tokensAt) * 0.09);
  p.tokensAt = now;
  if (p.tokens < 1) return false;
  p.tokens -= 1;
  return true;
}

io.on('connection', socket => {
  let P = null;                    // set after "join"

  socket.on('join', data => {
    if (P) return;
    data = data || {};
    const room = getRoom(cleanRoom(data.room));
    if (room.players.size >= MAX_PER_ROOM) {
      socket.emit('full', { room: room.name, max: MAX_PER_ROOM });
      if (room.players.size === 0) rooms.delete(room.name);
      return;
    }
    const name = cleanName(data.name) || ('Võ Sĩ ' + (100 + Math.floor(Math.random() * 900)));
    P = {
      id: socket.id, name, room: room.name,
      s: cleanState({ x: 0, z: 14, hp: 1000 }),
      kills: 0, deaths: 0, tokens: 120, tokensAt: Date.now(),
      lastCast: {}, lastGrab: 0, lastDied: 0
    };
    room.players.set(P.id, P);
    socket.join(room.name);

    socket.emit('welcome', {
      id: P.id, room: room.name, max: MAX_PER_ROOM,
      players: Array.from(room.players.values()).filter(o => o.id !== P.id).map(publicPlayer),
      board: boardOf(room)
    });
    socket.to(room.name).emit('joined', publicPlayer(P));
    room.boardDirty = true;
    console.log(`[+] ${name} -> #${room.name} (${room.players.size}/${MAX_PER_ROOM})`);
  });

  // client asks for the roster again (it saw a snapshot of someone it doesn't know)
  socket.on('who', () => {
    if (!P || !allow(P)) return;
    const room = rooms.get(P.room);
    if (!room) return;
    socket.emit('players', { players: Array.from(room.players.values()).filter(o => o.id !== P.id).map(publicPlayer) });
  });

  socket.on('p', cb => { if (typeof cb === 'function') cb(); });   // ping

  socket.on('st', s => {
    if (!P || !allow(P)) return;
    const room = rooms.get(P.room);
    if (!room) return;
    const prevTrait = P.s.tr;
    P.s = cleanState(s, P.s);
    if (P.s.tr !== prevTrait) room.boardDirty = true;
    room.dirty.add(P.id);
  });

  socket.on('cast', d => {
    if (!P || !allow(P) || !d || !SKILLS.includes(d.k)) return;
    const now = Date.now();
    if (now - (P.lastCast[d.k] || 0) < 250) return;          // anti-spam (real cooldowns are >= 1s)
    P.lastCast[d.k] = now;
    const out = {
      id: P.id, k: d.k,
      px: num(d.px, -WORLD_LIMIT, WORLD_LIMIT, P.s.x),
      pz: num(d.pz, -WORLD_LIMIT, WORLD_LIMIT, P.s.z),
      f: num(d.f, -10, 10, P.s.f),
      ax: num(d.ax, -WORLD_LIMIT, WORLD_LIMIT, 0),
      az: num(d.az, -WORLD_LIMIT, WORLD_LIMIT, 0),
      dx: num(d.dx, -1.5, 1.5, 0),
      dz: num(d.dz, -1.5, 1.5, 0),
      tg: cleanId(d.tg)
    };
    socket.to(P.room).emit('cast', out);
  });

  socket.on('grab', d => {
    if (!P || !allow(P) || !d) return;
    const now = Date.now();
    if (now - P.lastGrab < 400) return;
    const tg = cleanId(d.tg);
    const room = rooms.get(P.room);
    if (!tg || tg === P.id || !room || !room.players.has(tg)) return;
    P.lastGrab = now;
    socket.to(P.room).emit('grab', { id: P.id, tg });
  });

  // a victim reports its own death (+ who landed the last hit)
  socket.on('died', d => {
    if (!P || !allow(P)) return;
    const now = Date.now();
    if (now - P.lastDied < 1500) return;                       // respawn takes >= 2s
    P.lastDied = now;
    const room = rooms.get(P.room);
    if (!room) return;
    d = d || {};
    let killer = cleanId(d.k);
    if (killer === P.id || !room.players.has(killer)) killer = null;
    P.deaths += 1;
    if (killer) room.players.get(killer).kills += 1;
    room.boardDirty = true;
    socket.to(P.room).emit('died', { id: P.id, k: killer, sea: d.sea ? 1 : 0 });
  });

  socket.on('disconnect', () => {
    if (!P) return;
    const room = rooms.get(P.room);
    if (room) {
      room.players.delete(P.id);
      room.dirty.delete(P.id);
      io.to(room.name).emit('left', { id: P.id });
      room.boardDirty = true;
      console.log(`[-] ${P.name} <- #${room.name} (${room.players.size}/${MAX_PER_ROOM})`);
      if (room.players.size === 0) rooms.delete(room.name);
    }
    P = null;
  });
});

/* ---------- snapshot + scoreboard loop ---------- */
setInterval(() => {
  const now = Date.now();
  rooms.forEach(room => {
    if (room.dirty.size) {
      const snap = [];
      room.dirty.forEach(id => {
        const p = room.players.get(id);
        if (p) snap.push([id, p.s]);
      });
      room.dirty.clear();
      if (snap.length) io.to(room.name).volatile.emit('snap', snap);
    }
    if (room.boardDirty && now - room.lastBoard >= BOARD_MS) {
      room.boardDirty = false;
      room.lastBoard = now;
      io.to(room.name).emit('board', boardOf(room));
    }
  });
}, TICK_MS);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tân Giới Đấu Trường 3D multiplayer listening on :${PORT} (max ${MAX_PER_ROOM}/room)`);
});

function shutdown() {
  console.log('Shutting down…');
  io.close(() => server.close(() => process.exit(0)));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
