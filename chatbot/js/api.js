/* ==========================================================
   api.js — the ONLY file the backend developer needs to change.

   Every function returns a Promise with the shape documented
   above it. Right now they return mock data so the chatbot works
   on its own. Replace each body with a real fetch() call that
   returns the same shape, and the UI keeps working unchanged.
   ========================================================== */

const api = (() => {

const API_BASE = '/api'; // TODO: set the real base URL

// Simulates network latency for the mock data. Remove with the mocks.
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/* ---------- Mock data (delete when connected) ---------- */
const MOCK_FOODS = [
  { id: 'eggs', name: 'بيض', image: 'assets/food-eggs.jpg', rating: 5, goalMatch: true, tags: ['recent', 'match'] },
  { id: 'cheese', name: 'جبنة بيضاء', image: 'assets/food-cheese.jpg', rating: 5, goalMatch: true, tags: ['recent', 'match'] },
  { id: 'foul', name: 'فول', image: 'assets/food-foul.jpg', rating: 4, goalMatch: true, tags: ['medium'] },
];

const MOCK_MEASUREMENTS = [
  { type: 'sugar', name: 'السكر', unit: 'ملغم', value: 6, previous: 11, step: 1 },
  { type: 'pressure', name: 'الضغط', unit: 'ملم', value: 120, previous: 115, step: 1 },
  { type: 'weight', name: 'الوزن', unit: 'كجم', value: 82, previous: 83, step: 0.5 },
  { type: 'hba1c', name: 'السكر التراكمي', unit: '%', value: 5.6, previous: 5.4, step: 0.1 },
];

let mockLogs = [];

/* ---------- Food ---------- */

/** Foods the user logs most often.
 *  @returns {Promise<Food[]>} Food = { id, name, image, rating (0-5), goalMatch } */
async function getFrequentFoods() {
  // return fetch(`${API_BASE}/foods/frequent`).then((r) => r.json());
  await delay();
  return MOCK_FOODS;
}

/** Search the food database.  @returns {Promise<Food[]>} */
async function searchFoods(query) {
  // return fetch(`${API_BASE}/foods?q=${encodeURIComponent(query)}`).then((r) => r.json());
  await delay(250);
  return MOCK_FOODS.filter((f) => f.name.includes(query.trim()));
}

/** Foods picked for the user's health goal.
 *  @param {'all'|'recent'|'match'|'medium'} filter
 *  @returns {Promise<Food[]>} */
async function getSuggestedFoods(filter = 'all') {
  // return fetch(`${API_BASE}/foods/suggested?filter=${filter}`).then((r) => r.json());
  await delay();
  return filter === 'all' ? MOCK_FOODS : MOCK_FOODS.filter((f) => f.tags.includes(filter));
}

/** Log that the user ate a food today (same endpoint as the food page).
 *  @returns {Promise<FoodLog>} FoodLog = { id, food: Food, quantity, loggedAt (ISO string) } */
async function logFood(foodId, quantity = 1) {
  // return fetch(`${API_BASE}/food-logs`, { method: 'POST', body: JSON.stringify({ foodId, quantity }) }).then((r) => r.json());
  await delay();
  const log = { id: String(Date.now() + Math.random()), food: MOCK_FOODS.find((f) => f.id === foodId), quantity, loggedAt: new Date().toISOString() };
  mockLogs.push(log);
  return log;
}

/** Change the number of servings on a log.  @returns {Promise<FoodLog>} */
async function updateFoodLog(logId, quantity) {
  // return fetch(`${API_BASE}/food-logs/${logId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }).then((r) => r.json());
  await delay(150);
  const log = mockLogs.find((l) => l.id === logId);
  if (log) log.quantity = quantity;
  return log;
}

/** Delete a log (undo).  @returns {Promise<void>} */
async function deleteFoodLog(logId) {
  // return fetch(`${API_BASE}/food-logs/${logId}`, { method: 'DELETE' });
  await delay(200);
  mockLogs = mockLogs.filter((l) => l.id !== logId);
}

/** Food logs for today (used by "الأغذية اللي أكلتها").  @returns {Promise<FoodLog[]>} */
async function getTodayFoodLogs() {
  // return fetch(`${API_BASE}/food-logs?date=today`).then((r) => r.json());
  await delay();
  return mockLogs;
}

/** Save a food to the user's list (حفظ فى القائمة).  @returns {Promise<void>} */
async function saveFoodToList(foodId) {
  // return fetch(`${API_BASE}/food-list`, { method: 'POST', body: JSON.stringify({ foodId }) });
  await delay(200);
}

/* ---------- Measurements ---------- */

/** Latest value of each measurement.
 *  @returns {Promise<Measurement[]>}
 *  Measurement = { type, name, unit, value, previous, step } */
async function getMeasurements() {
  // return fetch(`${API_BASE}/measurements/latest`).then((r) => r.json());
  await delay();
  return MOCK_MEASUREMENTS.map((m) => ({ ...m }));
}

/** Save a new reading.  @returns {Promise<Measurement & { recordedAt: string }>} */
async function saveMeasurement(type, value) {
  // return fetch(`${API_BASE}/measurements`, { method: 'POST', body: JSON.stringify({ type, value }) }).then((r) => r.json());
  await delay();
  const m = MOCK_MEASUREMENTS.find((x) => x.type === type);
  m.previous = m.value;
  m.value = value;
  return { ...m, recordedAt: new Date().toISOString() };
}

/* ---------- Progress ---------- */

/** Today's progress toward the health goal.  @returns {Promise<{ percent: number }>} */
async function getTodayProgress() {
  // return fetch(`${API_BASE}/progress/today`).then((r) => r.json());
  await delay();
  return { percent: 85 };
}

/** Day colors for one month.
 *  @returns {Promise<{ year, month (1-12), days: { day: number, status: 'good'|'improve'|'bad' }[] }>} */
async function getProgressCalendar(year, month) {
  // return fetch(`${API_BASE}/progress/calendar?year=${year}&month=${month}`).then((r) => r.json());
  await delay();
  return { year, month, days: [{ day: 1, status: 'good' }, { day: 2, status: 'bad' }, { day: 3, status: 'improve' }] };
}

/* ---------- Free text / voice ---------- */

/** Understands what the user typed or said.
 *  @returns {Promise<{ intent: 'food'|'measure'|'progress'|'suggest'|'unknown', query?: string }>}
 *  The mock uses keywords; the real version can call an NLP service. */
async function detectIntent(text) {
  // return fetch(`${API_BASE}/chat/intent`, { method: 'POST', body: JSON.stringify({ text }) }).then((r) => r.json());
  await delay(300);
  const t = text.trim();
  if (/سكر|ضغط|وزن|قياس/.test(t)) return { intent: 'measure' };
  if (/تقدم|تقدّم|متابعة/.test(t)) return { intent: 'progress' };
  if (/اقتراح|اقترح|أنسب/.test(t)) return { intent: 'suggest' };
  const food = MOCK_FOODS.find((f) => t.includes(f.name));
  if (food || /أكل|اكل|أكلت|اكلت|فطار|غدا|عشا/.test(t)) return { intent: 'food', query: food ? food.name : '' };
  return { intent: 'unknown' };
}

  return { getFrequentFoods, searchFoods, getSuggestedFoods, logFood, updateFoodLog, deleteFoodLog, getTodayFoodLogs, saveFoodToList, getMeasurements, saveMeasurement, getTodayProgress, getProgressCalendar, detectIntent };
})();
