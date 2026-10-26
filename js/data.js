/* Shared content for the advanced build. Classic script so file:// still works. */
(function () {
  "use strict";

  const CATS = [
    {
      id: "persian",
      name: "波斯猫",
      shortName: "波斯",
      tagline: "长毛慢脾气,落点很讲究",
      skillName: "从容蓄力",
      skillDesc: "蓄力更慢更稳，远距离更好拿捏。",
      skillType: "slow",
      statusText: "从容蓄力 · 生效中",
      physics: {
        size: 1.1,           // 体型较大
        weight: 1.1,         // 重量较重
        jumpPower: 0.98,     // 跳跃稍弱
        chargeBarLength: 1.1,// 蓄力条长
        chargeSpeed: 0.77,   // 蓄力慢（已由技能控制1.3倍时长，这里等效0.77倍速度）
        airHeight: 1.0       // 标准腾空
      },
      real: {
        base: "#e8d2b8",
        light: "#fff8ec",
        mid: "#d1b493",
        dark: "#94745a",
        accent: "#fffaf2",
        pattern: "#b7987e",
        patternType: "persian",
        eye: "#6fa9c4",
        nose: "#c88f94",
        innerEar: "#d8a4a6",
        whisker: "rgba(96,76,62,.48)",
        fluffy: true,
        earScale: 0.72,
      },
      card: { fur: "#f4e5d4", furDark: "#dfc7af", furLight: "#fffaf0", pattern: "#d8b99d", eye: "#72b5d6", eyeDark: "#234f65", earInner: "#efb4b8", nose: "#db9aa1", collar: "#cf7d8d", seed: 0.6, fluff: true, earSize: 0.82 },
    },
    {
      id: "tabby",
      name: "狸花猫",
      shortName: "狸花",
      tagline: "肌肉线条藏在虎斑里",
      skillName: "猎手直觉",
      skillDesc: "蓄力时会圈出下一块平台的中心。",
      skillType: "aim",
      statusText: "猎手直觉 · 中心可见",
      physics: {
        size: 1.0,           // 标准身材
        weight: 0.95,        // 敏捷轻盈
        jumpPower: 1.05,     // 跳跃力强
        chargeBarLength: 1.0,// 标准蓄力条
        chargeSpeed: 1.0,    // 标准蓄力速度
        airHeight: 1.02      // 腾空略高
      },
      real: {
        base: "#b3875f",
        light: "#f0d7b2",
        mid: "#906946",
        dark: "#5c3f2a",
        accent: "#fff6e7",
        pattern: "#443426",
        patternType: "tabby",
        eye: "#8eb46d",
        nose: "#9e766d",
        innerEar: "#c58f8d",
        whisker: "rgba(70,53,40,.55)",
        fluffy: false,
        earScale: 1,
      },
      card: { fur: "#b89b7c", furDark: "#907456", furLight: "#efe2cd", pattern: "#705a44", eye: "#78b574", eyeDark: "#31542f", earInner: "#dfa1a0", nose: "#c88988", collar: "#7aa78f", seed: 2.1, earSize: 1 },
    },
    {
      id: "orange",
      name: "大橘猫",
      shortName: "大橘",
      tagline: "重量级选手，落地带风",
      skillName: "稳稳落地",
      skillDesc: "踩到平台边缘时，容错会多一点。",
      skillType: "grip",
      statusText: "稳稳落地 · 生效中",
      physics: {
        size: 1.2,           // 体型最大
        weight: 1.15,        // 重量最重
        jumpPower: 0.95,     // 跳跃稍弱
        chargeBarLength: 0.9,// 蓄力条短
        chargeSpeed: 1.05,   // 蓄力略快
        airHeight: 0.98      // 腾空略低
      },
      real: {
        base: "#ea9b52",
        light: "#ffd7a4",
        mid: "#cc7c39",
        dark: "#8f4c1f",
        accent: "#fff6e7",
        pattern: "#a75626",
        patternType: "orange",
        eye: "#c79b43",
        nose: "#b66f62",
        innerEar: "#d1978d",
        whisker: "rgba(89,55,36,.48)",
        fluffy: false,
        earScale: 0.95,
      },
      card: { fur: "#f2a45e", furDark: "#d47c3c", furLight: "#ffd9ad", pattern: "#c76b2f", eye: "#e0a63e", eyeDark: "#674611", earInner: "#f2af9e", nose: "#db8775", collar: "#5fa59d", seed: 4.2, earSize: 0.95 },
    },
    {
      id: "black",
      name: "黑猫",
      shortName: "黑猫",
      tagline: "黑得发蓝，眼睛像灯泡",
      skillName: "九命护符",
      skillDesc: "每局第一次失手，会被叼回上一块平台。",
      skillType: "rescue",
      statusText: "九命护符 · 待命",
      physics: {
        size: 0.95,          // 体型修长
        weight: 0.9,         // 轻盈
        jumpPower: 1.03,     // 跳跃稍强
        chargeBarLength: 1.0,// 标准蓄力条
        chargeSpeed: 1.05,   // 蓄力略快
        airHeight: 1.08      // 腾空高
      },
      real: {
        base: "#27262b",
        light: "#4b4a55",
        mid: "#1d1c21",
        dark: "#0d0d10",
        accent: "#5f5c6b",
        pattern: "#16151a",
        patternType: "black",
        eye: "#d9ad3e",
        nose: "#5f4d50",
        innerEar: "#4b3b40",
        whisker: "rgba(220,215,205,.40)",
        fluffy: false,
        earScale: 1.04,
      },
      card: { fur: "#4b4654", furDark: "#34313d", furLight: "#6b6477", pattern: "#615b6c", eye: "#f2c45c", eyeDark: "#4f3a10", earInner: "#a97886", nose: "#8e6c77", collar: "#d8b55b", seed: 1.2, earSize: 1.04 },
    },
    {
      id: "cow",
      name: "奶牛猫",
      shortName: "奶牛",
      tagline: "白底黑花，连击上头",
      skillName: "连击玩家",
      skillDesc: "每次完美落地多赚 1 分。",
      skillType: "bonus",
      statusText: "连击玩家 · 生效中",
      physics: {
        size: 1.0,           // 标准身材
        weight: 1.0,         // 标准重量
        jumpPower: 1.0,      // 标准跳跃
        chargeBarLength: 1.0,// 标准蓄力条
        chargeSpeed: 1.0,    // 标准蓄力速度
        airHeight: 1.0       // 标准腾空
      },
      real: {
        base: "#eee9e1",
        light: "#fffdf8",
        mid: "#dcd5ca",
        dark: "#a9a096",
        accent: "#ffffff",
        pattern: "#252329",
        patternType: "cow",
        eye: "#7ba7ad",
        nose: "#c78e93",
        innerEar: "#d8a6a7",
        whisker: "rgba(90,80,75,.42)",
        fluffy: false,
        earScale: 1,
      },
      card: { fur: "#f7f0e5", furDark: "#dfd2c2", furLight: "#fffdf7", pattern: "#3c3840", eye: "#75aac3", eyeDark: "#24495c", earInner: "#e7aeb1", nose: "#db9aa0", collar: "#e36e63", seed: 3.4, earSize: 1 },
    },
    {
      id: "siamese",
      name: "暹罗猫",
      shortName: "暹罗",
      tagline: "奶油底，深色重点色",
      skillName: "猫步精准",
      skillDesc: "Perfect 判定圈更宽，落点更宽容。",
      skillType: "perfect",
      statusText: "猫步精准 · 生效中",
      physics: {
        size: 0.88,          // 体型纤细
        weight: 0.86,        // 轻
        jumpPower: 1.08,     // 跳得远
        chargeBarLength: 0.92,// 蓄力条略短
        chargeSpeed: 1.12,   // 蓄力快
        airHeight: 1.04      // 腾空略高
      },
      real: {
        base: "#d8c6ae",
        light: "#f5e9d7",
        mid: "#c7b299",
        dark: "#4e3c37",
        accent: "#fff7e9",
        pattern: "#4c3934",
        patternType: "siamese",
        eye: "#74b8d9",
        nose: "#8f696d",
        innerEar: "#b69091",
        whisker: "rgba(78,60,54,.46)",
        fluffy: false,
        earScale: 1.05,
      },
      card: { fur: "#f2e4d1", furDark: "#d8c5ac", furLight: "#fff9ee", pattern: "#5d4740", eye: "#70b1d1", eyeDark: "#1e4a60", earInner: "#c49899", nose: "#b6858b", collar: "#9375b4", seed: 5.3, earSize: 1.05, siamese: true },
    },
    {
      id: "calico",
      name: "三花猫",
      shortName: "三花",
      tagline: "白底黑橘，花色自己在走运",
      skillName: "花斑好运",
      skillDesc: "普通落地有 22% 几率被花色带到 Perfect。",
      skillType: "lucky",
      statusText: "花斑好运 · 生效中",
      physics: {
        size: 0.98,
        weight: 0.98,
        jumpPower: 1.02,
        chargeBarLength: 1.02,
        chargeSpeed: 1.02,
        airHeight: 1.02
      },
      real: {
        base: "#f4ece0",
        light: "#fffdf6",
        mid: "#ddcdb8",
        dark: "#3a342e",
        accent: "#fffaf0",
        pattern: "#2f2a25",
        patternType: "calico",
        eye: "#7fb2c8",
        nose: "#d18f94",
        innerEar: "#e3a9ac",
        whisker: "rgba(90,80,70,.45)",
        fluffy: true,
        earScale: 0.98,
      },
      card: { fur: "#f7f0e5", furDark: "#e1d4c1", furLight: "#fffdf8", pattern: "#3b3630", eye: "#7fb2c8", eyeDark: "#254a5c", earInner: "#eaaeb1", nose: "#dc9aa0", collar: "#d98f5f", seed: 8.1, earSize: 0.98 },
    },
    {
      id: "redpanda",
      name: "小熊猫",
      shortName: "小熊猫",
      tagline: "隐藏款，尾巴自带安全气囊",
      skillName: "尾巴回旋",
      skillDesc: "每局一次，把擦边的失误卷回平台。",
      skillType: "tail",
      statusText: "尾巴回旋 · 待命",
      hidden: true,
      physics: {
        size: 0.92,          // 体型稍小
        weight: 0.95,        // 中等偏轻
        jumpPower: 1.0,      // 标准跳跃
        chargeBarLength: 1.05,// 蓄力条略长
        chargeSpeed: 0.95,   // 蓄力略慢
        airHeight: 1.12      // 腾空最高
      },
      real: {
        base: "#b96a3e",
        light: "#e6a06b",
        mid: "#9d4f2d",
        dark: "#382725",
        accent: "#f7e7d6",
        pattern: "#332422",
        patternType: "redpanda",
        eye: "#6b442d",
        nose: "#2c1e1c",
        innerEar: "#d7aa95",
        whisker: "rgba(55,38,32,.55)",
        fluffy: true,
        earScale: 1.2,
      },
      card: { fur: "#cf7e4d", furDark: "#9e5434", furLight: "#fff4e7", pattern: "#4a3531", eye: "#55392a", eyeDark: "#2d1d17", earInner: "#eac3ae", nose: "#3e2d2c", collar: "#75aa92", seed: 6.4, earSize: 1.2, redPanda: true },
    },
  ];

  const MODES = {
    classic: {
      id: "classic",
      name: "自由跳",
      short: "∞",
      kicker: "CLASSIC",
      desc: "天气一路变脸，能跳多远跳多远。",
      startLabel: "开始跳",
      bestKey: "best",
      bestLabel: "最高",
    },
    race: {
      id: "race",
      name: "2分钟竞速",
      short: "2:00",
      kicker: "TIME ATTACK",
      desc: "120 秒冲高分，失误扣 5 秒。",
      startLabel: "开始竞速",
      bestKey: "bestRace",
      bestLabel: "赛道",
    },
    precision: {
      id: "precision",
      name: "精准模式",
      short: "◎",
      kicker: "PRECISION",
      desc: "每轮给你 5 个标准力度，压进判定圈必然是 Perfect；蓄力到 100% 会回环重来。",
      startLabel: "开始校准",
      bestKey: "bestPrecision",
      bestLabel: "精准",
    },
    gamble: {
      id: "gamble",
      name: "盲押五连",
      short: "×5",
      kicker: "BLIND BET",
      desc: "闭眼押 5 次力度，猫替你跳 5 块；无天气、无技能。",
      startLabel: "开始盲押",
      bestKey: "bestGamble",
      bestLabel: "盲押",
    },
  };

  const WEATHERS = {
    clear: {
      id: "clear",
      name: "晴天",
      icon: "☀",
      short: "风平浪静",
      desc: "平台干爽，安心蓄力。",
      tint: "clear",
    },
    wind: {
      id: "wind",
      name: "大风",
      icon: "⌁",
      short: "横风偏移",
      desc: "风会推着猫走，落点会偏一点。",
      tint: "wind",
    },
    rain: {
      id: "rain",
      name: "小雨",
      icon: "☂",
      short: "平台打滑",
      desc: "落地会滑一小步，别踩太边。",
      tint: "rain",
    },
    lightning: {
      id: "lightning",
      name: "雷暴",
      icon: "ϟ",
      short: "雷声惊猫",
      desc: "闪电一响，猫可能吓得自己先跳。",
      tint: "storm",
    },
    snow: {
      id: "snow",
      name: "落雪",
      icon: "❄",
      short: "更滑",
      desc: "平台覆雪，落地比雨天更滑。",
      tint: "snow",
    },
  };

  const ACHIEVEMENTS = [
    { id: "first_jump", name: "第一脚猫步", desc: "完成第一次跳跃", icon: "🐾", goal: 1, value: (save) => save.stats.totalJumps },
    { id: "first_perfect", name: "正中猫心", desc: "拿到第一次 Perfect", icon: "✦", goal: 1, value: (save) => save.stats.totalPerfects },
    { id: "combo_five", name: "五连不落", desc: "单局达成 5 连 Perfect", icon: "⑤", goal: 5, value: (save) => save.stats.maxCombo },
    { id: "combo_ten", name: "十全十美", desc: "单局达成 10 连 Perfect", icon: "⑩", goal: 10, value: (save) => save.stats.maxCombo },
    { id: "score_30", name: "檐上散步", desc: "自由跳单局达到 30 分", icon: "⌂", goal: 30, value: (save) => save.stats.maxScore },
    { id: "score_60", name: "云顶常客", desc: "自由跳单局达到 60 分", icon: "☁", goal: 60, value: (save) => save.stats.maxScore },
    { id: "score_100", name: "百步穿云", desc: "自由跳单局达到 100 分", icon: "❖", goal: 100, value: (save) => save.stats.maxScore },
    { id: "race_finish", name: "两分钟猫速", desc: "完成一局竞速模式", icon: "◷", goal: 1, value: (save) => save.stats.raceRuns },
    { id: "race_100", name: "赛道好手", desc: "竞速单局达到 100 分", icon: "⇥", goal: 100, value: (save) => save.stats.raceBest },
    { id: "gamble_finish", name: "闭眼也能跳", desc: "完成一局盲押", icon: "◉", goal: 1, value: (save) => save.stats.gambleRuns },
    { id: "gamble_perfect", name: "盲押全中", desc: "一整局盲押全部 Perfect", icon: "✹", goal: 1, value: (save) => save.stats.gamblePerfectRuns },
    { id: "weather_all", name: "四季猫旅", desc: "集齐晴、风、雨、雷、雪", icon: "☼", goal: 5, value: (save) => Object.keys(save.stats.weatherSeen || {}).length },
    { id: "rescue_once", name: "九命用上了", desc: "触发一次猫咪救援", icon: "♺", goal: 1, value: (save) => save.stats.rescues },
    { id: "lightning_jump", name: "雷声先跳", desc: "被闪电吓得自动起跳", icon: "ϟ", goal: 1, value: (save) => save.stats.lightningJumps },
    { id: "slip_land", name: "冰面猫步", desc: "在雨雪天成功滑行落地", icon: "❄", goal: 1, value: (save) => save.stats.slipLands },
    { id: "random_run", name: "命运安排", desc: "用随机猫完成一局", icon: "⚄", goal: 1, value: (save) => save.stats.randomRuns },
    { id: "no_skill_20", name: "纯脚法", desc: "关闭技能后单局达到 20 分", icon: "○", goal: 20, value: (save) => save.stats.noSkillBest },
    { id: "all_cats", name: "猫咪图鉴", desc: "解锁全部 8 只猫", icon: "♛", goal: 8, value: (save) => (save.unlocked ? 8 : 7) },
    { id: "total_100", name: "百次起跳", desc: "累计完成 100 次跳跃", icon: "∞", goal: 100, value: (save) => save.stats.totalJumps },
  ];

  const RANDOM_CAT = {
    id: "random",
    name: "随机猫",
    shortName: "随机",
    tagline: "每局抽一只，命运说了算",
    skillName: "命运猫爪",
    skillDesc: "每局从已解锁的猫里随机抽一只。",
    skillType: "random",
    statusText: "随机猫 · 每局换签",
  };

  window.NYA_DATA = {
    CATS,
    MODES,
    WEATHERS,
    ACHIEVEMENTS,
    RANDOM_CAT,
  };
})();
