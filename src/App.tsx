import { useRef, type ReactNode } from 'react';
import {
  DIFFICULTIES,
  useSnakeGame,
  type DirKey,
  type Phase,
} from './game/useSnakeGame';

/* ---------------------------------- icons ---------------------------------- */

type IconName =
  | 'play' | 'pause' | 'restart' | 'home' | 'trophy' | 'sound' | 'soundOff'
  | 'up' | 'down' | 'left' | 'right' | 'bolt' | 'gamepad' | 'apple';

const PATHS: Record<IconName, ReactNode> = {
  play: <path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" stroke="none" />,
  pause: <path d="M8.5 5v14M15.5 5v14" strokeWidth={3} />,
  restart: (
    <>
      <path d="M3 4v6h6" />
      <path d="M3.5 13a8.5 8.5 0 1 0 2.1-7.2L3 8.5" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5.5 9.5V21h13V9.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 16.5V21M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5.5H4V7a3.5 3.5 0 0 0 3.5 3.5M17 5.5h3V7a3.5 3.5 0 0 1-3.5 3.5" />
    </>
  ),
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.2 6a9 9 0 0 1 0 12" />
    </>
  ),
  soundOff: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4Z" fill="currentColor" stroke="none" />
      <path d="m16.5 9.5 5 5m0-5-5 5" />
    </>
  ),
  up: <path d="m6 14.5 6-6 6 6" />,
  down: <path d="m6 9.5 6 6 6-6" />,
  left: <path d="m14.5 6-6 6 6 6" />,
  right: <path d="m9.5 6 6 6-6 6" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" stroke="none" />,
  gamepad: (
    <>
      <path d="M6.5 7h11A4.5 4.5 0 0 1 22 11.5v3a4.5 4.5 0 0 1-4.5 4.5c-1.6 0-2.5-1-3.5-2h-4c-1 1-1.9 2-3.5 2A4.5 4.5 0 0 1 2 14.5v-3A4.5 4.5 0 0 1 6.5 7Z" />
      <path d="M6 11.5h4M8 9.5v4M15.5 10.5h.01M18 13h.01" />
    </>
  ),
  apple: (
    <>
      <path d="M12 7.5c1.2-2.3 3.5-3 5.1-1.7 2 4.3-.3 10.6-3.3 12.6-.9.6-2.7.6-3.6 0-3-2-5.3-8.3-3.3-12.6C8.5 4.5 10.8 5.2 12 7.5Z" />
      <path d="M12 7.5c0-2 1-3.6 2.5-4.6" />
    </>
  ),
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* --------------------------------- ambient --------------------------------- */

const FIREFLIES = [
  { l: '5%', t: '18%', s: 5, c: '#c8f24b', d: '8s', w: '0s' },
  { l: '13%', t: '74%', s: 4, c: '#ffc857', d: '11s', w: '1.2s' },
  { l: '22%', t: '38%', s: 3, c: '#7de0a0', d: '9s', w: '2.1s' },
  { l: '30%', t: '86%', s: 5, c: '#c8f24b', d: '12s', w: '0.6s' },
  { l: '43%', t: '10%', s: 4, c: '#ff7a5c', d: '10s', w: '3s' },
  { l: '54%', t: '92%', s: 3, c: '#ffc857', d: '8.5s', w: '1.8s' },
  { l: '63%', t: '22%', s: 5, c: '#7de0a0', d: '13s', w: '0.9s' },
  { l: '72%', t: '68%', s: 4, c: '#c8f24b', d: '9.5s', w: '2.6s' },
  { l: '81%', t: '34%', s: 3, c: '#ffc857', d: '11.5s', w: '0.3s' },
  { l: '88%', t: '80%', s: 5, c: '#ff7a5c', d: '10.5s', w: '1.5s' },
  { l: '94%', t: '14%', s: 4, c: '#7de0a0', d: '9s', w: '2.4s' },
  { l: '37%', t: '58%', s: 3, c: '#c8f24b', d: '12.5s', w: '3.4s' },
];

function Ambient() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-glow" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gridlines" />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            className="firefly"
            style={{
              left: f.l,
              top: f.t,
              width: f.s,
              height: f.s,
              background: f.c,
              boxShadow: `0 0 ${f.s * 2.4}px ${f.c}`,
              ['--d' as string]: f.d,
              ['--delay' as string]: f.w,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-0 z-20 fx-vignette" />
      <div className="pointer-events-none fixed inset-0 z-30 fx-scan" />
    </>
  );
}

