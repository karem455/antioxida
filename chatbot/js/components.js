/* ==========================================================
   components.js — HTML for the app components the chatbot reuses.
   Each one matches a component in Figma ("antidox" file); the
   Figma name is noted above it. Buttons carry data-action so
   chat.js can react to them.
   ========================================================== */

const ui = (() => {

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (v) => String(v).replace(/\d/g, (d) => AR_DIGITS[d]);

/** "أكلة واحدة" / "أكلتين" / "٣ أكلات" / "١١ أكلة" */
function mealCount(n) {
  if (n === 1) return 'أكلة واحدة';
  if (n === 2) return 'أكلتين';
  return `${toArabicDigits(n)} ${n <= 10 ? 'أكلات' : 'أكلة'}`;
}

/** "١٠:٣٠ الصبح" */
function arabicTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const period = h < 12 ? 'الصبح' : h < 17 ? 'الضهر' : 'بالليل';
  return `${toArabicDigits(h12)}:${toArabicDigits(String(d.getMinutes()).padStart(2, '0'))} ${period}`;
}

/* ---------- Star rating (paths from the "Frame 47" stars) ---------- */
const STAR_PATHS = [
  'M7.5 11.2516L12.135 14L10.905 8.82L15 5.33474L9.6075 4.88526L7.5 0L5.3925 4.88526L0 5.33474L4.095 8.82L2.865 14L7.5 11.2516Z',
  'M24.5 11.2516L29.135 14L27.905 8.82L32 5.33474L26.6075 4.88526L24.5 0L22.3925 4.88526L17 5.33474L21.095 8.82L19.865 14L24.5 11.2516Z',
  'M42.5 11.2516L47.753 14L46.359 8.82L51 5.33474L44.8885 4.88526L42.5 0L40.1115 4.88526L34 5.33474L38.641 8.82L37.247 14L42.5 11.2516Z',
  'M60.5 11.2516L65.135 14L63.905 8.82L68 5.33474L62.6075 4.88526L60.5 0L58.3925 4.88526L53 5.33474L57.095 8.82L55.865 14L60.5 11.2516Z',
  'M77.5 11.2516L82.135 14L80.905 8.82L85 5.33474L79.6075 4.88526L77.5 0L75.3925 4.88526L70 5.33474L74.095 8.82L72.865 14L77.5 11.2516Z',
];

function stars(rating) {
  // In the design the filled stars sit on the right (reading start)
  const paths = STAR_PATHS.map((d, i) => `<path d="${d}" fill="${i >= 5 - Math.round(rating) ? '#F8BD00' : '#D9D9D9'}"/>`).join('');
  return `<svg class="stars" width="85" height="14" viewBox="0 0 85 14" role="img" aria-label="التقييم ${rating} من 5">${paths}</svg>`;
}

/* ---------- Welcome quick actions (chatbot quick-action cards) ---------- */
function quickActions() {
  const items = [
    ['food', 'assets/icon-message-add.svg', 'تسجيل الأغذية'],
    ['suggest', 'assets/icon-magic-star.svg', 'اقتراحات<br>أغذية تناسب هدفك'],
    ['measure', 'assets/icon-fuel-tank.svg', 'سجّل قياس<br>سكر، وزن، ضغط..'],
    ['progress', 'assets/icon-trend-up.svg', 'تقدمي<br>شوف تقدمك اليوم'],
  ];
  return `<div class="quick-actions">${items.map(([flow, icon, label]) => `
    <button class="action-card" type="button" data-action="start-flow" data-flow="${flow}">
      <img src="${icon}" width="24" height="24" alt="">
      <span>${label}</span>
    </button>`).join('')}</div>`;
}

/* ---------- Quick replies (chip / Button) ---------- */
function chips(list) {
  return `<div class="chips">${list.map((c) => `
    <button class="chip" type="button" data-action="${c.action}"${c.data ? Object.entries(c.data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : ''}>
      ${esc(c.label)}${c.badge ? `<span class="chip__badge">${c.badge}</span>` : ''}
    </button>`).join('')}</div>`;
}

/* ---------- Search (Frame 1000002281 / بحث) ---------- */
function searchBar(placeholder = 'ابحث عن الأغذيه') {
  return `<label class="search">
    <input class="search__input" type="search" placeholder="${esc(placeholder)}" data-action="search-food" enterkeyhint="search">
    <img src="assets/icon-search.svg" width="20" height="22" alt="">
  </label>`;
}

/* ---------- Food card (cards / arabic card) ---------- */
function foodCard(food) {
  return `<article class="food-card" data-food-id="${esc(food.id)}">
    <img class="food-card__image" src="${esc(food.image)}" width="117" height="117" alt="${esc(food.name)}">
    <div class="food-card__body">
      <div class="food-card__info">
        <h3 class="food-card__name">${esc(food.name)}</h3>
        <div class="food-card__rating">
          <span class="food-card__score">${food.rating.toFixed(1)}</span>
          ${stars(food.rating)}
        </div>
      </div>
      <div class="food-card__details">
        <p class="food-card__note">${food.goalMatch ? 'متوافق مع هدفك الصحى' : 'غير متوافق مع هدفك'} <a href="#">(الدليل العلمى)</a></p>
        <div class="food-card__actions">
          <button class="btn-sm btn-sm--primary" type="button" data-action="log-food" data-food-id="${esc(food.id)}" data-food-name="${esc(food.name)}">تناولته اليوم</button>
          <button class="btn-sm btn-sm--outline" type="button" data-action="save-food" data-food-id="${esc(food.id)}" data-food-name="${esc(food.name)}">حفظ فى القائمة</button>
        </div>
      </div>
    </div>
  </article>`;
}

function foodList(foods) {
  if (!foods.length) return '<p class="empty">مفيش أكلة بالاسم ده، جرّب اسم تاني</p>';
  return `<div class="food-list">${foods.map(foodCard).join('')}</div>`;
}

/* ---------- Food list item with quantity (قائمة الأغذية item) ---------- */
function qtyItem(log, { editable = true } = {}) {
  const f = log.food;
  return `<article class="qty-item" data-log-id="${esc(log.id)}">
    <img class="qty-item__image" src="${esc(f.image)}" width="117" height="117" alt="">
    <div class="qty-item__body">
      <h3 class="qty-item__name">${esc(f.name)}</h3>
      <div class="qty-item__rating">
        <span class="food-card__score">${f.rating.toFixed(1)}</span>
        ${stars(f.rating)}
      </div>
      <p class="qty-item__note">${f.goalMatch ? 'متوافق مع هدفك' : 'غير متوافق مع هدفك'}</p>
      <div class="qty-item__controls">
        <div class="stepper${editable ? '' : ' stepper--readonly'}">
          ${editable ? `<button class="stepper__btn" type="button" data-action="qty" data-step="1" data-log-id="${esc(log.id)}" aria-label="زوّد حصة"><img src="assets/icon-plus.svg" width="24" height="24" alt=""></button>` : ''}
          <output class="stepper__value">${log.quantity}</output>
          ${editable ? `<button class="stepper__btn" type="button" data-action="qty" data-step="-1" data-log-id="${esc(log.id)}" aria-label="قلّل حصة"><img src="assets/icon-minus.svg" width="18" height="2" alt=""></button>` : ''}
        </div>
        ${editable ? `<button class="trash-btn" type="button" data-action="delete-log" data-log-id="${esc(log.id)}" aria-label="امسح"><img src="assets/icon-trash.svg" width="18" height="17" alt=""></button>` : ''}
      </div>
    </div>
  </article>`;
}

/* ---------- Big green button (Frame 905) ---------- */
function bigButton(label, action, data = {}) {
  return `<button class="btn-lg" type="button" data-action="${action}"${Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')}>${esc(label)}</button>`;
}

/* ---------- Cancel: big button size, outline style (secondary) ---------- */
function cancelButton() {
  return '<button class="btn-lg btn-lg--outline" type="button" data-action="cancel">✕ إلغاء، عاوز حاجة تانية</button>';
}

/* ---------- Measurement card (Frame 960 / biomark card) ---------- */
function biomarkCard(m, { showUpdate = true } = {}) {
  const diff = Math.round((m.value - m.previous) * 10) / 10;
  const up = diff >= 0;
  return `<article class="biomark${up ? '' : ' biomark--down'}">
    ${showUpdate ? `<button class="biomark__update" type="button" data-action="pick-measure" data-type="${esc(m.type)}" data-name="${esc(m.name)}">
      <img src="assets/icon-edit.svg" width="9" height="9" alt=""> تحديث
    </button>` : '<span class="biomark__update-spacer"></span>'}
    <h3 class="biomark__name">${esc(m.name)}</h3>
    <div class="biomark__value"><strong>${m.value}</strong><span>${esc(m.unit)}</span></div>
    <p class="biomark__delta">
      <span>${up ? 'أعلى' : 'أقل'} من القياس السابق<em> بـ ${Math.abs(diff)} ${esc(m.unit)}</em></span>
      <img src="assets/icon-arrow-${up ? 'up' : 'down'}.svg" width="15" height="15" alt="">
    </p>
  </article>`;
}

function biomarkGrid(list) {
  return `<div class="biomark-grid">${list.map((m) => biomarkCard(m)).join('')}</div>`;
}

/* ---------- Measurement input (Frame 1000002281 / قياسات) ---------- */
function measureInput(m) {
  return `<div class="measure-input" data-type="${esc(m.type)}" data-step="${m.step}">
    <span class="measure-input__label">${esc(m.name)}</span>
    <div class="measure-input__control">
      <button class="measure-input__btn" type="button" data-action="measure-step" data-dir="1" aria-label="زوّد"><img src="assets/icon-chevron-box.svg" width="17" height="15" alt=""></button>
      <input class="measure-input__value" type="number" inputmode="decimal" step="${m.step}" value="${m.value}" aria-label="${esc(m.name)}">
      <span class="measure-input__unit">${esc(m.unit)}</span>
      <button class="measure-input__btn measure-input__btn--flip" type="button" data-action="measure-step" data-dir="-1" aria-label="قلّل"><img src="assets/icon-chevron-box.svg" width="17" height="15" alt=""></button>
    </div>
  </div>`;
}

/* ---------- Progress card (Component 2 / main progress) ---------- */
function progressCard(percent) {
  const r = 40.5;
  const c = 2 * Math.PI * r;
  return `<article class="progress-card">
    <div class="progress-card__text">
      <p>تقدمك اليوم نحو هدفك الصحي<br>بناءً على اختياراتك الغذائية</p>
      <button class="progress-card__btn" type="button" data-action="today-foods">مراجعه خطة اليوم الغذائيه</button>
    </div>
    <div class="progress-card__ring">
      <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
        <circle cx="46" cy="46" r="${r}" stroke="#D9D9D9" stroke-opacity="0.7" stroke-width="11" fill="none"/>
        <circle cx="46" cy="46" r="${r}" stroke="#00FF37" stroke-width="11" fill="none" stroke-linecap="round"
          stroke-dasharray="${(c * percent) / 100} ${c}" transform="rotate(-90 46 46)"/>
      </svg>
      <span>${percent}%</span>
    </div>
  </article>`;
}

/* ---------- Progress calendar (تقويم صفحة التقدم) ---------- */
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function calendar({ year, month, days }) {
  const status = Object.fromEntries(days.map((d) => [d.day, d.status]));
  const first = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  const inMonth = new Date(year, month, 0).getDate();
  const prevMonth = new Date(year, month - 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const n = i - first + 1;
    if (n < 1) cells.push(`<span class="cal__day cal__day--muted">${prevMonth + n}</span>`);
    else if (n > inMonth) cells.push(`<span class="cal__day cal__day--muted">${n - inMonth}</span>`);
    else cells.push(`<span class="cal__day${status[n] ? ' cal__day--' + status[n] : ''}">${n === 1 ? '01' : n}</span>`);
  }
  return `<div class="cal" dir="ltr">
    <div class="cal__header">
      <span class="cal__month" dir="rtl">${AR_MONTHS[month - 1]} ${year}</span>
      <div class="cal__nav">
        <button type="button" data-action="cal-month" data-dir="-1" aria-label="الشهر اللي فات"><img src="assets/icon-chevron.svg" width="24" height="24" alt=""></button>
        <button type="button" data-action="cal-month" data-dir="1" aria-label="الشهر الجاي"><img class="flip" src="assets/icon-chevron.svg" width="24" height="24" alt=""></button>
      </div>
    </div>
    <div class="cal__card">
      <div class="cal__week">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<span>${d}</span>`).join('')}</div>
      <hr class="cal__divider">
      <div class="cal__days">${cells.join('')}</div>
      <div class="cal__legend" dir="rtl">
        <span><i class="cal__bar cal__bar--good"></i>اختيارات مناسبة</span>
        <span><i class="cal__bar cal__bar--improve"></i>تحتاج تحسين</span>
        <span><i class="cal__bar cal__bar--bad"></i>اختيارات غير مناسبة</span>
      </div>
    </div>
  </div>`;
}

  return { toArabicDigits, mealCount, arabicTime, stars, quickActions, chips, searchBar, foodCard, foodList, qtyItem, bigButton, cancelButton,biomarkCard, biomarkGrid, measureInput, progressCard, calendar };
})();
