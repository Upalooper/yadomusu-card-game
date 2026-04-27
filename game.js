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
    description: "35Gでカードを購入",
    apply: (state, log) => {
      const pool = drawRandomCards(CARD_LIBRARY, 3);
      const buy = pool.find((card) => state.money >= card.price);
      if (!buy) {
        log("所持金不足で何も買えなかった。", "warn");
        return;
      }
      state.money -= buy.price;
      state.deck.push(buy.id);
      log(`ショップで「${buy.name}」を購入（-${buy.price}G）。`, "good");
    },
  },
  {
    id: "item",
    name: "アイテム",
    description: "今日の能力ブースト",
    apply: (state, log) => {
      state.tempBonus.service += 4;
      state.tempBonus.charm += 2;
      log("特製ヘアピンを使い、給仕+4・魅力+2。", "good");
    },
  },
  {
    id: "meal",
    name: "食事",
    description: "元気回復でストレス減少",
    apply: (state, log) => {
      state.stress = Math.max(0, state.stress - 5);
      state.actions += 1;
      log("まかないで英気回復。ストレス-5、行動+1。", "good");
    },
  },
  {
    id: "rest",
    name: "休憩",
    description: "行動+1",
    apply: (state, log) => {
      state.actions += 1;
      log("短い昼寝で行動回数が+1。", "good");
    },
  },
  {
    id: "social",
    name: "交流",
    description: "ヒロイン会話で友好+6",
    apply: (state, log) => {
      state.affection += 6;
      unlockEvent(state, "chat");
      log("看板娘と交流して友好度+6。", "good");
    },
  },
];

const EVENTS = [
  {
    id: "chat",
    title: "営業後のたわいない会話",
    desc: "閉店後の談笑で、彼女の夢を知る。",
  },
  {
    id: "busy-day",
    title: "満席の一日",
    desc: "給仕力が実を結び、宿が活気づく。",
  },
  {
    id: "festival",
    title: "祭りの日の特別衣装",
    desc: "魅力が噂となって客足が伸びる。",
  },
  {
    id: "promise",
    title: "返済の約束",
    desc: "借金完済に向けて二人で誓い合う。",
  },
  {
    id: "ending",
    title: "エンディング",
    desc: "宿と看板娘の未来が示される。",
  },
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
  handSizeBase: 4,
  phase: "prep",
  logs: [],
  deck: [
    "waitress-training",
    "waitress-training",
    "owner-advice",
    "inn-girl-inspiration",
    "kitchen-help",
    "smile-practice",
    "night-accounting",
    "owner-advice",
  ],
  hand: [],
  playedToday: 0,
  prepChosen: false,
  tempBonus: { service: 0, charm: 0 },
  unlockedEvents: [],
  usedRemodel: false,
};

const statusPanel = document.getElementById("statusPanel");
const phaseTitle = document.getElementById("phaseTitle");
const phaseDescription = document.getElementById("phaseDescription");
const actionButtons = document.getElementById("actionButtons");
const handEl = document.getElementById("hand");
const logPanel = document.getElementById("logPanel");
const deckButtons = document.getElementById("deckButtons");
const deckList = document.getElementById("deckList");
const eventGallery = document.getElementById("eventGallery");

function cardById(id) {
  return CARD_LIBRARY.find((card) => card.id === id);
}

function drawRandomCards(pool, count) {
  const result = [];
  const copy = [...pool];
  while (result.length < count && copy.length) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

function drawFromDeck() {
  const amount = state.handSizeBase + state.nextDayDraw;
  state.hand = [];
  for (let i = 0; i < amount; i += 1) {
    const id = state.deck[Math.floor(Math.random() * state.deck.length)];
    if (id) state.hand.push(id);
  }
  state.nextDayDraw = 0;
}

function addLog(message) {
  state.logs.unshift(`[Day ${state.day}] ${message}`);
  state.logs = state.logs.slice(0, 30);
}

function unlockEvent(st, eventId) {
  if (!st.unlockedEvents.includes(eventId)) {
    st.unlockedEvents.push(eventId);
  }
}

function applyCardPlay(cardId) {
  if (state.phase !== "main" || state.actions <= 0) return;
  const idx = state.hand.findIndex((id) => id === cardId);
  if (idx < 0) return;

  const card = cardById(cardId);
  state.actions -= 1;
  card.play(state);
  state.hand.splice(idx, 1);
  state.playedToday += 1;
  addLog(`「${card.name}」を使用。`);

  if (state.actions <= 0) {
    addLog("行動回数を使い切った。営業終了へ。", "warn");
    state.phase = "close";
    closePhase();
  }
  render();
}

function prepPhase() {
  state.phase = "prep";
  state.actions = 2 + state.nextDayActions;
  state.nextDayActions = 0;
  state.prepChosen = false;
  state.tempBonus = { service: 0, charm: 0 };
  state.usedRemodel = false;

  const options = drawRandomCards(PREP_OPTIONS, 4);
  phaseTitle.textContent = "準備フェイズ";
  phaseDescription.innerHTML = `<p>ランダムな4択から1つ選び、営業準備を整えます。</p>`;
  actionButtons.innerHTML = "";

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = `${opt.name}：${opt.description}`;
    btn.onclick = () => {
      if (state.prepChosen) return;
      opt.apply(state, addLog);
      state.prepChosen = true;
      startMainPhase();
    };
    actionButtons.appendChild(btn);
  });
}

