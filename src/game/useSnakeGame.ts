import { useCallback, useEffect, useRef, useState } from 'react';
import { setSfxMuted, sfx } from './sfx';

/* ---------------------------------- types ---------------------------------- */

export type Vec = { x: number; y: number };
export type DirKey = 'up' | 'down' | 'left' | 'right';
export type Phase = 'menu' | 'playing' | 'paused' | 'over';
export type DifficultyId = 'garden' | 'arcade' | 'turbo';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  tagline: string;
  base: number; // ms per step at start
  min: number; // fastest it ever gets
  hue: string;
}

export const GRID = 20;

export const DIFFICULTIES: Difficulty[] = [
  { id: 'garden', name: 'Garden', tagline: 'A gentle glide', base: 175, min: 118, hue: '#7de0a0' },
  { id: 'arcade', name: 'Arcade', tagline: 'The classic pace', base: 122, min: 80, hue: '#c8f24b' },
  { id: 'turbo', name: 'Turbo', tagline: 'Full reflex test', base: 84, min: 55, hue: '#ff7a5c' },
];

const DIR_V: Record<DirKey, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const BEST_KEY = 'serpentine.best.v1';
const MUTE_KEY = 'serpentine.muted.v1';
const DIFF_KEY = 'serpentine.diff.v1';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
}
interface Floater {
  x: number; y: number; text: string; life: number; max: number; color: string; big?: boolean;
}
interface Bonus { pos: Vec; born: number; ttl: number }

interface GState {
  snake: Vec[]; prev: Vec[];
  dir: Vec; queue: Vec[];
  food: Vec; bonus: Bonus | null;
  foods: number; score: number;
  interval: number; acc: number; last: number;
  phase: Phase;
  particles: Particle[]; floaters: Floater[];
  shake: number; flash: number;
  attractResetAt: number;
  won: boolean;
}

/* --------------------------------- helpers --------------------------------- */

const diffOf = (id: DifficultyId): Difficulty =>
  DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];

function loadBest(): Record<DifficultyId, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Record<DifficultyId, number>>;
      return { garden: p.garden || 0, arcade: p.arcade || 0, turbo: p.turbo || 0 };
    }
  } catch { /* ignore */ }
  return { garden: 0, arcade: 0, turbo: 0 };
}

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* ignore */ }
  return fallback;
}

function loadDiff(): DifficultyId {
  try {
    const v = localStorage.getItem(DIFF_KEY);
    if (v === 'garden' || v === 'arcade' || v === 'turbo') return v;
  } catch { /* ignore */ }
  return 'arcade';
}

function randCell(exclude: Vec[]): Vec {
  const taken = new Set(exclude.map((c) => c.x + c.y * GRID));
  const free: Vec[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!taken.has(x + y * GRID)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: -1, y: -1 };
  return free[Math.floor(Math.random() * free.length)];
}

function freshState(): GState {
  const cy = Math.floor(GRID / 2);
  const snake = [
    { x: 8, y: cy }, { x: 7, y: cy }, { x: 6, y: cy }, { x: 5, y: cy },
  ];
  return {
    snake,
    prev: snake.map((c) => ({ ...c })),
    dir: { ...DIR_V.right },
    queue: [],
    food: randCell(snake),
    bonus: null,
    foods: 0,
    score: 0,
    interval: diffOf(loadDiff()).base,
    acc: 0,
    last: typeof performance !== 'undefined' ? performance.now() : 0,
    phase: 'menu',
    particles: [],
    floaters: [],
    shake: 0,
    flash: 0,
    attractResetAt: 0,
    won: false,
  };
}

/* ------------------------------ attract-mode AI ----------------------------- */

function aiChoose(s: GState) {
  const head = s.snake[0];
  const dx = s.food.x - head.x;
  const dy = s.food.y - head.y;
  const prefs: Vec[] = [];
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (Math.abs(dx) > Math.abs(dy)) {
    if (sx) prefs.push({ x: sx, y: 0 });
    if (sy) prefs.push({ x: 0, y: sy }, { x: 0, y: -sy });
    else prefs.push({ x: 0, y: 1 }, { x: 0, y: -1 });
  } else {
    if (sy) prefs.push({ x: 0, y: sy });
    if (sx) prefs.push({ x: sx, y: 0 }, { x: -sx, y: 0 });
    else prefs.push({ x: 1, y: 0 }, { x: -1, y: 0 });
  }
  prefs.push({ ...s.dir }, ...Object.values(DIR_V));

  const seen = new Set<string>();
  const safe = (v: Vec) => {
    if (v.x === -s.dir.x && v.y === -s.dir.y) return false;
    const nx = head.x + v.x;
    const ny = head.y + v.y;
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return false;
    for (let i = 0; i < s.snake.length - 1; i++) {
      if (s.snake[i].x === nx && s.snake[i].y === ny) return false;
    }
    return true;
  };

  for (const v of prefs) {
    const key = v.x + ',' + v.y;
    if (seen.has(key) || (v.x === 0 && v.y === 0)) continue;
    seen.add(key);
    if (safe(v)) {
      s.dir = v;
      return;
    }
  }
}

