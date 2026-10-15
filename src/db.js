const path = require('path');
const { DatabaseSync } = require('node:sqlite'); // вбудований у Node.js модуль — не потребує компіляції

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(__dirname, '..', 'data.sqlite');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');

// ---------- schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  image_url TEXT,
  published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  photo_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS impact_amounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  place TEXT,
  period TEXT,
  received TEXT,
  spent TEXT,
  result TEXT,
  note TEXT,
  status TEXT,
  gallery TEXT,
  published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fundraisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT,
  url TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Міграція: колонка gallery для історій (фото-галерея: рядок = «URL | підпис»)
const storyCols = db.prepare("PRAGMA table_info(stories)").all().map((c) => c.name);
if (!storyCols.includes('gallery')) db.exec('ALTER TABLE stories ADD COLUMN gallery TEXT');

// ---------- default settings ----------
// Ці поля — авторський текст сайту. Оновлюються автоматично при кожному деплої,
// щоб правки контенту (як ця) гарантовано з'являлись на сайті.
const contentDefaults = {
  org_name: 'OM DAYA',
  org_legal_name: 'Fundacja Om Daya',
  org_krs: '0001213732',
  org_nip: '8842837228',
  org_regon: '543583768',
  org_address: 'Świdnica, Польща',
  hero_eyebrow: 'Благодійний фонд OM DAYA',
  hero_title: 'Допомагаємо дітям знову довіряти світові',
  hero_lead: 'Підтримуємо українських дітей, підлітків і молодих людей з досвідом інституційного виховання — до виходу із закладу, під час переходу та після нього. Допомагаємо відкривати інший формат життя: безпечний, самостійний і наповнений підтримувальними стосунками.',
  hero_tagline: 'Співчуття, що стає дією.',
  mission_eyebrow: 'Наша місія',
  mission_title: 'Ми допомагаємо дітям, повертаючи їхню довіру до світу',
  mission_text: 'OM DAYA — це спільнота людей, які вірять, що співчуття має ставати дією: чесною, дбайливою і такою, що не принижує.',
  mission_quote: 'Світлом, яке одна людина передає іншій — і якого від цього не стає менше.',
  history_eyebrow: 'Наша історія',
  history_title: 'Ми хочемо, щоб дитина знову повірила: світ може бути добрим',
  history_lead: 'Історія OM DAYA почалася задовго до офіційної реєстрації фонду — з особистого досвіду, небайдужості та бажання не пройти повз.',
  history_body: 'Упродовж багатьох років засновники OM DAYA допомагали дітям власними силами — там, де бачили потребу й розуміли, що не можуть залишитися осторонь.\n\nОсобистий досвід, пов’язаний із непростим шляхом відновлення власної дитини, відкрив перед ними світ сімей, які щодня докладають величезних зусиль заради здоров’я, добробуту та майбутнього своїх дітей.\n\nЦей шлях дав глибоке розуміння того, наскільки важливо, щоб у складний момент поруч опинилася людина, яка вислухає, підтримає й допоможе зробити наступний крок.\n\nЗгодом до цієї справи почали долучатися рідні, друзі та однодумці. Так особиста ініціатива поступово перетворилася на спільну справу, а пізніше — на благодійний фонд OM DAYA, офіційно зареєстрований у Польщі.\n\nСпочатку ми допомагали там, де бачили конкретну потребу: покращували умови життя, долучалися до вирішення питань здоров’я, передавали необхідні речі та створювали для дітей моменти радості.\n\nКожна така допомога була важливою. Але що більше ми знайомилися з дітьми та їхніми історіями, то ясніше розуміли: справжня підтримка не може закінчуватися переданими речами або завершеним проєктом.\n\nДитині потрібне не лише те, що зробить кращим її сьогодні. Їй потрібен досвід, який допоможе повірити у своє завтра.',
  history_highlight: 'Досвід безпеки. Досвід довіри. Досвід турботи. Досвід життя, у якому можна мріяти.',
  values_text: 'За кожною потребою ми бачимо дитину — з гідністю, власним голосом, шляхом і правом на майбутнє.',
  values_lines: 'Я важлива.\nЯ не сама.\nПоруч є люди, яким можна довіряти.\nМоє життя може бути іншим.',
  honesty_eyebrow: 'Чесно про наш етап',
  honesty_title: 'Ми лише починаємо цей шлях',
  honesty_text: 'OM DAYA не створює видимість великої організації. Ми відкрито показуємо те, що вже робимо, і те, що тільки будуємо.',
};

