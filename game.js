(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");

  const DATA = window.NYA_DATA || {};
  const CATS = DATA.CATS || [];
  const MODES = DATA.MODES || {};
  const WEATHERS = DATA.WEATHERS || {};
  const ACHIEVEMENTS = DATA.ACHIEVEMENTS || [];
  const RANDOM_CAT = DATA.RANDOM_CAT || { id: "random", name: "随机猫" };
  const RealCat = window.RealCat;

  const STORAGE_KEY = "nyanya-jump-advanced-v1";
  const DESIGN_H = 900;
  const SHORT_H = 760;
  const SURFACE_START = 610;
  const MIN_DIST = 96;
  const MAX_DIST = 342;
  const BASE_CHARGE_MS = 900;
  const PERFECT_RADIUS = 15;
  const RACE_TOTAL = 120;
  const CAT_SCALE = 1.25;

  const PALETTES = [
    { top: "#ffd9c8", edge: "#f2b6a0", side: "#e7a18c", dark: "#d88c77", glow: "#ffb7a2" },
    { top: "#cdeedf", edge: "#a7d8c2", side: "#91c7af", dark: "#7eb29a", glow: "#98dbc0" },
    { top: "#ded1f4", edge: "#c1aee5", side: "#ab98d0", dark: "#9784bc", glow: "#c0a9ea" },
    { top: "#ffe9ac", edge: "#f1d487", side: "#dcc077", dark: "#c9ac62", glow: "#ffdc81" },
    { top: "#cde6f4", edge: "#a7cee2", side: "#92b9cf", dark: "#80a6bc", glow: "#9fd3ee" },
    { top: "#f8d1d4", edge: "#e5b2b8", side: "#d29da5", dark: "#bf8b93", glow: "#f1b7bd" },
    { top: "#f6dcc0", edge: "#e4c29e", side: "#d1ad87", dark: "#bd9975", glow: "#f0cba5" },
  ];

  const SHAPES = ["square", "circle", "hex", "triangle"];

  const DEFAULT_STATS = {
    totalJumps: 0,
    totalPerfects: 0,
    totalRuns: 0,
    maxCombo: 0,
    maxScore: 0,
    raceRuns: 0,
    raceBest: 0,
    gambleRuns: 0,
    gambleBest: 0,
    gamblePerfectRuns: 0,
    rescues: 0,
    lightningJumps: 0,
    slipLands: 0,
    randomRuns: 0,
    noSkillBest: 0,
    weatherSeen: {},
    modes: { classic: 0, race: 0, gamble: 0 },
  };

  const DEFAULT_SAVE = {
    sound: true,
    music: true,
    haptics: true,
    skills: true,
    weather: true,
    motion: false,
    selected: "persian",
    mode: "classic",
    raceDuration: 120,
    gambleSteps: 5,
    best: 0,
    bestRace: 0,
    bestGamble: 0,
    bestRaceByDuration: {},
    bestGambleBySteps: {},
    unlocked: false,
    achievements: {},
    stats: JSON.parse(JSON.stringify(DEFAULT_STATS)),
  };

  function loadSave() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
      const parsed = JSON.parse(raw);
      const merged = {
        ...JSON.parse(JSON.stringify(DEFAULT_SAVE)),
        ...parsed,
        stats: {
          ...JSON.parse(JSON.stringify(DEFAULT_STATS)),
          ...(parsed.stats || {}),
          weatherSeen: { ...(parsed.stats && parsed.stats.weatherSeen) },
          modes: { ...DEFAULT_STATS.modes, ...(parsed.stats && parsed.stats.modes) },
        },
        achievements: { ...(parsed.achievements || {}) },
      };
      ["best", "bestRace", "bestGamble"].forEach((key) => {
        merged[key] = Math.max(0, Number(merged[key]) || 0);
      });
      merged.bestRaceByDuration = { ...(parsed.bestRaceByDuration || {}) };
      merged.bestGambleBySteps = { ...(parsed.bestGambleBySteps || {}) };
      return merged;
    } catch (error) {
      return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }
  }

  const save = loadSave();

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch (error) {
      // Private mode can reject storage; the session still plays.
    }
  }

  function normalizeSave() {
    if (!MODES[save.mode]) save.mode = "classic";
    if (save.selected !== "random") {
      const cat = CATS.find((item) => item.id === save.selected);
      if (!cat || (cat.hidden && !save.unlocked)) save.selected = "persian";
    }
    if (!save.stats.weatherSeen || typeof save.stats.weatherSeen !== "object") {
      save.stats.weatherSeen = {};
    }
    save.raceDuration = clamp(Math.round((Number(save.raceDuration) || 120) / 5) * 5, 10, 120);
    save.gambleSteps = clamp(Math.round((Number(save.gambleSteps) || 5) / 5) * 5, 5, 200);
    if (!save.bestRaceByDuration || typeof save.bestRaceByDuration !== "object") save.bestRaceByDuration = {};
    if (!save.bestGambleBySteps || typeof save.bestGambleBySteps !== "object") save.bestGambleBySteps = {};
  }

  normalizeSave();

  function getCat(id) {
    return CATS.find((cat) => cat.id === id) || CATS[0];
  }

  function availableCats() {
    return CATS.filter((cat) => !cat.hidden || save.unlocked);
  }

  function randomCatId(exclude) {
    const pool = availableCats().filter((cat) => cat.id !== exclude);
    const list = pool.length ? pool : availableCats();
    return list[Math.floor(Math.random() * list.length)].id;
  }

  const state = {
    screen: "home",
    mode: save.mode,
    paused: false,
    phase: "idle",
    time: 0,
    ambient: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    hits: 0,
    misses: 0,
    jumps: 0,
    mistakes: 0,
    step: 0,
    shake: 0,
    platforms: [],
    currentIndex: 0,
    runCatId: save.selected === "random" ? randomCatId() : save.selected,
    randomPreviewId: save.selected === "random" ? randomCatId() : null,
    player: {
      x: 300,
      y: SURFACE_START,
      power: 0,
      rotation: 0,
      pitch: 0,
    },
    cameraX: 0,
    cameraY: 0,
    cameraFocusX: 300,
    cameraFocusY: SURFACE_START,
    chargeElapsed: 0,
    chargeEmit: 0,
    jump: null,
    fall: null,
    landingTimer: 0,
    landCompress: 0,
    skillUsed: false,
    tutorialDone: false,
    newUnlock: false,
    raceTime: RACE_TOTAL,
    raceTotal: RACE_TOTAL,
    raceExpired: false,
    raceBannerTimer: 0,
    weatherType: "clear",
    weatherIntensity: 0.35,
    weatherJumpsLeft: 7,
    weatherSeenRun: {},
    lightningTimer: 8,
    flash: 0,
    bolt: 0,
    windDir: 1,
    showNextPlatform: true,
    blind: {
      active: false,
      stage: "input",
      powers: [],
      results: [],
      allResults: [],
      totalSteps: 5,
      rounds: 1,
      roundIndex: 0,
      localIndex: 0,
      waitTimer: 0,
      revealTimer: 0,
      resultTimer: 0,
      inputLock: 0,
      course: [],
    },
    effects: [],
    floats: [],
    rings: [],
    achQueue: [],
    achShowing: false,
    lastRaceDisplay: "",
    resultReason: "",
  };

  const view = {
    width: 0,
    height: 0,
    dpr: 1,
    scale: 1,
    vw: 480,
    vh: DESIGN_H,
    designH: DESIGN_H,
    shortLandscape: false,
    homePlatformY: 500,
  };

  let lastFrame = performance.now();
  let toastTimer = 0;
  let weatherNoticeTimer = 0;
  let audio = null;
  let resizeObserver = null;

  const el = {
    homeScreen: $("#homeScreen"),
    gameScreen: $("#gameScreen"),
    homeBottom: $(".home-bottom"),
    catStrip: $("#catStrip"),
    selectedAvatar: $("#selectedAvatar"),
    selectedLabel: $("#selectedLabel"),
    selectedName: $("#selectedName"),
    skillName: $("#skillName"),
    skillDesc: $("#skillDesc"),
    statMeter: $("#statMeter"),
    miniSkillBtn: $("#miniSkillBtn"),
    miniSkillText: $("#miniSkillText"),
    modeRow: $("#modeRow"),
    modeDesc: $("#modeDesc"),
    modeConfig: $("#modeConfig"),
    raceConfig: $("#raceConfig"),
    gambleConfig: $("#gambleConfig"),
    raceDurationValue: $("#raceDurationValue"),
    raceDurationRange: $("#raceDurationRange"),
    gambleStepsValue: $("#gambleStepsValue"),
    gambleStepsRange: $("#gambleStepsRange"),
    quickWeather: $("#quickWeather"),
    quickWeatherIcon: $("#quickWeatherIcon"),
    quickWeatherText: $("#quickWeatherText"),
    startBtn: $("#startBtn"),
    startLabel: $("#startLabel"),
    scoreValue: $("#scoreValue"),
    bestValue: $("#bestValue"),
    bestLabel: $("#bestLabel"),
    scoreHud: $("#scoreHud"),
    raceClock: $("#raceClock"),
    raceTime: $("#raceTime"),
    comboBadge: $("#comboBadge"),
    comboText: $("#comboText"),
    skillStatus: $("#skillStatus"),
    skillStatusText: $("#skillStatusText"),
    weatherChip: $("#weatherChip"),
    weatherIcon: $("#weatherIcon"),
    weatherLabel: $("#weatherLabel"),
    weatherNotice: $("#weatherNotice"),
    weatherNoticeIcon: $("#weatherNoticeIcon"),
    weatherNoticeTitle: $("#weatherNoticeTitle"),
    weatherNoticeDesc: $("#weatherNoticeDesc"),
    raceBanner: $("#raceBanner"),
    raceBannerTime: $("#raceBannerTime"),
    blindPanel: $("#blindPanel"),
    blindCount: $("#blindCount"),
    blindInstruction: $("#blindInstruction"),
    blindProgress: $("#blindProgress"),
    blindSlots: $("#blindSlots"),
    blindContinue: $("#blindContinue"),
    tutorial: $("#tutorial"),
    perfectFlash: $("#perfectFlash"),
    toast: $("#toast"),
    achBadge: $("#achBadge"),
    achievementsBtn: $("#achievementsBtn"),
    achievementToast: $("#achievementToast"),
    achToastIcon: $("#achToastIcon"),
    achToastName: $("#achToastName"),
    pauseOverlay: $("#pauseOverlay"),
    gameoverOverlay: $("#gameoverOverlay"),
    settingsOverlay: $("#settingsOverlay"),
    achievementsOverlay: $("#achievementsOverlay"),
    achievementsGrid: $("#achievementGrid"),
    achCount: $("#achCount"),
    achTotal: $("#achTotal"),
    achProgressBar: $("#achProgressBar"),
    resultKicker: $("#resultKicker"),
    resultTitle: $("#resultTitle"),
    resultQuote: $("#resultQuote"),
    finalScore: $("#finalScore"),
    finalPrimary: $("#finalPrimary"),
    finalPrimaryLabel: $("#finalPrimaryLabel"),
    finalSecondary: $("#finalSecondary"),
    finalSecondaryLabel: $("#finalSecondaryLabel"),
    finalTertiary: $("#finalTertiary"),
    finalTertiaryLabel: $("#finalTertiaryLabel"),
    resultModeNote: $("#resultModeNote"),
    resultBestLine: $("#resultBestLine"),
    unlockNote: $("#unlockNote"),
    skillsToggle: $("#skillsToggle"),
    weatherToggle: $("#weatherToggle"),
    soundToggle: $("#soundToggle"),
    musicToggle: $("#musicToggle"),
    hapticsToggle: $("#hapticsToggle"),
    motionToggle: $("#motionToggle"),
    soundBtn: $("#soundBtn"),
    pauseBtn: $("#pauseBtn"),
    retryBtn: $("#retryBtn"),
    settingsBtnHome: $("#settingsBtnHome"),
    settingsCloseBtn: $("#settingsCloseBtn"),
    settingsDoneBtn: $("#settingsDoneBtn"),
    resumeBtn: $("#resumeBtn"),
    pauseAchievementsBtn: $("#pauseAchievementsBtn"),
    pauseSettingsBtn: $("#pauseSettingsBtn"),
    pauseHomeBtn: $("#pauseHomeBtn"),
    resultHomeBtn: $("#resultHomeBtn"),
    resultCatBtn: $("#resultCatBtn"),
    resultAchievementsBtn: $("#resultAchievementsBtn"),
    achievementsCloseBtn: $("#achievementsCloseBtn"),
    achievementsDoneBtn: $("#achievementsDoneBtn"),
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function roundedRectPath(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function ellipsePath(context, x, y, rx, ry, rotation = 0) {
    context.beginPath();
    context.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rotation, 0, Math.PI * 2);
  }

  function fillEllipse(context, x, y, rx, ry, color, rotation = 0) {
    context.fillStyle = color;
    ellipsePath(context, x, y, rx, ry, rotation);
    context.fill();
  }

  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== "#") return `rgba(255,255,255,${alpha})`;
    const value = hex.replace("#", "");
    const normalized = value.length === 3
      ? value.split("").map((char) => char + char).join("")
      : value;
    const number = parseInt(normalized, 16);
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function showToast(message, duration = 2100) {
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, duration);
  }

  function haptic(pattern) {
    if (!save.haptics || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Vibration is optional.
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function reduceEffects() {
    return !!save.motion || prefersReducedMotion();
  }

  /* ------------------------------------------------------------------ */
  /* Audio                                                               */
  /* ------------------------------------------------------------------ */

  class AudioKit {
    constructor() {
      this.context = null;
      this.master = null;
      this.chargeOsc = null;
      this.chargeGain = null;
      this.muted = !save.sound;
      this.musicEnabled = !!save.music;
      this.musicTimer = null;
      this.musicStep = 0;
    }

    init() {
      if (!this.context) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        try {
          this.context = new AudioCtor();
          this.master = this.context.createGain();
          this.master.gain.value = this.muted ? 0 : 0.42;
          this.master.connect(this.context.destination);
        } catch (error) {
          this.context = null;
        }
      }
      if (this.context && this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
      if (this.context && this.musicEnabled && !this.muted) this.startMusic();
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.context.currentTime, 0.02);
      }
      if (muted) {
        this.stopCharge();
        this.stopMusic();
      } else {
        this.startMusic();
      }
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = !!enabled;
      if (this.musicEnabled && this.context && !this.muted) this.startMusic();
      else this.stopMusic();
    }

    startMusic() {
      if (!this.context || !this.master || !this.musicEnabled || this.muted || this.musicTimer) return;
      this.musicStep = 0;
      this.musicTimer = window.setInterval(() => this.scheduleMusic(), 430);
      this.scheduleMusic();
    }

    stopMusic() {
      if (this.musicTimer) {
        window.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }

    scheduleMusic() {
      if (!this.context || !this.master || !this.musicEnabled || this.muted) return;
      const now = this.context.currentTime + 0.04;
      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46, 523.25, 659.25, 783.99, 880.0, 783.99, 698.46, 587.33, 523.25];
      const bass = [130.81, 146.83, 174.61, 196.0];
      const index = this.musicStep % melody.length;
      const note = melody[index];
      const voice = this.context.createOscillator();
      const gain = this.context.createGain();
      voice.type = "triangle";
      voice.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.016, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      voice.connect(gain);
      gain.connect(this.master);
      voice.start(now);
      voice.stop(now + 0.42);
      if (index % 4 === 0) {
        const bassVoice = this.context.createOscillator();
        const bassGain = this.context.createGain();
        bassVoice.type = "sine";
        bassVoice.frequency.setValueAtTime(bass[Math.floor(this.musicStep / 4) % bass.length], now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.015, now + 0.03);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
        bassVoice.connect(bassGain);
        bassGain.connect(this.master);
        bassVoice.start(now);
        bassVoice.stop(now + 0.8);
      }
      this.musicStep += 1;
    }

    meow(kind = "jump") {
      if (this.muted) return;
      this.init();
      if (!this.context || !this.master) return;
      const now = this.context.currentTime;
      const profiles = {
        jump: { start: 500, peak: 760, end: 590, duration: 0.24, volume: 0.06 },
        happy: { start: 590, peak: 860, end: 680, duration: 0.32, volume: 0.05 },
        fall: { start: 660, peak: 520, end: 300, duration: 0.58, volume: 0.072 },
        startled: { start: 660, peak: 1060, end: 760, duration: 0.38, volume: 0.085 },
        hello: { start: 470, peak: 650, end: 520, duration: 0.3, volume: 0.05 },
      };
      const profile = profiles[kind] || profiles.jump;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const lfo = this.context.createOscillator();
      const lfoGain = this.context.createGain();
      osc.type = "sawtooth";
      filter.type = "bandpass";
      filter.frequency.value = kind === "fall" ? 760 : 980;
      filter.Q.value = 1.15;
      osc.frequency.setValueAtTime(profile.start, now);
      osc.frequency.exponentialRampToValueAtTime(profile.peak, now + profile.duration * 0.22);
      osc.frequency.exponentialRampToValueAtTime(profile.end, now + profile.duration);
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(kind === "fall" ? 13 : 23, now);
      lfoGain.gain.value = kind === "fall" ? 16 : 26;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + profile.duration + 0.03);
      lfo.stop(now + profile.duration + 0.03);
    }

    tone(frequency, duration, options = {}) {
      if (this.muted) return;
      this.init();
      if (!this.context || !this.master) return;
      const now = this.context.currentTime + (options.delay || 0);
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, options.endFrequency), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(options.volume || 0.05, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
    }

    noise(duration, volume = 0.05, cutoff = 900) {
      if (this.muted) return;
      this.init();
      if (!this.context || !this.master) return;
      const rate = this.context.sampleRate;
      const length = Math.floor(rate * duration);
      const buffer = this.context.createBuffer(1, length, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      const gain = this.context.createGain();
      gain.gain.value = volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start();
    }

    startCharge() {
      if (this.muted) return;
      this.init();
      if (!this.context || !this.master) return;
      this.stopCharge();
      const now = this.context.currentTime;
      this.chargeOsc = this.context.createOscillator();
      this.chargeGain = this.context.createGain();
      this.chargeOsc.type = "sine";
      this.chargeOsc.frequency.setValueAtTime(145, now);
      this.chargeGain.gain.setValueAtTime(0.0001, now);
      this.chargeGain.gain.exponentialRampToValueAtTime(0.025, now + 0.8);
      this.chargeOsc.connect(this.chargeGain);
      this.chargeGain.connect(this.master);
      this.chargeOsc.start(now);
    }

    updateCharge(power) {
      if (this.muted || !this.context || !this.chargeOsc) return;
      const now = this.context.currentTime;
      this.chargeOsc.frequency.setTargetAtTime(145 + power * 470, now, 0.045);
      if (this.chargeGain) {
        this.chargeGain.gain.setTargetAtTime(0.018 + power * 0.018, now, 0.05);
      }
    }

    stopCharge() {
      if (!this.context || !this.chargeOsc || !this.chargeGain) {
        this.chargeOsc = null;
        this.chargeGain = null;
        return;
      }
      const now = this.context.currentTime;
      const osc = this.chargeOsc;
      const gain = this.chargeGain;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.03);
      try {
        osc.stop(now + 0.18);
      } catch (error) {
        // Already stopped.
      }
      this.chargeOsc = null;
      this.chargeGain = null;
    }

    jump(power) {
      this.stopCharge();
      this.tone(330 + power * 130, 0.13, {
        endFrequency: 760 + power * 180,
        type: "triangle",
        volume: 0.05,
      });
      this.tone(980, 0.07, { delay: 0.03, type: "sine", volume: 0.022 });
      this.meow("jump");
    }

    land(perfect, combo) {
      this.tone(perfect ? 220 : 172, 0.13, {
        endFrequency: perfect ? 110 : 94,
        type: "sine",
        volume: 0.065,
      });
      if (perfect) {
        const base = 600 + Math.min(combo, 6) * 32;
        this.tone(base, 0.16, { delay: 0.03, type: "sine", volume: 0.04 });
        this.tone(base * 1.5, 0.22, { delay: 0.075, type: "triangle", volume: 0.025 });
        this.meow("happy");
      }
    }

    slip() {
      this.noise(0.18, 0.028, 1900);
      this.tone(240, 0.18, { endFrequency: 170, type: "triangle", volume: 0.02 });
    }

    fail() {
      this.stopCharge();
      this.tone(210, 0.5, { endFrequency: 62, type: "sawtooth", volume: 0.03 });
      this.tone(120, 0.38, { endFrequency: 52, type: "sine", volume: 0.04 });
      this.meow("fall");
    }

    rescue() {
      this.tone(440, 0.14, { endFrequency: 620, type: "sine", volume: 0.035 });
      this.tone(660, 0.2, { delay: 0.11, endFrequency: 880, type: "sine", volume: 0.03 });
    }

    thunder() {
      this.noise(1.1, 0.1, 220);
      this.tone(58, 1.1, { endFrequency: 34, type: "sine", volume: 0.075 });
      this.tone(95, 0.55, { endFrequency: 42, type: "triangle", volume: 0.032 });
    }

    achievement() {
      [620, 784, 988, 1240].forEach((frequency, index) => {
        this.tone(frequency, 0.2, { delay: index * 0.085, type: "triangle", volume: 0.033 });
      });
    }

    unlock() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        this.tone(frequency, 0.24, { delay: index * 0.11, type: "triangle", volume: 0.034 });
      });
    }

    weather() {
      this.tone(360, 0.3, { endFrequency: 480, type: "sine", volume: 0.02 });
    }

    click() {
      this.tone(650, 0.055, { type: "sine", volume: 0.022 });
    }
  }

  audio = new AudioKit();

  /* ------------------------------------------------------------------ */
  /* Save-backed queries                                                 */
  /* ------------------------------------------------------------------ */

  function getBest(mode = state.mode) {
    if (mode === "race") return Math.max(0, Number(save.bestRaceByDuration[save.raceDuration]) || 0);
    if (mode === "gamble") return Math.max(0, Number(save.bestGambleBySteps[save.gambleSteps]) || 0);
    return Math.max(0, Number(save.best) || 0);
  }

  function achievementCount() {
    return Object.keys(save.achievements || {}).length;
  }

  function selectedPreviewCat() {
    if (save.selected === "random") return getCat(state.randomPreviewId || "persian");
    return getCat(save.selected);
  }

  function activeRunCat() {
    return getCat(state.runCatId || save.selected);
  }

  function playerCat() {
    return state.screen === "home" ? selectedPreviewCat() : activeRunCat();
  }

  /* Per-cat physics. Every value falls back to 1.0 so the game stays fair
     whenever the skills switch is off or the run is in blind-bet mode.      */
  const DEFAULT_PHYSICS = {
    size: 1,
    weight: 1,
    jumpPower: 1,
    chargeBarLength: 1,
    chargeSpeed: 1,
    airHeight: 1,
  };

  function physicsOn() {
    return !!save.skills && state.mode !== "gamble";
  }

  function catPhysics(cat) {
    if (!physicsOn()) return DEFAULT_PHYSICS;
    const src = cat && cat.physics ? cat.physics : {};
    return {
      size: Number(src.size) || 1,
      weight: Number(src.weight) || 1,
      jumpPower: Number(src.jumpPower) || 1,
      chargeBarLength: Number(src.chargeBarLength) || 1,
      chargeSpeed: Number(src.chargeSpeed) || 1,
      airHeight: Number(src.airHeight) || 1,
    };
  }

  /* 首页看预览猫，进局后看本局猫——两边都能对上体型与手感 */
  function physicsCat() {
    return state.screen === "home" ? selectedPreviewCat() : activeRunCat();
  }

  function playerPhysics() {
    return catPhysics(physicsCat());
  }

  /* 体型缩放：0.86 ~ 1.16，避免过大压到平台边 */
  function sizeScale() {
    const phys = playerPhysics();
    return clamp(1 + (phys.size - 1) * 1.15, 0.8, 1.28);
  }

  function barLength() {
    const phys = playerPhysics();
    return clamp(phys.chargeBarLength, 0.72, 1.34);
  }

  function chargeDuration() {
    if (!physicsOn()) return BASE_CHARGE_MS;
    const phys = playerPhysics();
    /* 指数放大差异：慢猫更慢、快猫更快 */
    return BASE_CHARGE_MS * Math.pow(1 / Math.max(0.4, phys.chargeSpeed), 1.4);
  }

  /* 跳跃距离随 jumpPower 缩放，蓄力条长度随 chargeBarLength 缩放 */
  function jumpRange() {
    const phys = playerPhysics();
    const jp = Math.max(0.5, phys.jumpPower);
    /* 非线性放大：强猫跳得明显远，弱猫明显近 */
    return {
      min: MIN_DIST * (0.55 + 0.45 * jp),
      max: MAX_DIST * Math.pow(jp, 1.45),
    };
  }

  function requiredPowerFor(distance) {
    const range = jumpRange();
    const span = Math.max(1, range.max - range.min);
    return Math.pow(clamp((distance - range.min) / span, 0.04, 1), 1 / 1.08);
  }

  /* ------------------------------------------------------------------ */
  /* Achievements                                                        */
  /* ------------------------------------------------------------------ */

  function updateAchievementBadge() {
    const count = achievementCount();
    el.achBadge.textContent = String(count);
    el.achBadge.hidden = count === 0;
    el.achCount.textContent = String(count);
    el.achTotal.textContent = String(ACHIEVEMENTS.length);
    el.achProgressBar.style.width = `${(count / Math.max(1, ACHIEVEMENTS.length)) * 100}%`;
  }

  function renderAchievements() {
    el.achievementsGrid.innerHTML = "";
    ACHIEVEMENTS.forEach((achievement) => {
      const unlocked = !!save.achievements[achievement.id];
      const value = Math.max(0, Number(achievement.value(save)) || 0);
      const progress = Math.min(1, value / achievement.goal);
      const item = document.createElement("article");
      item.className = `achievement-item ${unlocked ? "is-unlocked" : "is-locked"}`;
      const icon = document.createElement("span");
      icon.className = "achievement-icon";
      icon.textContent = unlocked ? achievement.icon : "?";
      const copy = document.createElement("div");
      copy.className = "achievement-copy";
      const name = document.createElement("b");
      name.textContent = unlocked ? achievement.name : "尚未点亮";
      const desc = document.createElement("p");
      desc.textContent = achievement.desc;
      const mini = document.createElement("div");
      mini.className = "achievement-mini";
      const bar = document.createElement("span");
      bar.className = "achievement-mini-bar";
      const fill = document.createElement("span");
      fill.style.width = `${progress * 100}%`;
      bar.appendChild(fill);
      const text = document.createElement("small");
      text.textContent = unlocked ? "已收集" : `${Math.min(value, achievement.goal)}/${achievement.goal}`;
      mini.append(bar, text);
      copy.append(name, desc, mini);
      item.append(icon, copy);
      el.achievementsGrid.appendChild(item);
    });
    updateAchievementBadge();
  }

  function queueAchievementToast(achievement) {
    state.achQueue.push(achievement);
    if (!state.achShowing) showNextAchievementToast();
  }

  function showNextAchievementToast() {
    if (!state.achQueue.length) {
      state.achShowing = false;
      return;
    }
    state.achShowing = true;
    const achievement = state.achQueue.shift();
    el.achToastIcon.textContent = achievement.icon;
    el.achToastName.textContent = achievement.name;
    el.achievementToast.classList.add("is-visible");
    audio.achievement();
    window.setTimeout(() => {
      el.achievementToast.classList.remove("is-visible");
      window.setTimeout(showNextAchievementToast, 260);
    }, 2700);
  }

  function checkAchievements(options = {}) {
    const newly = [];
    ACHIEVEMENTS.forEach((achievement) => {
      if (save.achievements[achievement.id]) return;
      const value = Math.max(0, Number(achievement.value(save)) || 0);
      if (value >= achievement.goal) {
        save.achievements[achievement.id] = Date.now();
        newly.push(achievement);
      }
    });
    if (newly.length) {
      persist();
      updateAchievementBadge();
      if (el.achievementsOverlay.classList.contains("is-open")) renderAchievements();
      if (!options.silent) newly.forEach(queueAchievementToast);
    }
    return newly;
  }

  /* ------------------------------------------------------------------ */
  /* Modes and cat selection UI                                          */
  /* ------------------------------------------------------------------ */

  function applyModeUI() {
    state.mode = save.mode;
    app.dataset.mode = state.mode;
    const definition = MODES[state.mode] || MODES.classic;
    el.modeRow.querySelectorAll(".mode-chip").forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (state.mode === "race") {
      el.modeDesc.textContent = `${formatTime(save.raceDuration)} 赛道，失误扣 5 秒。`;
    } else if (state.mode === "gamble") {
      el.modeDesc.textContent = `共 ${save.gambleSteps} 步，每轮 5 次，共 ${Math.ceil(save.gambleSteps / 5)} 轮；无天气无技能。`;
    } else {
      el.modeDesc.textContent = definition.desc;
    }
    el.startLabel.textContent = definition.startLabel;
    el.bestLabel.textContent = definition.bestLabel;
    el.bestValue.textContent = String(getBest());
    syncModeConfigUI();
    updateQuickWeather();
    updateRaceHud();
  }

  function syncModeConfigUI() {
    if (!el.raceDurationRange) return;
    el.raceDurationRange.value = String(save.raceDuration);
    el.gambleStepsRange.value = String(save.gambleSteps);
    el.raceDurationValue.textContent = formatTime(save.raceDuration);
    el.gambleStepsValue.textContent = `${save.gambleSteps} 步`;
    el.raceConfig.classList.toggle("is-active", state.mode === "race");
    el.gambleConfig.classList.toggle("is-active", state.mode === "gamble");
  }

  function setMode(mode) {
    if (!MODES[mode] || state.screen !== "home") return;
    save.mode = mode;
    state.mode = mode;
    persist();
    applyModeUI();
    audio.init();
    audio.click();
    haptic(5);
    resetWorld(true);
  }

  function updateQuickWeather() {
    if (!el.quickWeather) return;
    if (state.mode === "gamble") {
      el.quickWeather.disabled = true;
      el.quickWeather.setAttribute("aria-pressed", "false");
      el.quickWeatherIcon.textContent = "—";
      el.quickWeatherText.textContent = "盲押无天气";
      return;
    }
    el.quickWeather.disabled = false;
    el.quickWeather.setAttribute("aria-pressed", save.weather ? "true" : "false");
    el.quickWeatherIcon.textContent = save.weather ? "☀" : "—";
    el.quickWeatherText.textContent = save.weather ? "天气开" : "天气关";
  }

  function renderCatStrip() {
    if (!el.catStrip) return;
    el.catStrip.innerHTML = "";

    const randomCard = document.createElement("button");
    randomCard.type = "button";
    randomCard.className = "cat-card is-random";
    randomCard.dataset.cat = "random";
    randomCard.setAttribute("role", "option");
    randomCard.setAttribute("aria-selected", save.selected === "random" ? "true" : "false");
    randomCard.setAttribute("aria-label", "随机猫，每局随机抽一只");
    if (save.selected === "random") randomCard.classList.add("is-selected");
    const randomCanvas = document.createElement("canvas");
    randomCanvas.width = 128;
    randomCanvas.height = 128;
    randomCanvas.setAttribute("aria-hidden", "true");
    const randomName = document.createElement("span");
    randomName.className = "cat-name";
    randomName.textContent = "随机";
    const randomBadge = document.createElement("span");
    randomBadge.className = "cat-badge";
    randomBadge.textContent = "?";
    randomCard.append(randomCanvas, randomName, randomBadge);
    el.catStrip.appendChild(randomCard);
    RealCat.randomPortrait(randomCanvas);

    CATS.forEach((cat) => {
      const locked = cat.hidden && !save.unlocked;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "cat-card";
      card.dataset.cat = cat.id;
      card.setAttribute("role", "option");
      card.setAttribute("aria-selected", cat.id === save.selected ? "true" : "false");
      if (cat.id === save.selected) card.classList.add("is-selected");
      if (locked) {
        card.classList.add("is-locked");
        card.setAttribute("aria-label", `${cat.name}，尚未解锁`);
      } else {
        card.setAttribute("aria-label", `${cat.name}，技能 ${cat.skillName}`);
      }

      const portrait = document.createElement("canvas");
      portrait.width = 128;
      portrait.height = 128;
      portrait.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "cat-name";
      name.textContent = locked ? "神秘猫" : cat.shortName;
      const lock = document.createElement("span");
      lock.className = "cat-lock";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "锁";

      card.append(portrait, name, lock);
      el.catStrip.appendChild(card);
      RealCat.portrait(portrait, cat);
    });

    renderSelectedCard();
  }

  /* 把 physics 差异翻译成四条小进度条，技能关闭时整体收敛到中线 */
  function renderStatMeter(cat, isRandom) {
    const host = el.statMeter;
    if (!host) return;
    if (isRandom) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    const on = physicsOn() && cat.physics;
    const phys = on ? cat.physics : DEFAULT_PHYSICS;

    /* 每项映射到 8% ~ 100% 的相对长度 */
    const scaleOf = (v, lo, hi) => {
      const t = clamp((v - lo) / (hi - lo), 0, 1);
      return Math.round(8 + t * 92);
    };
    const rows = {
      size: scaleOf(phys.size || 1, 0.82, 1.24),
      jump: scaleOf(phys.jumpPower || 1, 0.9, 1.12),
      charge: scaleOf(phys.chargeSpeed || 1, 0.7, 1.15),
      air: scaleOf(phys.airHeight || 1, 0.94, 1.14),
    };

    host.querySelectorAll(".stat-chip").forEach((chip) => {
      const key = chip.dataset.stat;
      const fill = chip.querySelector(".stat-fill");
      if (!fill || rows[key] == null) return;
      fill.style.width = `${rows[key]}%`;
      chip.classList.toggle("is-high", rows[key] >= 72);
      chip.classList.toggle("is-low", rows[key] <= 28);
    });
  }

  function renderSelectedCard() {
    const cat = selectedPreviewCat();
    const isRandom = save.selected === "random";
    el.selectedLabel.textContent = isRandom ? "命运猫选" : "当前猫选";
    el.selectedName.textContent = isRandom ? "随机猫" : cat.name;
    el.skillName.textContent = isRandom ? cat.shortName : (save.skills ? cat.skillName : "技能已关");
    if (isRandom) {
      el.skillDesc.textContent = `本次抽到 ${cat.name} · ${cat.skillName}。再点随机卡可以换签。`;
    } else if (!save.skills) {
      el.skillDesc.textContent = "公平模式：所有猫咪只比脚法，判定完全一致。";
    } else {
      el.skillDesc.textContent = cat.skillDesc;
    }
    RealCat.portrait(el.selectedAvatar, cat);
    renderStatMeter(cat, isRandom);
    el.miniSkillText.textContent = save.skills ? "技能开" : "技能关";
    el.miniSkillBtn.setAttribute("aria-pressed", save.skills ? "true" : "false");
    document.querySelectorAll(".cat-card").forEach((card) => {
      const selected = card.dataset.cat === save.selected;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-selected", selected ? "true" : "false");
    });
    updateHomeMetrics();
  }

  function selectCat(catId) {
    if (catId === "random") {
      save.selected = "random";
      state.randomPreviewId = randomCatId(state.randomPreviewId);
      persist();
      audio.init();
      audio.click();
      haptic(6);
      renderSelectedCard();
      resetWorld(true);
      showToast("随机签换好了，本局带 " + selectedPreviewCat().name + " 出门。");
      return;
    }
    const cat = getCat(catId);
    if (!cat) return;
    if (cat.hidden && !save.unlocked) {
      showToast("小熊猫还在云后面。单局拿到 10 次 Perfect、最高 5 连击，它就会出来。", 3200);
      audio.click();
      return;
    }
    save.selected = cat.id;
    state.randomPreviewId = null;
    persist();
    audio.init();
    audio.click();
    audio.meow("hello");
    haptic(6);
    renderSelectedCard();
    resetWorld(true);
    const card = document.querySelector(`.cat-card[data-cat="${cat.id}"]`);
    if (card && card.scrollIntoView) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function toggleSkills() {
    save.skills = !save.skills;
    persist();
    syncSettings();
    updateSkillStatus();
    audio.init();
    audio.click();
    showToast(save.skills ? "猫咪技能已开启。" : "公平模式：技能全关，只剩脚法。");
    haptic(5);
  }

  function toggleWeather() {
    if (state.mode === "gamble") {
      showToast("盲押五连不刮风不下雨，专心跟手感。");
      return;
    }
    save.weather = !save.weather;
    persist();
    syncSettings();
    updateQuickWeather();
    if (!save.weather) {
      setWeather("clear", { silent: true });
      showToast("天气系统已关，今天一直晴。");
    } else {
      state.weatherJumpsLeft = 4;
      showToast("天气系统已开，云马上开始变脸。");
    }
    audio.init();
    audio.click();
  }

  /* ------------------------------------------------------------------ */
  /* Platform generation                                                 */
  /* ------------------------------------------------------------------ */

  function difficultyAt(step) {
    /* 前期 32 步爬满 75%，30 步后再爬 55% —— 高手局依然有得涨 */
    const early = clamp((step - 2) / 32, 0, 1);
    const late = clamp((step - 30) / 60, 0, 1);
    return clamp(early * 0.75 + late * 0.55, 0, 1);
  }

  function makePlatform(x, y, width, shape, rotation, paletteIndex, step, appear = 1) {
    const isTriangle = shape === "triangle";
    const radiusFactor = shape === "circle"
      ? 0.46
      : shape === "triangle"
        ? 0.37
        : shape === "hex"
          ? 0.44
          : 0.43;
    const actualWidth = isTriangle ? width * 1.08 : width;
    return {
      x,
      y,
      width: actualWidth,
      shape,
      rotation,
      palette: PALETTES[paletteIndex % PALETTES.length],
      paletteIndex,
      step,
      appear,
      dustDone: false,
      bounce: 0,
      landRadius: actualWidth * radiusFactor,
    };
  }

  function generateNextPlatform(from, step) {
    const difficulty = difficultyAt(step);
    let distance = rand(172 + difficulty * 26, 212 + difficulty * 108);
    /* 不许超出当前猫的跳跃上限，保证每一跳理论可达 */
    distance = Math.min(distance, jumpRange().max * 0.9);
    const angleRange = 0.22 + difficulty * 0.78;
    const angle = rand(-angleRange, angleRange);
    let dx = Math.cos(angle) * distance;
    let dy = Math.sin(angle) * distance;
    dy = clamp(dy, -185, 92);
    dx = Math.sqrt(Math.max(distance * distance - dy * dy, 0));
    const x = from.x + dx;
    const y = from.y + dy;
    const width = rand(150, 176) * (1 - difficulty * 0.42) * rand(0.9, 1.05);
    let shape;
    if (step < 4) shape = Math.random() > 0.5 ? "square" : "circle";
    else shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let paletteIndex = Math.floor(Math.random() * PALETTES.length);
    if (paletteIndex === from.paletteIndex) paletteIndex = (paletteIndex + 2) % PALETTES.length;
    const rotation = rand(-0.5, 0.5) * (1 + difficulty * 0.9);
    return makePlatform(x, y, width, shape, rotation, paletteIndex, step, 0);
  }

  function currentPlatform() {
    return state.platforms[0];
  }

  function nextPlatform() {
    return state.platforms[1];
  }

  function updateHomeMetrics() {
    if (!el.homeBottom || !el.homeScreen || !view.height) {
      view.homePlatformY = 500;
      return;
    }
    if (view.shortLandscape) {
      view.homePlatformY = view.designH * 0.67;
      return;
    }
    const styles = window.getComputedStyle(el.homeScreen);
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const sheetTop = view.height - paddingBottom - el.homeBottom.offsetHeight;
    view.homePlatformY = (sheetTop - 16) / view.scale;
  }

  function resetWorld(initial = false) {
    const start = makePlatform(300, SURFACE_START, 176, "square", 0, Math.floor(Math.random() * PALETTES.length), 0, 1);
    const following = generateNextPlatform(start, 1);
    following.appear = 1;
    following.dustDone = true;
    state.platforms = [start, following];
    state.currentIndex = 0;
    state.player.x = start.x;
    state.player.y = start.y;
    state.cameraFocusX = start.x;
    state.cameraFocusY = start.y;
    state.player.power = 0;
    state.player.rotation = 0;
    state.player.pitch = 0;
    state.phase = "idle";
    state.chargeElapsed = 0;
    state.chargeEmit = 0;
    state.jump = null;
    state.fall = null;
    state.landingTimer = 0;
    state.landCompress = 0;
    state.skillUsed = false;
    state.tutorialDone = false;
    state.effects = [];
    state.floats = [];
    state.rings = [];
    state.flash = 0;
    state.bolt = 0;
    state.weatherSeenRun = {};
    state.raceExpired = false;
    state.blind.active = false;
    state.blind.stage = "input";
    state.blind.powers = [];
    state.blind.results = [];
    state.blind.allResults = [];
    state.blind.totalSteps = save.gambleSteps;
    state.blind.rounds = Math.max(1, Math.ceil(save.gambleSteps / 5));
    state.blind.roundIndex = 0;
    state.blind.localIndex = 0;
    state.blind.waitTimer = 0;
    state.blind.revealTimer = 0;
    state.blind.resultTimer = 0;
    state.blind.inputLock = 0;
    state.blind.course = [];
    state.showNextPlatform = true;
    updateBlindVisibility();
    updateHomeMetrics();
    updateCamera(0, true);
  }

  function resetRunState() {
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.perfects = 0;
    state.hits = 0;
    state.misses = 0;
    state.jumps = 0;
    state.mistakes = 0;
    state.step = 0;
    state.raceTotal = save.raceDuration;
    state.raceTime = state.raceTotal;
    state.raceExpired = false;
    state.raceBannerTimer = state.mode === "race" ? 3.2 : 0;
    state.landCompress = 0;
    state.skillUsed = false;
    state.weatherJumpsLeft = 8;
    state.weatherSeenRun = {};
    state.lastRaceDisplay = "";
    state.resultReason = "";
    updateRaceHud();
  }

  /* ------------------------------------------------------------------ */
  /* Blind mode                                                          */
  /* ------------------------------------------------------------------ */

  function generateBlindPlatform(from, step) {
    const distance = rand(128, 232);
    const angle = rand(-0.76, 0.76);
    let dx = Math.cos(angle) * distance;
    let dy = Math.sin(angle) * distance;
    dy = clamp(dy, -150, 82);
    dx = Math.sqrt(Math.max(distance * distance - dy * dy, 0));
    const width = rand(118, 166) * rand(0.9, 1.08);
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let paletteIndex = Math.floor(Math.random() * PALETTES.length);
    if (paletteIndex === from.paletteIndex) paletteIndex = (paletteIndex + 2) % PALETTES.length;
    return makePlatform(
      from.x + dx,
      from.y + dy,
      width,
      shape,
      rand(-0.7, 0.7),
      paletteIndex,
      step,
      1
    );
  }

  function buildBlindCourse(totalSteps) {
    const start = makePlatform(300, SURFACE_START, 180, "square", 0, Math.floor(Math.random() * PALETTES.length), 0, 1);
    const course = [start];
    for (let i = 1; i <= totalSteps; i += 1) {
      const next = generateBlindPlatform(course[i - 1], 5 + i * 2);
      next.appear = 1;
      next.dustDone = true;
      course.push(next);
    }
    state.blind.course = course;
    state.blind.totalSteps = totalSteps;
    state.blind.rounds = Math.max(1, Math.ceil(totalSteps / 5));
    state.blind.roundIndex = 0;
    state.blind.localIndex = 0;
    state.blind.allResults = [];
    state.currentIndex = 0;
    state.platforms = [course[0], course[1]];
    state.player.x = course[0].x;
    state.player.y = course[0].y;
    state.cameraFocusX = course[0].x;
    state.cameraFocusY = course[0].y;
    state.phase = "idle";
    state.showNextPlatform = false;
    state.blind.active = true;
    state.blind.stage = "input";
    state.blind.powers = [];
    state.blind.results = [];
    state.blind.waitTimer = 0;
    state.blind.revealTimer = 0;
    state.blind.resultTimer = 0;
    state.blind.inputLock = 0;
    updateBlindVisibility();
    updateBlindUI();
    updateCamera(0, true);
  }

  function updateBlindVisibility() {
    const visible = state.mode === "gamble" && state.screen === "playing";
    el.blindPanel.classList.toggle("is-visible", visible);
    if (visible) el.tutorial.classList.add("is-hidden");
  }

  function blindCompletedSteps() {
    return state.blind.roundIndex * 5 + state.blind.results.length;
  }

  function updateBlindUI() {
    const blind = state.blind;
    const total = blind.totalSteps || save.gambleSteps;
    const rounds = blind.rounds || Math.ceil(total / 5);
    el.blindCount.textContent = String(blind.powers.length);
    el.blindProgress.textContent = `总进度 ${Math.min(total, blindCompletedSteps())} / ${total} · 第 ${Math.min(rounds, blind.roundIndex + 1)} / ${rounds} 轮`;
    if (blind.stage === "input") {
      el.blindInstruction.textContent = `第 ${blind.roundIndex + 1} 轮 · 按住蓄力，松手记一笔`;
    } else if (blind.stage === "wait") {
      el.blindInstruction.textContent = "五笔记好，准备开奖";
    } else if (blind.stage === "break") {
      el.blindInstruction.textContent = "本轮开奖完成，继续押下一轮";
    } else {
      el.blindInstruction.textContent = "猫猫自己跳，安全网兜底";
    }
    const slots = el.blindSlots.querySelectorAll(".blind-slot");
    slots.forEach((slot, index) => {
      const result = blind.results[index];
      const power = blind.powers[index];
      const label = slot.querySelector("b");
      slot.className = "blind-slot";
      if (result) {
        slot.classList.add("is-filled", "is-revealed", `is-${result.kind}`);
        label.textContent = result.kind === "perfect" ? "完美" : result.kind === "hit" ? "普通" : "落空";
      } else if (power != null) {
        slot.classList.add("is-filled");
        label.textContent = `${Math.round(power * 100)}%`;
      } else {
        label.textContent = "—";
      }
      if (blind.stage === "input" && index === blind.powers.length && power == null) {
        slot.classList.add("is-current");
      }
    });
    const hasNextRound = blind.roundIndex + 1 < rounds;
    el.blindContinue.hidden = blind.stage !== "break" || !hasNextRound;
    if (!el.blindContinue.hidden) {
      el.blindContinue.textContent = `继续押 5 次（第 ${blind.roundIndex + 2} / ${rounds} 轮）`;
    }
  }

  function recordBlindPress(power) {
    const blind = state.blind;
    if (blind.stage !== "input" || blind.powers.length >= 5) return;
    blind.powers.push(clamp(power, 0.03, 1));
    blind.inputLock = 0.22;
    audio.click();
    haptic(5);
    updateBlindUI();
    if (blind.powers.length >= 5) {
      blind.stage = "wait";
      blind.waitTimer = 0.75;
      blind.inputLock = 1;
      updateBlindUI();
      showToast(blind.roundIndex + 1 < blind.rounds ? "这一轮五笔押完，猫猫开始跳。" : "最后一轮五笔押完，准备收网。", 1700);
    }
  }

  function startBlindSequence() {
    const blind = state.blind;
    const base = blind.roundIndex * 5;
    blind.stage = "reveal";
    blind.localIndex = 0;
    blind.results = [];
    blind.revealTimer = 0.72;
    const current = blind.course[base];
    const next = blind.course[base + 1];
    state.platforms = [current, next];
    state.player.x = current.x;
    state.player.y = current.y;
    state.phase = "idle";
    state.showNextPlatform = true;
    next.appear = 0;
    next.dustDone = false;
    state.cameraFocusX = current.x;
    state.cameraFocusY = current.y;
    updateBlindUI();
  }

  function blindTargetPlatform() {
    const blind = state.blind;
    return blind.course[blind.roundIndex * 5 + blind.localIndex + 1];
  }

  function beginBlindJump() {
    const blind = state.blind;
    if (blind.localIndex < 0 || blind.localIndex >= 5) return;
    blind.stage = "jumping";
    beginJump(blind.powers[blind.localIndex], { blind: true, auto: true });
    updateBlindUI();
  }

  function platformLandingError(target) {
    const dx = state.player.x - target.x;
    const dyPlane = (state.player.y - target.y) / 0.52;
    const cos = Math.cos(target.rotation);
    const sin = Math.sin(target.rotation);
    const u = dx * cos + dyPlane * sin;
    const v = -dx * sin + dyPlane * cos;
    return Math.hypot(u, v);
  }

  function resolveBlindLanding() {
    const blind = state.blind;
    const target = nextPlatform();
    if (!target) return;
    const error = platformLandingError(target);
    const perfect = error <= PERFECT_RADIUS;
    const hit = error <= target.landRadius;
    const kind = perfect ? "perfect" : hit ? "hit" : "miss";
    const points = perfect ? 3 : hit ? 1 : 0;
    if (!hit) {
      state.player.x = target.x;
      state.player.y = target.y;
      addRing(target.x, target.y, "rgba(255,211,123,.9)", 56, 0.7, 3);
      addFloater("安全网", target.x, target.y - 100, "#a37357");
      spawnBurst(target.x, target.y - 10, 18, ["#ffd780", "#fff5dd", "#ffa788"], "spark");
      audio.rescue();
    } else if (perfect) {
      audio.land(true, blind.localIndex + 1);
      spawnBurst(target.x, target.y - 8, 22, ["#ffd780", "#ff8b78", "#fff4e1"], "spark");
      addRing(target.x, target.y, "rgba(255,180,137,.72)", 62, 0.55, 2.5);
      showPerfectFlash();
    } else {
      audio.land(false, 0);
      spawnDust(state.player.x, target.y, 8, 0.9);
    }

    const result = { kind, points, error };
    blind.results[blind.localIndex] = result;
    blind.allResults[blind.roundIndex * 5 + blind.localIndex] = result;
    blind.stage = "result";
    blind.resultTimer = 0.98;
    state.phase = "landing";
    state.landingTimer = 0.34;
    state.landCompress = 1;
    state.player.x = target.x;
    state.player.y = target.y;
    state.jumps += 1;
    state.score += points;
    if (perfect) {
      state.perfects += 1;
      state.hits += 1;
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      showCombo();
    } else {
      state.combo = 0;
      el.comboBadge.classList.remove("is-visible");
      if (hit) state.hits += 1;
      else state.misses += 1;
    }
    save.stats.totalJumps += 1;
    save.stats.totalPerfects += perfect ? 1 : 0;
    save.stats.maxCombo = Math.max(save.stats.maxCombo, state.maxCombo);
    persist();
    updateHud();
    updateBlindUI();
    checkAchievements();
    haptic(perfect ? [7, 20, 12] : 6);
  }

  function advanceBlind() {
    const blind = state.blind;
    blind.localIndex += 1;
    if (blind.localIndex >= 5) {
      if (blind.roundIndex + 1 >= blind.rounds) {
        if (state.perfects === blind.totalSteps) {
          state.score += 10;
          addFloater("全中 +10", state.player.x, state.player.y - 118, "#b07a23");
        }
        endRun("gamble");
        return;
      }
      const base = (blind.roundIndex + 1) * 5;
      const current = blind.course[base];
      const next = blind.course[base + 1];
      state.platforms = [current, next];
      state.player.x = current.x;
      state.player.y = current.y;
      state.phase = "idle";
      state.landCompress = 0;
      state.showNextPlatform = false;
      state.cameraFocusX = current.x;
      state.cameraFocusY = current.y;
      next.appear = 1;
      next.dustDone = true;
      blind.stage = "break";
      updateBlindUI();
      return;
    }
    const base = blind.roundIndex * 5;
    const current = blind.course[base + blind.localIndex];
    const next = blind.course[base + blind.localIndex + 1];
    state.platforms = [current, next];
    state.player.x = current.x;
    state.player.y = current.y;
    state.phase = "idle";
    state.landCompress = 0;
    state.showNextPlatform = true;
    state.cameraFocusX = current.x;
    state.cameraFocusY = current.y;
    next.appear = 0;
    next.dustDone = false;
    blind.stage = "reveal";
    blind.revealTimer = 0.66;
    updateBlindUI();
  }

  function startNextBlindRound() {
    const blind = state.blind;
    if (blind.stage !== "break") return;
    if (blind.roundIndex + 1 >= blind.rounds) return;
    blind.roundIndex += 1;
    blind.localIndex = 0;
    blind.powers = [];
    blind.results = [];
    blind.inputLock = 0;
    blind.stage = "input";
    const base = blind.roundIndex * 5;
    const current = blind.course[base];
    const next = blind.course[base + 1];
    state.platforms = [current, next];
    state.player.x = current.x;
    state.player.y = current.y;
    state.phase = "idle";
    state.landCompress = 0;
    state.showNextPlatform = false;
    state.cameraFocusX = current.x;
    state.cameraFocusY = current.y;
    next.appear = 1;
    next.dustDone = true;
    updateBlindUI();
    updateBlindVisibility();
    audio.click();
    haptic(5);
  }

  function startGambleRun() {
    resetRunState();
    resetWorld(false);
    buildBlindCourse(save.gambleSteps);
    state.mode = "gamble";
    app.dataset.mode = "gamble";
    setWeather("clear", { silent: true, skipSeen: true });
    el.skillStatus.classList.remove("is-visible");
    el.tutorial.classList.add("is-hidden");
    updateBlindVisibility();
    updateBlindUI();
    updateHud();
    state.raceBannerTimer = 0;
  }

  /* ------------------------------------------------------------------ */
  /* Weather                                                             */
  /* ------------------------------------------------------------------ */

  const WEATHER_TITLES = {
    clear: "天放晴了",
    wind: "起风了",
    rain: "下雨了",
    lightning: "雷暴压顶",
    snow: "落雪了",
  };

  function updateWeatherUI() {
    const definition = WEATHERS[state.weatherType] || WEATHERS.clear;
    app.dataset.weather = state.weatherType;
    el.weatherIcon.textContent = definition.icon;
    el.weatherLabel.textContent = definition.name + (state.weatherType === 'wind' ? (state.windDir > 0 ? ' →' : ' ←') : '');
    el.weatherChip.setAttribute("aria-label", `当前天气 ${definition.name}，${definition.desc}`);
  }

  function showWeatherNotice(type) {
    const definition = WEATHERS[type] || WEATHERS.clear;
    el.weatherNoticeIcon.textContent = definition.icon;
    el.weatherNoticeTitle.textContent = WEATHER_TITLES[type] || definition.name;
    el.weatherNoticeDesc.textContent = definition.desc;
    el.weatherNotice.classList.add("is-visible");
    window.clearTimeout(weatherNoticeTimer);
    weatherNoticeTimer = window.setTimeout(() => {
      el.weatherNotice.classList.remove("is-visible");
    }, 3300);
  }

  function setWeather(type, options = {}) {
    if (!WEATHERS[type]) type = "clear";
    if (!save.weather && type !== "clear") type = "clear";
    state.weatherType = type;
    const difficulty = difficultyAt(state.step);
    state.weatherIntensity = clamp(0.3 + difficulty * 0.7, 0.3, 1);
    /* 60% 概率延续原风向，40% 掉头 —— 风向本身会坑人 */
    state.windDir = Math.random() < 0.6 ? state.windDir : -state.windDir;
    if (type !== "wind") state.windDir = Math.random() > 0.5 ? 1 : -1;
    state.lightningTimer = rand(4.5, 8.5);
    state.weatherSeenRun[type] = true;
    if (!options.skipSeen) {
      save.stats.weatherSeen[type] = true;
      persist();
      checkAchievements();
    }
    updateWeatherUI();
    if (!options.silent && state.screen === "playing") {
      showWeatherNotice(type);
      audio.weather();
      haptic([5, 20, 5]);
    }
  }

  function chooseNextWeather() {
    const difficulty = difficultyAt(state.step);
    const step = state.step;
    /* 恶劣天气分段解锁：前 6 跳只有晴/风，雨 6 步后入池，雪 14 步后，雷 22 步后 */
    const unlocked = {
      clear: true,
      wind: true,
      rain: step >= 6,
      snow: step >= 14,
      lightning: step >= 22,
    };
    const pool = [
      { type: "clear", weight: step < 6 ? 1.7 : Math.max(0.35, 0.85 - difficulty * 0.25) },
      { type: "wind", weight: 1.35 },
      { type: "rain", weight: unlocked.rain ? 1.25 + difficulty * 0.25 : 0 },
      { type: "snow", weight: unlocked.snow ? 0.7 + difficulty * 0.55 : 0 },
      { type: "lightning", weight: unlocked.lightning ? 0.45 + difficulty * 0.75 : 0 },
    ].filter((entry) => entry.type !== state.weatherType && entry.weight > 0);
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let ticket = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      ticket -= pool[i].weight;
      if (ticket <= 0) return pool[i].type;
    }
    return pool[0].type;
  }

  function maybeChangeWeather() {
    if (state.mode === "gamble" || !save.weather) return;
    state.weatherJumpsLeft -= 1;
    if (state.weatherJumpsLeft > 0) return;
    const next = chooseNextWeather();
    state.weatherJumpsLeft = Math.max(4, 8 - Math.floor(state.step / 16)) + Math.floor(rand(0, 2));
    setWeather(next);
  }

  function triggerLightning() {
    if (state.mode === "gamble" || state.weatherType !== "lightning" || !save.weather) return;
    state.flash = 1;
    state.bolt = 1;
    state.shake = Math.max(state.shake, 8);
    audio.thunder();
    window.setTimeout(() => audio.meow("startled"), 120);
    haptic([18, 40, 28]);
    state.lightningTimer = rand(5.5, 10) / Math.max(0.7, state.weatherIntensity);
    const next = nextPlatform();
    if (!next || next.appear < 0.76 || state.phase === "jumping" || state.phase === "falling" || state.phase === "landing") {
      return;
    }
    if (state.phase === "charging") cancelCharge();
    const required = distance(state.player.x, state.player.y, next.x, next.y);
    const requiredPower = requiredPowerFor(required);
    const power = clamp(requiredPower + rand(-0.14, 0.1), 0.12, 1);
    save.stats.lightningJumps += 1;
    persist();
    checkAchievements();
    showToast("雷声一响，猫先跳了。", 1900);
    beginJump(power, { auto: true, lightning: true });
  }

  /* ------------------------------------------------------------------ */
  /* Camera                                                              */
  /* ------------------------------------------------------------------ */

  function updateCamera(dt, snap = false) {
    let targetX;
    let targetY;
    if (state.screen === "home") {
      const anchor = view.shortLandscape ? 0.265 : 0.47;
      targetX = state.cameraFocusX - view.vw * anchor;
      targetY = state.cameraFocusY - view.homePlatformY;
    } else {
      const anchor = view.vw > 620 ? 0.25 : 0.23;
      targetX = state.cameraFocusX - view.vw * anchor;
      const anchorY = view.designH * (view.shortLandscape ? 0.67 : 0.64);
      targetY = state.cameraFocusY - anchorY;
    }
    if (snap) {
      state.cameraX = targetX;
      state.cameraY = targetY;
      return;
    }
    const smoothing = 1 - Math.exp(-dt * 4.6);
    state.cameraX = lerp(state.cameraX, targetX, smoothing);
    state.cameraY = lerp(state.cameraY, targetY, smoothing);
  }

  /* ------------------------------------------------------------------ */
  /* Start and end                                                       */
  /* ------------------------------------------------------------------ */

  function startRun(options = {}) {
    audio.init();
    audio.click();
    closeModal(el.gameoverOverlay);
    closeModal(el.pauseOverlay);
    closeModal(el.settingsOverlay);
    closeModal(el.achievementsOverlay);
    state.paused = false;
    state.mode = save.mode;
    app.dataset.mode = state.mode;
    if (save.selected === "random") {
      if (options.rerollRandom) {
        state.randomPreviewId = randomCatId(state.randomPreviewId);
      }
      if (!state.randomPreviewId) state.randomPreviewId = randomCatId();
      state.runCatId = state.randomPreviewId;
    } else {
      state.runCatId = save.selected;
    }
    resetRunState();
    setScreen("playing");
    resetWorld(false);
    if (state.mode === "gamble") {
      startGambleRun();
      if (save.selected === "random") showToast(`本局随机到 ${activeRunCat().name}。`);
      return;
    }
    state.weatherJumpsLeft = 5;
    setWeather("clear", { silent: true });
    updateWeatherUI();
    state.platforms[1].appear = 1;
    updateSkillStatus();
    updateBlindVisibility();
    el.blindPanel.classList.remove("is-visible");
    el.tutorial.classList.remove("is-hidden");
    el.comboBadge.classList.remove("is-visible");
    el.perfectFlash.classList.remove("is-show");
    el.raceBanner.classList.toggle("is-visible", state.mode === "race");
    state.raceBannerTimer = state.mode === "race" ? 3.2 : 0;
    updateHud();
    updateRaceHud();
    updateCamera(0, true);
    if (save.selected === "random") showToast(`本局随机到 ${activeRunCat().name}。`);
  }

  function endRun(reason = "fall") {
    if (state.screen !== "playing") return;
    state.resultReason = reason;
    state.phase = "idle";
    state.paused = false;
    audio.stopCharge();
    setScreen("gameover");
    el.blindPanel.classList.remove("is-visible");
    el.raceBanner.classList.remove("is-visible");
    el.tutorial.classList.add("is-hidden");
    el.comboBadge.classList.remove("is-visible");
    el.skillStatus.classList.remove("is-visible");
    state.raceExpired = true;

    const mode = state.mode;
    const stats = save.stats;
    stats.totalRuns += 1;
    stats.modes[mode] = (stats.modes[mode] || 0) + 1;
    if (mode === "classic") {
      save.best = Math.max(save.best, state.score);
      stats.maxScore = Math.max(stats.maxScore, state.score);
      if (!save.skills) stats.noSkillBest = Math.max(stats.noSkillBest, state.score);
    } else if (mode === "race") {
      save.bestRace = Math.max(save.bestRace, state.score);
      save.bestRaceByDuration[save.raceDuration] = Math.max(
        Number(save.bestRaceByDuration[save.raceDuration]) || 0,
        state.score
      );
      stats.raceBest = Math.max(stats.raceBest, state.score);
      stats.raceRuns += 1;
    } else if (mode === "gamble") {
      save.bestGamble = Math.max(save.bestGamble, state.score);
      save.bestGambleBySteps[save.gambleSteps] = Math.max(
        Number(save.bestGambleBySteps[save.gambleSteps]) || 0,
        state.score
      );
      stats.gambleBest = Math.max(stats.gambleBest, state.score);
      stats.gambleRuns += 1;
      if (state.perfects === (state.blind.totalSteps || save.gambleSteps)) stats.gamblePerfectRuns += 1;
    }
    if (save.selected === "random") stats.randomRuns += 1;
    const unlockedNow = !save.unlocked && state.perfects >= 10 && state.maxCombo >= 5;
    if (unlockedNow) {
      save.unlocked = true;
      state.newUnlock = true;
      audio.unlock();
    } else {
      state.newUnlock = false;
    }
    persist();
    checkAchievements();
    renderResult();
    updateHud();
    updateSkillStatus();
    window.setTimeout(() => {
      if (state.screen === "gameover") openModal(el.gameoverOverlay);
    }, 280);
  }

  function prepareResultText(mode) {
    let title = "猫步渐稳";
    let quote = "差一点就摸到云了。";
    if (mode === "classic") {
      if (state.score >= 3 && state.score < 10) {
        title = "猫步热身中";
        quote = "方向对了，力度再稳一点。";
      } else if (state.score >= 10 && state.score < 24) {
        title = "屋檐小飞侠";
        quote = "这几步，落得很像回事。";
      } else if (state.score >= 24 && state.score < 50) {
        title = "云上猫步";
        quote = "软垫、猫爪和风都在帮你。";
      } else if (state.score >= 50) {
        title = "天台猫王";
        quote = "整片云海都是你的猫抓板。";
      } else {
        title = "刚出门就回家了";
        quote = "猫爪还没热，下一局肯定行。";
      }
    } else if (mode === "race") {
      title = state.resultReason === "time" ? "赛道到点" : "赛道提前收工";
      quote = state.score >= 100 ? "这条赛道，猫比秒表快。" : "下一轮把失误的 5 秒抢回来。";
    } else {
      const total = state.blind.totalSteps || save.gambleSteps;
      const allPerfect = state.perfects === total;
      title = allPerfect ? "全步命中" : state.perfects >= Math.max(3, Math.ceil(total * 0.6)) ? "猫爪有准头" : "盲盒开得有点野";
      quote = allPerfect ? `${total} 步全中，猫猫都愣住了。` : "再来几轮，运气和手感总有一个先到。";
    }
    return { title, quote };
  }

  function renderResult() {
    const result = prepareResultText(state.mode);
    el.resultKicker.textContent = state.mode === "classic" ? "ROUND OVER" : state.mode === "race" ? "TIME ATTACK" : "BLIND BET RESULT";
    el.resultTitle.textContent = result.title;
    el.resultQuote.textContent = result.quote;
    el.finalScore.textContent = String(state.score);

    if (state.mode === "classic") {
      el.finalPrimaryLabel.textContent = "Perfect";
      el.finalSecondaryLabel.textContent = "最高连击";
      el.finalTertiaryLabel.textContent = "跳了";
      el.finalPrimary.textContent = String(state.perfects);
      el.finalSecondary.textContent = String(state.maxCombo);
      el.finalTertiary.textContent = String(state.jumps);
    } else if (state.mode === "race") {
      el.finalPrimaryLabel.textContent = "Perfect";
      el.finalSecondaryLabel.textContent = "最高连击";
      el.finalTertiaryLabel.textContent = "失误";
      el.finalPrimary.textContent = String(state.perfects);
      el.finalSecondary.textContent = String(state.maxCombo);
      el.finalTertiary.textContent = String(state.mistakes);
    } else {
      el.finalPrimaryLabel.textContent = "Perfect";
      el.finalSecondaryLabel.textContent = "普通";
      el.finalTertiaryLabel.textContent = "落空";
      el.finalPrimary.textContent = String(state.perfects);
      el.finalSecondary.textContent = String(Math.max(0, state.hits - state.perfects));
      el.finalTertiary.textContent = String(state.misses);
    }

    el.resultModeNote.innerHTML = "";
    if (state.mode === "race") {
      const timeChip = document.createElement("span");
      timeChip.textContent = state.resultReason === "time" ? `${state.raceTotal} 秒到点` : "提前结束";
      el.resultModeNote.appendChild(timeChip);
    }
    if (state.mode !== "gamble") {
      const catChip = document.createElement("span");
      catChip.textContent = activeRunCat().name;
      el.resultModeNote.appendChild(catChip);
      const weatherNames = Object.keys(state.weatherSeenRun).map((type) => (WEATHERS[type] || {}).name).filter(Boolean);
      if (weatherNames.length) {
        const weatherChip = document.createElement("span");
        weatherChip.textContent = weatherNames.join(" · ");
        el.resultModeNote.appendChild(weatherChip);
      }
    } else {
      const total = state.blind.totalSteps || save.gambleSteps;
      const rounds = state.blind.rounds || Math.ceil(total / 5);
      const chips = [
        `${total} 步 · ${rounds} 轮`,
        `完美 ${state.perfects}`,
        `普通 ${Math.max(0, state.hits - state.perfects)}`,
        `落空 ${state.misses}`,
      ];
      chips.forEach((text) => {
        const chip = document.createElement("span");
        chip.textContent = text;
        el.resultModeNote.appendChild(chip);
      });
      if (state.perfects === total) {
        const bonus = document.createElement("span");
        bonus.className = "is-gold";
        bonus.textContent = "全步 +10";
        el.resultModeNote.appendChild(bonus);
      }
    }
    const best = getBest(state.mode);
    const configPrefix = state.mode === "race"
      ? `${formatTime(save.raceDuration)} · `
      : state.mode === "gamble"
        ? `${save.gambleSteps} 步 · `
        : "";
    el.resultBestLine.textContent = save.selected === "random"
      ? `${activeRunCat().name} · ${configPrefix}本机最好 ${best} 分`
      : `${configPrefix}本机最好 ${best} 分`;
    el.unlockNote.hidden = !state.newUnlock;
    if (state.newUnlock) {
      el.unlockNote.animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 350, delay: 280, fill: "both" }
      );
    }
  }

  function goHome() {
    audio.stopCharge();
    state.paused = false;
    closeModal(el.gameoverOverlay);
    closeModal(el.pauseOverlay);
    closeModal(el.settingsOverlay);
    closeModal(el.achievementsOverlay);
    state.mode = save.mode;
    setScreen("home");
    setWeather("clear", { silent: true, skipSeen: true });
    if (save.selected === "random") {
      state.randomPreviewId = randomCatId(state.randomPreviewId);
      renderSelectedCard();
    }
    resetRunState();
    resetWorld(true);
    updateHud();
    el.comboBadge.classList.remove("is-visible");
    el.tutorial.classList.add("is-hidden");
    el.blindPanel.classList.remove("is-visible");
    el.raceBanner.classList.remove("is-visible");
    updateSkillStatus();
    renderCatStrip();
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */

  function setScreen(screen) {
    state.screen = screen;
    app.dataset.screen = screen;
    el.homeScreen.classList.toggle("is-active", screen === "home");
    el.gameScreen.classList.toggle("is-active", screen === "playing" || screen === "gameover");
    state.raceExpired = screen === "gameover";
    if (screen === "home") {
      updateHomeMetrics();
      updateCamera(0, true);
    }
    updateBlindVisibility();
  }

  function updateHud() {
    el.scoreValue.textContent = String(state.score);
    el.bestValue.textContent = String(getBest());
    el.bestLabel.textContent = (MODES[state.mode] || MODES.classic).bestLabel;
    updateRaceHud();
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function updateRaceHud() {
    const formatted = formatTime(state.raceTime);
    el.raceTime.textContent = formatted;
    el.raceBannerTime.textContent = formatted;
    el.raceClock.classList.toggle("is-low", state.raceTime <= 15 && state.screen === "playing");
    state.lastRaceDisplay = formatted;
  }

  function updateSkillStatus() {
    const cat = activeRunCat();
    const hasOneShot = cat.skillType === "rescue" || cat.skillType === "tail";
    const show = state.screen === "playing" && save.skills && state.mode !== "gamble";
    el.skillStatus.classList.toggle("is-visible", show);
    el.skillStatus.classList.toggle("is-spent", hasOneShot && state.skillUsed);
    if (!show) return;
    const prefix = save.selected === "random" ? `${cat.name} · ` : "";
    if (hasOneShot && state.skillUsed) {
      el.skillStatusText.textContent = prefix + (cat.skillType === "rescue" ? "九命护符 · 已用" : "尾巴回旋 · 已用");
    } else {
      el.skillStatusText.textContent = prefix + cat.statusText;
    }
  }

  function showCombo() {
    el.comboText.textContent = `完美 ×${state.combo}`;
    el.comboBadge.classList.add("is-visible");
    el.comboBadge.classList.remove("is-pop");
    void el.comboBadge.offsetWidth;
    el.comboBadge.classList.add("is-pop");
  }

  function showPerfectFlash() {
    el.perfectFlash.classList.remove("is-show");
    void el.perfectFlash.offsetWidth;
    el.perfectFlash.classList.add("is-show");
  }

  function hideAchievementToast() {
    el.achievementToast.classList.remove("is-visible");
    state.achQueue = [];
    state.achShowing = false;
  }

  function openModal(overlay) {
    if (overlay !== el.achievementToast) hideAchievementToast();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function openAchievements() {
    renderAchievements();
    openModal(el.achievementsOverlay);
  }

  function closeAchievements() {
    closeModal(el.achievementsOverlay);
  }

  function syncSettings() {
    el.skillsToggle.checked = !!save.skills;
    el.weatherToggle.checked = !!save.weather;
    el.soundToggle.checked = !!save.sound;
    el.musicToggle.checked = !!save.music;
    el.hapticsToggle.checked = !!save.haptics;
    el.motionToggle.checked = !!save.motion;
    app.classList.toggle("is-muted", !save.sound);
    app.classList.toggle("skills-off", !save.skills);
    el.miniSkillText.textContent = save.skills ? "技能开" : "技能关";
    el.miniSkillBtn.setAttribute("aria-pressed", save.skills ? "true" : "false");
    el.soundBtn.setAttribute("aria-label", save.sound ? "关闭音效" : "开启音效");
    audio.setMuted(!save.sound);
    audio.setMusicEnabled(!!save.music);
    updateQuickWeather();
    updateSkillStatus();
    renderSelectedCard();
  }

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */

  function spawnDust(x, y, count, strength = 1) {
    const amount = reduceEffects() ? Math.ceil(count / 2) : count;
    for (let i = 0; i < amount; i += 1) {
      state.effects.push({
        x: x + rand(-16, 16),
        y: y + rand(-1, 5),
        vx: rand(-38, 38) * strength,
        vy: rand(-34, -8) * strength,
        gravity: 110,
        life: rand(0.3, 0.6),
        maxLife: 0.6,
        size: rand(2.2, 5.4),
        color: i % 3 === 0 ? "#fff8ec" : "#e7ccb7",
        shape: "dot",
        rotation: 0,
        spin: 0,
      });
    }
  }

  function spawnBurst(x, y, count, colors, shape = "dot") {
    const amount = reduceEffects() ? Math.ceil(count / 2) : count;
    for (let i = 0; i < amount; i += 1) {
      const angle = rand(-Math.PI, Math.PI);
      const speed = rand(32, 128);
      state.effects.push({
        x: x + rand(-6, 6),
        y: y + rand(-9, 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(10, 44),
        gravity: 150,
        life: rand(0.38, 0.86),
        maxLife: 0.86,
        size: rand(2, shape === "spark" ? 5.5 : 4.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        rotation: rand(0, Math.PI),
        spin: rand(-4, 4),
      });
    }
  }

  function addRing(x, y, color, maxRadius, life, width) {
    state.rings.push({ x, y, color, radius: 8, maxRadius, life, maxLife: life, width });
  }

  function addFloater(text, x, y, color) {
    state.floats.push({ text, x, y, color, life: 1.1, maxLife: 1.1 });
  }

  function spawnChargeSpark(power) {
    if (reduceEffects()) return;
    const side = Math.random() > 0.5 ? 1 : -1;
    state.effects.push({
      x: state.player.x + side * rand(16, 32),
      y: state.player.y - rand(10, 54),
      vx: side * rand(3, 14),
      vy: rand(-34, -15) - power * 14,
      gravity: -8,
      life: rand(0.26, 0.48),
      maxLife: 0.48,
      size: rand(1.3, 2.9) + power,
      color: Math.random() > 0.55 ? "#ffd780" : "#ff9a84",
      shape: "spark",
      rotation: rand(0, Math.PI),
      spin: rand(-2, 2),
    });
  }

  function updateEffects(dt) {
    state.effects.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.life -= dt;
      particle.rotation += particle.spin * dt;
    });
    state.effects = state.effects.filter((particle) => particle.life > 0);

    state.floats.forEach((floater) => {
      floater.y -= 31 * dt;
      floater.life -= dt;
    });
    state.floats = state.floats.filter((floater) => floater.life > 0);

    state.rings.forEach((ring) => {
      ring.life -= dt;
      const progress = 1 - ring.life / ring.maxLife;
      ring.radius = 8 + (ring.maxRadius - 8) * easeOutCubic(progress);
    });
    state.rings = state.rings.filter((ring) => ring.life > 0);
    state.shake = Math.max(0, state.shake - dt * 22);
    state.flash = Math.max(0, state.flash - dt * 3.4);
    state.bolt = Math.max(0, state.bolt - dt * 3.2);
  }

  /* ------------------------------------------------------------------ */
  /* Input and jump                                                      */
  /* ------------------------------------------------------------------ */

  function canCharge() {
    if (state.screen !== "playing" || state.paused || state.phase !== "idle" || state.raceExpired) return false;
    if (state.mode === "gamble") {
      return state.blind.stage === "input" && state.blind.powers.length < 5 && state.blind.inputLock <= 0;
    }
    const next = nextPlatform();
    return !!next && next.appear >= 0.76;
  }

  function startCharge() {
    if (!canCharge()) return;
    audio.init();
    state.phase = "charging";
    state.chargeElapsed = 0;
    state.chargeEmit = 0;
    state.player.power = 0;
    state.tutorialDone = true;
    el.tutorial.classList.add("is-hidden");
    audio.startCharge();
    haptic(5);
  }

  function cancelCharge() {
    if (state.phase !== "charging") return;
    state.phase = "idle";
    state.chargeElapsed = 0;
    state.chargeEmit = 0;
    state.player.power = 0;
    audio.stopCharge();
  }

  function releaseCharge() {
    if (state.phase !== "charging" || state.screen !== "playing" || state.paused) return;
    const power = clamp(state.player.power, 0.025, 1);
    state.phase = "idle";
    if (state.mode === "gamble") {
      recordBlindPress(power);
      state.player.power = 0;
      audio.stopCharge();
      return;
    }
    beginJump(power);
  }

  function updateCharge(dt) {
    state.chargeElapsed += dt * 1000;
    const duration = chargeDuration();
    const power = clamp(state.chargeElapsed / duration, 0, 1);
    state.player.power = power;
    audio.updateCharge(power);
    if (power >= 1 && state.chargeElapsed - dt * 1000 < duration) {
      haptic([8, 30, 8]);
    }
    state.chargeEmit += dt;
    if (power > 0.14 && state.chargeEmit >= (reduceEffects() ? 0.26 : 0.12)) {
      state.chargeEmit = 0;
      spawnChargeSpark(power);
    }
  }

  function beginJump(power, options = {}) {
    const target = options.blind ? blindTargetPlatform() : nextPlatform();
    if (!target) return;
    const startX = state.player.x;
    const startY = state.player.y;
    const dx = target.x - startX;
    const dy = target.y - startY;
    const required = Math.max(1, Math.hypot(dx, dy));
    const directionX = dx / required;
    const directionY = dy / required;
    const range = jumpRange();
    const travel = range.min + (range.max - range.min) * Math.pow(power, 1.08);

    let windDrift = 0;
    let windLean = 0;
    let slip = 0;
    if (!options.blind && save.weather && state.mode !== "gamble") {
      if (state.weatherType === "wind") {
        windDrift = state.windDir * (24 + state.weatherIntensity * 66) * rand(0.85, 1.25);
        windLean = state.windDir * (0.85 + state.weatherIntensity * 0.95);
      } else if (state.weatherType === "rain") {
        slip = (28 + state.weatherIntensity * 44) * rand(0.85, 1.2);
      } else if (state.weatherType === "snow") {
        slip = (46 + state.weatherIntensity * 68) * rand(0.85, 1.25);
      }
    }

    const baseX = startX + directionX * travel + windDrift;
    const baseY = startY + directionY * travel;
    const finalX = baseX + directionX * slip;
    const finalY = baseY + directionY * slip;
    state.jump = {
      startX, startY, finalX, finalY,
      targetX: target.x, targetY: target.y,
      directionX, directionY, required, travel, windDrift, windLean, slip, power,
      t: 0,
      elapsed: 0,
      duration: 0.43 + power * 0.27 + required / 1400,
      height: (96 + power * 86) * playerPhysics().airHeight,
      blind: !!options.blind,
      auto: !!options.auto,
      lightning: !!options.lightning,
    };
    state.phase = "jumping";
    state.tutorialDone = true;
    el.tutorial.classList.add("is-hidden");
    audio.jump(power);
    audio.stopCharge();
    haptic(10);
    spawnDust(startX, startY, 6, 0.7);
    addRing(startX, startY, "rgba(255,255,255,.42)", 32, 0.3, 1.8);
  }

  function updateJump(dt) {
    const jump = state.jump;
    if (!jump) return;
    jump.elapsed += dt;
    jump.t = clamp(jump.elapsed / jump.duration, 0, 1);
    const t = jump.t;
    state.player.x = lerp(jump.startX, jump.finalX, t);
    state.player.y = lerp(jump.startY, jump.finalY, t) - Math.sin(Math.PI * t) * jump.height;
    const horizontalLean = (jump.directionX || 0) * 0.34 * Math.sin(Math.PI * t);
    const verticalLean = (jump.directionY || 0) * 0.1;
    const windLean = (jump.windLean || 0) * Math.sin(Math.PI * t) * 0.18;
    state.player.pitch = clamp(
      horizontalLean + verticalLean - Math.cos(Math.PI * t) * 0.07 + windLean,
      -0.64,
      0.64
    );
    if (t >= 1) {
      state.player.x = jump.finalX;
      state.player.y = jump.finalY;
      state.player.pitch = 0;
      if (jump.blind) resolveBlindLanding();
      else evaluateLanding();
    }
  }

  function useRescue(cat, type) {
    const current = currentPlatform();
    state.skillUsed = true;
    state.phase = "landing";
    state.landingTimer = 0.35;
    state.landCompress = 0.4;
    state.player.x = current.x;
    state.player.y = current.y;
    state.player.pitch = 0;
    state.combo = 0;
    el.comboBadge.classList.remove("is-visible");
    state.cameraFocusX = current.x;
    state.cameraFocusY = current.y;
    addRing(current.x, current.y, type === "tail" ? "rgba(207,126,77,.72)" : "rgba(242,196,92,.72)", 58, 0.68, 3);
    spawnBurst(current.x, current.y - 18, 18, type === "tail" ? ["#cf7e4d", "#4a3531", "#fff4e7"] : ["#f2c45c", "#fff2b2", "#d8b55b"], "spark");
    addFloater(type === "tail" ? "尾巴回旋" : "九命护符", current.x, current.y - 112, type === "tail" ? "#b9653e" : "#9b7427");
    save.stats.rescues += 1;
    persist();
    checkAchievements();
    updateSkillStatus();
    updateHud();
    showToast(type === "tail" ? "小熊猫的大尾巴一兜，把猫卷回来了。" : "黑猫叼住后颈，把猫放回了上一块平台。");
    audio.rescue();
    haptic([14, 40, 14]);
  }

  function evaluateLanding() {
    const target = nextPlatform();
    if (!target) return;
    let error = platformLandingError(target);
    const cat = activeRunCat();
    let radius = target.landRadius;
    let perfectRadius = PERFECT_RADIUS;
    if (save.skills && cat.skillType === "grip") radius += 6;
    if (save.skills && cat.skillType === "perfect") perfectRadius += 5;

    if (error > radius) {
      if (save.skills && cat.skillType === "rescue" && !state.skillUsed) {
        useRescue(cat, "rescue");
        return;
      }
      if (save.skills && cat.skillType === "tail" && !state.skillUsed && error <= radius + 25) {
        state.skillUsed = true;
        const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
        state.player.x = target.x - Math.cos(angle) * Math.max(0, radius - 8);
        state.player.y = target.y - Math.sin(angle) * Math.max(0, radius - 8);
        state.combo = 0;
        save.stats.rescues += 1;
        addRing(target.x, target.y, "rgba(207,126,77,.7)", 56, 0.65, 3);
        addFloater("尾巴回旋", target.x, target.y - 112, "#b9653e");
        showToast("小熊猫一甩尾巴，把这只擦边猫卷了回来。");
        audio.rescue();
        haptic([12, 28, 12]);
        updateSkillStatus();
        checkAchievements();
        error = platformLandingError(target);
      } else {
        startFall();
        return;
      }
    }

    const perfect = error <= perfectRadius;
    const slip = state.jump ? state.jump.slip : 0;
    const catSkill = save.skills ? cat.skillType : null;
    let points = 1;
    if (perfect) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.perfects += 1;
      points = 2 + Math.min(state.combo, 6);
      if (catSkill === "bonus") points += 1;
      showCombo();
      showPerfectFlash();
      audio.land(true, state.combo);
      haptic([7, 20, 12]);
      spawnBurst(target.x, target.y - 7, 24, ["#ffd780", "#ff8b78", "#fff4e1", "#9bd9c0"], "spark");
      addRing(target.x, target.y, "rgba(255,180,137,.7)", 62, 0.6, 2.5);
      addFloater(`+${points}`, target.x, target.y - 102, "#cb6f5f");
      state.shake = Math.max(state.shake, 5);
    } else {
      state.combo = 0;
      el.comboBadge.classList.remove("is-visible");
      audio.land(false, 0);
      haptic(7);
      spawnDust(state.player.x, target.y, 9, 1);
      addFloater("+1", state.player.x, target.y - 100, "#8b7772");
      if (slip > 0) addFloater("打滑", state.player.x, target.y - 118, "#6f8e9a");
      state.shake = Math.max(state.shake, 2.5);
    }
    state.score += points;
    state.jumps += 1;
    state.hits += 1;

    save.stats.totalJumps += 1;
    save.stats.totalPerfects += perfect ? 1 : 0;
    save.stats.maxCombo = Math.max(save.stats.maxCombo, state.maxCombo);
    if (state.mode === "classic") {
      save.stats.maxScore = Math.max(save.stats.maxScore, state.score);
      if (!save.skills) save.stats.noSkillBest = Math.max(save.stats.noSkillBest, state.score);
    }
    if (slip > 0) {
      save.stats.slipLands += 1;
      audio.slip();
    }
    persist();

    const landed = target;
    landed.bounce = 1;
    state.platforms = [landed, generateNextPlatform(landed, state.step + 2)];
    state.currentIndex = 0;
    state.step += 1;
    state.player.x = target.x;
    state.player.y = target.y;
    state.phase = "landing";
    state.landingTimer = 0.2;
    state.landCompress = 1;
    state.cameraFocusX = state.player.x;
    state.cameraFocusY = state.player.y;
    maybeChangeWeather();
    updateHud();
    updateSkillStatus();
    checkAchievements();

    if (el.scoreValue.animate && !reduceEffects()) {
      el.scoreValue.animate(
        [{ transform: "scale(1.2)", color: "#e66f61" }, { transform: "scale(1)", color: "#49363d" }],
        { duration: 250, easing: "cubic-bezier(.2,1.4,.4,1)" }
      );
    }
  }

  function startFall() {
    state.phase = "falling";
    const fallPhys = playerPhysics();
    state.fall = {
      elapsed: 0,
      vy: 30,
      spin: rand(-1.7, 1.7) * (0.6 + (2 - fallPhys.weight) * 0.4),
      drift: rand(-24, 34) / Math.max(0.6, fallPhys.weight),
      handled: false,
      race: state.mode === "race",
    };
    state.combo = 0;
    el.comboBadge.classList.remove("is-visible");
    audio.fail();
    audio.stopCharge();
    haptic([22, 55, 30]);
    addFloater("差一点", state.player.x, state.player.y - 52, "#9c7774");
    state.shake = Math.max(state.shake, 8);
    updateSkillStatus();
  }

  function updateFall(dt) {
    if (!state.fall) return;
    state.fall.elapsed += dt;
    state.fall.vy += 1700 * (0.75 + playerPhysics().weight * 0.5) * dt;
    state.player.y += state.fall.vy * dt;
    state.player.x += state.fall.drift * dt;
    state.player.pitch += state.fall.spin * dt;
    if (state.fall.race) {
      if (state.fall.elapsed > 0.72 && !state.fall.handled) {
        state.fall.handled = true;
        if (state.raceTime <= 5) {
          state.raceTime = 0;
          endRun("time");
        } else {
          state.raceTime = Math.max(0, state.raceTime - 5);
          state.mistakes += 1;
          updateRaceHud();
          const current = currentPlatform();
          state.player.x = current.x;
          state.player.y = current.y;
          state.player.pitch = 0;
          state.phase = "landing";
          state.landingTimer = 0.34;
          state.landCompress = 0.6;
          state.cameraFocusX = current.x;
          state.cameraFocusY = current.y;
          addRing(current.x, current.y, "rgba(255,255,255,.45)", 42, 0.45, 2);
          showToast("失误 −5 秒，猫重新站稳了。");
          audio.rescue();
        }
      }
      return;
    }
    if (state.fall.elapsed > 0.92 && !state.fall.handled) {
      state.fall.handled = true;
      endRun("fall");
    }
  }

  function updateBlindState(dt) {
    if (state.mode !== "gamble" || state.screen !== "playing") return;
    const blind = state.blind;
    if (blind.inputLock > 0) blind.inputLock = Math.max(0, blind.inputLock - dt);
    if (blind.stage === "wait") {
      blind.waitTimer -= dt;
      if (blind.waitTimer <= 0) startBlindSequence();
    } else if (blind.stage === "reveal") {
      blind.revealTimer -= dt;
      if (blind.revealTimer <= 0 && state.phase === "idle") beginBlindJump();
    } else if (blind.stage === "result") {
      blind.resultTimer -= dt;
      if (blind.resultTimer <= 0) advanceBlind();
    }
  }

  function update(dt) {
    state.time += dt;
    state.ambient += dt;
    updateCamera(dt);
    updateEffects(dt);

    state.platforms.forEach((platform) => {
      if (platform.appear < 1) {
        platform.appear = clamp(platform.appear + dt / 0.46, 0, 1);
        if (platform.appear >= 1 && !platform.dustDone) {
          platform.dustDone = true;
          spawnDust(platform.x, platform.y + 4, 12, 1.1);
          platform.bounce = 0.8;
        }
      }
      platform.bounce = Math.max(0, platform.bounce - dt * 4.8);
    });

    if (state.screen !== "playing" || state.paused) {
      if (state.raceBannerTimer > 0 && state.screen === "playing") {
        state.raceBannerTimer -= dt;
        if (state.raceBannerTimer <= 0) el.raceBanner.classList.remove("is-visible");
      }
      return;
    }

    if (state.raceBannerTimer > 0) {
      state.raceBannerTimer -= dt;
      if (state.raceBannerTimer <= 0) el.raceBanner.classList.remove("is-visible");
    }

    if (state.mode === "race") {
      state.raceTime = Math.max(0, state.raceTime - dt);
      const formatted = formatTime(state.raceTime);
      if (formatted !== state.lastRaceDisplay) updateRaceHud();
      el.raceClock.classList.toggle("is-low", state.raceTime <= 15);
      if (state.raceTime <= 0) {
        endRun("time");
        return;
      }
    }

    if (state.weatherType === "lightning" && save.weather && state.mode !== "gamble") {
      state.lightningTimer -= dt;
      if (state.lightningTimer <= 0) triggerLightning();
    }

    if (state.mode === "gamble") updateBlindState(dt);

    if (state.phase === "charging") {
      updateCharge(dt);
    } else if (state.phase === "jumping") {
      updateJump(dt);
    } else if (state.phase === "falling") {
      updateFall(dt);
    } else if (state.phase === "landing") {
      state.landingTimer -= dt;
      state.landCompress = Math.max(0, state.landCompress - dt * 3.6);
      if (state.landingTimer <= 0) state.phase = "idle";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  function resize() {
    const rect = app.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.6);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    view.width = width;
    view.height = height;
    view.dpr = dpr;
    view.shortLandscape = height < 520 && width > height;
    view.designH = view.shortLandscape ? SHORT_H : DESIGN_H;
    view.scale = height / view.designH;
    view.vw = width / view.scale;
    view.vh = view.designH;
    updateHomeMetrics();
    if (state.screen === "home") updateCamera(0, true);
  }

  function weatherGradient() {
    switch (state.weatherType) {
      case "rain":
        return ["#dfe8e6", "#cbd8d8", "#b9c9ca"];
      case "snow":
        return ["#fbf8ee", "#e8f2ef", "#d8e8e7"];
      case "lightning":
        return ["#8d9299", "#777f87", "#686f78"];
      case "wind":
        return ["#fff3d9", "#f4e7cd", "#e6e4cd"];
      default:
        return ["#fff8e9", "#ffecd9", "#f4dfca"];
    }
  }

  function drawBackdrop() {
    const colors = weatherGradient();
    const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.55, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, view.width, view.height);

    const light = ctx.createRadialGradient(
      view.width * 0.82,
      view.height * 0.12,
      2,
      view.width * 0.82,
      view.height * 0.12,
      Math.max(view.width, view.height) * 0.34
    );
    const sunAlpha = state.weatherType === "lightning" ? 0.12 : state.weatherType === "rain" ? 0.2 : 0.45;
    light.addColorStop(0, `rgba(255,244,200,${sunAlpha})`);
    light.addColorStop(1, "rgba(255,234,200,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, view.width, view.height);

    const bloom = ctx.createRadialGradient(
      view.width * 0.12,
      view.height * 0.33,
      6,
      view.width * 0.12,
      view.height * 0.33,
      view.width * 0.42
    );
    bloom.addColorStop(0, state.weatherType === "snow" ? "rgba(231,249,247,.5)" : "rgba(209,236,224,.38)");
    bloom.addColorStop(1, "rgba(209,236,224,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, view.width, view.height);
  }

  function drawCloud(context, x, y, size, alpha) {
    context.save();
    context.globalAlpha = alpha;
    fillEllipse(context, x, y, size, size * 0.46, "rgba(255,251,242,.75)");
    fillEllipse(context, x - size * 0.42, y + size * 0.08, size * 0.36, size * 0.31, "rgba(255,251,242,.75)");
    fillEllipse(context, x + size * 0.39, y + size * 0.1, size * 0.34, size * 0.28, "rgba(255,251,242,.75)");
    fillEllipse(context, x - size * 0.08, y - size * 0.18, size * 0.36, size * 0.34, "rgba(255,251,242,.75)");
    context.restore();
  }

  function drawWorldBackdrop(context) {
    const vw = view.vw;
    const vh = view.vh;
    const time = state.ambient;
    const cameraX = state.cameraX;

    drawCloud(
      context,
      ((vw * 0.16 + time * 2.2 - cameraX * 0.025) % (vw + 260) + vw + 260) % (vw + 260) - 130,
      vh * 0.19,
      52,
      state.weatherType === "lightning" ? 0.12 : 0.32
    );
    drawCloud(
      context,
      ((vw * 0.77 + time * 1.45 - cameraX * 0.015) % (vw + 320) + vw + 320) % (vw + 320) - 160,
      vh * 0.29,
      70,
      state.weatherType === "lightning" ? 0.1 : 0.22
    );

    const hillBase = vh * 0.82;
    context.save();
    context.fillStyle = state.weatherType === "snow" ? "rgba(226,240,237,.55)" : "rgba(213,230,211,.4)";
    context.beginPath();
    context.moveTo(-180, vh + 40);
    context.lineTo(-180, hillBase);
    context.bezierCurveTo(-40, hillBase - 60, 130, hillBase - 66, 270, hillBase + 2);
    context.bezierCurveTo(420, hillBase + 74, 630, hillBase - 38, 900, hillBase + 12);
    context.lineTo(900, vh + 40);
    context.closePath();
    context.fill();

    context.fillStyle = state.weatherType === "lightning" ? "rgba(93,100,108,.26)" : "rgba(238,207,183,.42)";
    context.beginPath();
    context.moveTo(-100, vh + 40);
    context.lineTo(-100, hillBase + 96);
    context.bezierCurveTo(60, hillBase + 42, 250, hillBase + 58, 420, hillBase + 112);
    context.bezierCurveTo(620, hillBase + 174, 760, hillBase + 68, 960, hillBase + 96);
    context.lineTo(960, vh + 40);
    context.closePath();
    context.fill();
    context.restore();

    context.save();
    for (let i = 0; i < 13; i += 1) {
      const x = (i * 91 + 31) % (vw + 80) + Math.sin(time * 0.32 + i) * 8 - 20;
      const y = vh * 0.25 + ((i * 131 + 50) % (vh * 0.55)) + Math.sin(time * 0.48 + i * 1.6) * 7;
      const radius = 1.1 + (i % 3) * 0.6;
      context.globalAlpha = 0.1 + (i % 4) * 0.03;
      fillEllipse(context, x, y, radius, radius, i % 3 === 0 ? "#d8907e" : "#fffaf0");
    }
    context.restore();
  }

  function projectShape(platform, u, v) {
    const cos = Math.cos(platform.rotation);
    const sin = Math.sin(platform.rotation);
    return {
      x: platform.x + u * cos - v * sin,
      y: platform.y + (u * sin + v * cos) * 0.52,
    };
  }

  function platformPolygon(platform) {
    const half = platform.width / 2;
    const points = [];
    if (platform.shape === "circle") {
      for (let i = 0; i < 32; i += 1) {
        const angle = (i / 32) * Math.PI * 2;
        points.push(projectShape(platform, Math.cos(angle) * half, Math.sin(angle) * half));
      }
      return points;
    }
    if (platform.shape === "triangle") {
      const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
      angles.forEach((angle) => {
        points.push(projectShape(platform, Math.cos(angle) * half, Math.sin(angle) * half));
      });
      return points;
    }
    if (platform.shape === "hex") {
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        points.push(projectShape(platform, Math.cos(angle) * half, Math.sin(angle) * half));
      }
      return points;
    }
    const depth = half * 0.92;
    return [
      projectShape(platform, -half, -depth),
      projectShape(platform, half, -depth),
      projectShape(platform, half, depth),
      projectShape(platform, -half, depth),
    ];
  }

  function drawPawStamp(context, x, y, color, scale = 1) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale * 0.55);
    fillEllipse(context, 0, 4, 7.5, 6, color);
    [-8, -3, 3, 8].forEach((toeX) => {
      fillEllipse(context, toeX, -5 - Math.abs(toeX) * 0.08, 2.6, 3.5, color, toeX * 0.02);
    });
    context.restore();
  }

  function drawPlatform(context, platform, isNext) {
    const appear = platform.appear == null ? 1 : platform.appear;
    if (appear <= 0.001) return;
    const dropOffset = -(1 - easeOutCubic(appear)) * 230;
    const x = platform.x - state.cameraX;
    const y = platform.y - state.cameraY + dropOffset + platform.bounce * 5;
    const polygon = platformPolygon(platform).map((point) => ({
      x: point.x - state.cameraX,
      y: point.y - state.cameraY + dropOffset + platform.bounce * 5,
    }));
    const palette = platform.palette;
    const extrusion = 22;

    context.save();
    context.globalAlpha = clamp(appear, 0, 1);

    if (isNext && state.screen !== "home") {
      const pulse = 0.52 + Math.sin(state.ambient * 2.1) * 0.08;
      const halo = context.createRadialGradient(x, y, 3, x, y, platform.width * 0.72);
      halo.addColorStop(0, `rgba(255,255,255,${0.2 * pulse})`);
      halo.addColorStop(0.45, hexToRgba(palette.glow, 0.16 * pulse));
      halo.addColorStop(1, hexToRgba(palette.glow, 0));
      context.fillStyle = halo;
      const center = projectShape(platform, 0, 0);
      ellipsePath(context, center.x - state.cameraX, center.y - state.cameraY + dropOffset, platform.width * 0.7, platform.width * 0.36);
      context.fill();
    }

    context.globalAlpha = 0.12 * appear;
    fillEllipse(context, x + 3, y + 40, platform.width * 0.51, 13, "#6c4b46");
    context.globalAlpha = clamp(appear, 0, 1);

    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const midpointY = (a.y + b.y) / 2;
      context.fillStyle = midpointY > y ? palette.dark : palette.side;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(b.x, b.y + extrusion);
      context.lineTo(a.x, a.y + extrusion);
      context.closePath();
      context.fill();
    }

    const top = context.createLinearGradient(x, y - platform.width * 0.3, x, y + platform.width * 0.3);
    top.addColorStop(0, palette.top);
    top.addColorStop(0.62, palette.top);
    top.addColorStop(1, palette.edge);
    context.beginPath();
    polygon.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = top;
    context.fill();
    context.lineJoin = "round";
    context.strokeStyle = "rgba(255,255,255,.38)";
    context.lineWidth = 2;
    context.stroke();

    const innerScale = 0.78;
    context.beginPath();
    polygon.forEach((point, index) => {
      const px = x + (point.x - x) * innerScale;
      const py = y + (point.y - y) * innerScale;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.closePath();
    context.strokeStyle = "rgba(255,255,255,.24)";
    context.lineWidth = 1.2;
    context.stroke();

    drawPawStamp(context, x, y + 4, "rgba(94,63,66,.13)", Math.min(1.2, platform.width / 150));

    if (state.weatherType === "snow") {
      context.fillStyle = "rgba(255,255,255,.26)";
      context.beginPath();
      polygon.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.fill();
      context.strokeStyle = "rgba(255,255,255,.6)";
      context.lineWidth = 2;
      context.stroke();
    } else if (state.weatherType === "rain" || state.weatherType === "lightning") {
      context.strokeStyle = "rgba(255,255,255,.23)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(x - platform.width * 0.34, y - 2);
      context.quadraticCurveTo(x, y - 9, x + platform.width * 0.35, y - 2);
      context.stroke();
    }

    if (
      isNext &&
      state.screen === "playing" &&
      state.phase === "charging" &&
      save.skills &&
      state.mode !== "gamble" &&
      activeRunCat().skillType === "aim"
    ) {
      const alpha = 0.6 + state.player.power * 0.32;
      const pulse = 14 + Math.sin(state.ambient * 4) * 1.6;
      context.save();
      context.strokeStyle = `rgba(202,91,77,${alpha})`;
      context.shadowColor = "rgba(255,248,236,.7)";
      context.shadowBlur = 5;
      context.lineWidth = 1.8;
      context.setLineDash([4, 5]);
      context.beginPath();
      context.ellipse(x, y + 3, pulse, pulse * 0.42, platform.rotation * 0.4, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = `rgba(202,91,77,${alpha})`;
      ellipsePath(context, x, y + 3, 3, 1.3);
      context.fill();
      context.restore();
    }

    context.restore();
  }

  function drawPlayer(context) {
    const cat = playerCat();
    if (!cat) return;
    const sx = state.player.x - state.cameraX;
    const sy = state.player.y - state.cameraY;
    const isJumping = state.phase === "jumping";
    const isFalling = state.phase === "falling";
    const isCharging = state.phase === "charging";
    const airT = isJumping && state.jump ? state.jump.t : isFalling ? 0.52 : null;
    const pitch = isFalling ? state.player.pitch : isJumping && state.jump ? state.player.pitch : 0;
    const charge = isCharging ? state.player.power : 0;
    const airHeight = state.jump ? Math.sin(Math.PI * (state.jump.t || 0)) * (state.jump.height || 0) : 0;

    context.save();
    if (!isFalling) {
      const shadowScale = sizeScale();
      const near = clamp(1 - airHeight / 300, 0.35, 1);
      /* 外层柔光 */
      context.globalAlpha = clamp(0.1 - airHeight / 1400, 0.02, 0.1) * near;
      fillEllipse(context, sx, sy + 5, (34 + Math.min(airHeight, 120) * 0.07) * shadowScale, 10 * shadowScale, "#8d6a63");
      /* 内层实影 */
      context.globalAlpha = clamp(0.16 - airHeight / 900, 0.03, 0.16) * near;
      fillEllipse(context, sx, sy + 4, (24 + Math.min(airHeight, 120) * 0.05) * shadowScale, 6.4 * shadowScale, "#4f3733");
    }
    context.restore();

    if (isCharging) {
      context.save();
      context.globalAlpha = 0.16 + state.player.power * 0.22;
      context.strokeStyle = "#ff8b78";
      context.lineWidth = 1.5;
      context.setLineDash([3, 6]);
      context.beginPath();
      context.ellipse(sx, sy + 4, (34 + state.player.power * 12) * sizeScale(), (9 + state.player.power * 3) * sizeScale(), 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (isJumping && state.jump) {
      const dirX = state.jump.directionX || 0;
      const dirY = state.jump.directionY || 0;
      const nx = -dirX;
      const ny = -dirY;
      const alpha = Math.sin(Math.PI * state.jump.t) * 0.32;
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = "#fffaf0";
      context.lineWidth = 1.8;
      context.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        const offset = 26 + i * 10;
        const spread = (i - 1) * 8;
        const startX = sx + nx * offset - dirY * spread;
        const startY = sy - 28 + ny * offset + dirX * spread;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + nx * (13 + i * 3), startY + ny * (13 + i * 3));
        context.stroke();
      }
      context.restore();
    }

    const windStrength = state.weatherType === "wind" && save.weather && state.mode !== "gamble"
      ? state.windDir * (0.4 + state.weatherIntensity * 0.6)
      : 0;
    RealCat.draw(context, cat, sx, sy, {
      scale: (view.shortLandscape && state.screen !== "home" ? 1.5 : CAT_SCALE) * sizeScale(),
      charge,
      airT,
      pitch,
      land: state.landCompress,
      time: state.ambient,
      wind: isJumping && state.jump ? (state.jump.windLean || windStrength) : windStrength,
      blink: isFalling ? false : null,
      /* 下落用专门的 fall 帧；其余交给 charge/air/land 权重分配 */
      falling: isFalling,
    });

    if (isCharging) drawChargeMeter(context, sx, sy - 100, state.player.power, barLength());
  }

  function drawChargeMeter(context, x, y, power, barScale) {
    const width = 96 * clamp(barScale || 1, 0.7, 1.4);
    const height = 10;
    const left = x - width / 2;
    const top = y + 4;
    const hue = 149 - power * 142;
    const pulse = power > 0.92 ? 1 + Math.sin(state.ambient * 14) * 0.035 : 1;
    context.save();
    context.translate(x, top + height / 2);
    context.scale(pulse, pulse);
    context.translate(-x, -(top + height / 2));
    context.globalAlpha = 0.95;
    context.shadowColor = power > 0.82 ? "rgba(255,139,120,.3)" : "rgba(100,68,62,.16)";
    context.shadowBlur = power > 0.82 ? 15 : 9;
    context.shadowOffsetY = 3;
    roundedRectPath(context, left, top, width, height, height / 2);
    context.fillStyle = "rgba(255,250,241,.94)";
    context.fill();
    context.shadowColor = "transparent";

    context.save();
    roundedRectPath(context, left + 1.5, top + 1.5, width - 3, height - 3, (height - 3) / 2);
    context.clip();
    const fill = context.createLinearGradient(left, top, left + width, top);
    fill.addColorStop(0, `hsl(${hue + 18} 61% 62%)`);
    fill.addColorStop(0.7, `hsl(${hue + 8} 76% 59%)`);
    fill.addColorStop(1, `hsl(${hue} 86% 61%)`);
    context.fillStyle = fill;
    context.fillRect(left, top, Math.max(4, width * power), height);
    context.globalAlpha = 0.2;
    context.fillStyle = "#ffffff";
    context.fillRect(left, top + 1.4, width * power, 2.2);
    context.restore();

    context.strokeStyle = "rgba(255,255,255,.55)";
    context.lineWidth = 0.7;
    [0.25, 0.5, 0.75].forEach((tick) => {
      context.beginPath();
      context.moveTo(left + width * tick, top + 1.4);
      context.lineTo(left + width * tick, top + height - 1.4);
      context.stroke();
    });

    const knobX = left + width * power;
    context.beginPath();
    context.arc(knobX, top + height / 2, 6.2, 0, Math.PI * 2);
    context.fillStyle = "#fffaf1";
    context.shadowColor = "rgba(90,61,57,.24)";
    context.shadowBlur = 6;
    context.fill();
    context.shadowColor = "transparent";
    context.beginPath();
    context.arc(knobX, top + height / 2, 2.9, 0, Math.PI * 2);
    context.fillStyle = `hsl(${hue} 79% 58%)`;
    context.fill();

    context.globalAlpha = 0.86;
    context.fillStyle = "#92746a";
    context.font = '800 8.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "center";
    context.fillText(power >= 0.995 ? `满力 · ${Math.round(power * 100)}%` : `蓄力 · ${Math.round(power * 100)}%`, x, y - 2);
    context.restore();
  }

  function drawEffects(context) {
    const offsetX = state.cameraX;
    const offsetY = state.cameraY;
    state.rings.forEach((ring) => {
      const alpha = clamp(ring.life / ring.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha * 0.8;
      context.strokeStyle = ring.color;
      context.lineWidth = ring.width;
      context.beginPath();
      context.ellipse(ring.x - offsetX, ring.y - offsetY + 3, ring.radius, ring.radius * 0.38, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });

    state.effects.forEach((particle) => {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha;
      const x = particle.x - offsetX;
      const y = particle.y - offsetY;
      if (particle.shape === "spark") {
        drawSpark(context, x, y, particle.size, particle.color, particle.rotation);
      } else {
        fillEllipse(context, x, y, particle.size, particle.size * 0.8, particle.color);
      }
      context.restore();
    });

    state.floats.forEach((floater) => {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = floater.color;
      context.font = '900 14px "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif';
      context.textAlign = "center";
      context.fillText(floater.text, floater.x - offsetX, floater.y - offsetY);
      context.restore();
    });
  }

  function drawSpark(context, x, y, size, color, rotation) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation || 0);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, -size);
    context.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
    context.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
    context.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
    context.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
    context.fill();
    context.restore();
  }

  function drawWeather(context) {
    const vw = view.vw;
    const vh = view.vh;
    const time = state.ambient;
    const intensity = state.weatherIntensity;
    const type = state.weatherType;
    const reduced = reduceEffects();

    if (type === "clear") {
      // 晴天：飘动的暖光尘埃，让画面有空气感
      const count = reduced ? 8 : 26;
      context.save();
      for (let i = 0; i < count; i += 1) {
        const x = ((i * 137 + time * (9 + (i % 5) * 3)) % (vw + 80)) - 40;
        const y = ((i * 211 - time * (5 + (i % 4) * 2)) % (vh + 80) + vh + 80) % (vh + 80) - 40;
        const r = 1.1 + (i % 4) * 0.7;
        const pulse = 0.4 + Math.sin(time * 1.6 + i) * 0.3;
        context.globalAlpha = 0.1 + pulse * 0.16;
        context.fillStyle = "#fff4cf";
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      return;
    }

    /* ---------------- 整体天色调（压在场景上，先铺一层） ---------------- */
    const tint = {
      rain: { color: "rgba(64,96,112,", alpha: 0.16 },
      snow: { color: "rgba(198,226,238,", alpha: 0.12 },
      lightning: { color: "rgba(28,34,46,", alpha: 0.3 },
      wind: { color: "rgba(198,164,96,", alpha: 0.1 },
    }[type];

    if (tint) {
      const g = context.createLinearGradient(0, 0, 0, vh);
      g.addColorStop(0, tint.color + (tint.alpha * 1.5) + ")");
      g.addColorStop(0.55, tint.color + tint.alpha + ")");
      g.addColorStop(1, tint.color + (tint.alpha * 0.4) + ")");
      context.save();
      context.fillStyle = g;
      context.fillRect(0, 0, vw, vh);
      context.restore();
    }

    /* ---------------- 雨 ---------------- */
    if (type === "rain" || type === "lightning") {
      const heavy = type === "lightning";
      const count = Math.floor((reduced ? 34 : 90) + intensity * (reduced ? 30 : 90));

      /* 远景雨幕：整片半透明斜线，做出"下大了"的体感 */
      context.save();
      context.globalAlpha = 0.16 + intensity * 0.16;
      context.strokeStyle = heavy ? "rgba(200,216,224,.9)" : "rgba(150,188,204,.9)";
      context.lineWidth = 1;
      for (let i = 0; i < count * 0.34; i += 1) {
        const x = ((i * 97 + time * 340) % (vw + 200)) - 100;
        const y = ((i * 173 + time * 1500) % (vh + 220)) - 110;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 9, y + 30);
        context.stroke();
      }
      context.restore();

      /* 近景雨滴：更粗更亮更快 */
      context.save();
      context.lineCap = "round";
      for (let i = 0; i < count; i += 1) {
        const speed = 900 + (i % 7) * 130;
        const x = ((i * 71 + time * 260) % (vw + 120)) - 60;
        const y = ((i * 137 + time * speed) % (vh + 120)) - 60;
        const len = 14 + (i % 6) * 4 + intensity * 12;
        const alpha = 0.28 + (i % 5) * 0.09;
        context.globalAlpha = alpha;
        context.strokeStyle = heavy ? "rgba(214,228,236,1)" : "rgba(148,190,208,1)";
        context.lineWidth = 1 + (i % 3) * 0.45;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - len * 0.34, y + len);
        context.stroke();
      }
      context.restore();

      /* 地面水花：在屏幕下部不断炸开的小圈 */
      if (!reduced) {
        context.save();
        for (let i = 0; i < 16; i += 1) {
          const cycle = (time * 0.9 + i * 0.37) % 1;
          const x = ((i * 149 + 30) % (vw - 40)) + 20;
          const y = vh * (0.72 + (i % 5) * 0.055);
          const r = 2 + cycle * 13;
          context.globalAlpha = (1 - cycle) * 0.34;
          context.strokeStyle = "rgba(226,240,246,.9)";
          context.lineWidth = 1.2;
          context.beginPath();
          context.ellipse(x, y, r, r * 0.34, 0, 0, Math.PI * 2);
          context.stroke();
        }
        context.restore();
      }
    }

    /* ---------------- 雪 ---------------- */
    if (type === "snow") {
      const count = Math.floor((reduced ? 26 : 72) + intensity * (reduced ? 20 : 64));

      /* 背景细雪 */
      context.save();
      context.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < count * 0.5; i += 1) {
        const x = ((i * 89 + time * 16 + Math.sin(time * 0.6 + i) * 12) % (vw + 60)) - 30;
        const y = ((i * 157 + time * 44) % (vh + 60)) - 30;
        context.globalAlpha = 0.28 + (i % 4) * 0.08;
        context.beginPath();
        context.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      /* 近景大雪花：带摇摆和旋转 */
      context.save();
      for (let i = 0; i < count; i += 1) {
        const drift = Math.sin(time * 1.1 + i * 0.8) * (16 + (i % 5) * 7);
        const x = ((i * 83 + time * 30 + drift) % (vw + 100)) - 50;
        const y = ((i * 131 + time * (60 + (i % 6) * 16)) % (vh + 100)) - 50;
        const r = 1.8 + (i % 5) * 1.15 + intensity * 1.2;
        context.globalAlpha = 0.4 + (i % 5) * 0.11;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
        /* 雪花高光，做出体积感 */
        context.globalAlpha = 0.5 + (i % 3) * 0.12;
        context.fillStyle = "rgba(226,246,255,.9)";
        context.beginPath();
        context.arc(x - r * 0.28, y - r * 0.3, r * 0.42, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    /* ---------------- 风 ---------------- */
    if (type === "wind") {
      const dir = state.windDir;

      /* 长风线：层层叠叠，速度快、方向一致 */
      context.save();
      context.lineCap = "round";
      for (let i = 0; i < (reduced ? 14 : 34); i += 1) {
        const speed = 240 + (i % 6) * 130;
        const x = ((i * 113 + time * speed * dir) % (vw + 300) + vw + 300) % (vw + 300) - 150;
        const y = 90 + ((i * 79) % (vh * 0.78));
        const len = 40 + (i % 7) * 22;
        context.globalAlpha = 0.18 + (i % 5) * 0.07;
        context.strokeStyle = i % 3 === 0 ? "rgba(255,250,232,.95)" : "rgba(180,152,96,.85)";
        context.lineWidth = 1.2 + (i % 3) * 0.7;
        context.beginPath();
        context.moveTo(x, y);
        context.bezierCurveTo(
          x + len * 0.34 * dir, y - 7 - (i % 4) * 2,
          x + len * 0.68 * dir, y + 6 + (i % 3) * 2,
          x + len * dir, y
        );
        context.stroke();
      }
      context.restore();

      /* 被吹跑的落叶 / 花瓣 */
      context.save();
      for (let i = 0; i < (reduced ? 5 : 15); i += 1) {
        const speed = 150 + (i % 5) * 90;
        const x = ((i * 191 + time * speed * dir) % (vw + 320) + vw + 320) % (vw + 320) - 160;
        const y = 130 + ((i * 137) % (vh * 0.62)) + Math.sin(time * 2.4 + i) * 26;
        const spin = time * (2.2 + (i % 4) * 0.9) * dir + i;
        const size = 4 + (i % 4) * 1.6;
        context.save();
        context.translate(x, y);
        context.rotate(spin);
        context.globalAlpha = 0.55 + (i % 3) * 0.12;
        context.fillStyle = i % 3 === 0 ? "rgba(232,148,96,.9)" : "rgba(210,170,104,.9)";
        context.beginPath();
        context.ellipse(0, 0, size, size * 0.42, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.restore();
    }

    /* ---------------- 闪电 ---------------- */
    if (state.flash > 0) {
      context.save();
      context.fillStyle = `rgba(255,251,227,${state.flash * 0.78})`;
      context.fillRect(0, 0, vw, vh);
      if (state.bolt > 0.2) {
        context.globalAlpha = state.bolt;
        const branches = [
          { startX: vw * 0.58, startY: 60, seed: 1 },
          { startX: vw * 0.3, startY: 30, seed: 2 },
        ];
        branches.forEach((branch) => {
          context.strokeStyle = "#fff7cf";
          context.lineWidth = branch.seed === 1 ? 3.4 : 2.2;
          context.lineCap = "round";
          context.shadowColor = "#fff2b2";
          context.shadowBlur = 22;
          let bx = branch.startX;
          let by = branch.startY;
          context.beginPath();
          context.moveTo(bx, by);
          for (let i = 0; i < 6; i += 1) {
            bx += (i % 2 === 0 ? 1 : -1) * (20 + ((i + branch.seed) % 3) * 9);
            by += 44 + ((i + branch.seed) % 4) * 12;
            context.lineTo(bx, by);
          }
          context.stroke();
          context.shadowBlur = 0;
        });
      }
      context.restore();
    }
  }

  function render() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    drawBackdrop();

    const shakeX = reduceEffects() ? 0 : rand(-state.shake, state.shake) * 0.35;
    const shakeY = reduceEffects() ? 0 : rand(-state.shake, state.shake) * 0.22;

    ctx.save();
    ctx.scale(view.scale, view.scale);
    ctx.translate(shakeX, shakeY);
    drawWorldBackdrop(ctx);

    const drawNext = state.showNextPlatform && state.platforms[1] && !(state.mode === "gamble" && ["input", "wait", "break"].includes(state.blind.stage));
    const ordered = [];
    if (state.platforms[0]) ordered.push({ platform: state.platforms[0], isNext: false });
    if (drawNext) ordered.push({ platform: state.platforms[1], isNext: true });
    ordered.sort((a, b) => a.platform.y - b.platform.y);
    ordered.forEach((entry) => drawPlatform(ctx, entry.platform, entry.isNext));

    if (state.screen === "home" || state.screen === "playing" || state.screen === "gameover") {
      drawPlayer(ctx);
    }
    drawEffects(ctx);
    drawWeather(ctx);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    el.modeRow.addEventListener("click", (event) => {
      const button = event.target.closest(".mode-chip");
      if (!button) return;
      setMode(button.dataset.mode);
    });

    el.catStrip.addEventListener("click", (event) => {
      const card = event.target.closest(".cat-card");
      if (!card) return;
      selectCat(card.dataset.cat);
    });

    el.raceDurationRange.addEventListener("input", () => {
      save.raceDuration = clamp(Math.round((Number(el.raceDurationRange.value) || 120) / 5) * 5, 10, 120);
      persist();
      applyModeUI();
    });

    el.gambleStepsRange.addEventListener("input", () => {
      save.gambleSteps = clamp(Math.round((Number(el.gambleStepsRange.value) || 5) / 5) * 5, 5, 200);
      persist();
      applyModeUI();
    });

    el.blindContinue.addEventListener("click", startNextBlindRound);

    el.startBtn.addEventListener("click", startRun);
    el.retryBtn.addEventListener("click", () => {
      audio.init();
      audio.click();
      startRun({ rerollRandom: true });
    });
    el.miniSkillBtn.addEventListener("click", toggleSkills);
    el.quickWeather.addEventListener("click", toggleWeather);

    el.soundBtn.addEventListener("click", () => {
      save.sound = !save.sound;
      persist();
      syncSettings();
      if (save.sound) {
        audio.init();
        audio.click();
        showToast("声音回来了，猫爪落地有回响。");
      } else {
        showToast("静音模式，专心看猫。");
      }
    });

    el.weatherChip.addEventListener("click", () => {
      const definition = WEATHERS[state.weatherType] || WEATHERS.clear;
      showToast(`${definition.name}：${definition.desc}`, 2600);
    });

    el.pauseBtn.addEventListener("click", pauseGame);
    el.resumeBtn.addEventListener("click", resumeGame);
    el.pauseHomeBtn.addEventListener("click", goHome);
    el.resultHomeBtn.addEventListener("click", goHome);
    el.resultCatBtn.addEventListener("click", () => {
      closeModal(el.gameoverOverlay);
      setScreen("home");
      setWeather("clear", { silent: true, skipSeen: true });
      if (save.selected === "random") {
        state.randomPreviewId = randomCatId(state.randomPreviewId);
      }
      resetRunState();
      resetWorld(true);
      el.tutorial.classList.add("is-hidden");
      el.blindPanel.classList.remove("is-visible");
      updateSkillStatus();
      updateHud();
      renderCatStrip();
      window.setTimeout(() => {
        const selected = document.querySelector(".cat-card.is-selected");
        if (selected && selected.scrollIntoView) {
          selected.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 100);
    });

    el.achievementsBtn.addEventListener("click", () => {
      audio.init();
      audio.click();
      openAchievements();
    });
    el.pauseAchievementsBtn.addEventListener("click", openAchievements);
    el.resultAchievementsBtn.addEventListener("click", openAchievements);
    el.achievementsCloseBtn.addEventListener("click", closeAchievements);
    el.achievementsDoneBtn.addEventListener("click", closeAchievements);
    el.achievementsOverlay.addEventListener("click", (event) => {
      if (event.target === el.achievementsOverlay) closeAchievements();
    });

    el.settingsBtnHome.addEventListener("click", () => {
      audio.init();
      audio.click();
      syncSettings();
      openModal(el.settingsOverlay);
    });
    el.pauseSettingsBtn.addEventListener("click", () => {
      syncSettings();
      openModal(el.settingsOverlay);
    });
    el.settingsCloseBtn.addEventListener("click", () => closeModal(el.settingsOverlay));
    el.settingsDoneBtn.addEventListener("click", () => closeModal(el.settingsOverlay));
    el.settingsOverlay.addEventListener("click", (event) => {
      if (event.target === el.settingsOverlay) closeModal(el.settingsOverlay);
    });

    el.skillsToggle.addEventListener("change", () => {
      save.skills = el.skillsToggle.checked;
      persist();
      syncSettings();
      updateSkillStatus();
      audio.click();
      showToast(save.skills ? "猫咪技能已开启。" : "公平模式：技能全关，只剩脚法。");
    });

    el.weatherToggle.addEventListener("change", () => {
      save.weather = el.weatherToggle.checked;
      persist();
      syncSettings();
      updateQuickWeather();
      if (!save.weather) {
        setWeather("clear", { silent: true });
        showToast("天气系统已关，今天一直晴。");
      } else {
        state.weatherJumpsLeft = 4;
        showToast("天气系统已开启，云会慢慢变脸。");
      }
      audio.click();
    });

    el.soundToggle.addEventListener("change", () => {
      save.sound = el.soundToggle.checked;
      persist();
      syncSettings();
      if (save.sound) {
        audio.init();
        audio.click();
      }
    });

    el.musicToggle.addEventListener("change", () => {
      save.music = el.musicToggle.checked;
      persist();
      if (save.music) {
        audio.init();
        audio.setMusicEnabled(true);
      } else {
        audio.setMusicEnabled(false);
      }
    });

    el.hapticsToggle.addEventListener("change", () => {
      save.haptics = el.hapticsToggle.checked;
      persist();
      if (save.haptics) haptic(12);
    });

    el.motionToggle.addEventListener("change", () => {
      save.motion = el.motionToggle.checked;
      persist();
      audio.click();
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (!canCharge()) return;
      event.preventDefault();
      startCharge();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture is not available everywhere.
      }
    });

    window.addEventListener("pointerup", (event) => {
      if (state.phase === "charging") {
        event.preventDefault();
        releaseCharge();
      }
    }, { passive: false });

    window.addEventListener("pointercancel", cancelCharge);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        if (state.screen === "home") {
          event.preventDefault();
          if (event.repeat) return;
          startRun();
        } else if (state.screen === "playing" && !state.paused) {
          event.preventDefault();
          if (event.repeat) return;
          if (state.phase === "idle" && canCharge()) startCharge();
        } else if (state.paused) {
          event.preventDefault();
          resumeGame();
        }
      }

      if (event.code === "Escape") {
        if (el.achievementsOverlay.classList.contains("is-open")) {
          closeAchievements();
        } else if (el.settingsOverlay.classList.contains("is-open")) {
          closeModal(el.settingsOverlay);
        } else if (state.paused) {
          resumeGame();
        } else if (state.screen === "playing") {
          pauseGame();
        }
      }

      if (state.screen === "home" && !event.repeat && (event.code === "ArrowRight" || event.code === "ArrowLeft")) {
        event.preventDefault();
        const ids = ["random", ...availableCats().map((cat) => cat.id)];
        const current = ids.indexOf(save.selected);
        const next = (current + (event.code === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
        selectCat(ids[next]);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "Space" && state.phase === "charging") {
        event.preventDefault();
        releaseCharge();
      }
    });

    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", () => window.setTimeout(resize, 90));
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(app);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.screen === "playing" && !state.paused) pauseGame();
    });

    window.addEventListener("blur", () => {
      if (state.screen === "playing" && !state.paused) pauseGame();
    });

    document.addEventListener("pointerdown", () => {
      audio.init();
      audio.startMusic();
    }, { once: true, passive: true });
  }

  function pauseGame() {
    if (state.screen !== "playing" || state.paused) return;
    if (state.phase === "falling") return;
    if (state.phase === "charging") cancelCharge();
    state.paused = true;
    audio.stopCharge();
    openModal(el.pauseOverlay);
  }

  function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    closeModal(el.pauseOverlay);
    closeModal(el.settingsOverlay);
    closeModal(el.achievementsOverlay);
    lastFrame = performance.now();
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function boot() {
    resize();
    syncSettings();
    renderCatStrip();
    applyModeUI();
    renderAchievements();
    updateHud();
    updateWeatherUI();
    updateAchievementBadge();
    setScreen("home");
    resetRunState();
    resetWorld(true);
    setWeather("clear", { silent: true, skipSeen: true });
    el.tutorial.classList.add("is-hidden");
    el.blindPanel.classList.remove("is-visible");
    el.raceBanner.classList.remove("is-visible");
    [el.gameoverOverlay, el.pauseOverlay, el.settingsOverlay, el.achievementsOverlay].forEach((overlay) => {
      overlay.setAttribute("aria-hidden", "true");
    });
    bindEvents();
    checkAchievements({ silent: true });
    renderAchievements();
    updateHud();
    updateAchievementBadge();
    window.setTimeout(updateHomeMetrics, 650);

    /* 猫图是异步加载的：就绪后重绘一次，避免首帧画成占位色块 */
    let repaintTries = 0;
    const repaintWhenReady = () => {
      if (RealCat.assetsReady && !RealCat.assetsReady()) {
        repaintTries += 1;
        if (repaintTries > 90) return;
        window.setTimeout(repaintWhenReady, 100);
        return;
      }
      renderCatStrip();
      renderSelectedCard();
      updateHomeMetrics();
    };
    window.setTimeout(repaintWhenReady, 60);

    lastFrame = performance.now();
    window.requestAnimationFrame(loop);

    window.__NYA_DEBUG__ = {
      snapshot() {
        const current = currentPlatform();
        const next = nextPlatform();
        return {
          screen: state.screen,
          mode: state.mode,
          phase: state.phase,
          score: state.score,
          combo: state.combo,
          perfects: state.perfects,
          jumps: state.jumps,
          step: state.step,
          misses: state.misses,
          mistakes: state.mistakes,
          selected: save.selected,
          runCat: activeRunCat().id,
          skills: save.skills,
          weatherSetting: save.weather,
          weather: state.weatherType,
          raceTime: Math.round(state.raceTime * 10) / 10,
          blindStage: state.blind.stage,
          blindPowers: state.blind.powers.slice(),
          blindResults: state.blind.results.map((item) => item.kind),
          blindAllResults: state.blind.allResults.map((item) => item.kind),
          blindRounds: state.blind.rounds,
          blindRound: state.blind.roundIndex + 1,
          blindTotalSteps: state.blind.totalSteps,
          best: getBest(),
          unlocked: save.unlocked,
          achievements: achievementCount(),
          current: current ? { x: Math.round(current.x), y: Math.round(current.y), shape: current.shape, width: Math.round(current.width) } : null,
          next: next ? { x: Math.round(next.x), y: Math.round(next.y), shape: next.shape, width: Math.round(next.width), appear: Math.round(next.appear * 100) / 100 } : null,
          gap: next ? Math.round(distance(state.player.x, state.player.y, next.x, next.y)) : null,
          chargeDuration: Math.round(chargeDuration()),
          physics: playerPhysics(),
          sizeScale: Math.round(sizeScale() * 100) / 100,
          barLength: barLength(),
          jumpRange: (() => { const r = jumpRange(); return { min: Math.round(r.min), max: Math.round(r.max) }; })(),
          platformCount: state.platforms.length,
        };
      },
      setWeather(type) {
        if (state.screen !== "playing") return;
        setWeather(type, { silent: false });
      },
      setRaceTime(seconds) {
        state.raceTime = Math.max(0, Number(seconds) || 0);
        updateRaceHud();
      },
      startRun() {
        if (state.screen === "home") startRun();
      },
      endRun(reason = "debug") {
        endRun(reason);
      },
      getCats() {
        return CATS.map((cat) => ({ id: cat.id, name: cat.name, hidden: !!cat.hidden }));
      },
      getAchievements() {
        return ACHIEVEMENTS.map((achievement) => ({
          id: achievement.id,
          name: achievement.name,
          unlocked: !!save.achievements[achievement.id],
          value: achievement.value(save),
          goal: achievement.goal,
        }));
      },
      audioStatus() {
        return {
          context: audio.context ? audio.context.state : "none",
          muted: audio.muted,
          musicEnabled: audio.musicEnabled,
          musicRunning: !!audio.musicTimer,
          master: audio.master ? audio.master.gain.value : 0,
        };
      },
    };
  }

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    update(dt);
    render();
    window.requestAnimationFrame(loop);
  }

  boot();
})();
