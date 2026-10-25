/* Meowdoku puzzle engine: seeded generator + solver for "one cat per region/row/column, no touching" puzzles. */
(function (root) {
  'use strict';

  // Deterministic PRNG (mulberry32)
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Random placement: one cat per row/column, no two adjacent (incl. diagonal).
  function randomPlacement(n, rng) {
    const cols = new Array(n).fill(-1);
    const used = new Array(n).fill(false);
    function rec(r) {
      if (r === n) return true;
      const order = shuffle([...Array(n).keys()], rng);
      for (const c of order) {
        if (used[c]) continue;
        if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
        cols[r] = c; used[c] = true;
        if (rec(r + 1)) return true;
        cols[r] = -1; used[c] = false;
      }
      return false;
    }
    rec(0);
    return cols; // cols[row] = column of the cat
  }

  // Grow regions outward from each cat cell until the board is filled.
  function growRegions(n, cols, rng) {
    const region = Array.from({ length: n }, () => new Array(n).fill(-1));
    const sizes = new Array(n).fill(1);
    const frontier = []; // cells assigned that may have unassigned neighbours
    for (let r = 0; r < n; r++) { region[r][cols[r]] = r; frontier.push([r, cols[r]]); }
    let remaining = n * n - n;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // Each region gets a "greed" factor so shapes vary in size.
    const greed = Array.from({ length: n }, () => 0.4 + rng() * 1.6);
    while (remaining > 0) {
      // pick a frontier cell, weighted by region greed and inverse size
      let total = 0;
      const w = frontier.map(([r, c]) => { const id = region[r][c]; const v = greed[id] / Math.sqrt(sizes[id]); total += v; return v; });
      let pick = rng() * total, idx = 0;
      for (; idx < frontier.length - 1; idx++) { pick -= w[idx]; if (pick <= 0) break; }
      const [r, c] = frontier[idx];
      const id = region[r][c];
      const opts = [];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && region[nr][nc] === -1) opts.push([nr, nc]);
      }
      if (opts.length === 0) { frontier.splice(idx, 1); continue; }
      const [nr, nc] = opts[Math.floor(rng() * opts.length)];
      region[nr][nc] = id; sizes[id]++; remaining--;
      frontier.push([nr, nc]);
    }
    return region;
  }

  // Count solutions (stops at `limit`). Returns {count, solution}
  function countSolutions(region, limit) {
    const n = region.length;
    const colUsed = new Array(n).fill(false);
    const regUsed = new Array(n).fill(false);
    const cols = new Array(n).fill(-1);
    let count = 0; const sols = [];
    function rec(r) {
      if (r === n) { count++; if (sols.length < 2) sols.push(cols.slice()); return count >= limit; }
      for (let c = 0; c < n; c++) {
        if (colUsed[c] || regUsed[region[r][c]]) continue;
        if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
        cols[r] = c; colUsed[c] = true; regUsed[region[r][c]] = true;
        const stop = rec(r + 1);
        cols[r] = -1; colUsed[c] = false; regUsed[region[r][c]] = false;
        if (stop) return true;
      }
      return false;
    }
    rec(0);
    return { count, solution: sols[0] || null, solutions: sols };
  }

  // Is region `id` still connected if cell (r,c) is removed from it?
  function staysConnected(region, id, r, c) {
    const n = region.length;
    const cells = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (region[i][j] === id && !(i === r && j === c)) cells.push(i * n + j);
    if (cells.length === 0) return false;
    const inSet = new Set(cells);
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const k = stack.pop(); const i = Math.floor(k / n), j = k % n;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || ni >= n || nj < 0 || nj >= n) continue;
        const nk = ni * n + nj;
        if (inSet.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
      }
    }
    return seen.size === cells.length;
  }

  // Nudge region boundaries until the intended solution is the only one.
  function repair(region, cols, rng) {
    const n = region.length;
    for (let iter = 0; iter < 60; iter++) {
      const res = countSolutions(region, 2);
      if (res.count === 1) return true;
      const alt = res.solutions.find(s => s.some((c, r) => c !== cols[r]));
      if (!alt) return false;
      const rows = shuffle([...Array(n).keys()].filter(r => alt[r] !== cols[r]), rng);
      let moved = false;
      for (const r of rows) {
        const c = alt[r]; const id = region[r][c];
        if (c === cols[r]) continue;
        const neigh = [];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && region[rr][cc] !== id && !neigh.includes(region[rr][cc])) neigh.push(region[rr][cc]);
        }
        if (neigh.length === 0 || !staysConnected(region, id, r, c)) continue;
        region[r][c] = neigh[Math.floor(rng() * neigh.length)];
        moved = true; break;
      }
      if (!moved) return false;
    }
    return countSolutions(region, 2).count === 1;
  }

  // Generate a puzzle with a unique solution for a given seed and size.
  function generate(seed, n) {
    const rng = makeRng(seed);
    for (let attempt = 0; attempt < 400; attempt++) {
      const cols = randomPlacement(n, rng);
      const region = growRegions(n, cols, rng);
      if (repair(region, cols, rng)) {
        return { n, region, solution: cols, seed, attempts: attempt + 1 };
      }
    }
    // Extremely unlikely fallback: different seed
    return generate(seed + 7919, n);
  }

  // Cells ruled out by placed cats (same row/col/region or touching).
  function blockedByCats(region, cats) {
    const n = region.length;
    const blocked = Array.from({ length: n }, () => new Array(n).fill(false));
    for (const [r, c] of cats) {
      for (let i = 0; i < n; i++) { blocked[r][i] = true; blocked[i][c] = true; }
      for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) if (region[rr][cc] === region[r][c]) blocked[rr][cc] = true;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) blocked[rr][cc] = true;
      }
    }
    for (const [r, c] of cats) blocked[r][c] = false;
    return blocked;
  }

  // Find a hint: the "most forced" correct cat not yet placed. Returns {r,c,reason}
  function findHint(puzzle, cats, xs) {
    const { region, solution, n } = puzzle;
    const placed = new Set(cats.map(([r, c]) => r * n + c));
    const blocked = blockedByCats(region, cats);
    const isCand = (r, c) => !blocked[r][c] && !placed.has(r * n + c) && !(xs && xs[r][c]);
    // Regions: count candidates per region
    let best = null;
    for (let id = 0; id < n; id++) {
      if (cats.some(([r, c]) => region[r][c] === id)) continue;
      let cands = 0;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (region[r][c] === id && isCand(r, c)) cands++;
      if (!best || cands < best.cands) best = { id, cands };
    }
    if (!best) return null;
    // Find the solution cell in that region
    for (let r = 0; r < n; r++) if (region[r][solution[r]] === best.id) {
      return { r, c: solution[r], reason: best.cands === 1 ? 'only' : 'region' };
    }
    return null;
  }

  const api = { makeRng, generate, repair, countSolutions, blockedByCats, findHint, randomPlacement, growRegions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MeowPuzzle = api;
})(typeof window !== 'undefined' ? window : globalThis);
