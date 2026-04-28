const CARD_LIBRARY = [
  {
    id: "waitress-training",
    name: "給仕特訓",
    text: "行動-1\n給仕+10\n魅力+2",
    price: 25,
    play: (state) => {
      state.service += 10;
      state.charm += 2;
    },
  },
  {
    id: "owner-advice",
    name: "オーナーのアドバイス",
    text: "行動-1\n行動+1\n魅力+2\n友好+3",
    price: 30,
    play: (state) => {
      state.actions += 1;
      state.charm += 2;
      state.affection += 3;
    },
  },
  {
    id: "inn-girl-inspiration",
    name: "やど娘のひらめき",
    text: "行動-1\n次の日の手札+2\n次の日の行動+1",
    price: 40,
    play: (state) => {
      state.nextDayDraw += 2;
      state.nextDayActions += 1;
    },
  },
  {
    id: "kitchen-help",
    name: "厨房サポート",
    text: "行動-1\n給仕+6\n売上+20",
    price: 20,
    play: (state) => {
      state.service += 6;
      state.money += 20;
    },
  },
  {
    id: "smile-practice",
    name: "笑顔の練習",
    text: "行動-1\n魅力+4\n友好+2",
    price: 22,
    play: (state) => {
      state.charm += 4;
      state.affection += 2;
    },
  },
  {
    id: "night-accounting",
    name: "夜の帳簿整理",
    text: "行動-1\n売上+35\nストレス+2",
    price: 18,
    play: (state) => {
      state.money += 35;
      state.stress += 2;
    },
  },
];

const PREP_OPTIONS = [
  {
    id: "shop",
    name: "ショップ",
    description: "35Gでカード購入",
    apply: (state) => {
      const pool = drawRandomCards(CARD_LIBRARY, 3);
      const buy = pool.find((card) => state.money >= card.price);
      if (!buy) return log("所持金不足で購入失敗。", "warn");
      state.money -= buy.price;
      state.discardPile.push(buy.id);
      log(`ショップで「${buy.name}」を購入（-${buy.price}G）。`, "good");
    },
  },
  {
    id: "item",
    name: "アイテム",
    description: "給仕+4 / 魅力+2",
    apply: (state) => {
      state.tempBonus.service += 4;
      state.tempBonus.charm += 2;
      log("特製ヘアピンで当日ボーナス獲得。", "good");
    },
  },
  {
    id: "meal",
    name: "食事",
    description: "ストレス-5 / 行動+1",
    apply: (state) => {
      state.stress = Math.max(0, state.stress - 5);
      state.actions += 1;
      log("まかないで回復した。", "good");
    },
  },
  {
    id: "rest",
    name: "休憩",
    description: "行動+1",
    apply: (state) => {
      state.actions += 1;
      log("短い昼寝で行動+1。", "good");
    },
  },
  {
    id: "social",
    name: "交流",
    description: "友好+6",
    apply: (state) => {
      state.affection += 6;
      unlockEvent("chat");
      log("看板娘と会話して友好+6。", "good");
    },
  },
];

const EVENTS = [
  ["chat", "営業後のたわいない会話", "閉店後の談笑で、彼女の夢を知る。"],
  ["busy-day", "満席の一日", "給仕力が実を結び、宿が活気づく。"],
  ["festival", "祭りの日の特別衣装", "魅力の評判で客足が伸びる。"],
  ["promise", "返済の約束", "借金完済に向けて誓い合う。"],
  ["ending", "エンディング", "宿と看板娘の未来が示される。"],
];

const state = {
  day: 1,
  maxDay: 18,
  debt: 1200,
  money: 120,
  service: 0,
  charm: 0,
  affection: 0,
  stress: 0,
  actions: 2,
  nextDayDraw: 0,
  nextDayActions: 0,
  handSize: 4,
  phase: "prep",
  tempBonus: { service: 0, charm: 0 },
  drawPile: [],
  discardPile: [],
  hand: [],
  logs: [],
  unlockedEvents: [],
  usedRemodel: false,
};

const starterDeck = [
  "waitress-training",
  "waitress-training",
  "owner-advice",
  "inn-girl-inspiration",
  "kitchen-help",
  "smile-practice",
  "night-accounting",
  "owner-advice",
];

