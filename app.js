/* Kinsley's Meow Doku — game logic */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const P = window.MeowPuzzle;

  // ---------- Personalization ----------
  const FRIENDS = ['Kinsley', 'Emily', 'Rainey', 'Lee Ander', 'Abby', 'Ellie Kate', 'Flora', 'Elijah'];
  // Chapters: groups of levels named after Kinsley and her friends
  const CHAPTERS = [
    { from: 1,   to: 5,   name: "Kinsley's Kitchen",      emoji: '🧁' },
    { from: 6,   to: 12,  name: "Emily's Garden",         emoji: '🌷' },
    { from: 13,  to: 20,  name: "Rainey's Rooftop",       emoji: '🌈' },
    { from: 21,  to: 30,  name: "Lee Ander's Lighthouse", emoji: '🏮' },
    { from: 31,  to: 42,  name: "Abby's Attic",           emoji: '🧸' },
    { from: 43,  to: 56,  name: "Ellie Kate's Castle",    emoji: '🏰' },
    { from: 57,  to: 72,  name: "Flora's Flower Shop",    emoji: '🌸' },
    { from: 73,  to: 90,  name: "Elijah's Treehouse",     emoji: '🌳' },
    { from: 91,  to: 999, name: "Kinsley's Kingdom",      emoji: '👑' },
  ];
  const WIN_LINES = [
    'Purr-fect, {name}!', 'You did it, {name}!', 'Meow-velous, {name}!', '{name} is a kitty genius!',
    'Paws-itively brilliant, {name}!', 'The kitties love you, {name}!', 'Super star, {name}! ⭐',
  ];
  const REGION_COLORS = ['#c9b6f5', '#ffd0a6', '#a9d8ff', '#bfe8b0', '#ffb8d0', '#fff3a0', '#a8ece0', '#ffa8a0', '#e0d6c3', '#d8bfff'];
  const AVATARS = ['🐱', '🦄', '🐶', '🐰', '🦊', '🐼', '🐸', '🐥'];

  function chapterFor(level) { return CHAPTERS.find(c => level >= c.from && level <= c.to) || CHAPTERS[CHAPTERS.length - 1]; }
  function sizeForLevel(l) { return l <= 3 ? 5 : l <= 10 ? 6 : l <= 20 ? 7 : l <= 40 ? 8 : l <= 80 ? 9 : 10; }
  function seedForLevel(l) { return l * 1013 + 77; }
  function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function dateSeed() { return parseInt(todayKey().replace(/-/g, ''), 10); }
  const DAILY_UNLOCK = 21;

  // ---------- Cat artwork ----------
  function catSVG(style) {
    const s = { pink: ['#f7a8c4', '#e58db0', '#ffd1e0', '#ec8fb3'], orange: ['#f9a94b', '#d9842a', '#ffd3a0', '#e3892c'], gray: ['#b8b4c4', '#8d8899', '#e6e2ee', '#9a95a8'] }[style || 'pink'];
    const bow = style === 'pink' || !style ? `<g transform="translate(47 10)"><path d="M0 4 L-9 -3 L-9 11 Z M0 4 L9 -3 L9 11 Z" fill="#ff6f61"/><circle cx="0" cy="4" r="3" fill="#ffb3aa"/></g>` : '';
    return `<svg class="cat" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 32 L13 9 L30 21 Z" fill="${s[0]}" stroke="${s[1]}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M52 32 L51 9 L34 21 Z" fill="${s[0]}" stroke="${s[1]}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M17 29 L17.5 15 L27 22 Z M47 29 L46.5 15 L37 22 Z" fill="${s[2]}"/>
      <ellipse cx="32" cy="37" rx="24" ry="21" fill="${s[0]}" stroke="${s[1]}" stroke-width="2"/>
      <path d="M26 18 q6 -4 12 0 M29 23 q3 -2 6 0" stroke="${s[3]}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="17" cy="43" r="4" fill="#ffb6c8" opacity=".8"/><circle cx="47" cy="43" r="4" fill="#ffb6c8" opacity=".8"/>
      <ellipse cx="23" cy="37" rx="3.4" ry="4.2" fill="#3a2a2a"/><ellipse cx="41" cy="37" rx="3.4" ry="4.2" fill="#3a2a2a"/>
      <circle cx="24.3" cy="35.5" r="1.3" fill="#fff"/><circle cx="42.3" cy="35.5" r="1.3" fill="#fff"/>
      <path d="M29.5 43 L34.5 43 L32 46 Z" fill="#e06a8f"/>
      <path d="M32 46 v2 M28 49 q4 3 8 0" stroke="#3a2a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M4 40 L18 42 M4 46 L18 45 M60 40 L46 42 M60 46 L46 45" stroke="${s[1]}" stroke-width="1.4" stroke-linecap="round"/>
      ${bow}
    </svg>`;
  }
  const heartSVG = `<svg class="heart" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2 0 3.5 1 4.4 2.3.9-1.3 2.4-2.3 4.4-2.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="#ff5c7a" stroke="#d93a5a" stroke-width="1.2"/></svg>`;

  // ---------- Persistent state ----------
  const DEFAULT = {
    name: 'Kinsley', level: 1, fish: 0, streak: 0, lastPlayDate: null, daily: {}, avatar: 0,
    settings: { sound: true, vibrate: true, autoX: true, catStyle: 'pink' }, bestTimes: {}, seenRules: false,
  };
  let S = load();
  function load() {
    try { const raw = localStorage.getItem('kinsley-meowdoku'); if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw), { settings: Object.assign({}, DEFAULT.settings, (JSON.parse(raw).settings || {})) }); } catch (e) { }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { localStorage.setItem('kinsley-meowdoku', JSON.stringify(S)); }

  // ---------- Sound ----------
  let actx = null;
  function audio() { if (!S.settings.sound) return null; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; } catch (e) { return null; } }
  function tone(f, dur, type, gain, when, slideTo) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, a.currentTime + (when || 0));
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + (when || 0) + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + (when || 0));
    g.gain.exponentialRampToValueAtTime(gain || 0.2, a.currentTime + (when || 0) + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + (when || 0) + dur);
    o.connect(g); g.connect(a.destination); o.start(a.currentTime + (when || 0)); o.stop(a.currentTime + (when || 0) + dur + 0.05);
  }
  const SFX = {
    tap: () => tone(880, 0.06, 'sine', 0.08),
    meow: () => { tone(700, 0.18, 'triangle', 0.15, 0, 500); tone(1050, 0.18, 'sine', 0.05, 0.02, 750); },
    wrong: () => { tone(200, 0.25, 'sawtooth', 0.12, 0, 120); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.15, i * 0.12)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.2)),
    hint: () => { tone(1200, 0.1, 'sine', 0.1); tone(1600, 0.15, 'sine', 0.1, 0.1); },
  };
  function buzz(ms) { if (S.settings.vibrate && navigator.vibrate) navigator.vibrate(ms); }

  // ---------- Game state ----------
  let G = null; // { mode, level, puzzle, cats:Set, xs:[][], hearts, hints, history, elapsed, startTs, running, over }
  let cellEls = [];
  let timerInt = null;

  function newGame(mode, level) {
    const n = mode === 'daily' ? 8 : sizeForLevel(level);
    const seed = mode === 'daily' ? dateSeed() : seedForLevel(level);
    const puzzle = P.generate(seed, n);
    G = { mode, level, puzzle, cats: new Set(), xs: Array.from({ length: n }, () => new Array(n).fill(false)), hearts: 3, hints: 3, history: [], elapsed: 0, startTs: null, running: false, over: false, nameIdx: 0 };
    showScreen('game');
    buildBoard();
    renderHeader();
    renderBoard();
    startTimer();
    const ch = chapterFor(level);
    if (mode === 'daily') toast(`📅 Daily Challenge — go ${S.name}!`);
    else if (level === ch.from) toast(`${ch.emoji} Welcome to ${ch.name}!`);
  }

  function buildBoard() {
    const n = G.puzzle.n;
    const board = $('board');
    board.innerHTML = '';
    const wrap = board.parentElement;
    const avail = Math.min(wrap.clientWidth, wrap.clientHeight, 520) - 8;
    const cs = Math.floor(avail / n);
    board.style.setProperty('--cs', cs + 'px');
    board.style.gridTemplateColumns = `repeat(${n}, ${cs}px)`;
    cellEls = [];
    const reg = G.puzzle.region;
    for (let r = 0; r < n; r++) {
      cellEls.push([]);
      for (let c = 0; c < n; c++) {
        const d = document.createElement('div');
        d.className = 'cell';
        d.style.width = d.style.height = cs + 'px';
        d.style.background = REGION_COLORS[reg[r][c] % REGION_COLORS.length];
        const thick = '3px solid var(--line)', thin = '1px solid rgba(60,40,50,.14)';
        d.style.borderTop = r > 0 && reg[r - 1][c] !== reg[r][c] ? thick : (r > 0 ? thin : 'none');
        d.style.borderLeft = c > 0 && reg[r][c - 1] !== reg[r][c] ? thick : (c > 0 ? thin : 'none');
        d.dataset.r = r; d.dataset.c = c;
        let pressT = null, longFired = false;
        d.addEventListener('click', () => { if (longFired) { longFired = false; return; } onTap(r, c); });
        d.addEventListener('pointerdown', () => { longFired = false; pressT = setTimeout(() => { pressT = null; longFired = true; onLongPress(r, c); }, 450); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => d.addEventListener(ev, () => { if (pressT) { clearTimeout(pressT); pressT = null; } }));
        board.appendChild(d);
        cellEls[r].push(d);
      }
    }
  }

  function renderBoard() {
    const n = G.puzzle.n;
    const cats = [...G.cats].map(k => [Math.floor(k / n), k % n]);
    const blocked = P.blockedByCats(G.puzzle.region, cats);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const el = cellEls[r][c];
      const key = r * n + c;
      const hasCat = G.cats.has(key);
      el.classList.remove('ax', 'x');
      if (hasCat) {
        if (!el.querySelector('svg.cat')) { el.innerHTML = catSVG(S.settings.catStyle); el.classList.add('placed'); }
        el.dataset.state = 'cat';
      } else {
        if (el.querySelector('svg.cat')) { el.innerHTML = ''; el.classList.remove('placed'); }
        if (blocked[r][c] && S.settings.autoX) { el.innerHTML = '<span class="mark">✕</span>'; el.classList.add('ax'); el.dataset.state = 'ax'; }
        else if (G.xs[r][c]) { el.innerHTML = '<span class="mark">✕</span>'; el.classList.add('x'); el.dataset.state = 'x'; }
        else { el.innerHTML = ''; el.dataset.state = ''; }
      }
    }
    $('undoBtn').disabled = G.history.length === 0 || G.over;
    $('hintBtn').disabled = G.hints <= 0 || G.over;
    $('hintCount').textContent = G.hints;
  }

  function renderHeader() {
    const t = $('gameTitle');
    if (G.mode === 'daily') t.innerHTML = `Daily Challenge<small>${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${S.name}'s puzzle</small>`;
    else { const ch = chapterFor(G.level); t.innerHTML = `Level ${G.level}<small>${ch.emoji} ${ch.name}</small>`; }
    const h = $('hearts'); h.innerHTML = heartSVG + heartSVG + heartSVG;
    [...h.children].forEach((el, i) => { if (i >= G.hearts) el.classList.add('lost'); });
  }

  // ---------- Interaction ----------
  function onTap(r, c) {
    if (!G || G.over) return;
    const n = G.puzzle.n, key = r * n + c, el = cellEls[r][c];
    const state = el.dataset.state;
    if (state === 'cat') { G.cats.delete(key); G.history.push({ t: 'uncat', r, c }); SFX.tap(); renderBoard(); return; }
    if (state === 'ax') { el.classList.remove('blocked-tap'); void el.offsetWidth; el.classList.add('blocked-tap'); SFX.tap(); return; }
    if (state === 'x') { tryPlaceCat(r, c); return; }
    G.xs[r][c] = true; G.history.push({ t: 'x', r, c }); SFX.tap(); buzz(8); renderBoard();
  }
  function onLongPress(r, c) {
    if (!G || G.over) return;
    if (cellEls[r][c].dataset.state === 'x') { G.xs[r][c] = false; G.history.push({ t: 'unx', r, c }); SFX.tap(); renderBoard(); }
  }
  function tryPlaceCat(r, c, viaHint) {
    const n = G.puzzle.n, key = r * n + c, el = cellEls[r][c];
    if (G.puzzle.solution[r] === c) {
      G.cats.add(key); G.xs[r][c] = false;
      G.history.push({ t: 'cat', r, c, viaHint: !!viaHint });
      SFX.meow(); buzz(15);
      renderBoard();
      nameTag(el);
      if (G.cats.size === n) onWin();
    } else {
      G.hearts--; G.xs[r][c] = true; G.history.push({ t: 'mistake', r, c });
      el.innerHTML = catSVG(S.settings.catStyle);
      el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
      SFX.wrong(); buzz([40, 30, 40]);
      renderHeader();
      const hb = $('hearts').children[G.hearts]; if (hb) hb.classList.add('pop');
      setTimeout(() => { el.classList.remove('wrong'); renderBoard(); if (G.hearts <= 0) onLose(); }, 650);
    }
  }
  function nameTag(el) {
    const name = FRIENDS[(G.nameIdx++) % FRIENDS.length];
    const tag = document.createElement('div'); tag.className = 'name-tag'; tag.textContent = `${name} 💕`;
    el.appendChild(tag); setTimeout(() => tag.remove(), 1500);
  }
  function undo() {
    if (!G || G.over || !G.history.length) return;
    const a = G.history.pop(); const n = G.puzzle.n, key = a.r * n + a.c;
    if (a.t === 'x') G.xs[a.r][a.c] = false;
    else if (a.t === 'unx') G.xs[a.r][a.c] = true;
    else if (a.t === 'cat') G.cats.delete(key);
    else if (a.t === 'uncat') G.cats.add(key);
    else if (a.t === 'mistake') G.xs[a.r][a.c] = false;
    SFX.tap(); renderBoard();
  }
  function clearXs() {
    if (!G || G.over) return;
    const n = G.puzzle.n; let any = false;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (G.xs[r][c]) { G.xs[r][c] = false; any = true; }
    if (any) { G.history = G.history.filter(h => h.t !== 'x' && h.t !== 'unx' && h.t !== 'mistake'); SFX.tap(); renderBoard(); }
  }
  function hint() {
    if (!G || G.over || G.hints <= 0) return;
    const n = G.puzzle.n;
    const cats = [...G.cats].map(k => [Math.floor(k / n), k % n]);
    const h = P.findHint(G.puzzle, cats, G.xs);
    if (!h) return;
    G.hints--; SFX.hint();
    const el = cellEls[h.r][h.c];
    el.classList.add('hint-glow');
    renderBoard();
    toast(h.reason === 'only' ? '💡 Only one spot left in this area!' : '💡 A kitty belongs right here');
    setTimeout(() => { el.classList.remove('hint-glow'); if (!G.over && !G.cats.has(h.r * n + h.c)) tryPlaceCat(h.r, h.c, true); }, 1100);
  }

  // ---------- Timer ----------
  function startTimer() { G.startTs = Date.now(); G.running = true; clearInterval(timerInt); timerInt = setInterval(tick, 250); tick(); }
  function pauseTimer() { if (G && G.running) { G.elapsed += Date.now() - G.startTs; G.running = false; } clearInterval(timerInt); }
  function resumeTimer() { if (G && !G.running && !G.over) { G.startTs = Date.now(); G.running = true; timerInt = setInterval(tick, 250); } }
  function elapsedSec() { return Math.floor((G.elapsed + (G.running ? Date.now() - G.startTs : 0)) / 1000); }
  function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function tick() { if (G) $('timer').textContent = fmt(elapsedSec()); }

  // ---------- Win / lose ----------
  function onWin() {
    G.over = true; pauseTimer();
    const secs = elapsedSec(); const n = G.puzzle.n;
    cellEls.flat().forEach(el => { if (el.dataset.state === 'cat') el.classList.add('win'); });
    SFX.win(); buzz([30, 40, 30, 40, 80]);
    const reward = 10 + (n - 5) * 5 + (G.mode === 'daily' ? 20 : 0);
    S.fish += reward;
    let note = '';
    const today = todayKey();
    if (S.lastPlayDate !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      S.streak = S.lastPlayDate === yk ? S.streak + 1 : 1; S.lastPlayDate = today;
      note = `🔥 Streak: ${S.streak} day${S.streak === 1 ? '' : 's'}!`;
    }
    if (G.mode === 'daily') { S.daily[today] = secs; $('nextBtn').textContent = 'Home'; }
    else {
      const key = String(G.level);
      if (!S.bestTimes[key] || secs < S.bestTimes[key]) { if (S.bestTimes[key]) note = `⏱️ New best time!`; S.bestTimes[key] = secs; }
      if (G.level === S.level) {
        S.level++;
        if (S.level === DAILY_UNLOCK) note = '🎉 Daily Challenge unlocked!';
        else if (chapterFor(S.level).from === S.level) note = `${chapterFor(S.level).emoji} Next up: ${chapterFor(S.level).name}!`;
      }
      $('nextBtn').textContent = 'Next Level';
    }
    save();
    $('winTitle').textContent = WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)].replace('{name}', S.name);
    $('winTime').textContent = fmt(secs);
    $('winReward').textContent = `🐟 +${reward}`;
    $('winNote').textContent = note;
    $('winCats').innerHTML = catSVG(S.settings.catStyle).repeat(Math.min(n, 5));
    setTimeout(() => { openModal('winModal'); confetti(); }, 900);
  }
  function onLose() {
    G.over = true; pauseTimer(); SFX.lose();
    $('continueBtn').disabled = S.fish < 20;
    $('continueBtn').textContent = S.fish < 20 ? `Keep going (need 🐟 20, you have ${S.fish})` : 'Keep going (🐟 20)';
    openModal('loseModal');
  }

  // ---------- Screens, modals, home ----------
  function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); if (id === 'home') renderHome(); }
  function openModal(id) { $(id).classList.add('open'); }
  function closeModal(id) { $(id).classList.remove('open'); }
  let toastT = null;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

  function renderHome() {
    const ch = chapterFor(S.level);
    $('playBtn').innerHTML = `Level ${S.level}<small>${ch.emoji} ${ch.name}</small>`;
    $('fishHome').textContent = S.fish;
    $('greeting').innerHTML = `Hi, ${S.name}!<small>${S.streak > 0 ? `${S.streak}-day streak 🔥` : 'Ready to play?'}</small>`;
    $('ownerName').textContent = `${S.name}'s`;
    $('streakCount').textContent = S.streak;
    const today = todayKey();
    $('streakCheck').hidden = S.lastPlayDate !== today;
    const dc = $('dailyCard'); const unlocked = S.level >= DAILY_UNLOCK;
    dc.classList.toggle('unlocked', unlocked);
    dc.classList.toggle('done', !!S.daily[today]);
    dc.querySelector('.lock').hidden = unlocked;
    dc.querySelector('.calendar').hidden = !unlocked;
    $('dailyDay').textContent = new Date().getDate();
    $('dailyFoot').innerHTML = !unlocked ? `Unlock at Lv.${DAILY_UNLOCK}` : S.daily[today] ? `✓ Done in ${fmt(S.daily[today])}` : 'Play today!';
    renderAvatar();
    document.title = `${S.name}'s Meow Doku`;
  }
  function renderAvatar() {
    const a = AVATARS[S.avatar] || AVATARS[0];
    if (typeof a === 'object') { $('avatarImg').hidden = false; $('avatarImg').src = a.src; $('avatarEmoji').hidden = true; }
    else { $('avatarImg').hidden = true; $('avatarEmoji').hidden = false; $('avatarEmoji').textContent = a; }
  }
  function buildAvatarGrid() {
    const g = $('avatarGrid'); g.innerHTML = '';
    AVATARS.forEach((a, i) => {
      const b = document.createElement('button'); b.className = 'avatar-opt' + (i === S.avatar ? ' sel' : '');
      b.innerHTML = typeof a === 'object' ? `<img src="${a.src}" alt="${S.name}">` : a;
      b.onclick = () => { S.avatar = i; save(); buildAvatarGrid(); renderAvatar(); SFX.tap(); };
      g.appendChild(b);
    });
  }
  function syncSettingsUI() {
    $('nameInput').value = S.name; $('soundToggle').checked = S.settings.sound; $('vibeToggle').checked = S.settings.vibrate;
    $('autoXToggle').checked = S.settings.autoX; $('catStyle').value = S.settings.catStyle;
  }

  // ---------- Confetti ----------
  function confetti() {
    const cv = $('confetti'); const ctx = cv.getContext('2d');
    cv.width = cv.offsetWidth * devicePixelRatio; cv.height = cv.offsetHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
    cv.style.display = 'block';
    const W = cv.offsetWidth, H = cv.offsetHeight;
    const cols = ['#ff8fb1', '#b39ddb', '#8fe3d4', '#ffd34d', '#ff6f61', '#fff'];
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
    let t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); });
      if (now - t0 < 3200) requestAnimationFrame(frame); else { cv.style.display = 'none'; }
    })(t0);
  }

  // ---------- Wiring ----------
  $('playBtn').onclick = () => { SFX.tap(); if (!S.seenRules) { openModal('rulesModal'); } else newGame('level', S.level); };
  $('rulesOk').onclick = () => { closeModal('rulesModal'); if (!S.seenRules) { S.seenRules = true; save(); newGame('level', S.level); } };
  $('dailyCard').onclick = () => { SFX.tap(); if (S.level < DAILY_UNLOCK) toast(`🔒 Reach Level ${DAILY_UNLOCK} to unlock the Daily Challenge`); else newGame('daily', S.level); };
  $('streakCard').onclick = () => { SFX.tap(); toast(S.lastPlayDate === todayKey() ? `✓ You played today, ${S.name}! Streak: ${S.streak}` : `Finish a level today to keep your streak going!`); };
  $('settingsBtn').onclick = () => { SFX.tap(); syncSettingsUI(); openModal('settingsModal'); };
  $('settingsClose').onclick = () => { closeModal('settingsModal'); const nm = $('nameInput').value.trim(); if (nm) S.name = nm; save(); renderHome(); };
  $('soundToggle').onchange = e => { S.settings.sound = e.target.checked; save(); };
  $('vibeToggle').onchange = e => { S.settings.vibrate = e.target.checked; save(); };
  $('autoXToggle').onchange = e => { S.settings.autoX = e.target.checked; save(); if (G) renderBoard(); };
  $('catStyle').onchange = e => { S.settings.catStyle = e.target.value; save(); if (G) { cellEls.flat().forEach(el => { if (el.querySelector('svg.cat')) el.innerHTML = catSVG(S.settings.catStyle); }); } };
  $('howToBtn').onclick = () => { closeModal('settingsModal'); openModal('rulesModal'); };
  $('resetBtn').onclick = () => { if (confirm('Reset all progress? This cannot be undone.')) { localStorage.removeItem('kinsley-meowdoku'); S = load(); closeModal('settingsModal'); renderHome(); } };
  $('avatarBtn').onclick = () => { SFX.tap(); buildAvatarGrid(); openModal('avatarModal'); };
  $('avatarClose').onclick = () => closeModal('avatarModal');
  $('backBtn').onclick = () => { SFX.tap(); if (G && !G.over) { pauseTimer(); openModal('pauseModal'); } else showScreen('home'); };
  $('resumeBtn').onclick = () => { closeModal('pauseModal'); resumeTimer(); };
  $('pauseHomeBtn').onclick = () => { closeModal('pauseModal'); G = null; clearInterval(timerInt); showScreen('home'); };
  $('undoBtn').onclick = undo; $('clearBtn').onclick = clearXs; $('hintBtn').onclick = hint;
  $('nextBtn').onclick = () => { closeModal('winModal'); if (G.mode === 'daily') showScreen('home'); else newGame('level', S.level); };
  $('winHomeBtn').onclick = () => { closeModal('winModal'); showScreen('home'); };
  $('retryBtn').onclick = () => { closeModal('loseModal'); newGame(G.mode, G.level); };
  $('continueBtn').onclick = () => { if (S.fish < 20) return; S.fish -= 20; save(); closeModal('loseModal'); G.hearts = 3; G.over = false; renderHeader(); renderBoard(); resumeTimer(); toast('❤️ Hearts refilled!'); };
  $('loseHomeBtn').onclick = () => { closeModal('loseModal'); showScreen('home'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseTimer(); else if (G && !$('pauseModal').classList.contains('open')) resumeTimer(); });
  window.addEventListener('resize', () => { if (G && $('game').classList.contains('active')) { buildBoard(); renderBoard(); } });

  renderHome();

  // Debug / test hooks (used by the screenshot script): ?test=game starts level 3 with a few moves made.
  window.__meow = { newGame, tryPlaceCat, onTap, state: () => ({ S, G }) };
  const q = new URLSearchParams(location.search);
  if (q.get('test')) {
    S.seenRules = true;
    const lvl = parseInt(q.get('level') || '3', 10);
    newGame('level', lvl);
    if (q.get('test') === 'game') {
      const sol = G.puzzle.solution;
      tryPlaceCat(0, sol[0]); tryPlaceCat(2, sol[2]);
      G.xs[4][sol[4] === 0 ? 1 : 0] = true;
      renderBoard();
    } else if (q.get('test') === 'win') {
      G.puzzle.solution.forEach((c, r) => tryPlaceCat(r, c));
    }
  }
})();
