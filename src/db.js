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

if (countRow('stories') === 0) {
  const insert = db.prepare(`INSERT INTO stories (title, excerpt, body, image_url, published, sort_order) VALUES (?,?,?,?,?,?)`);
  insert.run('Назва історії (приклад)', 'Короткий уривок історії — з’явиться після надання тексту фондом.', 'Повний текст історії родини. Замініть на реальну історію, надану фондом, за згодою родини.', '', 1, 1);
}

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

if (countRow('team') === 0) {
  const insert = db.prepare(`INSERT INTO team (name, role, photo_url, sort_order) VALUES (?,?,?,?)`);
  for (let i = 1; i <= 4; i++) insert.run("Ім'я Прізвище", 'Посада', '', i);
}

if (countRow('programs') === 0 || versionBumped) {
  db.exec('DELETE FROM programs');
  const insert = db.prepare(`INSERT INTO programs (title, description, icon, sort_order) VALUES (?,?,?,?)`);
  insert.run('Підготовка до життя поза закладом', 'Допомагаємо дитині знайомитися з повсякденним життям, розвивати навички, відкривати нові можливості та будувати стосунки з надійними дорослими.', '🚪', 1);
  insert.run('Адаптація до безпечного життя', 'Супроводжуємо перехід до самостійності або сімейного середовища: відновлення довіри, особисті кордони, побутові навички, освіта й коло підтримки.', '🧭', 2);
  insert.run('Відпочинок, табори та відновлення', 'Створюємо безпечні програми в Україні та країнах Європи, де дитина може відпочивати, дружити, пізнавати нове й формувати теплі спогади.', '🏕️', 3);
  insert.run('Збереження родини та новий початок', 'Допомагаємо українським родинам у глибокій кризі знайти правову, психологічну й практичну підтримку та створити безпечні умови для дитини.', '🏡', 4);
}

if (countRow('impact_amounts') === 0) {
  const insert = db.prepare(`INSERT INTO impact_amounts (amount, description, sort_order) VALUES (?,?,?)`);
  insert.run(400, 'сесія арт-терапії для дитини', 1);
  insert.run(1000, 'консультація з психотерапевтом', 2);
  insert.run(3240, 'місяць курсів англійської мови', 3);
  insert.run(18000, 'ноутбук для дистанційного навчання', 4);
  insert.run(27000, 'путівка в табір психологічної реабілітації', 5);
}

if (countRow('fundraisers') === 0) {
  const insert = db.prepare(`INSERT INTO fundraisers (title, platform, url, description, image_url, active, sort_order) VALUES (?,?,?,?,?,?,?)`);
  insert.run(
    'Назва збору (приклад)',
    'siepomaga.pl / zrzutka.pl / pomagam.pl',
    'https://',
    'Короткий опис, на що саме йде цей збір. Замініть на реальне посилання та опис в адмінці → «Збори».',
    '',
    1,
    1
  );
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
