(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");

  const DESIGN_H = 900;
  const SURFACE_Y = 620;
  const MIN_DIST = 102;
  const MAX_DIST = 354;
  const BASE_CHARGE_MS = 900;
  const PERFECT_RADIUS = 15;
  const STORAGE_KEY = "nyanya-jump-v1";

  const COLORS = {
    ink: "#49363d",
    inkSoft: "#6f5a5f",
    muted: "#9a8584",
    cream: "#fffaf1",
    coral: "#ff8b78",
    mint: "#9bd9c0",
    butter: "#ffd780",
  };

  const CATS = [
    {
      id: "persian",
      name: "波斯猫",
      shortName: "波斯",
      tagline: "毛发比心情还蓬松",
      skillName: "从容蓄力",
      skillDesc: "蓄力更慢更稳，远距离更好拿捏。",
      skillType: "slow",
      statusText: "从容蓄力 · 生效中",
      fur: "#f4e5d4",
      furDark: "#dfc7af",
      furLight: "#fffaf0",
      pattern: "#d8b99d",
      eye: "#72b5d6",
      eyeDark: "#234f65",
      earInner: "#efb4b8",
      nose: "#db9aa1",
      collar: "#cf7d8d",
      seed: 0.6,
      fluff: true,
      earSize: 0.82,
    },
    {
      id: "tabby",
      name: "狸花猫",
      shortName: "狸花",
      tagline: "眼里自带瞄准镜",
      skillName: "猎手直觉",
      skillDesc: "蓄力时会轻轻圈出下一块平台中心。",
      skillType: "aim",
      statusText: "猎手直觉 · 蓄力可见",
      fur: "#b89b7c",
      furDark: "#907456",
      furLight: "#efe2cd",
      pattern: "#705a44",
      eye: "#78b574",
      eyeDark: "#31542f",
      earInner: "#dfa1a0",
      nose: "#c88988",
      collar: "#7aa78f",
      seed: 2.1,
      earSize: 1,
    },
    {
      id: "orange",
      name: "大橘猫",
      shortName: "大橘",
      tagline: "重量级选手，底盘稳",
      skillName: "稳稳落地",
      skillDesc: "猫爪踩到边缘时，容错会多一点点。",
      skillType: "grip",
      statusText: "稳稳落地 · 生效中",
      fur: "#f2a45e",
      furDark: "#d47c3c",
      furLight: "#ffd9ad",
      pattern: "#c76b2f",
      eye: "#e0a63e",
      eyeDark: "#674611",
      earInner: "#f2af9e",
      nose: "#db8775",
      collar: "#5fa59d",
      seed: 4.2,
      earSize: 0.95,
    },
    {
      id: "black",
      name: "黑猫",
      shortName: "黑猫",
      tagline: "夜色里最亮的一双眼",
      skillName: "九命护符",
      skillDesc: "每局第一次失手，会被悄悄叼回上一块平台。",
      skillType: "rescue",
      statusText: "九命护符 · 待命",
      fur: "#4b4654",
      furDark: "#34313d",
      furLight: "#6b6477",
      pattern: "#615b6c",
      eye: "#f2c45c",
      eyeDark: "#4f3a10",
      earInner: "#a97886",
      nose: "#8e6c77",
      collar: "#d8b55b",
      seed: 1.2,
      earSize: 1.04,
    },
    {
      id: "cow",
      name: "奶牛猫",
      shortName: "奶牛",
      tagline: "黑白配色，连击上头",
      skillName: "连击玩家",
      skillDesc: "每次完美落地多赚 1 分，连击更香。",
      skillType: "bonus",
      statusText: "连击玩家 · 生效中",
      fur: "#f7f0e5",
      furDark: "#dfd2c2",
      furLight: "#fffdf7",
      pattern: "#3c3840",
      eye: "#75aac3",
      eyeDark: "#24495c",
      earInner: "#e7aeb1",
      nose: "#db9aa0",
      collar: "#e36e63",
      seed: 3.4,
      earSize: 1,
    },
    {
      id: "siamese",
      name: "暹罗猫",
      shortName: "暹罗",
      tagline: "猫步量出来的精准",
      skillName: "猫步精准",
      skillDesc: "Perfect 判定圈更宽，落点更宽容。",
      skillType: "perfect",
      statusText: "猫步精准 · 生效中",
      fur: "#f2e4d1",
      furDark: "#d8c5ac",
      furLight: "#fff9ee",
      pattern: "#5d4740",
      eye: "#70b1d1",
      eyeDark: "#1e4a60",
      earInner: "#c49899",
      nose: "#b6858b",
      collar: "#9375b4",
      seed: 5.3,
      earSize: 1.05,
      siamese: true,
    },
    {
      id: "redpanda",
      name: "小熊猫",
      shortName: "小熊猫",
      tagline: "隐藏款，尾巴会魔法",
      skillName: "尾巴回旋",
      skillDesc: "每局一次，把擦边的失误卷回平台上。",
      skillType: "tail",
      statusText: "尾巴回旋 · 待命",
      fur: "#cf7e4d",
      furDark: "#9e5434",
      furLight: "#fff4e7",
      pattern: "#4a3531",
      eye: "#55392a",
      eyeDark: "#2d1d17",
      earInner: "#eac3ae",
      nose: "#3e2d2c",
      collar: "#75aa92",
      seed: 6.4,
      earSize: 1.2,
      redPanda: true,
    },
  ];

  const PALETTES = [
    { top: "#ffd9c8", edge: "#f2b6a0", side: "#e7a18c", dark: "#d88c77", glow: "#ffb7a2" },
    { top: "#cdeedf", edge: "#a7d8c2", side: "#91c7af", dark: "#7eb29a", glow: "#98dbc0" },
    { top: "#ded1f4", edge: "#c1aee5", side: "#ab98d0", dark: "#9784bc", glow: "#c0a9ea" },
    { top: "#ffe9ac", edge: "#f1d487", side: "#dcc077", dark: "#c9ac62", glow: "#ffdc81" },
    { top: "#cde6f4", edge: "#a7cee2", side: "#92b9cf", dark: "#80a6bc", glow: "#9fd3ee" },
    { top: "#f8d1d4", edge: "#e5b2b8", side: "#d29da5", dark: "#bf8b93", glow: "#f1b7bd" },
    { top: "#f6dcc0", edge: "#e4c29e", side: "#d1ad87", dark: "#bd9975", glow: "#f0cba5" },
  ];

  const DEFAULT_SAVE = {
    sound: true,
    haptics: true,
    skills: true,
    motion: false,
    selected: "persian",
    best: 0,
    unlocked: false,
  };

  function loadSave() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        best: Math.max(0, Number(parsed.best) || 0),
      };
    } catch (error) {
      return { ...DEFAULT_SAVE };
    }
  }

  const save = loadSave();
  if (!save.unlocked && save.selected === "redpanda") save.selected = "persian";
  if (!CATS.some((cat) => cat.id === save.selected)) save.selected = "persian";
  if (!save.unlocked && save.selected === "redpanda") save.selected = "persian";

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch (error) {
      // A private window can refuse storage; the game still runs for this session.
    }
  }

  function getCat(id = save.selected) {
    return CATS.find((cat) => cat.id === id) || CATS[0];
  }

  const state = {
    screen: "home",
    paused: false,
    phase: "idle",
    time: 0,
    ambient: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    jumps: 0,
    currentIndex: 0,
    platforms: [],
    player: {
      x: 300,
      y: SURFACE_Y,
      power: 0,
      charging: false,
      rotation: 0,
    },
    chargeElapsed: 0,
    chargeEmit: 0,
    jump: null,
    fall: null,
    landingTimer: 0,
    skillUsed: false,
    cameraFocusX: 300,
    cameraX: 0,
    sceneOffset: -112,
    sceneOffsetTarget: -112,
    shake: 0,
    tutorialDone: false,
    newUnlock: false,
    settingsReturn: "home",
    effects: [],
    floats: [],
    rings: [],
  };

  const view = {
    width: 0,
    height: 0,
    dpr: 1,
    scale: 1,
    vw: 480,
    shortLandscape: false,
    homeOffset: -112,
  };

  let resizeObserver = null;
  let toastTimer = 0;
  let lastFrame = performance.now();
  let audio = null;

  const el = {
    homeScreen: $("#homeScreen"),
    gameScreen: $("#gameScreen"),
    homeBottom: $(".home-bottom"),
    catStrip: $("#catStrip"),
    selectedAvatar: $("#selectedAvatar"),
    selectedName: $("#selectedName"),
    skillName: $("#skillName"),
    skillDesc: $("#skillDesc"),
    miniSkillBtn: $("#miniSkillBtn"),
    miniSkillText: $("#miniSkillText"),
    scoreValue: $("#scoreValue"),
    bestValue: $("#bestValue"),
    scoreHud: $("#scoreHud"),
    comboBadge: $("#comboBadge"),
    comboText: $("#comboText"),
    skillStatus: $("#skillStatus"),
    skillStatusText: $("#skillStatusText"),
    tutorial: $("#tutorial"),
    perfectFlash: $("#perfectFlash"),
    pauseOverlay: $("#pauseOverlay"),
    gameoverOverlay: $("#gameoverOverlay"),
    settingsOverlay: $("#settingsOverlay"),
    resultTitle: $("#resultTitle"),
    resultQuote: $("#resultQuote"),
    finalScore: $("#finalScore"),
    finalPerfect: $("#finalPerfect"),
    finalCombo: $("#finalCombo"),
    finalJumps: $("#finalJumps"),
    unlockNote: $("#unlockNote"),
    toast: $("#toast"),
    skillsToggle: $("#skillsToggle"),
    soundToggle: $("#soundToggle"),
    hapticsToggle: $("#hapticsToggle"),
    motionToggle: $("#motionToggle"),
    soundBtn: $("#soundBtn"),
    pauseBtn: $("#pauseBtn"),
    startBtn: $("#startBtn"),
    retryBtn: $("#retryBtn"),
    settingsBtnHome: $("#settingsBtnHome"),
    settingsCloseBtn: $("#settingsCloseBtn"),
    settingsDoneBtn: $("#settingsDoneBtn"),
    resumeBtn: $("#resumeBtn"),
    pauseSettingsBtn: $("#pauseSettingsBtn"),
    pauseHomeBtn: $("#pauseHomeBtn"),
    resultHomeBtn: $("#resultHomeBtn"),
    resultCatBtn: $("#resultCatBtn"),
  };

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
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

  function drawEllipse(context, x, y, rx, ry, color, rotation = 0) {
    context.fillStyle = color;
    ellipsePath(context, x, y, rx, ry, rotation);
    context.fill();
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
      // Vibration is a nice-to-have, never a blocker.
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    }

    init() {
      if (!this.context) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        try {
          this.context = new AudioCtor();
          this.master = this.context.createGain();
          this.master.gain.value = this.muted ? 0 : 0.3;
          this.master.connect(this.context.destination);
        } catch (error) {
          this.context = null;
        }
      }
      if (this.context && this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.3, this.context.currentTime, 0.02);
      }
      if (muted) this.stopCharge();
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
      gain.gain.exponentialRampToValueAtTime(options.volume || 0.055, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
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
      this.chargeGain.gain.exponentialRampToValueAtTime(0.026, now + 0.8);
      this.chargeOsc.connect(this.chargeGain);
      this.chargeGain.connect(this.master);
      this.chargeOsc.start(now);
    }

    updateCharge(power) {
      if (this.muted || !this.context || !this.chargeOsc) return;
      const now = this.context.currentTime;
      this.chargeOsc.frequency.setTargetAtTime(145 + power * 450, now, 0.045);
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
      gain.gain.setTargetAtTime(0.0001, now, 0.035);
      try {
        osc.stop(now + 0.2);
      } catch (error) {
        // Already stopped.
      }
      this.chargeOsc = null;
      this.chargeGain = null;
    }

    jump(power) {
      this.stopCharge();
      this.tone(330 + power * 120, 0.12, {
        endFrequency: 720 + power * 180,
        type: "triangle",
        volume: 0.05,
      });
      this.tone(920, 0.065, { delay: 0.035, type: "sine", volume: 0.025 });
    }

    land(perfect, combo) {
      this.tone(perfect ? 220 : 175, 0.12, {
        endFrequency: perfect ? 110 : 95,
        type: "sine",
        volume: 0.065,
      });
      if (perfect) {
        const base = 590 + Math.min(combo, 5) * 35;
        this.tone(base, 0.16, { delay: 0.035, type: "sine", volume: 0.042 });
        this.tone(base * 1.5, 0.22, { delay: 0.08, type: "triangle", volume: 0.026 });
      }
    }

    fail() {
      this.stopCharge();
      this.tone(210, 0.52, { endFrequency: 62, type: "sawtooth", volume: 0.032 });
      this.tone(120, 0.38, { endFrequency: 52, type: "sine", volume: 0.04 });
    }

    rescue() {
      this.tone(440, 0.14, { endFrequency: 620, type: "sine", volume: 0.035 });
      this.tone(660, 0.2, { delay: 0.11, endFrequency: 880, type: "sine", volume: 0.03 });
    }

    unlock() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        this.tone(frequency, 0.22, { delay: index * 0.105, type: "triangle", volume: 0.032 });
      });
    }

    click() {
      this.tone(620, 0.055, { type: "sine", volume: 0.024 });
    }
  }

  audio = new AudioKit();

  /* ------------------------------------------------------------------ */
  /* Cat drawing                                                         */
  /* ------------------------------------------------------------------ */

  function drawEar(context, side, cat, time, innerScale = 1) {
    const dir = side === "left" ? -1 : 1;
    const baseX = dir * 13.5;
    const tipX = dir * (15.5 + (1 - cat.earSize) * 5);
    const tipY = -95 + (1 - cat.earSize) * 7;
    context.beginPath();
    context.moveTo(baseX - dir * 8.5, -80);
    context.quadraticCurveTo(baseX - dir * 7, -93, tipX, tipY);
    context.quadraticCurveTo(baseX + dir * 1.5, -88, baseX + dir * 8.5, -78);
    context.closePath();
    context.fillStyle = cat.fur;
    context.fill();

    context.beginPath();
    context.moveTo(baseX - dir * 4.3, -82.5);
    context.quadraticCurveTo(baseX - dir * 2, -89.5, tipX - dir * 1.5, tipY + 3.5);
    context.quadraticCurveTo(baseX + dir * 0.6, -85, baseX + dir * 4.3, -81);
    context.closePath();
    context.fillStyle = cat.earInner;
    context.globalAlpha = 0.8;
    context.fill();
    context.globalAlpha = 1;
  }

  function drawHouseTail(context, cat, time, charge) {
    const seed = cat.seed || 0;
    const sway = Math.sin(time * 2.1 + seed) * 2.5 + charge * 4;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = cat.furDark;
    context.lineWidth = 11;
    context.beginPath();
    context.moveTo(14, -30);
    context.bezierCurveTo(30, -24, 38, -31 + sway, 34, -50 + sway);
    context.stroke();
    context.strokeStyle = cat.siamese ? cat.pattern : cat.fur;
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(14, -30);
    context.bezierCurveTo(30, -24, 38, -31 + sway, 34, -50 + sway);
    context.stroke();

    if (cat.siamese) {
      context.strokeStyle = cat.pattern;
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(32, -42 + sway * 0.8);
      context.quadraticCurveTo(35, -46 + sway, 34, -50 + sway);
      context.stroke();
    }

    if (cat.id === "tabby" || cat.id === "orange") {
      context.strokeStyle = cat.pattern;
      context.globalAlpha = 0.65;
      context.lineWidth = 2.2;
      [-37, -43].forEach((y, index) => {
        context.beginPath();
        context.moveTo(31 + index * 1.5, y + sway * 0.72);
        context.lineTo(37 + index, y - 1 + sway * 0.8);
        context.stroke();
      });
      context.globalAlpha = 1;
    }
    context.restore();
  }

  function drawRedPandaTail(context, cat, time) {
    const sway = Math.sin(time * 1.8 + cat.seed) * 2;
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const x = 13 + t * 29 + Math.sin(time * 1.6 + i * 0.45) * 1.5;
      const y = -20 - Math.sin(t * Math.PI) * 22 - t * 20 + sway * (0.4 + t * 0.4);
      const radius = 10.5 - t * 3.3;
      drawEllipse(
        context,
        x,
        y,
        radius,
        radius * (0.82 + t * 0.1),
        i % 2 === 0 ? cat.furDark : cat.fur,
        -0.35
      );
    }
    drawEllipse(context, 41, -50 + sway * 0.7, 6.5, 5, cat.pattern, -0.35);
  }

  function drawCatEyes(context, cat, blink, mood) {
    const eyeY = -66;
    const positions = [-7.5, 7.5];
    const happy = mood === "happy";
    positions.forEach((eyeX) => {
      if (blink) {
        context.strokeStyle = cat.eyeDark;
        context.lineWidth = 1.3;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(eyeX - 3.6, eyeY);
        context.quadraticCurveTo(eyeX, eyeY + 2.4, eyeX + 3.6, eyeY);
        context.stroke();
        return;
      }
      if (happy) {
        context.strokeStyle = cat.eyeDark;
        context.lineWidth = 1.7;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(eyeX - 3.7, eyeY + 1.2);
        context.quadraticCurveTo(eyeX, eyeY - 3.8, eyeX + 3.7, eyeY + 1.2);
        context.stroke();
        return;
      }
      drawEllipse(context, eyeX, eyeY, 4.5, 5.3, cat.eyeDark);
      drawEllipse(context, eyeX, eyeY + 0.2, 3.5, 4.4, cat.eye);
      drawEllipse(context, eyeX, eyeY + 0.6, 1.55, 3.5, "#29232a");
      drawEllipse(context, eyeX - 1.3, eyeY - 2, 1, 1.45, "rgba(255,255,255,.92)", -0.3);
    });
  }

  function drawHouseCat(context, cat, opts) {
    const { time, charge, blink, mood } = opts;

    drawHouseTail(context, cat, time, charge);
    drawEar(context, "left", cat, time);
    drawEar(context, "right", cat, time);

    // Body and little paws.
    drawEllipse(context, 0, -30, 23, 27, cat.fur);
    if (cat.fluff) {
      drawEllipse(context, -18, -15, 8, 9, cat.fur);
      drawEllipse(context, -9, -8, 7, 8, cat.fur);
      drawEllipse(context, 10, -8, 7, 8, cat.fur);
      drawEllipse(context, 19, -16, 8, 9, cat.fur);
    }

    // Pattern layer, clipped inside the body.
    context.save();
    ellipsePath(context, 0, -30, 23, 27);
    context.clip();
    context.globalAlpha = 0.2;
    drawEllipse(context, 11, -29, 12, 23, cat.furDark);
    context.globalAlpha = 1;

    if (cat.id === "tabby" || cat.id === "orange") {
      context.strokeStyle = cat.pattern;
      context.lineCap = "round";
      context.lineWidth = 4.1;
      context.globalAlpha = 0.64;
      [-42, -33, -24, -15].forEach((y, index) => {
        context.beginPath();
        context.moveTo(-23, y + 3);
        context.quadraticCurveTo(-12, y - 2, -3 + index * 0.8, y + 1.5);
        context.stroke();
        context.beginPath();
        context.moveTo(22, y + 4);
        context.quadraticCurveTo(15, y - 1, 9, y + 1);
        context.stroke();
      });
      context.globalAlpha = 1;
    }

    if (cat.id === "cow") {
      drawEllipse(context, -11, -39, 14, 16, cat.pattern, -0.3);
      drawEllipse(context, 15, -16, 9, 7.5, cat.pattern, 0.3);
      drawEllipse(context, 13, -45, 5, 6, cat.pattern, 0.2);
    }

    if (cat.id === "black") {
      context.strokeStyle = "rgba(145,133,164,.24)";
      context.lineWidth = 4;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(-8, -48);
      context.quadraticCurveTo(2, -54, 11, -45);
      context.stroke();
    }
    context.restore();

    drawEllipse(context, 0, -24, 10.5, 15, cat.furLight, 0);

    // Feet.
    drawEllipse(context, -12, -4, 8, 5.5, cat.furLight);
    drawEllipse(context, 12, -4, 8, 5.5, cat.furLight);
    if (cat.siamese) {
      drawEllipse(context, -12, -4, 8, 5.5, cat.pattern);
      drawEllipse(context, 12, -4, 8, 5.5, cat.pattern);
    }
    context.strokeStyle = "rgba(74,53,58,.18)";
    context.lineWidth = 0.7;
    [-15, -12, -9, 9, 12, 15].forEach((x) => {
      context.beginPath();
      context.moveTo(x, -7.5);
      context.lineTo(x, -2.2);
      context.stroke();
    });

    // Head.
    if (cat.fluff) {
      drawEllipse(context, -18, -61, 8.5, 10, cat.fur);
      drawEllipse(context, 18, -61, 8.5, 10, cat.fur);
      drawEllipse(context, 0, -50, 14, 7, cat.fur);
    }
    drawEllipse(context, 0, -66, 21, 19, cat.fur);

    // Siamese mask.
    if (cat.siamese) {
      context.save();
      ellipsePath(context, 0, -66, 21, 19);
      context.clip();
      drawEllipse(context, 0, -59.5, 16.5, 13.5, cat.pattern, 0);
      context.restore();
    }

    // Cow patch across one eye.
    if (cat.id === "cow") {
      context.save();
      ellipsePath(context, 0, -66, 21, 19);
      context.clip();
      drawEllipse(context, -10.5, -75, 11, 9.5, cat.pattern, -0.35);
      context.restore();
    }

    // Tabby forehead markings.
    if (cat.id === "tabby" || cat.id === "orange") {
      context.strokeStyle = cat.pattern;
      context.lineCap = "round";
      context.lineWidth = 2.1;
      context.globalAlpha = 0.68;
      [-5, 0, 5].forEach((x, index) => {
        context.beginPath();
        context.moveTo(x, -84 + (index === 1 ? -1 : 0));
        context.lineTo(x + (index - 1) * 1.4, -77);
        context.stroke();
      });
      context.globalAlpha = 1;
    }

    // Cheeks and muzzle.
    if (cat.fluff) {
      context.globalAlpha = 0.65;
      drawEllipse(context, -14, -58, 7, 5, cat.furLight);
      drawEllipse(context, 14, -58, 7, 5, cat.furLight);
      context.globalAlpha = 1;
    }
    drawEllipse(context, 0, -56.5, 10, 7, cat.furLight);

    // Eyes.
    drawCatEyes(context, cat, blink, mood);

    // Nose and mouth.
    context.fillStyle = cat.nose;
    context.beginPath();
    context.moveTo(0, -58.8);
    context.quadraticCurveTo(-3.1, -55.8, -2.4, -54.8);
    context.quadraticCurveTo(0, -53.3, 2.4, -54.8);
    context.quadraticCurveTo(3.1, -55.8, 0, -58.8);
    context.fill();

    context.strokeStyle = "rgba(73,52,57,.62)";
    context.lineWidth = 0.9;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, -54.2);
    context.lineTo(0, -52.8);
    context.moveTo(0, -52.8);
    context.quadraticCurveTo(-2.2, -51.1, -3.6, -52.4);
    context.moveTo(0, -52.8);
    context.quadraticCurveTo(2.2, -51.1, 3.6, -52.4);
    context.stroke();

    // Whiskers.
    context.strokeStyle = "rgba(87,64,64,.42)";
    context.lineWidth = 0.7;
    [-1, 1].forEach((dir) => {
      [0, 2.6].forEach((offset, index) => {
        context.beginPath();
        context.moveTo(dir * 7.3, -57 + offset * 0.35);
        context.quadraticCurveTo(dir * 16, -58.5 + index * 2.6, dir * 21, -57.2 + index * 3.2);
        context.stroke();
      });
    });

    // Blush.
    context.globalAlpha = cat.id === "black" ? 0.12 : 0.22;
    drawEllipse(context, -15.7, -55.5, 4.5, 2.7, "#ef8f91");
    drawEllipse(context, 15.7, -55.5, 4.5, 2.7, "#ef8f91");
    context.globalAlpha = 1;

    // Collar and bell.
    context.strokeStyle = cat.collar;
    context.lineWidth = 3.2;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-12, -49.4);
    context.quadraticCurveTo(0, -46, 12, -49.4);
    context.stroke();
    drawEllipse(context, 0, -46.2, 3.1, 3.1, "#ffd66f");
    drawEllipse(context, -0.8, -47.1, 1, 1.2, "rgba(255,255,255,.8)");
  }

  function drawRedPanda(context, cat, opts) {
    const { time, charge, blink, mood } = opts;
    drawRedPandaTail(context, cat, time);

    // Ears sit behind the head.
    drawEllipse(context, -14, -79, 10.5, 11, cat.pattern, -0.2);
    drawEllipse(context, 14, -79, 10.5, 11, cat.pattern, 0.2);
    drawEllipse(context, -14, -78.5, 5.6, 6.6, cat.furLight, -0.2);
    drawEllipse(context, 14, -78.5, 5.6, 6.6, cat.furLight, 0.2);

    // Body and limbs.
    drawEllipse(context, 0, -29, 24, 27, cat.fur);
    drawEllipse(context, 0, -22, 12, 16, cat.furLight);
    drawEllipse(context, -13, -5, 8, 5.5, cat.pattern);
    drawEllipse(context, 13, -5, 8, 5.5, cat.pattern);
    context.strokeStyle = "rgba(50,33,30,.22)";
    context.lineWidth = 0.7;
    [-16, -13, -10, 10, 13, 16].forEach((x) => {
      context.beginPath();
      context.moveTo(x, -7.5);
      context.lineTo(x, -2.4);
      context.stroke();
    });

    // Head with white cheek fluff.
    drawEllipse(context, -15, -60, 9, 10, cat.furLight);
    drawEllipse(context, 15, -60, 9, 10, cat.furLight);
    drawEllipse(context, 0, -65, 21.5, 19.5, cat.fur);
    drawEllipse(context, 0, -58, 12.5, 9.5, cat.furLight);

    // White forehead stripe.
    context.strokeStyle = cat.furLight;
    context.lineCap = "round";
    context.lineWidth = 4.2;
    context.beginPath();
    context.moveTo(0, -84);
    context.quadraticCurveTo(2, -77, 0, -72);
    context.stroke();

    // Dark tear-shaped eye patches.
    drawEllipse(context, -8.3, -67, 7.7, 6.4, cat.pattern, -0.22);
    drawEllipse(context, 8.3, -67, 7.7, 6.4, cat.pattern, 0.22);

    drawCatEyes(context, cat, blink, mood);

    // White brows.
    context.strokeStyle = cat.furLight;
    context.lineWidth = 1.7;
    context.lineCap = "round";
    [-1, 1].forEach((dir) => {
      context.beginPath();
      context.moveTo(dir * 4.8, -74.5);
      context.lineTo(dir * 9.2, -76);
      context.stroke();
    });

    // Nose and muzzle.
    context.fillStyle = cat.nose;
    context.beginPath();
    context.moveTo(0, -59.6);
    context.quadraticCurveTo(-3.2, -56.8, -2.2, -55.6);
    context.quadraticCurveTo(0, -54.2, 2.2, -55.6);
    context.quadraticCurveTo(3.2, -56.8, 0, -59.6);
    context.fill();

    context.strokeStyle = "rgba(54,38,33,.6)";
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(0, -55.2);
    context.lineTo(0, -53.7);
    context.quadraticCurveTo(-2, -52.1, -3.4, -53.3);
    context.moveTo(0, -53.7);
    context.quadraticCurveTo(2, -52.1, 3.4, -53.3);
    context.stroke();

    context.strokeStyle = "rgba(80,54,45,.35)";
    context.lineWidth = 0.75;
    [-1, 1].forEach((dir) => {
      [0, 2.5].forEach((offset, index) => {
        context.beginPath();
        context.moveTo(dir * 8, -57 + offset * 0.2);
        context.quadraticCurveTo(dir * 16, -58 + index * 2.2, dir * 20, -56.5 + index * 2.8);
        context.stroke();
      });
    });

    context.globalAlpha = 0.18;
    drawEllipse(context, -16, -55.5, 4.2, 2.4, "#e88a7c");
    drawEllipse(context, 16, -55.5, 4.2, 2.4, "#e88a7c");
    context.globalAlpha = 1;

    context.strokeStyle = cat.collar;
    context.lineWidth = 3.4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-12, -49);
    context.quadraticCurveTo(0, -45.5, 12, -49);
    context.stroke();
    drawEllipse(context, 0, -45.7, 3, 3, "#ffd66f");
  }

  function drawCat(context, cat, x, y, opts = {}) {
    const scale = opts.scale || 1;
    const squash = opts.squash == null ? 1 : opts.squash;
    const stretch = opts.stretch || 1;
    const rotation = opts.rotation || 0;
    const time = opts.time || 0;
    const charge = opts.charge || 0;
    const mood = opts.mood || "idle";
    const seed = cat.seed || 0;
    const blink = opts.blink == null
      ? ((time + seed) % 4.4 < 0.13)
      : opts.blink;
    const breathe = 1 + Math.sin(time * 2.2 + seed) * 0.012;

    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    if (charge > 0) {
      context.translate(Math.sin(time * 53) * charge * 0.55, 0);
    }
    context.scale(
      scale * (1 + (1 - squash) * 0.62),
      scale * squash * stretch * breathe
    );

    const drawOpts = { time, charge, blink, mood };
    if (cat.redPanda) drawRedPanda(context, cat, drawOpts);
    else drawHouseCat(context, cat, drawOpts);

    context.restore();
  }

  function drawStaticCatAvatar(targetCanvas, cat) {
    if (!targetCanvas) return;
    const context = targetCanvas.getContext("2d");
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    context.clearRect(0, 0, width, height);

    const scale = width / 128;
    context.save();
    context.scale(scale, scale);
    context.globalAlpha = 0.12;
    drawEllipse(context, 64, 113, 31, 8, "#72514e");
    context.globalAlpha = 1;
    drawCat(context, cat, 64, 113, {
      scale: 0.94,
      time: cat.seed * 0.8,
      blink: false,
      squash: 1,
      mood: "idle",
    });
    context.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Platform + world                                                    */
  /* ------------------------------------------------------------------ */

  function makePlatform(x, y, width, paletteIndex, step) {
    return {
      x,
      y,
      width,
      depth: 30,
      palette: PALETTES[paletteIndex % PALETTES.length],
      paletteIndex: paletteIndex % PALETTES.length,
      bounce: 0,
      step,
    };
  }

  function generateAhead(count = 4) {
    while (state.platforms.length <= state.currentIndex + count) {
      const last = state.platforms[state.platforms.length - 1];
      const step = state.platforms.length;
      const difficulty = clamp(step / 32, 0, 1);
      const gap = rand(158 + difficulty * 12, 208 + difficulty * 46);
      const width = Math.max(122, 166 - step * 1.18);
      const y = clamp(
        SURFACE_Y + rand(-33, 31) - (step % 4 === 0 ? 9 : 0),
        SURFACE_Y - 46,
        SURFACE_Y + 36
      );
      let paletteIndex = Math.floor(rand(0, PALETTES.length));
      if (last && paletteIndex === last.paletteIndex) {
        paletteIndex = (paletteIndex + 2) % PALETTES.length;
      }
      state.platforms.push(makePlatform(last.x + gap, y, width, paletteIndex, step));
    }
  }

  function resetWorld() {
    const first = makePlatform(300, SURFACE_Y, 176, 0, 0);
    state.platforms = [first];
    state.currentIndex = 0;
    state.player.x = first.x;
    state.player.y = first.y;
    state.player.power = 0;
    state.player.charging = false;
    state.player.rotation = 0;
    state.phase = "idle";
    state.chargeElapsed = 0;
    state.jump = null;
    state.fall = null;
    state.landingTimer = 0;
    state.skillUsed = false;
    state.effects = [];
    state.floats = [];
    state.rings = [];
    state.shake = 0;
    state.cameraFocusX = first.x;
    state.sceneOffsetTarget = state.screen === "home" ? view.homeOffset : 0;
    state.sceneOffset = state.sceneOffsetTarget;
    const homeAnchor = view.shortLandscape ? 0.265 : 0.47;
    const anchor = state.screen === "home" ? homeAnchor : 0.195;
    state.cameraX = first.x - view.vw * anchor;
    generateAhead(5);
  }

  function resetRun() {
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.perfects = 0;
    state.jumps = 0;
    state.tutorialDone = false;
    state.newUnlock = false;
  }

  function currentPlatform() {
    return state.platforms[state.currentIndex] || state.platforms[0];
  }

  function nextPlatform() {
    return state.platforms[state.currentIndex + 1] || null;
  }

  function playerGroundY() {
    const platform = currentPlatform();
    if (!platform) return state.player.y;
    if (state.phase === "jumping" && state.jump) {
      return lerp(state.jump.startY, state.jump.endY, state.jump.t || 0);
    }
    return state.player.y;
  }

  /* ------------------------------------------------------------------ */
  /* Input and game flow                                                 */
  /* ------------------------------------------------------------------ */

  function setScreen(screen) {
    state.screen = screen;
    app.dataset.screen = screen;
    el.homeScreen.classList.toggle("is-active", screen === "home");
    el.gameScreen.classList.toggle("is-active", screen === "playing" || screen === "gameover");
    if (screen === "home") {
      state.sceneOffsetTarget = view.homeOffset;
    } else {
      state.sceneOffsetTarget = 0;
    }
  }

  function updateHud() {
    el.scoreValue.textContent = String(state.score);
    el.bestValue.textContent = String(Math.max(save.best, state.score));
  }

  function startRun() {
    audio.init();
    audio.click();
    closeModal(el.gameoverOverlay);
    closeModal(el.pauseOverlay);
    closeModal(el.settingsOverlay);
    state.paused = false;
    setScreen("playing");
    resetRun();
    resetWorld();
    updateHud();
    el.tutorial.classList.remove("is-hidden");
    el.comboBadge.classList.remove("is-visible");
    el.perfectFlash.classList.remove("is-show");
    updateSkillStatus();
    haptic(8);
  }

  function goHome() {
    audio.stopCharge();
    state.paused = false;
    closeModal(el.gameoverOverlay);
    closeModal(el.pauseOverlay);
    closeModal(el.settingsOverlay);
    setScreen("home");
    resetRun();
    resetWorld();
    updateHud();
    el.comboBadge.classList.remove("is-visible");
    el.tutorial.classList.add("is-hidden");
    updateSkillStatus();
    renderCatStrip();
  }

  function startCharge() {
    if (state.screen !== "playing" || state.paused || state.phase !== "idle") return;
    audio.init();
    state.phase = "charging";
    state.chargeElapsed = 0;
    state.chargeEmit = 0;
    state.player.power = 0;
    state.player.charging = true;
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
    state.player.charging = false;
    audio.stopCharge();
  }

  function releaseCharge() {
    if (state.phase !== "charging" || state.screen !== "playing" || state.paused) return;
    state.phase = "idle";
    state.player.charging = false;
    const power = clamp(state.player.power, 0.025, 1);
    beginJump(power);
  }

  function chargeDuration() {
    const cat = getCat();
    if (save.skills && cat.skillType === "slow") return BASE_CHARGE_MS * 1.3;
    return BASE_CHARGE_MS;
  }

  function beginJump(power) {
    const target = nextPlatform();
    if (!target) return;
    const distance = MIN_DIST + (MAX_DIST - MIN_DIST) * Math.pow(power, 1.1);
    const startX = state.player.x;
    const startY = state.player.y;
    state.jump = {
      startX,
      startY,
      endY: target.y,
      landX: startX + distance,
      t: 0,
      elapsed: 0,
      duration: 0.37 + power * 0.31,
      height: 94 + power * 82,
      power,
    };
    state.phase = "jumping";
    state.tutorialDone = true;
    state.player.rotation = 0;
    el.tutorial.classList.add("is-hidden");
    audio.jump(power);
    audio.stopCharge();
    haptic(10);
    spawnDust(startX, startY, 7, 0.75);
    addRing(startX, startY, "rgba(255,255,255,.55)", 34, 0.32, 2);
  }

  function updateCharge(dt) {
    state.chargeElapsed += dt * 1000;
    const power = clamp(state.chargeElapsed / chargeDuration(), 0, 1);
    state.player.power = power;
    audio.updateCharge(power);
    if (power >= 1 && state.chargeElapsed - dt * 1000 < chargeDuration()) {
      haptic([8, 32, 8]);
      addRing(state.player.x, state.player.y, "rgba(255,139,120,.62)", 52, 0.42, 2.4);
    }

    state.chargeEmit += dt;
    const emitEvery = save.motion ? 0.24 : 0.115;
    if (power > 0.14 && state.chargeEmit >= emitEvery) {
      state.chargeEmit = 0;
      spawnChargeSpark(power);
    }
  }

  function spawnChargeSpark(power) {
    const side = Math.random() > 0.5 ? 1 : -1;
    state.effects.push({
      x: state.player.x + side * rand(18, 33),
      y: state.player.y - rand(10, 62),
      vx: side * rand(4, 18),
      vy: rand(-36, -17) - power * 16,
      gravity: -10,
      life: rand(0.28, 0.52),
      maxLife: 0.52,
      size: rand(1.5, 3.1) + power * 1.2,
      color: Math.random() > 0.55 ? "#ffd780" : "#ff9a84",
      shape: "spark",
      rotation: rand(0, Math.PI),
      spin: rand(-2, 2),
    });
  }

  function updateJump(dt) {
    const jump = state.jump;
    if (!jump) return;
    jump.elapsed += dt;
    jump.t = clamp(jump.elapsed / jump.duration, 0, 1);
    const t = jump.t;
    state.player.x = lerp(jump.startX, jump.landX, t);
    state.player.y = lerp(jump.startY, jump.endY, t) - Math.sin(Math.PI * t) * jump.height;
    state.player.rotation = Math.sin(Math.PI * t) * 0.045;
    if (t >= 1) {
      state.player.x = jump.landX;
      state.player.y = jump.endY;
      state.player.rotation = 0;
      evaluateLanding();
    }
  }

  function useBlackRescue() {
    const current = currentPlatform();
    state.skillUsed = true;
    state.phase = "landing";
    state.landingTimer = 0.36;
    state.player.x = current.x;
    state.player.y = current.y;
    state.player.rotation = 0;
    state.combo = 0;
    el.comboBadge.classList.remove("is-visible");
    addRing(current.x, current.y, "rgba(242,196,92,.72)", 58, 0.7, 3);
    addFloater("九命护符", current.x, current.y - 128, "#9b7427");
    spawnBurst(current.x, current.y - 22, 18, ["#f2c45c", "#fff2b2", "#d8b55b"], "spark");
    state.cameraFocusX = current.x;
    state.shake = Math.max(state.shake, 6);
    updateSkillStatus();
    updateHud();
    showToast("黑猫叼住你的后颈，把你放回了上一块平台。");
    audio.rescue();
    haptic([14, 40, 14]);
  }

  function useTailRescue(diff) {
    const target = nextPlatform();
    if (!target) return;
    const side = Math.sign(diff) || 1;
    const half = target.width / 2;
    state.skillUsed = true;
    state.player.x = target.x + side * Math.max(0, half - 9);
    state.player.y = target.y;
    addRing(target.x, target.y, "rgba(207,126,77,.7)", 55, 0.66, 3);
    addFloater("尾巴回旋", target.x, target.y - 128, "#b9653e");
    spawnBurst(target.x + side * (half + 2), target.y - 8, 22, ["#cf7e4d", "#4a3531", "#fff4e7"], "petal");
    showToast("小熊猫大尾巴一兜，把这只擦边猫卷回来了。");
    audio.rescue();
    haptic([12, 26, 12]);
  }

  function evaluateLanding() {
    const target = nextPlatform();
    if (!target) return;
    const diff = state.player.x - target.x;
    let half = target.width / 2;
    let perfectRadius = PERFECT_RADIUS;
    const cat = getCat();

    if (save.skills && cat.skillType === "grip") half += 6;
    if (save.skills && cat.skillType === "perfect") perfectRadius += 5;

    const absDiff = Math.abs(diff);

    if (absDiff > half) {
      if (save.skills && cat.skillType === "rescue" && !state.skillUsed) {
        useBlackRescue();
        return;
      }
      if (
        save.skills &&
        cat.skillType === "tail" &&
        !state.skillUsed &&
        absDiff <= half + 25
      ) {
        useTailRescue(diff);
      } else {
        startFall(diff < 0 ? "short" : "long");
        return;
      }
    }

    const perfect = Math.abs(diff) <= perfectRadius;
    state.player.x = clamp(state.player.x, target.x - half + 1, target.x + half - 1);
    state.player.y = target.y;
    state.phase = "landing";
    state.landingTimer = 0.19;
    state.jumps += 1;
    state.currentIndex += 1;
    target.bounce = 1;
    state.cameraFocusX = state.player.x;
    generateAhead(4);

    let points = 1;
    if (perfect) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.perfects += 1;
      points = 2 + Math.min(state.combo, 6);
      if (save.skills && cat.skillType === "bonus") points += 1;
      showCombo();
      showPerfectFlash();
      audio.land(true, state.combo);
      haptic([7, 20, 12]);
      spawnBurst(target.x, target.y - 7, 24, ["#ffd780", "#ff8b78", "#fff4e1", "#9bd9c0"], "spark");
      addRing(target.x, target.y, "rgba(255,180,137,.7)", 62, 0.6, 2.5);
      addFloater(`+${points}`, target.x, target.y - 104, "#cb6f5f");
      state.shake = Math.max(state.shake, 5);
    } else {
      state.combo = 0;
      el.comboBadge.classList.remove("is-visible");
      audio.land(false, 0);
      haptic(7);
      spawnDust(state.player.x, target.y, 9, 1);
      addFloater("+1", state.player.x, target.y - 100, "#8b7772");
      state.shake = Math.max(state.shake, 2.5);
    }

    state.score += points;
    updateHud();
    updateSkillStatus();
    if (state.score > save.best) {
      save.best = state.score;
    }
    persist();

    if (el.scoreValue.animate && !prefersReducedMotion()) {
      el.scoreValue.animate(
        [{ transform: "scale(1.22)", color: "#e66f61" }, { transform: "scale(1)", color: "#49363d" }],
        { duration: 260, easing: "cubic-bezier(.2,1.4,.4,1)" }
      );
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

  function startFall(direction) {
    const target = nextPlatform();
    state.phase = "falling";
    state.fall = {
      elapsed: 0,
      vy: 35,
      spin: direction === "short" ? -1.7 : 1.7,
      drift: direction === "short" ? -24 : 36,
      shown: false,
    };
    state.player.rotation = 0;
    state.combo = 0;
    el.comboBadge.classList.remove("is-visible");
    audio.fail();
    audio.stopCharge();
    haptic([22, 55, 30]);
    addFloater(direction === "short" ? "差一点点" : "飞过去了", target ? target.x : state.player.x, (target ? target.y : state.player.y) - 54, "#9c7774");
    state.shake = Math.max(state.shake, 9);
  }

  function updateFall(dt) {
    if (!state.fall) return;
    state.fall.elapsed += dt;
    state.fall.vy += 1700 * dt;
    state.player.y += state.fall.vy * dt;
    state.player.x += state.fall.drift * dt;
    state.player.rotation += state.fall.spin * dt;
    if (state.fall.elapsed > 0.95 && !state.fall.shown) {
      state.fall.shown = true;
      endRun();
    }
  }

  function endRun() {
    setScreen("gameover");
    state.paused = false;
    el.tutorial.classList.add("is-hidden");
    el.comboBadge.classList.remove("is-visible");
    el.finalScore.textContent = String(state.score);
    el.finalPerfect.textContent = String(state.perfects);
    el.finalCombo.textContent = String(state.maxCombo);
    el.finalJumps.textContent = String(state.jumps);

    const score = state.score;
    let title = "刚出门就回家了";
    let quote = "猫爪还没热，下一局肯定行。";
    if (score >= 3 && score < 10) {
      title = "猫步热身中";
      quote = "方向对了，力度再稳一点。";
    } else if (score >= 10 && score < 24) {
      title = "屋檐小飞侠";
      quote = "这几步，落得很像回事。";
    } else if (score >= 24 && score < 50) {
      title = "云上猫步";
      quote = "软垫、猫爪和风都在帮你。";
    } else if (score >= 50) {
      title = "天台猫王";
      quote = "整片云海都是你的猫抓板。";
    }
    el.resultTitle.textContent = title;
    el.resultQuote.textContent = quote;

    if (state.score > save.best) save.best = state.score;
    const unlockedNow = !save.unlocked && state.perfects >= 10 && state.maxCombo >= 5;
    if (unlockedNow) {
      save.unlocked = true;
      state.newUnlock = true;
      audio.unlock();
      haptic([12, 35, 12, 35, 22]);
      renderCatStrip();
    }
    state.newUnlock = unlockedNow;
    el.unlockNote.hidden = !unlockedNow;
    if (unlockedNow) {
      el.unlockNote.animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 350, delay: 280, fill: "both" }
      );
    }
    persist();
    updateHud();
    updateSkillStatus();
    window.setTimeout(() => {
      if (state.screen === "gameover") openModal(el.gameoverOverlay);
    }, 280);
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
    lastFrame = performance.now();
  }

  function openModal(overlay) {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function updateSkillStatus() {
    const cat = getCat();
    const hasOneShot = cat.skillType === "rescue" || cat.skillType === "tail";
    const show = state.screen === "playing" && save.skills;
    el.skillStatus.classList.toggle("is-visible", show);
    el.skillStatus.classList.toggle("is-spent", hasOneShot && state.skillUsed);
    if (!show) return;
    if (hasOneShot && state.skillUsed) {
      el.skillStatusText.textContent = cat.skillType === "rescue" ? "九命护符 · 已用" : "尾巴回旋 · 已用";
    } else {
      el.skillStatusText.textContent = cat.statusText;
    }
  }

  function openSettings(returnTo) {
    state.settingsReturn = returnTo;
    syncSettings();
    openModal(el.settingsOverlay);
  }

  function closeSettings() {
    closeModal(el.settingsOverlay);
    if (state.settingsReturn === "home") {
      // Stay on the home screen.
    }
  }

  function syncSettings() {
    el.skillsToggle.checked = !!save.skills;
    el.soundToggle.checked = !!save.sound;
    el.hapticsToggle.checked = !!save.haptics;
    el.motionToggle.checked = !!save.motion;
    app.classList.toggle("is-muted", !save.sound);
    app.classList.toggle("skills-off", !save.skills);
    el.miniSkillText.textContent = save.skills ? "技能开" : "技能关";
    el.miniSkillBtn.setAttribute("aria-pressed", save.skills ? "true" : "false");
    el.soundBtn.setAttribute("aria-label", save.sound ? "关闭音效" : "开启音效");
    audio.setMuted(!save.sound);
    updateSkillStatus();
    renderSelectedCopy();
  }

  /* ------------------------------------------------------------------ */
  /* UI rendering                                                        */
  /* ------------------------------------------------------------------ */

  function updateSelectedCard() {
    const cat = getCat();
    el.selectedName.textContent = cat.name;
    el.skillName.textContent = save.skills ? cat.skillName : "技能已关";
    el.skillDesc.textContent = save.skills ? cat.skillDesc : "公平模式：所有猫咪只比脚法，判定完全一致。";
    drawStaticCatAvatar(el.selectedAvatar, cat);
    el.miniSkillText.textContent = save.skills ? "技能开" : "技能关";
    el.miniSkillBtn.setAttribute("aria-pressed", save.skills ? "true" : "false");
  }

  function renderSelectedCopy() {
    updateSelectedCard();
    document.querySelectorAll(".cat-card").forEach((card) => {
      const isSelected = card.dataset.cat === save.selected;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  }

  function renderCatStrip() {
    if (!el.catStrip) return;
    el.catStrip.innerHTML = "";
    CATS.forEach((cat) => {
      const locked = cat.id === "redpanda" && !save.unlocked;
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

      const avatar = document.createElement("canvas");
      avatar.width = 128;
      avatar.height = 128;
      avatar.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "cat-name";
      name.textContent = locked ? "神秘猫" : cat.shortName;

      const lock = document.createElement("span");
      lock.className = "cat-lock";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "锁";

      card.append(avatar, name, lock);
      el.catStrip.appendChild(card);
      drawStaticCatAvatar(avatar, cat);
    });
    updateSelectedCard();
    updateHomeStageOffset();
  }

  function selectCat(catId) {
    const cat = getCat(catId);
    if (!cat) return;
    if (cat.id === "redpanda" && !save.unlocked) {
      showToast("小熊猫还在云后面。单局拿到 10 次 Perfect、最高 5 连击，它就会出来。", 3200);
      audio.click();
      return;
    }
    save.selected = cat.id;
    persist();
    audio.init();
    audio.click();
    renderSelectedCopy();
    updateSkillStatus();
    haptic(6);
    const card = document.querySelector(`.cat-card[data-cat="${cat.id}"]`);
    if (card && card.scrollIntoView) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    resetWorld();
  }

  function toggleSkills() {
    save.skills = !save.skills;
    persist();
    syncSettings();
    updateSkillStatus();
    if (save.skills) {
      showToast("猫咪技能已开启，每只猫都开始有点小脾气。");
    } else {
      showToast("公平模式：技能全关，只剩脚法。");
    }
    audio.click();
    haptic(5);
  }

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */

  function spawnDust(x, y, count, strength) {
    if (save.motion) count = Math.ceil(count / 2);
    for (let i = 0; i < count; i += 1) {
      state.effects.push({
        x: x + rand(-16, 16),
        y: y + rand(-2, 4),
        vx: rand(-40, 40) * strength,
        vy: rand(-36, -8) * strength,
        gravity: 110,
        life: rand(0.32, 0.62),
        maxLife: 0.62,
        size: rand(2.5, 6),
        color: i % 3 === 0 ? "#fff8ec" : "#e8cdb9",
        shape: "dot",
        rotation: 0,
        spin: 0,
      });
    }
  }

  function spawnBurst(x, y, count, colors, shape = "dot") {
    if (save.motion) count = Math.ceil(count / 2);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-Math.PI, Math.PI);
      const speed = rand(34, 132);
      state.effects.push({
        x: x + rand(-6, 6),
        y: y + rand(-9, 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(12, 52),
        gravity: 155,
        life: rand(0.4, 0.9),
        maxLife: 0.9,
        size: rand(2, shape === "spark" ? 6 : 4.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        rotation: rand(0, Math.PI),
        spin: rand(-4, 4),
      });
    }
  }

  function addRing(x, y, color, maxRadius, life, width) {
    state.rings.push({
      x,
      y,
      color,
      radius: 8,
      maxRadius,
      life,
      maxLife: life,
      width,
    });
  }

  function addFloater(text, x, y, color) {
    state.floats.push({
      text,
      x,
      y,
      color,
      life: 1.15,
      maxLife: 1.15,
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
  }

  /* ------------------------------------------------------------------ */
  /* Drawing                                                             */
  /* ------------------------------------------------------------------ */

  function computeHomeOffset() {
    if (!el.homeBottom || !el.homeScreen || !view.height || !view.scale) return -112;
    if (view.shortLandscape) return -112;
    const styles = window.getComputedStyle(el.homeScreen);
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const sheetTop = view.height - paddingBottom - el.homeBottom.offsetHeight;
    const wantedFeet = (sheetTop - 16) / view.scale;
    return Math.min(-112, wantedFeet - SURFACE_Y);
  }

  function updateHomeStageOffset() {
    view.homeOffset = computeHomeOffset();
    if (state.screen === "home" && state.phase === "idle") {
      state.sceneOffsetTarget = view.homeOffset;
    }
  }

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
    const designHeight = view.shortLandscape ? 760 : DESIGN_H;
    view.scale = height / designHeight;
    view.vw = width / view.scale;
    view.homeOffset = computeHomeOffset();
    if (state.screen === "home") {
      state.sceneOffsetTarget = view.homeOffset;
    }
    if (!state.cameraFocusX) {
      state.cameraFocusX = state.player.x;
    }
  }

  function drawBackdrop() {
    const width = view.width;
    const height = view.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#fff8e9");
    gradient.addColorStop(0.46, "#ffecd9");
    gradient.addColorStop(0.78, "#f8e3ce");
    gradient.addColorStop(1, "#f1ddc8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const sun = ctx.createRadialGradient(
      width * 0.82,
      height * 0.11,
      2,
      width * 0.82,
      height * 0.11,
      Math.max(width, height) * 0.34
    );
    sun.addColorStop(0, "rgba(255, 246, 205, .92)");
    sun.addColorStop(0.35, "rgba(255, 226, 186, .52)");
    sun.addColorStop(1, "rgba(255, 226, 186, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);

    const bloom = ctx.createRadialGradient(
      width * 0.12,
      height * 0.3,
      10,
      width * 0.12,
      height * 0.3,
      width * 0.4
    );
    bloom.addColorStop(0, "rgba(209, 236, 224, .48)");
    bloom.addColorStop(1, "rgba(209, 236, 224, 0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCloud(context, x, y, size, alpha, color = "rgba(255,251,242,.72)") {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    drawEllipse(context, x, y, size, size * 0.47, color);
    drawEllipse(context, x - size * 0.42, y + size * 0.08, size * 0.38, size * 0.33, color);
    drawEllipse(context, x + size * 0.39, y + size * 0.11, size * 0.34, size * 0.3, color);
    drawEllipse(context, x - size * 0.1, y - size * 0.18, size * 0.37, size * 0.36, color);
    context.restore();
  }

  function drawWorldBackdrop(context) {
    const vw = view.vw;
    const time = state.ambient;
    const camera = state.cameraX;

    drawCloud(
      context,
      ((vw * 0.16 + time * 2.2 - camera * 0.035) % (vw + 260) + vw + 260) % (vw + 260) - 130,
      176,
      51,
      0.35
    );
    drawCloud(
      context,
      ((vw * 0.77 + time * 1.45 - camera * 0.02) % (vw + 320) + vw + 320) % (vw + 320) - 160,
      260,
      71,
      0.26
    );
    drawCloud(
      context,
      ((vw * 0.48 + time * 3.1 - camera * 0.055) % (vw + 300) + vw + 300) % (vw + 300) - 150,
      118,
      38,
      0.22,
      "rgba(255,255,255,.52)"
    );

    // Gentle hills sit behind the platforms.
    const hillShift = (camera * 0.06) % 500;
    const hillBase = state.sceneOffset * 0.2 + 762;
    context.save();
    context.fillStyle = "rgba(213, 230, 211, .42)";
    context.beginPath();
    context.moveTo(-180, 900);
    context.lineTo(-180, hillBase + 18);
    context.bezierCurveTo(-40, hillBase - 62, 130, hillBase - 66, 270, hillBase + 2);
    context.bezierCurveTo(420, hillBase + 74, 630, hillBase - 38, 880, hillBase + 12);
    context.lineTo(880, 900);
    context.closePath();
    context.fill();

    context.fillStyle = "rgba(238, 207, 183, .45)";
    context.beginPath();
    context.moveTo(-100 - hillShift, 900);
    context.lineTo(-100 - hillShift, hillBase + 100);
    context.bezierCurveTo(60 - hillShift, hillBase + 42, 250 - hillShift, hillBase + 58, 420 - hillShift, hillBase + 112);
    context.bezierCurveTo(620 - hillShift, hillBase + 174, 760 - hillShift, hillBase + 68, 960 - hillShift, hillBase + 96);
    context.lineTo(960 - hillShift, 900);
    context.closePath();
    context.fill();
    context.restore();

    // Tiny drifting pollen.
    context.save();
    for (let i = 0; i < 14; i += 1) {
      const baseX = (i * 97 + 37) % (vw + 80);
      const x = baseX + Math.sin(time * 0.32 + i) * 9 - 20;
      const y = 270 + ((i * 143 + 60) % 430) + Math.sin(time * 0.5 + i * 1.7) * 7;
      const radius = 1.2 + (i % 3) * 0.7;
      context.globalAlpha = 0.12 + (i % 4) * 0.035;
      drawEllipse(context, x, y, radius, radius, i % 3 === 0 ? "#d8907e" : "#fffaf0");
    }
    context.restore();
  }

  function diamondPath(context, x, y, width, depth) {
    context.beginPath();
    context.moveTo(x, y - depth);
    context.lineTo(x + width / 2, y);
    context.lineTo(x, y + depth);
    context.lineTo(x - width / 2, y);
    context.closePath();
  }

  function drawPlatform(context, platform, isNext) {
    const x = platform.x - state.cameraX;
    const y = platform.y + state.sceneOffset + platform.bounce * 5;
    const width = platform.width;
    const depth = platform.depth;
    const extrusion = 24;
    const palette = platform.palette;

    if (x < -width || x > view.vw + width) return;

    context.save();

    if (isNext && state.screen === "playing") {
      const pulse = 0.55 + Math.sin(state.ambient * 2.1) * 0.09;
      const halo = context.createRadialGradient(x, y + 2, 5, x, y + 2, width * 0.72);
      halo.addColorStop(0, `rgba(255,255,255,${0.18 * pulse})`);
      halo.addColorStop(0.48, hexToRgba(palette.glow, 0.15 * pulse));
      halo.addColorStop(1, hexToRgba(palette.glow, 0));
      context.fillStyle = halo;
      ellipsePath(context, x, y + 7, width * 0.73, width * 0.4);
      context.fill();
    }

    // Soft ground shadow.
    context.globalAlpha = 0.11;
    drawEllipse(context, x + 3, y + 43, width * 0.54, 13, "#7b5650");
    context.globalAlpha = 1;

    // Extruded sides.
    context.fillStyle = palette.side;
    context.beginPath();
    context.moveTo(x - width / 2, y);
    context.lineTo(x, y + depth);
    context.lineTo(x, y + depth + extrusion);
    context.lineTo(x - width / 2, y + extrusion);
    context.closePath();
    context.fill();

    context.fillStyle = palette.dark;
    context.beginPath();
    context.moveTo(x, y + depth);
    context.lineTo(x + width / 2, y);
    context.lineTo(x + width / 2, y + extrusion);
    context.lineTo(x, y + depth + extrusion);
    context.closePath();
    context.fill();

    // Thin front lip.
    context.strokeStyle = "rgba(255,255,255,.24)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - width / 2, y + 1);
    context.lineTo(x, y + depth + 1);
    context.lineTo(x + width / 2, y + 1);
    context.stroke();

    // Pastel top.
    const topGradient = context.createLinearGradient(x, y - depth, x, y + depth);
    topGradient.addColorStop(0, palette.top);
    topGradient.addColorStop(0.58, palette.top);
    topGradient.addColorStop(1, palette.edge);
    context.fillStyle = topGradient;
    diamondPath(context, x, y, width, depth);
    context.fill();
    context.lineJoin = "round";
    context.strokeStyle = "rgba(255,255,255,.34)";
    context.lineWidth = 2.1;
    context.stroke();

    // Soft inner rim.
    diamondPath(context, x, y, width * 0.84, depth * 0.78);
    context.strokeStyle = "rgba(255,255,255,.23)";
    context.lineWidth = 1.2;
    context.stroke();

    // Paw stamp.
    context.save();
    context.translate(x, y + 5);
    context.globalAlpha = 0.12;
    drawEllipse(context, 0, 3.5, 7.5, 6, "#5e3f42");
    [-8, -3, 3, 8].forEach((toeX, index) => {
      drawEllipse(context, toeX, -5 - Math.abs(index - 1.5) * 0.7, 2.6, 3.4, "#5e3f42", toeX * 0.02);
    });
    context.restore();

    // Side stitch.
    context.strokeStyle = "rgba(255,255,255,.26)";
    context.lineWidth = 1.3;
    context.setLineDash([3, 5]);
    context.beginPath();
    context.moveTo(x - width / 2 + 8, y + 8);
    context.lineTo(x - 1, y + depth + 7);
    context.stroke();
    context.setLineDash([]);

    // Tabby's aim reticle.
    if (
      isNext &&
      state.screen === "playing" &&
      save.skills &&
      getCat().skillType === "aim" &&
      state.phase === "charging"
    ) {
      const alpha = 0.58 + state.player.power * 0.34;
      context.save();
      context.translate(x, y + 2);
      context.scale(1, 0.42);
      context.strokeStyle = `rgba(202,91,77,${alpha})`;
      context.shadowColor = "rgba(255,248,236,.75)";
      context.shadowBlur = 6;
      context.lineWidth = 2;
      context.setLineDash([4, 5]);
      context.beginPath();
      context.arc(0, 0, 14 + Math.sin(state.ambient * 4) * 1.5, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.arc(0, 0, 3.4, 0, Math.PI * 2);
      context.fillStyle = `rgba(202,91,77,${alpha})`;
      context.fill();
      [-1, 1].forEach((dir) => {
        context.beginPath();
        context.moveTo(dir * 9, 0);
        context.lineTo(dir * 18, 0);
        context.moveTo(0, dir * 9);
        context.lineTo(0, dir * 18);
        context.stroke();
      });
      context.restore();
    }

    context.restore();
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

  function drawPlayer(context) {
    const cat = getCat();
    const sx = state.player.x - state.cameraX;
    const sy = state.player.y + state.sceneOffset;
    const groundY = playerGroundY() + state.sceneOffset;
    const isFalling = state.phase === "falling";
    const isJumping = state.phase === "jumping";
    const isCharging = state.phase === "charging";
    const power = state.player.power;
    const airHeight = Math.max(0, groundY - sy);
    let squash = 1;
    let stretch = 1;

    if (isCharging) {
      squash = 1 - power * 0.19;
      stretch = 1 + power * 0.045;
    } else if (isJumping && state.jump) {
      squash = 1 + Math.sin(Math.PI * state.jump.t) * 0.035;
      stretch = 1 + Math.sin(Math.PI * state.jump.t) * 0.035;
    } else if (state.phase === "landing") {
      squash = 1 - 0.08 * clamp(state.landingTimer / 0.19, 0, 1);
    }

    // Shadow follows the platform rather than the airborne cat.
    context.save();
    context.globalAlpha = state.phase === "falling"
      ? 0
      : clamp(0.16 - airHeight / 1000, 0.04, 0.16);
    drawEllipse(
      context,
      sx,
      groundY + 3,
      24 + Math.min(airHeight, 120) * 0.06,
      7.5,
      "#674844"
    );
    context.restore();

    if (isCharging) {
      const pulse = 1 + Math.sin(state.ambient * 5) * 0.045;
      context.save();
      context.globalAlpha = 0.2 + power * 0.24;
      context.strokeStyle = "#ff8b78";
      context.lineWidth = 1.6;
      context.setLineDash([3, 6]);
      context.beginPath();
      context.ellipse(sx, groundY + 4, (36 + power * 12) * pulse, 10 + power * 3, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.restore();
    }

    if (isJumping) {
      context.save();
      context.globalAlpha = 0.2;
      context.strokeStyle = "#fff7eb";
      context.lineWidth = 2;
      context.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        context.beginPath();
        context.moveTo(sx - 25 - i * 9, sy - 28 - i * 8);
        context.lineTo(sx - 43 - i * 9, sy - 33 - i * 8);
        context.stroke();
      }
      context.restore();
    }

    drawCat(context, cat, sx, sy, {
      scale: 1.09,
      squash,
      stretch,
      rotation: state.player.rotation,
      time: state.ambient,
      charge: isCharging ? power : 0,
      mood: isFalling ? "idle" : (state.phase === "landing" && state.combo > 0 ? "happy" : "idle"),
      blink: isFalling ? false : null,
    });

    if (isCharging) drawChargeMeter(context, sx, sy - 112, power);
  }

  function drawChargeMeter(context, x, y, power) {
    const width = 96;
    const height = 10;
    const left = x - width / 2;
    const top = y + 5;
    const hue = 149 - power * 142;
    const pulse = power > 0.92 ? 1 + Math.sin(state.ambient * 14) * 0.035 : 1;

    context.save();
    context.translate(x, top + height / 2);
    context.scale(pulse, pulse);
    context.translate(-x, -(top + height / 2));

    context.globalAlpha = 0.95;
    context.shadowColor = power > 0.82 ? "rgba(255,139,120,.30)" : "rgba(100,68,62,.16)";
    context.shadowBlur = power > 0.82 ? 15 : 10;
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
    context.globalAlpha = 0.22;
    context.fillStyle = "#ffffff";
    context.fillRect(left, top + 1.5, width * power, 2.2);
    context.restore();

    context.strokeStyle = "rgba(255,255,255,.62)";
    context.lineWidth = 0.75;
    [0.25, 0.5, 0.75].forEach((tick) => {
      context.beginPath();
      context.moveTo(left + width * tick, top + 1.4);
      context.lineTo(left + width * tick, top + height - 1.4);
      context.stroke();
    });

    context.strokeStyle = "rgba(255,255,255,.43)";
    context.lineWidth = 1;
    roundedRectPath(context, left, top, width, height, height / 2);
    context.stroke();

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

    context.globalAlpha = 0.84;
    context.fillStyle = "#92746a";
    context.font = '800 8.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "center";
    context.fillText(
      power >= 0.995 ? `满力 · ${Math.round(power * 100)}%` : `蓄力 · ${Math.round(power * 100)}%`,
      x,
      y - 2
    );
    context.restore();
  }

  function drawEffects(context) {
    const offsetX = state.cameraX;
    const offsetY = state.sceneOffset;

    state.rings.forEach((ring) => {
      const alpha = clamp(ring.life / ring.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha * 0.82;
      context.strokeStyle = ring.color;
      context.lineWidth = ring.width;
      context.beginPath();
      context.ellipse(ring.x - offsetX, ring.y + offsetY + 2, ring.radius, ring.radius * 0.38, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });

    state.effects.forEach((particle) => {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha;
      const x = particle.x - offsetX;
      const y = particle.y + offsetY;
      if (particle.shape === "spark") {
        drawSpark(context, x, y, particle.size, particle.color, particle.rotation);
      } else if (particle.shape === "petal") {
        context.translate(x, y);
        context.rotate(particle.rotation);
        drawEllipse(context, 0, 0, particle.size * 0.7, particle.size * 1.25, particle.color);
      } else {
        drawEllipse(context, x, y, particle.size, particle.size * 0.8, particle.color);
      }
      context.restore();
    });

    state.floats.forEach((floater) => {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = floater.color;
      context.font = '900 15px "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif';
      context.textAlign = "center";
      context.fillText(floater.text, floater.x - offsetX, floater.y + offsetY);
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

  function render() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    drawBackdrop();

    const shakeEnabled = !save.motion && !prefersReducedMotion();
    const shakeX = shakeEnabled ? rand(-state.shake, state.shake) * 0.42 : 0;
    const shakeY = shakeEnabled ? rand(-state.shake, state.shake) * 0.28 : 0;

    ctx.save();
    ctx.scale(view.scale, view.scale);
    ctx.translate(shakeX, shakeY);
    drawWorldBackdrop(ctx);

    const sortedPlatforms = state.platforms
      .map((platform, index) => ({ platform, index }))
      .filter(({ platform }) => {
        const x = platform.x - state.cameraX;
        return x > -200 && x < view.vw + 200;
      })
      .sort((a, b) => a.platform.y - b.platform.y);

    sortedPlatforms.forEach(({ platform, index }) => {
      drawPlatform(ctx, platform, index === state.currentIndex + 1);
    });

    drawPlayer(ctx);
    drawEffects(ctx);
    ctx.restore();

    // A very soft vignette keeps the warm scene from feeling flat.
    const vignette = ctx.createRadialGradient(
      view.width / 2,
      view.height * 0.44,
      view.height * 0.25,
      view.width / 2,
      view.height * 0.5,
      Math.max(view.width, view.height) * 0.78
    );
    vignette.addColorStop(0, "rgba(91,63,55,0)");
    vignette.addColorStop(1, "rgba(91,63,55,.075)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, view.width, view.height);
  }

  /* ------------------------------------------------------------------ */
  /* Loop                                                                */
  /* ------------------------------------------------------------------ */

  function updateCamera(dt) {
    const homeAnchor = view.shortLandscape ? 0.265 : 0.47;
    const anchor = state.screen === "home" ? homeAnchor : 0.195;
    const target = state.cameraFocusX - view.vw * anchor;
    const smoothing = 1 - Math.exp(-dt * 4.1);
    state.cameraX = lerp(state.cameraX, target, smoothing);
  }

  function updateSceneOffset(dt) {
    const smoothing = 1 - Math.exp(-dt * 5.4);
    state.sceneOffset = lerp(state.sceneOffset, state.sceneOffsetTarget, smoothing);
  }

  function update(dt) {
    state.time += dt;
    state.ambient += dt;
    updateCamera(dt);
    updateSceneOffset(dt);
    updateEffects(dt);

    state.platforms.forEach((platform) => {
      platform.bounce = Math.max(0, platform.bounce - dt * 4.8);
    });

    if (state.screen === "playing" && !state.paused) {
      if (state.phase === "charging") {
        updateCharge(dt);
      } else if (state.phase === "jumping") {
        updateJump(dt);
      } else if (state.phase === "falling") {
        updateFall(dt);
      } else if (state.phase === "landing") {
        state.landingTimer -= dt;
        if (state.landingTimer <= 0) state.phase = "idle";
      }
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    update(dt);
    render();
    window.requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    el.catStrip.addEventListener("click", (event) => {
      const card = event.target.closest(".cat-card");
      if (!card) return;
      selectCat(card.dataset.cat);
    });

    el.startBtn.addEventListener("click", startRun);
    el.retryBtn.addEventListener("click", () => {
      audio.init();
      audio.click();
      startRun();
    });
    el.miniSkillBtn.addEventListener("click", toggleSkills);

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

    el.pauseBtn.addEventListener("click", pauseGame);
    el.resumeBtn.addEventListener("click", resumeGame);
    el.pauseHomeBtn.addEventListener("click", goHome);
    el.resultHomeBtn.addEventListener("click", goHome);
    el.resultCatBtn.addEventListener("click", () => {
      closeModal(el.gameoverOverlay);
      setScreen("home");
      resetRun();
      resetWorld();
      el.tutorial.classList.add("is-hidden");
      updateSkillStatus();
      renderCatStrip();
      window.setTimeout(() => {
        const selected = document.querySelector(".cat-card.is-selected");
        if (selected && selected.scrollIntoView) {
          selected.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 90);
    });

    el.settingsBtnHome.addEventListener("click", () => {
      audio.init();
      audio.click();
      openSettings("home");
    });
    el.pauseSettingsBtn.addEventListener("click", () => openSettings("pause"));
    el.settingsCloseBtn.addEventListener("click", closeSettings);
    el.settingsDoneBtn.addEventListener("click", closeSettings);
    el.settingsOverlay.addEventListener("click", (event) => {
      if (event.target === el.settingsOverlay) closeSettings();
    });

    el.skillsToggle.addEventListener("change", () => {
      save.skills = el.skillsToggle.checked;
      persist();
      syncSettings();
      updateSkillStatus();
      audio.click();
      showToast(save.skills ? "猫咪技能已开启。" : "公平模式：技能全关，只剩脚法。");
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
      if (state.screen !== "playing" || state.phase !== "idle" || state.paused) return;
      event.preventDefault();
      startCharge();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some older browsers do not support pointer capture here.
      }
    });

    window.addEventListener("pointerup", (event) => {
      if (state.phase === "charging") {
        event.preventDefault();
        releaseCharge();
      }
    }, { passive: false });

    window.addEventListener("pointercancel", () => {
      cancelCharge();
    });

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
          if (state.phase === "idle") startCharge();
        } else if (state.paused) {
          event.preventDefault();
          resumeGame();
        }
      }

      if (event.code === "Escape") {
        if (el.settingsOverlay.classList.contains("is-open")) {
          closeSettings();
        } else if (state.paused) {
          resumeGame();
        } else if (state.screen === "playing") {
          pauseGame();
        }
      }

      if (state.screen === "home" && !event.repeat && (event.code === "ArrowRight" || event.code === "ArrowLeft")) {
        event.preventDefault();
        const available = CATS.filter((cat) => cat.id !== "redpanda" || save.unlocked);
        const current = available.findIndex((cat) => cat.id === save.selected);
        const next = (current + (event.code === "ArrowRight" ? 1 : -1) + available.length) % available.length;
        selectCat(available[next].id);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "Space" && state.phase === "charging") {
        event.preventDefault();
        releaseCharge();
      }
    });

    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", () => {
      window.setTimeout(resize, 90);
    });

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(app);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.screen === "playing" && !state.paused) {
        pauseGame();
      }
    });

    window.addEventListener("blur", () => {
      if (state.screen === "playing" && !state.paused) pauseGame();
    });

    document.addEventListener("pointerdown", () => audio.init(), { once: true, passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function boot() {
    resize();
    applyInitialSettings();
    renderCatStrip();
    updateHud();
    resetWorld();
    el.tutorial.classList.add("is-hidden");
    el.gameoverOverlay.setAttribute("aria-hidden", "true");
    el.pauseOverlay.setAttribute("aria-hidden", "true");
    el.settingsOverlay.setAttribute("aria-hidden", "true");
    bindEvents();
    updateSkillStatus();
    updateHomeStageOffset();
    window.setTimeout(updateHomeStageOffset, 720);
    lastFrame = performance.now();
    window.requestAnimationFrame(loop);

    window.__NYA_DEBUG__ = {
      snapshot() {
        return {
          screen: state.screen,
          phase: state.phase,
          score: state.score,
          combo: state.combo,
          perfects: state.perfects,
          jumps: state.jumps,
          selected: save.selected,
          skills: save.skills,
          best: save.best,
          unlocked: save.unlocked,
          platforms: state.platforms.length,
          playerX: Math.round(state.player.x * 10) / 10,
          playerY: Math.round(state.player.y * 10) / 10,
          currentIndex: state.currentIndex,
          nextX: nextPlatform() ? Math.round(nextPlatform().x * 10) / 10 : null,
          nextWidth: nextPlatform() ? Math.round(nextPlatform().width * 10) / 10 : null,
          gap: nextPlatform() ? Math.round((nextPlatform().x - state.player.x) * 10) / 10 : null,
          chargeDuration: chargeDuration(),
          skillUsed: state.skillUsed,
        };
      },
      getCatIds() {
        return CATS.map((cat) => cat.id);
      },
    };
  }

  function applyInitialSettings() {
    syncSettings();
  }

  boot();
})();
