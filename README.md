# Tân Giới Đấu Trường 3D — Multiplayer

```
convert.js            original .html  ->  public/index.html + public/traits/*.png   (optional, already done)
package.json
server.js             Express + Socket.IO relay (rooms, snapshots, scoreboard)
render.yaml           optional Render blueprint
public/
  index.html          same HUD / modals as your game + name screen + scoreboard
  game-mp.js          your full engine (map, 7 Trait auras, all VFX/SFX) + netcode
  traits/*.png        the 7 trait images (extracted from your html)
```

## Run locally
```
npm install
npm start            # http://localhost:3000   (open it in 2 tabs to test)
```
Private room with friends: `https://YOUR-APP.onrender.com/?room=myroom`

## Deploy on Render
1. Push this folder to a GitHub repo.
2. Render -> New -> Web Service -> pick the repo.
3. Runtime `Node` · Build Command `npm install` · Start Command `npm start` · Health Check Path `/healthz`
   (or use "New -> Blueprint" and Render reads render.yaml).
4. Open the `.onrender.com` URL. Done.

Notes
- Free plan sleeps after ~15 min idle; first visit then takes ~30s. Ping `/healthz` (e.g. UptimeRobot) to keep it awake.
- One instance only (rooms live in memory). Don't scale to >1 instance without a Socket.IO adapter.
- `MAX_PLAYERS` env var = players per room (default 16).
- If you edit the original html later: `node convert.js path/to/your.html` regenerates index.html + PNGs.
