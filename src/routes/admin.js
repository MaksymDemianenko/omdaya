const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { db, getSettings, setSetting } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// ---------- auth ----------
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Вхід в адмінку', error: null, layout: false });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;

  let ok = false;
  if (hash) {
    ok = bcrypt.compareSync(password || '', hash);
  } else if (plain) {
    ok = password === plain;
  }

  if (ok) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Вхід в адмінку', error: 'Невірний пароль', layout: false });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// everything below requires login
router.use(requireAdmin);

router.get('/', (req, res) => {
  const counts = {
    stories: db.prepare('SELECT COUNT(*) c FROM stories').get().c,
    faq: db.prepare('SELECT COUNT(*) c FROM faq').get().c,
    team: db.prepare('SELECT COUNT(*) c FROM team').get().c,
    programs: db.prepare('SELECT COUNT(*) c FROM programs').get().c,
    impact: db.prepare('SELECT COUNT(*) c FROM impact_amounts').get().c,
    fundraisers: db.prepare('SELECT COUNT(*) c FROM fundraisers').get().c,
    reports: db.prepare('SELECT COUNT(*) c FROM reports').get().c,
    messages: db.prepare('SELECT COUNT(*) c FROM messages').get().c,
    newsletter: db.prepare('SELECT COUNT(*) c FROM newsletter').get().c,
  };
  res.render('admin/dashboard', { title: 'Адмінка', counts, layout: false });
});

// ---------- settings ----------
router.get('/settings', (req, res) => {
  res.render('admin/settings', { title: 'Налаштування сайту', settings: getSettings(), saved: false, layout: false });
});

router.post('/settings', (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    setSetting(key, value);
  }
  res.render('admin/settings', { title: 'Налаштування сайту', settings: getSettings(), saved: true, layout: false });
});