/* ------------------------------- small pieces ------------------------------- */

function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>;
}

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 lg:h-11 lg:w-11" aria-hidden="true">
      <rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="#0f2b22" stroke="#2f6b54" />
      <path
        d="M11 28c0-6.5 18-4 18-11 0-4.2-4.2-6-8-6"
        stroke="#c8f24b"
        strokeWidth="4.4"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="7 9"
        className="anim-dash"
      />
      <circle cx="12.4" cy="28" r="3.5" fill="#ff7a5c" />
      <circle cx="11.2" cy="26.8" r="1" fill="#ffd9cc" />
    </svg>
  );
}

const PHASE_META: Record<Phase, { label: string; dot: string; pulse: boolean }> = {
  menu: { label: 'ATTRACT MODE — DEMO RUN', dot: '#ffc857', pulse: false },
  playing: { label: 'IN PLAY', dot: '#c8f24b', pulse: true },
  paused: { label: 'PAUSED', dot: '#ffc857', pulse: false },
  over: { label: 'GAME OVER', dot: '#ff7a5c', pulse: false },
};

const LEVEL_COLORS = ['#c8f24b', '#c8f24b', '#d6e956', '#e5dd58', '#ffc857', '#ffb057', '#ff9a5b', '#ff7a5c'];

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const game = useSnakeGame(canvasRef);
  const {
    phase, score, bestFor, isNewBest, won, len, level, muted, diff,
    start, toMenu, togglePause, chooseDifficulty, toggleMute, steer,
  } = game;

  const meta = PHASE_META[phase];
  const padCenter: { icon: IconName; label: string } =
    phase === 'playing' ? { icon: 'pause', label: 'Pause' }
    : phase === 'paused' ? { icon: 'play', label: 'Resume' }
    : { icon: 'play', label: 'Start' };

  const padCenterAction = () => {
    if (phase === 'menu' || phase === 'over') start();
    else togglePause();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const st = touchRef.current;
    touchRef.current = null;
    if (!st) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const key: DirKey = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    steer(key);
  };

  return (
    <div className="relative min-h-screen font-body text-cream lg:h-screen lg:overflow-hidden">
      <Ambient />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:h-screen">
        {/* ------------------------------- header ------------------------------- */}
        <header className="flex items-center justify-between py-4 lg:py-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <h1 className="font-display text-lg leading-none tracking-wide text-lime text-glow-lime lg:text-xl">
                SERPENTINE
              </h1>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.34em] text-sage">
                NEON SNAKE ARCADE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-line bg-moss/80 px-3 py-1.5 sm:flex">
              <Icon name="trophy" className="h-3.5 w-3.5 text-amber" />
              <span className="font-display text-sm text-cream">{bestFor}</span>
              <span className="text-[9px] font-semibold tracking-[0.2em] text-sage">BEST</span>
            </div>
            <button
              onClick={toggleMute}
              className="btn-ghost rounded-full p-2.5"
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              title={muted ? 'Sound off' : 'Sound on'}
            >
              <Icon name={muted ? 'soundOff' : 'sound'} className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* -------------------------------- main -------------------------------- */}
        <main className="flex flex-1 flex-col items-center justify-start gap-5 pb-4 lg:min-h-0 lg:flex-row lg:items-center lg:justify-center lg:gap-9">
          {/* board column */}
          <section className="flex w-full flex-col items-center lg:min-h-0 lg:flex-1 lg:justify-center">
            {/* mobile score strip */}
            <div className="mb-3 w-full max-w-[min(92vw,520px)] lg:hidden">
              <div className="flex items-end justify-between">
                <div>
                  <div className="stat-label">Score</div>
                  <div key={score} className="anim-pop font-display text-4xl leading-none text-amber text-glow-amber">
                    {score}
                  </div>
                </div>
                <div className="flex items-end gap-5 pb-0.5">
                  <div className="text-right">
                    <div className="stat-label">Best</div>
                    <div className="flex items-center justify-end gap-1 font-display text-lg text-cream">
                      <Icon name="trophy" className="h-3.5 w-3.5 text-amber" />
                      {bestFor}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="stat-label">Len</div>
                    <div className="font-display text-lg text-cream">{len}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-stretch gap-2">
                <div className="flex flex-1 overflow-hidden rounded-lg border border-line bg-moss/70">
                  {DIFFICULTIES.map((d) => {
                    const active = d.id === diff.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => chooseDifficulty(d.id)}
                        className="flex-1 py-1.5 text-[11px] font-bold tracking-wider transition-colors"
                        style={active ? { background: `${d.hue}22`, color: d.hue } : { color: '#7fa897' }}
                      >
                        {d.name.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={padCenterAction}
                  className="btn-ghost flex items-center px-3.5"
                  aria-label={padCenter.label}
                >
                  <Icon name={padCenter.icon} className="h-4 w-4 text-lime" />
                </button>
              </div>
            </div>

            {/* board */}
            <div className="w-full max-w-[min(92vw,520px)] lg:min-w-[400px] lg:max-w-[min(54vw,calc(100vh-248px))]">
              <div className="bezel relative p-2 sm:p-2.5">
                <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#5c8f77,#0f2b22)]" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#5c8f77,#0f2b22)]" />
                <span className="absolute bottom-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#5c8f77,#0f2b22)]" />
                <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#5c8f77,#0f2b22)]" />

                <div
                  className="relative aspect-square w-full overflow-hidden rounded-[10px]"
                  style={{ touchAction: 'none' }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

                  {/* menu overlay */}
                  {phase === 'menu' && (
                    <div className="anim-fade absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[rgba(6,20,15,0.74)] p-4 text-center backdrop-blur-[2px]">
                      <div className="anim-rise flex flex-col items-center gap-4">
                        <span className="anim-blink rounded-full border border-line px-3 py-1 text-[9px] font-semibold tracking-[0.3em] text-leaf">
                          INSERT COIN · CREDIT 01
                        </span>
                        <h2 className="title-retro font-display text-[clamp(2rem,7.5vw,3.3rem)] leading-none text-lime">
                          SERPENTINE
                        </h2>
                        <p className="-mt-1 text-sm text-sage">Eat. Grow. Don&rsquo;t bite yourself.</p>

                        <div className="flex w-full max-w-[320px] gap-2">
                          {DIFFICULTIES.map((d) => {
                            const active = d.id === diff.id;
                            return (
                              <button
                                key={d.id}
                                onClick={() => chooseDifficulty(d.id)}
                                className="flex-1 rounded-lg border border-line px-2 py-2 transition-all hover:border-linehi"
                                style={active ? { borderColor: d.hue, color: d.hue, background: `${d.hue}1c` } : { color: '#bcd8c6' }}
                              >
                                <span className="block text-xs font-bold tracking-wide">{d.name}</span>
                                <span className="mt-0.5 block text-[9px] leading-tight opacity-70">{d.tagline}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button onClick={start} className="btn-arcade flex items-center gap-2.5 px-9 py-3 text-lg">
                          <Icon name="play" className="h-4 w-4" />
                          START RUN
                        </button>

                        <div className="flex items-center gap-1.5 text-[11px] text-sage">
                          <Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd>
                          <span className="mx-1 opacity-60">or</span>
                          <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
                          <span className="ml-1 hidden sm:inline">· swipe on touch</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* pause overlay */}
                  {phase === 'paused' && (
                    <div className="anim-fade absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[rgba(6,20,15,0.78)] p-4 text-center backdrop-blur-[2px]">
                      <div className="anim-rise flex flex-col items-center gap-5">
                        <div>
                          <h2 className="font-display text-3xl text-amber text-glow-amber sm:text-4xl">PAUSED</h2>
                          <p className="mt-2 text-sm text-sage">The serpent waits&hellip;</p>
                        </div>
                        <button onClick={togglePause} className="btn-arcade flex items-center gap-2.5 px-8 py-3 text-base">
                          <Icon name="play" className="h-4 w-4" />
                          RESUME
                        </button>
                        <div className="flex gap-2">
                          <button onClick={start} className="btn-ghost flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider">
                            <Icon name="restart" className="h-3.5 w-3.5" />
                            RESTART
                          </button>
                          <button onClick={toMenu} className="btn-ghost flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider">
                            <Icon name="home" className="h-3.5 w-3.5" />
                            MENU
                          </button>
                        </div>
                        <p className="text-[11px] text-sage">
                          <Kbd>Space</Kbd> <span className="ml-1">to resume</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* game over overlay */}
                  {phase === 'over' && (
                    <div className="anim-fade absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[rgba(6,20,15,0.8)] p-4 text-center backdrop-blur-[2px]">
                      <div className="anim-rise flex flex-col items-center gap-4">
                        <h2 className={`font-display text-[clamp(1.7rem,6vw,2.5rem)] leading-none ${won ? 'text-lime text-glow-lime' : 'text-coral text-glow-coral'}`}>
                          {won ? 'BOARD CLEARED!' : 'GAME OVER'}
                        </h2>
                        {isNewBest && (
                          <span className="anim-best rounded-md bg-amber px-3 py-1 font-display text-[11px] tracking-wider text-[#231a04] shadow-[0_4px_16px_rgba(255,200,87,0.5)]">
                            NEW BEST!
                          </span>
                        )}
                        <div>
                          <div className="stat-label">Final score</div>
                          <div key={score} className="anim-pop font-display text-5xl leading-tight text-amber text-glow-amber sm:text-6xl">
                            {score}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {[
                            { label: 'BEST', value: bestFor, icon: 'trophy' as IconName },
                            { label: 'LENGTH', value: len, icon: 'apple' as IconName },
                            { label: 'LEVEL', value: level, icon: 'bolt' as IconName },
                          ].map((c) => (
                            <div key={c.label} className="flex min-w-[82px] flex-col items-center gap-1 rounded-lg border border-line bg-moss/80 px-3 py-2.5">
                              <span className="stat-label">{c.label}</span>
                              <span className="flex items-center gap-1.5 font-display text-lg text-cream">
                                <Icon name={c.icon} className={`h-3.5 w-3.5 ${c.icon === 'trophy' ? 'text-amber' : c.icon === 'apple' ? 'text-coral' : 'text-lime'}`} />
                                {c.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-1 flex flex-col items-center gap-2.5 sm:flex-row">
                          <button onClick={start} className="btn-coral flex items-center gap-2.5 px-7 py-3 text-base">
                            <Icon name="restart" className="h-4 w-4" />
                            PLAY AGAIN
                          </button>
                          <button onClick={toMenu} className="btn-ghost flex items-center gap-2 px-5 py-3 text-xs font-semibold tracking-wider">
                            <Icon name="home" className="h-3.5 w-3.5" />
                            MENU
                          </button>
                        </div>
                        <p className="text-[11px] text-sage">
                          <Kbd>Enter</Kbd> <span className="ml-1">to retry</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* status strip */}
              <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] font-semibold tracking-[0.22em] text-sage">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${meta.pulse ? 'live-dot' : phase === 'menu' ? 'anim-blink' : ''}`}
                    style={{ background: meta.dot, boxShadow: `0 0 8px ${meta.dot}` }}
                  />
                  {won && phase === 'over' ? 'BOARD CLEARED' : meta.label}
                </span>
                <span className="flex items-center gap-3">
                  <span style={{ color: diff.hue }}>{diff.name.toUpperCase()}</span>
                  <span>LV {level}</span>
                  <span className="hidden sm:inline">LEN {len}</span>
                </span>
              </div>
            </div>

            {/* D-pad (touch devices) */}
            <div className="mt-6 w-[236px] lg:hidden">
              <div className="grid grid-cols-3 gap-2">
                <span className="flex items-center justify-center"><i className="block h-1.5 w-1.5 rounded-full bg-line" /></span>
                <button className="dpad-btn h-14" onPointerDown={() => steer('up')} aria-label="Move up"><Icon name="up" className="h-6 w-6" /></button>
                <span className="flex items-center justify-center"><i className="block h-1.5 w-1.5 rounded-full bg-line" /></span>
                <button className="dpad-btn h-14" onPointerDown={() => steer('left')} aria-label="Move left"><Icon name="left" className="h-6 w-6" /></button>
                <button
                  className="dpad-btn h-14"
                  style={{ color: '#ffc857' }}
                  onPointerDown={padCenterAction}
                  aria-label={padCenter.label}
                  title={padCenter.label}
                >
                  <Icon name={padCenter.icon} className="h-6 w-6" />
                </button>
                <button className="dpad-btn h-14" onPointerDown={() => steer('right')} aria-label="Move right"><Icon name="right" className="h-6 w-6" /></button>
                <span className="flex items-center justify-center"><i className="block h-1.5 w-1.5 rounded-full bg-line" /></span>
                <button className="dpad-btn h-14" onPointerDown={() => steer('down')} aria-label="Move down"><Icon name="down" className="h-6 w-6" /></button>
                <span className="flex items-center justify-center"><i className="block h-1.5 w-1.5 rounded-full bg-line" /></span>
              </div>
              <p className="mt-3 text-center text-[10px] tracking-[0.2em] text-sage">SWIPE THE BOARD OR TAP THE PAD</p>
            </div>
          </section>

          {/* side panel (desktop) */}
          <aside className="hidden w-[312px] shrink-0 flex-col gap-4 py-2 lg:flex xl:w-[340px]">
            {/* score */}
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="stat-label">Score</span>
                <span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.24em]" style={{ color: meta.dot }}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.pulse ? 'live-dot' : ''}`} style={{ background: meta.dot }} />
                  {meta.label}
                </span>
              </div>
              <div key={score} className="anim-pop mt-2 font-display text-[46px] leading-none text-amber text-glow-amber">
                {score}
              </div>
              <div className="my-4 border-t border-line" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="stat-label">Best</div>
                  <div className="mt-1 flex items-center gap-1.5 font-display text-xl text-cream">
                    <Icon name="trophy" className="h-4 w-4 text-amber" />
                    {bestFor}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Length</div>
                  <div className="mt-1 flex items-center gap-1.5 font-display text-xl text-cream">
                    <Icon name="apple" className="h-4 w-4 text-coral" />
                    {len}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="stat-label">Speed</span>
                  <span className="font-display text-xs text-lime">LV {level}</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {LEVEL_COLORS.map((c, i) => (
                    <span
                      key={i}
                      className="h-2 flex-1 rounded-sm transition-all duration-300"
                      style={
                        i < Math.min(level, 8)
                          ? { background: c, boxShadow: `0 0 8px ${c}66` }
                          : { background: '#123128', border: '1px solid #1e4a3c' }
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* difficulty */}
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="stat-label">Difficulty</span>
                <Icon name="bolt" className="h-3.5 w-3.5 text-amber" />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {DIFFICULTIES.map((d, idx) => {
                  const active = d.id === diff.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => chooseDifficulty(d.id)}
                      className="flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-all"
                      style={
                        active
                          ? { borderColor: d.hue, background: `${d.hue}14`, boxShadow: `0 0 18px -6px ${d.hue}55` }
                          : { borderColor: '#1e4a3c' }
                      }
                    >
                      <span>
                        <span className={`block text-sm font-bold ${active ? '' : 'text-cream'}`} style={active ? { color: d.hue } : undefined}>
                          {d.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-sage">{d.tagline}</span>
                      </span>
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((b) => (
                          <span
                            key={b}
                            className="inline-flex"
                            style={{ color: b <= idx ? d.hue : '#1e4a3c', opacity: b <= idx ? 1 : 0.6 }}
                          >
                            <Icon name="bolt" className="h-3.5 w-3.5" />
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* controls */}
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="stat-label">Controls</span>
                <Icon name="gamepad" className="h-4 w-4 text-leaf" />
              </div>
              <div className="mt-3 flex flex-col">
                {[
                  { label: 'Steer', keys: (<><Kbd>↑↓←→</Kbd><span className="text-[10px] text-sage">/</span><Kbd>WASD</Kbd></>) },
                  { label: 'Pause', keys: (<><Kbd>Space</Kbd><span className="text-[10px] text-sage">/</span><Kbd>P</Kbd></>) },
                  { label: 'Restart', keys: <Kbd>R</Kbd> },
                  { label: 'Menu', keys: <Kbd>M</Kbd> },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-line/60 py-2 last:border-0">
                    <span className="text-xs font-medium text-sage">{row.label}</span>
                    <span className="flex items-center gap-1.5">{row.keys}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={togglePause}
                disabled={phase === 'menu' || phase === 'over'}
                className="btn-ghost flex flex-col items-center gap-1.5 py-3 text-[9px] font-bold tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Icon name={phase === 'paused' ? 'play' : 'pause'} className="h-4 w-4 text-amber" />
                {phase === 'paused' ? 'RESUME' : 'PAUSE'}
              </button>
              <button onClick={start} className="btn-ghost flex flex-col items-center gap-1.5 py-3 text-[9px] font-bold tracking-[0.18em]">
                <Icon name="restart" className="h-4 w-4 text-lime" />
                RESTART
              </button>
              <button onClick={toMenu} className="btn-ghost flex flex-col items-center gap-1.5 py-3 text-[9px] font-bold tracking-[0.18em]">
                <Icon name="home" className="h-4 w-4 text-coral" />
                MENU
              </button>
            </div>
          </aside>
        </main>

        {/* footer */}
        <footer className="pb-5 pt-3 text-center text-[10px] tracking-[0.18em] text-sage/80">
          HIGH SCORES SAVE TO THIS BROWSER&ensp;·&ensp;GEMS ARE WORTH 50&ensp;·&ensp;SERPENTINE ARCADE © 198X
        </footer>
      </div>
    </div>
  );
}