// Ці поля заповнює адмін через панель керування — не перезаписуємо їх при деплої,
// щоб не втратити реальні контакти, реквізити тощо, якщо їх вже вписали.
const operationalDefaults = {
  stat_families: '—',
  stat_donors: '—',
  stat_years: '—',
  contact_email: 'уточнюється',
  contact_phone: '+48 734 977 171',
  contact_address: 'уточнюється',
  social_facebook: 'https://www.facebook.com/profile.php?id=61588472436048',
  social_instagram: 'https://www.instagram.com/omdaya.care/',
  social_youtube: '',
  social_viber: '',
  social_whatsapp: 'https://wa.me/48734977171',
  bank_requisites: 'IBAN: PL96 1940 1076 3297 1954 0000 0000\nBIC/SWIFT: AGRIPLPR\nНазва рахунку: OM DAYA\nТип рахунку: Konto SOLISTA Biznes\nОтримувач: Fundacja Om Daya',
  site_url: '',
  legal_draft: '1',
};

const upsertKeep = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING`);

// Контент-текст оновлюється лише один раз за версію (при першому запуску після
// оновлення коду) — далі адмін може вільно редагувати ці поля в панелі,
// і наступні перезапуски сервера вже не будуть їх перезаписувати.
const CONTENT_VERSION = '2';
const currentVersion = db.prepare('SELECT value FROM settings WHERE key = ?').get('content_version');
const versionBumped = !currentVersion || currentVersion.value !== CONTENT_VERSION;

if (versionBumped) {
  const upsertForce = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  for (const [key, value] of Object.entries(contentDefaults)) upsertForce.run(key, value);
  upsertForce.run('content_version', CONTENT_VERSION);
}

for (const [key, value] of Object.entries(operationalDefaults)) upsertKeep.run(key, value);

// ---------- seed demo content only if tables are empty ----------
const countRow = (table) => db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;

// FAQ і напрями роботи — текст цього релізу (v2). Якщо це перший запуск після
// оновлення коду — оновлюємо їх до нових формулювань, навіть якщо рядки вже існували.
if (countRow('faq') === 0 || versionBumped) {
  db.exec('DELETE FROM faq');
  const insert = db.prepare(`INSERT INTO faq (question, answer, sort_order) VALUES (?,?,?)`);
  const items = [
    ['Кому фонд надає допомогу?', 'Насамперед — дітям і підліткам з досвідом інституційного виховання, а також родинам, які переживають кризу і потребують підтримки, щоб зберегти безпечне середовище для дитини.', 1],
    ['Як я можу переконатись, що кошти йдуть за призначенням?', 'Ми відкрито показуємо шлях кожної допомоги: потребу, отримані кошти, витрати та результат. Детальніше — на сторінці «Звітність».', 2],
    ['Чи можу я підтримати фонд не грошима?', 'Так, ми приймаємо гуманітарну допомогу та волонтерську підтримку — напишіть нам, щоб дізнатись, що зараз потрібно.', 3],
    ['Чи можна отримати підтвердження про пожертву?', 'Так, напишіть нам на пошту або в соцмережі після переказу — надішлемо підтвердження.', 4],
    ['Чи можна пожертвувати з-за кордону?', 'Так, реквізити для міжнародних переказів вказані на сторінці «Підтримати».', 5],
    ['Як звʼязатися з фондом напряму?', 'Контакти вказані на сторінці «Контакти» — email, телефон та соцмережі.', 6],
  ];
  for (const it of items) insert.run(...it);
}

if (countRow('programs') === 0 || versionBumped) {
  db.exec('DELETE FROM programs');
  const insert = db.prepare(`INSERT INTO programs (title, description, icon, sort_order) VALUES (?,?,?,?)`);
  insert.run('Підготовка до життя поза закладом', 'Допомагаємо дитині знайомитися з повсякденним життям, розвивати навички, відкривати нові можливості та будувати стосунки з надійними дорослими.', '🚪', 1);
  insert.run('Адаптація до безпечного життя', 'Супроводжуємо перехід до самостійності або сімейного середовища: відновлення довіри, особисті кордони, побутові навички, освіта й коло підтримки.', '🧭', 2);
  insert.run('Відпочинок, табори та відновлення', 'Створюємо безпечні програми в Україні та країнах Європи, де дитина може відпочивати, дружити, пізнавати нове й формувати теплі спогади.', '🏕️', 3);
  insert.run('Збереження родини та новий початок', 'Допомагаємо українським родинам у глибокій кризі знайти правову, психологічну й практичну підтримку та створити безпечні умови для дитини.', '🏡', 4);
}

// Демо-записи (приклади з першої збірки сайту) більше не створюються.
// Один раз видаляємо ті, що вже потрапили в базу і лишились незмінними —
// реальні дані, які вписали в адмінці, не чіпаємо.
const demoCleaned = db.prepare('SELECT value FROM settings WHERE key = ?').get('demo_cleanup_v1');
if (!demoCleaned) {
  db.prepare("DELETE FROM stories WHERE title = 'Назва історії (приклад)'").run();
  db.prepare("DELETE FROM fundraisers WHERE url = 'https://' AND title = 'Назва збору (приклад)'").run();
  db.prepare("DELETE FROM team WHERE name = 'Ім''я Прізвище' AND role = 'Посада'").run();
  const demoImpact = [
    [400, 'сесія арт-терапії для дитини'],
    [1000, 'консультація з психотерапевтом'],
    [3240, 'місяць курсів англійської мови'],
    [18000, 'ноутбук для дистанційного навчання'],
    [27000, 'путівка в табір психологічної реабілітації'],
  ];
  const delImpact = db.prepare('DELETE FROM impact_amounts WHERE amount = ? AND description = ?');
  for (const [amount, description] of demoImpact) delImpact.run(amount, description);
  db.prepare(`INSERT INTO settings (key, value) VALUES ('demo_cleanup_v1', '1')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run();
}