const phaseTitle = document.getElementById("phaseTitle");
const phaseDescription = document.getElementById("phaseDescription");
const actionButtons = document.getElementById("actionButtons");
const logPanel = document.getElementById("logPanel");
const deckButtons = document.getElementById("deckButtons");
const deckList = document.getElementById("deckList");
const eventGallery = document.getElementById("eventGallery");
const handEl = document.getElementById("hand");
const resourceBar = document.getElementById("resourceBar");
const drawPileEl = document.getElementById("drawPile");
const discardPileEl = document.getElementById("discardPile");
const dayInfoEl = document.getElementById("dayInfo");
const statusSummary = document.getElementById("statusSummary");
const cardDetail = document.getElementById("cardDetail");

function cardById(id) {
  return CARD_LIBRARY.find((card) => card.id === id);
}

function allDeckCards() {
  return [...state.drawPile, ...state.discardPile, ...state.hand];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function drawRandomCards(pool, count) {
  return shuffle([...pool]).slice(0, count);
}

function log(message) {
  state.logs.unshift(`[Day ${state.day}] ${message}`);
  state.logs = state.logs.slice(0, 40);
}

function unlockEvent(id) {
  if (!state.unlockedEvents.includes(id)) state.unlockedEvents.push(id);
}

function initDeckFromAllCards(cards) {
  state.drawPile = shuffle([...cards]);
  state.discardPile = [];
  state.hand = [];
}

function drawCard() {
  if (state.drawPile.length === 0) {
    if (state.discardPile.length === 0) return null;
    state.drawPile = shuffle([...state.discardPile]);
    state.discardPile = [];
  }
  return state.drawPile.pop() || null;
}

function drawHand() {
  state.hand = [];
  const count = state.handSize + state.nextDayDraw;
  for (let i = 0; i < count; i += 1) {
    const card = drawCard();
    if (card) state.hand.push(card);
  }
  state.nextDayDraw = 0;
}

function startPrepPhase() {
  state.phase = "prep";
  state.actions = 2 + state.nextDayActions;
  state.nextDayActions = 0;
  state.tempBonus = { service: 0, charm: 0 };
  state.usedRemodel = false;

  phaseTitle.textContent = "準備フェイズ";
  phaseDescription.innerHTML = "<p>ランダム4択から1つ選んで営業準備をしてください。</p>";
  actionButtons.innerHTML = "";

  drawRandomCards(PREP_OPTIONS, 4).forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = `${opt.name}：${opt.description}`;
    btn.onclick = () => {
      if (state.phase !== "prep") return;
      opt.apply(state);
      startMainPhase();
    };
    actionButtons.appendChild(btn);
  });
}

function startMainPhase() {
  state.phase = "main";
  drawHand();
  phaseTitle.textContent = "メインフェイズ";
  phaseDescription.innerHTML = "<p>手札を上にドラッグして使用。行動が0になると営業終了です。</p>";
  actionButtons.innerHTML = "";
  log(`メイン開始: 手札${state.hand.length}枚 / 行動${state.actions}`);
  render();
}

function playCardFromHand(index) {
  if (state.phase !== "main" || state.actions <= 0) return;
  const cardId = state.hand[index];
  if (!cardId) return;

  const card = cardById(cardId);
  state.actions -= 1;
  card.play(state);
  state.hand.splice(index, 1);
  state.discardPile.push(cardId);
  log(`「${card.name}」を使用。`);

  if (state.actions <= 0) {
    endMainPhase();
  }
  render();
}

function endMainPhase() {
  state.phase = "close";
  handToDiscard();
  closePhaseResolve();
}

function handToDiscard() {
  state.discardPile.push(...state.hand);
  state.hand = [];
}

function closePhaseResolve() {
  const serviceTotal = state.service + state.tempBonus.service;
  const charmTotal = state.charm + state.tempBonus.charm;
  const dailyIncome = 25 + Math.floor(serviceTotal * 1.4) + Math.floor(charmTotal * 1.1) + Math.floor(state.affection * 0.7) - state.stress;
  const earned = Math.max(0, dailyIncome);

  state.money += earned;
  const repay = Math.min(state.money, 80 + Math.floor(state.affection / 3));
  state.money -= repay;
  state.debt = Math.max(0, state.debt - repay);

  if (serviceTotal >= 60) unlockEvent("busy-day");
  if (charmTotal >= 40) unlockEvent("festival");
  if (state.debt <= 400) unlockEvent("promise");

  nightEvent();

  phaseTitle.textContent = "営業終了フェイズ";
  phaseDescription.innerHTML = `<p>売上 ${earned}G / 返済 ${repay}G。次の日へ進んでください。</p>`;
  actionButtons.innerHTML = "";

  log(`営業終了: 売上${earned}G・返済${repay}G・残債${state.debt}G`);
  render();
}

