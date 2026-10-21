/* ==========================================================
   chat.js — the conversation. Everything happens in one thread:
   the user's choice appears as their bubble, then the assistant
   replies with text and, when needed, an app component.

   Deep links open a flow directly (for review / QA):
     index.html#food  #measure  #progress  #suggest
   ========================================================== */

(() => {


const thread = document.getElementById('thread');
const form = document.getElementById('composer');
const input = document.getElementById('composer-input');

const state = {
  measurements: [],       // last loaded measurements
  calendar: null,         // { year, month }
  lastLog: null,          // last food log (for undo)
};

/* ---------- Thread helpers ---------- */

function scrollToEnd() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}

/** Locks the buttons in earlier messages so old choices can't be pressed by mistake.
 *  Messages marked data-keep-active keep their component usable (quantity, calendar)
 *  and only lose their quick replies. */
function lockPrevious() {
  thread.querySelectorAll('.msg--bot:not(.is-locked)').forEach((m) => {
    const keep = 'keepActive' in m.dataset;
    m.querySelectorAll(keep ? '.chips button, .btn-lg' : 'button, input').forEach((el) => { el.disabled = true; });
    if (!keep) m.classList.add('is-locked');
  });
}

function userSays(text) {
  lockPrevious();
  const el = document.createElement('div');
  el.className = 'msg msg--user';
  el.innerHTML = `<span class="msg__sender">أنت</span><p class="msg__bubble">${text}</p>`;
  thread.appendChild(el);
  scrollToEnd();
}

/** Shows the typing dots, waits for `work`, then adds the assistant message. */
async function botSays(text, work) {
  const el = document.createElement('div');
  el.className = 'msg msg--bot';
  el.innerHTML = `<span class="msg__sender">المساعد الذكى</span>
    <div class="msg__bubble"><p class="typing" aria-label="بيكتب"><i></i><i></i><i></i></p><img src="assets/logo.svg" width="24" height="25" alt=""></div>`;
  thread.appendChild(el);
  scrollToEnd();
  let extra = '';
  try {
    extra = work ? await work() : '';
  } catch (err) {
    console.error(err);
    text = 'حصلت مشكلة في الاتصال 😕 جرّب تاني بعد شوية';
    extra = ui.chips([{ label: 'رجوع للبداية', action: 'menu' }]);
  }
  el.querySelector('.typing').outerHTML = `<p>${text}</p>`;
  if (extra) el.insertAdjacentHTML('beforeend', `<div class="msg__content">${extra}</div>`);
  scrollToEnd();
  return el;
}

const mainMenuChips = () => ui.chips([
  { label: 'تسجيل الأغذية', action: 'start-flow', data: { flow: 'food' } },
  { label: 'سجّل قياس', action: 'start-flow', data: { flow: 'measure' } },
  { label: 'تقدمي', action: 'start-flow', data: { flow: 'progress' } },
  { label: 'اقتراحات', action: 'start-flow', data: { flow: 'suggest' } },
]);

/** Way out of any step that waits for a choice: optional quick replies, then the cancel button last. */
const cancelChips = (extra = []) => `${extra.length ? ui.chips(extra) : ''}${ui.cancelButton()}`;

/* ---------- Flows ---------- */

const flows = {
  /* 1. Food logging */
  async food(query = '') {
    await botSays('أكلت إيه؟ اختار من تحت، أو اكتب اسم الأكلة في البحث', async () => {
      const foods = query ? await api.searchFoods(query) : await api.getFrequentFoods();
      return `${ui.searchBar()}<h2 class="msg__title">${query ? 'نتيجة البحث' : 'بتاكلهم كتير 👇'}</h2><div data-slot="foods">${ui.foodList(foods)}</div>${cancelChips()}`;
    }).then((el) => {
      if (query) el.querySelector('.search__input').value = query;
    });
  },

  /* 2. Measurements */
  async measure() {
    await botSays('تحب تسجّل إيه؟ دوس «تحديث» على القياس اللي عاوزه', async () => {
      state.measurements = await api.getMeasurements();
      return `${ui.biomarkGrid(state.measurements)}${cancelChips()}`;
    });
  },

  /* 3. Progress */
  async progress() {
    await botSays('ده تقدّمك النهارده 👇', async () => {
      const { percent } = await api.getTodayProgress();
      return ui.progressCard(percent);
    });
    const now = new Date();
    state.calendar = { year: now.getFullYear(), month: now.getMonth() + 1 };
    const el = await botSays('وده الشهر كله، كل يوم بلونه حسب أكلك', async () => {
      const data = await api.getProgressCalendar(state.calendar.year, state.calendar.month);
      return `<div data-slot="calendar">${ui.calendar(data)}</div>${ui.chips([
        { label: 'الأغذية اللي أكلتها النهارده', action: 'today-foods' },
        { label: 'سجّل أكلة', action: 'start-flow', data: { flow: 'food' } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ])}`;
    });
    el.dataset.keepActive = ''; // month arrows stay usable
  },

  /* 4. Suggestions */
  async suggest(filter = 'all', label = '') {
    const text = label ? `دي «${label}» 👇` : 'دي أغذية مختارة خصيصًا لهدفك الصحي 👇 تقدر تسجّل أي واحدة على طول';
    await botSays(text, async () => {
      const foods = await api.getSuggestedFoods(filter);
      return `${ui.chips([
        { label: 'أغذية تناولتها مؤخرا', action: 'suggest-filter', data: { filter: 'recent' }, badge: 3 },
        { label: 'أغذية متوافقه مع هدفك', action: 'suggest-filter', data: { filter: 'match' } },
        { label: 'أغذية متوسطة الفائده', action: 'suggest-filter', data: { filter: 'medium' } },
      ])}${ui.foodList(foods)}${foods.length ? ui.bigButton('أضف جميع الأغذية الى ما تناولته اليوم', 'log-all', { ids: foods.map((f) => f.id).join(',') }) : ''}${cancelChips()}`;
    });
  },
};

const FLOW_LABELS = { food: 'تسجيل الأغذية', measure: 'سجّل قياس', progress: 'تقدمي', suggest: 'اقتراحات' };

/* ---------- Actions (buttons inside messages) ---------- */

const actions = {
  'start-flow'(btn) {
    userSays(FLOW_LABELS[btn.dataset.flow]);
    flows[btn.dataset.flow]();
  },

  cancel() {
    userSays('إلغاء');
    botSays('تمام، اتلغى 👍 مفيش حاجة اتسجّلت. عاوز تعمل إيه؟', async () => mainMenuChips());
  },

  menu() {
    userSays('رجوع للبداية');
    botSays('عاوز تعمل إيه؟', async () => mainMenuChips());
  },

  finish() {
    userSays('خلاص، شكرًا');
    botSays('العفو 🌿 لو محتاج تسجّل حاجة تانية أنا هنا', async () => mainMenuChips());
  },

  /* Food */
  async 'log-food'(btn) {
    userSays(`أكلت ${btn.dataset.foodName}`);
    let log;
    await botSays('', async () => {
      log = await api.logFood(btn.dataset.foodId, 1);
      state.lastLog = log;
      return `${ui.qtyItem(log)}${ui.chips([
        { label: 'سجّل أكلة تانية', action: 'start-flow', data: { flow: 'food' } },
        { label: 'امسح التسجيل ده', action: 'delete-log', data: { 'log-id': log.id } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ])}`;
    }).then((el) => {
      if (log) el.querySelector('.msg__bubble p').textContent = `اتسجّلت ✅ ${log.food.name} · النهارده الساعة ${ui.arabicTime(log.loggedAt)}. لو أكلت أكتر من حصة زوّدها من هنا`;
      el.dataset.keepActive = ''; // the quantity stays editable
    });
  },

  async 'log-all'(btn) {
    userSays('أضف جميع الأغذية الى ما تناولته اليوم');
    await botSays('', async () => {
      const logs = await Promise.all(btn.dataset.ids.split(',').map((id) => api.logFood(id, 1)));
      return `<div class="food-list">${logs.map((l) => ui.qtyItem(l)).join('')}</div>${ui.chips([
        { label: 'شوف تقدّمك', action: 'start-flow', data: { flow: 'progress' } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ])}`;
    }).then((el) => {
      el.querySelector('.msg__bubble p').textContent = `اتسجّل ✅ ${ui.mealCount(btn.dataset.ids.split(',').length)} النهارده`;
      el.dataset.keepActive = '';
    });
  },

  async qty(btn) {
    const item = btn.closest('.qty-item');
    const out = item.querySelector('.stepper__value');
    const next = Math.max(1, Number(out.textContent) + Number(btn.dataset.step));
    out.textContent = next;
    await api.updateFoodLog(btn.dataset.logId, next);
  },

  async 'delete-log'(btn) {
    userSays('امسح التسجيل ده');
    await botSays('اتمسح ✅ ولا كأنه اتسجّل', async () => {
      await api.deleteFoodLog(btn.dataset.logId);
      return ui.chips([
        { label: 'سجّل أكلة', action: 'start-flow', data: { flow: 'food' } },
        { label: 'رجوع للبداية', action: 'menu' },
      ]);
    });
  },

  async 'save-food'(btn) {
    userSays(`احفظ ${btn.dataset.foodName} فى القائمة`);
    await botSays(`اتحفظت ${btn.dataset.foodName} في قائمتك ✅`, async () => {
      await api.saveFoodToList(btn.dataset.foodId);
      return ui.chips([
        { label: 'سجّل أكلة', action: 'start-flow', data: { flow: 'food' } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ]);
    });
  },

  async 'today-foods'() {
    userSays('الأغذية اللي أكلتها النهارده');
    const el = await botSays('', async () => {
      const logs = await api.getTodayFoodLogs();
      if (!logs.length) return ui.chips([{ label: 'سجّل أكلة', action: 'start-flow', data: { flow: 'food' } }]);
      return `<div class="food-list">${logs.map((l) => ui.qtyItem(l, { editable: false })).join('')}</div>${ui.chips([
        { label: 'سجّل أكلة', action: 'start-flow', data: { flow: 'food' } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ])}`;
    });
    const count = el.querySelectorAll('.qty-item').length;
    el.querySelector('.msg__bubble p').textContent = count ? `أكلت ${ui.mealCount(count)} النهارده 👇` : 'لسه ما سجّلتش أكل النهارده';
  },

  'suggest-filter'(btn) {
    const label = btn.firstChild.textContent.trim();
    userSays(label);
    flows.suggest(btn.dataset.filter, label);
  },

  /* Measurements */
  async 'pick-measure'(btn) {
    userSays(`تحديث ${btn.dataset.name}`);
    const m = state.measurements.find((x) => x.type === btn.dataset.type);
    await botSays(`اكتب قراءة ${m.name} الجديدة، أو غيّرها بالأسهم`, async () =>
      `${ui.measureInput(m)}${ui.bigButton('حفظ القياس', 'save-measure', { type: m.type })}${cancelChips([
        { label: 'اختار قياس تاني', action: 'start-flow', data: { flow: 'measure' } },
      ])}`);
  },

  'measure-step'(btn) {
    const box = btn.closest('.measure-input');
    const field = box.querySelector('.measure-input__value');
    const step = Number(box.dataset.step);
    const next = Math.round((Number(field.value || 0) + step * Number(btn.dataset.dir)) * 10) / 10;
    field.value = Math.max(0, next);
  },

  async 'save-measure'(btn) {
    const box = btn.closest('.msg__content').querySelector('.measure-input');
    const value = Number(box.querySelector('.measure-input__value').value);
    const m = state.measurements.find((x) => x.type === btn.dataset.type);
    if (!value) {
      box.classList.add('is-invalid');
      return;
    }
    userSays(`${m.name} ${value} ${m.unit}`);
    let saved;
    const el = await botSays('', async () => {
      saved = await api.saveMeasurement(m.type, value);
      return `<div class="biomark-grid">${ui.biomarkCard(saved, { showUpdate: false })}</div>${ui.chips([
        { label: 'سجّل قياس تاني', action: 'start-flow', data: { flow: 'measure' } },
        { label: 'شوف تقدّمك', action: 'start-flow', data: { flow: 'progress' } },
        { label: 'خلاص، شكرًا', action: 'finish' },
      ])}`;
    });
    if (saved) el.querySelector('.msg__bubble p').textContent = `اتسجّل ✅ ${saved.name} ${saved.value} ${saved.unit} · النهارده الساعة ${ui.arabicTime(saved.recordedAt)}`;
  },

  /* Calendar month arrows */
  async 'cal-month'(btn) {
    const c = state.calendar;
    const d = new Date(c.year, c.month - 1 + Number(btn.dataset.dir), 1);
    state.calendar = { year: d.getFullYear(), month: d.getMonth() + 1 };
    const data = await api.getProgressCalendar(state.calendar.year, state.calendar.month);
    btn.closest('[data-slot="calendar"]').innerHTML = ui.calendar(data);
  },
};

thread.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled || btn.tagName === 'INPUT') return;
  e.preventDefault();
  actions[btn.dataset.action]?.(btn);
});