// ---------- generic CRUD builder ----------
function buildCrud({ table, fields, listTitle, singularTitle, orderBy = 'sort_order', basePath = table }) {
  const r = express.Router();

  r.get('/', (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
    res.render('admin/list', {
      title: listTitle, rows, table, basePath, fields, layout: false,
    });
  });

  r.get('/new', (req, res) => {
    res.render('admin/form', { title: `Нове: ${singularTitle}`, table, basePath, fields, item: {}, layout: false });
  });

  r.post('/new', (req, res) => {
    const cols = fields.map(f => f.name);
    const placeholders = cols.map(() => '?').join(',');
    const values = cols.map(c => req.body[c] ?? '');
    db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`).run(...values);
    res.redirect(`/admin/${basePath}`);
  });

  r.get('/:id/edit', (req, res) => {
    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!item) return res.redirect(`/admin/${basePath}`);
    res.render('admin/form', { title: `Редагувати: ${singularTitle}`, table, basePath, fields, item, layout: false });
  });

  r.post('/:id/edit', (req, res) => {
    const cols = fields.map(f => f.name);
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => req.body[c] ?? '');
    db.prepare(`UPDATE ${table} SET ${setSql} WHERE id = ?`).run(...values, req.params.id);
    res.redirect(`/admin/${basePath}`);
  });

  r.post('/:id/delete', (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.redirect(`/admin/${basePath}`);
  });

  return r;
}

router.use('/stories', buildCrud({
  table: 'stories',
  listTitle: 'Історії',
  singularTitle: 'історія',
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text' },
    { name: 'excerpt', label: 'Короткий уривок', type: 'textarea' },
    { name: 'body', label: 'Повний текст', type: 'textarea' },
    { name: 'image_url', label: 'Головне фото (шлях, напр. /assets/stories/photo.jpg)', type: 'text' },
    { name: 'gallery', label: 'Галерея: кожен рядок «шлях | підпис»', type: 'textarea' },
    { name: 'published', label: 'Опубліковано (1/0)', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

router.use('/faq', buildCrud({
  table: 'faq',
  listTitle: 'Питання (FAQ)',
  singularTitle: 'питання',
  fields: [
    { name: 'question', label: 'Питання', type: 'text' },
    { name: 'answer', label: 'Відповідь', type: 'textarea' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

router.use('/team', buildCrud({
  table: 'team',
  listTitle: 'Команда',
  singularTitle: 'учасник команди',
  fields: [
    { name: 'name', label: "Ім'я", type: 'text' },
    { name: 'role', label: 'Посада', type: 'text' },
    { name: 'photo_url', label: 'URL фото', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

router.use('/programs', buildCrud({
  table: 'programs',
  listTitle: 'Напрями роботи',
  singularTitle: 'напрям',
  fields: [
    { name: 'title', label: 'Назва', type: 'text' },
    { name: 'description', label: 'Опис', type: 'textarea' },
    { name: 'icon', label: 'Емодзі-іконка', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));


router.use('/reports', buildCrud({
  table: 'reports',
  listTitle: 'Звіти про проєкти (розділ «Звітність»)',
  singularTitle: 'звіт',
  fields: [
    { name: 'title', label: 'Назва проєкту', type: 'text' },
    { name: 'place', label: 'Де / для кого (необов’язково)', type: 'text' },
    { name: 'status', label: 'Статус (напр. «Перший етап», «Очікується звіт»)', type: 'text' },
    { name: 'period', label: 'Період', type: 'text' },
    { name: 'received', label: 'Отримано (сума)', type: 'text' },
    { name: 'spent', label: 'Витрачено (сума та призначення)', type: 'textarea' },
    { name: 'result', label: 'Результат — що вдалося зробити', type: 'textarea' },
    { name: 'note', label: 'Примітка (дрібним шрифтом)', type: 'textarea' },
    { name: 'gallery', label: 'Фото: кожен рядок «шлях | підпис»', type: 'textarea' },
    { name: 'published', label: 'Опубліковано (1/0)', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

router.use('/impact', buildCrud({
  table: 'impact_amounts',
  basePath: 'impact',
  listTitle: 'Суми пожертв',
  singularTitle: 'сума',
  fields: [
    { name: 'amount', label: 'Сума (€)', type: 'text' },
    { name: 'description', label: 'На що йде', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

// ---------- автозаповнення картки збору за посиланням ----------
function decodeEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractMeta(html, attr, key) {
  const re1 = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? decodeEntities(m[1]) : '';
}

router.post('/fundraisers/fetch-preview', async (req, res) => {
  const { url } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Вставте коректне посилання (має починатись з http:// або https://)' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OMDAYA-site/1.0; +https://omdaya.care)' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Сторінка відповіла з помилкою (${response.status})` });
    }

    const html = await response.text();

    let title = extractMeta(html, 'property', 'og:title');
    if (!title) {
      const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = m ? decodeEntities(m[1]) : '';
    }

    const description = extractMeta(html, 'property', 'og:description') || extractMeta(html, 'name', 'description');
    let image = extractMeta(html, 'property', 'og:image');
    let platform = extractMeta(html, 'property', 'og:site_name');

    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, url).href; } catch (e) { image = ''; }
    }
    if (!platform) {
      try { platform = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { platform = ''; }
    }

    res.json({ title, description, image, platform });
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Сайт не відповів вчасно' : err.message;
    res.status(500).json({ error: `Не вдалося отримати дані за посиланням: ${msg}` });
  }
});

router.use('/fundraisers', buildCrud({
  table: 'fundraisers',
  listTitle: 'Збори (посилання на офіційні платформи)',
  singularTitle: 'збір',
  fields: [
    { name: 'title', label: 'Назва збору', type: 'text' },
    { name: 'platform', label: 'Платформа (напр. siepomaga.pl)', type: 'text' },
    { name: 'url', label: 'Посилання на збір', type: 'text' },
    { name: 'description', label: 'Опис — на що йде збір', type: 'textarea' },
    { name: 'image_url', label: 'URL фото (необов’язково)', type: 'text' },
    { name: 'active', label: 'Показувати на сайті (1/0)', type: 'text' },
    { name: 'sort_order', label: 'Порядок', type: 'text' },
  ],
}));

// ---------- read-only: messages & newsletter ----------
router.get('/messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.render('admin/messages', { title: 'Повідомлення з форми', rows, layout: false });
});

router.get('/newsletter', (req, res) => {
  const rows = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
  res.render('admin/newsletter', { title: 'Підписники розсилки', rows, layout: false });
});

module.exports = router;