function nightEvent() {
  const r = Math.random();
  if (r < 0.2) {
    state.affection += 4;
    log("夜イベント: 常連客と交流し友好+4。", "good");
  } else if (r < 0.35) {
    const all = allDeckCards();
    const target = all.find((id) => id === "waitress-training");
    if (target) {
      replaceOneCard("waitress-training", "kitchen-help");
      log("夜イベント: 給仕特訓が厨房サポートへ強化！", "good");
    }
  } else if (r < 0.5) {
    if (removeOneCard("night-accounting")) {
      log("夜イベント: 夜の帳簿整理をデッキから削除。", "good");
    }
  }
}

function replaceOneCard(fromId, toId) {
  const zones = [state.drawPile, state.discardPile, state.hand];
  for (const zone of zones) {
    const idx = zone.indexOf(fromId);
    if (idx >= 0) {
      zone[idx] = toId;
      return true;
    }
  }
  return false;
}

function removeOneCard(id) {
  const zones = [state.drawPile, state.discardPile, state.hand];
  for (const zone of zones) {
    const idx = zone.indexOf(id);
    if (idx >= 0) {
      zone.splice(idx, 1);
      return true;
    }
  }
  return false;
}

function advanceDay() {
  if (state.phase !== "close") return;
  if (state.day >= state.maxDay || state.debt <= 0) {
    return endGame();
  }

  state.day += 1;
  if ((state.day - 1) % 4 === 0) {
    const req = 120 + Math.floor(state.day / 4) * 40;
    if (state.service + state.charm + state.affection < req) {
      state.stress += 8;
      log("節目目標未達: ストレス+8。", "warn");
    } else {
      state.money += 60;
      log("節目達成報酬: 60G。", "good");
    }
  }
  startPrepPhase();
  render();
}

function endGame() {
  state.phase = "end";
  unlockEvent("ending");
  const trueEnd = state.debt <= 0 && state.affection >= 80 && state.charm >= 60;
  const normalEnd = state.debt <= 0;
  phaseTitle.textContent = "エンディング";
  actionButtons.innerHTML = "";
  if (trueEnd) {
    phaseDescription.innerHTML = "<p>【真エンド】宿の再建に成功し、看板娘は街の人気者に。</p>";
  } else if (normalEnd) {
    phaseDescription.innerHTML = "<p>【通常エンド】借金は完済。二人の経営はこれから。</p>";
  } else {
    phaseDescription.innerHTML = "<p>【ビターエンド】返済届かず。次の季節に再挑戦。</p>";
  }
  log("ゲーム終了。リロードで再挑戦。", "warn");
  render();
}

function remodelCard() {
  if (state.phase !== "prep" || state.usedRemodel || state.money < 45) return;
  if (!replaceOneCard("kitchen-help", "owner-advice") && !replaceOneCard("smile-practice", "owner-advice")) {
    log("改造対象カードがない。", "warn");
    return;
  }
  state.money -= 45;
  state.usedRemodel = true;
  log("カード改造でオーナーのアドバイスを獲得。", "good");
  render();
}

function purgeCard() {
  if (state.phase !== "prep" || state.money < 30) return;
  if (allDeckCards().length <= 5) return;
  if (!removeOneCard("night-accounting") && !removeOneCard("waitress-training")) {
    log("削除候補カードがない。", "warn");
    return;
  }
  state.money -= 30;
  log("デッキ圧縮を実行。", "good");
  render();
}

function setupDeckButtons() {
  deckButtons.innerHTML = "";
  const upgrade = document.createElement("button");
  upgrade.textContent = "カード改造 (45G)";
  upgrade.disabled = state.phase !== "prep" || state.usedRemodel || state.money < 45;
  upgrade.onclick = remodelCard;

  const purge = document.createElement("button");
  purge.textContent = "デッキ圧縮 (30G)";
  purge.disabled = state.phase !== "prep" || state.money < 30 || allDeckCards().length <= 5;
  purge.onclick = purgeCard;

  const nextDay = document.createElement("button");
  nextDay.textContent = "次の日へ";
  nextDay.disabled = state.phase !== "close";
  nextDay.onclick = advanceDay;

  const forceClose = document.createElement("button");
  forceClose.textContent = "営業終了";
  forceClose.disabled = state.phase !== "main";
  forceClose.onclick = () => {
    endMainPhase();
    render();
  };

  deckButtons.append(upgrade, purge, forceClose, nextDay);
}