/* --------------------------------- the hook --------------------------------- */

export function useSnakeGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<DifficultyId>(loadDiff);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<Record<DifficultyId, number>>(loadBest);
  const [isNewBest, setIsNewBest] = useState(false);
  const [won, setWon] = useState(false);
  const [len, setLen] = useState(4);
  const [level, setLevel] = useState(1);
  const [muted, setMuted] = useState<boolean>(() => loadBool(MUTE_KEY, false));

  const g = useRef<GState>(freshState());
  const sizeRef = useRef(320);
  const bestRef = useRef(best);
  const diffRef = useRef(difficulty);
  bestRef.current = best;
  diffRef.current = difficulty;

  useEffect(() => setSfxMuted(muted), [muted]);

  const setPhaseBoth = useCallback((p: Phase) => {
    g.current.phase = p;
    setPhase(p);
  }, []);

  /* ------------------------------ run management ----------------------------- */

  const resetRun = useCallback(
    (diffId: DifficultyId, target: 'playing' | 'menu') => {
      const s = g.current;
      const d = diffOf(diffId);
      const cy = Math.floor(GRID / 2);
      const snake = [
        { x: 8, y: cy }, { x: 7, y: cy }, { x: 6, y: cy }, { x: 5, y: cy },
      ];
      s.snake = snake;
      s.prev = snake.map((c) => ({ ...c }));
      s.dir = { ...DIR_V.right };
      s.queue = [];
      s.food = randCell(snake);
      s.bonus = null;
      s.foods = 0;
      s.score = 0;
      s.interval = d.base;
      s.acc = 0;
      s.won = false;
      s.attractResetAt = 0;
      s.particles.length = 0;
      s.floaters.length = 0;
      s.shake = 0;
      s.flash = 0;
      setScore(0);
      setLen(snake.length);
      setLevel(1);
      setIsNewBest(false);
      setWon(false);
      setPhaseBoth(target);
    },
    [setPhaseBoth],
  );

  const start = useCallback(() => {
    resetRun(diffRef.current, 'playing');
    sfx.start();
  }, [resetRun]);

  const toMenu = useCallback(() => {
    resetRun(diffRef.current, 'menu');
  }, [resetRun]);

  const togglePause = useCallback(() => {
    const s = g.current;
    if (s.phase === 'playing') {
      setPhaseBoth('paused');
      sfx.pause();
    } else if (s.phase === 'paused') {
      s.acc = 0;
      setPhaseBoth('playing');
      sfx.pause();
    }
  }, [setPhaseBoth]);

  const chooseDifficulty = useCallback(
    (id: DifficultyId) => {
      try { localStorage.setItem(DIFF_KEY, id); } catch { /* ignore */ }
      setDifficulty(id);
      diffRef.current = id;
      const s = g.current;
      if (s.phase === 'menu') {
        s.interval = diffOf(id).base; // attract demo picks up the new pace
      } else {
        resetRun(id, 'playing');
        sfx.start();
      }
    },
    [resetRun],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /* ---------------------------------- input ---------------------------------- */

  const steer = useCallback(
    (key: DirKey) => {
      const s = g.current;
      const v = DIR_V[key];
      if (s.phase === 'menu') {
        resetRun(diffRef.current, 'playing');
        sfx.start();
        s.queue.push({ ...v });
        return;
      }
      if (s.phase !== 'playing') return;
      const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
      if (v.x === -last.x && v.y === -last.y) return;
      if (v.x === last.x && v.y === last.y) return;
      if (s.queue.length < 3) s.queue.push({ ...v });
    },
    [resetRun],
  );

  /* --------------------------------- sim tick --------------------------------- */

  const burst = useCallback((px: number, py: number, colors: string[], n: number, speed: number) => {
    const s = g.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.35 + Math.random() * 0.75);
      s.particles.push({
        x: px, y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - speed * 0.25,
        life: 0,
        max: 0.45 + Math.random() * 0.45,
        size: 2 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  const die = useCallback(
    (now: number) => {
      const s = g.current;
      if (s.phase === 'menu') {
        s.attractResetAt = now + 950;
        s.shake = Math.max(s.shake, 0.45);
        return;
      }
      setPhaseBoth('over');
      s.shake = 1;
      s.flash = 1;
      sfx.die();
      const d = diffRef.current;
      if (s.score > bestRef.current[d]) {
        const nb = { ...bestRef.current, [d]: s.score };
        bestRef.current = nb;
        setBest(nb);
        try { localStorage.setItem(BEST_KEY, JSON.stringify(nb)); } catch { /* ignore */ }
        setIsNewBest(true);
      }
    },
    [setPhaseBoth],
  );

  const tick = useCallback(
    (now: number) => {
      const s = g.current;
      const size = sizeRef.current;
      const cell = size / GRID;

      // consume queued direction
      while (s.queue.length) {
        const v = s.queue.shift()!;
        if (v.x === -s.dir.x && v.y === -s.dir.y) continue;
        if (v.x === s.dir.x && v.y === s.dir.y) continue;
        s.dir = v;
        break;
      }
      if (s.phase === 'menu') aiChoose(s);

      const head = s.snake[0];
      const nx = head.x + s.dir.x;
      const ny = head.y + s.dir.y;

      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return die(now);

      const eatingFood = s.food.x === nx && s.food.y === ny;
      const eatingBonus = !!s.bonus && s.bonus.pos.x === nx && s.bonus.pos.y === ny;
      const body = eatingFood ? s.snake : s.snake.slice(0, -1);
      for (const c of body) if (c.x === nx && c.y === ny) return die(now);

      s.prev = s.snake.map((c) => ({ ...c }));
      s.snake.unshift({ x: nx, y: ny });
      if (!eatingFood) s.snake.pop();

      if (eatingFood) {
        s.foods++;
        s.score += 10;
        setScore(s.score);
        setLen(s.snake.length);
        burst((nx + 0.5) * cell, (ny + 0.5) * cell, ['#c8f24b', '#7de0a0', '#ffc857'], 13, 200);
        s.floaters.push({ x: (nx + 0.5) * cell, y: ny * cell, text: '+10', life: 0, max: 0.9, color: '#c8f24b' });
        if (s.phase === 'playing') sfx.eat();

        const d = diffOf(diffRef.current);
        const prevLevel = 1 + Math.floor((s.foods - 1) / 5);
        const newLevel = 1 + Math.floor(s.foods / 5);
        s.interval = Math.max(d.min, d.base - s.foods * 2.2);
        setLevel(newLevel);
        if (newLevel > prevLevel) {
          s.floaters.push({ x: size / 2, y: size * 0.3, text: 'SPEED UP', life: 0, max: 1.1, color: '#ffc857', big: true });
          if (s.phase === 'playing') sfx.level();
        }

        const nf = randCell([...s.snake, ...(s.bonus ? [s.bonus.pos] : [])]);
        if (nf.x < 0) {
          s.won = true;
          setWon(true);
          setPhaseBoth('over');
          s.flash = 0.6;
          sfx.bonus();
          return;
        }
        s.food = nf;

        if (s.phase === 'playing' && s.foods % 5 === 0 && !s.bonus) {
          const bp = randCell([...s.snake, s.food]);
          if (bp.x >= 0) s.bonus = { pos: bp, born: now, ttl: 6500 };
        }
      }

      if (eatingBonus) {
        s.score += 50;
        setScore(s.score);
        burst((nx + 0.5) * cell, (ny + 0.5) * cell, ['#ffc857', '#ffe6a3', '#ff7a5c'], 18, 240);
        s.floaters.push({ x: (nx + 0.5) * cell, y: ny * cell, text: '+50', life: 0, max: 1, color: '#ffc857' });
        if (s.phase === 'playing') sfx.bonus();
        s.bonus = null;
      }

      if (s.bonus && now - s.bonus.born > s.bonus.ttl) {
        burst((s.bonus.pos.x + 0.5) * cell, (s.bonus.pos.y + 0.5) * cell, ['#5c7f6d', '#8aa896'], 6, 90);
        s.bonus = null;
      }
    },
    [burst, die, setPhaseBoth],
  );

  /* -------------------------------- main loop -------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dprOf = () => Math.min(2, window.devicePixelRatio || 1);

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      const px = Math.max(220, Math.floor(Math.min(r.width, r.height)));
      sizeRef.current = px;
      const dpr = dprOf();
      canvas.width = Math.floor(px * dpr);
      canvas.height = Math.floor(px * dpr);
    });
    ro.observe(parent);

    const step = (now: number) => {
      const s = g.current;
      const dt = Math.min(60, Math.max(0, now - s.last));
      s.last = now;
      const dts = dt / 1000;

      if (s.phase === 'playing' || s.phase === 'menu') {
        s.acc += dt;
        let guard = 0;
        while (s.acc >= s.interval && guard++ < 5) {
          s.acc -= s.interval;
          tick(now);
          if (s.phase !== 'playing' && s.phase !== 'menu') break;
        }
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dts;
        if (p.life >= p.max) { s.particles.splice(i, 1); continue; }
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        p.vy += 430 * dts;
      }
      for (let i = s.floaters.length - 1; i >= 0; i--) {
        const f = s.floaters[i];
        f.life += dts;
        if (f.life >= f.max) s.floaters.splice(i, 1);
      }
      s.shake = Math.max(0, s.shake - dt / 380);
      s.flash = Math.max(0, s.flash - dt / 520);

      if (s.phase === 'menu' && s.attractResetAt && now >= s.attractResetAt) {
        s.attractResetAt = 0;
        resetRun(diffRef.current, 'menu');
      }
    };

    const draw = (now: number) => {
      const s = g.current;
      const size = sizeRef.current;
      if (size < 60) return;
      const dpr = dprOf();
      const cell = size / GRID;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#0c241c';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      if (s.shake > 0) {
        const m = s.shake * 8;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }

      // checkerboard
      ctx.fillStyle = 'rgba(200, 242, 75, 0.03)';
      for (let y = 0; y < GRID; y++) {
        for (let x = (y % 2); x < GRID; x += 2) {
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }

      // inner frame
      ctx.strokeStyle = 'rgba(200, 242, 75, 0.09)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // vignette
      const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.32, size / 2, size / 2, size * 0.74);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(2,10,7,0.34)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, size, size);

      /* food — pulsing berry */
      {
        const pu = 1 + Math.sin(now / 160) * 0.09;
        const fx = (s.food.x + 0.5) * cell;
        const fy = (s.food.y + 0.5) * cell;
        const r = cell * 0.33 * pu;
        ctx.save();
        ctx.shadowColor = 'rgba(255,122,92,0.85)';
        ctx.shadowBlur = 16 * pu;
        const fg = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r);
        fg.addColorStop(0, '#ffb59e');
        fg.addColorStop(0.55, '#ff7a5c');
        fg.addColorStop(1, '#d94a30');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // leaf + shine
        ctx.fillStyle = '#7de0a0';
        ctx.save();
        ctx.translate(fx + r * 0.25, fy - r * 0.95);
        ctx.rotate(-0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.38, r * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(fx - r * 0.32, fy - r * 0.34, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }

      /* bonus — spinning gold gem */
      if (s.bonus) {
        const age = now - s.bonus.born;
        const remain = s.bonus.ttl - age;
        const blink = remain < 2000 ? (Math.floor(now / 120) % 2 === 0 ? 0.3 : 1) : 1;
        const bx = (s.bonus.pos.x + 0.5) * cell;
        const by = (s.bonus.pos.y + 0.5) * cell;
        const r = cell * 0.36;
        ctx.save();
        ctx.globalAlpha = blink;
        ctx.translate(bx, by);
        ctx.rotate(now / 480);
        ctx.shadowColor = 'rgba(255,200,87,0.9)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffc857';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.72, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.72, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff0c4';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(r * 0.34, 0);
        ctx.lineTo(0, r * 0.5);
        ctx.lineTo(-r * 0.34, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      /* snake — interpolated capsule chain */
      {
        const t = s.phase === 'over' ? 1 : Math.min(1, s.acc / s.interval);
        const pts = s.snake.map((seg, i) => {
          const p = s.prev[i] || seg;
          return {
            x: (p.x + (seg.x - p.x) * t + 0.5) * cell,
            y: (p.y + (seg.y - p.y) * t + 0.5) * cell,
          };
        });

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const path = () => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        };

        if (s.phase === 'playing' || s.phase === 'menu') {
          ctx.save();
          ctx.shadowColor = 'rgba(200,242,75,0.5)';
          ctx.shadowBlur = 14;
          path();
          ctx.strokeStyle = '#2e5d20';
          ctx.lineWidth = cell * 0.8;
          ctx.stroke();
          ctx.restore();
        } else {
          path();
          ctx.strokeStyle = '#2e5d20';
          ctx.lineWidth = cell * 0.8;
          ctx.stroke();
        }
        path();
        ctx.strokeStyle = s.phase === 'over' ? '#7fb33a' : '#9be22e';
        ctx.lineWidth = cell * 0.62;
        ctx.stroke();

        ctx.save();
        ctx.translate(0, -cell * 0.1);
        path();
        ctx.strokeStyle = 'rgba(242,255,198,0.32)';
        ctx.lineWidth = cell * 0.2;
        ctx.stroke();
        ctx.restore();

        // head
        const hp = pts[0];
        const d = s.dir;
        ctx.fillStyle = s.phase === 'over' ? '#9ccb4a' : '#c8f24b';
        ctx.strokeStyle = '#2e5d20';
        ctx.lineWidth = Math.max(1.5, cell * 0.07);
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, cell * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // tongue flick
        if (s.phase !== 'over' && now % 2400 < 170) {
          ctx.strokeStyle = '#ff7a5c';
          ctx.lineWidth = Math.max(1.5, cell * 0.07);
          const mx = hp.x + d.x * cell * 0.42;
          const my = hp.y + d.y * cell * 0.42;
          const tx = hp.x + d.x * cell * 0.78;
          const ty = hp.y + d.y * cell * 0.78;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(tx, ty);
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - d.y * cell * 0.12 + d.x * cell * 0.1, ty + d.x * cell * 0.12 + d.y * cell * 0.1);
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + d.y * cell * 0.12 + d.x * cell * 0.1, ty - d.x * cell * 0.12 + d.y * cell * 0.1);
          ctx.stroke();
        }

        // eyes
        const px = -d.y;
        const py = d.x;
        for (const sgn of [1, -1]) {
          const ex = hp.x + d.x * cell * 0.13 + px * cell * 0.17 * sgn;
          const ey = hp.y + d.y * cell * 0.13 + py * cell * 0.17 * sgn;
          ctx.fillStyle = '#f4ffe2';
          ctx.beginPath();
          ctx.arc(ex, ey, cell * 0.115, 0, Math.PI * 2);
          ctx.fill();
          if (s.phase === 'over') {
            ctx.strokeStyle = '#14261c';
            ctx.lineWidth = Math.max(1, cell * 0.05);
            const k = cell * 0.07;
            ctx.beginPath();
            ctx.moveTo(ex - k, ey - k); ctx.lineTo(ex + k, ey + k);
            ctx.moveTo(ex + k, ey - k); ctx.lineTo(ex - k, ey + k);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#14261c';
            ctx.beginPath();
            ctx.arc(ex + d.x * cell * 0.045, ey + d.y * cell * 0.045, cell * 0.058, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* particles */
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      /* floaters */
      for (const f of s.floaters) {
        const prog = f.life / f.max;
        const alpha = Math.max(0, 1 - prog * prog);
        const scale = f.big && prog < 0.2 ? 0.6 + prog * 2 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(f.x, f.y - 34 * prog);
        ctx.scale(scale, scale);
        ctx.font = `${f.big ? Math.round(cell * 0.85) : Math.round(cell * 0.52)}px Bungee, "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(3, cell * 0.14);
        ctx.strokeStyle = 'rgba(6,20,15,0.9)';
        ctx.strokeText(f.text, 0, 0);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, 0, 0);
        ctx.restore();
      }

      // death flash
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(255,90,64,${(s.flash * 0.3).toFixed(3)})`;
        ctx.fillRect(0, 0, size, size);
      }

      ctx.restore();
    };

    let raf = 0;
    const frame = (now: number) => {
      step(now);
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, tick, resetRun]);

  /* -------------------------------- keyboard -------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const dirMap: Record<string, DirKey> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
      };
      if (dirMap[k]) {
        e.preventDefault();
        steer(dirMap[k]);
        return;
      }
      const p = g.current.phase;
      if (k === ' ') {
        e.preventDefault();
        if (p === 'menu' || p === 'over') start();
        else togglePause();
      } else if (k === 'Enter') {
        if (p !== 'playing') start();
      } else if (k === 'p' || k === 'P') {
        togglePause();
      } else if (k === 'Escape') {
        if (p === 'playing' || p === 'paused') togglePause();
      } else if (k === 'r' || k === 'R') {
        start();
      } else if (k === 'm' || k === 'M') {
        toMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steer, start, togglePause, toMenu]);

  /* auto-pause when the tab is hidden */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && g.current.phase === 'playing') {
        setPhaseBoth('paused');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [setPhaseBoth]);

  return {
    phase,
    difficulty,
    diff: diffOf(difficulty),
    score,
    best,
    bestFor: best[difficulty],
    isNewBest,
    won,
    len,
    level,
    muted,
    start,
    restart: start,
    toMenu,
    togglePause,
    chooseDifficulty,
    toggleMute,
    steer,
  };
}