function startMainPhase() {
  state.phase = "main";
  drawFromDeck();
  addLog(`メインフェイズ開始。手札${state.hand.length}枚 / 行動${state.actions}。`);
  render();
}

function closePhase() {
  const serviceTotal = state.service + state.tempBonus.service;
  const charmTotal = state.charm + state.tempBonus.charm;
  const dailyIncome =
    25 +
    Math.floor(serviceTotal * 1.4) +
    Math.floor(charmTotal * 1.1) +
    Math.floor(state.affection * 0.7) -
    state.stress;

  const gained = Math.max(0, dailyIncome);
  state.money += gained;
  const repay = Math.min(state.money, 80 + Math.floor(state.affection / 3));
  state.money -= repay;
  state.debt = Math.max(0, state.debt - repay);

  addLog(`本日の売上 ${gained}G。借金を ${repay}G 返済。残債 ${state.debt}G。`);

  if (serviceTotal >= 60) unlockEvent(state, "busy-day");
  if (charmTotal >= 40) unlockEvent(state, "festival");
  if (state.debt <= 400) unlockEvent(state, "promise");

  randomNightEvent();
  addLog("営業終了フェイズ完了。次の日へ進めます。");

  render();
}

function randomNightEvent() {
  const roll = Math.random();
  if (roll < 0.24) {
    state.affection += 4;
    addLog("閉店後イベント：常連客の手助けで友好+4。");
  } else if (roll < 0.42) {
    if (state.deck.length > 4) {
      const removeId = state.deck[Math.floor(Math.random() * state.deck.length)];
      state.deck = state.deck.filter((id, idx) => {
        const first = state.deck.indexOf(removeId);
        return !(id === removeId && idx === first);
      });
      addLog(`閉店後イベント：不要カード「${cardById(removeId).name}」をデッキ圧縮。`, "good");
    }
  } else if (roll < 0.57) {
    const up = state.deck.find((id) => id === "waitress-training");
    if (up) {
      const index = state.deck.indexOf(up);
      state.deck[index] = "kitchen-help";
      addLog("閉店後イベント：給仕特訓が厨房サポートへ強化された！", "good");
    }
  }
}

function advanceDay() {
  if (state.phase !== "close") return;
  if (state.day >= state.maxDay || state.debt <= 0) {
    endGame();
    return;
  }

  state.day += 1;
  if ((state.day - 1) % 4 === 0) {
    const milestone = 120 + (Math.floor(state.day / 4) * 40);
    if (state.service + state.charm + state.affection < milestone) {
      state.stress += 8;
      addLog("目標未達により焦りが発生。ストレス+8。", "warn");
    } else {
      state.money += 60;
      addLog("節目評価クリア！報奨金60Gを獲得。", "good");
    }
  }
  prepPhase();
  render();
}

function remodelCard() {
  if (state.usedRemodel || state.money < 45) return;
  const targetIndex = state.deck.findIndex((id) => id === "kitchen-help" || id === "smile-practice");
  if (targetIndex < 0) {
    addLog("強化可能なカードが見つからなかった。", "warn");
    return;
  }

  state.money -= 45;
  const target = state.deck[targetIndex];
  state.deck[targetIndex] = "owner-advice";
  state.usedRemodel = true;
  addLog(`カード改造で「${cardById(target).name}」をオーナーのアドバイスに変更。`, "good");
  render();
}

function purgeCard() {
  if (state.money < 30 || state.deck.length <= 5) return;
  const removeIndex = state.deck.findIndex((id) => id === "night-accounting" || id === "waitress-training");
  if (removeIndex < 0) {
    addLog("削除候補がない。", "warn");
    return;
  }

  state.money -= 30;
  const [removed] = state.deck.splice(removeIndex, 1);
  addLog(`デッキ整理で「${cardById(removed).name}」を削除（-30G）。`, "good");
  render();
}