function renderResourceBar() {
  const chips = [
    `日数 ${state.day}/${state.maxDay}`,
    `行動 ${state.actions}`,
    `借金 ${state.debt}G`,
    `所持金 ${state.money}G`,
    `山札 ${state.drawPile.length}`,
    `捨て札 ${state.discardPile.length}`,
    `手札 ${state.hand.length}`,
  ];
  resourceBar.innerHTML = chips.map((chip) => `<span class="chip">${chip}</span>`).join("");
}

function renderPilesAndStatus() {
  drawPileEl.textContent = `山札 ${state.drawPile.length}`;
  discardPileEl.textContent = `捨て札 ${state.discardPile.length}`;
  dayInfoEl.textContent = `Day ${state.day} / ${state.maxDay}`;

  const stats = [
    ["給仕", state.service],
    ["魅力", state.charm],
    ["友好", state.affection],
    ["ストレス", state.stress],
    ["次の日手札+", state.nextDayDraw],
    ["次の日行動+", state.nextDayActions],
  ];
  statusSummary.innerHTML = stats
    .map(([k, v]) => `<div class="status-item">${k}: ${v}</div>`)
    .join("");
}

function renderLogs() {
  logPanel.innerHTML = state.logs.map((line) => `<div class="log-line">${line}</div>`).join("");
}

function renderDeckList() {
  const counts = allDeckCards().reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  deckList.innerHTML = Object.entries(counts)
    .map(([id, count]) => `<div>${cardById(id).name} × ${count}</div>`)
    .join("");
}

function renderEvents() {
  eventGallery.innerHTML = EVENTS.map(([id, title, desc]) => {
    const unlocked = state.unlockedEvents.includes(id);
    return `<article class="event-card ${unlocked ? "" : "event-locked"}">
      <strong>${unlocked ? title : "???"}</strong><br />
      ${unlocked ? desc : "条件を満たすと開放"}
    </article>`;
  }).join("");
}

function updateCardDetail(cardId) {
  const card = cardById(cardId);
  if (!card) return;
  cardDetail.textContent = `${card.name}\n\n${card.text}\n\n価格: ${card.price}G`;
}

function attachCardInteraction(cardEl, index, cardId) {
  let startY = 0;
  let dragging = false;

  cardEl.addEventListener("mouseenter", () => updateCardDetail(cardId));

  cardEl.addEventListener("pointerdown", (event) => {
    if (state.phase !== "main") return;
    dragging = true;
    startY = event.clientY;
    cardEl.setPointerCapture(event.pointerId);
    cardEl.classList.add("dragging");
  });

  cardEl.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const deltaY = event.clientY - startY;
    const clamped = Math.max(-140, Math.min(0, deltaY));
    cardEl.style.transform = `translateY(${clamped}px)`;
  });

  const finish = (event) => {
    if (!dragging) return;
    dragging = false;
    const deltaY = event.clientY - startY;
    cardEl.classList.remove("dragging");
    cardEl.style.transform = "translateY(0)";
    if (deltaY < -80 && state.phase === "main") {
      playCardFromHand(index);
    }
  };

  cardEl.addEventListener("pointerup", finish);
  cardEl.addEventListener("pointercancel", finish);
}

function renderHand() {
  handEl.innerHTML = "";
  if (state.phase !== "main") {
    handEl.innerHTML = `<div class="chip">メインフェイズで手札操作できます。</div>`;
    return;
  }
  state.hand.forEach((id, index) => {
    const card = cardById(id);
    const cardEl = document.createElement("article");
    cardEl.className = "hand-card";
    cardEl.innerHTML = `
      <h4>${card.name}</h4>
      <p>${card.text}</p>
      <div class="drag-hint">↑ Drag to Play</div>
    `;
    attachCardInteraction(cardEl, index, id);
    handEl.appendChild(cardEl);
  });
}

function render() {
  renderResourceBar();
  renderPilesAndStatus();
  renderLogs();
  setupDeckButtons();
  renderDeckList();
  renderEvents();
  renderHand();
}

(function boot() {
  initDeckFromAllCards(starterDeck);
  log("ゲーム開始。18日以内に借金を返済しよう。");
  startPrepPhase();
  render();
})();
