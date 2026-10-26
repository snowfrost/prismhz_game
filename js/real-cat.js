/* Real painted-cat renderer.
   Uses the AI-generated 3D-figurine kitten art in assets/cats/*.webp.
   Coordinate convention kept from the previous version: the origin sits
   between the paws (feet at y = 0, up is negative).                        */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Sprite canvas: 360 x 300, cat content 276 tall, feet sit 8px above the
     bottom edge. All nine cats share this exact layout.                    */
  const SPRITE_W = 360;
  const SPRITE_H = 300;
  const SPRITE_FEET = 8;          /* distance from sprite bottom to the paws */
  const SPRITE_CAT_H = 276;

  /* On-screen height of a cat at scale 1, in game units.                   */
  const DRAW_H = 100;

  const ASSET_BASE = "catimg/";

  const catImages = Object.create(null);
  const headImages = Object.create(null);
  const faceImages = Object.create(null);
  let pending = 0;

  /* ------------------------------------------------------------------ */
  /* Asset loading                                                       */
  /* ------------------------------------------------------------------ */

  function assetName(cat) {
    if (!cat) return "persian";
    if (cat.asset) return cat.asset;
    if (cat.id === "random") return "mystery";
    return cat.id || "persian";
  }

  function loadImage(map, name, folder) {
    if (map[name]) return map[name];
    const img = new Image();
    const record = { img, ready: false, failed: false };
    pending += 1;
    img.onload = () => {
      record.ready = true;
      pending -= 1;
    };
    img.onerror = () => {
      record.failed = true;
      pending -= 1;
    };
    img.src = ASSET_BASE + folder + name + ".webp";
    map[name] = record;
    return record;
  }

  function preload(names) {
    const list = names && names.length ? names : [
      "persian", "tabby", "orange", "black", "cow",
      "siamese", "redpanda", "mystery", "persian-sit",
    ];
    list.forEach((name) => {
      loadImage(catImages, name, "cats/");
      loadImage(headImages, name, "heads/");
    });
  }

  function spriteOf(cat) {
    return loadImage(catImages, assetName(cat), "cats/");
  }

  /* 表情帧：catimg/face/<fail|win>/<cat>.webp，缺图时静默回退站立图 */
  function faceOf(cat, mood) {
    if (!mood || mood === "normal") return spriteOf(cat);
    const name = assetName(cat);
    const key = mood + "/" + name;
    if (faceImages[key]) return faceImages[key];
    const img = new Image();
    const record = { img, ready: false, failed: false };
    pending += 1;
    img.onload = () => { record.ready = true; pending -= 1; };
    img.onerror = () => { record.failed = true; pending -= 1; };
    img.src = ASSET_BASE + "face/" + mood + "/" + name + ".webp";
    faceImages[key] = record;
    return record;
  }

  function headOf(cat) {
    return loadImage(headImages, assetName(cat), "heads/");
  }

  function assetsReady() {
    return pending === 0;
  }

  /* ------------------------------------------------------------------ */
  /* Pose                                                                */
  /* ------------------------------------------------------------------ */

  function autoBlink(time) {
    const cycle = 4.2;
    const p = (time % cycle) / cycle;
    if (p > 0.94) return Math.sin(((p - 0.94) / 0.06) * Math.PI);
    return 0;
  }

  function buildPose(options) {
    const o = options || {};
    const charge = typeof o.charge === "number" ? clamp(o.charge, 0, 1) : 0;
    /* game.js passes jump progress as airT; air remains supported for callers. */
    const airSource = typeof o.airT === "number" ? o.airT : o.air;
    const air = typeof airSource === "number" ? clamp(airSource, 0, 1) : 0;
    const land = typeof o.land === "number" ? clamp(o.land, 0, 1) : 0;
    const wind = typeof o.wind === "number" ? clamp(o.wind, -1.6, 1.6) : 0;
    const pitch = typeof o.pitch === "number" ? o.pitch : 0;
    const time = typeof o.time === "number" ? o.time : Date.now() / 1000;

    return {
      charge,
      air,
      land,
      wind,
      pitch,
      time,
      breathe: Math.sin(time * 1.9) * 0.009,
      /* One sprite, one continuous deformation timeline — never cross-fade art. */
      squash: clamp(charge * 0.42 + land * 0.7, 0, 1),
      stretch: Math.sin(Math.PI * air) * 0.32,
      falling: !!o.falling,
      mood: o.mood || "normal",
    };
  }

  /* ------------------------------------------------------------------ */
  /* Main draw                                                           */
  /* ------------------------------------------------------------------ */

  function drawPlaceholder(ctx, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = "rgba(240,214,190,.6)";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.42, w * 0.28, h * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.82, w * 0.22, h * 0.19, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCat(ctx, cat, x, y, options) {
    if (!ctx || !cat) return;
    const o = options || {};
    const pose = buildPose(o);
    const scale = typeof o.scale === "number" ? o.scale : 1;
    const mood = o.mood || "normal";
    let sprite = faceOf(cat, mood);
    if (!sprite.ready && mood !== "normal") sprite = spriteOf(cat);

    /* Sprite is always drawn at its native 360x300 aspect so every cat keeps
       the exact same scale and foot line.                                */
    const drawH = DRAW_H * scale * (SPRITE_H / SPRITE_CAT_H);
    const drawW = drawH * (SPRITE_W / SPRITE_H);
    const pxPerUnit = drawH / SPRITE_H;

    ctx.save();
    ctx.translate(x, y);

    /* lean pivots around the hips so the paws stay planted */
    if (pose.pitch) {
      ctx.translate(0, -DRAW_H * 0.28);
      ctx.rotate(clamp(pose.pitch, -0.9, 0.9) * 0.72);
      ctx.translate(0, DRAW_H * 0.28);
    }
    if (pose.wind) ctx.rotate(pose.wind * 0.028);

    /* squash & stretch anchored at the feet */
    const sq = pose.squash;
    const st = pose.stretch;
    const breathe = pose.breathe;
    const stretchX = (1 + sq * 0.13 - st * 0.055) * (1 + breathe);
    const stretchY = (1 - sq * 0.11 + st * 0.06) * (1 + breathe);
    ctx.scale(stretchX, stretchY);

    /* Image is bottom-anchored: its feet line lands exactly on y = 0. */
    const feetOffset = SPRITE_FEET * pxPerUnit;
    const dx = -drawW / 2;
    const dy = -drawH + feetOffset;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    /* Exactly one image per frame: no sleeping-looking ghost layers on landing. */
    if (sprite.ready) {
      ctx.drawImage(sprite.img, dx, dy, drawW, drawH);
    } else {
      drawPlaceholder(ctx, drawW, drawH, 0.85);
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Portraits (cat select screen)                                       */
  /* ------------------------------------------------------------------ */

  function paintPortrait(canvas, cat) {
    if (!canvas || !cat) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const head = headOf(cat);

    ctx.clearRect(0, 0, w, h);

    /* soft colour bloom behind the head */
    const glow = ctx.createRadialGradient(w / 2, h * 0.52, 0, w / 2, h * 0.52, w * 0.62);
    glow.addColorStop(0, "rgba(255,236,212,.85)");
    glow.addColorStop(0.55, "rgba(255,232,208,.34)");
    glow.addColorStop(1, "rgba(255,228,200,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    if (!head.ready) {
      drawFlatHead(ctx, cat, w / 2, h * 0.54, Math.min(w, h) * 0.34);
      return;
    }

    const size = Math.min(w, h) * 0.96;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(head.img, (w - size) / 2, (h - size) / 2 - h * 0.01, size, size);
  }

  function drawFlatHead(ctx, cat, cx, cy, R) {
    const real = (cat && cat.real) || {};
    const card = (cat && cat.card) || {};
    const base = real.base || card.fur || "#e4c9a8";
    const inner = real.innerEar || card.earInner || "#e8aeb2";
    const eye = real.eye || card.eye || "#6ba7c6";
    const nose = real.nose || card.nose || "#e39aa0";

    const k = R / 20;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);

    [-1, 1].forEach((dir) => {
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.moveTo(dir * 6, -8);
      ctx.quadraticCurveTo(dir * 8, -24, dir * 15, -22);
      ctx.quadraticCurveTo(dir * 18, -10, dir * 16, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.moveTo(dir * 8.6, -8.4);
      ctx.quadraticCurveTo(dir * 10.4, -19, dir * 14.4, -18);
      ctx.quadraticCurveTo(dir * 15.8, -11, dir * 14.4, -8.4);
      ctx.closePath();
      ctx.fill();
    });

    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 16.5, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = real.accent || card.furLight || "#f5e6d4";
    ctx.beginPath();
    ctx.ellipse(0, 6.6, 9, 6.4, 0, 0, TAU);
    ctx.fill();

    [-1, 1].forEach((dir) => {
      const ex = dir * 6.8;
      ctx.fillStyle = "#3a2a2c";
      ctx.beginPath();
      ctx.ellipse(ex, -1, 4.2, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = eye;
      ctx.beginPath();
      ctx.ellipse(ex, -0.6, 3.3, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(ex - 1.3, -2.6, 1.4, 1.4, 0, 0, TAU);
      ctx.fill();
    });

    ctx.fillStyle = nose;
    ctx.beginPath();
    ctx.moveTo(-2.2, 4.2);
    ctx.quadraticCurveTo(0, 3.4, 2.2, 4.2);
    ctx.quadraticCurveTo(1.2, 6.6, 0, 6.8);
    ctx.quadraticCurveTo(-1.2, 6.6, -2.2, 4.2);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,50,52,.6)";
    ctx.lineWidth = 0.85;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 6.9);
    ctx.lineTo(0, 8.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 8.6);
    ctx.quadraticCurveTo(-2, 10.5, -3.6, 8.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 8.6);
    ctx.quadraticCurveTo(2, 10.5, 3.6, 8.9);
    ctx.stroke();

    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "#ef8f91";
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.ellipse(dir * 11.6, 6.4, 3.6, 2.1, 0, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function paintRandomPortrait(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const head = headImages.mystery;

    ctx.clearRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    glow.addColorStop(0, "rgba(255,206,140,.34)");
    glow.addColorStop(0.6, "rgba(255,206,140,.1)");
    glow.addColorStop(1, "rgba(255,206,140,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    if (head && head.ready) {
      const size = Math.min(w, h) * 0.96;
      ctx.drawImage(head.img, (w - size) / 2, (h - size) / 2, size, size);
      return;
    }

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = "#ffb84d";
    ctx.font = `bold ${Math.round(w * 0.42)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.strokeStyle = "rgba(255,184,77,.28)";
    ctx.lineWidth = Math.max(2, w * 0.024);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.325, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  /* 结算页：单张表情图居中绘制 */
  function paintFace(canvas, cat, mood) {
    if (!canvas || !cat) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const m = mood || "normal";
    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      const face = faceOf(cat, m);
      const sprite = face.ready ? face : spriteOf(cat);
      if (!sprite.ready) return false;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min((w * 0.96) / SPRITE_W, (h * 0.96) / SPRITE_H);
      const dw = SPRITE_W * scale;
      const dh = SPRITE_H * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sprite.img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return true;
    };

    const first = draw();
    /* 表情图是懒加载的：第一帧可能还是站立图，等图片就绪后再补画一次 */
    if (!first || !faceOf(cat, m).ready) {
      let tries = 0;
      const tick = () => {
        if (faceOf(cat, m).ready) {
          draw();
          return;
        }
        tries += 1;
        if (tries < 180) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
      window.setTimeout(() => { if (faceOf(cat, m).ready && !first) draw(); }, 300);
      window.setTimeout(() => { if (faceOf(cat, m).ready) draw(); }, 900);
    }
  }

  /* Debug helper for standalone sprite sheets */
  function paintBody(canvas, cat) {
    if (!canvas || !cat) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const sprite = spriteOf(cat);
    ctx.clearRect(0, 0, w, h);
    if (!sprite.ready) return;
    const scale = Math.min(w / SPRITE_W, h / SPRITE_H);
    const dw = SPRITE_W * scale;
    const dh = SPRITE_H * scale;
    ctx.drawImage(sprite.img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /* ------------------------------------------------------------------ */
  /* Exports                                                             */
  /* ------------------------------------------------------------------ */

  function portrait(target, cat) {
    if (!target) return;
    if (typeof target.getContext === "function") {
      paintPortrait(target, cat);
      return;
    }
    if (target.canvas) paintPortrait(target.canvas, cat);
  }

  function randomPortrait(target) {
    if (!target) return;
    if (typeof target.getContext === "function") {
      paintRandomPortrait(target);
      return;
    }
    if (target.canvas) paintRandomPortrait(target.canvas);
  }

  window.RealCat = {
    draw: drawCat,
    portrait: portrait,
    catPortrait: portrait,
    body: paintBody,
    face: paintFace,
    randomPortrait: randomPortrait,
    preload: preload,
    assetsReady: assetsReady,
    assetName: assetName,
    metrics: {
      spriteW: SPRITE_W,
      spriteH: SPRITE_H,
      drawH: DRAW_H,
      top: -DRAW_H,
      halfWidth: DRAW_H * (SPRITE_W / SPRITE_H) * 0.5,
    },
  };

  /* Kick off loading immediately so the first frame has art. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => preload());
  } else {
    preload();
  }
})();