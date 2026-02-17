import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const game = new Game(canvas);

 // Background music setup (use provided MP3)
const music = new Audio('./Background Music.mp3');
// ensure mobile inline playback where supported
music.setAttribute('playsinline', '');
music.setAttribute('webkit-playsinline', '');
music.loop = true;
/* Apply a global attenuation so "100%" in the UI is quieter for background music. */
const MUSIC_ATTENUATION = 0.6;
music.volume = (game && typeof game.musicVolume === 'number') ? (game.musicVolume * MUSIC_ATTENUATION) : MUSIC_ATTENUATION;
// expose background music so the game UI can sync volume changes
try { window.backgroundMusic = music; } catch (e) {}
let musicStarted = false;

// small helper to attempt play and handle mobile restrictions by retrying muted then unmuting
const tryStartMusic = () => {
  if (musicStarted) return;
  // ensure media is loaded
  try { music.load(); } catch (e) {}
  // primary attempt
  music.play().then(() => {
    musicStarted = true;
  }).catch(() => {
    // fallback: attempt a muted play then unmute (some mobile browsers allow muted playback after gesture)
    const wasMuted = music.muted;
    music.muted = true;
    music.play().then(() => {
      music.muted = wasMuted;
      musicStarted = true;
    }).catch(() => {
      // last resort: leave it and rely on subsequent gestures
      music.muted = wasMuted;
    });
  });
};

/* Try to start music immediately and resume the game's AudioContext so background music
   is attempted without waiting for the first user interaction. This is best-effort;
   browsers that forbid unmuted autoplay will still prevent audible playback until a gesture. */
try {
  if (game && typeof game.resumeAudio === 'function') {
    try { game.resumeAudio(); } catch (e) {}
  }
  // Attempt to start music immediately (will fallback to muted play where allowed).
  tryStartMusic();
} catch (e) {}

/* Unified interaction handler to start audio and handle game UI */
const handleInteraction = (e) => {
  // Resume game AudioContext and start background music on first interaction
  if (game.resumeAudio) game.resumeAudio();
  tryStartMusic();

  // Handle pointer logic for buttons
  const rect = canvas.getBoundingClientRect();
  // pointerdown/touchend event provides clientX/Y directly for both touch and mouse
  const clientX = (e.clientX != null) ? e.clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
  const clientY = (e.clientY != null) ? e.clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (game.handlePointer) {
    game.handlePointer(x, y);
  }
};

// Use pointerdown to cover mouse and touch without double-firing
canvas.addEventListener('pointerdown', handleInteraction, { passive: false });
// pointermove while pressed to support slider dragging; pointerup to end drags
canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clientX = (e.clientX != null) ? e.clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
  const clientY = (e.clientY != null) ? e.clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (game && typeof game.handlePointerMove === 'function') {
    game.handlePointerMove(x, y);
  }
}, { passive: true });
canvas.addEventListener('pointerup', (e) => {
  if (game && typeof game.handlePointerUp === 'function') {
    game.handlePointerUp();
  }
}, { passive: true });
// Add touchend on document as an extra user gesture to unlock audio on mobile if pointerdown misses
document.addEventListener('touchend', (e) => {
  // only try once per gesture; don't pass through to game pointer handling here
  tryStartMusic();
  if (game && typeof game.handlePointerUp === 'function') game.handlePointerUp();
}, { passive: true });

 // Start main loop only after icons are finished loading so PNGs are preferred over numeric fallbacks.
 // Background-capable loop: run game.update on a constant interval (keeps simulation running when tab is hidden),
 // while rendering still uses requestAnimationFrame for efficiency when visible.
let lastUpdate = performance.now();
const MAX_DT = 0.05; // clamp large dt to avoid big jumps after long sleeps

// Fixed-rate updater (runs even if page is hidden)
let updateIntervalId = null;
const startUpdater = () => {
  if (updateIntervalId != null) return;
  // aim for 60 updates per second
  const tickMs = 1000 / 60;
  lastUpdate = performance.now();
  updateIntervalId = setInterval(() => {
    const now = performance.now();
    let dt = (now - lastUpdate) / 1000;
    lastUpdate = now;
    // clamp to avoid huge jumps after tab was suspended for long time
    dt = Math.min(dt, MAX_DT);
    try { game.update(dt); } catch (e) { /* ignore errors to keep interval alive */ }
  }, tickMs);
};

const stopUpdater = () => {
  if (updateIntervalId != null) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
};

// Renderer using rAF — draws current game state when possible.
function renderLoop() {
  try { game.draw(ctx); } catch (e) {}
  requestAnimationFrame(renderLoop);
}

// Start loops once icons are ready (or immediately if not provided)
if (game.iconsReady && typeof game.iconsReady.then === 'function') {
  game.iconsReady.then(() => {
    startUpdater();
    requestAnimationFrame(renderLoop);
  }).catch(() => {
    startUpdater();
    requestAnimationFrame(renderLoop);
  });
} else {
  startUpdater();
  requestAnimationFrame(renderLoop);
}

// Optional: if you want to stop updates when the page is explicitly unloaded/hidden for extreme power savings,
// you can listen to visibilitychange and pause the updater when the page is visible=false.
// For now we keep the updater running so the game continues in background.

   // single-key shortcut: press "-" to grant money and Strange Points
window.addEventListener('keydown', (e) => {
  // only activate cheats if the username is exactly "Oldenbutt"
  if (typeof game.username !== 'string' || game.username !== 'Oldenbutt') return;

  if (e.key === '-') {
    // give 100,000,000 money and 50 Strange Points, then save state
    try {
      game.money = (game.money || 0) + 100_000_000;
      game.strangePoints = (game.strangePoints || 0) + 50;
      if (typeof game.saveState === 'function') {
        try { game.saveState(); } catch (e) {}
      }
    } catch (err) {
      // silent fail if something goes wrong
    }
  } else if (e.key === '=') {
    // spawn a ball matching the current highest-level ball on screen
    try {
      if (typeof game.spawnHighest === 'function') game.spawnHighest();
    } catch (err) {
      // ignore any errors
    }
  } else if (e.key === '\\') {
    // toggle zero-second spawn mode: when active, autoSpawn will produce one ball per update.
    try {
      game.zeroSpawnActive = !game.zeroSpawnActive;
      // reset spawn timer so toggling on starts spawning immediately
      if (game.zeroSpawnActive) {
        game.spawnTimer = 0;
      } else {
        // ensure normal timing resumes
        game.spawnTimer = game.getSpawnInterval ? game.getSpawnInterval() : 0;
      }
    } catch (err) {
      // ignore
    }
  }
});

// Toggle "Aesthetic Mode" with the ] key: spawn decorative balls (levels 1-10) and disable merging.
window.addEventListener('keydown', (e) => {
  try {
    if (!game) return;
    if (e.key === ']') {
      game.aestheticMode = !game.aestheticMode;
      // when enabling aestheticMode, ensure spawnTimer triggers soon so player sees change
      if (game.aestheticMode) {
        game.spawnTimer = 0;
      }
      // persist visual mode preference if saveState exists
      try { if (typeof game.saveState === 'function') game.saveState(); } catch (err) {}
    }
  } catch (err) {}
});