# Antioxida Chatbot — تسليم للمبرمج

الشات بوت جاهز من ناحية الشكل والتجربة. **المطلوب منك بس تربط الباك اند في ملف واحد: `js/api.js`.**

## التشغيل

افتح `index.html` بالدبل كليك، أو من أي سيرفر static (Live Server في VS Code، `npx serve chatbot`، …).

السكريبتات عادية (مش ES modules) ومترتبة في `index.html`: `api.js` ← `components.js` ← `chat.js`.
`api.js` بيعرّف object اسمه `api`، و`components.js` بيعرّف `ui`، و`chat.js` بيستخدمهم.
لو هتنقلهم لمشروع فيه bundler، رجّع `export`/`import` عادي.

### روابط مباشرة لكل فلو (للمراجعة والـ QA)

| الرابط | الفلو |
|---|---|
| `index.html` | البداية (رسالة الترحيب + الأربع اختيارات) |
| `index.html#food` | تسجيل الأغذية |
| `index.html#measure` | سجّل قياس |
| `index.html#progress` | تقدمي |
| `index.html#suggest` | اقتراحات |

## هيكل الملفات

```
chatbot/
├── index.html          الصفحة (thread + composer + navbar)
├── css/styles.css      كل الستايل، المتغيرات في أول الملف
├── js/api.js           ← الملف الوحيد اللي هتغيّره (كل الاتصال بالسيرفر)
├── js/components.js    HTML الكومبوننتس (نفس كومبوننتس فيجما)
├── js/chat.js          المحادثة والفلوهات
└── assets/             الأيقونات والصور
```

## إزاي الشات شغال

كل حاجة في محادثة واحدة:
1. اليوزر يختار (زرار أو كتابة أو صوت) → اختياره يظهر **فقاعة منه** على الشمال.
2. المساعد يرد بنقط «بيكتب…» لحد ما الـ API يرد، وبعدين يظهر رده ومعاه الكومبوننت.
3. أزرار الرسايل القديمة بتتقفل أوتوماتيك عشان اليوزر ما يدوسش عليها بالغلط
   (عدّاد الكمية والتقويم بيفضلوا شغالين).
4. أي خطوة مستنية اختيار من اليوزر فيها زرار «إلغاء، عاوز حاجة تانية» بيرجّعه للاختيارات الأربعة من غير ما يتسجّل حاجة.
5. لو الـ API رجّع error، المساعد بيقول «حصلت مشكلة في الاتصال» وزرار «رجوع للبداية».

### الفلوهات

**تسجيل الأغذية**
تسجيل الأغذية → بحث + «بتاكلهم كتير» (كروت أغذية) → «تناولته اليوم» → «اتسجّلت ✅ + الساعة» + عدّاد الكمية → سجّل أكلة تانية / امسح / خلاص

**سجّل قياس**
سجّل قياس → كروت القياسات → «تحديث» على قياس → خانة القياس (اكتب أو بالأسهم) + «حفظ القياس» → «اتسجّل ✅» + الكارت بالقيمة الجديدة

**تقدمي**
تقدمي → كارت النسبة (85%) → تقويم الشهر بألوانه (الأسهم بتغيّر الشهر) → «الأغذية اللي أكلتها النهارده»

**اقتراحات**
اقتراحات → فلاتر + كروت الأغذية المقترحة + «أضف جميع الأغذية» → أي «تناولته اليوم» بيكمل زي فلو التسجيل

**الكتابة والصوت**
اللي اليوزر يكتبه أو يقوله بيروح لـ `detectIntent()` وهي اللي بتحدد الفلو.
الصوت بيستخدم Web Speech API (`ar-EG`) ومتاح على Chrome و Android. لو مش متاح المساعد بيقول لليوزر يكتب.

## الـ API المطلوب (`js/api.js`)

كل function فيها التعليق بالـ endpoint المقترح، وشكل الداتا اللي لازم ترجع. غيّر جسم الـ function بـ `fetch()` يرجّع نفس الشكل، وامسح الـ mock data.

| Function | Method / Endpoint مقترح | بيرجّع |
|---|---|---|
| `getFrequentFoods()` | `GET /foods/frequent` | `Food[]` |
| `searchFoods(q)` | `GET /foods?q=` | `Food[]` |
| `getSuggestedFoods(filter)` | `GET /foods/suggested?filter=all\|recent\|match\|medium` | `Food[]` |
| `logFood(foodId, quantity)` | `POST /food-logs` | `FoodLog` |
| `updateFoodLog(logId, quantity)` | `PATCH /food-logs/:id` | `FoodLog` |
| `deleteFoodLog(logId)` | `DELETE /food-logs/:id` | — |
| `getTodayFoodLogs()` | `GET /food-logs?date=today` | `FoodLog[]` |
| `saveFoodToList(foodId)` | `POST /food-list` | — |
| `getMeasurements()` | `GET /measurements/latest` | `Measurement[]` |
| `saveMeasurement(type, value)` | `POST /measurements` | `Measurement & { recordedAt }` |
| `getTodayProgress()` | `GET /progress/today` | `{ percent }` |
| `getProgressCalendar(year, month)` | `GET /progress/calendar` | `{ year, month, days: [{ day, status }] }` |
| `detectIntent(text)` | `POST /chat/intent` | `{ intent, query? }` |

**أشكال الداتا**

```js
Food        = { id, name, image, rating /* 0-5 */, goalMatch /* boolean */ }
FoodLog     = { id, food: Food, quantity, loggedAt /* ISO date */ }
Measurement = { type, name, unit, value, previous, step }
// status في التقويم: 'good' (أخضر) | 'improve' (أصفر) | 'bad' (أحمر)
// intent: 'food' | 'measure' | 'progress' | 'suggest' | 'unknown'
```

> مهم: التسجيل من الشات لازم يستخدم **نفس الـ endpoints** اللي بتسجّل منها صفحات الأغذية والقياسات، عشان يظهر على طول في صفحة التقدم وفي باقي الأبلكيشن.

## الكومبوننتس وأسماؤها في فيجما

| في الكود (`components.js`) | في فيجما |
|---|---|
| `quickActions()` | كروت الشات الخضرا (chatbot) |
| `chips()` | Button (الأزرار البيضا) |
| `searchBar()` | Frame 1000002281 / بحث |
| `foodCard()` | cards / arabic card |
| `qtyItem()` | عنصر قائمة الأغذية بعدّاد الكمية |
| `bigButton()` | Frame 905 (الزرار الأخضر الكبير) |
| `biomarkCard()` | Frame 960 / biomark card |
| `measureInput()` | Frame 1000002281 / قياسات |
| `progressCard()` | Component 2 / main progress |
| `calendar()` | تقويم صفحة التقدم |
| navbar في `index.html` | navbar |

## المقاسات (من Text styles فيجما)

H1 ‏20/32 · H2 ‏16/24 · Body ‏14 · Small ‏12 — كلها متغيرات في أول `css/styles.css`.
