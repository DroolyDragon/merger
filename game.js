export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = () => canvas.width / (window.devicePixelRatio || 1);
    this.height = () => canvas.height / (window.devicePixelRatio || 1);

    this.balls = [];
    this.spawnTimer = 0;

    // spawn quota system: how many "level-1 equivalents" we will spawn at most
    // to give you enough material to reach a single level-30 ball from the
    // current situation; once this quota is met, all ceiling spawns stop.
    this.spawnQuotaOnes = null;   // null = not yet computed
    this.spawnedOnesSoFar = 0;    // how many level-1 equivalents we've spawned since quota was computed
    // spawn rate is now controlled by an upgrade (level 1 => 2s interval, level 15 => 0.5s interval)
    this.spawnRateLevel = 1;
    this.spawnTimer = 0;
    this.gravity = 1100; // px/s^2 (increased gravity)
    this.damping = 0.33; // rebound height ratio (33% of previous height)

    this.types = [
      { color: '#e4572e' }, // 1 - red
      { color: '#f29f05' }, // 2 - orange
      { color: '#f4d35e' }, // 3 - yellow
      { color: '#44af69' }, // 4 - green
      { color: '#3b82f6' }, // 5 - blue
      { color: '#8b5cf6' }, // 6 - purple
      { color: '#ea4c89' }, // 7 - pink
      { color: '#8b5a2b' }, // 8 - brown
      { color: '#ffffff' }, // 9 - pure white
      { color: '#000000' }, // 10 - pure black
    ];

    // UI state (ensure defined before draw/update use)
    this.ui = {
      upgradeButton: null,
      upgradePanelOpen: false,
      upgradeRows: [],
      advancedButton: null,
      advancedPanelOpen: false,
      advancedRows: [],
      // Lore UI
      loreButton: null,
      lorePanelOpen: false,
      selectedLoreIndex: 0,
      // Map UI
      mapButton: null,
      mapPanelOpen: false,
      mapRows: [],
      resetButton: null,
      resetConfirm: false,
      // settings UI
      settingsButton: null,
      settingsPanelOpen: false,
      settingsRows: [],
      // dragging state for sliders: null | 'music' | 'sfx'
      dragging: null,
    };

    // Audio & details state controlled by settings panel
    this.musicVolume = 1.0; // start at 100%
    this.sfxVolume = 1.0; // multiplier applied to in-game synthesized SFX (start at 100%)
    // detailsLevel: 'high' = normal, 'medium' = no glow, 'low' = numbers instead of faces
    this.detailsLevel = 'high';

    // Lore discovery: 30 entries, unlocked when a ball of that level is ever seen
    this.discoveredLevels = new Array(30).fill(false);

    // Selected lore index for full-screen lore viewer
    this.selectedLoreIndex = 0;

    // Lore descriptions for each level (30 entries). Unlocked entries show text; locked ones remain locked.
    this.loreDescriptions = [
      "Lv1: He is never happy because nobody thinks he matters as much as the higher ranked balls. Please don't make fun of him.",
      "Lv2: The first ball seen after merging. This makes him pretty happy about his achievement. Maybe a little bit too happy.",
      "Lv3: Nothing bad happens to this guy somehow. This makes him a pretty nice guy. You should talk to him sometime he can improve your day.",
      "Lv4: He for some reason feels he's used a lot more than the previous balls. He isn't. I don't know who told him that, but it made him really cocky.",
      "Lv5: Really shocked that he's halfway to the first double digits ball. No other reason. Totally...",
      "Lv6: This drunker is the stopping point for a lot of people when it comes to drinking beers. Way too many people. Please help this guy if he collapses.",
      "Lv7: A lot of luck is usually good for people, but not this guy. So much luck in fact that he goes through life without needing to do anything, including school.",
      "Lv8: He's worried about his bigger brother ball 9. I'm not joking that's the entire reason.",
      "Lv9: He's incredibly angry about how he was so close to ball 10, but he just didn't push through enough. Now he doesn't get the attention he \"deserves\".",
      "Lv10: Doesn't know how to react about being the first ball with more than one digit, so he just sticks his tongue out.",
      "Lv11: This guy is never able to get any sleep because of the glow around him. He's very sensitive to light when he's trying to sleep.",
      "Lv12: This guy's case is the exact opposite. He sleeps better with glow. Don't wake him up please.",
      "Lv13: The unlucky guy has a very rough life. Some say you should merge him as fast as you can to put him out of his misery.",
      "Lv14: He is very curious, with an erge to go outside of the game walls themselves. We've had to capture him and tell him not to do that more times than I would like to say.",
      "Lv15: I don't want to talk about this guy. He's creepy.",
      "Lv16: This nerd got straight A+'s all the way up until he was 16. Because of his intelligence, he built a time machine to go back to where he hadn't made one mistake.",
      "Lv17: This guy is a lost cause of a rabies victim. I can't tell you why they put him here.",
      "Lv18: He lost one of his eyes in a freak explosives accident. He hates when you look at him wrong because of tihs.",
      "Lv19: This guy wanted to break the current rules of this game and look sideways instead of forward. That's the only accomplishment he's made.",
      "Lv20: An egotistical \"cool\" guy that thinks way too highly of himself because he's \"too cool to need a reason\".",
      "Lv21: Always screaming in horror at the fact that his glow pulsates. Nobody, not even he knows why he pulses to this day. It's actually rather concerning.",
      "Lv22: This type of ball has evolved to have no eyes, but to consume. I mean, can you really blame him? At this level he needs so much food to survive, I'm surprised he hasn't died out yet.",
      "Lv23: He used to work in a nuclear power plant. But lost both of his eyes in a tragic incident that I don't want to bring up. His eyes were replaced with technology, and will become angry if you look at him funny.",
      "Lv24: He is dizzy at the sheer number of merges it took to get here. He doesn't want to go any further for obvious reasons.",
      "Lv25: He's really happy at the fact that you're almost done with the game. He is so big to the point where he can't form a proper smile without part of him covering the smile.",
      "Lv26: Who the hell put the Tri-force on this man? Who is getting fired today?",
      "Lv27: He saw one dog out a car window and can't stop thinking about it. I can't tell you why if I'm being completely honest, maybe there's something wrong with him.",
      "Lv28: A weird merge gone horribly wrong. Instead of a normal ball, or a normal mutation, it's a gross hybrid that somehow made it to be part of the finished game.",
      "Lv29: A good civilized ball with good thoughts and opinions. Nothing bad about this guy. Yeah.",
      "Lv30: The king of balls. The magnum opus of this world. The final frontier. Nothing is past this beast of a ball. You beat the game! Go do something else for now."
    ];

    // Upgrade level defaults
    // Spawn Rate: 0..15 (0 = slowest)
    // Spawn Level: 1..9 (controls what levels spawn)
    // Mutation Rate: 0..10 (0 = 0% mutation)
    this.spawnRateLevel = 0;
    this.spawnLevelLevel = 1;
    this.mutationRateLevel = 0;

    // convenience spawn interval (kept updated when levels change)
    this.spawnInterval = this.getSpawnInterval ? this.getSpawnInterval() : 2;

    // Money counter: total money and floor-saved snapshot
    this.money = 0;
    this._lastSavedMoneyFloor = Math.floor(this.money);
    // Strange Points: incremented whenever a mutation is created
    this.strangePoints = 0;

    // Advanced upgrade state
    this.heavyRainActiveUntil = 0;   // in seconds of game time
    // Recycleable DNA upgrade level (0 = off, 1..7 = active levels)
    this.recyclableDNALevel = 0;
    // accumulator for periodic recyclable DNA splitting (seconds)
    this.recycleAccum = 0;
    // when true, spawn mode is "0s per ball" and autoSpawn will emit one ball per update
    this.zeroSpawnActive = false;

    // simple elapsed time tracker (seconds) for time-based effects
    this.elapsedTime = 0;

    // store username for cheat-code gating
    this.username = 'Oldenbutt';
    // when true, spawn decorative balls (levels 1-10) and disable all merges
    this.aestheticMode = false;

    // --- Persistence: load/save state to localStorage ---
    this.saveKey = 'falling-merge-balls-v1';
    this.saveState = () => {
      try {
        // Only keep compact, serializable ball info to avoid huge payloads.
        const ballsToSave = (this.balls || []).map(b => {
          const out = {
            x: b.x,
            y: b.y,
            vx: b.vx,
            vy: b.vy,
            level: b.level,
            type: b.type,
            // mutation structure if present
            mutation: b.mutation ? {
              left: { level: b.mutation.left.level, type: b.mutation.left.type },
              right: { level: b.mutation.right.level, type: b.mutation.right.type }
            } : null
          };
          return out;
        });

        const state = {
          money: this.money,
          strangePoints: this.strangePoints,
          spawnRateLevel: this.spawnRateLevel,
          spawnLevelLevel: this.spawnLevelLevel,
          mutationRateLevel: this.mutationRateLevel,
          recyclableDNALevel: this.recyclableDNALevel,
          balls: ballsToSave,
          // Map unlock state
          mapUnlocks: this.mapUnlocks || { moon: false, mars: false },
          // Lore discoveries
          discoveredLevels: this.discoveredLevels || new Array(30).fill(false),
          // keep elapsedTime out of persistence to avoid temporal side-effects
        };
        localStorage.setItem(this.saveKey, JSON.stringify(state));
      } catch (e) {
        // ignore save failures (e.g., private mode)
      }
    };
    this.loadState = () => {
      try {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (typeof s.money === 'number') this.money = s.money;
        if (typeof s.strangePoints === 'number') this.strangePoints = s.strangePoints;
        if (typeof s.spawnRateLevel === 'number') this.spawnRateLevel = s.spawnRateLevel;
        if (typeof s.spawnLevelLevel === 'number') this.spawnLevelLevel = s.spawnLevelLevel;
        if (typeof s.mutationRateLevel === 'number') this.mutationRateLevel = s.mutationRateLevel;
        if (typeof s.recyclableDNALevel === 'number') this.recyclableDNALevel = s.recyclableDNALevel;
        // restore persisted map unlocks
        if (s.mapUnlocks && typeof s.mapUnlocks === 'object') {
          this.mapUnlocks = {
            moon: Boolean(s.mapUnlocks.moon),
            mars: Boolean(s.mapUnlocks.mars)
          };
        } else {
          this.mapUnlocks = { moon: false, mars: false };
        }

        // restore lore discoveries, ensure 30-length boolean array
        if (Array.isArray(s.discoveredLevels)) {
          this.discoveredLevels = new Array(30).fill(false);
          for (let i = 0; i < Math.min(30, s.discoveredLevels.length); i++) {
            this.discoveredLevels[i] = Boolean(s.discoveredLevels[i]);
          }
        } else {
          this.discoveredLevels = new Array(30).fill(false);
        }

        // restore balls if present; sanitize and reconstruct radius/type info
        if (Array.isArray(s.balls)) {
          const restored = [];
          for (const sb of s.balls) {
            if (!sb || typeof sb.level !== 'number') continue;
            const level = Math.max(1, Math.min(30, Math.floor(sb.level)));
            const props = this.getPropsForLevel(level);
            const x = (typeof sb.x === 'number') ? sb.x : (props.r + Math.random() * Math.max(0, this.width() - 2 * props.r));
            const y = (typeof sb.y === 'number') ? sb.y : -props.r;
            const vx = (typeof sb.vx === 'number') ? sb.vx : (Math.random() - 0.5) * 90;
            const vy = (typeof sb.vy === 'number') ? sb.vy : 0;

            const ball = {
              x, y, vx, vy,
              r: props.r,
              type: (typeof sb.type === 'number') ? sb.type : props.type,
              level,
            };

            if (sb.mutation && sb.mutation.left && sb.mutation.right) {
              const leftLvl = Math.max(1, Math.min(30, Math.floor(sb.mutation.left.level || 1)));
              const rightLvl = Math.max(1, Math.min(30, Math.floor(sb.mutation.right.level || 1)));
              ball.mutation = {
                left: { level: leftLvl, type: sb.mutation.left.type ?? this.getPropsForLevel(leftLvl).type },
                right: { level: rightLvl, type: sb.mutation.right.type ?? this.getPropsForLevel(rightLvl).type }
              };
              // use nominal level equal to the higher half for logic
              ball.level = Math.max(leftLvl, rightLvl);
              // recompute radius to visual size of the merged container
              ball.r = this.getPropsForLevel(ball.level).r;
            }

            restored.push(ball);
          }
          this.balls = restored;
        }

        // refresh derived values
        this.spawnInterval = this.getSpawnInterval();
      } catch (e) {}
    };

    // load saved progress if any
    this.loadState();

    // after loading balls, compute how many additional "level-1" units are needed
    // to have enough material for a single level-30 ball; this defines our spawn quota.
    this.computeSpawnQuotaIfNeeded();
    // ensure mapUnlocks exists
    if (!this.mapUnlocks) this.mapUnlocks = { moon: false, mars: false };
    // cache for map starfield so stars don't move between frames
    this.mapStars = null;

    // ensure we persist on page unload as well
    try {
      window.addEventListener('beforeunload', () => {
        try { this.saveState(); } catch (e) {}
      });
    } catch (e) {}

    // Preload icon images and remove white backgrounds by converting near-white pixels to transparent
    this.icons = [];
    const iconPaths = [
      './1.png','./2.png','./3.png','./4.png','./5.png',
      './6.png','./7.png','./8.png','./9.png','./10.png',
      './11.png','./12.png','./13.png','./14.png','./15.png',
      './16.png','./17.png','./18.png','./19.png','./20.png',
      './21.png','./22.png','./23.png','./24.png','./25.png',
      './26.png','./27.png','./28.png','./29.png','./30.png'
    ];

    // Expose a promise that resolves when all icons have finished loading (success or error).
    this.iconsReady = new Promise((resolve) => { this._resolveIconsReady = resolve; });
    let _iconsProcessed = 0;
    const _onIconProcessed = () => {
      _iconsProcessed++;
      if (_iconsProcessed >= iconPaths.length) {
        // ensure any post-processing is visible to consumers
        try { this._resolveIconsReady(); } catch (e) { /* ignore */ }
      }
    };

    // Preload a rocket image to use in the left bar; fallback to vector rocket if not ready
    this.rocketImg = null;
    try {
      const rimg = new Image();
      rimg.crossOrigin = 'anonymous';
      rimg.onload = () => { this.rocketImg = rimg; };
      rimg.onerror = () => { this.rocketImg = null; };
      rimg.src = './Rocket.png';
    } catch (e) {
      this.rocketImg = null;
    }

    // Preload map images (Earth, Moon, Mars) so the Space Map can use them when available.
    // Map images removed — map feature disabled
    this.mapImages = { earth: null, moon: null, mars: null };

    // lightweight particle system (spawned on merges)
    this.particles = [];

    // WebAudio synth for merge sounds (simple pluck / distorted variant)
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }

    // small helper to play a short tone; if distorted = true, apply waveshaper + detune
    this.playMergeSound = (distorted = false) => {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // base oscillator
      const osc = ctx.createOscillator();
      osc.type = distorted ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(distorted ? 520 : 640, now);

      // envelope gain (scale by sfxVolume)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      // raised the peak gains: normal -> 0.22, distorted -> 0.16
      const peak = (distorted ? 0.16 : 0.22) * (this.sfxVolume ?? 1);
      gain.gain.linearRampToValueAtTime(peak, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (distorted ? 0.42 : 0.28));

      // optional waveshaper for distortion
      let nodeOut = gain;
      if (distorted) {
        const shaper = ctx.createWaveShaper();
        // mild waveshaping curve
        const samples = 256;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
          const x = (i / (samples - 1)) * 2 - 1;
          curve[i] = Math.tanh(x * 4);
        }
        shaper.curve = curve;
        shaper.oversample = '2x';
        osc.connect(shaper);
        shaper.connect(gain);
      } else {
        osc.connect(gain);
      }

      // small filter for character
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(distorted ? 2200 : 2800, now);
      gain.connect(filter);

      // final destination
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (distorted ? 0.45 : 0.32));
    };

    // wavy distorted split sound for mutation splits (short, multi-part flavor)
    this.playSplitSound = () => {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // two slightly detuned oscillators to create a beating "wavy" feel
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o1.frequency.setValueAtTime(520, now);
      o2.frequency.setValueAtTime(540, now);

      // subtle LFO to modulate frequency of o1/o2 for wobble
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(6.5, now); // fairly quick wobble
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(6.0, now); // +/-6 Hz variation

      lfo.connect(lfoGain);
      lfoGain.connect(o1.frequency);
      lfoGain.connect(o2.frequency);

      // individual envelopes into a shared waveshaper and filter
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      // scale envelopes by sfxVolume
      const sfx = (this.sfxVolume ?? 1);
      g1.gain.setValueAtTime(0.0001, now);
      g2.gain.setValueAtTime(0.0001, now);

      // quick attack and slightly longer decay for a plucky split sound
      g1.gain.linearRampToValueAtTime(0.18 * sfx, now + 0.006);
      g1.gain.exponentialRampToValueAtTime(0.0002, now + 0.48);
      g2.gain.linearRampToValueAtTime(0.12 * sfx, now + 0.008);
      g2.gain.exponentialRampToValueAtTime(0.0002, now + 0.42);

      o1.connect(g1);
      o2.connect(g2);

      // combine
      const mix = ctx.createGain();
      g1.connect(mix);
      g2.connect(mix);

      // mild waveshaper for character
      const sh = ctx.createWaveShaper();
      const samples = 256;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i / (samples - 1)) * 2 - 1;
        // asymmetric soft-clipping for a gritty texture
        curve[i] = Math.tanh(x * (1 + 0.6 * Math.abs(x)));
      }
      sh.curve = curve;
      sh.oversample = '2x';
      mix.connect(sh);

      // band-pass filter to focus on mid harmonics and emphasize wobble
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(900, now);
      bp.Q.setValueAtTime(0.9, now);

      sh.connect(bp);

      // final gain envelope for overall level shaping
      const outG = ctx.createGain();
      outG.gain.setValueAtTime(0.0001, now);
      // swell a bit to emphasize split transient then fade
      outG.gain.linearRampToValueAtTime(0.28 * sfx, now + 0.01);
      outG.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      bp.connect(outG);
      outG.connect(ctx.destination);

      // start nodes
      o1.start(now);
      o2.start(now);
      lfo.start(now);

      // stop after lifetime
      const stopAt = now + 0.88;
      o1.stop(stopAt);
      o2.stop(stopAt);
      lfo.stop(stopAt);
    };

    // distinct short "pop" for mutated-ball splits (higher pitch + quick decay)
    this.playMutatedSplitSound = () => {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const sfx = (this.sfxVolume ?? 1);

      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1100, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.26 * sfx, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      const hf = ctx.createBiquadFilter();
      hf.type = 'highpass';
      hf.frequency.setValueAtTime(600, now);

      o.connect(g);
      g.connect(hf);
      hf.connect(ctx.destination);

      o.start(now);
      o.stop(now + 0.24);
    };

    // helper to strip a near-uniform background color (white or black) from an Image and return a new HTMLImageElement
    const stripBackground = (img, target = 'white') => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return img;

      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, w, h);

      const data = octx.getImageData(0, 0, w, h);
      const px = data.data;

      // convert near-white or near-black pixels to fully transparent based on target
      if (target === 'black') {
        // make near-black pixels transparent
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          if (r < 25 && g < 25 && b < 25) {
            px[i + 3] = 0;
          }
        }
      } else {
        // default: make near-white pixels transparent
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          if (r > 230 && g > 230 && b > 230) {
            px[i + 3] = 0;
          }
        }
      }

      octx.putImageData(data, 0, 0);
      const out = new Image();
      out.src = off.toDataURL('image/png');
      return out;
    };

    // load and process each icon; keep placeholder until processed
    for (let i = 0; i < iconPaths.length; i++) {
      this.icons[i] = null;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // for 10.png and 20.png remove near-black background; otherwise remove near-white
          const path = iconPaths[i] || '';
          // treat 10, 20 and 30 as near-black assets to strip near-black backgrounds
          const useBlack = /(?:\/|^)(?:10|20|30)\.png$/.test(path);
          const target = useBlack ? 'black' : 'white';
          this.icons[i] = stripBackground(img, target);
        } catch (e) {
          // fallback to original if processing fails
          this.icons[i] = img;
        } finally {
          _onIconProcessed();
        }
      };
      img.onerror = () => {
        this.icons[i] = null;
        _onIconProcessed();
      };
      // Start loading immediately
      img.src = iconPaths[i];
    }
  }

  // Compute the total "level-1 equivalents" currently present in all balls
  // and set spawnQuotaOnes to the remaining amount needed to have enough
  // material for a single level-30 ball (2^(30-1) = 2^29 level-1s).
  computeSpawnQuotaIfNeeded() {
    if (this.spawnQuotaOnes != null) return;
    this.recomputeSpawnQuota();
  }

  // Force a fresh recomputation of the spawn quota based on the current balls on screen.
  // This is used both at startup and whenever we are about to stop spawning, so we
  // double-check that there is truly enough material to reach level 30.
  recomputeSpawnQuota() {
    const REQUIRED_ONES_FOR_LVL30 = Math.pow(2, 29);

    let currentOnes = 0;
    try {
      for (const b of this.balls) {
        if (!b) continue;
        if (b.mutation && b.mutation.left && b.mutation.right) {
          const lLvl = Math.max(1, Math.floor(b.mutation.left.level || 1));
          const rLvl = Math.max(1, Math.floor(b.mutation.right.level || 1));
          currentOnes += Math.pow(2, lLvl - 1);
          currentOnes += Math.pow(2, rLvl - 1);
        } else {
          const lvl = Math.max(1, Math.floor(b.level || 1));
          currentOnes += Math.pow(2, lvl - 1);
        }
      }
    } catch (e) {
      // if anything goes wrong, fall back to assuming we have 0
      currentOnes = 0;
    }

    const deficit = REQUIRED_ONES_FOR_LVL30 - currentOnes;
    this.spawnQuotaOnes = Math.max(0, deficit);
    // This quota describes how many *future* level-1 equivalents we will allow to spawn,
    // so we reset the counter that tracks how many we've spawned since this recomputation.
    this.spawnedOnesSoFar = 0;
  }

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  spawnBallAt(x) {
    // ensure spawn quota is initialized before spawning manually
    this.computeSpawnQuotaIfNeeded();

    // stop spawning once we've met the quota of "level-1 equivalents"
    if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) {
      // double-check quota using the latest board state so we don't under-spawn
      this.recomputeSpawnQuota();
      if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) return;
    }

    const w = this.width();
    const h = this.height();
    if (!w || !h) return;

    const level = 1;
    const { r: radius } = this.getPropsForLevel(level);
    const clampedX = Math.max(radius, Math.min(w - radius, x));
    this.balls.push(this.createBall(clampedX, -radius, level));

    // track quota usage in "level-1 equivalents"
    this.spawnedOnesSoFar += Math.pow(2, level - 1);
  }

  getPropsForLevel(level) {
    // base radius and growth behaviour:
    // - levels 1..10 grow at mainGrowth (faster)
    // - levels 11..20 grow at reducedGrowth (slower)
    // - levels 21..30 grow at extraReducedGrowth (slowest)
    const baseRadius = 18;
    const mainGrowth = 1.15;         // per-level multiplier for levels 1-10
    const reducedGrowth = 1.10;      // per-level multiplier for levels 11-20
    const extraReducedGrowth = 1.05; // per-level multiplier for levels 21-30

    // clamp level minimally (allow levels up to 30)
    const lvl = Math.max(1, Math.min(30, Math.floor(level)));

    // compute stage counts
    const firstStages = Math.min(lvl - 1, 10 - 1); // increments covered by mainGrowth (levels 2..10)
    const secondStages = Math.min(Math.max(0, lvl - 1 - firstStages), 20 - 10); // increments for 11..20
    const thirdStages = Math.max(0, (lvl - 1) - firstStages - secondStages); // increments for 21..30

    const r = baseRadius
      * Math.pow(mainGrowth, firstStages)
      * Math.pow(reducedGrowth, secondStages)
      * Math.pow(extraReducedGrowth, thirdStages);

    // wrap color index so levels beyond defined types cycle through the palette
    const type = (lvl - 1) % this.types.length;
    return { r, type };
  }

  // compute money gained per second as the sum of how many level-1 "ones" are required:
  // a level N ball is worth 2^(N-1) (e.g. level3 -> 4, level4 -> 8)
  // mutated balls don't generate money
  moneyPerSecond() {
    let sum = 0;
    for (const b of this.balls) {
      if (b.mutation) continue;
      const lvl = Math.max(1, Math.floor(b.level || 1));
      // safe power calculation (levels are small, using Math.pow)
      sum += Math.pow(2, lvl - 1);
    }
    return sum;
  }

  createBall(x, y, level = 1) {
    const { r, type } = this.getPropsForLevel(level);
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 90,
      vy: 0,
      r,
      type,
      level,
    };
  }

  // Determine which ball level to spawn based on the current Spawn Level upgrade.
  // New behaviour: spawn exactly the selected spawn level (1..20).
  getSpawnedBallLevel() {
    const s = this.getSpawnLevel();
    // always return exactly the configured spawn level
    return Math.min(20, Math.max(1, s));
  }

  autoSpawn(dt) {
    // ensure spawn quota is initialized before automatic spawning
    this.computeSpawnQuotaIfNeeded();

    // stop spawning once we've met the quota of "level-1 equivalents"
    if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) {
      // double-check quota using the latest board state so we don't under-spawn
      this.recomputeSpawnQuota();
      if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) return;
    }

    // If zero-spawn mode is active, spawn one ball per update call (avoids infinite loops).
    if (this.zeroSpawnActive) {
      const w = this.width();
      if (!w) return;
      // If aestheticMode is active, spawn decorative balls of random level 1..7 and avoid using spawn-level upgrades.
      const lvl = this.aestheticMode ? (1 + Math.floor(Math.random() * 7)) : this.getSpawnedBallLevel();
      const { r } = this.getPropsForLevel(lvl);
      const x = r + Math.random() * Math.max(0, w - 2 * r);
      this.balls.push(this.createBall(x, -r, lvl));

      // track quota usage
      this.spawnedOnesSoFar += Math.pow(2, lvl - 1);
      return;
    }

    // choose effective interval (Heavy Rain overrides normal spawn interval)
    const interval = this.getEffectiveSpawnInterval();
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer += interval;
      const w = this.width();
      // If aestheticMode is active, spawn decorative balls of random level 1..7 and avoid using spawn-level upgrades.
      const lvl = this.aestheticMode ? (1 + Math.floor(Math.random() * 7)) : this.getSpawnedBallLevel();
      const { r } = this.getPropsForLevel(lvl);
      const x = r + Math.random() * Math.max(0, w - 2 * r);
      this.balls.push(this.createBall(x, -r, lvl));

      // track quota usage
      this.spawnedOnesSoFar += Math.pow(2, lvl - 1);
    }
  }

  update(dt) {
    const w = this.width();
    const h = this.height();
    if (!w || !h) return;

    // ensure spawn quota exists in case something created balls before first update
    this.computeSpawnQuotaIfNeeded();

    // advance global timer
    this.elapsedTime += dt;

    // handle periodic Recycleable DNA behavior (interval depends on level)
    if (this.recyclableDNALevel > 0) {
      const interval = this.getRecycleInterval();
      this.recycleAccum += dt;
      while (this.recycleAccum >= interval) {
        this.recycleAccum -= interval;
        // if no mutated balls to split, stop trying this cycle
        if (!this.recycleRandomMutation()) {
          break;
        }
      }
    } else {
      this.recycleAccum = 0;
    }

    this.autoSpawn(dt);

    // Mark lore discoveries based on any balls currently on screen (including mutation halves)
    if (Array.isArray(this.discoveredLevels)) {
      for (const b of this.balls) {
        if (!b) continue;
        try {
          if (typeof b.level === 'number') {
            const lvl = Math.max(1, Math.min(30, Math.floor(b.level)));
            this.discoveredLevels[lvl - 1] = true;
          }
          if (b.mutation) {
            const leftLvl = b.mutation.left && typeof b.mutation.left.level === 'number'
              ? Math.max(1, Math.min(30, Math.floor(b.mutation.left.level)))
              : null;
            const rightLvl = b.mutation.right && typeof b.mutation.right.level === 'number'
              ? Math.max(1, Math.min(30, Math.floor(b.mutation.right.level)))
              : null;
            if (leftLvl != null) this.discoveredLevels[leftLvl - 1] = true;
            if (rightLvl != null) this.discoveredLevels[rightLvl - 1] = true;
          }
        } catch (e) {
          // ignore discovery errors
        }
      }
    }

    // accumulate money each frame based on money-per-second (fractional accumulation)
    const mps = this.moneyPerSecond();
    if (mps > 0) {
      this.money += mps * dt;
      // persist only when the floored whole-number money advances to avoid excessive writes
      const floored = Math.floor(this.money);
      if (floored !== this._lastSavedMoneyFloor) {
        this._lastSavedMoneyFloor = floored;
        try { this.saveState(); } catch (e) {}
      }
    }

    // Physics integration
    for (const b of this.balls) {
      b.vy += this.gravity * dt;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Floor: set post-bounce speed so max rebound height ~= damping * previous height
      if (b.y + b.r > h) {
        b.y = h - b.r;
        if (b.vy > 0) {
          // b.vy is positive downwards at impact; multiply by sqrt(damping) to get velocity
          b.vy = -Math.sqrt(this.damping) * b.vy;
        }
      }

      // Ceiling: similar behavior for rebounds off the top
      if (b.y - b.r < 0) {
        b.y = b.r;
        if (b.vy < 0) {
          b.vy = Math.sqrt(this.damping) * -b.vy;
          // invert sign to send it downward
          b.vy = -b.vy;
        }
      }

      // Walls
      if (b.x - b.r < 0) {
        b.x = b.r;
        if (b.vx < 0) b.vx = -b.vx * this.damping;
      } else if (b.x + b.r > w) {
        b.x = w - b.r;
        if (b.vx > 0) b.vx = -b.vx * this.damping;
      }
    }

    this.handleCollisions();

    // If any ball reached level 30, show end-of-game popup (idempotent)
    try {
      // only open the end popup if it isn't already showing and hasn't been dismissed permanently
      if (!(this.ui && this.ui.endPopup) && !(this.ui && this.ui.endPopupDismissed)) {
        for (const b of this.balls) {
          if (b && b.level === 30) {
            this.ui = this.ui || {};
            this.ui.endPopup = true;
            break;
          }
        }
      }
    } catch (e) {}

    // update particles
    this.updateParticles(dt);
  }

  handleCollisions() {
    const balls = this.balls;
    // store references to ball objects to remove, not numeric indices, to avoid accidental removals
    const toRemoveObjs = new Set();

    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      // if 'a' has already been marked for removal skip further processing
      if (toRemoveObjs.has(a)) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        // if 'b' has already been marked for removal skip collision resolution with it
        if (toRemoveObjs.has(b)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.r + b.r;

        if (distSq > minDist * minDist || distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // If one of the two balls is performing a long-distance merge (longMerging),
        // make the merging ball effectively "immovable" and shove the other ball aside
        // so the merging motion cannot be interrupted by collisions.
        if (a.longMerging && !b.longMerging) {
          // push b away along normal to resolve overlap immediately
          const overlap = minDist - dist + 1.5;
          b.x += nx * overlap * 1.05;
          b.y += ny * overlap * 1.05;
          // give b a shove velocity away from the merging ball so it clears the path
          const shoveSpeed = 420;
          b.vx += nx * shoveSpeed * 0.35;
          b.vy += ny * shoveSpeed * 0.35;
          // slightly damp velocities so shoved balls don't explode unrealistically
          b.vx *= 0.9;
          b.vy *= 0.9;
          continue;
        } else if (b.longMerging && !a.longMerging) {
          const overlap = minDist - dist + 1.5;
          a.x -= nx * overlap * 1.05;
          a.y -= ny * overlap * 1.05;
          const shoveSpeed = 420;
          a.vx -= nx * shoveSpeed * 0.35;
          a.vy -= ny * shoveSpeed * 0.35;
          a.vx *= 0.9;
          a.vy *= 0.9;
          continue;
        }

        // Same type and same level -> merge (allow merging at all levels)
        // do not allow mutated (half-half) balls to merge
        // Prevent level-30 balls from merging with anything
        // When aestheticMode is enabled, merging is disabled.
        if (!this.aestheticMode && !a.mutation && !b.mutation && a.type === b.type && a.level === b.level && a.level !== 30 && b.level !== 30) {
          const areaA = a.r * a.r;
          const areaB = b.r * b.r;
          const totalArea = areaA + areaB;

          const weightA = areaA / totalArea;
          const weightB = areaB / totalArea;

          const nextLevel = a.level + 1;
          const { r: newR, type: newType } = this.getPropsForLevel(nextLevel);

          // mutation chance based on current setting; do not allow mutation if chance is zero
          const mutationChance = this.getMutationChance ? this.getMutationChance() : 0;
          const isMutation = mutationChance > 0 && Math.random() < mutationChance;

          if (isMutation) {
            // Decide second half level: either same as pre-merge (a.level) or skip a level (nextLevel+1)
            const secondHalfChoice = Math.random() < 0.5 ? a.level : (nextLevel + 1);
            const leftLevel = nextLevel; // one half is the level after what was merged
            const rightLevel = secondHalfChoice;

            // ensure levels cap at 20
            const cap = (lvl) => Math.min(30, Math.max(1, lvl));
            const lL = cap(leftLevel);
            const rL = cap(rightLevel);

            const leftProps = this.getPropsForLevel(lL);
            const rightProps = this.getPropsForLevel(rL);

            const centerX = a.x * weightA + b.x * weightB;
            const centerY = a.y * weightA + b.y * weightB;
            const centerVx = a.vx * weightA + b.vx * weightB;
            const centerVy = a.vy * weightA + b.vy * weightB;

            const merged = {
              x: centerX,
              y: centerY,
              vx: centerVx,
              vy: centerVy,
              r: newR,
              // mark as mutation with explicit half definitions (left/right halves)
              mutation: {
                left: { level: lL, type: leftProps.type },
                right: { level: rL, type: rightProps.type }
              },
              // set a fallback type (use left half's type) so rendering logic can safely look up types[b.type]
              type: leftProps.type,
              // store a nominal level for logic (use the higher half for level-based mechanics)
              level: Math.max(lL, rL),
            };

            // spawn star-shaped particles and play distorted merge sound
            try {
              const col = this.types[leftProps.type].color || '#ffffff';
              this.spawnParticles(merged.x, merged.y, col, 22, true);
              this.playMergeSound(true);
            } catch (e) {}

            // award Strange Points per mutation: flat 1 SP regardless of levels
            this.strangePoints = (this.strangePoints || 0) + 1;
            try { this.saveState(); } catch (e) {}

            // replace object 'a' by merged object and mark 'b' object for removal
            balls[i] = merged;
            toRemoveObjs.add(b);
            // If this merge produced a level-30 ball, show end-of-game popup (unless permanently dismissed)
            try {
              if (merged && merged.level === 30) {
                this.ui = this.ui || {};
                if (!this.ui.endPopupDismissed) {
                  this.ui.endPopup = true;
                }
              }
            } catch (e) {}
            // remove duplicate redundant set (kept behavior but ensure dismissal respected)
            try {
              if (merged && merged.level === 30) {
                this.ui = this.ui || {};
                if (!this.ui.endPopupDismissed) {
                  this.ui.endPopup = true;
                }
              }
            } catch (e) {}
          } else {
            const merged = {
              x: a.x * weightA + b.x * weightB,
              y: a.y * weightA + b.y * weightB,
              vx: a.vx * weightA + b.vx * weightB,
              vy: a.vy * weightA + b.vy * weightB,
              r: newR,
              type: newType,
              level: nextLevel,
            };

            // spawn circular particles and play normal merge sound
            try {
              const col = this.types[newType].color || '#ffffff';
              this.spawnParticles(merged.x, merged.y, col, 18, false);
              this.playMergeSound(false);
            } catch (e) {}

            balls[i] = merged;
            toRemoveObjs.add(b);
          }
        } else {
          // Simple elastic separation + minimal bounce for different types
          const overlap = minDist - dist;
          const totalR = a.r + b.r || 1;
          const pushA = (overlap * (b.r / totalR)) * 0.6;
          const pushB = (overlap * (a.r / totalR)) * 0.6;

          a.x -= nx * pushA;
          a.y -= ny * pushA;
          b.x += nx * pushB;
          b.y += ny * pushB;

          const relVx = b.vx - a.vx;
          const relVy = b.vy - a.vy;
          const relVelAlongNormal = relVx * nx + relVy * ny;

          if (relVelAlongNormal < 0) {
            const restitution = 0.33;
            const impulse = -(1 + restitution) * relVelAlongNormal / 2;
            const impulseX = impulse * nx;
            const impulseY = impulse * ny;

            a.vx -= impulseX;
            a.vy -= impulseY;
            b.vx += impulseX;
            b.vy += impulseY;

            // Apply additional damping to the velocity components along the collision normal
            // so rebounds have the same effective elasticity used elsewhere (this.damping).
            const dampFactor = Math.sqrt(this.damping);

            // project velocities onto normal
            const aAlong = a.vx * nx + a.vy * ny;
            const bAlong = b.vx * nx + b.vy * ny;

            // replace normal components with damped versions (preserve tangential components)
            a.vx += nx * ((aAlong * dampFactor) - aAlong);
            a.vy += ny * ((aAlong * dampFactor) - aAlong);

            b.vx += nx * ((bAlong * dampFactor) - bAlong);
            b.vy += ny * ((bAlong * dampFactor) - bAlong);
          }
        }
      }
    }

    // remove any objects that were marked for deletion
    if (toRemoveObjs.size) {
      this.balls = balls.filter((obj) => !toRemoveObjs.has(obj));
    }


  }

  // Spawn a new ball matching the highest existing level (if any), at the top.
  spawnHighest() {
    if (!this.balls.length) return;

    // ensure spawn quota is initialized before spawning manually
    this.computeSpawnQuotaIfNeeded();

    // stop spawning once we've met the quota of "level-1 equivalents"
    if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) {
      // double-check quota using the latest board state so we don't under-spawn
      this.recomputeSpawnQuota();
      if (this.spawnQuotaOnes != null && this.spawnedOnesSoFar >= this.spawnQuotaOnes) return;
    }

    let maxLevel = 1;
    for (const b of this.balls) {
      if (b.level > maxLevel) maxLevel = b.level;
    }
    const { r } = this.getPropsForLevel(maxLevel);
    const w = this.width();
    const x = r + Math.random() * Math.max(0, w - 2 * r);
    this.balls.push(this.createBall(x, -r, maxLevel));

    // track quota usage
    this.spawnedOnesSoFar += Math.pow(2, maxLevel - 1);
  }

  draw(ctx) {
    const w = this.width();
    const h = this.height();
    if (!w || !h) return;

    // Background (dark)
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, w, h);

    // Top attribution banner for first 10 seconds
    if ((this.elapsedTime || 0) < 10) {
      const barH = 36;
      // semi-transparent dark strip to sit above the scene
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, w, barH);

      // text
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = 'port by @Drooly_Dragon   game by @Oldenbutt';
      ctx.fillText(text, w / 2, barH / 2);
    }

    // Subtle floor area — match the scene background color so bottom and top are the same
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, h - 40, w, 40);

    // Draw balls and particles first so UI renders on top
    for (const b of this.balls) {
      const typeInfo = this.types[b.type];

      // Outline
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();

      // Ball glow for higher levels (soft glow for 11-20, pulsing stronger glow for 21+)
      // NOTE: do not apply glow to mutated (half/half) balls
      let usedShadow = false;
      // respect detailsLevel: only 'high' enables glows; medium/low/minimal disable glows
      if (this.detailsLevel === 'high') {
        if (!b.mutation && b.level >= 11 && b.level <= 20) {
          usedShadow = true;
          ctx.save();
          // soft glow matching the ball color with reduced alpha
          ctx.shadowColor = this.hexToRgba(typeInfo.color, 0.9);
          ctx.shadowBlur = Math.min(48, b.r * 1.2);
        } else if (!b.mutation && b.level >= 21) {
          usedShadow = true;
          ctx.save();
          // stronger pulsing for 21+ so the glow is more noticeable and dynamic
          // small position offset desyncs pulses between balls
          const pulseSpeed = 5.0; // faster pulse
          const phase = (this.elapsedTime || 0) * pulseSpeed + (b.x || 0) * 0.02;
          // larger amplitude: scale oscillates roughly between ~0.1 and ~1.9 for a dramatic pulse
          const scale = 1.0 + 0.9 * Math.sin(phase);
          // amplify blur and alpha for a more pronounced glow, clamp to sensible maxes
          const blur = Math.min(140, b.r * 2.2 * Math.max(0.6, scale));
          const alpha = Math.min(1, 0.98 * (0.7 + 0.6 * (scale - 1))); // vary alpha with scale for stronger visibility
          ctx.shadowColor = this.hexToRgba(typeInfo.color, Math.max(0.18, alpha));
          ctx.shadowBlur = blur;
        }
      }

      // Ball
      const ballGradient = ctx.createRadialGradient(
        b.x - b.r * 0.35,
        b.y - b.r * 0.35,
        b.r * 0.15,
        b.x,
        b.y,
        b.r
      );
      // removed bright white highlight for a flatter look
      ballGradient.addColorStop(0, typeInfo.color);
      ballGradient.addColorStop(1, this.darken(typeInfo.color, 0.2));

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();

      if (usedShadow) ctx.restore();

      // Draw icon (use preloaded PNG with transparent background instead of numeric level)
      if (b.mutation) {
        // draw left and right halves with their own colors and icons
        const left = b.mutation.left;
        const right = b.mutation.right;

        const leftTypeInfo = this.types[left.type];
        const rightTypeInfo = this.types[right.type];

        // paint halves (ensure crisp dividing line)
        ctx.save();
        // left half
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, b.r, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath();
        ctx.fillStyle = leftTypeInfo.color;
        ctx.fill();

        // right half
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, b.r, -Math.PI / 2, Math.PI / 2, true);
        ctx.closePath();
        ctx.fillStyle = rightTypeInfo.color;
        ctx.fill();

        // draw thin seam
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - b.r);
        ctx.lineTo(b.x, b.y + b.r);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // draw icons clipped per half
        const drawSize = b.r * 1.6;
        // left icon (or numeric when minimal or icon missing)
        const leftIconIndex = (left.level - 1) % this.icons.length;
        const leftImg = this.icons[leftIconIndex];
        if (this.detailsLevel === 'minimal' || !(leftImg && leftImg.complete && leftImg.naturalWidth)) {
          // draw numeric left half (minimal forces numbers; low still shows faces/icons)
          const leftColor = (left.level === 10 || left.level === 20 || left.level === 30)
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(0,0,0,0.95)';
          ctx.fillStyle = leftColor;
          ctx.font = `${Math.max(10, b.r * 0.6)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.arc(b.x, b.y, b.r * 0.9, Math.PI / 2, -Math.PI / 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.fillText(String(left.level), b.x - b.r * 0.28, b.y);
          ctx.restore();
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.arc(b.x, b.y, b.r * 0.9, Math.PI / 2, -Math.PI / 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(leftImg, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
          ctx.restore();
        }

        // right icon (or numeric when minimal or icon missing)
        const rightIconIndex = (right.level - 1) % this.icons.length;
        const rightImg = this.icons[rightIconIndex];
        if (this.detailsLevel === 'minimal' || !(rightImg && rightImg.complete && rightImg.naturalWidth)) {
          // draw numeric right half
          const rightColor = (right.level === 10 || right.level === 20 || right.level === 30)
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(0,0,0,0.95)';
          ctx.fillStyle = rightColor;
          ctx.font = `${Math.max(10, b.r * 0.6)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.arc(b.x, b.y, b.r * 0.9, -Math.PI / 2, Math.PI / 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.fillText(String(right.level), b.x + b.r * 0.28, b.y);
          ctx.restore();
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.arc(b.x, b.y, b.r * 0.9, -Math.PI / 2, Math.PI / 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(rightImg, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
          ctx.restore();
        }
      } else {
        if (b.level != null) {
          // select icon by level (levels beyond available icons wrap)
          const iconIndex = (b.level - 1) % this.icons.length;
          const img = this.icons[iconIndex];
          // If user chose 'low' or 'minimal' detail, always draw numbers instead of faces/icons
          if (this.detailsLevel === 'minimal') {
            // minimal uses numbers instead of faces/icons
            const numColor = (b.level === 10 || b.level === 20 || b.level === 30)
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(0,0,0,0.95)';
            ctx.fillStyle = numColor;
            ctx.font = `${Math.max(10, b.r * 0.9)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(b.level), b.x, b.y);
          } else if (img && img.complete && img.naturalWidth) {
            // fit the icon inside the ball with some padding (shown for 'high', 'medium', and 'low')
            const drawSize = b.r * 1.6;
            ctx.drawImage(img, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
          } else {
            // fallback to number if image hasn't loaded yet
            const fallbackColor = (b.level === 10 || b.level === 20 || b.level === 30)
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(0,0,0,0.95)';
            ctx.fillStyle = fallbackColor;
            ctx.font = `${Math.max(10, b.r * 0.9)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(b.level), b.x, b.y);
          }
        }
      }
    }

    // draw particles on top of balls
    this.drawParticles(ctx);

    // Money and Strange Points counter (top-left) with symbols
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const padX = 12;
    const padY = 14;
    const lineH = 44;

    // Money symbol (yellow circle outline with a triangle outline inside)
    const drawMoneySymbol = (cx, cy, size) => {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f4d35e';
      // circle outline
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      // equilateral-style triangle that touches the circle edges with equal corner sizing
      const r = size * 0.5;
      // balanced triangle vertices: top (-90°), bottom-left (150°), bottom-right (30°)
      const angles = [-Math.PI / 2, (150 * Math.PI) / 180, (30 * Math.PI) / 180];
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const ang = angles[i];
        // place the vertex near the circle edge (offset by 1px so stroke remains visible)
        const px = cx + Math.cos(ang) * (r - 1);
        const py = cy + Math.sin(ang) * (r - 1);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    // Strange Points symbol (blue square outline with a rhombus inside)
    const drawStrangeSymbol = (cx, cy, size) => {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      // square outline
      const s = size * 0.9;
      ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
      // rhombus (diamond) outline
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.4);
      ctx.lineTo(cx - s * 0.35, cy);
      ctx.lineTo(cx, cy + s * 0.4);
      ctx.lineTo(cx + s * 0.35, cy);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    // values
    const moneyVal = Math.floor(this.money);
    const spVal = Math.floor(this.strangePoints || 0);
    const mps = this.moneyPerSecond();

    // draw Money row
    const symSize = 32;
    drawMoneySymbol(padX + symSize / 2, padY + symSize / 2, symSize);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    // show compacted money (K, M, B, etc.)
    const moneyStr = this.formatCompactNumber(moneyVal);
    ctx.fillText(moneyStr, padX + symSize + 12, padY + symSize / 2);

    // draw Strange Points row beneath
    const rowY = padY + lineH;
    drawStrangeSymbol(padX + symSize / 2, rowY + symSize / 2, symSize);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(String(spVal), padX + symSize + 12, rowY + symSize / 2);

    // Upgrades button under Strange Points
    const btnWidth = 140;
    const btnHeight = 30;
    const btnX = padX;
    const btnY = rowY + symSize + 8;

    // cache button rect for interaction
    this.ui.upgradeButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight };

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(250,250,250,0.75)';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';

    // simple rounded rect
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(btnX + r, btnY);
    ctx.lineTo(btnX + btnWidth - r, btnY);
    ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + r);
    ctx.lineTo(btnX + btnWidth, btnY + btnHeight - r);
    ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - r, btnY + btnHeight);
    ctx.lineTo(btnX + r, btnY + btnHeight);
    ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - r);
    ctx.lineTo(btnX, btnY + r);
    ctx.quadraticCurveTo(btnX, btnY, btnX + r, btnY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Upgrades', btnX + btnWidth / 2, btnY + btnHeight / 2);

    // Advanced button under Upgrades - explicitly match the same styling as the Upgrades button above
    const advBtnWidth = 140;
    const advBtnHeight = 30;
    const advBtnX = padX;
    const advBtnY = btnY + btnHeight + 6;

    this.ui.advancedButton = { x: advBtnX, y: advBtnY, w: advBtnWidth, h: advBtnHeight };

    // ensure same stroke and fill as Upgrades button
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(250,250,250,0.75)';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';

    ctx.beginPath();
    ctx.moveTo(advBtnX + r, advBtnY);
    ctx.lineTo(advBtnX + advBtnWidth - r, advBtnY);
    ctx.quadraticCurveTo(advBtnX + advBtnWidth, advBtnY, advBtnX + advBtnWidth, advBtnY + r);
    ctx.lineTo(advBtnX + advBtnWidth, advBtnY + advBtnHeight - r);
    ctx.quadraticCurveTo(advBtnX + advBtnWidth, advBtnY + advBtnHeight, advBtnX + advBtnWidth - r, advBtnY + advBtnHeight);
    ctx.lineTo(advBtnX + r, advBtnY + advBtnHeight);
    ctx.quadraticCurveTo(advBtnX, advBtnY + advBtnHeight, advBtnX, advBtnY + advBtnHeight - r);
    ctx.lineTo(advBtnX, advBtnY + r);
    ctx.quadraticCurveTo(advBtnX, advBtnY, advBtnX + r, advBtnY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Advanced', advBtnX + advBtnWidth / 2, advBtnY + advBtnHeight / 2);



    // Lore button under Advanced
    const loreBtnWidth = 140;
    const loreBtnHeight = 30;
    const loreBtnX = padX;
    const loreBtnY = advBtnY + advBtnHeight + 6;

    this.ui.loreButton = { x: loreBtnX, y: loreBtnY, w: loreBtnWidth, h: loreBtnHeight };

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(250,250,250,0.75)';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';

    ctx.beginPath();
    ctx.moveTo(loreBtnX + r, loreBtnY);
    ctx.lineTo(loreBtnX + loreBtnWidth - r, loreBtnY);
    ctx.quadraticCurveTo(loreBtnX + loreBtnWidth, loreBtnY, loreBtnX + loreBtnWidth, loreBtnY + r);
    ctx.lineTo(loreBtnX + loreBtnWidth, loreBtnY + loreBtnHeight - r);
    ctx.quadraticCurveTo(loreBtnX + loreBtnWidth, loreBtnY + loreBtnHeight, loreBtnX + loreBtnWidth - r, loreBtnY + loreBtnHeight);
    ctx.lineTo(loreBtnX + r, loreBtnY + loreBtnHeight);
    ctx.quadraticCurveTo(loreBtnX, loreBtnY + loreBtnHeight, loreBtnX, loreBtnY + loreBtnHeight - r);
    ctx.lineTo(loreBtnX, loreBtnY + r);
    ctx.quadraticCurveTo(loreBtnX, loreBtnY, loreBtnX + r, loreBtnY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lore', loreBtnX + loreBtnWidth / 2, loreBtnY + loreBtnHeight / 2);



    // Settings button under Lore (placed below Lore button)
    const settingsBtnWidth = 140;
    const settingsBtnHeight = 30;
    const settingsBtnX = padX;
    const settingsBtnY = loreBtnY + loreBtnHeight + 6;

    this.ui.settingsButton = { x: settingsBtnX, y: settingsBtnY, w: settingsBtnWidth, h: settingsBtnHeight };

    // match styling to other buttons
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(250,250,250,0.75)';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';

    ctx.beginPath();
    ctx.moveTo(settingsBtnX + r, settingsBtnY);
    ctx.lineTo(settingsBtnX + settingsBtnWidth - r, settingsBtnY);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnWidth, settingsBtnY, settingsBtnX + settingsBtnWidth, settingsBtnY + r);
    ctx.lineTo(settingsBtnX + settingsBtnWidth, settingsBtnY + settingsBtnHeight - r);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnWidth, settingsBtnY + settingsBtnHeight, settingsBtnX + settingsBtnWidth - r, settingsBtnY + settingsBtnHeight);
    ctx.lineTo(settingsBtnX + r, settingsBtnY + settingsBtnHeight);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY + settingsBtnHeight, settingsBtnX, settingsBtnY + settingsBtnHeight - r);
    ctx.lineTo(settingsBtnX, settingsBtnY + r);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY, settingsBtnX + r, settingsBtnY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Settings', settingsBtnX + settingsBtnWidth / 2, settingsBtnY + settingsBtnHeight / 2);

    // Draw a small Reset button (visible under the Settings button) that triggers a confirmation modal
    const resetBtnWidth = 140;
    const resetBtnHeight = 26;
    const resetBtnX = padX;
    const resetBtnY = settingsBtnY + settingsBtnHeight + 8;

    this.ui.resetButton = { x: resetBtnX, y: resetBtnY, w: resetBtnWidth, h: resetBtnHeight };

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(220,60,60,0.9)';
    ctx.fillStyle = 'rgba(200,40,40,0.9)';

    ctx.beginPath();
    const rr = 6;
    ctx.moveTo(resetBtnX + rr, resetBtnY);
    ctx.lineTo(resetBtnX + resetBtnWidth - rr, resetBtnY);
    ctx.quadraticCurveTo(resetBtnX + resetBtnWidth, resetBtnY, resetBtnX + resetBtnWidth, resetBtnY + rr);
    ctx.lineTo(resetBtnX + resetBtnWidth, resetBtnY + resetBtnHeight - rr);
    ctx.quadraticCurveTo(resetBtnX + resetBtnWidth, resetBtnY + resetBtnHeight, resetBtnX + resetBtnWidth - rr, resetBtnY + resetBtnHeight);
    ctx.lineTo(resetBtnX + rr, resetBtnY + resetBtnHeight);
    ctx.quadraticCurveTo(resetBtnX, resetBtnY + resetBtnHeight, resetBtnX, resetBtnY + resetBtnHeight - rr);
    ctx.lineTo(resetBtnX, resetBtnY + rr);
    ctx.quadraticCurveTo(resetBtnX, resetBtnY, resetBtnX + rr, resetBtnY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Reset', resetBtnX + resetBtnWidth / 2, resetBtnY + resetBtnHeight / 2);



    // Upgrades panel (tab) on the right when open
    if (this.ui.upgradePanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(260, w - panelMargin * 2);
      const panelHeight = 160;
      const panelX = w - panelWidth - panelMargin;
      const panelY = padY;

      // background
      ctx.save();
      ctx.fillStyle = 'rgba(15,15,15,0.75)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const pr = 10;
      ctx.moveTo(panelX + pr, panelY);
      ctx.lineTo(panelX + panelWidth - pr, panelY);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + pr);
      ctx.lineTo(panelX + panelWidth, panelY + panelHeight - pr);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - pr, panelY + panelHeight);
      ctx.lineTo(panelX + pr, panelY + panelHeight);
      ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - pr);
      ctx.lineTo(panelX, panelY + pr);
      ctx.quadraticCurveTo(panelX, panelY, panelX + pr, panelY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.clip();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Upgrades', panelX + 10, panelY + 8);

      // rows
      const rowStartY = panelY + 30;
      const rowH = 36;
      const labelX = panelX + 10;
      const btnW = 90;
      const btnH = 26;
      const btnOffsetX = panelX + panelWidth - btnW - 10;

      // reset row hit regions
      this.ui.upgradeRows = [];

      const rows = [
        {
          key: 'spawnRate',
          label: 'Spawn Rate',
          level: this.spawnRateLevel ?? 0,
          maxLevel: 15,
          // shows current interval as "Xs"
          detail: `${this.getSpawnInterval().toFixed(2)}s`,
          // base 100, doubles each level: level0 -> 100, level1 -> 200, level2 -> 400, ...
          cost: (level) => Math.floor(100 * Math.pow(2, level)),
        },
        {
          key: 'spawnLevel',
          label: 'Spawn Level',
          level: this.spawnLevelLevel || 1,
          maxLevel: 20,
          detail: `Lv ${this.getSpawnLevel()}`,
          // base 500, doubles per level
          cost: (level) => Math.floor(500 * Math.pow(2, level - 1)),
        },
        {
          key: 'mutationRate',
          label: 'Mutation Rate',
          level: this.mutationRateLevel ?? 0,
          maxLevel: 10,
          detail: `${(this.getMutationChance() * 100).toFixed(1)}%`,
          // base 200, doubles per level
          cost: (level) => Math.floor(200 * Math.pow(2, level)),
        },
      ];

      rows.forEach((row, i) => {
        const y = rowStartY + i * rowH;

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(row.label, labelX, y);

        ctx.fillStyle = 'rgba(200,200,200,0.9)';
        ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`Lv ${row.level}/${row.maxLevel}`, labelX, y + 16);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(200,200,200,0.85)';
        ctx.fillText(row.detail, btnOffsetX - 8, y + 8);

        // draw buy button
        const rowBtnX = btnOffsetX;
        const rowBtnY = y + 6;
        const atMax = row.level >= row.maxLevel;
        const canAfford = !atMax && this.money >= row.cost(row.level);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

        ctx.beginPath();
        const rr = 5;
        ctx.moveTo(rowBtnX + rr, rowBtnY);
        ctx.lineTo(rowBtnX + btnW - rr, rowBtnY);
        ctx.quadraticCurveTo(rowBtnX + btnW, rowBtnY, rowBtnX + btnW, rowBtnY + rr);
        ctx.lineTo(rowBtnX + btnW, rowBtnY + btnH - rr);
        ctx.quadraticCurveTo(rowBtnX + btnW, rowBtnY + btnH, rowBtnX + btnW - rr, rowBtnY + btnH);
        ctx.lineTo(rowBtnX + rr, rowBtnY + btnH);
        ctx.quadraticCurveTo(rowBtnX, rowBtnY + btnH, rowBtnX, rowBtnY + btnH - rr);
        ctx.lineTo(rowBtnX, rowBtnY + rr);
        ctx.quadraticCurveTo(rowBtnX, rowBtnY, rowBtnX + rr, rowBtnY);
        ctx.closePath();

        if (atMax) {
          ctx.fillStyle = 'rgba(80,80,80,0.9)';
          ctx.strokeStyle = 'rgba(120,120,120,0.9)';
        } else if (canAfford) {
          ctx.fillStyle = 'rgba(244,211,94,0.9)';
          ctx.strokeStyle = 'rgba(40,30,10,0.8)';
        } else {
          ctx.fillStyle = 'rgba(40,40,40,0.9)';
          ctx.strokeStyle = 'rgba(100,100,100,0.9)';
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = atMax ? 'rgba(220,220,220,0.9)' : 'rgba(10,10,10,0.9)';
        const costText = atMax ? 'MAX' : `${this.formatCompactNumber(row.cost(row.level))}`;
        ctx.fillText(costText, rowBtnX + btnW / 2, rowBtnY + btnH / 2);

        // cache hit region
        this.ui.upgradeRows.push({
          key: row.key,
          x: rowBtnX,
          y: rowBtnY,
          w: btnW,
          h: btnH,
          atMax,
          costNow: row.cost(row.level),
        });

        // reset align for next row's text
        ctx.textAlign = 'left';
      });

      ctx.restore();
    }
    // Settings panel (tab) on the right when open
    if (this.ui.settingsPanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(360, w - panelMargin * 2);
      const panelHeight = 180;
      const panelX = w - panelWidth - panelMargin;
      const panelY = padY;

      ctx.save();
      ctx.fillStyle = 'rgba(15,15,15,0.85)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const pr = 10;
      ctx.moveTo(panelX + pr, panelY);
      ctx.lineTo(panelX + panelWidth - pr, panelY);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + pr);
      ctx.lineTo(panelX + panelWidth, panelY + panelHeight - pr);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - pr, panelY + panelHeight);
      ctx.lineTo(panelX + pr, panelY + panelHeight);
      ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - pr);
      ctx.lineTo(panelX, panelY + pr);
      ctx.quadraticCurveTo(panelX, panelY, panelX + pr, panelY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.clip();

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Settings', panelX + 12, panelY + 8);

      const rowStartY = panelY + 36;
      const rowH = 36;
      const labelX = panelX + 12;
      const sliderX = panelX + 120;
      const sliderW = panelWidth - 140;

      // Music volume slider row
      ctx.fillStyle = 'rgba(220,220,220,0.95)';
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Music Volume', labelX, rowStartY);
      // draw slider background
      const mvY = rowStartY + 16;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sliderX, mvY, sliderW, 8);
      // draw filled portion
      const mvT = Math.max(0, Math.min(1, this.musicVolume || 0));
      ctx.fillStyle = 'rgba(244,211,94,0.95)';
      ctx.fillRect(sliderX, mvY, sliderW * mvT, 8);
      // cache region for pointer handling
      this.ui.settingsMusic = { x: sliderX, y: mvY, w: sliderW, h: 12 };

      // SFX volume slider row
      const sfxY = rowStartY + rowH;
      ctx.fillStyle = 'rgba(220,220,220,0.95)';
      ctx.fillText('SFX Volume', labelX, sfxY);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sliderX, sfxY + 16, sliderW, 8);
      const sfxT = Math.max(0, Math.min(1, this.sfxVolume ?? 1));
      ctx.fillStyle = 'rgba(59,130,246,0.95)';
      ctx.fillRect(sliderX, sfxY + 16, sliderW * sfxT, 8);
      this.ui.settingsSfx = { x: sliderX, y: sfxY + 16, w: sliderW, h: 12 };

      // Details toggle row
      const detY = rowStartY + rowH * 2;
      ctx.fillStyle = 'rgba(220,220,220,0.95)';
      ctx.fillText('Details', labelX, detY);
      const detBtnW = 110;
      const detBtnH = 28;
      const detBtnX = panelX + panelWidth - detBtnW - 12;
      const detBtnY = detY - 2;
      ctx.beginPath();
      const dr = 6;
      ctx.moveTo(detBtnX + dr, detBtnY);
      ctx.lineTo(detBtnX + detBtnW - dr, detBtnY);
      ctx.quadraticCurveTo(detBtnX + detBtnW, detBtnY, detBtnX + detBtnW, detBtnY + dr);
      ctx.lineTo(detBtnX + detBtnW, detBtnY + detBtnH - dr);
      ctx.quadraticCurveTo(detBtnX + detBtnW, detBtnY + detBtnH, detBtnX + detBtnW - dr, detBtnY + detBtnH);
      ctx.lineTo(detBtnX + dr, detBtnY + detBtnH);
      ctx.quadraticCurveTo(detBtnX, detBtnY + detBtnH, detBtnX, detBtnY + detBtnH - dr);
      ctx.lineTo(detBtnX, detBtnY + dr);
      ctx.quadraticCurveTo(detBtnX, detBtnY, detBtnX + dr, detBtnY);
      ctx.closePath();

      ctx.fillStyle = 'rgba(40,40,40,0.95)';
      ctx.strokeStyle = 'rgba(200,200,200,0.12)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const detLabel = this.detailsLevel === 'high' ? 'High' : (this.detailsLevel === 'medium' ? 'Medium' : (this.detailsLevel === 'low' ? 'Low' : 'Minimal'));
      ctx.fillText(detLabel, detBtnX + detBtnW / 2, detBtnY + detBtnH / 2);
      this.ui.settingsDetailsBtn = { x: detBtnX, y: detBtnY, w: detBtnW, h: detBtnH };

      ctx.restore();
    }

    // Lore panel (full-screen centered) when open
    if (this.ui.lorePanelOpen) {
      const mw = Math.min(w - 40, 740);
      const mh = Math.min(h - 40, 520);
      const mx = (w - mw) / 2;
      const my = (h - mh) / 2;

      // backdrop
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);

      // panel
      ctx.fillStyle = 'rgba(18,18,18,0.98)';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1.5;
      const pr = 12;
      ctx.beginPath();
      ctx.moveTo(mx + pr, my);
      ctx.lineTo(mx + mw - pr, my);
      ctx.quadraticCurveTo(mx + mw, my, mx + mw, my + pr);
      ctx.lineTo(mx + mw, my + mh - pr);
      ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - pr, my + mh);
      ctx.lineTo(mx + pr, my + mh);
      ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - pr);
      ctx.lineTo(mx, my + pr);
      ctx.quadraticCurveTo(mx, my, mx + pr, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.clip();

      // Title
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Lore', mx + 20, my + 16);

      // Left: grid of entries (3 columns x 10 rows)
      const gridX = mx + 18;
      const gridY = my + 56;
      const cols = 3;
      const rows = 10;
      const cellW = Math.floor((mw * 0.36 - 22) / cols);
      const cellH = 30;
      ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < 30; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const cx = gridX + col * (cellW + 8);
        const cy = gridY + row * (cellH + 4);
        const unlocked = Array.isArray(this.discoveredLevels) ? !!this.discoveredLevels[i] : false;

        // background for selected
        if (i === this.selectedLoreIndex) {
          ctx.fillStyle = 'rgba(244,211,94,0.12)';
          ctx.fillRect(cx - 6, cy - cellH / 2, cellW + 12, cellH);
        }

        ctx.fillStyle = unlocked ? 'rgba(230,230,230,0.96)' : 'rgba(120,120,120,0.7)';
        const label = `Lv ${i + 1}`;
        ctx.fillText(label, cx, cy);

        // lock glyph if locked
        if (!unlocked) {
          ctx.fillStyle = 'rgba(150,150,150,0.6)';
          ctx.fillText('🔒', cx + cellW - 18, cy);
        }
      }

      // Right: description area
      const descX = mx + mw * 0.42;
      const descW = mx + mw - 24 - descX;
      const descY = my + 56;

      ctx.fillStyle = 'rgba(230,230,230,0.96)';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // header for selected level
      const header = `Level ${this.selectedLoreIndex + 1}`;
      ctx.fillText(header, descX, descY);

      // body text
      ctx.fillStyle = 'rgba(200,200,200,0.95)';
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      const descTop = descY + 30;
      const maxTextWidth = descW - 8;
      const rawText = (this.discoveredLevels && this.discoveredLevels[this.selectedLoreIndex]) ? (this.loreDescriptions[this.selectedLoreIndex] || '') : 'Locked — discover this ball to read its lore.';
      const words = rawText.split(' ');
      const lines = [];
      let current = '';
      for (let i = 0; i < words.length; i++) {
        const test = current ? (current + ' ' + words[i]) : words[i];
        const metrics = ctx.measureText(test);
        if (metrics.width > maxTextWidth && current) {
          lines.push(current);
          current = words[i];
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], descX, descTop + i * 18);
      }

      // small footer hint
      ctx.fillStyle = 'rgba(160,160,160,0.9)';
      ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Tap an entry on the left to view its description. Tap outside to close.', mx + 20, my + mh - 30);

      ctx.restore();
    }

    // Advanced panel (tab) on the right when open
    if (this.ui.advancedPanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(260, w - panelMargin * 2);
      // taller panel to make room for Reset row
      const panelHeight = 160;
      const panelX = w - panelWidth - panelMargin;
      const panelY = padY;

      ctx.save();
      ctx.fillStyle = 'rgba(15,15,15,0.75)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const pr = 10;
      ctx.moveTo(panelX + pr, panelY);
      ctx.lineTo(panelX + panelWidth - pr, panelY);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + pr);
      ctx.lineTo(panelX + panelWidth, panelY + panelHeight - pr);
      ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - pr, panelY + panelHeight);
      ctx.lineTo(panelX + pr, panelY + panelHeight);
      ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - pr);
      ctx.lineTo(panelX, panelY + pr);
      ctx.quadraticCurveTo(panelX, panelY, panelX + pr, panelY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.clip();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Advanced', panelX + 10, panelY + 8);

      const rowStartY = panelY + 30;
      const rowH = 36;
      const labelX = panelX + 10;
      const btnW = 90;
      const btnH = 26;
      const btnOffsetX = panelX + panelWidth - btnW - 10;

      // reset advanced row hit regions
      this.ui.advancedRows = [];

      const heavyRainActive = this.elapsedTime < this.heavyRainActiveUntil;
      const heavyRainRemaining = Math.max(0, this.heavyRainActiveUntil - this.elapsedTime);

      // detail text for Recycleable DNA based on level
      let recycleDetail = 'Unlock';
      if (this.recyclableDNALevel === 1) recycleDetail = 'Split/30s';
      if (this.recyclableDNALevel === 2) recycleDetail = 'Split/20s';
      if (this.recyclableDNALevel === 3) recycleDetail = 'Split/10s';
      if (this.recyclableDNALevel === 4) recycleDetail = 'Split/5s';
      if (this.recyclableDNALevel === 5) recycleDetail = 'Split/3s';
      if (this.recyclableDNALevel === 6) recycleDetail = 'Split/2s';
      if (this.recyclableDNALevel === 7) recycleDetail = 'Split/1s';

      const recycleAtMax = this.recyclableDNALevel >= 7;
      // costs per next level: unlock -> 2 SP, level2 -> 3 SP, level3 -> 4 SP, level4 -> 5 SP, level5 -> 6 SP, level6 -> 7 SP, level7 -> 8 SP
      let recycleCost = 0;
      if (!recycleAtMax) {
        const cur = this.recyclableDNALevel || 0;
        if (cur === 0) recycleCost = 2;
        else if (cur === 1) recycleCost = 3;
        else if (cur === 2) recycleCost = 4;
        else if (cur === 3) recycleCost = 5;
        else if (cur === 4) recycleCost = 6;
        else if (cur === 5) recycleCost = 7;
        else if (cur === 6) recycleCost = 8;
        else recycleCost = 0;
      } else {
        recycleCost = 0;
      }

      // add a Reset row (last) that clears progress; no SP cost required
      const advRows = [
        {
          key: 'heavyRain',
          label: 'Heavy Rain',
          detail: heavyRainActive ? `${heavyRainRemaining.toFixed(1)}s` : '0.1s spawn',
          cost: 1,
          atMax: false,
        },
        {
          key: 'longMerge',
          label: 'Long Distance Merge',
          detail: 'Force merge',
          cost: 1,
          atMax: false,
        },
        {
          key: 'recyclableDNA',
          label: 'Recycleable DNA',
          detail: recycleDetail,
          cost: recycleCost,
          atMax: recycleAtMax,
        },
      ];

      advRows.forEach((row, i) => {
        const y = rowStartY + i * rowH;

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(row.label, labelX, y);

        ctx.fillStyle = 'rgba(200,200,200,0.9)';
        ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(row.detail, labelX, y + 16);

        // draw buy button (uses Strange Points)
        const rowBtnX = btnOffsetX;
        const rowBtnY = y + 6;
        const atMax = row.atMax;
        const canAfford = !atMax && this.strangePoints >= row.cost;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

        ctx.beginPath();
        const rr = 5;
        ctx.moveTo(rowBtnX + rr, rowBtnY);
        ctx.lineTo(rowBtnX + btnW - rr, rowBtnY);
        ctx.quadraticCurveTo(rowBtnX + btnW, rowBtnY, rowBtnX + btnW, rowBtnY + rr);
        ctx.lineTo(rowBtnX + btnW, rowBtnY + btnH - rr);
        ctx.quadraticCurveTo(rowBtnX + btnW, rowBtnY + btnH, rowBtnX + btnW - rr, rowBtnY + btnH);
        ctx.lineTo(rowBtnX + rr, rowBtnY + btnH);
        ctx.quadraticCurveTo(rowBtnX, rowBtnY + btnH, rowBtnX, rowBtnY + btnH - rr);
        ctx.lineTo(rowBtnX, rowBtnY + rr);
        ctx.quadraticCurveTo(rowBtnX, rowBtnY, rowBtnX + rr, rowBtnY);
        ctx.closePath();

        if (row.key === 'reset') {
          // make reset visually distinct and always enabled
          ctx.fillStyle = 'rgba(200,40,40,0.95)';
          ctx.strokeStyle = 'rgba(120,30,30,0.9)';
        } else if (atMax) {
          ctx.fillStyle = 'rgba(80,80,80,0.9)';
          ctx.strokeStyle = 'rgba(120,120,120,0.9)';
        } else if (canAfford) {
          ctx.fillStyle = 'rgba(59,130,246,0.9)';
          ctx.strokeStyle = 'rgba(20,40,80,0.9)';
        } else {
          ctx.fillStyle = 'rgba(40,40,40,0.9)';
          ctx.strokeStyle = 'rgba(100,100,100,0.9)';
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = atMax ? 'rgba(220,220,220,0.9)' : 'rgba(10,10,10,0.9)';
        const costText = row.key === 'reset' ? 'RESET' : (atMax ? 'OWNED' : `${this.formatCompactNumber(row.cost)} SP`);
        ctx.fillText(costText, rowBtnX + btnW / 2, rowBtnY + btnH / 2);

        // cache hit region
        this.ui.advancedRows.push({
          key: row.key,
          x: rowBtnX,
          y: rowBtnY,
          w: btnW,
          h: btnH,
          atMax,
          costNow: row.cost,
        });

        ctx.textAlign = 'left';
      });

      ctx.restore();
    }

    // If reset confirmation modal is active, draw it on top
    if (this.ui && this.ui.resetConfirm) {
      const mw = Math.min(360, w - 40);
      const mh = 120;
      const mx = (w - mw) / 2;
      const my = (h - mh) / 2;

      // dim backdrop
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, w, h);

      // modal panel
      ctx.fillStyle = 'rgba(18,18,18,0.98)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1.5;
      const mrr = 10;
      ctx.beginPath();
      ctx.moveTo(mx + mrr, my);
      ctx.lineTo(mx + mw - mrr, my);
      ctx.quadraticCurveTo(mx + mw, my, mx + mw, my + mrr);
      ctx.lineTo(mx + mw, my + mh - mrr);
      ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - mrr, my + mh);
      ctx.lineTo(mx + mrr, my + mh);
      ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - mrr);
      ctx.lineTo(mx, my + r);
      ctx.quadraticCurveTo(mx, my, mx + mrr, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Are you sure?', mx + 16, my + 12);

      ctx.fillStyle = 'rgba(200,200,200,0.9)';
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('This will delete all progress and reset the game.', mx + 16, my + 38);

      // buttons
      const bw = 100;
      const bh = 36;
      const pad = 14;
      const yesX = mx + mw - pad - bw;
      const yesY = my + mh - pad - bh;
      const noX = yesX - 12 - bw;
      const noY = yesY;

      // No (cancel)
      ctx.fillStyle = 'rgba(120,120,120,0.95)';
      ctx.strokeStyle = 'rgba(80,80,80,0.9)';
      ctx.beginPath();
      const br = 8;
      ctx.moveTo(noX + br, noY);
      ctx.lineTo(noX + bw - br, noY);
      ctx.quadraticCurveTo(noX + bw, noY, noX + bw, noY + br);
      ctx.lineTo(noX + bw, noY + bh - br);
      ctx.quadraticCurveTo(noX + bw, noY + bh, noX + bw - br, noY + bh);
      ctx.lineTo(noX + br, noY + bh);
      ctx.quadraticCurveTo(noX, noY + bh, noX, noY + bh - br);
      ctx.lineTo(noX, noY + br);
      ctx.quadraticCurveTo(noX, noY, noX + br, noY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CANCEL', noX + bw / 2, noY + bh / 2);

      // Yes (reset) - prominent red
      ctx.fillStyle = 'rgba(200,40,40,0.98)';
      ctx.strokeStyle = 'rgba(120,30,30,0.9)';
      ctx.beginPath();
      ctx.moveTo(yesX + br, yesY);
      ctx.lineTo(yesX + bw - br, yesY);
      ctx.quadraticCurveTo(yesX + bw, yesY, yesX + bw, yesY + br);
      ctx.lineTo(yesX + bw, yesY + bh - br);
      ctx.quadraticCurveTo(yesX + bw, yesY + bh, yesX + bw - br, yesY + bh);
      ctx.lineTo(yesX + br, yesY + bh);
      ctx.quadraticCurveTo(yesX, yesY + bh, yesX, yesY + bh - br);
      ctx.lineTo(yesX, yesY + br);
      ctx.quadraticCurveTo(yesX, yesY, yesX + br, yesY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText('RESET', yesX + bw / 2, yesY + bh / 2);

      ctx.restore();
    }

    // End-of-game popup when a level-30 ball is created
    if (this.ui && this.ui.endPopup) {
      const mw = Math.min(480, w - 40);
      // increase modal height to give extra room for wrapped text and spacing
      const mh = 180;
      const mx = (w - mw) / 2;
      const my = (h - mh) / 2;

      // dim backdrop
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, w, h);

      // modal panel
      ctx.fillStyle = 'rgba(20,20,20,0.98)';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1.5;
      const mrr = 12;
      ctx.beginPath();
      ctx.moveTo(mx + mrr, my);
      ctx.lineTo(mx + mw - mrr, my);
      ctx.quadraticCurveTo(mx + mw, my, mx + mw, my + mrr);
      ctx.lineTo(mx + mw, my + mh - mrr);
      ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - mrr, my + mh);
      ctx.lineTo(mx + mrr, my + mh);
      ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - mrr);
      ctx.lineTo(mx, my + mrr);
      ctx.quadraticCurveTo(mx, my, mx + mrr, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText("You've reached the end!", mx + mw / 2, my + 14);

      // Wrapped description text with tighter width and increased spacing so it doesn't overlap the OK button
      ctx.fillStyle = 'rgba(200,200,200,0.92)';
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const desc = "Congrats, you merged until you couldn't merge any further. I don't completely understand why you didn't stop, but at least you have some pride now.";
      // reduce max width slightly and add more vertical gap
      const maxTextWidth = mw - 64; // leave extra padding on both sides
      const words = desc.split(' ');
      const lines = [];
      let current = '';

      for (let i = 0; i < words.length; i++) {
        const test = current ? (current + ' ' + words[i]) : words[i];
        const metrics = ctx.measureText(test);
        if (metrics.width > maxTextWidth && current) {
          lines.push(current);
          current = words[i];
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      // start a bit lower and use slightly larger line height to ensure clear separation from the OK button
      const startY = my + 54;
      const lineHeight = 20;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], mx + mw / 2, startY + i * lineHeight);
      }

      // OK button
      const bw = 120;
      const bh = 40;
      const pad = 18;
      const okX = mx + (mw - bw) / 2;
      const okY = my + mh - pad - bh;

      ctx.fillStyle = 'rgba(60,160,60,0.95)';
      ctx.strokeStyle = 'rgba(20,80,20,0.9)';
      ctx.beginPath();
      const br = 8;
      ctx.moveTo(okX + br, okY);
      ctx.lineTo(okX + bw - br, okY);
      ctx.quadraticCurveTo(okX + bw, okY, okX + bw, okY + br);
      ctx.lineTo(okX + bw, okY + bh - br);
      ctx.quadraticCurveTo(okX + bw, okY + bh, okX + bw - br, okY + bh);
      ctx.lineTo(okX + br, okY + bh);
      ctx.quadraticCurveTo(okX, okY + bh, okX, okY + bh - br);
      ctx.lineTo(okX, okY + br);
      ctx.quadraticCurveTo(okX, okY, okX + br, okY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.font = '15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OK', okX + bw / 2, okY + bh / 2);

      // cache OK button for interaction
      this.ui.endPopupOk = { x: okX, y: okY, w: bw, h: bh };

      ctx.restore();
    }
  }

  darken(hex, factor) {
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    const r = Math.max(0, ((num >> 16) & 255) * (1 - factor)) | 0;
    const g = Math.max(0, ((num >> 8) & 255) * (1 - factor)) | 0;
    const b = Math.max(0, (num & 255) * (1 - factor)) | 0;
    return `rgb(${r},${g},${b})`;
  }

  // spawn particles at x,y; star=true draws star-shaped particles, else circular
  spawnParticles(x, y, color = '#ffffff', count = 18, star = false) {
    // If the player chose the 'low' or 'minimal' details preset, suppress particles entirely to keep visuals minimal.
    if (this.detailsLevel === 'low' || this.detailsLevel === 'minimal') return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 180;
      const life = 0.45 + Math.random() * 0.45;
      const size = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.8 - 20 * Math.random(),
        life,
        age: 0,
        color,
        size,
        star,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 6,
      });
    }
  }

  updateParticles(dt) {
    if (!this.particles.length) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += this.gravity * 0.002 * dt * 60; // slight gravity influence
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.age += dt;
      p.rot += p.spin * dt;
      if (p.age >= p.life) this.particles.splice(i, 1);
    }
  }

  // draw circular or star-shaped particles
  drawParticles(ctx) {
    if (!this.particles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const t = Math.max(0, 1 - p.age / p.life);
      ctx.globalAlpha = t * 0.95;
      ctx.fillStyle = p.color;
      if (p.star) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (1 + t * 1.5);
        ctx.beginPath();
        const spikes = 5;
        const outer = s * 3;
        const inner = s;
        for (let i = 0; i < spikes * 2; i++) {
          const r = (i % 2 === 0) ? outer : inner;
          const ang = (i / (spikes * 2)) * Math.PI * 2;
          const sx = Math.cos(ang) * r;
          const sy = Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - t) * 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // convert hex to rgba string with custom alpha
  hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // compact number formatter: numbers below 1000 show as integers; once a unit (K/M/B/...) is used,
  // always show exactly two decimal places (e.g. 1.23K, 2.50M).
  formatCompactNumber(n) {
    if (n < 1000) return String(n);
    const units = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
    const idx = Math.min(units.length - 1, Math.floor(Math.log10(Math.abs(n)) / 3));
    const scaled = n / Math.pow(1000, idx);
    // For any unit (idx > 0) show exactly two decimal places.
    const s = scaled.toFixed(2);
    return `${s}${units[idx]}`;
  }

  // Helper: spawn interval based on spawnRateLevel (level 0 => 2.0s, each upgrade reduces by 0.1s; clamp at 0.5s)
  getSpawnInterval() {
    const base = 2.0;
    const perLevelReduction = 0.1; // every upgrade speeds up by 0.1s
    const lvl = Math.min(15, Math.max(0, this.spawnRateLevel ?? 0));
    // use lvl * reduction so level 0 => base exactly, and level 15 => base - 15*0.1 = 0.5
    const interval = base - lvl * perLevelReduction;
    return Math.max(0.5, interval);
  }

  // Effective spawn interval, considering temporary Heavy Rain and zero-spawn mode
  getEffectiveSpawnInterval() {
    // zeroSpawnActive is handled specially in autoSpawn; keep compatibility by returning 0 here.
    if (this.zeroSpawnActive) return 0;
    const normal = this.getSpawnInterval();
    if (this.elapsedTime < this.heavyRainActiveUntil) {
      return 0.1;
    }
    return normal;
  }

  // Recycleable DNA: interval (seconds) between automatic mutation splits based on level
  getRecycleInterval() {
    switch (this.recyclableDNALevel) {
      case 1:
        return 30.0;
      case 2:
        return 20.0;
      case 3:
        return 10.0;
      case 4:
        return 5.0;
      case 5:
        return 3.0;
      case 6:
        return 2.0;
      case 7:
        return 1.0;
      default:
        return Infinity;
    }
  }

  // Recycleable DNA helper: pick a random mutated ball and split it into its two halves.
  // Returns true if a ball was split, false if there were no mutated balls.
  recycleRandomMutation() {
    const mutatedIndices = [];
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i].mutation) {
        mutatedIndices.push(i);
      }
    }
    if (!mutatedIndices.length) return false;

    const pickIndex = mutatedIndices[Math.floor(Math.random() * mutatedIndices.length)];
    const b = this.balls[pickIndex];
    const { left, right } = b.mutation;

    const centerX = b.x;
    const centerY = b.y;
    const baseVx = b.vx || 0;
    const baseVy = b.vy || 0;

    const leftProps = this.getPropsForLevel(left.level);
    const rightProps = this.getPropsForLevel(right.level);

    const offset = (b.r || leftProps.r) * 0.4;

    const leftBall = {
      x: centerX - offset,
      y: centerY,
      vx: baseVx - 20,
      vy: baseVy,
      r: leftProps.r,
      type: left.type,
      level: left.level,
    };

    const rightBall = {
      x: centerX + offset,
      y: centerY,
      vx: baseVx + 20,
      vy: baseVy,
      r: rightProps.r,
      type: right.type,
      level: right.level,
    };

    // replace the mutation ball with its two halves
    this.balls.splice(pickIndex, 1);
    this.balls.push(leftBall, rightBall);

    // small particle effect and distinct split sound for mutated-ball split
    try {
      const col = this.types[left.type].color || '#ffffff';
      this.spawnParticles(centerX, centerY, col, 14, false);
      // play the new mutated-split sound
      this.playMutatedSplitSound();
    } catch (e) {}

    // Strange Points are preserved; we don't add or remove any here.
    return true;
  }

  // Long Distance Merge: find the highest level for which there are at least two eligible normal (non-mutated)
  // balls of the same level and type, then propel two of them towards each other to encourage a merge.
  triggerLongDistanceMerge() {
    if (!this.balls || !this.balls.length) return;
    // build a map keyed by "level|type" -> array of indices
    const buckets = new Map();
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      if (!b) continue;
      if (b.mutation) continue; // only normal balls can be force-merged
      const lvl = Math.floor(b.level || 1);
      const type = b.type;
      const key = `${lvl}|${type}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(i);
    }

    // find highest level bucket with at least 2 entries
    let candidate = null;
    let bestLevel = -1;
    for (const [key, arr] of buckets.entries()) {
      if (arr.length >= 2) {
        const [lvlStr] = key.split('|');
        const lvl = parseInt(lvlStr, 10);
        if (lvl > bestLevel) {
          bestLevel = lvl;
          candidate = { key, indices: arr.slice() };
        }
      }
    }

    if (!candidate) {
      // nothing to do
      return;
    }

    // pick two balls that are farthest apart among the candidates to maximize chance of merge
    const indices = candidate.indices;
    let aIdx = indices[0];
    let bIdx = indices[1];
    let maxDistSq = -1;
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        const bi = this.balls[indices[i]];
        const bj = this.balls[indices[j]];
        if (!bi || !bj) continue;
        const dx = bj.x - bi.x;
        const dy = bj.y - bi.y;
        const dsq = dx * dx + dy * dy;
        if (dsq > maxDistSq) {
          maxDistSq = dsq;
          aIdx = indices[i];
          bIdx = indices[j];
        }
      }
    }

    const A = this.balls[aIdx];
    const B = this.balls[bIdx];
    if (!A || !B) return;

    // compute midpoint and set velocities directing them towards each other
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;

    // set a strong inward velocity so they converge quickly but keep some vertical allowance
    const speed = 520; // tuned for quick convergence
    const toMidAX = mx - A.x;
    const toMidAY = my - A.y;
    const lenA = Math.max(1e-4, Math.sqrt(toMidAX * toMidAX + toMidAY * toMidAY));
    A.vx = (toMidAX / lenA) * speed;
    A.vy = (toMidAY / lenA) * speed;

    const toMidBX = mx - B.x;
    const toMidBY = my - B.y;
    const lenB = Math.max(1e-4, Math.sqrt(toMidBX * toMidBX + toMidBY * toMidBY));
    B.vx = (toMidBX / lenB) * speed;
    B.vy = (toMidBY / lenB) * speed;

    // mark these two as longMerging so they won't be interrupted; collisions will shove other balls aside
    A.longMerging = true;
    B.longMerging = true;

    // give them a tiny nudge outward to prevent exact overlap issues until collision resolves
    A.x += (Math.random() - 0.5) * 2;
    B.x += (Math.random() - 0.5) * 2;

    // visual feedback: spawn some particles at both ends (no mutation-merge sound here)
    try {
      const col = this.types[A.type].color || '#ffffff';
      this.spawnParticles(A.x, A.y, col, 12, false);
      this.spawnParticles(B.x, B.y, col, 12, false);
      // intentionally do not play the mutation merge sound when forcing a merge
    } catch (e) {}

    // consuming SP is handled by the caller prior to invoking this method
  }

  // Helper: spawn level (maps spawnLevelLevel directly to 1..20)
  getSpawnLevel() {
    return Math.min(20, Math.max(1, this.spawnLevelLevel || 1));
  }

  // After a Spawn Level upgrade, remove any balls that are now below the current spawn level.
  // New rule: keep only balls whose level is >= current spawn level; mutated balls are kept
  // only if both halves are >= current spawn level.
  restrictObsoleteLevels() {
    const s = this.getSpawnLevel(); // 1..20

    this.balls = this.balls.filter((b) => {
      try {
        if (b.mutation) {
          const leftLvl = Math.floor(b.mutation.left.level || 1);
          const rightLvl = Math.floor(b.mutation.right.level || 1);
          // keep mutated ball only if both halves meet or exceed current spawn level
          return leftLvl >= s && rightLvl >= s;
        } else {
          const lvl = Math.floor(b.level || 1);
          // keep only if the ball's level is >= current spawn level
          return lvl >= s;
        }
      } catch (e) {
        // if anything goes wrong, keep the ball to avoid accidental loss
        return true;
      }
    });
  }

  // Helper: mutation chance based on mutationRateLevel (level0 => 0%, each upgrade adds 0.2%, max 2%)
  getMutationChance() {
    const perLevel = 0.002; // 0.2% per upgrade
    const lvl = Math.min(10, Math.max(0, this.mutationRateLevel ?? 0));
    const chance = lvl * perLevel;
    return Math.min(0.02, chance); // clamp at 2% max
  }

  // Handle pointer interactions: toggle upgrade panel, buy upgrades, close panel when clicking outside.
  // x,y are canvas-local coordinates (CSS pixels).
  handlePointer(x, y) {
    const w = this.width();
    const h = this.height();
    if (!w || !h) return false;

    // If a reset confirmation modal is open, handle its buttons first
    if (this.ui && this.ui.resetConfirm) {
      // modal dimensions (match drawing logic below)
      const mw = Math.min(360, w - 40);
      const mh = 120;
      const mx = (w - mw) / 2;
      const my = (h - mh) / 2;

      // confirm/ cancel button positions
      const bw = 100;
      const bh = 36;
      const pad = 14;
      const yesX = mx + mw - pad - bw;
      const yesY = my + mh - pad - bh;
      const noX = yesX - 12 - bw;
      const noY = yesY;

      // click outside modal dismisses it
      if (x < mx || x > mx + mw || y < my || y > my + mh) {
        this.ui.resetConfirm = false;
        return true;
      }

      // Yes (perform reset)
      if (x >= yesX && x <= yesX + bw && y >= yesY && y <= yesY + bh) {
        // perform the same reset logic as the Reset row
        this.money = 0;
        this.strangePoints = 0;
        this.spawnRateLevel = 0;
        this.spawnLevelLevel = 1;
        this.mutationRateLevel = 0;
        this.recyclableDNALevel = 0;
        this.heavyRainActiveUntil = 0;
        this.balls = [];
        this.particles = [];
        this.spawnInterval = this.getSpawnInterval();
        // reset map unlocks and cached map visuals so map returns to default locked state
        this.mapUnlocks = { moon: false, mars: false };
        this.mapStars = null;
        // reset spawn quota system so a fresh quota is computed for the new run
        this.spawnQuotaOnes = null;
        this.spawnedOnesSoFar = 0;

        // re-lock lore and reset selected index / UI state
        this.discoveredLevels = new Array(30).fill(false);
        this.selectedLoreIndex = 0;
        // ensure UI reflects reset lore state
        if (this.ui) {
          this.ui.selectedLoreIndex = 0;
          this.ui.lorePanelOpen = false;
        }

        try {
          localStorage.removeItem(this.saveKey);
        } catch (e) {}
        try { this.saveState(); } catch (e) {}

        this.ui.resetConfirm = false;
        return true;
      }

      // No (cancel)
      if (x >= noX && x <= noX + bw && y >= noY && y <= noY + bh) {
        this.ui.resetConfirm = false;
        return true;
      }

      // clicks inside modal but not on buttons are handled
      return true;
    }

    // If end-of-game popup is active, handle its OK button (do not allow outside click to dismiss)
    if (this.ui && this.ui.endPopup) {
      const ok = (this.ui.endPopupOk || {});
      const bw = ok.w || 120;
      const bh = ok.h || 40;
      const okX = ok.x || ((w - bw) / 2);
      const okY = ok.y || ((h - bh) / 2 + 40);

      // If click is on OK button, dismiss popup
      if (x >= okX && x <= okX + bw && y >= okY && y <= okY + bh) {
        // dismiss popup and mark permanently dismissed so it won't reopen
        this.ui.endPopup = false;
        this.ui.endPopupOk = null;
        this.ui.endPopupDismissed = true;
        return true;
      }

      // clicks anywhere else are consumed but do not close the popup
      return true;
    }

    // Check upgrade button first (top-left)
    // If the Map panel were open, consume clicks on left-side UI (Upgrades / Advanced / Settings / Reset)
    // so those controls cannot be activated while viewing the map — map feature disabled so only consume for existing panels.
    if (this.ui && this.ui.mapPanelOpen) {
      const btns = [this.ui.upgradeButton, this.ui.advancedButton, this.ui.settingsButton, this.ui.resetButton];
      for (const b of btns) {
        if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          // treat the click as handled but do nothing
          return true;
        }
      }
    }

    if (this.ui && this.ui.upgradeButton) {
      const b = this.ui.upgradeButton;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.ui.upgradePanelOpen = !this.ui.upgradePanelOpen;
        if (this.ui.upgradePanelOpen) this.ui.advancedPanelOpen = false;
        return true;
      }
    }

    // Check Advanced button
    if (this.ui && this.ui.advancedButton) {
      const b = this.ui.advancedButton;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.ui.advancedPanelOpen = !this.ui.advancedPanelOpen;
        if (this.ui.advancedPanelOpen) {
          this.ui.upgradePanelOpen = false;
          this.ui.settingsPanelOpen = false;
          this.ui.lorePanelOpen = false;
        }
        return true;
      }
    }

    // Check Lore button
    if (this.ui && this.ui.loreButton) {
      const b = this.ui.loreButton;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.ui.lorePanelOpen = !this.ui.lorePanelOpen;
        if (this.ui.lorePanelOpen) {
          this.ui.upgradePanelOpen = false;
          this.ui.advancedPanelOpen = false;
          this.ui.settingsPanelOpen = false;
        }
        return true;
      }
    }



    // Check Settings button (new)
    if (this.ui && this.ui.settingsButton) {
      const b = this.ui.settingsButton;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.ui.settingsPanelOpen = !this.ui.settingsPanelOpen;
        if (this.ui.settingsPanelOpen) {
          this.ui.upgradePanelOpen = false;
          this.ui.advancedPanelOpen = false;
          this.ui.lorePanelOpen = false;
          this.ui.mapPanelOpen = false;
        }
        return true;
      }
    }

    // Check visible Reset button (the small one under Advanced/Settings)
    if (this.ui && this.ui.resetButton) {
      const b = this.ui.resetButton;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        // open confirmation modal
        this.ui.resetConfirm = true;
        // close panels for clarity
        this.ui.advancedPanelOpen = false;
        this.ui.upgradePanelOpen = false;
        this.ui.settingsPanelOpen = false;
        return true;
      }
    }

    // Lore panel interactions (full-screen centered)
    if (this.ui && this.ui.lorePanelOpen) {
      const mw = Math.min(w - 40, 740);
      const mh = Math.min(h - 40, 520);
      const mx = (w - mw) / 2;
      const my = (h - mh) / 2;

      // if click is outside panel, close it
      if (x < mx || x > mx + mw || y < my || y > my + mh) {
        this.ui.lorePanelOpen = false;
        return true;
      }

      // If click is inside, check the left grid (3 columns x 10 rows)
      const gridX = mx + 18;
      const gridY = my + 56;
      const cols = 3;
      const rows = 10;
      const cellW = Math.floor((mw * 0.36 - 22) / cols);
      const cellH = 30;

      for (let i = 0; i < 30; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const cx = gridX + col * (cellW + 8);
        const cy = gridY + row * (cellH + 4);
        const left = cx - 6;
        const top = cy - cellH / 2;
        if (x >= left && x <= left + cellW + 12 && y >= top && y <= top + cellH) {
          // select this lore entry
          this.selectedLoreIndex = i;
          return true;
        }
      }

      // clicks inside panel but not on a grid entry are handled (do nothing)
      return true;
    }

    // If panel open, check rows and clicks inside/outside panel
    if (this.ui && this.ui.upgradePanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(260, w - panelMargin * 2);
      const panelHeight = 160;
      const panelX = w - panelWidth - panelMargin;
      const panelY = 14; // padY used in draw = 14

      // if click is outside the panel area, close it
      if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
        this.ui.upgradePanelOpen = false;
        return true;
      }

      // otherwise check upgradeRows cached hit regions
      if (this.ui.upgradeRows && this.ui.upgradeRows.length) {
        for (const row of this.ui.upgradeRows) {
          const rx = row.x;
          const ry = row.y;
          const rw = row.w;
          const rh = row.h;
          if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
            // attempt purchase
            if (row.atMax) return true;
            if (this.money >= row.costNow) {
              this.money -= row.costNow;

              if (row.key === 'spawnRate') {
                this.spawnRateLevel = Math.min(15, (this.spawnRateLevel ?? 0) + 1);
                this.spawnInterval = this.getSpawnInterval();
              } else if (row.key === 'spawnLevel') {
                this.spawnLevelLevel = Math.min(20, (this.spawnLevelLevel || 1) + 1);
                // After increasing Spawn Level, trim balls of levels that can no longer spawn.
                this.restrictObsoleteLevels();
              } else if (row.key === 'mutationRate') {
                this.mutationRateLevel = Math.min(10, (this.mutationRateLevel ?? 0) + 1);
              }

              // ensure spawnInterval is kept up-to-date (defensive)
              this.spawnInterval = this.getSpawnInterval();

              // save progress after purchase
              try { this.saveState(); } catch (e) {}

              return true;
            } else {
              // can't afford - still handled
              return true;
            }
          }
        }
      }

      // click inside panel but not on a button - treat as handled
      return true;
    }

    // Settings panel interactions
    if (this.ui && this.ui.settingsPanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(360, w - panelMargin * 2);
      const panelHeight = 180;
      const panelX = w - panelWidth - panelMargin;
      const panelY = 14; // padY used in draw = 14

      // click outside panel closes it
      if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
        this.ui.settingsPanelOpen = false;
        return true;
      }

      // music slider (pointerdown starts dragging so pointermove can adjust continuously)
      if (this.ui.settingsMusic) {
        const s = this.ui.settingsMusic;
        if (y >= s.y && y <= s.y + s.h && x >= s.x && x <= s.x + s.w) {
          const t = Math.max(0, Math.min(1, (x - s.x) / s.w));
          this.musicVolume = t;
          // start dragging so pointermove updates while pressed
          this.ui.dragging = 'music';
          // if background music object exposed by main.js, sync volume (respect global attenuation)
          try { if (window.backgroundMusic) window.backgroundMusic.volume = this.musicVolume * (window.MUSIC_ATTENUATION ?? 0.6); } catch (e) {}
          try { this.saveState(); } catch (e) {}
          return true;
        }
      }

      // sfx slider (pointerdown starts dragging)
      if (this.ui.settingsSfx) {
        const s = this.ui.settingsSfx;
        if (y >= s.y && y <= s.y + s.h && x >= s.x && x <= s.x + s.w) {
          const t = Math.max(0, Math.min(1, (x - s.x) / s.w));
          this.sfxVolume = t;
          this.ui.dragging = 'sfx';
          try { this.saveState(); } catch (e) {}
          return true;
        }
      }

      // Details button
      if (this.ui.settingsDetailsBtn) {
        const b = this.ui.settingsDetailsBtn;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          // cycle through detail presets: high -> medium -> low -> minimal -> high
          if (this.detailsLevel === 'high') this.detailsLevel = 'medium';
          else if (this.detailsLevel === 'medium') this.detailsLevel = 'low';
          else if (this.detailsLevel === 'low') this.detailsLevel = 'minimal';
          else this.detailsLevel = 'high';
          try { this.saveState(); } catch (e) {}
          return true;
        }
      }

      // click inside panel but not on a control - treat as handled
      return true;
    }

    // Map panel interactions (centered/large)
    if (this.ui && this.ui.mapPanelOpen) {
      const margin = 20;
      const panelSize = Math.min(w - margin * 2, h - margin * 2);
      const panelX = (w - panelSize) / 2;
      const panelY = (h - panelSize) / 2;
      const panelWidth = panelSize;
      const panelHeight = panelSize;

      // If the explicit close button is present, check it first; do not auto-close on outside clicks anymore.
      if (this.ui.mapCloseBtn) {
        const cb = this.ui.mapCloseBtn;
        if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
          this.ui.mapPanelOpen = false;
          return true;
        }
      }

      // check unlock button clicks using cached mapRows
      if (this.ui.mapRows && this.ui.mapRows.length) {
        for (const row of this.ui.mapRows) {
          const rx = row.x;
          const ry = row.y;
          const rw = row.w;
          const rh = row.h;
          if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
            if (row.key === 'moon') {
              if ((this.mapUnlocks && this.mapUnlocks.moon) || this.money < row.cost) return true;
              this.money -= row.cost;
              this.mapUnlocks = this.mapUnlocks || { moon: false, mars: false };
              this.mapUnlocks.moon = true;
              try { this.saveState(); } catch (e) {}
              return true;
            } else if (row.key === 'mars') {
              if ((this.mapUnlocks && this.mapUnlocks.mars) || this.money < row.cost) return true;
              this.money -= row.cost;
              this.mapUnlocks = this.mapUnlocks || { moon: false, mars: false };
              this.mapUnlocks.mars = true;
              try { this.saveState(); } catch (e) {}
              return true;
            }
          }
        }
      }

      // clicks inside the map area that are not on control buttons are treated as handled and do not close the map
      return true;
    }

    // Advanced panel interactions
    if (this.ui && this.ui.advancedPanelOpen) {
      const panelMargin = 10;
      const panelWidth = Math.min(260, w - panelMargin * 2);
      const panelHeight = 120;
      const panelX = w - panelWidth - panelMargin;
      const panelY = 14; // padY used in draw = 14

      // click outside panel closes it
      if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
        this.ui.advancedPanelOpen = false;
        return true;
      }

      if (this.ui.advancedRows && this.ui.advancedRows.length) {
        for (const row of this.ui.advancedRows) {
          const rx = row.x;
          const ry = row.y;
          const rw = row.w;
          const rh = row.h;
          if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
            if (row.atMax) return true;

            // handle Reset specially (no SP cost required)
            if (this.strangePoints >= row.costNow) {
              this.strangePoints -= row.costNow;

              if (row.key === 'heavyRain') {
                // activate Heavy Rain by adding 10 seconds to remaining duration (stackable)
                if (this.elapsedTime < this.heavyRainActiveUntil) {
                  this.heavyRainActiveUntil += 10;
                } else {
                  this.heavyRainActiveUntil = this.elapsedTime + 10;
                }
              } else if (row.key === 'longMerge') {
                // trigger a long-distance merge attempt (consume SP was done earlier)
                try {
                  // mark the selected pair as longMerging inside triggerLongDistanceMerge
                  this.triggerLongDistanceMerge();
                } catch (e) {}
              } else if (row.key === 'recyclableDNA') {
                // upgrade Recycleable DNA level up to 7
                this.recyclableDNALevel = Math.min(7, (this.recyclableDNALevel || 0) + 1);
              }

              // save progress after spending Strange Points
              try { this.saveState(); } catch (e) {}

              return true;
            } else {
              return true;
            }
          }
        }
      }

      return true;
    }

    return false;
  }

  // Continuous pointer move handler for slider dragging (x,y in canvas-local CSS pixels)
  handlePointerMove(x, y) {
    if (!this.ui || !this.ui.dragging) return false;
    if (this.ui.dragging === 'music' && this.ui.settingsMusic) {
      const s = this.ui.settingsMusic;
      const t = Math.max(0, Math.min(1, (x - s.x) / s.w));
      this.musicVolume = t;
      // respect global attenuation if provided by main.js (fallback to 0.6)
      try { if (window.backgroundMusic) window.backgroundMusic.volume = this.musicVolume * (window.MUSIC_ATTENUATION ?? 0.6); } catch (e) {}
      try { this.saveState(); } catch (e) {}
      return true;
    }
    if (this.ui.dragging === 'sfx' && this.ui.settingsSfx) {
      const s = this.ui.settingsSfx;
      const t = Math.max(0, Math.min(1, (x - s.x) / s.w));
      this.sfxVolume = t;
      try { this.saveState(); } catch (e) {}
      return true;
    }
    return false;
  }

  // End any active slider drag (called on pointerup/touchend)
  handlePointerUp() {
    if (this.ui && this.ui.dragging) {
      this.ui.dragging = null;
      return true;
    }
    return false;
  }
}