function endGame() {
  state.phase = "end";
  unlockEvent(state, "ending");
  const success = state.debt <= 0 && state.affection >= 80 && state.charm >= 60;
  const decent = state.debt <= 0;

  phaseTitle.textContent = "エンディング";
  actionButtons.innerHTML = "";

  if (success) {
    phaseDescription.innerHTML = `<p>【真エンド】看板娘は街で評判となり、宿は再建に成功！</p>`;
  } else if (decent) {
    phaseDescription.innerHTML = `<p>【通常エンド】借金完済。これから二人の宿経営が始まる。</p>`;
  } else {
    phaseDescription.innerHTML = `<p>【ビターエンド】期限までに返済できず、再起を誓って次章へ。</p>`;
  }
  addLog("ゲーム終了。リロードで再挑戦できます。");
  render();
}

function renderStatus() {
  statusPanel.innerHTML = `
    <h2>ステータス</h2>
    <div class="stat-grid">
      <div class="stat-item">日数: ${state.day}/${state.maxDay}</div>
      <div class="stat-item">フェイズ: ${state.phase}</div>
      <div class="stat-item">借金: ${state.debt}G</div>
      <div class="stat-item">所持金: ${state.money}G</div>
      <div class="stat-item">給仕: ${state.service}</div>
      <div class="stat-item">魅力: ${state.charm}</div>
      <div class="stat-item">友好: ${state.affection}</div>
      <div class="stat-item">ストレス: ${state.stress}</div>
      <div class="stat-item">残行動: ${state.actions}</div>
      <div class="stat-item">次の日手札+: ${state.nextDayDraw}</div>
    </div>
  `;
}

function renderHand() {
  handEl.innerHTML = "";
  if (state.phase !== "main") {
    handEl.innerHTML = "<p>メインフェイズでカードをプレイできます。</p>";
    return;
  }

  state.hand.forEach((cardId) => {
    const card = cardById(cardId);
    const box = document.createElement("article");
    box.className = "card";
    box.innerHTML = `<h3>${card.name}</h3><p>${card.text}</p>`;
    const playBtn = document.createElement("button");
    playBtn.textContent = "プレイ";
    playBtn.disabled = state.actions <= 0;
    playBtn.onclick = () => applyCardPlay(cardId);
    box.appendChild(playBtn);
    handEl.appendChild(box);
  });

  const endBtn = document.createElement("button");
  endBtn.textContent = "営業を終了する";
  endBtn.onclick = () => {
    state.actions = 0;
    state.phase = "close";
    closePhase();
  };
  handEl.appendChild(endBtn);
}

function renderLogs() {
  logPanel.innerHTML = "";
  state.logs.forEach((line) => {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = line;
    logPanel.appendChild(div);
  });
}

function renderDeck() {
  const counts = state.deck.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  deckList.innerHTML = Object.entries(counts)
    .map(([id, count]) => `<div>${cardById(id).name} × ${count}</div>`)
    .join("");

  deckButtons.innerHTML = "";

  const upgradeBtn = document.createElement("button");
  upgradeBtn.textContent = "カード改造 (45G)";
  upgradeBtn.disabled = state.phase !== "prep" || state.usedRemodel || state.money < 45;
  upgradeBtn.onclick = remodelCard;

  const purgeBtn = document.createElement("button");
  purgeBtn.textContent = "デッキ圧縮 (30G)";
  purgeBtn.disabled = state.phase !== "prep" || state.money < 30 || state.deck.length <= 5;
  purgeBtn.onclick = purgeCard;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "次の日へ";
  nextBtn.disabled = state.phase !== "close";
  nextBtn.onclick = advanceDay;

  deckButtons.append(upgradeBtn, purgeBtn, nextBtn);
}

function renderEvents() {
  eventGallery.innerHTML = "";
  EVENTS.forEach((event) => {
    const unlocked = state.unlockedEvents.includes(event.id);
    const box = document.createElement("article");
    box.className = `event-card ${unlocked ? "" : "event-locked"}`;
    box.innerHTML = `<h4>${unlocked ? event.title : "???"}</h4><p>${
      unlocked ? event.desc : "条件を満たすと開放"
    }</p>`;
    eventGallery.appendChild(box);
  });
}

function renderPhasePanel() {
  if (state.phase === "main") {
    phaseTitle.textContent = "メインフェイズ";
    phaseDescription.innerHTML = "<p>手札からカードを使って看板娘を育成しましょう。</p>";
    actionButtons.innerHTML = "";
  } else if (state.phase === "close") {
    phaseTitle.textContent = "営業終了フェイズ";
    phaseDescription.innerHTML = "<p>売上計算・返済・会話イベントを処理しました。次の日へ進めます。</p>";
    actionButtons.innerHTML = "";
  }
}

function render() {
  renderStatus();
  renderPhasePanel();
  renderHand();
  renderLogs();
  renderDeck();
  renderEvents();
}

addLog("ゲーム開始。18日以内に借金を返済しよう。", "good");
prepPhase();
render();