// ---------- Перші реальні матеріали (одноразово; далі все редагується в адмінці) ----------
const materialsSeeded = db.prepare('SELECT value FROM settings WHERE key = ?').get('materials_seed_v1');
if (!materialsSeeded) {
  const insStory = db.prepare(`INSERT INTO stories (title, excerpt, body, image_url, gallery, published, sort_order) VALUES (?,?,?,?,?,?,?)`);

  insStory.run(
    'Таращанський навчально-реабілітаційний центр: допомога, яка триває',
    'Регулярно привозимо продукти харчування, засоби гігієни та необхідні речі. Першим кроком фонд оплатив обробку дерев’яних конструкцій покрівлі, щоб зупинити руйнування даху.',
    [
      'Таращанський навчально-реабілітаційний центр — заклад, де навчаються й живуть діти з особливими освітніми потребами. Коли команда OM DAYA вперше побачила умови, в яких перебувають діти, стало зрозуміло: пройти повз не вийде.',
      'З того часу фонд неодноразово привозив до центру продукти харчування, засоби гігієни та найнеобхідніші речі. Ми не хочемо бути фондом, який приїхав один раз і зник: справжня допомога не буває одноразовою, тому ми повертаємося — і діти знають, що про них пам’ятають.',
      'Найгострішою проблемою виявився дах. Через аварійний стан дерев’яних конструкцій вода роками руйнувала приміщення, а після вибухової хвилі від ракетного удару неподалік стан покрівлі ще погіршився. Кожна негода означала нові протікання й вологі стіни.',
      'Першим кроком OM DAYA оплатила роботи з обробки дерев’яних конструкцій покрівлі, щоб зупинити подальше руйнування даху. Платежі та фото «до» і «після» — у розділі «Звітність».',
      'Це ще не фінал. Попереду ремонт укриття, покращення вентиляції, оновлення приміщень, закупівля обладнання та побутової техніки. Про кожен етап ми повідомлятимемо окремо.',
    ].join('\n\n'),
    '/assets/stories/tarashcha-building.jpg',
    [
      '/assets/stories/tarashcha-building.jpg | Таращанський навчально-реабілітаційний центр',
      '/assets/stories/tarashcha-aid.jpg | Продукти та засоби гігієни, привезені до центру',
      '/assets/stories/tarashcha-crafts.jpg | Творчі заняття в центрі',
    ].join('\n'),
    1, 1
  );

  insStory.run(
    'VI Європейський благодійний футбольний турнір «Херсонщина та Крим — це Україна»',
    'Українці з різних куточків Європи об’єдналися заради дітей Білозерщини. Під час турніру зібрано 4 942 zł.',
    [
      'VI Європейський благодійний футбольний турнір «Херсонщина та Крим — це Україна» об’єднав українців з різних куточків Європи заради підтримки дітей Білозерщини.',
      'Переможцем турніру стала команда «Фаворит». Її участь підтримала компанія «Фаворит Партнер». Але цього дня перемогла не лише одна команда: перемогли єдність, підтримка й благодійність.',
      'Завдяки учасникам, гостям, волонтерам та партнерам вдалося зібрати 4 942 zł. Ці кошти будуть спрямовані на підтримку дітей Білозерщини та реалізацію важливих соціальних ініціатив.',
      'Звіт про використання коштів ми опублікуємо в розділі «Звітність» після реалізації допомоги. Дякуємо кожному, хто був поруч.',
    ].join('\n\n'),
    '/assets/stories/tournament.jpg',
    '/assets/stories/tournament.jpg | Учасники турніру',
    1, 2
  );

  const insReport = db.prepare(`INSERT INTO reports (title, place, period, received, spent, result, note, status, gallery, published, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  insReport.run(
    'Обробка дерев’яних конструкцій покрівлі',
    'Таращанський навчально-реабілітаційний центр',
    '17–22 липня 2026',
    '',
    '4 473,32 zł — дві оплати за договором від 17 липня 2026: 2 237,71 zł (571,50 USD) від 17.07.2026 та 2 235,61 zł (569,48 USD) від 22.07.2026',
    'Оплачено роботи з обробки дерев’яних конструкцій покрівлі, щоб зупинити подальше руйнування даху. Це перший етап: попереду ремонт укриття, покращення вентиляції, оновлення приміщень, закупівля обладнання та побутової техніки.',
    'Банківські комісії за переказами: 40 zł і 120 zł. Підтвердження переказів зберігаються у фонді.',
    'Перший етап',
    [
      '/assets/stories/roof-before-1.jpg | До початку робіт',
      '/assets/stories/roof-before-2.jpg | До початку робіт',
      '/assets/stories/roof-after-1.jpg | Після першого етапу',
      '/assets/stories/roof-after-2.jpg | Після першого етапу',
    ].join('\n'),
    1, 1
  );

  insReport.run(
    'VI Європейський благодійний футбольний турнір',
    'Благодійний турнір «Херсонщина та Крим — це Україна»',
    '',
    '4 942 zł',
    '',
    'Кошти будуть спрямовані на підтримку дітей Білозерщини та реалізацію важливих соціальних ініціатив.',
    'Звіт про використання коштів буде опубліковано після реалізації допомоги.',
    'Очікується звіт',
    '',
    1, 2
  );

  db.prepare(`INSERT INTO settings (key, value) VALUES ('materials_seed_v1', '1')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run();
}


// ---------- Матеріали, частина 2 (одноразово; не залежить від частини 1) ----------
const materials2 = db.prepare('SELECT value FROM settings WHERE key = ?').get('materials_seed_v2');
if (!materials2) {
  const exists = db.prepare("SELECT id FROM stories WHERE title LIKE 'Підтримка дитячого спорту%'").get();
  if (!exists) {
    db.prepare(`INSERT INTO stories (title, excerpt, body, image_url, gallery, published, sort_order) VALUES (?,?,?,?,?,?,?)`).run(
      'Підтримка дитячого спорту: подяка від київської «Школи Спорту»',
      'КДЮСШ «Школа Спорту» у Києві відзначила OM DAYA подякою за внесок у розвиток греко-римської боротьби.',
      [
        'У складні часи дітям особливо важливо відчувати, що життя не зупинилося. Саме спорт допомагає повернути відчуття стабільності: тут є команда, тренер, підтримка й цілі, заради яких хочеться рухатися вперед.',
        'Тому OM DAYA підтримує дитячі спортивні ініціативи. Одна з них — КДЮСШ «Школа Спорту» в Києві: до спортивної зали щодня приходять понад 50 дітей віком від 6 до 12 років. Школа відзначила благодійну організацію «OM DAYA» подякою «за вагомий особистий внесок у розвиток греко-римської боротьби».',
        'Приміщення школи потребують ремонту, зокрема фасад і підсобні приміщення. Про допомогу з ремонтом ми розповімо окремо.',
      ].join('\n\n'),
      '/assets/stories/sports-plaque-cover.jpg',
      '/assets/stories/sports-plaque.jpg | Подяка від КДЮСШ «Школа Спорту»',
      1, 3
    );
  }
  db.prepare(`INSERT INTO settings (key, value) VALUES ('materials_seed_v2', '1')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run();
}

// ---------- helpers ----------
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

function setSetting(key, value) {
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
}

module.exports = { db, getSettings, setSetting };
