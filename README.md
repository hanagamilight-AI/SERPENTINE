# Serpentine — Neon Snake Arcade

A modern snake game built with React + TypeScript + Vite, rendered on canvas with a fixed-timestep game loop.

**Features**

- Smooth interpolated motion, particle bursts, screen shake, floating score text
- Keyboard (Arrows / WASD), swipe gestures, and an on-screen D-pad
- Pause, restart, and menu (Space/P/Esc · Enter/R · M)
- Three difficulties — Garden, Arcade, Turbo — with progressive speed-ups
- Timed gold gems worth bonus points
- High scores per difficulty, saved in the browser
- Chiptune SFX (WebAudio, mutable), attract-mode AI demo behind the menu

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

A GitHub Actions workflow is included (`.github/workflows/deploy.yml`):

1. Push this repo to GitHub (`git push -u origin main`).
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Done — every push to `main` rebuilds and publishes to `https://<username>.github.io/<repo-name>/`.
