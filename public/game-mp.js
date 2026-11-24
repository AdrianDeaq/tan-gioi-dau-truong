/* =====================================================================
 * TÂN GIỚI ĐẤU TRƯỜNG 3D — MULTIPLAYER CLIENT (game-mp.js)
 * Original engine (map, 7 Trait auras, every skill VFX, SFX) + Socket.IO netcode.
 * Needs /socket.io/socket.io.js (served by server.js) loaded BEFORE this file.
 * Generated from tan_gioi_dau_truong_3d_v4.html — see README for details.
 * ===================================================================== */
    (() => {
        'use strict';

        /* =====================================================================
         * 1. SYNCHRONIZED MAP CONSTANTS, 7 TRAITS & SKILLS
         * ===================================================================== */
        const ARENA_RADIUS = 34.0;          // Circular yellow sand arena island
        const INNER_RING_RADIUS = 24.5;     // ~72% of ARENA_RADIUS orange ring
        const INNER_RING_WIDTH = 1.45;
        const CENTER_RED_RADIUS = 3.2;      // Center red circle
        const CENTER_ORANGE_RADIUS = 1.5;   // Center orange dot
        const WORLD_LIMIT = 56.0;           // Outer ocean boundary clamp

        const BASE_MAX_HP = 1000;
        const BASE_MOVE_SPEED = 10.0;
        const SEA_TICK_INTERVAL = 0.25;
        const SEA_DMG_PER_SEC = 0.10;       // 10% Max HP/s -> 2.5% (25 HP) per 0.25s
        const SEA_SPEED_MULT = 0.72;        // 72% speed while wading in ocean
        const RING_OUT_CREDIT_SEC = 6.0;    // Credit kill if enemy dies to sea within 6s of last hit
        const KILL_DMG_BONUS_PER_KILL = 0.05; // +5% damage per kill (stacks, resets to 0% when the player dies)

        // Plump, funny 3D Oval proportions
        const OVAL_SCALE_X = 1.18;
        const OVAL_SCALE_Y = 1.65;
        const OVAL_SCALE_Z = 1.05;
        const OVAL_CENTER_Y = 1.68;

        const TRAITS = [
            {
                id: 'tan_pham', name: 'Tân Phàm', rate: 40,
                dmgBonus: 0, speedBonus: 0, cdr: 0, confirmOnRoll: false, auraLevel: 0,
                color: '#b8a990', hex: 0xb8a990, bgA: '#7a6f5d', bgB: '#2b2620',
                localFiles: ['tân phàm_2.png', 'tân phàm.png', 'tan pham_2.png', 'tan pham.png', 'tan_pham_2.png', 'tan_pham.png'],
                vfxDesc: 'Hào quang nâu đất, đá nhỏ xoay quanh & lửa đất leo lét', desc: 'Không buff gì cả.'
            },
            {
                id: 'tan_giac', name: 'Tân Giác', rate: 25,
                dmgBonus: 0.15, speedBonus: 0, cdr: 0, confirmOnRoll: false, auraLevel: 1,
                color: '#60d5ff', hex: 0x60d5ff, bgA: '#1d4f72', bgB: '#0d2236',
                localFiles: ['tân giác_2.png', 'tân giác.png', 'tan giac_2.png', 'tan giac.png', 'tan_giac_2.png', 'tan_giac.png'],
                vfxDesc: '6 thanh băng kiếm xoay quanh người, trận băng dưới chân', desc: 'Tăng 15% damage.'
            },
            {
                id: 'tan_pha', name: 'Tân Phá', rate: 15,
                dmgBonus: 0.15, speedBonus: 0, cdr: 0.20, confirmOnRoll: false, auraLevel: 2,
                color: '#2dd4bf', hex: 0x2dd4bf, bgA: '#135c5c', bgB: '#08282c',
                localFiles: ['tân phá_2.png', 'tân phá.png', 'tan pha_2.png', 'tan pha.png', 'tan_pha_2.png', 'tan_pha.png'],
                vfxDesc: 'Vòng Phật quang ngọc bích sau lưng, đài sen nở & hỏa tinh', desc: 'Tăng 15% damage, hồi chiêu nhanh hơn 20%.'
            },
            {
                id: 'tan_vuong', name: 'Tân Vương', rate: 10,
                dmgBonus: 0.30, speedBonus: 0.50, cdr: 0, confirmOnRoll: false, auraLevel: 3,
                color: '#fbbf24', hex: 0xfbbf24, bgA: '#78510e', bgB: '#1c1917',
                localFiles: ['tân vương_2.png', 'tân vương.png', 'tan vuong_2.png', 'tan vuong.png', 'tan_vuong_2.png', 'tan_vuong.png'],
                vfxDesc: 'Phật luân vàng khổng lồ, 9 kiếm vàng xòe như thiên cung & lửa vàng', desc: 'Tăng 30% damage, chạy nhanh hơn 50%.'
            },
            {
                id: 'tan_hoang', name: 'Tân Hoàng', rate: 6,
                dmgBonus: 0.25, speedBonus: 0.30, cdr: 0.20, confirmOnRoll: true, auraLevel: 4,
                color: '#f97316', hex: 0xf97316, bgA: '#991b1b', bgB: '#2a0808',
                localFiles: ['tân hoàng_2.png', 'tân hoàng.png', 'tan hoang_2.png', 'tan hoang.png', 'tan_hoang_2.png', 'tan_hoang.png'],
                vfxDesc: 'Đôi mắt quỷ thợ săn khổng lồ, cánh Hỏa Long & cột lửa xoáy', desc: 'Chạy +30%, hồi chiêu -20%, damage +25%.'
            },
            {
                id: 'tan_than', name: 'Tân Thần', rate: 3,
                dmgBonus: 0.25, speedBonus: 0.50, cdr: 0.20, confirmOnRoll: true, auraLevel: 5,
                color: '#fef08a', hex: 0xfef08a, bgA: '#475569', bgB: '#0f172a',
                localFiles: ['tân thần_2.png', 'tân thần.png', 'tan than_2.png', 'tan than.png', 'tan_than_2.png', 'tan_than.png'],
                vfxDesc: 'Pháp luân trắng-vàng, 10 thần kiếm lôi quang xoay & sấm sét', desc: 'Chạy +50%, hồi chiêu -20%, damage +25%.'
            },
            {
                id: 'tan_de', name: 'Tân Đế', rate: 1,
                dmgBonus: 0.40, speedBonus: 0.75, cdr: 0.30, confirmOnRoll: true, auraLevel: 6,
                color: '#ffd700', hex: 0xffd700, bgA: '#312e81', bgB: '#070a1c',
                localFiles: ['tân đế_2.png', 'tân đế.png', 'tan de_2.png', 'tan de.png', 'tan_de_2.png', 'tan_de.png'],
                vfxDesc: 'Cả vũ trụ sau lưng: thiên hà xoáy, hành tinh quay, sao băng & Thiên Luân', desc: 'Chạy +75%, hồi chiêu -30%, damage +40%.'
            }
        ];

        const SKILLS = {
            melee: {
                z: { id: 'melee_z', name: 'Lao Tóm', icon: '👊', dmgPct: 0.20, cd: 6.0, endlag: 0.0, needsTarget: false, sub: '20% • Tóm 2s' },
                x: { id: 'melee_x', name: 'Đập Đất', icon: '💥', dmgPct: 0.10, cd: 8.0, endlag: 2.0, needsTarget: false, sub: '10% • 2s EL' },
                c: { id: 'melee_c', name: 'Hút Trói', icon: '🧲', dmgPct: 0.30, cd: 5.0, endlag: 0.0, needsTarget: true, sub: '30% • Chỉ Chuột' }
            },
            magic: {
                z: { id: 'magic_z', name: 'Tia Năng Lượng', icon: '⚡', dmgPct: 0.20, cd: 5.0, endlag: 1.0, needsTarget: false, sub: '20% • 1s EL' },
                x: { id: 'magic_x', name: 'Lóa Tím', icon: '🔮', dmgPct: 0.10, cd: 7.0, endlag: 0.0, needsTarget: true, sub: '10% • Stun 3s' },
                c: { id: 'magic_c', name: 'Hồi Huyết', icon: '💚', healPct: 0.30, cd: 15.0, endlag: 1.0, needsTarget: false, sub: '+30% • 1s EL' }
            },
            dash: { id: 'dash_q', name: 'Lướt', cd: 1.5, endlag: 0.0 }
        };

        /* =====================================================================
         * 2. SYNTHESIZED WEB AUDIO API SOUND EFFECTS (ZERO EXTERNAL URLS)
         * ===================================================================== */
        const SFX = {
            ctx: null,
            enabled: true,
            init() {
                try {
                    if (!this.ctx) {
                        const AC = window.AudioContext || window.webkitAudioContext;
                        if (AC) this.ctx = new AC();
                    }
                    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
                } catch (e) {}
            },
            tone(freqStart, freqEnd, dur, type = 'sine', vol = 0.14, delay = 0) {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const now = this.ctx.currentTime + delay;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
                    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + dur + 0.02);
                } catch (e) {}
            },
            noise(dur, vol = 0.12, highpass = 400) {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
                    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
                    const src = this.ctx.createBufferSource();
                    src.buffer = buf;
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = highpass;
                    const gain = this.ctx.createGain();
                    gain.gain.value = vol;
                    src.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    src.start();
                } catch (e) {}
            },
            dash() { this.noise(0.16, 0.12, 950); this.tone(540, 180, 0.14, 'triangle', 0.11); },
            grab() { this.tone(170, 95, 0.16, 'sawtooth', 0.15); this.noise(0.1, 0.1, 350); },
            throwHit() { this.tone(240, 58, 0.28, 'sawtooth', 0.18); this.noise(0.22, 0.16, 520); },
            slam() { this.tone(140, 36, 0.42, 'sawtooth', 0.22); this.noise(0.32, 0.2, 220); },
            pull() { this.tone(240, 740, 0.22, 'triangle', 0.15); this.tone(520, 980, 0.14, 'sine', 0.1, 0.06); },
            laser() { this.tone(920, 210, 0.36, 'sawtooth', 0.15); this.tone(1280, 420, 0.28, 'sine', 0.11); },
            purple() { this.tone(620, 1180, 0.26, 'sine', 0.16); this.tone(420, 880, 0.36, 'triangle', 0.14, 0.05); },
            heal() { this.tone(523, 659, 0.18, 'sine', 0.14, 0); this.tone(659, 784, 0.2, 'sine', 0.14, 0.08); this.tone(784, 1046, 0.32, 'sine', 0.14, 0.16); },
            killFullHeal() {
                this.tone(523, 523, 0.16, 'triangle', 0.15, 0);
                this.tone(659, 659, 0.16, 'triangle', 0.15, 0.07);
                this.tone(784, 784, 0.18, 'triangle', 0.16, 0.14);
                this.tone(1046, 1318, 0.42, 'sine', 0.18, 0.21);
            },
            seaSplash() { this.noise(0.18, 0.09, 1200); this.tone(320, 170, 0.15, 'sine', 0.08); },
            warn() { this.tone(880, 660, 0.14, 'square', 0.1, 0); this.tone(880, 660, 0.14, 'square', 0.1, 0.18); },
            rollTick() { this.tone(460 + Math.random() * 280, 360, 0.045, 'triangle', 0.08); },
            rollReveal(lvl) {
                const base = 360 + lvl * 75;
                this.tone(base, base * 1.25, 0.22, 'triangle', 0.15, 0);
                this.tone(base * 1.25, base * 1.5, 0.28, 'sine', 0.16, 0.1);
                if (lvl >= 4) this.tone(base * 1.5, base * 2.0, 0.55, 'sine', 0.18, 0.2);
            }
        };

        /* =====================================================================
         * 3. 100% ORIGINAL PNG LOADER, SAFE INDEXEDDB CACHE & CRISP COVER WRAP
         *    (ZERO PIXEL / BIT / CARTOON FACES)
         * ===================================================================== */
        const BUILTIN_TRAIT_IMAGES = {
            tan_pham: 'traits/tan_pham.png',
            tan_giac: 'traits/tan_giac.png',
            tan_pha: 'traits/tan_pha.png',
            tan_vuong: 'traits/tan_vuong.png',
            tan_hoang: 'traits/tan_hoang.png',
            tan_than: 'traits/tan_than.png',
            tan_de: 'traits/tan_de.png'
        };

        const traitPortraits = {}; // id -> { texCanvas (1024x1024), avatarCanvas (256x256), texture, hasImage }
        const IDB_NAME = 'TanGioiTraitImagesDB_v2';
        const IDB_STORE = 'traitImages';

        function openTraitIDB() {
            return new Promise(resolve => {
                try {
                    if (typeof indexedDB === 'undefined' || !indexedDB) { resolve(null); return; }
                    const req = indexedDB.open(IDB_NAME, 1);
                    req.onupgradeneeded = e => {
                        try {
                            const db = e.target.result;
                            if (!db.objectStoreNames.contains(IDB_STORE)) {
                                db.createObjectStore(IDB_STORE, { keyPath: 'id' });
                            }
                        } catch (err) {}
                    };
                    req.onsuccess = e => resolve(e.target.result);
                    req.onerror = () => resolve(null);
                } catch (err) {
                    resolve(null);
                }
            });
        }

        async function saveTraitImageToIDB(traitId, dataUrl) {
            try {
                const db = await openTraitIDB();
                if (!db) return;
                await new Promise(resolve => {
                    try {
                        const tx = db.transaction(IDB_STORE, 'readwrite');
                        tx.objectStore(IDB_STORE).put({ id: traitId, dataUrl, updatedAt: Date.now() });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => resolve();
                    } catch (e) { resolve(); }
                });
            } catch (e) {}
        }

        async function loadAllTraitImagesFromIDB() {
            try {
                const db = await openTraitIDB();
                if (!db) return {};
                return await new Promise(resolve => {
                    try {
                        const tx = db.transaction(IDB_STORE, 'readonly');
                        const req = tx.objectStore(IDB_STORE).getAll();
                        req.onsuccess = () => {
                            const map = {};
                            (req.result || []).forEach(rec => { if (rec && rec.id && rec.dataUrl) map[rec.id] = rec.dataUrl; });
                            resolve(map);
                        };
                        req.onerror = () => resolve({});
                    } catch (e) { resolve({}); }
                });
            } catch (e) {
                return {};
            }
        }

        async function clearAllTraitImagesFromIDB() {
            try {
                const db = await openTraitIDB();
                if (!db) return;
                await new Promise(resolve => {
                    try {
                        const tx = db.transaction(IDB_STORE, 'readwrite');
                        tx.objectStore(IDB_STORE).clear();
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => resolve();
                    } catch (e) { resolve(); }
                });
            } catch (e) {}
        }

        function normalizeTraitFilename(name) {
            return String(name || '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'd')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();
        }

        function matchTraitFromFilename(filename) {
            const base = normalizeTraitFilename(filename.replace(/\.[^.]+$/, ''));
            if (base.includes('pham')) return TRAITS[0];
            if (base.includes('giac')) return TRAITS[1];
            if (base.includes('pha')) return TRAITS[2];
            if (base.includes('vuong')) return TRAITS[3];
            if (base.includes('hoang')) return TRAITS[4];
            if (base.includes('than')) return TRAITS[5];
            if (base.includes('de')) return TRAITS[6];
            return null;
        }

        // Premium typographic gradient placeholder (strictly NO pixel/bit/cartoon face)
        function drawCleanPlaceholder(ctx, trait, size, isOvalTexture = false) {
            const c = size / 2;
            ctx.save();
            ctx.clearRect(0, 0, size, size);

            const bg = ctx.createRadialGradient(c, c * 0.85, size * 0.06, c, c, size * 0.68);
            bg.addColorStop(0, trait.bgA);
            bg.addColorStop(0.65, trait.bgB);
            bg.addColorStop(1, '#090d1a');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, size, size);

            ctx.strokeStyle = trait.color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = Math.max(3, size * 0.012);
            ctx.beginPath();
            ctx.arc(c, c, size * 0.37, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 0.24;
            ctx.lineWidth = Math.max(2, size * 0.006);
            ctx.beginPath();
            ctx.arc(c, c, size * 0.43, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = trait.color;
            ctx.shadowBlur = size * 0.04;
            ctx.fillStyle = '#ffffff';
            ctx.font = `900 ${Math.round(size * (isOvalTexture ? 0.115 : 0.17))}px "Be Vietnam Pro", sans-serif`;
            ctx.fillText(trait.name.toUpperCase(), c, c - size * (isOvalTexture ? 0.05 : 0.06));

            ctx.shadowBlur = 0;
            ctx.fillStyle = trait.color;
            ctx.font = `700 ${Math.round(size * (isOvalTexture ? 0.045 : 0.09))}px "Be Vietnam Pro", sans-serif`;
            ctx.fillText(isOvalTexture ? 'Kéo thả 7 ảnh PNG vào đây' : 'Chưa có PNG', c, c + size * (isOvalTexture ? 0.08 : 0.14));

            if (!isOvalTexture) {
                ctx.strokeStyle = trait.color;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(c, c, c - 4, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw 100% original crisp PNG with aspect-matched 'cover' framing so it fills the entire Oval
        function renderOriginalPNGToEntry(trait, img) {
            const entry = traitPortraits[trait.id];
            if (!entry) return;
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (!iw || !ih) return;

            // 1. 1024x1024 Full-Oval Texture (natural oval aspect 1.18 / 1.65)
            const tCv = entry.texCanvas;
            const tCtx = tCv.getContext('2d');
            tCtx.imageSmoothingEnabled = true;
            tCtx.imageSmoothingQuality = 'high';
            tCtx.clearRect(0, 0, tCv.width, tCv.height);

            const ovalAspect = OVAL_SCALE_X / OVAL_SCALE_Y;
            const imgAspect = iw / ih;
            let sx = 0, sy = 0, sw = iw, sh = ih;
            if (imgAspect > ovalAspect) {
                sw = ih * ovalAspect;
                sx = (iw - sw) * 0.5;
            } else {
                sh = iw / ovalAspect;
                sy = Math.min(ih - sh, Math.max(0, (ih - sh) * 0.14));
            }
            tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tCv.width, tCv.height);

            // 2. 256x256 Square Avatar for HUD & Table
            const aCv = entry.avatarCanvas;
            const aCtx = aCv.getContext('2d');
            aCtx.imageSmoothingEnabled = true;
            aCtx.imageSmoothingQuality = 'high';
            aCtx.clearRect(0, 0, aCv.width, aCv.height);

            let asx = 0, asy = 0, asw = iw, ash = ih;
            if (iw > ih) { asw = ih; asx = (iw - asw) * 0.5; }
            else { ash = iw; asy = Math.min(ih - ash, Math.max(0, (ih - ash) * 0.12)); }
            aCtx.drawImage(img, asx, asy, asw, ash, 0, 0, aCv.width, aCv.height);

            entry.hasImage = true;
            entry.texture.minFilter = THREE.LinearFilter;
            entry.texture.magFilter = THREE.LinearFilter;
            entry.texture.generateMipmaps = false;
            if (state.renderer) {
                entry.texture.anisotropy = state.renderer.capabilities.getMaxAnisotropy();
            }
            entry.texture.needsUpdate = true;
            refreshAllPortraitCanvases();
            updatePNGLoadedCounter();
        }

        function resetAllPortraitsToPlaceholders() {
            TRAITS.forEach(trait => {
                const entry = traitPortraits[trait.id];
                if (!entry) return;
                entry.hasImage = false;
                drawCleanPlaceholder(entry.texCanvas.getContext('2d'), trait, entry.texCanvas.width, true);
                drawCleanPlaceholder(entry.avatarCanvas.getContext('2d'), trait, entry.avatarCanvas.width, false);
                entry.texture.needsUpdate = true;
            });
            refreshAllPortraitCanvases();
            updatePNGLoadedCounter();
        }

        function initTraitPortraits() {
            TRAITS.forEach(trait => {
                const texCanvas = document.createElement('canvas');
                texCanvas.width = 1024;
                texCanvas.height = 1024;
                drawCleanPlaceholder(texCanvas.getContext('2d'), trait, 1024, true);

                const avatarCanvas = document.createElement('canvas');
                avatarCanvas.width = 256;
                avatarCanvas.height = 256;
                drawCleanPlaceholder(avatarCanvas.getContext('2d'), trait, 256, false);

                const texture = new THREE.CanvasTexture(texCanvas);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.needsUpdate = true;

                traitPortraits[trait.id] = { texCanvas, avatarCanvas, texture, hasImage: false };
            });
        }

        function applyMaxAnisotropyToTextures() {
            if (!state.renderer) return;
            const maxA = state.renderer.capabilities.getMaxAnisotropy();
            TRAITS.forEach(t => {
                const entry = traitPortraits[t.id];
                if (entry && entry.texture) {
                    entry.texture.anisotropy = maxA;
                    entry.texture.needsUpdate = true;
                }
            });
        }

        function loadImageFromSrc(src) {
            return new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('load failed'));
                    img.src = src;
                } catch (e) {
                    reject(e);
                }
            });
        }

        async function tryAutoLoadTraitLocalPNG(trait) {
            if (traitPortraits[trait.id] && traitPortraits[trait.id].hasImage) return true;
            // Skip auto-fetching relative paths inside blob:/data:/about: sandbox frames to avoid noisy 404s
            try {
                const proto = window.location && window.location.protocol;
                if (proto !== 'http:' && proto !== 'https:' && proto !== 'file:') return false;
            } catch (e) {
                return false;
            }
            for (const fname of trait.localFiles) {
                try {
                    const img = await loadImageFromSrc(encodeURI(fname));
                    renderOriginalPNGToEntry(trait, img);
                    return true;
                } catch (e) {}
            }
            return false;
        }

        async function bootstrapTraitPNGs() {
            try {
                const cached = await loadAllTraitImagesFromIDB();
                let restoredCount = 0;
                for (const trait of TRAITS) {
                    if (cached[trait.id]) {
                        try {
                            const img = await loadImageFromSrc(cached[trait.id]);
                            renderOriginalPNGToEntry(trait, img);
                            restoredCount++;
                        } catch (e) {}
                    }
                }
                let builtinCount = 0;
                for (const trait of TRAITS) {
                    if (!traitPortraits[trait.id].hasImage && BUILTIN_TRAIT_IMAGES[trait.id]) {
                        try {
                            const img = await loadImageFromSrc(BUILTIN_TRAIT_IMAGES[trait.id]);
                            renderOriginalPNGToEntry(trait, img);
                            builtinCount++;
                        } catch (e) {}
                    }
                }
                restoredCount += builtinCount;
                let localCount = 0;
                await Promise.all(TRAITS.map(async trait => {
                    if (!traitPortraits[trait.id].hasImage) {
                        const ok = await tryAutoLoadTraitLocalPNG(trait);
                        if (ok) localCount++;
                    }
                }));
                updatePNGLoadedCounter();
                if (restoredCount + localCount > 0) {
                    addBattleLog(`🖼️ Đã nạp sẵn ${restoredCount + localCount}/7 ảnh PNG gốc cho nhân vật Oval!`, 'text-amber-300');
                }
            } catch (e) {}
        }

        function handleMultiPNGFiles(fileList) {
            const files = Array.from(fileList || []).filter(f => f && f.type && f.type.startsWith('image/'));
            if (!files.length) {
                showToast('Vui lòng chọn hoặc kéo thả các tệp ảnh PNG!', 'red');
                return;
            }
            let matched = 0;
            const unmatchedNames = [];
            let pending = files.length;

            const doneCheck = () => {
                if (pending > 0) return;
                if (matched > 0) {
                    showToast(`🖼️ Đã nạp & lưu ${matched} ảnh PNG gốc lên Oval 3D!`, 'emerald');
                    addBattleLog(`🖼️ Nạp thành công ${matched} ảnh PNG gốc.`, 'text-emerald-300');
                }
                if (unmatchedNames.length > 0) {
                    showToast(`Không khớp tên Trait: ${unmatchedNames.slice(0, 2).join(', ')} (dùng nút Đổi ảnh trong Bảng Trait)`, 'amber');
                }
            };

            files.forEach(file => {
                const trait = matchTraitFromFilename(file.name);
                if (!trait) {
                    unmatchedNames.push(file.name);
                    pending--;
                    doneCheck();
                    return;
                }
                const reader = new FileReader();
                reader.onload = ev => {
                    const dataUrl = ev.target.result;
                    const img = new Image();
                    img.onload = () => {
                        renderOriginalPNGToEntry(trait, img);
                        saveTraitImageToIDB(trait.id, dataUrl);
                        matched++;
                        pending--;
                        doneCheck();
                    };
                    img.onerror = () => { pending--; doneCheck(); };
                    img.src = dataUrl;
                };
                reader.onerror = () => { pending--; doneCheck(); };
                reader.readAsDataURL(file);
            });
        }

        function updatePNGLoadedCounter() {
            const count = TRAITS.filter(t => traitPortraits[t.id] && traitPortraits[t.id].hasImage).length;
            const el = document.getElementById('hud-png-status');
            if (el) {
                el.textContent = count === 7 ? 'Đã nạp đủ 7/7 Ảnh PNG Gốc' : `Chọn 7 Ảnh PNG Gốc (${count}/7)`;
            }
        }

        function copyPortraitToCanvas(targetCanvas, traitId) {
            if (!targetCanvas || !traitPortraits[traitId]) return;
            const ctx = targetCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(traitPortraits[traitId].avatarCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
        }

        function refreshAllPortraitCanvases() {
            const activeVisualTrait = state.previewTrait || state.currentTrait;
            copyPortraitToCanvas(document.getElementById('hud-trait-portrait'), activeVisualTrait.id);
            document.querySelectorAll('canvas[data-trait-portrait]').forEach(cv => {
                copyPortraitToCanvas(cv, cv.dataset.traitPortrait);
            });
            state.bots.forEach(b => {
                if (b.overheadPortrait) copyPortraitToCanvas(b.overheadPortrait, b.trait.id);
            });
        }

        /* =====================================================================
         * 4. GLOBAL GAME STATE
         * ===================================================================== */
        const state = {
            scene: null, camera: null, renderer: null,
            clock: new THREE.Clock(),
            arenaFloorRayPlane: null,
            seaMesh: null, seaGeo: null, seaTexture: null, foamRing: null, seaSparkles: null,
            camYaw: 0, camPitch: 0.58, camDist: 21.0,
            isRightDragging: false, lastMouseX: 0, lastMouseY: 0,
            mouseNDC: new THREE.Vector2(0, 0),
            raycaster: new THREE.Raycaster(),
            cursorWorldPos: new THREE.Vector3(0, 0, 0),
            cursorReticle: null, targetLockRing: null, hoveredEnemy: null,
            keys: {},
            player: null, bots: [], vfxList: [], floatingTexts: [],
            activeKit: 'melee', aiCombatMode: false /* test arena: the dummy never acts */, isRollingTrait: false,
            purpleBlindTime: 0, purpleBlindMax: 3.0, playerRespawnTimer: 0,
            currentTrait: TRAITS[0], previewTrait: null, kills: 0, traitRolls: 0, killStacks: 0,
            shakeTime: 0, shakeIntensity: 0
        };

        /* =====================================================================
         * 5. HIGH-RES 2048x2048 ISLAND TEXTURE, OCEAN & RUNE TEXTURES
         * ===================================================================== */
        function createIslandTexture(maxAnisotropy = 4) {
            const size = 2048;
            const cv = document.createElement('canvas');
            cv.width = size; cv.height = size;
            const ctx = cv.getContext('2d');
            const c = size / 2;
            const px = (size / 2) / ARENA_RADIUS;

            // Dark earthy ground base so skill effects pop
            ctx.fillStyle = '#3b3a2c';
            ctx.fillRect(0, 0, size, size);
            // Large soft mossy / dirt patches
            for (let i = 0; i < 160; i++) {
                const x = Math.random() * size, y = Math.random() * size, r = 40 + Math.random() * 120;
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                const moss = Math.random() < 0.55;
                g.addColorStop(0, moss ? 'rgba(46,78,44,0.55)' : 'rgba(78,62,40,0.45)');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }

            // Subtle organic sand grain
            for (let i = 0; i < 9000; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const a = Math.random() * 0.045;
                ctx.fillStyle = Math.random() < 0.5 ? `rgba(20,16,10,${a * 3})` : `rgba(130,150,100,${a * 2})`;
                ctx.fillRect(x, y, 4, 4);
            }

            // Light coastal shoreline sand edge gradient
            const edge = ctx.createRadialGradient(c, c, ARENA_RADIUS * 0.88 * px, c, c, ARENA_RADIUS * px);
            edge.addColorStop(0, 'rgba(120,104,70,0)');
            edge.addColorStop(0.7, 'rgba(110,96,64,0.45)');
            edge.addColorStop(1, 'rgba(150,130,84,0.85)');
            ctx.fillStyle = edge;
            ctx.beginPath();
            ctx.arc(c, c, ARENA_RADIUS * px, 0, Math.PI * 2);
            ctx.fill();

            // Crisp Orange Concentric Ring (#f47b20) at INNER_RING_RADIUS = 24.5 (~72%)
            ctx.beginPath();
            ctx.arc(c, c, INNER_RING_RADIUS * px, 0, Math.PI * 2);
            ctx.strokeStyle = '#b4531a';
            ctx.lineWidth = INNER_RING_WIDTH * px;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,170,80,0.35)';
            ctx.lineWidth = INNER_RING_WIDTH * px * 0.35;
            ctx.stroke();

            // Center Red Circle (#e51c23, R = 3.2) + Inner Orange Dot (#f47b20, R = 1.5)
            ctx.beginPath();
            ctx.arc(c, c, CENTER_RED_RADIUS * px, 0, Math.PI * 2);
            ctx.fillStyle = '#8c1218';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(c, c, CENTER_ORANGE_RADIUS * px, 0, Math.PI * 2);
            ctx.fillStyle = '#c4601c';
            ctx.fill();

            // Stone rune circle ring detail around the arena
            ctx.strokeStyle = 'rgba(20,18,12,0.55)';
            ctx.lineWidth = 0.35 * px;
            [10, 17, 30].forEach(r => { ctx.beginPath(); ctx.arc(c, c, r * px, 0, Math.PI * 2); ctx.stroke(); });

            const tex = new THREE.CanvasTexture(cv);
            tex.anisotropy = maxAnisotropy;
            tex.needsUpdate = true;
            return tex;
        }

        function createSeaTexture() {
            const size = 512;
            const cv = document.createElement('canvas');
            cv.width = size; cv.height = size;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#0d3a55';
            ctx.fillRect(0, 0, size, size);

            // Soft luminous water caustic bands
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = i % 2 === 0 ? 'rgba(140,210,240,0.10)' : 'rgba(2,20,40,0.28)';
                ctx.beginPath();
                ctx.ellipse(Math.random() * size, Math.random() * size, 26 + Math.random() * 54, 5 + Math.random() * 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            const tex = new THREE.CanvasTexture(cv);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(16, 16);
            return tex;
        }

        function createRuneTexture(c1, c2, cosmic = false) {
            const size = 512;
            const cv = document.createElement('canvas');
            cv.width = size; cv.height = size;
            const ctx = cv.getContext('2d');
            const c = size / 2;
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 14;
            ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c, c, 232, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c, c, 184, 0, Math.PI * 2); ctx.stroke();

            const sides = cosmic ? 8 : 6;
            for (let p = 0; p < 2; p++) {
                ctx.beginPath();
                ctx.strokeStyle = p === 0 ? c1 : c2;
                ctx.lineWidth = 4;
                for (let i = 0; i <= sides; i++) {
                    const a = p * (Math.PI / sides) + (i / sides) * Math.PI * 2;
                    const x = c + Math.cos(a) * 182, y = c + Math.sin(a) * 182;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            const glyphs = ['乾', '坤', '帝', '神', '皇', '王', '道', '玄', '天', '星', '破', '武'];
            ctx.fillStyle = c1; ctx.font = 'bold 28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                ctx.save();
                ctx.translate(c + Math.cos(a) * 208, c + Math.sin(a) * 208);
                ctx.rotate(a + Math.PI / 2);
                ctx.fillText(glyphs[i], 0, 0);
                ctx.restore();
            }
            if (cosmic) {
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * Math.PI * 2;
                    ctx.save(); ctx.translate(c + Math.cos(a) * 232, c + Math.sin(a) * 232); ctx.rotate(a);
                    ctx.beginPath(); ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2); ctx.ellipse(0, 0, 7, 26, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            }
            return new THREE.CanvasTexture(cv);
        }

        /* =====================================================================
         * 6. THREE.JS r128 SCENE, ZERO-Z-FIGHTING ISLAND & ANIMATED OCEAN
         * ===================================================================== */
        function initScene() {
            const container = document.getElementById('game-container');
            state.scene = new THREE.Scene();
            state.scene.background = new THREE.Color(0x0b1b2e);
            // Far linear fog ONLY blurs distant horizon (110 -> 260), island stays 100% crisp
            state.scene.fog = new THREE.Fog(0x0b1b2e, 95, 240);

            state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 420);

            state.renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: 'high-performance' });
            state.renderer.setSize(window.innerWidth, window.innerHeight);
            state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            state.renderer.shadowMap.enabled = true;
            state.renderer.shadowMap.type = THREE.PCFShadowMap;
            container.innerHTML = '';
            container.appendChild(state.renderer.domElement);

            const maxAniso = state.renderer.capabilities.getMaxAnisotropy();

            // Crisp Tropical Daylight + Soft Shadows
            state.scene.add(new THREE.HemisphereLight(0x8fb4e0, 0x1a2a1c, 0.55));
            const sun = new THREE.DirectionalLight(0xffe2b8, 0.85);
            sun.position.set(28, 52, 24);
            sun.castShadow = true;
            sun.shadow.mapSize.width = 1024;
            sun.shadow.mapSize.height = 1024;
            sun.shadow.camera.near = 5;
            sun.shadow.camera.far = 140;
            const d = 46;
            sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
            sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
            sun.shadow.bias = -0.0005;
            state.scene.add(sun);

            // 1. Island Base Cylinder placed at y = -1.22 (top at y = -0.02, bottom at y = -2.42)
            const islandBase = new THREE.Mesh(
                new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 2.2, 2.4, 96),
                new THREE.MeshStandardMaterial({ color: 0x4a3f2a, roughness: 0.95, metalness: 0.02 })
            );
            islandBase.position.y = -1.22;
            islandBase.receiveShadow = true;
            state.scene.add(islandBase);

            // 2. Crisp Top Arena Surface Disc at y = 0.02 (0.04m clear separation -> ZERO Z-fighting!)
            const islandTex = createIslandTexture(maxAniso);
            const islandTopDisc = new THREE.Mesh(
                new THREE.CircleGeometry(ARENA_RADIUS, 96),
                new THREE.MeshStandardMaterial({ map: islandTex, roughness: 0.85, metalness: 0.02 })
            );
            islandTopDisc.rotation.x = -Math.PI / 2;
            islandTopDisc.position.y = 0.02;
            islandTopDisc.receiveShadow = true;
            state.scene.add(islandTopDisc);

            // 3. Animated White Shoreline Foam Ring at y = -0.22 (between island top 0.02 and ocean -0.55)
            state.foamRing = new THREE.Mesh(
                new THREE.RingGeometry(ARENA_RADIUS - 0.1, ARENA_RADIUS + 1.4, 96),
                new THREE.MeshBasicMaterial({ color: 0xbfe6f5, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false })
            );
            state.foamRing.rotation.x = -Math.PI / 2;
            state.foamRing.position.y = -0.22;
            state.scene.add(state.foamRing);

            // 4. Dynamic Animated Ocean Plane (500x500, 64x64) at y = -0.55
            // Wave peaks stay within ±0.12 (max y = -0.43), NEVER penetrating island top (0.02) or foam (-0.22)
            state.seaTexture = createSeaTexture();
            const seaGeo = new THREE.PlaneGeometry(500, 500, 64, 64);
            seaGeo.rotateX(-Math.PI / 2); // Bake rotation so Y is directly wave height!
            state.seaGeo = seaGeo;
            state.seaMesh = new THREE.Mesh(
                seaGeo,
                new THREE.MeshStandardMaterial({
                    map: state.seaTexture,
                    color: 0x9fb8c8,
                    roughness: 0.3,
                    metalness: 0.08
                })
            );
            state.seaMesh.position.y = -0.55;
            state.seaMesh.receiveShadow = false;
            state.scene.add(state.seaMesh);

            // 5. Outer Ocean World Limit Warning Ring (WORLD_LIMIT = 56)
            const outerBoundary = new THREE.Mesh(
                new THREE.RingGeometry(WORLD_LIMIT - 0.45, WORLD_LIMIT + 0.45, 96),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthWrite: false })
            );
            outerBoundary.rotation.x = -Math.PI / 2;
            outerBoundary.position.y = -0.35;
            state.scene.add(outerBoundary);

            // 6. Subtle Sparkling Water Shimmer Points over the Ocean
            const spCount = 260;
            const spPos = new Float32Array(spCount * 3);
            for (let i = 0; i < spCount; i++) {
                const rad = ARENA_RADIUS + 2.2 + Math.random() * 58;
                const ang = Math.random() * Math.PI * 2;
                spPos[i * 3] = Math.cos(ang) * rad;
                spPos[i * 3 + 1] = -0.36;
                spPos[i * 3 + 2] = Math.sin(ang) * rad;
            }
            const spGeo = new THREE.BufferGeometry();
            spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
            state.seaSparkles = new THREE.Points(spGeo, new THREE.PointsMaterial({
                color: 0xbfe6ff, size: 0.4, transparent: true, opacity: 0.5, depthWrite: false
            }));
            state.scene.add(state.seaSparkles);

            buildMapDecorations(state.scene);

            // Invisible Raycast Plane across Island + Ocean
            state.arenaFloorRayPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(400, 400),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            state.arenaFloorRayPlane.rotation.x = -Math.PI / 2;
            state.scene.add(state.arenaFloorRayPlane);

            // 3D Ground Aiming Reticle
            const ret = new THREE.Group();
            const r1 = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.80, 32), new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthWrite: false }));
            r1.rotation.x = -Math.PI / 2;
            const r2 = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.62, 32), new THREE.MeshBasicMaterial({ color: 0xf47b20, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false }));
            r2.rotation.x = -Math.PI / 2;
            const dot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: 0xe51c23, side: THREE.DoubleSide, depthWrite: false }));
            dot.rotation.x = -Math.PI / 2;
            ret.add(r1, r2, dot);
            ret.position.y = 0.08;
            state.scene.add(ret);
            state.cursorReticle = ret;

            // 3D Red Target Lock Ring (clearly shown when hovering an enemy!)
            const lock = new THREE.Group();
            const lr1 = new THREE.Mesh(new THREE.RingGeometry(1.32, 1.68, 40), new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.96, depthWrite: false }));
            lr1.rotation.x = -Math.PI / 2;
            const lr2 = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.07, 8, 36), new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.9 }));
            lr2.position.y = 1.6;
            lock.add(lr1, lr2);
            lock.visible = false;
            state.scene.add(lock);
            state.targetLockRing = lock;
        }


        /* =====================================================================
         * 6b. MAP DECORATIONS: TREES, PALMS, ROCKS, GRASS, FLOWERS, ISLETS, LANTERNS
         * ===================================================================== */
        function seededRand(seed) {
            let a = seed >>> 0;
            return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        }

        function buildMapDecorations(scene) {
            const rnd = seededRand(20260);
            const deco = new THREE.Group();
            state.decoGroup = deco;
            const M = (color, rough = 0.9, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0.02 }, extra));
            const trunkMat = M(0x5a3a22), trunkDark = M(0x3d2916);
            const leafMats = [M(0x1f5a32), M(0x276b3a), M(0x174a2a), M(0x2f7a3e)];
            const palmMats = [M(0x2c7a3a, 0.8, { side: THREE.DoubleSide }), M(0x1f6630, 0.8, { side: THREE.DoubleSide })];
            const rockMats = [M(0x555a62, 0.95, { flatShading: true }), M(0x444a52, 0.95, { flatShading: true }), M(0x6a665c, 0.95, { flatShading: true })];
            const mossMat = M(0x2e5a2e, 1, { flatShading: true });
            const lerpY = (r) => 0; // island top is flat

            function mark(m) { m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; }

            // --- Round-canopy tree (stacked blobby icosahedrons) ---
            function makeRoundTree(h = 5 + rnd() * 3) {
                const g = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, h * 0.62, 7), trunkMat);
                trunk.position.y = h * 0.31;
                trunk.rotation.z = (rnd() - 0.5) * 0.12;
                g.add(trunk);
                const lm = leafMats[Math.floor(rnd() * leafMats.length)];
                const blobs = 4;
                for (let i = 0; i < blobs; i++) {
                    const r = (1.9 - i * 0.18) * (0.85 + rnd() * 0.3);
                    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), lm);
                    const a = rnd() * Math.PI * 2;
                    b.position.set(Math.cos(a) * (i ? 0.9 : 0), h * 0.62 + i * 0.55, Math.sin(a) * (i ? 0.9 : 0));
                    b.scale.y = 0.85;
                    g.add(b);
                }
                return mark(g);
            }

            // --- Pine / conifer ---
            function makePine(h = 6 + rnd() * 3) {
                const g = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, h * 0.3, 6), trunkDark);
                trunk.position.y = h * 0.15;
                g.add(trunk);
                const lm = leafMats[Math.floor(rnd() * 3)];
                for (let i = 0; i < 4; i++) {
                    const t = i / 4;
                    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.1 - t * 1.3, h * 0.38, 8), lm);
                    cone.position.y = h * 0.3 + i * h * 0.17 + h * 0.15;
                    g.add(cone);
                }
                return mark(g);
            }

            // --- Palm tree (curved trunk + fronds) ---
            function makePalm(h = 6 + rnd() * 2.5) {
                const g = new THREE.Group();
                const segs = 6, lean = 0.28 + rnd() * 0.25, dir = rnd() * Math.PI * 2;
                let px = 0, py = 0, pz = 0;
                for (let i = 0; i < segs; i++) {
                    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.015, 0.26 - i * 0.015, h / segs + 0.05, 6), i % 2 ? trunkMat : trunkDark);
                    const t = (i + 0.5) / segs;
                    const nx = Math.cos(dir) * lean * t * t * h * 0.5;
                    const nz = Math.sin(dir) * lean * t * t * h * 0.5;
                    seg.position.set(nx, (i + 0.5) * (h / segs), nz);
                    seg.rotation.z = -Math.cos(dir) * lean * t * 0.9;
                    seg.rotation.x = Math.sin(dir) * lean * t * 0.9;
                    g.add(seg); px = nx; py = h; pz = nz;
                }
                const top = new THREE.Group(); top.position.set(px, py, pz);
                const frondGeo = new THREE.PlaneGeometry(0.9, 3.4, 1, 4);
                const fp = frondGeo.attributes.position;
                for (let i = 0; i < fp.count; i++) { const y = fp.getY(i); fp.setZ(i, -Math.pow((y + 1.7) / 3.4, 2) * 1.1); fp.setX(i, fp.getX(i) * (1 - Math.abs(y) / 3.4 * 0.6)); }
                frondGeo.translate(0, 1.7, 0); frondGeo.computeVertexNormals();
                for (let i = 0; i < 8; i++) {
                    const f = new THREE.Mesh(frondGeo, palmMats[i % 2]);
                    f.rotation.set(-Math.PI / 2 + 0.9, 0, 0);
                    const holder = new THREE.Group(); holder.rotation.y = (i / 8) * Math.PI * 2; holder.add(f);
                    top.add(holder);
                }
                const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), M(0x4a2f12));
                top.add(nut);
                g.add(top);
                g.userData.top = top;
                return mark(g);
            }

            // --- Rocks ---
            function makeRock(sz = 1) {
                const g = new THREE.Group();
                const r = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), rockMats[Math.floor(rnd() * 3)]);
                r.scale.set(1 + rnd() * 0.5, 0.6 + rnd() * 0.45, 1 + rnd() * 0.4);
                r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
                r.position.y = sz * 0.35;
                g.add(r);
                if (rnd() < 0.5) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz * 0.6, 0), mossMat); m.scale.set(1, 0.3, 1); m.position.y = sz * 0.75; g.add(m); }
                return mark(g);
            }

            // --- Ancient stone pillar (ruin) ---
            function makePillar() {
                const g = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.5, 8), rockMats[1]);
                base.position.y = 0.25;
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 3.2 + rnd() * 1.2, 8), rockMats[2]);
                col.position.y = 0.5 + col.geometry.parameters.height / 2;
                const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.5), rockMats[1]);
                cap.position.y = 0.5 + col.geometry.parameters.height + 0.17;
                // glowing rune band
                const rune = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.14, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }));
                rune.position.y = 1.9;
                g.add(base, col, cap, rune);
                state.runeBands = state.runeBands || []; state.runeBands.push(rune);
                return mark(g);
            }

            // --- Mushroom ---
            function makeMushroom(sz = 0.5) {
                const g = new THREE.Group();
                const st = new THREE.Mesh(new THREE.CylinderGeometry(sz * 0.18, sz * 0.24, sz, 6), M(0xe8e0cc));
                st.position.y = sz / 2;
                const cap = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(rnd() < 0.5 ? 0xb3312a : 0x7a4fb0));
                cap.position.y = sz;
                g.add(st, cap);
                return g;
            }

            const place = (obj, x, z, y = 0, rotY = rnd() * Math.PI * 2, sc = 1) => {
                obj.position.set(x, y, z); obj.rotation.y = rotY; obj.scale.setScalar(sc); deco.add(obj); return obj;
            };

            // A) Dense forest ring on the island rim (r 31.5 .. 34), leaving the fighting area clear
            const rimN = 58;
            for (let i = 0; i < rimN; i++) {
                const a = (i / rimN) * Math.PI * 2 + (rnd() - 0.5) * 0.08;
                const r = ARENA_RADIUS - 0.9 - rnd() * 1.8;
                const x = Math.cos(a) * r, z = Math.sin(a) * r;
                const k = rnd();
                let obj;
                if (k < 0.34) obj = makePalm();
                else if (k < 0.62) obj = makePine();
                else obj = makeRoundTree();
                place(obj, x, z, 0, undefined, 0.85 + rnd() * 0.5);
                if (obj.userData.top) state.palms = (state.palms || []).concat(obj);
            }
            // second thin outer row of bushes/rocks just at the water line
            for (let i = 0; i < 46; i++) {
                const a = rnd() * Math.PI * 2, r = ARENA_RADIUS - 0.3 - rnd() * 0.5;
                if (rnd() < 0.5) place(makeRock(0.6 + rnd() * 1.1), Math.cos(a) * r, Math.sin(a) * r, 0, undefined, 1);
                else { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + rnd() * 0.5, 1), leafMats[Math.floor(rnd() * 4)]); b.scale.y = 0.7; b.castShadow = true; place(b, Math.cos(a) * r, Math.sin(a) * r, 0.5); }
            }

            // B) Small low-profile clutter inside the arena (never blocks view or movement visually)
            //    Grass tufts (instanced cones), pebbles, flowers, mushrooms
            const tuftGeo = new THREE.ConeGeometry(0.09, 0.55, 4); tuftGeo.translate(0, 0.27, 0);
            const tuftMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 1 });
            const tufts = 2600;
            const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts);
            const dummy = new THREE.Object3D(); const col = new THREE.Color();
            for (let i = 0; i < tufts; i++) {
                const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (ARENA_RADIUS - 1.2);
                if (r < CENTER_RED_RADIUS + 1.2) { dummy.scale.setScalar(0.0001); }
                else {
                    dummy.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
                    dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * 6, (rnd() - 0.5) * 0.4);
                    dummy.scale.set(0.8 + rnd() * 0.8, 0.5 + rnd() * 1.1, 0.8 + rnd() * 0.8);
                }
                dummy.updateMatrix(); tuftMesh.setMatrixAt(i, dummy.matrix);
                col.setHSL(0.28 + rnd() * 0.08, 0.5, 0.18 + rnd() * 0.12); tuftMesh.setColorAt(i, col);
            }
            tuftMesh.instanceMatrix.needsUpdate = true; if (tuftMesh.instanceColor) tuftMesh.instanceColor.needsUpdate = true;
            deco.add(tuftMesh);

            const flowerGeo = new THREE.SphereGeometry(0.11, 6, 4); flowerGeo.translate(0, 0.45, 0);
            const flowers = 220;
            const flowerMesh = new THREE.InstancedMesh(flowerGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), flowers);
            const fcols = [0xf9a8d4, 0xfde047, 0xa5b4fc, 0xfb923c, 0xffffff];
            for (let i = 0; i < flowers; i++) {
                const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (ARENA_RADIUS - 2);
                dummy.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r); dummy.rotation.set(0, 0, 0);
                dummy.scale.setScalar(r < CENTER_RED_RADIUS + 1.5 ? 0.0001 : 0.8 + rnd() * 0.7);
                dummy.updateMatrix(); flowerMesh.setMatrixAt(i, dummy.matrix);
                col.setHex(fcols[Math.floor(rnd() * fcols.length)]); flowerMesh.setColorAt(i, col);
            }
            flowerMesh.instanceMatrix.needsUpdate = true; if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
            deco.add(flowerMesh);

            const pebGeo = new THREE.DodecahedronGeometry(0.18, 0);
            const pebs = 260;
            const pebMesh = new THREE.InstancedMesh(pebGeo, new THREE.MeshStandardMaterial({ color: 0x777b80, roughness: 1, flatShading: true }), pebs);
            for (let i = 0; i < pebs; i++) {
                const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (ARENA_RADIUS - 1.5);
                dummy.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
                dummy.scale.set(0.6 + rnd() * 1.4, 0.5 + rnd() * 0.6, 0.6 + rnd() * 1.1);
                dummy.updateMatrix(); pebMesh.setMatrixAt(i, dummy.matrix);
            }
            deco.add(pebMesh);

            for (let i = 0; i < 18; i++) {
                const a = rnd() * Math.PI * 2, r = 6 + rnd() * (ARENA_RADIUS - 10);
                place(makeMushroom(0.35 + rnd() * 0.4), Math.cos(a) * r, Math.sin(a) * r);
            }

            // C) Four ancient rune pillars just outside the inner orange ring (decor, flush with the ring edge)
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
                const r = INNER_RING_RADIUS + 3.2;
                place(makePillar(), Math.cos(a) * r, Math.sin(a) * r, 0, a);
            }

            // D) Glowing blue crystal / lantern accents on the rim between trees (soft light, no real lights = fast)
            const glowTex = T_glow();
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 + 0.13, r = ARENA_RADIUS - 3.4;
                const g = new THREE.Group();
                const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
                crystal.scale.y = 1.8; crystal.position.y = 1.0;
                const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x38bdf8, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
                halo.scale.set(3.4, 3.4, 1); halo.position.y = 1.0;
                const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.35, 6), rockMats[1]); stone.position.y = 0.17;
                g.add(stone, crystal, halo);
                state.crystals = state.crystals || []; state.crystals.push({ crystal, halo, ph: rnd() * 6 });
                place(g, Math.cos(a) * r, Math.sin(a) * r, 0, 0);
            }

            // E) Scenic rock islets with palms out in the ocean (outside WORLD_LIMIT so they never get in the way)
            const isletSpots = [[-78, -40], [72, -58], [-62, 66], [84, 44], [8, -96], [-12, 100], [-104, 12], [112, -6]];
            isletSpots.forEach(([ix, iz], idx) => {
                const ig = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(5 + rnd() * 3, 7 + rnd() * 3, 3, 10), M(0x5a5440, 0.95, { flatShading: true }));
                base.position.y = -0.6; ig.add(base);
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 0.5, 10), M(0x2f5a30, 1)); cap.position.y = 0.95; ig.add(cap);
                { const p1 = makePalm(7 + rnd() * 3); p1.position.set(rnd() * 2 - 1, 1, rnd() * 2 - 1); ig.add(p1); }
                if (idx % 2 === 0) { const p2 = makePalm(6 + rnd() * 2); p2.position.set(2 + rnd(), 1, -1.5); ig.add(p2); }
                else { const p3 = makePine(7); p3.position.set(-2, 1, 1.5); ig.add(p3); }
                for (let k = 0; k < 3; k++) { const rk = makeRock(0.8 + rnd()); rk.position.set(Math.cos(k * 2.1) * 5, -0.3, Math.sin(k * 2.1) * 5); ig.add(rk); }
                ig.position.set(ix, -0.4, iz);
                deco.add(ig);
            });

            // F) Distant night-stars/fireflies drifting over the island (cheap Points)
            const ffN = 90, ffPos = new Float32Array(ffN * 3);
            for (let i = 0; i < ffN; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * ARENA_RADIUS; ffPos[i*3] = Math.cos(a) * r; ffPos[i*3+1] = 0.8 + rnd() * 4; ffPos[i*3+2] = Math.sin(a) * r; }
            const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
            state.fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xfff1a8, size: 0.6, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
            state.ffBase = ffPos.slice();
            deco.add(state.fireflies);

            scene.add(deco);
        }

        function animateDecorations(t) {
            if (state.palms) state.palms.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.9 + i) * 0.015; });
            if (state.crystals) state.crystals.forEach(c => {
                const k = 0.75 + Math.sin(t * 2.2 + c.ph) * 0.25;
                c.halo.material.opacity = 0.55 * k + 0.2; c.crystal.rotation.y = t * 0.8 + c.ph;
            });
            if (state.runeBands) state.runeBands.forEach((r, i) => { r.material.opacity = 0.6 + Math.sin(t * 1.6 + i) * 0.3; });
            if (state.fireflies) {
                const a = state.fireflies.geometry.attributes.position.array, b = state.ffBase;
                for (let i = 0; i < a.length / 3; i++) {
                    a[i*3] = b[i*3] + Math.sin(t * 0.6 + i) * 0.8;
                    a[i*3+1] = b[i*3+1] + Math.sin(t * 0.9 + i * 1.7) * 0.5;
                    a[i*3+2] = b[i*3+2] + Math.cos(t * 0.5 + i * 0.9) * 0.8;
                }
                state.fireflies.geometry.attributes.position.needsUpdate = true;
            }
        }

        function animateOceanWaves(t) {
            if (!state.seaGeo) return;
            state._seaFrame = (state._seaFrame || 0) + 1;
            const pos = state.seaGeo.attributes.position;
            const count = pos.count;
            if (state._seaFrame % 2 === 0) { 
            const arr = pos.array;
            if (!state._seaXZ) {
                state._seaXZ = new Float32Array(count * 2);
                for (let i = 0; i < count; i++) { state._seaXZ[i*2] = arr[i*3]; state._seaXZ[i*2+1] = arr[i*3+2]; }
            }
            const xz = state._seaXZ;
            for (let i = 0; i < count; i++) {
                const x = xz[i*2];
                const z = xz[i*2+1];
                // Smooth ocean ripple strictly within ±0.12 -> max world y = -0.55 + 0.12 = -0.43 < 0.02
                const h = Math.sin(x * 0.11 + t * 1.65) * 0.065 + Math.cos(z * 0.13 + t * 1.35) * 0.055;
                arr[i*3+1] = h;
            }
            pos.needsUpdate = true;
            }

            if (state.seaTexture) {
                state.seaTexture.offset.x = (t * 0.02) % 1;
                state.seaTexture.offset.y = (t * 0.015) % 1;
            }
            if (state.foamRing) {
                const s = 1 + Math.sin(t * 2.1) * 0.012;
                state.foamRing.scale.set(s, s, 1);
                state.foamRing.position.y = -0.22 + Math.sin(t * 2.1) * 0.035;
                state.foamRing.material.opacity = 0.62 + Math.sin(t * 2.1) * 0.14;
            }
            if (state.seaSparkles) {
                state.seaSparkles.rotation.y = t * 0.01;
            }
        }

        /* ===== FX TOOLKIT v2: palettes, textures, slashes, beams, chains, impacts, auras ===== */
        const PAL=[{m:0x9a6a3a,l:0xf0c48a,d:0x3b2410},{m:0x38bdf8,l:0xe0f2fe,d:0x0c4a6e},{m:0x14b8a6,l:0xa7f3d0,d:0x064e3b},{m:0xfbbf24,l:0xfff3c4,d:0x78350f},{m:0xef4444,l:0xfdba74,d:0x7f1d1d},{m:0xfde047,l:0xffffff,d:0x38bdf8},{m:0xa855f7,l:0xffd700,d:0x1e1b4b}];
        const palOf=e=>PAL[e.trait.auraLevel];
        const hx=n=>'#'+n.toString(16).padStart(6,'0');
        const TX={};
        const tex=(k,w,h,f)=>TX[k]||(TX[k]=(()=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'));return new THREE.CanvasTexture(c);})());
        const T_glow=()=>tex('g',64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});
        const T_star=()=>tex('s',128,128,g=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.15,'rgba(255,255,255,.7)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);g.fillStyle='#fff';g.beginPath();g.ellipse(64,64,62,2.4,0,0,7);g.moveTo(66,64);g.ellipse(64,64,2.4,62,0,0,7);g.fill();});
        const T_slash=()=>tex('sl',256,256,g=>{g.translate(128,128);const r=g.createLinearGradient(0,-105,0,105);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.5,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.shadowColor='#fff';g.shadowBlur=12;g.beginPath();g.arc(-20,0,108,-1.1,1.1);g.arc(-86,0,150,.699,-.699,true);g.closePath();g.fill();});
        const T_ring=()=>tex('rg',128,128,g=>{const r=g.createRadialGradient(64,64,40,64,64,62);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);});
        const T_swirl=()=>tex('sw',256,256,g=>{g.translate(128,128);g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=7;g.lineCap='round';g.shadowColor='#fff';g.shadowBlur=10;for(let k=0;k<4;k++){g.rotate(1.5708);g.beginPath();for(let i=0;i<60;i++){const u=i/59,a=u*3.6,r=8+u*112;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.stroke();}});
        const T_mandala=(c1,c2)=>tex('m'+c1+c2,512,512,g=>{g.translate(256,256);g.shadowBlur=14;g.shadowColor=c1;[236,206,148,92].forEach((r,i)=>{g.strokeStyle=i%2?c2:c1;g.lineWidth=i?3:7;g.beginPath();g.arc(0,0,r,0,7);g.stroke();});for(let k=0;k<16;k++){g.save();g.rotate(k/16*6.283);g.globalAlpha=.55;g.fillStyle=c1;g.beginPath();g.moveTo(0,-148);g.quadraticCurveTo(28,-185,0,-206);g.quadraticCurveTo(-28,-185,0,-148);g.fill();g.globalAlpha=1;g.strokeStyle=c2;g.lineWidth=2;g.beginPath();g.moveTo(0,-92);g.lineTo(0,-148);g.stroke();g.restore();}for(let k=0;k<48;k++){g.save();g.rotate(k/48*6.283);g.fillStyle=c2;g.fillRect(-1.5,-254,3,k%2?10:22);g.restore();}});
        const T_eye=c=>tex('e'+c,256,128,g=>{g.translate(128,64);g.shadowColor=c;g.shadowBlur=24;const r=g.createRadialGradient(0,0,6,0,0,62);r.addColorStop(0,'#fff');r.addColorStop(.35,c);r.addColorStop(1,'rgba(0,0,0,.9)');g.fillStyle=r;g.beginPath();g.moveTo(-120,0);g.quadraticCurveTo(0,-95,120,0);g.quadraticCurveTo(0,95,-120,0);g.fill();g.strokeStyle=c;g.lineWidth=5;g.stroke();g.fillStyle='#000';g.beginPath();g.ellipse(0,0,9,52,0,0,7);g.fill();});
        const T_galaxy=()=>tex('gx',512,512,g=>{g.translate(256,256);const b=g.createRadialGradient(0,0,0,0,0,256);b.addColorStop(0,'rgba(255,230,160,1)');b.addColorStop(.12,'rgba(168,85,247,.75)');b.addColorStop(.5,'rgba(60,30,140,.4)');b.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=b;g.fillRect(-256,-256,512,512);for(let i=0;i<1400;i++){const u=Math.random(),a=u*7+(i%3)*2.094+(Math.random()-.5)*.5,r=14+u*236;g.fillStyle='rgba('+(200+Math.random()*55|0)+','+(180+Math.random()*75|0)+',255,'+(.25+Math.random()*.7)+')';g.fillRect(Math.cos(a)*r,Math.sin(a)*r,1+Math.random()*2.2,1+Math.random()*2.2);}g.strokeStyle='rgba(255,215,120,.95)';g.lineWidth=4;g.beginPath();g.arc(0,0,26,0,7);g.stroke();});
        const spr=(c,s,o=1,tx=T_glow(),add=true)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,color:c,transparent:true,opacity:o,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false}));m.scale.set(s,s,1);return m;};
        const bm=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
        const plane=(tx,s,y,z,o=1,ar=1,add=true)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s*ar),new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:o,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(0,y,z);return m;};
        const flat=(g,m,y)=>{const x=new THREE.Mesh(g,m);x.rotation.x=-Math.PI/2;x.position.y=y;return x;};
        const lineMesh=(n,c)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));l.frustumCulled=false;return l;};
        function mkSword(P,len=1.7,w=.13){const g=new THREE.Group(),bg=new THREE.ConeGeometry(w,len,4);bg.scale(1,1,.35);const b=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:P.l}));b.position.y=len/2+.3;const gl=new THREE.Mesh(new THREE.ConeGeometry(w*1.9,len*1.08,4),bm(P.m,.55));gl.position.y=b.position.y;gl.scale.z=.5;const gd=new THREE.Mesh(new THREE.BoxGeometry(w*3.2,.07,.12),new THREE.MeshBasicMaterial({color:P.m}));gd.position.y=.3;const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.4,6),new THREE.MeshBasicMaterial({color:P.d}));h.position.y=.08;g.add(b,gl,gd,h);return g;}
        function motes(ag,n,a,b,rad,H,sz,spd){const m=createRisingParticles(n,a,b,rad,H,sz);ag.add(m);return (t,dt)=>{const A=m.geometry.attributes.position.array;for(let i=1;i<A.length;i+=3){A[i]+=dt*spd;if(A[i]>H)A[i]=.15;}m.geometry.attributes.position.needsUpdate=true;m.rotation.y=t*spd*.45;};}
        function flames(ag,n,P,R,H,sz,sp=1.6){const f=[];for(let i=0;i<n;i++){const s=spr(i%3?P.m:P.l,sz,.85);s.userData={o:i/n,a:i*2.4,r:R*(.6+Math.random()*.6)};ag.add(s);f.push(s);}return t=>f.forEach(s=>{const d=s.userData,u=(t*sp*.5+d.o)%1,a=d.a+t*2+u*3,r=d.r*(1-u*.4);s.position.set(Math.cos(a)*r,.2+u*H,Math.sin(a)*r);s.scale.setScalar(sz*(1-u*.7)*(.85+.3*Math.sin(t*12+d.a)));s.material.opacity=.85*(1-u*u);});}
        function ring(p,P,R=4,c=null,dur=.5,y=.12){const m=bm(c==null?P.l:c,.9),r=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),m);r.rotation.x=-Math.PI/2;r.position.set(p.x,y,p.z);addVFX(r,dur,(o,t)=>{o.scale.setScalar(.3+t*R);m.opacity=.9*(1-t);});}
        function sparks(p,P,n=12,y=1.6,sp=7){for(let i=0;i<n;i++){const s=spr(i%2?P.l:P.m,.3+Math.random()*.25);s.position.set(p.x,y,p.z);const a=Math.random()*6.283,v=sp*(.4+Math.random());const vx=Math.cos(a)*v,vz=Math.sin(a)*v;let vy=(Math.random()-.2)*v;addVFX(s,.55+Math.random()*.3,(m,t,dt)=>{m.position.x+=vx*dt;m.position.z+=vz*dt;m.position.y=Math.max(.1,m.position.y+vy*dt);vy-=16*dt;m.material.opacity=1-t;});}}
        function slash(p,rot,P,s=5.5,y=2){const a=spr(P.l,s,1,T_slash()),b=spr(P.m,s*1.3,.8,T_slash()),st=spr(0xffffff,s,1,T_star()),g=new THREE.Group();g.add(b,a,st);g.position.set(p.x,y,p.z);addVFX(g,.4,(m,t)=>{const e=1-Math.pow(1-t,3);a.material.rotation=b.material.rotation=rot+e*.8;a.scale.setScalar(s*(.55+e*.6));b.scale.setScalar(s*1.3*(.55+e*.7));a.material.opacity=1-t;b.material.opacity=.8*(1-t);st.scale.setScalar(Math.max(.01,s*(1-t)));st.material.opacity=1-t;});sparks(p,P,8,y,6);}
        function slashX(p,P,rot=0){slash(p,rot+.7,P);slash(p,rot-.7,P,4.6);}
        function dashFx(e){const P=palOf(e);if(Math.random()<.55)spawnAfterimage(e,P.m);const L=3+Math.random()*3,g=new THREE.CylinderGeometry(.05,.05,L,5);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,bm(Math.random()<.5?P.l:P.m,.9));m.position.set(e.pos.x-e.dashDir.x*L*.5+(Math.random()-.5)*1.6,.5+Math.random()*2.6,e.pos.z-e.dashDir.z*L*.5+(Math.random()-.5)*1.6);m.rotation.y=Math.atan2(e.dashDir.x,e.dashDir.z);addVFX(m,.25,(o,t)=>{o.material.opacity=.9*(1-t);o.scale.z=1-t*.6;});}
        function gripFx(att,tgt,P){const g=new THREE.Group(),r=new THREE.Mesh(new THREE.TorusGeometry(.75,.09,8,24),bm(P.l,.95)),pg=new THREE.CylinderGeometry(.16,.5,8,12,1,true);pg.translate(0,4,0);const pl=new THREE.Mesh(pg,bm(P.m,.35)),st=spr(P.l,3.2,1,T_star());r.rotation.x=Math.PI/2;g.add(r,pl,st);addVFX(g,2,(m,t,dt)=>{if(!att.grabTarget){m.visible=false;return;}m.position.set(tgt.pos.x,tgt.pos.y+2.9,tgt.pos.z);r.rotation.z+=.3;r.scale.setScalar(1+Math.sin(t*50)*.07);st.scale.setScalar(2.6+Math.sin(t*30)*.6);});}
        function zapCage(tg,P,dur){const g=new THREE.Group(),ls=[];for(let i=0;i<4;i++){const l=lineMesh(10,i%2?0xffffff:P.l);g.add(l);ls.push(l);}addVFX(g,dur,m=>{m.position.copy(tg.pos);ls.forEach((l,i)=>{const A=l.geometry.attributes.position;for(let s=0;s<10;s++){const a=i*1.57+(Math.random()-.5)*1.3,r=1.3+Math.random()*.8;A.setXYZ(s,Math.cos(a)*r,s/9*3.4,Math.sin(a)*r);}A.needsUpdate=true;l.visible=Math.random()<.85;});});}
        function spawnBeam(o,dir,len,P){const g=new THREE.Group();g.position.copy(o);g.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);const mk=(r,c,op)=>{const gm=new THREE.CylinderGeometry(r,r*1.15,len,16,1,true);gm.translate(0,len/2,0);const m=new THREE.Mesh(gm,bm(c,op));g.add(m);return m;};const cs=[mk(.34,0xffffff,1),mk(.8,P.l,.75),mk(1.5,P.m,.4)],op=[1,.75,.4],ln=[];for(let i=0;i<5;i++){const l=lineMesh(26,i%2?0xffffff:P.l);g.add(l);ln.push(l);}const orb=spr(P.m,7,.9),orb2=spr(0xffffff,3.4,1),endF=spr(P.l,6,.9);g.add(orb,orb2,endF);addVFX(g,.62,(m,t)=>{const e=Math.max(.001,Math.min(1,t*7)),f=1-Math.max(0,(t-.55)/.45);cs.forEach((c,i)=>{const w=Math.max(.001,f*(1+Math.sin(t*90+i)*.08));c.scale.set(w,e,w);c.material.opacity=op[i]*f;});ln.forEach(l=>{const A=l.geometry.attributes.position;for(let s=0;s<26;s++){const a=Math.random()*6.283,r=(.9+Math.random()*1.1)*f;A.setXYZ(s,Math.cos(a)*r,s/25*len*e,Math.sin(a)*r);}A.needsUpdate=true;});orb.scale.setScalar(Math.max(.01,7*f*(1+Math.sin(t*60)*.1)));orb2.scale.setScalar(Math.max(.01,3.4*f));endF.position.y=len*e;endF.scale.setScalar(Math.max(.01,6*f));});ring(o,P,6,P.l,.6);sparks(o,P,14,o.y,8);}
        function spawnHadesChains(tg,P,dur=3){const g=new THREE.Group(),sig=plane(T_mandala(hx(P.m),hx(P.l)),6.4,.1,0,.95);sig.rotation.x=-Math.PI/2;g.add(sig);const lg=new THREE.TorusGeometry(.21,.06,6,10),lm=new THREE.MeshStandardMaterial({color:0x15101f,emissive:P.m,emissiveIntensity:.9,metalness:.85,roughness:.3,transparent:true}),N=7,L=15,ch=[],w=[];for(let c=0;c<N;c++){const ls=[];for(let i=0;i<L;i++){const m=new THREE.Mesh(lg,lm);g.add(m);ls.push(m);}ch.push({a:c/N*6.283,ls});}for(let i=0;i<10;i++){const s=spr(i%2?P.m:P.d,1.6,.7,T_glow(),i%2===1);s.userData.o=i/10;g.add(s);w.push(s);}addVFX(g,dur,(m,t,dt)=>{m.position.copy(tg.pos);const k=t*dur,gr=Math.min(1,k/.5),fd=t>.88?(1-t)/.12:1;lm.opacity=fd;sig.material.opacity=.95*fd;sig.rotation.z+=dt*1.4;ch.forEach(c=>c.ls.forEach((l,i)=>{const u=i/(L-1);if(u>gr){l.visible=false;return;}l.visible=true;const a=c.a+u*5.4+k*.5,r=3.4-u*1.9+Math.sin(k*8+i)*.04;l.position.set(Math.cos(a)*r,.15+u*3.3,Math.sin(a)*r);l.rotation.set(i%2?1.57:.4,a+1.57,0);}));w.forEach(s=>{const u=(k*.6+s.userData.o)%1,a=s.userData.o*40+k;s.position.set(Math.cos(a)*(1.8+u),.2+u*3.6,Math.sin(a)*(1.8+u));s.scale.setScalar(1.6*(1-u*.5));s.material.opacity=.7*(1-u)*fd;});});ring(tg.pos,P,5,P.m,.6);sparks(tg.pos,P,14,1.2,6);}
        function spawnGravityVFX(ent,dir,P,dur=1.2){const g=new THREE.Group(),core=new THREE.Mesh(new THREE.SphereGeometry(.95,20,16),new THREE.MeshBasicMaterial({color:0x000000})),star=spr(0xffffff,3.6,1,T_star()),halo=spr(P.m,6.5,.9),sz=[4.2,5.6,7.2],rs=[P.l,P.m,P.m].map((c,i)=>spr(c,sz[i],.9,T_ring())),sw=[spr(P.m,9,.8,T_swirl()),spr(P.l,6.5,.7,T_swirl())];g.add(halo,...sw,...rs,core,star);const pt=[];for(let i=0;i<26;i++){const s=spr(i%2?P.l:P.m,.4);s.userData={a:Math.random()*6.283,r:3+Math.random()*4,o:Math.random()};g.add(s);pt.push(s);}addVFX(g,dur,(m,t)=>{m.position.set(ent.pos.x+dir.x*1.7,2.2,ent.pos.z+dir.z*1.7);const k=t*dur,e=Math.min(1,t*6),f=t>.82?(1-t)/.18:1;m.scale.setScalar(Math.max(.01,e*f*.85));sw[0].material.rotation=-k*5;sw[1].material.rotation=k*7;rs.forEach((r,i)=>{r.material.rotation=k*(2+i);r.scale.setScalar(sz[i]*(1+Math.sin(k*10+i)*.05));});star.scale.setScalar(3.6*(1+Math.sin(k*18)*.12));pt.forEach(s=>{const d=s.userData,u=(k*.9+d.o)%1,a=d.a+u*5,r=d.r*(1-u)+.4;s.position.set(Math.cos(a)*r,Math.sin(k*3+d.a)*.4,Math.sin(a)*r);});if(t>.8&&!m.userData.x){m.userData.x=1;ring(m.position,P,6,P.l,.5,1.8);sparks(m.position,P,16,1.8,8);}});ring(ent.pos,P,5,P.m,.6);}
        function spawnSlamVFX(p,rad,P){const g=new THREE.Group();g.position.set(p.x,.08,p.z);const cm=bm(P.l,1),sm=new THREE.MeshStandardMaterial({color:P.d,emissive:P.m,emissiveIntensity:.6,roughness:.35,metalness:.4,flatShading:true,transparent:true}),gm=bm(P.l,.32),cr=[],sp=[],rk=[],du=[];for(let i=0;i<14;i++){const L=rad*(.5+Math.random()*.55),pv=new THREE.Group(),c=new THREE.Mesh(new THREE.PlaneGeometry(L,.15+Math.random()*.15),cm);c.geometry.translate(L/2,0,0);c.rotation.x=-Math.PI/2;pv.rotation.y=i/14*6.283+Math.random()*.3;pv.add(c);g.add(pv);cr.push(c);}for(let i=0;i<13;i++){const a=i/13*6.283+Math.random()*.4,r=rad*(.12+Math.random()*.68),h=2+Math.random()*3,geo=new THREE.ConeGeometry(.5+Math.random()*.4,h,5);geo.translate(0,h/2,0);const m=new THREE.Mesh(geo,sm),gl=new THREE.Mesh(geo,gm);gl.scale.set(1.18,1.02,1.18);m.add(gl);m.position.set(Math.cos(a)*r,0,Math.sin(a)*r);m.rotation.set(Math.sin(a)*.45,Math.random()*3,-Math.cos(a)*.45);m.scale.y=.01;m.userData.d=Math.random()*.08;g.add(m);sp.push(m);}const rg=new THREE.IcosahedronGeometry(.26,0);for(let i=0;i<16;i++){const m=new THREE.Mesh(rg,sm),a=Math.random()*6.283,v=5+Math.random()*9;m.userData={vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:7+Math.random()*9};m.position.y=.3;g.add(m);rk.push(m);}for(let i=0;i<14;i++){const s=spr(0x9a8466,3,.6,T_glow(),false),a=Math.random()*6.283;s.userData={a,r:Math.random()*rad*.7,v:.8+Math.random()*1.4};g.add(s);du.push(s);}const fl=spr(P.l,rad*1.3,1,T_star()),dk=new THREE.Mesh(new THREE.CircleGeometry(rad,40),bm(P.m,.3)),pg=new THREE.CylinderGeometry(rad*.35,rad*.5,10,20,1,true);dk.rotation.x=-Math.PI/2;fl.position.y=1.2;pg.translate(0,5,0);const pil=new THREE.Mesh(pg,bm(P.l,.5));g.add(fl,dk,pil);addVFX(g,1.5,(m,t,dt)=>{cm.opacity=Math.max(0,1-Math.max(0,t-.4)/.6);cr.forEach(c=>c.scale.x=Math.max(.01,Math.min(1,t*5)));sm.opacity=t>.7?(1-t)/.3:1;sp.forEach(s=>{const e=Math.min(1,Math.max(0,t*9-s.userData.d*9));s.scale.y=Math.max(.01,e*(1-Math.pow(Math.max(0,(t-.65)/.35),2)));});rk.forEach(r=>{const d=r.userData;r.position.x+=d.vx*dt;r.position.z+=d.vz*dt;r.position.y=Math.max(.2,r.position.y+d.vy*dt);d.vy-=26*dt;r.rotation.x+=dt*6;});du.forEach(s=>{const d=s.userData;s.position.set(Math.cos(d.a)*(d.r+t*rad*.6),.4+t*d.v*3,Math.sin(d.a)*(d.r+t*rad*.6));s.scale.setScalar(3+t*5);s.material.opacity=.6*(1-t);});fl.scale.setScalar(Math.max(.01,rad*1.3*(1-t)));fl.material.opacity=Math.max(0,1-t*2);dk.material.opacity=.3*(1-t);pil.scale.set(1+t*.6,1,1+t*.6);pil.material.opacity=.5*Math.max(0,1-t*3);});ring(p,P,rad*1.15,P.l,.7);ring(p,P,rad*.8,P.m,.9);sparks(p,P,22,.6,11);}
        function buildAura(ag,lvl,P){
            const u=[],C=hx(P.m),C2=hx(P.l),PI=Math.PI;
            const gnd=s=>{const m=plane(T_mandala(C,C2),s,.1,0,.85);m.rotation.x=-PI/2;ag.add(m);u.push(t=>{m.rotation.z=t*.5;});};
            if(lvl===0){
                ag.add(flat(new THREE.RingGeometry(1.3,1.6,40),bm(P.m,.5),.08));
                const G=new THREE.Group(),pg=new THREE.DodecahedronGeometry(.18,0),pm=new THREE.MeshStandardMaterial({color:P.m,roughness:.9,flatShading:true});
                for(let i=0;i<6;i++){const m=new THREE.Mesh(pg,pm);m.userData.a=i/6*6.283;G.add(m);}ag.add(G);
                u.push(t=>G.children.forEach((m,i)=>{const a=m.userData.a+t*.9;m.position.set(Math.cos(a)*2,.8+Math.sin(t*2+i)*.3,Math.sin(a)*2);m.rotation.x=t*2+i;}),flames(ag,9,P,1.5,2,.9,1),motes(ag,14,P.l,P.m,1.9,2.8,.14,.6));
            } else if(lvl===1){
                gnd(5.2);const G=new THREE.Group();
                for(let i=0;i<6;i++){const s=mkSword(P,1.9);s.userData.a=i/6*6.283;G.add(s);}ag.add(G);
                u.push(t=>G.children.forEach((s,i)=>{const a=s.userData.a+t*1.7;s.position.set(Math.cos(a)*2.1,2+Math.sin(t*3+i*1.3)*.35,Math.sin(a)*2.1);s.rotation.set(.3,-a,PI);}),flames(ag,12,P,1.7,3.2,.8,1.4),motes(ag,22,P.l,P.m,2,3.4,.18,1.5));
            } else if(lvl===2){
                const b=plane(T_mandala(C,C2),5.4,2.3,-1.35,.95),lot=new THREE.Group(),lg=new THREE.ConeGeometry(.38,1.5,5);lg.translate(0,.75,0);
                for(let i=0;i<8;i++){const p=new THREE.Mesh(lg,bm(i%2?P.l:P.m,.7)),a=i/8*6.283;p.position.set(Math.cos(a)*1.45,.05,Math.sin(a)*1.45);p.userData.a=a;lot.add(p);}
                const orbs=[0,1,2].map(i=>{const s=spr(P.l,1.1);s.userData.a=i*2.094;ag.add(s);return s;});ag.add(b,lot);
                u.push(t=>{b.rotation.z=t*.5;const th=.55+.25*Math.sin(t*2);lot.children.forEach(p=>{const a=p.userData.a;p.rotation.set(Math.sin(a)*th,0,-Math.cos(a)*th);});orbs.forEach((s,i)=>{const a=s.userData.a+t*2;s.position.set(Math.cos(a)*2.4,1.8+Math.sin(t*3+i)*.6,Math.sin(a)*2.4);});},flames(ag,14,P,1.6,3.4,.9,1.4),motes(ag,34,P.l,P.m,2.2,3.8,.22,1.5));
            } else if(lvl===3){
                const b=plane(T_mandala(C,C2),7.2,2.6,-1.5,.95),F=new THREE.Group();F.position.set(0,1.5,-1.75);
                for(let i=0;i<9;i++){const a=(i/8-.5)*2.7,s=mkSword(P,2.6);s.position.set(Math.sin(a)*1.5,.4+Math.cos(a)*1.5,0);s.rotation.z=-a;F.add(s);}
                ag.add(b,F);gnd(5);
                u.push(t=>{b.rotation.z=t*.4;F.children.forEach((s,i)=>s.scale.setScalar(1+Math.sin(t*3+i*.7)*.08));},flames(ag,22,P,1.6,3.6,1.1,1.8),motes(ag,40,P.l,P.m,2.3,3.9,.25,1.8));
            } else if(lvl===4){
                const E=[-1,1].map(s=>{const e=plane(T_eye(C),3.6,3.7,-1.8,1,.5,false),gl=spr(P.m,7,.6);e.position.x=s*2.1;e.rotation.z=-s*.18;gl.position.set(s*2.1,3.7,-1.9);ag.add(e,gl);return {e,gl};});
                const W=new THREE.Group(),wm=[bm(P.m,.85),bm(P.l,.8),bm(0xf97316,.9)],wp=[];W.position.set(0,1.85,-.8);
                for(const s of[-1,1])for(let j=0;j<5;j++){const p=new THREE.Mesh(new THREE.ConeGeometry(.3-j*.03,1.9+j*.35,5),wm[j%3]);p.position.set(s*(1.3+j*.36),.1+j*.34,-.14-j*.1);p.rotation.z=-s*(.62+j*.18);p.userData={b:p.rotation.z,s,ph:j*.95};W.add(p);wp.push(p);}
                ag.add(W);gnd(5.4);
                u.push(t=>{wp.forEach(p=>{const d=p.userData;p.rotation.z=d.b+d.s*Math.sin(t*6.5+d.ph)*.14;p.scale.y=.88+Math.sin(t*10+d.ph)*.18;});E.forEach((o,i)=>{o.e.scale.y=(t+i*.3)%3.5<.16?.08:1;o.gl.scale.setScalar(6.5+Math.sin(t*6+i)*.8);});},flames(ag,34,P,1.8,4.3,1.4,2.2),motes(ag,50,P.l,P.m,2.5,4.4,.28,2.4));
            } else if(lvl===5){
                const b=plane(T_mandala(C,hx(P.d)),9.4,2.5,-1.7,.95),b2=plane(T_mandala(hx(P.d),C2),6,2.5,-1.65,.85),R=new THREE.Group(),bo=[];R.position.set(0,2.5,-1.85);
                for(let i=0;i<10;i++){const a=i/10*6.283,s=mkSword(P,2.8);s.position.set(Math.sin(a)*2.9,Math.cos(a)*2.9,0);s.rotation.z=-a;R.add(s);}
                ag.add(b,b2,R);gnd(5.4);
                for(let i=0;i<7;i++){const l=lineMesh(8,i%2?0xffffff:P.d);ag.add(l);bo.push(l);}
                let bt=0;const fl=[0,1].map(()=>{const s=spr(0xffffff,3,.9,T_star());ag.add(s);return s;});
                u.push((t,dt)=>{b.rotation.z=t*.35;b2.rotation.z=-t*.6;R.rotation.z=t*.5;bt-=dt;if(bt<=0){bt=.07;updateBolts(bo);}fl.forEach((s,i)=>{s.position.set((i?1:-1)*1.6,2.4+Math.sin(t*9+i*3)*.3,.5);s.scale.setScalar(Math.random()<.2?4.2:2.4);});},flames(ag,28,P,1.8,4.6,1.2,2),motes(ag,60,0xffffff,P.m,2.6,4.8,.26,2));
            } else {
                const gx=plane(T_galaxy(),13,2.7,-2.1,.95),im=plane(T_mandala(C2,C),6.4,2.7,-1.7,.9),P3=new THREE.Group();P3.rotation.x=.5;
                [[0x38bdf8,.5,3.2,1.7],[0xfb923c,.7,3.8,1.1],[0xe9d5ff,.4,4.4,.7]].forEach(([c,r,d,sp],i)=>{const pl=new THREE.Group(),rg=new THREE.Mesh(new THREE.RingGeometry(r*1.4,r*1.9,24),bm(c,.6));rg.rotation.x=1.2;pl.add(new THREE.Mesh(new THREE.SphereGeometry(r,14,12),new THREE.MeshBasicMaterial({color:c})),rg,spr(c,r*4,.5));pl.userData={d,sp,o:i*2.1};P3.add(pl);});
                ag.add(gx,im,P3);gnd(6.2);
                const pg=new THREE.CylinderGeometry(1.45,2.05,22,28,1,true);pg.translate(0,11,0);ag.add(new THREE.Mesh(pg,bm(P.l,.14)));
                const ss=[0,1,2].map(i=>{const s=spr(0xffffff,1.2,1,T_star());s.userData.o=i/3;ag.add(s);return s;});
                u.push(t=>{gx.rotation.z=t*.18;im.rotation.z=-t*.45;P3.children.forEach(pl=>{const d=pl.userData,a=t*d.sp+d.o;pl.position.set(Math.cos(a)*d.d,Math.sin(a*1.3)*.4+2,Math.sin(a)*d.d);});ss.forEach(s=>{const k=(t*.5+s.userData.o)%1;s.position.set(-5+k*10,6.2-k*5+s.userData.o*3,-2.4);s.material.opacity=Math.sin(k*3.14);});},flames(ag,26,P,1.8,4.8,1.2,2),motes(ag,110,0xffffff,0xc084fc,3.6,5,.24,1.8));
            }
            return u;
        }

        /* =====================================================================
         * 7. 3D PLUMP OVAL CHARACTERS WRAPPED 100% BY ORIGINAL PNG + 7-TIER VFX
         * ===================================================================== */
        let sharedOvalGeometry = null;

        // Symmetrical front/back spherical UV wrap so original PNG covers 100% of Oval cleanly without seams
        function getFullWrapOvalGeometry() {
            if (sharedOvalGeometry) return sharedOvalGeometry;
            const geo = new THREE.SphereGeometry(1.0, 48, 36);
            const pos = geo.attributes.position;
            const uv = geo.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const u = 0.5 + Math.asin(THREE.MathUtils.clamp(x, -1, 1)) / Math.PI;
                const v = 0.5 + Math.asin(THREE.MathUtils.clamp(y, -1, 1)) / Math.PI;
                uv.setXY(i, u, v);
            }
            uv.needsUpdate = true;
            sharedOvalGeometry = geo;
            return geo;
        }

        function createOvalCharacterMesh(cfg, trait) {
            const root = new THREE.Group();
            const bodyPivot = new THREE.Group();
            root.add(bodyPivot);

            const shadow = new THREE.Mesh(
                new THREE.CircleGeometry(1.25, 28),
                new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.34, depthWrite: false })
            );
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.y = 0.06;
            root.add(shadow);

            const ovalGeo = getFullWrapOvalGeometry();
            const pTex = traitPortraits[trait.id].texture;
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: pTex,
                emissiveMap: pTex,
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 0.42,
                roughness: 0.35,
                metalness: 0.04
            });
            const ovalMesh = new THREE.Mesh(ovalGeo, bodyMat);
            ovalMesh.scale.set(OVAL_SCALE_X, OVAL_SCALE_Y, OVAL_SCALE_Z);
            ovalMesh.position.y = OVAL_CENTER_Y;
            ovalMesh.castShadow = true;
            ovalMesh.receiveShadow = true;
            bodyPivot.add(ovalMesh);

            // Rim Aura Shell around Oval
            const rimMat = new THREE.MeshBasicMaterial({
                color: trait.hex,
                transparent: true,
                opacity: trait.auraLevel === 0 ? 0.04 : Math.min(0.42, 0.12 + trait.auraLevel * 0.05),
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const rimShell = new THREE.Mesh(ovalGeo, rimMat);
            rimShell.scale.set(OVAL_SCALE_X + 0.08, OVAL_SCALE_Y + 0.09, OVAL_SCALE_Z + 0.08);
            rimShell.position.y = OVAL_CENTER_Y;
            bodyPivot.add(rimShell);

            // Base Stance Ring (Orange = Võ, Violet = Phép)
            const kitRingMat = new THREE.MeshBasicMaterial({ color: cfg.accentColor, transparent: true, opacity: 0.92 });
            const kitRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.055, 8, 40), kitRingMat);
            kitRing.rotation.x = Math.PI / 2;
            kitRing.position.y = 0.24;
            bodyPivot.add(kitRing);

            // Stun Ring & Purple Blind Wireframe Sphere
            const stunRing = new THREE.Group();
            stunRing.position.set(0, 3.68, 0);
            const st = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.075, 8, 28), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            st.rotation.x = Math.PI / 2;
            stunRing.add(st);
            stunRing.visible = false;

            const blindOrb = new THREE.Mesh(
                new THREE.SphereGeometry(1.82, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.46, wireframe: true })
            );
            blindOrb.position.set(0, OVAL_CENTER_Y, 0);
            blindOrb.visible = false;

            // Invisible Hitbox for Reliable Cursor Targeting
            const hitbox = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 3.7, 12),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            hitbox.position.y = 1.8;
            hitbox.userData.entityId = cfg.id;

            const auraGroup = new THREE.Group();
            root.add(stunRing, blindOrb, hitbox, auraGroup);

            return { root, bodyPivot, bodyMat, rimMat, kitRingMat, stunRing, blindOrb, hitbox, auraGroup, auraRefs: {} };
        }

        function createRisingParticles(count, hex1, hex2, maxRad, maxH, size) {
            const pos = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            const c1 = new THREE.Color(hex1), c2 = new THREE.Color(hex2);
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 0.85 + Math.random() * (maxRad - 0.85);
                pos[i * 3] = Math.cos(a) * r;
                pos[i * 3 + 1] = Math.random() * maxH;
                pos[i * 3 + 2] = Math.sin(a) * r;
                const c = i % 2 === 0 ? c1 : c2;
                col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            return new THREE.Points(geo, new THREE.PointsMaterial({
                size, vertexColors: true, transparent: true, opacity: 0.94,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
        }

        function applyTraitVisualsToEntity(entity, trait) {
            entity.trait = trait;
            const mp = entity.meshParts;
            const ag = mp.auraGroup;
            while (ag.children.length > 0) ag.remove(ag.children[0]);
            mp.auraRefs = {};

            const pTex = traitPortraits[trait.id].texture;
            mp.bodyMat.map = pTex;
            mp.bodyMat.emissiveMap = pTex;
            mp.bodyMat.needsUpdate = true;

            mp.rimMat.color.setHex(trait.hex);
            mp.rimMat.opacity = trait.auraLevel === 0 ? 0.04 : Math.min(0.42, 0.12 + trait.auraLevel * 0.05);

            if (entity.overheadPortrait) {
                copyPortraitToCanvas(entity.overheadPortrait, trait.id);
                entity.overheadPortrait.style.borderColor = trait.color;
            }
            if (entity.overheadTraitEl) {
                entity.overheadTraitEl.textContent = trait.name;
                entity.overheadTraitEl.style.color = trait.color;
            }

            mp.auraRefs = { upd: buildAura(ag, trait.auraLevel, PAL[trait.auraLevel]) };
        }

        /* =====================================================================
         * 8. ENTITY CREATION (SAFE ISLAND SPAWNS)
         * ===================================================================== */
        function createEntity(opts) {
            const initTrait = opts.trait || TRAITS[0];
            const meshParts = createOvalCharacterMesh(opts, initTrait);
            meshParts.root.position.set(opts.x, 0, opts.z);
            state.scene.add(meshParts.root);

            const ent = {
                id: opts.id, name: opts.name, role: opts.role, isPlayer: opts.role === 'player',
                isRemote: opts.role === 'remote', netId: opts.netId || null, killStacks: 0, _force: false,
                trait: initTrait, hp: BASE_MAX_HP, maxHp: BASE_MAX_HP, dead: false, respawnTimer: 0,
                spawnPos: new THREE.Vector3(opts.x, 0, opts.z),
                pos: meshParts.root.position,
                baseGroundY: 0,
                facing: opts.facing || 0,
                meshParts,
                endlagTimer: 0, endlagMax: 0, stunTimer: 0, stunMax: 0, blindedTimer: 0,
                grabTarget: null, grabTimer: 0, grabbedBy: null,
                dashTimer: 0, dashDir: new THREE.Vector3(), dashSpeed: 0, dashIsGrab: false,
                knockbackTimer: 0, knockbackVel: new THREE.Vector3(),
                castAnimTimer: 0, castAnimType: '', walkCycle: 0, isMoving: false, trailTimer: 0,
                inSea: false, seaTickTimer: 0, seaSplashTimer: 0, lastHitBy: null, lastHitTime: 0,
                cooldowns: { melee_z: 0, melee_x: 0, melee_c: 0, magic_z: 0, magic_x: 0, magic_c: 0, dash_q: 0 },
                cooldownMax: { melee_z: 6, melee_x: 8, melee_c: 5, magic_z: 5, magic_x: 7, magic_c: 15, dash_q: 1.5 },
                aiThinkTimer: Math.random() * 0.7, aiStrafeDir: Math.random() < 0.5 ? 1 : -1,
                magicXChargeTimer: 0,
                overheadEl: null, overheadPortrait: null, overheadTraitEl: null
            };

            if (!ent.isPlayer) {
                const el = document.createElement('div');
                el.className = 'bot-overhead';
                const barCls = opts.role === 'remote' ? 'from-rose-500 to-orange-500' : opts.role === 'bot_melee' ? 'from-orange-500 to-red-500'
                    : (opts.role === 'bot_magic' ? 'from-violet-500 to-fuchsia-500' : 'from-emerald-400 to-teal-500');
                el.innerHTML = `
                    <div class="bot-status-pill hidden"></div>
                    <div class="flex items-center gap-1.5 mb-0.5 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-600/70 shadow-lg">
                        <canvas class="bot-portrait-cv w-6 h-6 rounded-full border border-amber-300 shrink-0" width="40" height="40"></canvas>
                        <div class="leading-none text-left">
                            <div class="text-[10px] font-black text-white whitespace-nowrap">${escapeHtml(opts.name)}</div>
                            <div class="bot-trait-tag text-[9px] font-extrabold whitespace-nowrap">${initTrait.name}</div>
                        </div>
                    </div>
                    <div class="w-32 h-2.5 rounded-full bg-slate-950/90 border border-slate-500/80 overflow-hidden shadow">
                        <div class="bot-hp-fill h-full bg-gradient-to-r ${barCls} transition-all duration-100" style="width:100%"></div>
                    </div>
                    <div class="bot-hp-num text-[10px] font-extrabold text-white drop-shadow-[0_1px_3px_#000] mt-0.5">1000 / 1000</div>
                `;
                document.getElementById('world-overlay').appendChild(el);
                ent.overheadEl = el;
                ent.overheadPortrait = el.querySelector('.bot-portrait-cv');
                ent.overheadTraitEl = el.querySelector('.bot-trait-tag');
            }

            applyTraitVisualsToEntity(ent, initTrait);
            return ent;
        }

        function initEntities() {
            const sp = pickSpawn();
            state.player = createEntity({
                id: 'player', name: 'Bạn', role: 'player', trait: state.currentTrait,
                x: sp.x, z: sp.z, facing: Math.atan2(-sp.x, -sp.z), accentColor: 0xf97316
            });
            state.bots = []; // remote players are added by the network layer
        }

        /* =====================================================================
         * 9. 3D COMBAT VFX & FLOATING TEXTS
         * ===================================================================== */
        function addVFX(mesh, duration, updateFn) {
            state.scene.add(mesh);
            state.vfxList.push({ mesh, age: 0, duration, updateFn });
        }
        function triggerShake(intensity = 0.32, dur = 0.22) {
            state.shakeIntensity = Math.max(state.shakeIntensity, intensity);
            state.shakeTime = Math.max(state.shakeTime, dur);
        }
        function spawnFloatingText(pos, text, color = '#ffffff', scale = 1.0) {
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.textContent = text;
            el.style.color = color;
            el.style.fontSize = `${Math.round(16 * scale)}px`;
            document.getElementById('world-overlay').appendChild(el);
            state.floatingTexts.push({
                el,
                pos: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, 3.5, (Math.random() - 0.5) * 0.9)),
                vy: 2.3, age: 0, duration: 1.15
            });
        }
        function spawnAfterimage(ent, hex = 0x38bdf8, sc = 1.0) {
            const g = new THREE.Mesh(
                new THREE.SphereGeometry(1.0, 14, 12),
                new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })
            );
            g.scale.set(OVAL_SCALE_X * sc, OVAL_SCALE_Y * sc, OVAL_SCALE_Z * sc);
            g.position.copy(ent.pos).add(new THREE.Vector3(0, OVAL_CENTER_Y, 0));
            addVFX(g, 0.34, (m, t) => { m.material.opacity = 0.38 * (1 - t); });
        }
        function spawnDustPuff(pos) {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xd6cbb2, transparent: true, opacity: 0.45, depthWrite: false })
            );
            m.position.set(pos.x + (Math.random() - 0.5) * 0.5, 0.2, pos.z + (Math.random() - 0.5) * 0.5);
            addVFX(m, 0.45, (mesh, t) => { mesh.position.y += 0.015; mesh.scale.setScalar(1 + t); mesh.material.opacity = 0.45 * (1 - t); });
        }
        function spawnWaterSplash(pos) {
            const grp = new THREE.Group();
            grp.position.set(pos.x, -0.35, pos.z);
            const rMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false });
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.95, 28), rMat);
            ring.rotation.x = -Math.PI / 2;
            const drops = [];
            const dMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.9 });
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
                const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), dMat);
                d.position.set(Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7);
                d.userData = { vx: Math.cos(a) * 1.8, vy: 2.8 + Math.random() * 1.4, vz: Math.sin(a) * 1.8 };
                grp.add(d); drops.push(d);
            }
            grp.add(ring);
            addVFX(grp, 0.52, (g, t, dt) => {
                ring.scale.setScalar(1 + t * 2.2); rMat.opacity = 0.85 * (1 - t); dMat.opacity = 0.9 * (1 - t);
                drops.forEach(dr => {
                    dr.position.x += dr.userData.vx * dt;
                    dr.position.y += dr.userData.vy * dt;
                    dr.position.z += dr.userData.vz * dt;
                    dr.userData.vy -= 9.5 * dt;
                });
            });
        }
        function spawnGroundSlamVFX(pos, radius = 6.2) {
            const grp = new THREE.Group();
            grp.position.set(pos.x, 0.1, pos.z);
            const rMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false });
            const outer = new THREE.Mesh(new THREE.RingGeometry(radius - 0.35, radius, 48), rMat);
            outer.rotation.x = -Math.PI / 2;
            const dMat = new THREE.MeshBasicMaterial({ color: 0xfb923c, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthWrite: false });
            const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), dMat);
            disc.rotation.x = -Math.PI / 2;
            const wMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.92 });
            const wave = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.22, 8, 36), wMat);
            wave.rotation.x = Math.PI / 2; wave.position.y = 0.25;
            grp.add(outer, disc, wave);
            addVFX(grp, 0.9, (g, t) => {
                const sc = 0.2 + Math.min(1, t * 2.6) * (radius / 0.8);
                wave.scale.set(sc, sc, 1); wMat.opacity = Math.max(0, 1 - t * 1.6);
                rMat.opacity = 0.92 * (1 - t); dMat.opacity = 0.28 * (1 - t);
            });
        }
        function spawnPullTetherVFX(fromPos, toPos) {
            const dir = new THREE.Vector3().subVectors(toPos, fromPos);
            const len = Math.max(0.1, dir.length());
            const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
            const grp = new THREE.Group();
            const bMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.95 });
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, len, 10), bMat);
            beam.position.set(mid.x, 1.5, mid.z);
            beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
            grp.add(beam);
            addVFX(grp, 0.4, (g, t) => { bMat.opacity = 1 - t; beam.scale.set(1 - t * 0.7, 1, 1 - t * 0.7); });
        }
        function spawnLaserVFX(origin, dir, len = 28, hex = 0x6366f1) {
            const grp = new THREE.Group();
            const mid = origin.clone().addScaledVector(dir, len * 0.5);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
            const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, len, 12), cMat);
            const oMat = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
            const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, len, 14), oMat);
            core.position.copy(mid); core.quaternion.copy(q);
            outer.position.copy(mid); outer.quaternion.copy(q);
            grp.add(core, outer);
            addVFX(grp, 0.5, (g, t) => {
                const s = 1 - t; core.scale.set(s, 1, s); outer.scale.set(1 + t * 0.5, 1, 1 + t * 0.5);
                cMat.opacity = s; oMat.opacity = 0.75 * s;
            });
        }
        function spawnPurpleVFX(pos) {
            const grp = new THREE.Group();
            grp.position.set(pos.x, 1.65, pos.z);
            const oMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
            const orb = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 16), oMat);
            const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color: 0xf0abfc, transparent: true, opacity: 0.95 }));
            grp.add(orb, r1);
            addVFX(grp, 0.7, (g, t) => {
                orb.scale.setScalar(0.6 + t * 2.0); oMat.opacity = 0.8 * (1 - t);
                r1.rotation.y += 0.25; r1.scale.setScalar(0.8 + t * 1.4); r1.material.opacity = 1 - t;
            });
        }
        function spawnHealLotusVFX(ent) {
            const grp = new THREE.Group();
            const pMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.45, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
            const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7.5, 24, 1, true), pMat);
            pil.position.y = 3.75;
            const rMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.92 });
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.08, 8, 32), rMat);
            ring.rotation.x = Math.PI / 2;
            grp.add(pil, ring);
            grp.position.copy(ent.pos);
            addVFX(grp, 1.0, (g, t) => {
                g.position.copy(ent.pos); pMat.opacity = 0.45 * (1 - t);
                ring.position.y = t * 4.0; rMat.opacity = 1 - t;
            });
        }
        function spawnKillFullHealVFX(ent) {
            const grp = new THREE.Group();
            grp.position.copy(ent.pos);
            const p1Mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.56, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
            const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 9.5, 24, 1, true), p1Mat); p1.position.y = 4.75;
            const p2Mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
            const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 8.5, 18, 1, true), p2Mat); p2.position.y = 4.25;
            const gMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false });
            const gRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.4, 36), gMat); gRing.rotation.x = -Math.PI / 2; gRing.position.y = 0.16;
            grp.add(p1, p2, gRing);
            addVFX(grp, 1.25, (g, t) => {
                g.position.copy(ent.pos); const f = 1 - t;
                p1Mat.opacity = 0.56 * f; p2Mat.opacity = 0.5 * f;
                gRing.scale.setScalar(1 + t * 3.8); gMat.opacity = 0.95 * f;
            });
        }
        function spawnBurst(pos, hex = 0xfbbf24, rad = 1.4) {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(rad, 12, 12),
                new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
            );
            m.position.set(pos.x, 1.5, pos.z);
            addVFX(m, 0.35, (mesh, t) => { mesh.scale.setScalar(0.5 + t * 1.6); mesh.material.opacity = 0.85 * (1 - t); });
        }

        /* =====================================================================
         * 10. COMBAT MECHANICS, ENDLAG, OCEAN HAZARD & KILL-HEAL
         * ===================================================================== */
        const getKillBonus = () => state.killStacks * KILL_DMG_BONUS_PER_KILL;
        const getDmgMult = e => e.isPlayer ? (1 + state.currentTrait.dmgBonus + getKillBonus()) : (e.isRemote ? 1 + e.trait.dmgBonus + (e.killStacks || 0) * KILL_DMG_BONUS_PER_KILL : 1.0);
        const getSpdMult = e => (e.isPlayer ? (1 + state.currentTrait.speedBonus) : (e.isRemote ? 1 + e.trait.speedBonus : (e.role === 'bot_dummy' ? 0.68 : 0.88))) * (e.inSea ? SEA_SPEED_MULT : 1.0);
        const getCdMult = e => e.isPlayer ? (1 - state.currentTrait.cdr) : (e.isRemote ? 1 - e.trait.cdr : 1.35);

        function canAct(e) {
            if (e._force) return !e.dead;
            return !e.dead && e.endlagTimer <= 0 && e.stunTimer <= 0 && !e.grabbedBy && !e.grabTarget && e.knockbackTimer <= 0 && !e.slam;
        }
        function applyEndlag(e, sec) {
            if (sec <= 0) return;
            e.endlagTimer = Math.max(e.endlagTimer, sec);
            e.endlagMax = Math.max(e.endlagMax, sec);
        }
        function applyStun(t, sec, label = 'STUN') {
            if (t.dead) return;
            t.stunTimer = Math.max(t.stunTimer, sec);
            t.stunMax = Math.max(t.stunMax, sec);
            if (t.magicXChargeTimer > 0) {
                t.magicXChargeTimer = 0;
                document.getElementById('warning-banner').classList.add('hidden');
            }
            spawnFloatingText(t.pos, `${label} ${sec.toFixed(1)}s`, '#f0abfc', 1.05);
        }
        function dealDamage(attacker, target, basePct, color = '#fb7185', suffix = '') {
            if (target.dead) return 0;
            const dmg = Math.round(target.maxHp * basePct * (attacker ? getDmgMult(attacker) : 1.0));
            if (target.isRemote) {
                spawnFloatingText(target.pos, `-${dmg}${suffix}`, color, suffix ? 1.08 : 1.26);
                return dmg;
            }
            target.hp = Math.max(0, target.hp - dmg);
            spawnFloatingText(target.pos, `-${dmg}${suffix}`, color, suffix ? 1.08 : 1.26);
            if (attacker) { target.lastHitBy = attacker; target.lastHitTime = state.clock.elapsedTime; }
            if (target.isPlayer) triggerShake(attacker ? 0.28 : 0.14, 0.18);
            if (target.hp <= 0) {
                let killer = attacker, bySea = false;
                if (!killer) {
                    bySea = true;
                    if (target.lastHitBy && (state.clock.elapsedTime - target.lastHitTime) <= RING_OUT_CREDIT_SEC) {
                        killer = target.lastHitBy;
                    }
                }
                handleDeath(killer, target, bySea);
            }
            return dmg;
        }
        function handleDeath(killer, victim, bySea = false) {
            victim.dead = true; victim.hp = 0;
            if (victim.isPlayer) Net.died(killer && killer.netId ? killer.netId : null, bySea);
            victim.stunTimer = 0; victim.endlagTimer = 0; victim.blindedTimer = 0;
            victim.dashTimer = 0; victim.slam = null; victim.pullTo = null; victim.knockbackTimer = 0; victim.magicXChargeTimer = 0; victim.inSea = false;
            if (victim.grabTarget) { victim.grabTarget.grabbedBy = null; victim.grabTarget = null; }
            if (victim.grabbedBy) { victim.grabbedBy.grabTarget = null; victim.grabbedBy = null; }
            victim.meshParts.root.visible = false;
            if (victim.overheadEl) victim.overheadEl.style.display = 'none';
            spawnBurst(victim.pos, bySea ? 0x0ea5e9 : 0xef4444, 2.2);

            if (victim.isPlayer) {
                state.purpleBlindTime = 0;
                document.getElementById('purple-blind-overlay').style.opacity = '0';
                document.getElementById('warning-banner').classList.add('hidden');
                document.getElementById('sea-warning-banner').classList.add('hidden');
                document.getElementById('sea-vignette').classList.remove('active');
                state.playerRespawnTimer = 2.0;
                if (state.killStacks > 0) {
                    const lostPct = Math.round(getKillBonus() * 100);
                    state.killStacks = 0;
                    addBattleLog(`💔 Bạn chết → mất buff +${lostPct}% DMG từ hạ gục, về 0%.`, 'text-rose-300');
                }
                updateTraitHUD();
                const ov = document.getElementById('respawn-overlay');
                ov.classList.remove('hidden'); ov.classList.add('flex');
                addBattleLog(bySea ? '🌊 Bạn bị mất máu hết ngoài vùng biển!' : `💀 Bị ${killer ? killer.name : 'đối thủ'} hạ gục!`, 'text-rose-400');
            } else {
                victim.respawnTimer = 3.0;
                if (killer && killer.isPlayer) {
                    state.kills += 1;
                    state.traitRolls += 1;
                    state.killStacks += 1;
                    const killBonusPct = Math.round(getKillBonus() * 100);
                    if (!killer.dead) {
                        killer.hp = killer.maxHp;
                        spawnKillFullHealVFX(killer);
                        spawnFloatingText(killer.pos, '+FULL HP (KILL)', '#34d399', 1.48);
                        const card = document.getElementById('player-hp-card');
                        card.classList.remove('hp-kill-heal-flash');
                        void card.offsetWidth;
                        card.classList.add('hp-kill-heal-flash');
                    }
                    SFX.killFullHeal();
                    spawnFloatingText(victim.pos, '+1 ROLL TRAIT!', '#fbbf24', 1.38);
                    spawnFloatingText(killer.pos.clone().add(new THREE.Vector3(0, -1.0, 0)), `🔥 +5% DMG (Tổng +${killBonusPct}%)`, '#fb923c', 1.25);
                    addBattleLog(bySea ? `🌊 Đẩy ${victim.name} xuống biển hạ gục → +1 Roll, Full HP & +5% DMG (tổng +${killBonusPct}%)!` : `⚔️ Hạ gục ${victim.name} → +1 Roll, Hồi Full Máu & +5% DMG (tổng +${killBonusPct}%)!`, 'text-emerald-300');
                    showToast((bySea ? 'RING-OUT BIỂN! +1 Roll Trait, Full Máu' : 'HẠ GỤC! +1 Roll Trait, Full Máu') + ` & +5% DMG (Tổng +${killBonusPct}%)`, 'emerald');
                    updateTraitHUD();
                } else if (bySea) {
                    addBattleLog(`🌊 ${victim.name} đã kiệt sức ngoài vùng biển.`, 'text-sky-300');
                }
            }
        }
        function respawnEntity(ent) {
            if (ent.isPlayer) {
                const sp = pickSpawn();
                ent.spawnPos.set(sp.x, 0, sp.z);
                ent.facing = Math.atan2(-sp.x, -sp.z);
            }
            ent.dead = false; ent.hp = ent.maxHp;
            ent.pos.copy(ent.spawnPos);
            ent.baseGroundY = 0;
            ent.endlagTimer = 0; ent.stunTimer = 0; ent.blindedTimer = 0;
            ent.knockbackTimer = 0; ent.dashTimer = 0; ent.grabTarget = null; ent.grabbedBy = null;
            ent.inSea = false; ent.seaTickTimer = 0; ent.lastHitBy = null;
            ent.meshParts.root.visible = true;
            if (ent.overheadEl) ent.overheadEl.style.display = 'flex';
            if (!ent.isPlayer) {
                const pool = [TRAITS[1], TRAITS[2], TRAITS[3], TRAITS[4], TRAITS[5], TRAITS[6]];
                const weights = [26, 24, 20, 14, 10, 6];
                let r = Math.random() * 100, acc = 0, pick = pool[0];
                for (let i = 0; i < pool.length; i++) { acc += weights[i]; if (r < acc) { pick = pool[i]; break; } }
                applyTraitVisualsToEntity(ent, pick);
            }
            spawnHealLotusVFX(ent);
        }

        function clampToWorld(pos) {
            const d = Math.hypot(pos.x, pos.z);
            if (d > WORLD_LIMIT) {
                const s = WORLD_LIMIT / d;
                pos.x *= s; pos.z *= s;
            }
        }

        /* ----- SKILLS ----- */
        function castDashQ(ent, dirVec) {
            if (!canAct(ent) || ent.cooldowns.dash_q > 0) return false;
            const cd = SKILLS.dash.cd * getCdMult(ent);
            ent.cooldowns.dash_q = cd; ent.cooldownMax.dash_q = cd;
            ent.dashDir.copy(dirVec).setY(0);
            if (ent.dashDir.lengthSq() < 0.01) ent.dashDir.set(Math.sin(ent.facing), 0, Math.cos(ent.facing));
            else ent.dashDir.normalize();
            ent.facing = Math.atan2(ent.dashDir.x, ent.dashDir.z);
            ent.dashTimer = 0.22; ent.dashSpeed = 36 * getSpdMult(ent); ent.dashIsGrab = false;
            SFX.dash();
            spawnAfterimage(ent, ent.trait.hex);
            return true;
        }
        function castMeleeZ(ent, aimPt) {
            if (!canAct(ent) || ent.cooldowns.melee_z > 0) return false;
            const cd = SKILLS.melee.z.cd * getCdMult(ent);
            ent.cooldowns.melee_z = cd; ent.cooldownMax.melee_z = cd;
            const dir = new THREE.Vector3().subVectors(aimPt, ent.pos).setY(0);
            if (dir.lengthSq() < 0.01) dir.set(Math.sin(ent.facing), 0, Math.cos(ent.facing)); else dir.normalize();
            ent.facing = Math.atan2(dir.x, dir.z);
            ent.dashDir.copy(dir); ent.dashTimer = 0.30; ent.dashSpeed = 38; ent.dashIsGrab = true;
            ent.castAnimType = 'grab'; ent.castAnimTimer = 0.3;
            const P = palOf(ent); ring(ent.pos, P, 3.5, P.l, 0.4); sparks(ent.pos, P, 10, 0.8, 6);
            SFX.dash();
            return true;
        }
        function startGrabHold(att, tgt) {
            att.dashTimer = 0; att.dashIsGrab = false;
            att.grabTarget = tgt; att.grabTimer = 2.0; att._g1 = 0;
            tgt.grabbedBy = att; tgt.dashTimer = 0; tgt.knockbackTimer = 0; tgt.magicXChargeTimer = 0;
            const fwd = new THREE.Vector3(Math.sin(att.facing), 0, Math.cos(att.facing));
            tgt.pos.copy(att.pos).addScaledVector(fwd, 1.75);
            tgt.facing = Math.atan2(-fwd.x, -fwd.z);
            const P = palOf(att);
            slashX(tgt.pos, P, -att.facing); gripFx(att, tgt, P); ring(tgt.pos, P, 4.5, P.m, 0.5);
            SFX.grab(); spawnBurst(tgt.pos, P.m, 1.2);
            spawnFloatingText(tgt.pos, 'BỊ TÓM! (2.0s)', '#fb923c', 1.2);
            if (att.isPlayer || tgt.isPlayer) triggerShake(0.25, 0.18);
        }
        function finishGrabThrow(att, tgt) {
            att.grabTarget = null; tgt.grabbedBy = null;
            const fwd = new THREE.Vector3(Math.sin(att.facing), 0, Math.cos(att.facing)), P = palOf(att);
            tgt.knockbackVel.copy(fwd).multiplyScalar(27.0);
            tgt.knockbackTimer = 0.62; tgt.fxHex = P.m; tgt.fxTrail = 0.62;
            applyStun(tgt, 1.0, 'BỊ NÉM BAY');
            dealDamage(att, tgt, SKILLS.melee.z.dmgPct, hx(P.l));
            att.castAnimType = 'throw'; att.castAnimTimer = 0.35;
            slash(tgt.pos, -att.facing + 0.4, P, 7.5); ring(tgt.pos, P, 6, P.l, 0.5); sparks(tgt.pos, P, 20, 2, 10);
            SFX.throwHit(); spawnBurst(tgt.pos, P.l, 1.85);
            if (att.isPlayer || tgt.isPlayer) triggerShake(0.42, 0.25);
        }
        function castMeleeX(ent) {
            if (!canAct(ent) || ent.cooldowns.melee_x > 0) return false;
            const sk = SKILLS.melee.x, cd = sk.cd * getCdMult(ent);
            ent.cooldowns.melee_x = cd; ent.cooldownMax.melee_x = cd;
            ent.slam = { t: 0, fl: 0 };
            const P = palOf(ent); ring(ent.pos, P, 4, P.m, 0.5); sparks(ent.pos, P, 12, 0.5, 8); spawnAfterimage(ent, P.m, 1.1);
            SFX.dash();
            return true;
        }
        function slamImpact(ent) {
            const sk = SKILLS.melee.x, rad = 6.2, P = palOf(ent);
            ent.slam = null;
            spawnSlamVFX(ent.pos, rad, P); SFX.slam();
            triggerShake(ent.isPlayer ? 0.7 : 0.3, 0.4);
            getTargetsOf(ent).forEach(t => {
                if (!t.dead && Math.hypot(t.pos.x - ent.pos.x, t.pos.z - ent.pos.z) <= rad) {
                    dealDamage(ent, t, sk.dmgPct, hx(P.l));
                    applyStun(t, 1.0, 'CHOÁNG');
                }
            });
            ent.castAnimType = 'slam'; ent.castAnimTimer = 0.45;
            applyEndlag(ent, sk.endlag);
        }
        function castMeleeC(ent, tgt) {
            if (!canAct(ent) || ent.cooldowns.melee_c > 0) return false;
            if (!tgt || tgt.dead) {
                if (ent.isPlayer) showToast('Cần chỉ chuột đúng vào người đối thủ để dùng Hút Trói!', 'red');
                return false;
            }
            const sk = SKILLS.melee.c, cd = sk.cd * getCdMult(ent), P = palOf(ent);
            ent.cooldowns.melee_c = cd; ent.cooldownMax.melee_c = cd;
            const dir = new THREE.Vector3().subVectors(tgt.pos, ent.pos).setY(0);
            if (dir.lengthSq() > 0.001) { dir.normalize(); ent.facing = Math.atan2(dir.x, dir.z); }
            else dir.set(Math.sin(ent.facing), 0, Math.cos(ent.facing));
            spawnGravityVFX(ent, dir, P);
            const to = new THREE.Vector3(ent.pos.x + dir.x * 3.0, 0, ent.pos.z + dir.z * 3.0);
            clampToWorld(to);
            tgt.pullTo = to; tgt.fxHex = P.m; tgt.dashTimer = 0; tgt.knockbackTimer = 0;
            dealDamage(ent, tgt, sk.dmgPct, hx(P.l));
            applyStun(tgt, 1.4, 'BỊ HÚT');
            ent.castAnimType = 'pull'; ent.castAnimTimer = 0.35;
            SFX.pull(); if (ent.isPlayer) triggerShake(0.28, 0.18);
            return true;
        }
        function castMagicZ(ent, aimPt) {
            if (!canAct(ent) || ent.cooldowns.magic_z > 0) return false;
            const sk = SKILLS.magic.z, cd = sk.cd * getCdMult(ent), P = palOf(ent);
            ent.cooldowns.magic_z = cd; ent.cooldownMax.magic_z = cd;
            const dir = new THREE.Vector3().subVectors(aimPt, ent.pos).setY(0);
            if (dir.lengthSq() < 0.01) dir.set(Math.sin(ent.facing), 0, Math.cos(ent.facing)); else dir.normalize();
            ent.facing = Math.atan2(dir.x, dir.z);
            const len = 28;
            const orig = ent.pos.clone().add(new THREE.Vector3(0, 1.55, 0)).addScaledVector(dir, 0.9);
            spawnBeam(orig, dir, len, P); SFX.laser();
            if (ent.isPlayer) triggerShake(0.32, 0.22);
            getTargetsOf(ent).forEach(t => {
                if (t.dead) return;
                const toT = new THREE.Vector3().subVectors(t.pos, ent.pos).setY(0);
                const proj = toT.dot(dir);
                if (proj > 0 && proj <= len) {
                    const perp = toT.clone().addScaledVector(dir, -proj).length();
                    if (perp <= 1.7) {
                        dealDamage(ent, t, sk.dmgPct, hx(P.l));
                        t.knockbackVel.copy(dir).multiplyScalar(22.5);
                        t.knockbackTimer = 0.46;
                        applyStun(t, 1.2, 'STUN LASER');
                        spawnBurst(t.pos, P.m, 1.5); zapCage(t, P, 1.2); sparks(t.pos, P, 18, 1.8, 9);
                    }
                }
            });
            ent.castAnimType = 'laser'; ent.castAnimTimer = 0.42;
            applyEndlag(ent, sk.endlag);
            return true;
        }
        function castMagicX(ent, tgt) {
            if (!canAct(ent) || ent.cooldowns.magic_x > 0) return false;
            if (!tgt || tgt.dead) {
                if (ent.isPlayer) showToast('Cần chỉ chuột đúng vị trí đối thủ để dùng Lóa Tím!', 'red');
                return false;
            }
            const sk = SKILLS.magic.x, cd = sk.cd * getCdMult(ent), P = palOf(ent);
            ent.cooldowns.magic_x = cd; ent.cooldownMax.magic_x = cd;
            const dir = new THREE.Vector3().subVectors(tgt.pos, ent.pos).setY(0);
            if (dir.lengthSq() > 0.001) ent.facing = Math.atan2(dir.x, dir.z);
            spawnHadesChains(tgt, P, 3.0); ring(ent.pos, P, 4, P.m, 0.5); SFX.purple();
            dealDamage(ent, tgt, sk.dmgPct, '#e879f9');
            applyStun(tgt, 3.0, 'LÓA TÍM');
            tgt.blindedTimer = 3.0;
            if (tgt.isPlayer) { state.purpleBlindTime = 3.0; state.purpleBlindMax = 3.0; triggerShake(0.45, 0.35); }
            ent.castAnimType = 'magic'; ent.castAnimTimer = 0.35;
            return true;
        }
        function castMagicC(ent) {
            if (!canAct(ent) || ent.cooldowns.magic_c > 0) return false;
            const sk = SKILLS.magic.c, cd = sk.cd * getCdMult(ent);
            ent.cooldowns.magic_c = cd; ent.cooldownMax.magic_c = cd;
            const heal = Math.round(ent.maxHp * sk.healPct);
            ent.hp = Math.min(ent.maxHp, ent.hp + heal);
            spawnHealLotusVFX(ent);
            spawnFloatingText(ent.pos, `+${heal} HP`, '#34d399', 1.3);
            SFX.heal();
            ent.castAnimType = 'heal'; ent.castAnimTimer = 0.5;
            applyEndlag(ent, sk.endlag); // 1s Endlag
            return true;
        }

        /* =====================================================================
         * 11. SMART AI LOGIC (WITH OCEAN ESCAPE PRIORITY)
         * ===================================================================== */
        function updateBotAI(bot, dt) {
            if (bot.isRemote) { updateRemoteProxy(bot, dt); return; }
            bot.isMoving = false;
            if (bot.dead) {
                bot.respawnTimer -= dt;
                if (bot.respawnTimer <= 0) respawnEntity(bot);
                return;
            }
            if (!state.aiCombatMode) {
                if (bot.magicXChargeTimer > 0) {
                    bot.magicXChargeTimer = 0;
                    document.getElementById('warning-banner').classList.add('hidden');
                }
                return;
            }
            const tgt = state.player;
            if (!tgt || tgt.dead) return;

            if (bot.magicXChargeTimer > 0) {
                bot.magicXChargeTimer -= dt;
                const toP = new THREE.Vector3().subVectors(tgt.pos, bot.pos).setY(0);
                bot.facing = Math.atan2(toP.x, toP.z);
                if (bot.magicXChargeTimer <= 0) {
                    document.getElementById('warning-banner').classList.add('hidden');
                    if (canAct(bot) && !tgt.dead && toP.length() <= 20) castMagicX(bot, tgt);
                }
                return;
            }
            if (!canAct(bot) || bot.dashTimer > 0) return;

            const speed = BASE_MOVE_SPEED * getSpdMult(bot);
            const rDist = Math.hypot(bot.pos.x, bot.pos.z);

            // Urgent escape back onto sand island if pushed into ocean
            if (rDist > ARENA_RADIUS - 1.2) {
                const toCenter = new THREE.Vector3(-bot.pos.x, 0, -bot.pos.z).normalize();
                if (rDist > ARENA_RADIUS + 1.2 && bot.cooldowns.dash_q <= 0) { castDashQ(bot, toCenter); return; }
                bot.pos.x += toCenter.x * speed * dt;
                bot.pos.z += toCenter.z * speed * dt;
                clampToWorld(bot.pos);
                bot.facing = Math.atan2(toCenter.x, toCenter.z);
                bot.walkCycle += dt * 10; bot.isMoving = true;
                return;
            }

            const toP = new THREE.Vector3().subVectors(tgt.pos, bot.pos).setY(0);
            const dist = toP.length();
            const dir = dist > 0.01 ? toP.clone().normalize() : new THREE.Vector3(0, 0, 1);

            bot.aiThinkTimer -= dt;
            if (bot.aiThinkTimer <= 0) { bot.aiThinkTimer = 0.65 + Math.random() * 0.7; bot.aiStrafeDir = Math.random() < 0.5 ? 1 : -1; }

            const move = new THREE.Vector3();
            if (bot.role === 'bot_melee') {
                if (dist > 3.5) move.copy(dir);
                else move.set(-dir.z * bot.aiStrafeDir, 0, dir.x * bot.aiStrafeDir).multiplyScalar(0.6);
                if (dist <= 5.8 && bot.cooldowns.melee_x <= 0 && Math.random() < 0.04) { castMeleeX(bot); return; }
                if (dist >= 4.0 && dist <= 11.5 && bot.cooldowns.melee_z <= 0 && Math.random() < 0.025) { castMeleeZ(bot, tgt.pos); return; }
                if (dist > 12 && bot.cooldowns.dash_q <= 0 && Math.random() < 0.02) { castDashQ(bot, dir); return; }
            } else if (bot.role === 'bot_magic') {
                if (dist < 9.0) move.copy(dir).negate();
                else if (dist > 17.0) move.copy(dir);
                else move.set(-dir.z * bot.aiStrafeDir, 0, dir.x * bot.aiStrafeDir).multiplyScalar(0.75);
                if (bot.hp < bot.maxHp * 0.45 && bot.cooldowns.magic_c <= 0 && Math.random() < 0.05) { castMagicC(bot); return; }
                if (dist <= 20 && bot.cooldowns.magic_z <= 0 && Math.random() < 0.03) { castMagicZ(bot, tgt.pos); return; }
                if (dist <= 17 && bot.cooldowns.magic_x <= 0 && Math.random() < 0.01) {
                    bot.magicXChargeTimer = 0.95; SFX.warn();
                    document.getElementById('warning-banner').classList.remove('hidden');
                    spawnFloatingText(bot.pos, 'TỤ LÓA TÍM!', '#e879f9', 1.15);
                    return;
                }
            } else {
                if (dist > 5.2) move.copy(dir).multiplyScalar(0.65);
                else if (dist < 3.2) move.set(-dir.z * bot.aiStrafeDir, 0, dir.x * bot.aiStrafeDir).multiplyScalar(0.5);
                if (dist <= 5.0 && bot.cooldowns.melee_x <= 0 && Math.random() < 0.012) { castMeleeX(bot); return; }
            }

            if (move.lengthSq() > 0.001) {
                move.normalize();
                const nx = bot.pos.x + move.x * speed * dt, nz = bot.pos.z + move.z * speed * dt;
                if (Math.hypot(nx, nz) <= ARENA_RADIUS - 1.5) {
                    bot.pos.x = nx; bot.pos.z = nz;
                    bot.walkCycle += dt * 9; bot.isMoving = true;
                }
                bot.facing = Math.atan2(dir.x, dir.z);
            }
        }

        /* =====================================================================
         * 12. ENTITY PHYSICS, SEA DAMAGE, OVAL ANIMATION & AURA LOOP
         * ===================================================================== */
        function updateBolts(bolts) {
            bolts.forEach((ln, i) => {
                const attr = ln.geometry.attributes.position;
                const a0 = (i / bolts.length) * Math.PI * 2 + Math.random() * 1.1;
                const r0 = 1.5 + Math.random() * 0.52;
                for (let s = 0; s < 8; s++) {
                    const y = 0.25 + (s / 7) * 3.5;
                    const a = a0 + (Math.random() - 0.5) * 0.68;
                    const r = r0 + (Math.random() - 0.5) * 0.45;
                    attr.setXYZ(s, Math.cos(a) * r, y, Math.sin(a) * r);
                }
                attr.needsUpdate = true;
            });
        }

        function updateEntityAura(ent, dt, t) {
            const r = ent.meshParts.auraRefs;
            if (r.upd) for (const f of r.upd) f(t, dt);
            const lvl = ent.trait.auraLevel;
            if (ent.isMoving && !ent.inSea) {
                ent.trailTimer -= dt;
                if (ent.trailTimer <= 0) {
                    const P = PAL[lvl]; ent.trailTimer = lvl === 6 ? 0.11 : 0.16;
                    if (lvl === 0) spawnDustPuff(ent.pos);
                    else if (lvl >= 3) spawnAfterimage(ent, lvl === 6 && Math.random() < 0.4 ? P.l : P.m, 0.88);
                }
            }
        }

        function updateEntity(ent, dt, t) {
            for (const k in ent.cooldowns) {
                if (ent.cooldowns[k] > 0) ent.cooldowns[k] = Math.max(0, ent.cooldowns[k] - dt);
            }
            if (ent.dead) return;

            if (ent.endlagTimer > 0) { ent.endlagTimer = Math.max(0, ent.endlagTimer - dt); if (ent.endlagTimer === 0) ent.endlagMax = 0; }
            if (ent.stunTimer > 0) { ent.stunTimer = Math.max(0, ent.stunTimer - dt); if (ent.stunTimer === 0) ent.stunMax = 0; }
            if (ent.blindedTimer > 0) ent.blindedTimer = Math.max(0, ent.blindedTimer - dt);
            if (ent.castAnimTimer > 0) ent.castAnimTimer = Math.max(0, ent.castAnimTimer - dt);

            if (ent.grabTarget) {
                ent.grabTimer -= dt;
                const fwd = new THREE.Vector3(Math.sin(ent.facing), 0, Math.cos(ent.facing));
                ent.grabTarget.pos.x = ent.pos.x + fwd.x * 1.75;
                ent.grabTarget.pos.z = ent.pos.z + fwd.z * 1.75;
                { const gt = 2.0 - ent.grabTimer; ent.grabTarget.pos.y = ent.baseGroundY + 0.4 + Math.min(1, gt / 0.8) * 2.3; if (!ent._g1 && gt > 0.85) { ent._g1 = 1; slashX(ent.grabTarget.pos, palOf(ent), -ent.facing + 1.2); } }
                if (ent.grabTimer <= 0) {
                    ent.grabTarget.pos.y = ent.grabTarget.baseGroundY;
                    finishGrabThrow(ent, ent.grabTarget);
                }
            }

            if (ent.dashTimer > 0) {
                ent.dashTimer -= dt;
                ent.pos.x += ent.dashDir.x * ent.dashSpeed * dt;
                ent.pos.z += ent.dashDir.z * ent.dashSpeed * dt;
                clampToWorld(ent.pos);
                dashFx(ent);
                if (ent.dashIsGrab && !ent.isRemote) {
                    const tgts = getTargetsOf(ent);
                    for (const tg of tgts) {
                        if (!tg.dead && !tg.grabbedBy && !tg.grabTarget && Math.hypot(tg.pos.x - ent.pos.x, tg.pos.z - ent.pos.z) <= 2.4) {
                            startGrabHold(ent, tg); Net.grab(tg); break;
                        }
                    }
                }
                if (ent.dashTimer <= 0) ent.dashIsGrab = false;
            }

            if (ent.knockbackTimer > 0) {
                ent.knockbackTimer -= dt;
                if (!ent.isRemote) {
                    ent.pos.x += ent.knockbackVel.x * dt;
                    ent.pos.z += ent.knockbackVel.z * dt;
                }
                ent.knockbackVel.multiplyScalar(Math.pow(0.28, dt)); if (ent.fxTrail > 0) { ent.fxTrail -= dt; spawnAfterimage(ent, ent.fxHex, 1); }
                clampToWorld(ent.pos);
            }

            if (ent.isRemote) ent.pullTo = null;
            if (ent.pullTo) { const dx = ent.pullTo.x - ent.pos.x, dz = ent.pullTo.z - ent.pos.z, d = Math.hypot(dx, dz), st = 55 * dt; if (d <= st) { ent.pos.x = ent.pullTo.x; ent.pos.z = ent.pullTo.z; ent.pullTo = null; } else { ent.pos.x += dx / d * st; ent.pos.z += dz / d * st; spawnAfterimage(ent, ent.fxHex || 0xa855f7, 1); } }
            // Synchronized Island / Ocean Elevation & Hazard Detection
            const distFromCenter = Math.hypot(ent.pos.x, ent.pos.z);
            const inSea = distFromCenter > ARENA_RADIUS;
            ent.inSea = inSea;
            const targetGroundY = inSea ? -0.45 : 0.0;
            ent.baseGroundY += (targetGroundY - ent.baseGroundY) * Math.min(1, dt * 12);

            if (ent.knockbackTimer > 0) {
                const arc = Math.sin(Math.min(1, ent.knockbackTimer / 0.62) * Math.PI) * 1.65;
                ent.pos.y = ent.baseGroundY + arc;
            } else if (!ent.grabbedBy && !ent.slam) {
                ent.pos.y = ent.baseGroundY;
            }

            if (ent.slam) { const s = ent.slam; s.t += dt; const H = 8, T1 = 0.4, T2 = 0.58, T3 = 0.72; let y; if (s.t < T1) { y = H * Math.sin(s.t / T1 * Math.PI / 2); s.fl = 0; } else if (s.t < T2) { y = H; s.fl = (s.t - T1) / (T2 - T1); } else { const k = Math.min(1, (s.t - T2) / (T3 - T2)); y = H * (1 - k * k); s.fl = 1; } ent.pos.y = ent.baseGroundY + y; if (Math.random() < 0.7) spawnAfterimage(ent, palOf(ent).m, 1.05); if (s.t >= T3) { ent.pos.y = ent.baseGroundY; slamImpact(ent); } }
            if (inSea) { ent.seaSplashTimer -= dt;
                if (ent.seaSplashTimer <= 0) { ent.seaSplashTimer = 0.34; spawnWaterSplash(ent.pos); }
                ent.seaTickTimer -= dt;
                if (ent.seaTickTimer <= 0) {
                    ent.seaTickTimer = SEA_TICK_INTERVAL;
                    if (ent.isPlayer) SFX.seaSplash();
                    if (!ent.isRemote) dealDamage(null, ent, SEA_DMG_PER_SEC * SEA_TICK_INTERVAL, '#38bdf8', ' (Biển)');
                    if (ent.dead) return;
                }
            } else {
                ent.seaTickTimer = Math.min(ent.seaTickTimer, 0.12);
            }

            // Oval Squash-and-Stretch Animation
            const mp = ent.meshParts;
            mp.root.rotation.y = ent.facing;
            mp.stunRing.visible = ent.stunTimer > 0;
            if (mp.stunRing.visible) mp.stunRing.rotation.y = t * 6;
            mp.blindOrb.visible = ent.blindedTimer > 0;
            if (mp.blindOrb.visible) { mp.blindOrb.rotation.y = t * 4; mp.blindOrb.rotation.x = t * 2.5; }

            let sx = 1, sy = 1, sz = 1, tx = 0, tz = 0, by = 0;
            if (ent.slam) { const f = ent.slam.fl || 0; sx = 1 - f * 0.1; sy = 1.22 - f * 0.3; sz = sx; tx = f * Math.PI; by = f * 3.36; } else if (ent.grabTarget) { sx = 1.12; sy = 0.92; sz = 1.12; tx = -0.3; by = 0.12; } else if (ent.grabbedBy) {
                sx = 0.9; sy = 1.1; tz = Math.sin(t * 22) * 0.24;
            } else if (ent.knockbackTimer > 0) {
                tx = -t * 11;
            } else if (ent.stunTimer > 0) {
                tz = Math.sin(t * 14) * 0.18;
            } else if (ent.endlagTimer > 0) {
                sx = 1.16; sy = 0.8; sz = 1.16; tx = 0.2; by = -0.14;
            } else if (ent.castAnimTimer > 0) {
                if (ent.castAnimType === 'slam') { sx = 1.3; sy = 0.7; sz = 1.3; by = -0.2; }
                else if (ent.castAnimType === 'throw' || ent.castAnimType === 'laser') { sx = 0.9; sy = 1.12; sz = 1.15; tx = 0.26; }
                else if (ent.castAnimType === 'heal') { sx = 1.08; sy = 1.12; sz = 1.08; by = 0.22; }
                else { sx = 1.1; sy = 0.94; sz = 1.1; tx = 0.15; }
            } else if (ent.dashTimer > 0) {
                sx = 0.82; sy = 0.9; sz = 1.34; tx = 0.38; by = 0.16;
            } else if (ent.walkCycle > 0.02) {
                const b = Math.abs(Math.sin(ent.walkCycle));
                const sway = Math.sin(ent.walkCycle * 0.5) * 0.08;
                by = b * 0.36; sy = 0.91 + b * 0.17; sx = 1.07 - b * 0.09; sz = 1.07 - b * 0.09; tx = 0.18; tz = sway;
                ent.walkCycle *= 0.86;
            } else {
                const br = Math.sin(t * 2.8 + (ent.isPlayer ? 0 : 1.5));
                by = 0.07 + br * 0.065; sy = 1 + br * 0.03; sx = 1 - br * 0.015; sz = 1 - br * 0.015;
            }

            mp.bodyPivot.scale.set(sx, sy, sz);
            mp.bodyPivot.rotation.set(tx, 0, tz);
            mp.bodyPivot.position.y = by;

            updateEntityAura(ent, dt, t);
        }

        function getPlayerMoveDir() {
            let mx = 0, mz = 0;
            if (state.keys['KeyW'] || state.keys['ArrowUp']) mz += 1;
            if (state.keys['KeyS'] || state.keys['ArrowDown']) mz -= 1;
            if (state.keys['KeyA'] || state.keys['ArrowLeft']) mx -= 1;
            if (state.keys['KeyD'] || state.keys['ArrowRight']) mx += 1;
            if (mx === 0 && mz === 0) return null;
            const fwd = new THREE.Vector3(-Math.sin(state.camYaw), 0, -Math.cos(state.camYaw));
            const right = new THREE.Vector3(Math.cos(state.camYaw), 0, -Math.sin(state.camYaw));
            return new THREE.Vector3().addScaledVector(fwd, mz).addScaledVector(right, mx).normalize();
        }

        function updatePlayerMovement(dt) {
            const p = state.player;
            if (!p) return;
            p.isMoving = false;
            if (p.dead) {
                if (state.playerRespawnTimer > 0) {
                    state.playerRespawnTimer -= dt;
                    document.getElementById('respawn-countdown').textContent = `${Math.max(0, state.playerRespawnTimer).toFixed(1)}s`;
                    if (state.playerRespawnTimer <= 0) {
                        const ov = document.getElementById('respawn-overlay');
                        ov.classList.add('hidden'); ov.classList.remove('flex');
                        respawnEntity(p);
                    }
                }
                return;
            }
            if (!canAct(p) || p.dashTimer > 0) return;

            const dir = getPlayerMoveDir();
            if (dir) {
                const spd = BASE_MOVE_SPEED * getSpdMult(p);
                p.pos.x += dir.x * spd * dt;
                p.pos.z += dir.z * spd * dt;
                clampToWorld(p.pos);
                p.facing = Math.atan2(dir.x, dir.z);
                p.walkCycle += dt * 10 * getSpdMult(p);
                p.isMoving = true;
            }
        }

        /* =====================================================================
         * 13. CAMERA (NEVER CLIPS UNDER FLOOR), RAYCAST LOCK & LIVE MINIMAP
         * ===================================================================== */
        function snapCameraImmediate() {
            const p = state.player;
            if (!p) return;
            const ox = Math.sin(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
            const oy = Math.sin(state.camPitch) * state.camDist;
            const oz = Math.cos(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
            state.camera.position.set(p.pos.x + ox, Math.max(1.5, p.pos.y + oy + 1.6), p.pos.z + oz);
            state.camera.lookAt(p.pos.x, p.pos.y + 1.5, p.pos.z - 2.0);
        }

        function updateCameraAndRaycast(dt, t) {
            const p = state.player;
            if (!p) return;
            const ox = Math.sin(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
            const oy = Math.sin(state.camPitch) * state.camDist;
            const oz = Math.cos(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
            const desired = new THREE.Vector3(
                p.pos.x + ox,
                Math.max(1.5, p.pos.y + oy + 1.6),
                p.pos.z + oz
            );
            if (state.shakeTime > 0) {
                state.shakeTime -= dt;
                desired.x += (Math.random() - 0.5) * state.shakeIntensity;
                desired.y = Math.max(1.5, desired.y + (Math.random() - 0.5) * state.shakeIntensity);
                desired.z += (Math.random() - 0.5) * state.shakeIntensity;
            }
            state.camera.position.lerp(desired, Math.min(1, dt * 12));
            if (state.camera.position.y < 1.5) state.camera.position.y = 1.5;
            state.camera.lookAt(p.pos.x, p.pos.y + 1.5, p.pos.z);

            state.raycaster.setFromCamera(state.mouseNDC, state.camera);
            const floorHits = state.raycaster.intersectObject(state.arenaFloorRayPlane);
            if (floorHits.length > 0) {
                state.cursorWorldPos.copy(floorHits[0].point);
                clampToWorld(state.cursorWorldPos);
                const d = Math.hypot(state.cursorWorldPos.x, state.cursorWorldPos.z);
                state.cursorReticle.position.set(state.cursorWorldPos.x, d > ARENA_RADIUS ? -0.32 : 0.08, state.cursorWorldPos.z);
                state.cursorReticle.rotation.y = t * 1.8;
            }

            const hitboxes = state.bots.filter(b => !b.dead).map(b => b.meshParts.hitbox);
            const eHits = state.raycaster.intersectObjects(hitboxes, false);
            let locked = null;
            if (eHits.length > 0) {
                const id = eHits[0].object.userData.entityId;
                locked = state.bots.find(b => b.id === id) || null;
            }
            state.hoveredEnemy = locked;
            const banner = document.getElementById('target-lock-indicator');
            if (locked) {
                state.targetLockRing.visible = true;
                state.targetLockRing.position.set(locked.pos.x, locked.inSea ? -0.32 : 0.1, locked.pos.z);
                state.targetLockRing.rotation.y = t * 3.5;
                banner.classList.remove('hidden');
                document.getElementById('target-lock-name').textContent = `KHÓA MỤC TIÊU: ${locked.name} (${locked.trait.name})`;
            } else {
                state.targetLockRing.visible = false;
                banner.classList.add('hidden');
            }
        }

        function renderMinimap() {
            const cv = document.getElementById('minimap-canvas');
            if (!cv) return;
            const ctx = cv.getContext('2d');
            const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
            const sc = (w * 0.46) / WORLD_LIMIT; // Fits entire WORLD_LIMIT (56) accurately

            // 1. Ocean background (#8ad2e8)
            ctx.fillStyle = '#0d3a55';
            ctx.fillRect(0, 0, w, h);

            // Outer world limit faint ring
            ctx.beginPath(); ctx.arc(cx, cy, WORLD_LIMIT * sc, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

            // 2. Circular Sand Island (#ebe0a3)
            ctx.beginPath(); ctx.arc(cx, cy, ARENA_RADIUS * sc, 0, Math.PI * 2);
            ctx.fillStyle = '#4a4a34'; ctx.fill();

            // 3. Inner Orange Ring (#f47b20)
            ctx.beginPath(); ctx.arc(cx, cy, INNER_RING_RADIUS * sc, 0, Math.PI * 2);
            ctx.strokeStyle = '#b4531a'; ctx.lineWidth = Math.max(2, INNER_RING_WIDTH * sc); ctx.stroke();

            // 4. Red-Orange Center Bullseye
            ctx.beginPath(); ctx.arc(cx, cy, CENTER_RED_RADIUS * sc, 0, Math.PI * 2);
            ctx.fillStyle = '#e51c23'; ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy, CENTER_ORANGE_RADIUS * sc, 0, Math.PI * 2);
            ctx.fillStyle = '#f47b20'; ctx.fill();

            // 5. Test dummy (red dot)
            state.bots.forEach(b => {
                if (b.dead) return;
                const bx = cx + b.pos.x * sc;
                const by = cy + b.pos.z * sc;
                ctx.beginPath(); ctx.arc(bx, by, 4.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
            });

            // 6. Player Directional Marker (green/white arrow, flashes rose in ocean)
            const p = state.player;
            if (p && !p.dead) {
                const px = cx + p.pos.x * sc;
                const py = cy + p.pos.z * sc;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(-p.facing + Math.PI);
                ctx.beginPath();
                ctx.moveTo(0, -7.2); ctx.lineTo(5.2, 5.2); ctx.lineTo(0, 2.5); ctx.lineTo(-5.2, 5.2);
                ctx.closePath();
                ctx.fillStyle = p.inSea ? '#fb7185' : '#10b981';
                ctx.fill();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
                ctx.restore();
            }
        }

        /* =====================================================================
         * 14. TRAIT ROLL SYSTEM (CONFIRM >= TÂN HOÀNG)
         * ===================================================================== */
        function weightedRandomTrait() {
            let r = Math.random() * 100, acc = 0;
            for (const t of TRAITS) { acc += t.rate; if (r < acc) return t; }
            return TRAITS[0];
        }
        function requestTraitRoll() {
            if (state.isRollingTrait) return;
            if (state.traitRolls <= 0) { showToast('Bạn cần hạ gục ít nhất 1 đối thủ để nhận lượt Roll Trait!', 'amber'); return; }
            if (state.currentTrait.confirmOnRoll) {
                const t = state.currentTrait;
                copyPortraitToCanvas(document.getElementById('confirm-trait-portrait'), t.id);
                document.getElementById('confirm-trait-portrait').style.borderColor = t.color;
                document.getElementById('confirm-roll-title').textContent = '⚠️ Bạn chắc chắn muốn roll trait?';
                document.getElementById('confirm-roll-message').innerHTML =
                    `Bạn đang sở hữu <span style="color:${t.color}" class="font-black text-base">${t.name} (${t.rate}%)</span>. Bạn chắc chắn muốn roll trait? Trait hiện tại sẽ bị mất!<br><span class="text-xs text-slate-400 mt-1 inline-block">${t.desc}</span>`;
                const m = document.getElementById('modal-confirm-roll');
                m.classList.remove('hidden'); m.classList.add('flex');
                return;
            }
            executeTraitRoll();
        }
        function executeTraitRoll() {
            if (state.traitRolls <= 0 || state.isRollingTrait) return;
            state.isRollingTrait = true;
            state.traitRolls -= 1;
            updateTraitHUD();

            const next = weightedRandomTrait();
            const modal = document.getElementById('modal-roll-anim');
            const nameEl = document.getElementById('roll-anim-name');
            const rateEl = document.getElementById('roll-anim-rate');
            const buffsEl = document.getElementById('roll-anim-buffs');
            const box = document.getElementById('roll-slot-box');
            const pCv = document.getElementById('roll-anim-portrait');
            const closeBtn = document.getElementById('btn-close-roll-anim');

            closeBtn.classList.add('hidden');
            buffsEl.textContent = 'Đang cộng hưởng thiên mệnh...';
            modal.classList.remove('hidden'); modal.classList.add('flex');

            let ticks = 0;
            const iv = setInterval(() => {
                ticks++;
                const tmp = TRAITS[Math.floor(Math.random() * TRAITS.length)];
                nameEl.textContent = tmp.name; nameEl.style.color = tmp.color;
                rateEl.textContent = `Tỉ lệ: ${tmp.rate}%`;
                box.style.borderColor = tmp.color; pCv.style.borderColor = tmp.color;
                copyPortraitToCanvas(pCv, tmp.id);
                SFX.rollTick();

                if (ticks >= 15) {
                    clearInterval(iv);
                    state.currentTrait = next;
                    exitVFXPreview(false);
                    nameEl.textContent = next.name; nameEl.style.color = next.color;
                    rateEl.textContent = `Tỉ lệ hiếm: ${next.rate}%`;
                    box.style.borderColor = next.color; box.style.boxShadow = `0 0 38px ${next.color}66`;
                    pCv.style.borderColor = next.color; copyPortraitToCanvas(pCv, next.id);
                    buffsEl.innerHTML = `<span style="color:${next.color}" class="font-bold">${next.desc}</span>`;
                    closeBtn.classList.remove('hidden');

                    SFX.rollReveal(next.auraLevel);
                    if (next.auraLevel === 6) {
                        const fl = document.getElementById('emperor-flash');
                        fl.style.opacity = '1'; triggerShake(0.6, 0.5);
                        setTimeout(() => { fl.style.opacity = '0'; }, 600);
                        showToast('👑 THIÊN MỆNH TỐI THƯỢNG: TÂN ĐẾ (1%)!', 'amber');
                    }
                    applyTraitVisualsToEntity(state.player, next);
                    updateTraitHUD();
                    updateHotbarUI();
                    addBattleLog(`🎲 Roll ra Trait: ${next.name} (${next.rate}%)!`, 'text-amber-300');
                    state.isRollingTrait = false;
                }
            }, 70);
        }

        /* =====================================================================
         * 15. HUD, OVERHEAD BARS, TOASTS, VFX PREVIEW & TRAIT TABLE
         * ===================================================================== */
        function previewTraitVFX(trait) {
            state.previewTrait = trait;
            applyTraitVisualsToEntity(state.player, trait);
            document.getElementById('vfx-preview-name').textContent = trait.name;
            document.getElementById('vfx-preview-name').style.color = trait.color;
            document.getElementById('vfx-preview-banner').classList.remove('hidden');
            const m = document.getElementById('modal-trait-table');
            m.classList.add('hidden'); m.classList.remove('flex');
            refreshAllPortraitCanvases();
            showToast(`👁️ Đang xem thử Oval & VFX của ${trait.name}!`, 'amber');
        }

        function exitVFXPreview(notify = true) {
            if (!state.previewTrait) return;
            state.previewTrait = null;
            document.getElementById('vfx-preview-banner').classList.add('hidden');
            if (state.player) applyTraitVisualsToEntity(state.player, state.currentTrait);
            refreshAllPortraitCanvases();
            if (notify) showToast(`Đã quay về Trait thật: ${state.currentTrait.name}`, 'emerald');
        }

        function updateTraitHUD() {
            const t = state.currentTrait;
            const visualT = state.previewTrait || t;
            const cv = document.getElementById('hud-trait-portrait');
            copyPortraitToCanvas(cv, visualT.id);
            cv.style.borderColor = t.color; cv.style.boxShadow = `0 0 14px ${t.color}88`;

            document.getElementById('trait-name').textContent = t.name;
            document.getElementById('trait-name').style.color = t.color;
            document.getElementById('trait-dot').style.backgroundColor = t.color;
            document.getElementById('trait-rate-badge').textContent = `${t.rate}%`;
            document.getElementById('trait-card').style.borderColor = `${t.color}77`;

            const pills = [];
            if (t.dmgBonus > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300">+${Math.round(t.dmgBonus * 100)}% DMG</span>`);
            if (t.speedBonus > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300">+${Math.round(t.speedBonus * 100)}% Tốc</span>`);
            if (t.cdr > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-400/40 text-violet-300">-${Math.round(t.cdr * 100)}% CD</span>`);
            if (state.killStacks > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300">🔥 +${Math.round(getKillBonus() * 100)}% DMG (Kill ×${state.killStacks})</span>`);
            document.getElementById('trait-buffs-list').innerHTML = pills.length ? pills.join('') : '<span class="text-slate-400">Không có buff</span>';

            document.getElementById('hud-kills').textContent = state.kills;
            document.getElementById('hud-rolls').textContent = state.traitRolls;
            const btn = document.getElementById('btn-roll-trait');
            const txt = document.getElementById('btn-roll-text');
            if (state.traitRolls > 0) {
                btn.classList.add('btn-roll-active');
                txt.textContent = `ROLL TRAIT [R] (${state.traitRolls} lượt)`;
            } else {
                btn.classList.remove('btn-roll-active');
                txt.textContent = 'ROLL TRAIT [R] (Cần 1 Kill)';
            }
        }

        function setActiveKit(kitName) {
            state.activeKit = kitName;
            document.getElementById('kit-btn-1').classList.toggle('active-melee', kitName === 'melee');
            document.getElementById('kit-btn-2').classList.toggle('active-magic', kitName === 'magic');
            const kit = SKILLS[kitName];
            ['z', 'x', 'c'].forEach(k => {
                document.getElementById(`slot-${k}-icon`).textContent = kit[k].icon;
                document.getElementById(`slot-${k}-name`).textContent = kit[k].name;
                document.getElementById(`slot-${k}-sub`).textContent = kit[k].sub;
            });
            if (state.player) state.player.meshParts.kitRingMat.color.setHex(kitName === 'melee' ? 0xf97316 : 0xa855f7);
            updateHotbarUI();
        }

        function updateHotbarUI() {
            const p = state.player;
            if (!p) return;
            const kit = SKILLS[state.activeKit];
            const locked = p.endlagTimer > 0 || p.stunTimer > 0 || p.grabbedBy || p.grabTarget;

            ['z', 'x', 'c'].forEach(k => {
                const sk = kit[k];
                const slot = document.getElementById(`slot-${k}`);
                const mask = document.getElementById(`slot-${k}-mask`);
                const cdEl = document.getElementById(`slot-${k}-cd`);
                const rem = p.cooldowns[sk.id], max = p.cooldownMax[sk.id] || sk.cd;

                slot.classList.toggle('in-endlag', !!locked);
                if (sk.needsTarget) {
                    slot.classList.toggle('target-ready', !!state.hoveredEnemy && rem <= 0 && !locked);
                    slot.classList.toggle('locked-target-needed', !state.hoveredEnemy);
                } else {
                    slot.classList.remove('target-ready', 'locked-target-needed');
                }
                if (rem > 0.01) {
                    mask.style.height = `${Math.min(100, (rem / max) * 100)}%`;
                    cdEl.classList.remove('hidden');
                    cdEl.textContent = rem >= 10 ? Math.ceil(rem) : rem.toFixed(1);
                } else {
                    mask.style.height = '0%'; cdEl.classList.add('hidden');
                }
            });

            const slotQ = document.getElementById('slot-q');
            const remQ = p.cooldowns.dash_q, maxQ = p.cooldownMax.dash_q || 1.5;
            document.getElementById('slot-q-sub').textContent = `CD ${(SKILLS.dash.cd * getCdMult(p)).toFixed(2)}s`;
            slotQ.classList.toggle('in-endlag', !!locked);
            if (remQ > 0.01) {
                document.getElementById('slot-q-mask').style.height = `${Math.min(100, (remQ / maxQ) * 100)}%`;
                const elQ = document.getElementById('slot-q-cd');
                elQ.classList.remove('hidden'); elQ.textContent = remQ.toFixed(1);
            } else {
                document.getElementById('slot-q-mask').style.height = '0%';
                document.getElementById('slot-q-cd').classList.add('hidden');
            }
        }

        function updatePlayerHUD(dt) {
            const p = state.player;
            if (!p) return;
            const pct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
            const hpKey = Math.ceil(p.hp) + '/' + p.maxHp;
            if (state._hudHpKey !== hpKey) {
                state._hudHpKey = hpKey;
                document.getElementById('player-hp-fill').style.width = `${pct}%`;
                document.getElementById('player-hp-trail').style.width = `${pct}%`;
                document.getElementById('player-hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp} HP (${Math.round(pct)}%)`;
            }

            const inSea = !p.dead && p.inSea;
            document.getElementById('sea-warning-banner').classList.toggle('hidden', !inSea);
            document.getElementById('sea-vignette').classList.toggle('active', inSea);

            const elWrap = document.getElementById('endlag-bar-container');
            if (p.endlagTimer > 0.01) {
                elWrap.classList.remove('hidden');
                document.getElementById('endlag-timer-text').textContent = `${p.endlagTimer.toFixed(2)}s`;
                document.getElementById('endlag-fill').style.width = `${p.endlagMax > 0 ? (p.endlagTimer / p.endlagMax) * 100 : 0}%`;
            } else elWrap.classList.add('hidden');

            const ccWrap = document.getElementById('cc-bar-container');
            if (p.grabTarget) {
                ccWrap.classList.remove('hidden');
                document.getElementById('cc-label-text').textContent = '👊 ĐANG TÓM CHẶT ĐỐI THỦ';
                document.getElementById('cc-timer-text').textContent = `${p.grabTimer.toFixed(2)}s`;
                document.getElementById('cc-fill').style.width = `${(p.grabTimer / 2.0) * 100}%`;
            } else if (p.grabbedBy) {
                ccWrap.classList.remove('hidden');
                document.getElementById('cc-label-text').textContent = '🔒 BỊ ĐỐI THỦ TÓM CHẶT!';
                document.getElementById('cc-timer-text').textContent = `${p.grabbedBy.grabTimer.toFixed(2)}s`;
                document.getElementById('cc-fill').style.width = `${(p.grabbedBy.grabTimer / 2.0) * 100}%`;
            } else if (p.stunTimer > 0.01) {
                ccWrap.classList.remove('hidden');
                document.getElementById('cc-label-text').textContent = '⚡ BỊ CHOÁNG (STUN)';
                document.getElementById('cc-timer-text').textContent = `${p.stunTimer.toFixed(2)}s`;
                document.getElementById('cc-fill').style.width = `${p.stunMax > 0 ? (p.stunTimer / p.stunMax) * 100 : 0}%`;
            } else ccWrap.classList.add('hidden');

            const pbEl = document.getElementById('purple-blind-overlay');
            if (state.purpleBlindTime > 0) {
                state.purpleBlindTime = Math.max(0, state.purpleBlindTime - dt);
                pbEl.style.opacity = `${Math.min(1, state.purpleBlindTime / 0.45)}`;
                document.getElementById('purple-blind-timer').textContent = `${state.purpleBlindTime.toFixed(1)}s`;
            } else pbEl.style.opacity = '0';

            updateHotbarUI();
        }

        function updateWorldOverlays(dt) {
            const w = window.innerWidth, h = window.innerHeight;
            const proj = state._projTmp || (state._projTmp = new THREE.Vector3());

            state.bots.forEach(bot => {
                if (!bot.overheadEl || bot.dead) return;
                proj.set(bot.pos.x, bot.pos.y + 3.9, bot.pos.z).project(state.camera);
                if (proj.z > 1) { if (bot._ovShown !== false) { bot.overheadEl.style.display = 'none'; bot._ovShown = false; } return; }
                if (bot._ovShown !== true) { bot.overheadEl.style.display = 'flex'; bot._ovShown = true; }
                bot.overheadEl.style.transform = `translate3d(${((proj.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * h).toFixed(1)}px, 0) translate(-50%, -100%)`;

                if (!bot._ovRefs) bot._ovRefs = {
                    fill: bot.overheadEl.querySelector('.bot-hp-fill'),
                    num: bot.overheadEl.querySelector('.bot-hp-num'),
                    pill: bot.overheadEl.querySelector('.bot-status-pill')
                };
                const hpInt = Math.ceil(bot.hp);
                if (bot._ovHp !== hpInt || bot._ovMax !== bot.maxHp) {
                    bot._ovHp = hpInt; bot._ovMax = bot.maxHp;
                    const pct = Math.max(0, (bot.hp / bot.maxHp) * 100);
                    bot._ovRefs.fill.style.width = `${pct}%`;
                    bot._ovRefs.num.textContent = `${hpInt} / ${bot.maxHp}`;
                }

                const pill = bot._ovRefs.pill;
                if (bot.grabbedBy) {
                    pill.classList.remove('hidden'); pill.textContent = `BỊ TÓM ${bot.grabbedBy.grabTimer.toFixed(1)}s`;
                    pill.style.background = '#c2410c'; pill.style.color = '#fff';
                } else if (bot.blindedTimer > 0) {
                    pill.classList.remove('hidden'); pill.textContent = `LÓA TÍM ${bot.blindedTimer.toFixed(1)}s`;
                    pill.style.background = '#a21caf'; pill.style.color = '#fff';
                } else if (bot.stunTimer > 0) {
                    pill.classList.remove('hidden'); pill.textContent = `STUN ${bot.stunTimer.toFixed(1)}s`;
                    pill.style.background = '#ca8a04'; pill.style.color = '#fff';
                } else if (bot.endlagTimer > 0) {
                    pill.classList.remove('hidden'); pill.textContent = `ENDLAG ${bot.endlagTimer.toFixed(1)}s`;
                    pill.style.background = '#ea580c'; pill.style.color = '#fff';
                } else if (bot.inSea) {
                    pill.classList.remove('hidden'); pill.textContent = '🌊 Ở BIỂN (-10%/s)';
                    pill.style.background = '#0284c7'; pill.style.color = '#fff';
                } else pill.classList.add('hidden');
            });

            for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
                const ft = state.floatingTexts[i];
                if (!ft._lt) { ft._lt = true; ft.el.style.left = '0px'; ft.el.style.top = '0px'; }
                ft.age += dt; ft.pos.y += ft.vy * dt; ft.vy *= 0.94;
                if (ft.age >= ft.duration) { ft.el.remove(); state.floatingTexts.splice(i, 1); continue; }
                proj.copy(ft.pos).project(state.camera);
                if (proj.z > 1) { ft.el.style.opacity = '0'; continue; }
                ft.el.style.transform = `translate3d(${((proj.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * h).toFixed(1)}px, 0) translate(-50%, -50%)`;
                ft.el.style.opacity = `${Math.max(0, 1 - Math.pow(ft.age / ft.duration, 1.5))}`;
            }
        }

        function showToast(msg, tone = 'amber') {
            const wrap = document.getElementById('toast-container');
            const el = document.createElement('div');
            const colors = {
                amber: 'bg-amber-950/95 border-amber-400 text-amber-100',
                emerald: 'bg-emerald-950/95 border-emerald-400 text-emerald-100',
                red: 'bg-rose-950/95 border-rose-400 text-rose-100'
            };
            el.className = `px-4 py-2 rounded-xl border text-xs sm:text-sm font-extrabold shadow-xl transition-all duration-300 ${colors[tone] || colors.amber}`;
            el.textContent = msg;
            wrap.appendChild(el);
            setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-8px)'; setTimeout(() => el.remove(), 300); }, 2500);
        }

        function addBattleLog(msg, colorCls = 'text-slate-200') {
            const log = document.getElementById('battle-log');
            const row = document.createElement('div');
            row.className = `px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700/70 text-[11px] font-bold shadow ${colorCls}`;
            row.textContent = msg;
            log.prepend(row);
            while (log.children.length > 4) log.lastChild.remove();
            setTimeout(() => { row.style.opacity = '0'; setTimeout(() => row.remove(), 300); }, 5500);
        }

        function buildTraitTableModal() {
            const box = document.getElementById('trait-table-rows');
            box.innerHTML = '';
            TRAITS.forEach(t => {
                const row = document.createElement('div');
                row.className = 'rounded-xl p-3 bg-slate-900/85 border flex flex-wrap sm:flex-nowrap items-center justify-between gap-3';
                row.style.borderColor = `${t.color}66`;
                row.innerHTML = `
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <canvas data-trait-portrait="${t.id}" width="128" height="128" class="w-14 h-14 rounded-full border-2 shrink-0 bg-slate-950" style="border-color:${t.color}"></canvas>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-black text-base" style="color:${t.color}">${t.name}</span>
                                <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">${t.rate}%</span>
                                ${t.confirmOnRoll ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">Hỏi xác nhận</span>' : ''}
                            </div>
                            <div class="text-xs text-slate-200 font-semibold mt-0.5">${t.desc}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">✨ VFX: ${t.vfxDesc}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button type="button" data-preview-trait="${t.id}" class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 cursor-pointer transition">
                            👁️ Thử VFX
                        </button>
                        <label class="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-300 cursor-pointer transition">
                            📷 Đổi ảnh PNG
                            <input type="file" accept="image/*" class="hidden" data-upload-trait="${t.id}">
                        </label>
                    </div>
                `;
                box.appendChild(row);
            });

            box.querySelectorAll('button[data-preview-trait]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const trait = TRAITS.find(tr => tr.id === btn.dataset.previewTrait);
                    if (trait) previewTraitVFX(trait);
                });
            });

            box.querySelectorAll('input[data-upload-trait]').forEach(inp => {
                inp.addEventListener('change', e => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const trait = TRAITS.find(tr => tr.id === inp.dataset.uploadTrait);
                    if (!trait) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                        const dataUrl = ev.target.result;
                        const img = new Image();
                        img.onload = () => {
                            renderOriginalPNGToEntry(trait, img);
                            saveTraitImageToIDB(trait.id, dataUrl);
                            showToast(`🖼️ Đã cập nhật ảnh PNG gốc cho ${trait.name}!`, 'emerald');
                        };
                        img.src = dataUrl;
                    };
                    reader.readAsDataURL(file);
                    inp.value = '';
                });
            });
            refreshAllPortraitCanvases();
        }

        /* =====================================================================
         * 16. INPUT HANDLING & SKILL TRIGGERS
         * ===================================================================== */
        function triggerPlayerSkill(key) {
            const p = state.player;
            if (!p || p.dead) return;
            SFX.init();
            if (key === 'q') {
                // Dash along movement keys if pressed, else toward cursor
                const moveDir = getPlayerMoveDir();
                const dir = moveDir || new THREE.Vector3().subVectors(state.cursorWorldPos, p.pos).setY(0);
                if (castDashQ(p, dir)) Net.cast('dash_q', { dx: r2(p.dashDir.x), dz: r2(p.dashDir.z) });
                return;
            }
            const cur = state.cursorWorldPos;
            const aim = { ax: r2(cur.x), az: r2(cur.z) };
            const tg = state.hoveredEnemy && state.hoveredEnemy.netId ? state.hoveredEnemy.netId : null;
            if (state.activeKit === 'melee') {
                if (key === 'z') { if (castMeleeZ(p, cur)) Net.cast('melee_z', aim); }
                else if (key === 'x') { if (castMeleeX(p)) Net.cast('melee_x'); }
                else if (key === 'c') { if (castMeleeC(p, state.hoveredEnemy)) Net.cast('melee_c', { tg }); }
            } else {
                if (key === 'z') { if (castMagicZ(p, cur)) Net.cast('magic_z', aim); }
                else if (key === 'x') { if (castMagicX(p, state.hoveredEnemy)) Net.cast('magic_x', { tg }); }
                else if (key === 'c') { if (castMagicC(p)) Net.cast('magic_c'); }
            }
        }

        function initEventListeners() {
            const container = document.getElementById('game-container');
            window.addEventListener('resize', () => {
                if (!state.camera || !state.renderer) return;
                state.camera.aspect = window.innerWidth / window.innerHeight;
                state.camera.updateProjectionMatrix();
                state.renderer.setSize(window.innerWidth, window.innerHeight);
            });

            window.addEventListener('keydown', e => {
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
                state.keys[e.code] = true;
                if (e.repeat) return;
                if (e.code === 'Digit1') setActiveKit('melee');
                else if (e.code === 'Digit2') setActiveKit('magic');
                else if (e.code === 'KeyZ') triggerPlayerSkill('z');
                else if (e.code === 'KeyX') triggerPlayerSkill('x');
                else if (e.code === 'KeyC') triggerPlayerSkill('c');
                else if (e.code === 'KeyQ') triggerPlayerSkill('q');
                else if (e.code === 'KeyR') requestTraitRoll();
            });
            window.addEventListener('keyup', e => { state.keys[e.code] = false; });

            container.addEventListener('contextmenu', e => e.preventDefault());
            container.addEventListener('mousedown', e => {
                SFX.init();
                if (e.button === 2) {
                    state.isRightDragging = true;
                    state.lastMouseX = e.clientX; state.lastMouseY = e.clientY;
                }
            });
            window.addEventListener('mouseup', e => { if (e.button === 2) state.isRightDragging = false; });
            window.addEventListener('mousemove', e => {
                state.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
                state.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
                if (state.isRightDragging) {
                    const dx = e.clientX - state.lastMouseX;
                    const dy = e.clientY - state.lastMouseY;
                    state.lastMouseX = e.clientX; state.lastMouseY = e.clientY;
                    state.camYaw -= dx * 0.0065;
                    state.camPitch = Math.max(0.24, Math.min(1.32, state.camPitch + dy * 0.0055));
                }
            });
            container.addEventListener('wheel', e => {
                state.camDist = Math.max(10, Math.min(38, state.camDist + e.deltaY * 0.015));
            }, { passive: true });

            // UI Buttons
            document.getElementById('kit-btn-1').addEventListener('click', () => setActiveKit('melee'));
            document.getElementById('kit-btn-2').addEventListener('click', () => setActiveKit('magic'));
            ['z', 'x', 'c', 'q'].forEach(k => {
                document.getElementById(`slot-${k}`).addEventListener('click', () => triggerPlayerSkill(k));
            });
            document.getElementById('btn-roll-trait').addEventListener('click', requestTraitRoll);
            document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
                const m = document.getElementById('modal-confirm-roll'); m.classList.add('hidden'); m.classList.remove('flex');
            });
            document.getElementById('btn-confirm-ok').addEventListener('click', () => {
                const m = document.getElementById('modal-confirm-roll'); m.classList.add('hidden'); m.classList.remove('flex');
                executeTraitRoll();
            });
            document.getElementById('btn-close-roll-anim').addEventListener('click', () => {
                const m = document.getElementById('modal-roll-anim'); m.classList.add('hidden'); m.classList.remove('flex');
            });
            document.getElementById('btn-open-trait-table').addEventListener('click', () => {
                refreshAllPortraitCanvases();
                const m = document.getElementById('modal-trait-table'); m.classList.remove('hidden'); m.classList.add('flex');
            });
            document.getElementById('btn-close-trait-table').addEventListener('click', () => {
                const m = document.getElementById('modal-trait-table'); m.classList.add('hidden'); m.classList.remove('flex');
            });
            document.getElementById('btn-help-toggle').addEventListener('click', () => {
                const m = document.getElementById('modal-help'); m.classList.remove('hidden'); m.classList.add('flex');
            });
            document.getElementById('btn-close-help').addEventListener('click', () => {
                const m = document.getElementById('modal-help'); m.classList.add('hidden'); m.classList.remove('flex');
            });
            document.getElementById('btn-audio-toggle').addEventListener('click', () => {
                SFX.enabled = !SFX.enabled;
                document.getElementById('btn-audio-toggle').textContent = SFX.enabled ? '🔊 Bật' : '🔇 Tắt';
            });

            // Multi-PNG Picker, Clear Cache & Exit VFX Preview
            const multiInput = document.getElementById('input-multi-png');
            multiInput.addEventListener('change', e => handleMultiPNGFiles(e.target.files));

            document.getElementById('btn-clear-png-cache').addEventListener('click', async () => {
                await clearAllTraitImagesFromIDB();
                resetAllPortraitsToPlaceholders();
                showToast('Đã xóa cache ảnh PNG đã lưu!', 'amber');
            });
            document.getElementById('btn-exit-vfx-preview').addEventListener('click', () => exitVFXPreview(true));

            // Global Drag & Drop PNG anywhere on screen
            const dropOverlay = document.getElementById('drop-overlay');
            let dragDepth = 0;
            window.addEventListener('dragenter', e => {
                e.preventDefault();
                dragDepth++;
                dropOverlay.classList.add('active');
            });
            window.addEventListener('dragover', e => {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
            });
            window.addEventListener('dragleave', e => {
                e.preventDefault();
                dragDepth = Math.max(0, dragDepth - 1);
                if (dragDepth === 0) dropOverlay.classList.remove('active');
            });
            window.addEventListener('drop', e => {
                e.preventDefault();
                dragDepth = 0;
                dropOverlay.classList.remove('active');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleMultiPNGFiles(e.dataTransfer.files);
                }
            });
        }

        /* =====================================================================
         * 18. MULTIPLAYER (SOCKET.IO)
         *     Model: every client simulates its OWN player fully (movement, skills, VFX).
         *     Other players are 'remote' entities living in state.bots:
         *       - position / hp / trait / timers come from 15Hz server snapshots
         *       - their skill casts are broadcast and REPLAYED locally with the exact same
         *         cast functions, so every VFX / hitbox / sound stays identical to single player
         *       - every client is authoritative for its OWN hp & status effects
         *         (a hit is evaluated on the victim's machine), kills are reported by the victim.
         *       - grabs (Lao Tóm) are attacker-authoritative: attacker detects, others replay.
         * ===================================================================== */
        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }
        function cleanName(n) {
            return String(n == null ? '' : n).replace(/[<>&"'`\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
        }
        const r2 = v => Math.round((+v || 0) * 100) / 100;

        // Everyone except the caster is a potential target (local player + every remote entity)
        function getTargetsOf(ent) {
            const out = [];
            if (state.player && state.player !== ent) out.push(state.player);
            for (const b of state.bots) if (b !== ent) out.push(b);
            return out;
        }

        // Spawn on the sand island, as far as possible from every living opponent
        function pickSpawn() {
            let best = null, bestScore = -1;
            for (let i = 0; i < 14; i++) {
                const a = Math.random() * Math.PI * 2, r = 11 + Math.random() * 15;
                const x = Math.cos(a) * r, z = Math.sin(a) * r;
                let nearest = 999;
                for (const b of state.bots) {
                    if (b.dead) continue;
                    nearest = Math.min(nearest, Math.hypot(b.pos.x - x, b.pos.z - z));
                }
                if (nearest > bestScore) { bestScore = nearest; best = { x, z }; }
            }
            return best || { x: 0, z: 14 };
        }

        // Per-frame smoothing of a remote entity toward its latest network snapshot
        function updateRemoteProxy(bot, dt) {
            bot.isMoving = false;
            const n = bot._net;
            if (!n || bot.dead) return;
            // while dashing (local replay) or being held, position is driven by the engine itself
            if (bot.dashTimer > 0 || bot.grabbedBy) return;
            const dx = n.x - bot.pos.x, dz = n.z - bot.pos.z, d = Math.hypot(dx, dz);
            if (d > 12) { bot.pos.x = n.x; bot.pos.z = n.z; }
            else {
                const k = Math.min(1, dt * 14);
                bot.pos.x += dx * k; bot.pos.z += dz * k;
            }
            if (d > 0.3) { bot.isMoving = true; bot.walkCycle += dt * 10; }
            if (!bot.grabTarget) {
                let df = n.f - bot.facing;
                while (df > Math.PI) df -= Math.PI * 2;
                while (df < -Math.PI) df += Math.PI * 2;
                bot.facing += df * Math.min(1, dt * 16);
            }
        }

        const Net = {
            socket: null, myId: null, joined: false, name: '', room: 'main', maxPlayers: 16,
            players: new Map(),     // netId -> remote entity
            board: [], ping: 0, offline: false,
            _sendIv: null, _pingIv: null, _lastSig: '', _lastSend: 0, _lastWho: 0,

            roomFromUrl() {
                try {
                    const r = new URLSearchParams(window.location.search).get('room') || 'main';
                    return r.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'main';
                } catch (e) { return 'main'; }
            },

            /* ---------- lobby / connection ---------- */
            start() {
                const ov = document.getElementById('mp-join-overlay');
                if (!ov) { this.offline = true; return; }      // page without multiplayer UI -> solo
                const inp = document.getElementById('mp-name-input');
                const btn = document.getElementById('mp-join-btn');
                const msg = document.getElementById('mp-join-msg');
                const offBtn = document.getElementById('mp-offline-btn');
                const roomLbl = document.getElementById('mp-room-label');
                this.room = this.roomFromUrl();
                if (roomLbl) roomLbl.textContent = this.room;
                try { inp.value = localStorage.getItem('tg_name') || ''; } catch (e) {}

                const go = () => {
                    if (btn.disabled) return;
                    btn.disabled = true; btn.style.opacity = '0.6';
                    this.connect(inp.value);
                };
                btn.addEventListener('click', go);
                inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
                offBtn.addEventListener('click', () => {
                    this.offline = true;
                    if (this.socket) { try { this.socket.disconnect(); } catch (e) {} }
                    ov.style.display = 'none';
                    addBattleLog('🧍 Chế độ chơi một mình (offline).', 'text-slate-300');
                });
                if (typeof io === 'undefined') {
                    msg.textContent = 'Không tải được socket.io — hãy mở game qua địa chỉ server (không phải file .html).';
                    offBtn.classList.remove('hidden');
                    btn.disabled = true; btn.style.opacity = '0.5';
                }
                setTimeout(() => { try { inp.focus(); } catch (e) {} }, 60);
            },

            connect(rawName) {
                const msg = document.getElementById('mp-join-msg');
                const btn = document.getElementById('mp-join-btn');
                this.name = cleanName(rawName) || ('Võ Sĩ ' + (100 + Math.floor(Math.random() * 900)));
                try { localStorage.setItem('tg_name', this.name); } catch (e) {}
                msg.textContent = 'Đang kết nối máy chủ… (server miễn phí có thể mất ~30s để thức dậy)';
                document.getElementById('mp-offline-btn').classList.remove('hidden');

                const s = this.socket = io({ transports: ['websocket', 'polling'], reconnectionDelay: 800, reconnectionDelayMax: 4000 });
                s.on('connect', () => { s.emit('join', { name: this.name, room: this.room }); });
                s.on('connect_error', () => { msg.textContent = 'Chưa kết nối được máy chủ, đang thử lại…'; });
                s.on('welcome', d => this.onWelcome(d));
                s.on('players', d => (d.players || []).forEach(p => this.addPlayer(p, false)));
                s.on('full', d => {
                    msg.textContent = `Phòng "${d.room}" đã đầy (${d.max}/${d.max}). Thử phòng khác bằng ?room=tenphong`;
                    btn.disabled = false; btn.style.opacity = '1';
                    try { s.disconnect(); } catch (e) {}
                });
                s.on('joined', d => this.addPlayer(d, true));
                s.on('left', d => this.removePlayer(d.id, true));
                s.on('snap', arr => this.onSnap(arr));
                s.on('cast', d => this.onCast(d));
                s.on('grab', d => this.onGrab(d));
                s.on('died', d => this.onDied(d));
                s.on('board', b => { this.board = b || []; this.renderBoard(); });
                s.on('disconnect', () => {
                    this.joined = false;
                    const rb = document.getElementById('mp-reconnect');
                    if (rb && !this.offline) rb.classList.remove('hidden');
                });

                clearInterval(this._sendIv); clearInterval(this._pingIv);
                this._sendIv = setInterval(() => this.sendState(false), 66);
                this._pingIv = setInterval(() => {
                    if (!this.joined) return;
                    const t0 = performance.now();
                    s.emit('p', () => { this.ping = Math.round(performance.now() - t0); this.renderBoard(); });
                }, 2500);
            },

            onWelcome(d) {
                this.myId = d.id; this.room = d.room; this.maxPlayers = d.max || 16;
                for (const id of Array.from(this.players.keys())) this.removePlayer(id, false);
                (d.players || []).forEach(p => this.addPlayer(p, false));
                this.board = d.board || [];
                this.joined = true;
                const ov = document.getElementById('mp-join-overlay'); if (ov) ov.style.display = 'none';
                const rb = document.getElementById('mp-reconnect'); if (rb) rb.classList.add('hidden');
                this._lastSig = '';
                this.sendState(true);
                addBattleLog(`🌐 Đã vào phòng "${d.room}" • ${this.players.size + 1} người chơi`, 'text-emerald-300');
                this.renderBoard();
            },

            /* ---------- remote players ---------- */
            entityByNetId(id) {
                if (!id) return null;
                if (id === this.myId) return state.player;
                return this.players.get(id) || null;
            },

            addPlayer(info, announce) {
                if (!info || !info.id || info.id === this.myId || this.players.has(info.id)) return;
                const s = info.s || {};
                const trait = TRAITS.find(t => t.id === s.tr) || TRAITS[0];
                const ent = createEntity({
                    id: 'r_' + info.id, netId: info.id, name: cleanName(info.name) || 'Player', role: 'remote',
                    trait, x: +s.x || 0, z: +s.z || 0, facing: +s.f || 0,
                    accentColor: s.kit === 'magic' ? 0xa855f7 : 0xf97316
                });
                ent._kit = s.kit === 'magic' ? 'magic' : 'melee';
                ent._net = { x: ent.pos.x, z: ent.pos.z, f: ent.facing };
                ent.killStacks = +s.ks || 0;
                if (s.hp != null) ent.hp = +s.hp;
                state.bots.push(ent);
                this.players.set(info.id, ent);
                if (s.dead) {
                    ent.dead = true; ent.hp = 0;
                    ent.meshParts.root.visible = false;
                    if (ent.overheadEl) ent.overheadEl.style.display = 'none';
                }
                if (announce) addBattleLog(`➕ ${ent.name} vào đấu trường`, 'text-emerald-300');
                this.renderBoard();
            },

            removePlayer(id, announce) {
                const ent = this.players.get(id);
                if (!ent) return;
                // release any grab links
                if (ent.grabTarget) { ent.grabTarget.grabbedBy = null; ent.grabTarget.pos.y = ent.grabTarget.baseGroundY || 0; ent.grabTarget = null; }
                if (ent.grabbedBy) { ent.grabbedBy.grabTarget = null; ent.grabbedBy = null; }
                for (const o of getTargetsOf(ent)) {
                    if (o.grabTarget === ent) o.grabTarget = null;
                    if (o.grabbedBy === ent) o.grabbedBy = null;
                    if (o.lastHitBy === ent) o.lastHitBy = null;
                }
                try { state.scene.remove(ent.meshParts.root); } catch (e) {}
                if (ent.overheadEl) ent.overheadEl.remove();
                const i = state.bots.indexOf(ent);
                if (i >= 0) state.bots.splice(i, 1);
                if (state.hoveredEnemy === ent) state.hoveredEnemy = null;
                this.players.delete(id);
                if (announce) addBattleLog(`➖ ${ent.name} rời đấu trường`, 'text-slate-400');
                this.renderBoard();
            },

            onSnap(arr) {
                if (!Array.isArray(arr)) return;
                for (const pair of arr) {
                    const id = pair[0], s = pair[1];
                    if (id === this.myId) continue;
                    const ent = this.players.get(id);
                    if (!ent) {
                        const now = performance.now();
                        if (this.socket && now - this._lastWho > 2000) { this._lastWho = now; this.socket.emit('who'); }
                        continue;
                    }
                    this.applyState(ent, s);
                }
            },

            applyState(ent, s) {
                if (!s) return;
                const n = ent._net || (ent._net = { x: ent.pos.x, z: ent.pos.z, f: ent.facing });
                n.x = s.x; n.z = s.z; n.f = s.f;
                ent.killStacks = s.ks || 0;

                if (s.tr && s.tr !== ent.trait.id) {
                    const tr = TRAITS.find(t => t.id === s.tr);
                    if (tr) {
                        applyTraitVisualsToEntity(ent, tr);
                        if (tr.auraLevel >= 4) addBattleLog(`🎲 ${ent.name} roll ra ${tr.name} (${tr.rate}%)!`, 'text-amber-300');
                    }
                }
                if (s.kit && s.kit !== ent._kit) {
                    ent._kit = s.kit;
                    ent.meshParts.kitRingMat.color.setHex(s.kit === 'magic' ? 0xa855f7 : 0xf97316);
                }
                if (!s.dead && ent.dead) {          // respawned
                    ent.dead = false; ent.hp = s.hp || ent.maxHp;
                    ent.pos.x = n.x; ent.pos.z = n.z; ent.pos.y = 0; ent.baseGroundY = 0;
                    ent.stunTimer = 0; ent.endlagTimer = 0; ent.blindedTimer = 0; ent.knockbackTimer = 0;
                    ent.dashTimer = 0; ent.grabTarget = null; ent.grabbedBy = null; ent.slam = null; ent.pullTo = null;
                    ent.inSea = false; ent.lastHitBy = null;
                    ent.meshParts.root.visible = true;
                    if (ent.overheadEl) { ent.overheadEl.style.display = 'flex'; ent._ovShown = undefined; }
                    spawnHealLotusVFX(ent);
                }
                if (!ent.dead) {
                    ent.hp = Math.max(0, Math.min(ent.maxHp, +s.hp || 0));
                    ent.stunTimer = s.stn || 0; ent.stunMax = ent.stunTimer > 0 ? Math.max(ent.stunMax, ent.stunTimer) : 0;
                    ent.blindedTimer = s.bl || 0;
                    ent.endlagTimer = s.el || 0;
                }
            },

            /* ---------- skills ---------- */
            cast(k, extra) {
                if (!this.joined || !state.player) return;
                const p = state.player;
                this.socket.emit('cast', Object.assign({ k, px: r2(p.pos.x), pz: r2(p.pos.z), f: r2(p.facing) }, extra || {}));
            },

            onCast(d) {
                const ent = this.players.get(d && d.id);
                if (!ent || ent.dead) return;
                if (isFinite(d.px) && isFinite(d.pz)) {
                    ent.pos.x = d.px; ent.pos.z = d.pz;
                    if (ent._net) { ent._net.x = d.px; ent._net.z = d.pz; }
                }
                if (isFinite(d.f)) ent.facing = d.f;
                const tg = this.entityByNetId(d.tg);
                const aim = new THREE.Vector3(+d.ax || 0, 0, +d.az || 0);
                for (const k in ent.cooldowns) ent.cooldowns[k] = 0;
                ent._force = true;                      // the caster's own client already validated cooldown / endlag
                try {
                    switch (d.k) {
                        case 'dash_q': castDashQ(ent, new THREE.Vector3(+d.dx || 0, 0, +d.dz || 0)); break;
                        case 'melee_z': castMeleeZ(ent, aim); break;
                        case 'melee_x': castMeleeX(ent); break;
                        case 'melee_c': castMeleeC(ent, tg); break;
                        case 'magic_z': castMagicZ(ent, aim); break;
                        case 'magic_x': castMagicX(ent, tg); break;
                        case 'magic_c': castMagicC(ent); break;
                    }
                } finally { ent._force = false; }
            },

            grab(tg) {
                if (!this.joined || !tg || !tg.netId) return;
                this.socket.emit('grab', { tg: tg.netId });
            },

            onGrab(d) {
                const att = this.players.get(d && d.id);
                const tg = this.entityByNetId(d && d.tg);
                if (!att || !tg || att.dead || tg.dead || tg === att) return;
                if (tg.grabbedBy || tg.grabTarget || att.grabTarget) return;
                startGrabHold(att, tg);
            },

            /* ---------- deaths / kills ---------- */
            died(killerNetId, bySea) {
                if (!this.joined) return;
                this.socket.emit('died', { k: killerNetId || null, sea: bySea ? 1 : 0 });
            },

            onDied(d) {
                const victim = this.players.get(d && d.id);
                if (!victim || victim.dead) return;
                const killer = d.k ? this.entityByNetId(d.k) : null;
                if (killer && !killer.isPlayer && killer !== victim && !d.sea) {
                    addBattleLog(`⚔️ ${killer.name} hạ gục ${victim.name}`, 'text-slate-200');
                }
                handleDeath(killer, victim, !!d.sea);   // rewards go to the local player only if he is the killer
            },

            /* ---------- state upload (15 Hz) ---------- */
            sendState(force) {
                const p = state.player;
                if (!p || !this.joined || !this.socket || !this.socket.connected) return;
                const s = {
                    x: r2(p.pos.x), z: r2(p.pos.z), f: r2(p.facing), hp: Math.round(p.hp),
                    tr: state.currentTrait.id, ks: state.killStacks, kit: state.activeKit, dead: p.dead ? 1 : 0,
                    stn: r2(p.stunTimer), bl: r2(p.blindedTimer), el: r2(p.endlagTimer)
                };
                const sig = [s.x, s.z, s.f, s.hp, s.tr, s.ks, s.kit, s.dead, s.stn > 0, s.bl > 0, s.el > 0].join('|');
                const now = performance.now();
                if (!force && sig === this._lastSig && now - this._lastSend < 400) return;
                this._lastSig = sig; this._lastSend = now;
                this.socket.volatile.emit('st', s);
            },

            /* ---------- scoreboard ---------- */
            renderBoard() {
                const head = document.getElementById('mp-board-head');
                const rows = document.getElementById('mp-board-rows');
                if (!head || !rows) return;
                const online = this.joined ? this.players.size + 1 : 0;
                head.textContent = this.joined
                    ? `🌐 ${online}/${this.maxPlayers} người • ${this.ping || '--'}ms • phòng ${this.room}`
                    : '🌐 Chưa kết nối';
                rows.textContent = '';
                const list = (this.board || []).slice().sort((a, b) => (b.k - a.k) || (a.d - b.d)).slice(0, 8);
                list.forEach((e, i) => {
                    const tr = TRAITS.find(t => t.id === e.t) || TRAITS[0];
                    const row = document.createElement('div');
                    row.className = 'flex items-center gap-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ' +
                        (e.id === this.myId ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-slate-900/60 border border-slate-700/50');
                    const idx = document.createElement('span'); idx.className = 'w-4 text-slate-400'; idx.textContent = String(i + 1);
                    const nm = document.createElement('span'); nm.className = 'flex-1 truncate text-slate-100'; nm.textContent = e.n;
                    const tt = document.createElement('span'); tt.className = 'text-[9px] font-extrabold'; tt.style.color = tr.color; tt.textContent = tr.name;
                    const kd = document.createElement('span'); kd.className = 'text-rose-300 tabular-nums'; kd.textContent = `${e.k}/${e.d}`;
                    row.append(idx, nm, tt, kd);
                    rows.appendChild(row);
                });
            }
        };

        /* =====================================================================
         * 17. MAIN ANIMATION LOOP & SAFE WINDOW.ONLOAD BOOTSTRAP
         * ===================================================================== */
        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(0.05, state.clock.getDelta());
            const t = state.clock.elapsedTime;

            animateOceanWaves(t);
            animateDecorations(t);
            updatePlayerMovement(dt);
            updateEntity(state.player, dt, t);
            state.bots.forEach(bot => {
                updateBotAI(bot, dt);
                updateEntity(bot, dt, t);
            });

            for (let i = state.vfxList.length - 1; i >= 0; i--) {
                const v = state.vfxList[i];
                v.age += dt;
                if (v.age >= v.duration) {
                    state.scene.remove(v.mesh);
                    state.vfxList.splice(i, 1);
                } else if (v.updateFn) {
                    v.updateFn(v.mesh, v.age / v.duration, dt);
                }
            }

            updateCameraAndRaycast(dt, t);
            updatePlayerHUD(dt);
            updateWorldOverlays(dt);
            state._mmFrame = (state._mmFrame || 0) + 1;
            if (state._mmFrame % 3 === 0) renderMinimap();
            state.renderer.render(state.scene, state.camera);
        }

        window.onload = function () {
            try {
                initTraitPortraits();
                initScene();
                applyMaxAnisotropyToTextures();
                initEntities();
                snapCameraImmediate();
                buildTraitTableModal();
                setActiveKit('melee');
                updateTraitHUD();
                initEventListeners();
                renderMinimap();
                state.renderer.render(state.scene, state.camera);
                bootstrapTraitPNGs();
                addBattleLog('🏝️ Đảo Đấu Trường 3D đã sẵn sàng! Kéo thả 7 ảnh PNG gốc vào màn hình để bọc kín nhân vật Oval!', 'text-sky-300');
                animate();
                Net.start();
            } catch (err) {
                console.error('Lỗi khởi tạo game:', err);
                showToast('Lỗi khởi tạo 3D: ' + err.message, 'red');
            }
        };
    })();
    