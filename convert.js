#!/usr/bin/env node
'use strict';
/* =====================================================================
 * convert.js — turns the single-file game into the multiplayer web layout
 *
 *   tan_gioi_dau_truong_3d_v4.html  ──►  public/index.html          (same HUD / modals, no inline engine)
 *                                        public/traits/<trait>.png   (the 7 embedded PNGs, extracted)
 *
 * public/game-mp.js (the multiplayer engine) is NOT generated here: it ships ready-made.
 *
 * Usage:   node convert.js [path/to/tan_gioi_dau_truong_3d_v4.html]
 * ===================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const TRAITS_DIR = path.join(PUBLIC, 'traits');
const DEFAULT_SRC = 'tan_gioi_dau_truong_3d_v4.html';

function findSource() {
  const arg = process.argv[2];
  const candidates = [arg, path.join(process.cwd(), DEFAULT_SRC), path.join(ROOT, DEFAULT_SRC)].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return path.resolve(c);
  return null;
}

/* ---------- multiplayer UI injected into the original page ---------- */
const MP_UI = `
    <!-- ==================== MULTIPLAYER UI (injected by convert.js) ==================== -->
    <div id="mp-join-overlay" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
        <div class="panel-glass rounded-2xl p-7 max-w-md w-full text-center border-2 border-amber-400/60 shadow-[0_0_44px_rgba(251,191,36,0.3)]">
            <div class="text-5xl mb-2">⚔️</div>
            <h1 class="text-2xl font-black tracking-wide text-amber-300">TÂN GIỚI ĐẤU TRƯỜNG 3D</h1>
            <p class="text-sm text-slate-300 mt-1 mb-4">Đấu trường nhiều người chơi — hạ gục đối thủ, roll Trait, ring-out xuống biển!</p>
            <input id="mp-name-input" maxlength="16" autocomplete="off" placeholder="Nhập tên của bạn"
                   class="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-600 text-center font-bold text-white placeholder-slate-500 outline-none focus:border-amber-400" style="user-select:text;-webkit-user-select:text;">
            <button id="mp-join-btn" class="mt-3 w-full py-2.5 rounded-xl font-black text-sm tracking-wide text-white bg-gradient-to-r from-amber-500 to-red-500 hover:brightness-110 transition cursor-pointer">
                ⚔️ VÀO ĐẤU TRƯỜNG
            </button>
            <div id="mp-join-msg" class="mt-3 text-xs font-semibold text-sky-300 min-h-[16px]"></div>
            <button id="mp-offline-btn" class="hidden mt-2 text-xs font-bold text-slate-400 hover:text-slate-200 underline cursor-pointer">Chơi một mình (offline)</button>
            <div class="mt-3 text-[11px] text-slate-400">Phòng: <b id="mp-room-label" class="text-slate-200">main</b> · thêm <code>?room=tenphong</code> vào địa chỉ để chơi phòng riêng với bạn bè</div>
        </div>
    </div>

    <div id="mp-reconnect" class="hidden fixed top-24 left-1/2 -translate-x-1/2 z-[65] pointer-events-none">
        <div class="px-5 py-2 rounded-full bg-rose-950/95 border-2 border-rose-400 text-rose-100 text-xs font-extrabold shadow-[0_0_24px_rgba(244,63,94,0.6)] animate-pulse">
            📡 Mất kết nối — đang kết nối lại…
        </div>
    </div>

    <div id="mp-board" class="fixed left-3 top-[22rem] z-30 w-64 sm:w-72 hidden md:block pointer-events-none">
        <div class="panel-glass rounded-2xl p-2.5">
            <div id="mp-board-head" class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">🌐 Chưa kết nối</div>
            <div id="mp-board-rows" class="flex flex-col gap-1"></div>
        </div>
    </div>
`;

function main() {
  const src = findSource();
  if (!src) {
    console.warn(`[convert] Không tìm thấy ${DEFAULT_SRC} — bỏ qua (public/index.html đã có sẵn thì vẫn chạy bình thường).`);
    return;
  }
  console.log('[convert] source:', src);
  let html = fs.readFileSync(src, 'utf8');

  // 1) extract the embedded trait PNGs -> public/traits/*.png
  fs.mkdirSync(TRAITS_DIR, { recursive: true });
  const re = /(tan_[a-z]+):\s*'data:image\/png;base64,([A-Za-z0-9+/=]+)'/g;
  let m, count = 0;
  while ((m = re.exec(html))) {
    fs.writeFileSync(path.join(TRAITS_DIR, `${m[1]}.png`), Buffer.from(m[2], 'base64'));
    count++;
  }
  console.log(`[convert] extracted ${count}/7 trait PNGs -> public/traits/`);

  // 2) cut the big inline engine <script> out of the page (it lives in game-mp.js now)
  const startMatch = /<script>\s*\(\(\) => \{/.exec(html);
  if (!startMatch) throw new Error('Không tìm thấy script engine inline trong file HTML.');
  const start = startMatch.index;
  const end = html.indexOf('</script>', start);
  if (end < 0) throw new Error('Script engine không có thẻ đóng.');
  html = html.slice(0, start) + '<!-- engine: see game-mp.js -->' + html.slice(end + '</script>'.length);

  // 3) inject multiplayer UI + scripts right before </body>
  const scripts = `${MP_UI}
    <script src="/socket.io/socket.io.js"></script>
    <script src="game-mp.js"></script>
`;
  if (!html.includes('</body>')) throw new Error('Không thấy </body>.');
  html = html.replace('</body>', scripts + '</body>');

  // 4) tiny head tweaks
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Tân Giới Đấu Trường 3D — Multiplayer</title>');

  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC, 'index.html'), html, 'utf8');
  console.log(`[convert] wrote public/index.html (${(html.length / 1024).toFixed(1)} KB)`);

  if (!fs.existsSync(path.join(PUBLIC, 'game-mp.js'))) {
    console.warn('[convert] CẢNH BÁO: public/game-mp.js chưa có — hãy đặt file game-mp.js vào thư mục public/.');
  }
}

try { main(); } catch (e) { console.error('[convert] LỖI:', e.message); process.exit(1); }