/* Live food search inside the message */
let searchTimer;
thread.addEventListener('input', (e) => {
  if (e.target.dataset.action !== 'search-food') return;
  const slot = e.target.closest('.msg__content').querySelector('[data-slot="foods"]');
  const title = e.target.closest('.msg__content').querySelector('.msg__title');
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = e.target.value.trim();
    const foods = q ? await api.searchFoods(q) : await api.getFrequentFoods();
    title.textContent = q ? 'نتيجة البحث' : 'بتاكلهم كتير 👇';
    slot.innerHTML = ui.foodList(foods);
  }, 300);
});

/* ---------- Composer: typed or spoken text ---------- */

async function handleText(text) {
  if (!text.trim()) return;
  userSays(text);
  const { intent, query } = await api.detectIntent(text);
  if (intent === 'unknown') {
    botSays('معلش ما فهمتش 🙏 اختار من دول', async () => mainMenuChips());
  } else {
    flows[intent](query);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = '';
  handleText(text);
});

/* Voice: uses the browser's speech recognition when available (Chrome / Android). */
const mic = document.getElementById('composer-mic');
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
mic.addEventListener('click', () => {
  if (!Recognition) {
    botSays('الميكروفون مش شغال على الجهاز ده، اكتب اللي عاوزه وأنا أفهمك');
    return;
  }
  const rec = new Recognition();
  rec.lang = 'ar-EG';
  rec.interimResults = false;
  mic.classList.add('is-listening');
  input.placeholder = 'بسمعك... اتكلم';
  rec.onresult = (e) => handleText(e.results[0][0].transcript);
  rec.onend = () => {
    mic.classList.remove('is-listening');
    input.placeholder = 'اكتب أو دوس على الميكروفون واتكلم';
  };
  rec.start();
});

/* ---------- Start ---------- */

async function start() {
  const el = document.createElement('div');
  el.className = 'msg msg--bot msg--welcome';
  el.innerHTML = `<header class="welcome">
      <h1 class="welcome__title">مرحباً بك في مساعد Antioxida الذكي</h1>
      <p class="welcome__subtitle">كيف يمكننى مساعدتك؟ اختار من تحت أو اتكلم</p>
    </header>${ui.quickActions()}`;
  thread.appendChild(el);

  const flow = location.hash.slice(1);
  if (flows[flow]) {
    userSays(FLOW_LABELS[flow]);
    flows[flow]();
  }
}

start();
})();
