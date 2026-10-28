const express = require('express');
const router = express.Router();
const { db, getSettings } = require('../db');
const { sendMail } = require('../mailer');

// "заповнено" = є значення і воно не заглушка "уточнюється"
// галерея: кожен рядок «URL | підпис»
const parseGallery = (text) => String(text || '').split('\n')
  .map((l) => l.trim()).filter(Boolean)
  .map((l) => { const [url, ...rest] = l.split('|'); return { url: url.trim(), caption: rest.join('|').trim() }; });

// відео: кожен рядок «посилання | підпис». YouTube/Vimeo вбудовуються, решта — кнопка-посилання.
const parseVideos = (text) => String(text || '').split('\n')
  .map((l) => l.trim()).filter(Boolean)
  .map((l) => {
    const [url, ...rest] = l.split('|');
    const u = url.trim();
    const caption = rest.join('|').trim();
    let embed = null; let m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/))) {
      embed = `https://www.youtube-nocookie.com/embed/${m[1]}`;
    } else if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      embed = `https://player.vimeo.com/video/${m[1]}`;
    }
    return { url: u, caption, embed };
  })
  .filter((v) => /^https?:\/\//i.test(v.url));

const filled = (v) => Boolean(v && String(v).trim() && String(v).trim().toLowerCase() !== 'уточнюється');

router.use((req, res, next) => {
  const settings = getSettings();
  res.locals.settings = settings;
  res.locals.currentPath = req.path;
  res.locals.filled = filled;
  res.locals.parseGallery = parseGallery;
  res.locals.parseVideos = parseVideos;
  // Базова адреса сайту: з налаштувань, або автоматично з поточного запиту
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.locals.baseUrl = base;
  res.locals.canonicalUrl = base + (req.path === '/' ? '' : req.path);
  next();
});

const PAGES = [
  { path: '/', desc: 'OM DAYA — благодійний фонд, який підтримує українських дітей і молодих людей з досвідом інституційного виховання на шляху до безпечного, самостійного життя.' },
  { path: '/about', desc: 'Місія, історія та команда благодійного фонду OM DAYA: чому ми допомагаємо дітям повернути довіру до світу.' },
  { path: '/programs', desc: 'Напрями роботи OM DAYA: підготовка до життя поза закладом, адаптація, відпочинок і відновлення, підтримка родин.' },
  { path: '/get-help', desc: 'Як отримати допомогу від OM DAYA: надішліть звернення, ми відповімо протягом 2–3 робочих днів.' },
  { path: '/transparency', desc: 'Прозорість OM DAYA: реєстраційні дані фонду (KRS, NIP, REGON), звітність і принципи роботи з внесками.' },
  { path: '/donate', desc: 'Як підтримати OM DAYA: фінансово, як партнер, волонтер чи фахівець. Банківські реквізити фонду.' },
  { path: '/stories', desc: 'Реальні справи OM DAYA: чесні кадри процесу й результату допомоги дітям.' },
  { path: '/faq', desc: 'Часті запитання про благодійний фонд OM DAYA, внески та отримання допомоги.' },
  { path: '/contacts', desc: 'Контакти благодійного фонду OM DAYA: телефон, соцмережі та форма зворотного зв’язку.' },
];
const descFor = (p) => (PAGES.find((x) => x.path === p) || {}).desc;

router.get('/', (req, res) => {
  const stories = db.prepare('SELECT * FROM stories WHERE published = 1 ORDER BY sort_order LIMIT 1').all();
  const programs = db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  res.render('index', { title: 'Головна', pageDescription: descFor('/'), story: stories[0], programs });
});

router.get('/about', (req, res) => {
  const team = db.prepare('SELECT * FROM team ORDER BY sort_order').all();
  res.render('about', { title: 'Про нас', pageDescription: descFor('/about'), team });
});

router.get('/programs', (req, res) => {
  const programs = db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  res.render('programs', { title: 'Напрями роботи', pageDescription: descFor('/programs'), programs });
});

router.get('/stories', (req, res) => {
  const stories = db.prepare('SELECT * FROM stories WHERE published = 1 ORDER BY sort_order').all();
  res.render('stories', { title: 'Реальні справи', pageDescription: descFor('/stories'), stories });
});

router.get('/stories/:id', (req, res, next) => {
  const story = db.prepare('SELECT * FROM stories WHERE id = ? AND published = 1').get(req.params.id);
  if (!story) return next();
  const desc = (story.excerpt || '').slice(0, 200);
  res.render('story', { title: story.title, pageDescription: desc, story });
});

router.get('/get-help', (req, res) => {
  res.render('get-help', { title: 'Отримати допомогу', pageDescription: descFor('/get-help') });
});

router.get('/transparency', (req, res) => {
  const cases = db.prepare(`SELECT id, title, status, period, received, spent FROM stories
    WHERE published = 1 AND (TRIM(COALESCE(received,'')) != '' OR TRIM(COALESCE(spent,'')) != '')
    ORDER BY sort_order`).all();
  res.render('transparency', { title: 'Звітність', pageDescription: descFor('/transparency'), cases });
});

router.get('/donate', (req, res) => {
  const impact = db.prepare('SELECT * FROM impact_amounts ORDER BY sort_order').all();
  // показуємо лише збори з реальним посиланням (не заглушку "https://")
  const fundraisers = db.prepare('SELECT * FROM fundraisers WHERE active = 1 ORDER BY sort_order').all()
    .filter((f) => /^https?:\/\/[^\s/]+\.[^\s]+/.test(f.url || ''));
  res.render('donate', { title: 'Підтримати', pageDescription: descFor('/donate'), impact, fundraisers });
});

router.get('/faq', (req, res) => {
  const faq = db.prepare('SELECT * FROM faq ORDER BY sort_order').all();
  res.render('faq', { title: 'Питання', pageDescription: descFor('/faq'), faq });
});

router.get('/contacts', (req, res) => {
  res.render('contacts', { title: 'Контакти', pageDescription: descFor('/contacts'), sent: false, error: null });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Політика приватності' });
});

router.get('/offer', (req, res) => {
  res.render('offer', { title: 'Публічна оферта' });
});

router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Умови використання' });
});

router.post('/contacts', (req, res) => {
  const { name, email, message, consent } = req.body;
  if (!consent) {
    return res.render('contacts', {
      title: 'Контакти', pageDescription: descFor('/contacts'), sent: false,
      error: 'Щоб надіслати повідомлення, підтвердіть згоду на обробку персональних даних.',
    });
  }
  if (name && email && message) {
    db.prepare('INSERT INTO messages (name, email, message) VALUES (?,?,?)').run(name, email, message);
    sendMail({
      subject: `Нове повідомлення з сайту від ${name}`,
      text: `Ім'я: ${name}\nEmail: ${email}\n\nПовідомлення:\n${message}`,
    });
  }
  res.render('contacts', { title: 'Контакти', pageDescription: descFor('/contacts'), sent: true, error: null });
});

router.post('/newsletter', (req, res) => {
  const { email, consent } = req.body;
  if (email && consent) {
    try {
      db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
      sendMail({
        subject: 'Нова підписка на розсилку',
        text: `Новий email підписався на розсилку: ${email}`,
      });
    } catch (e) { /* duplicate email — ignore */ }
  }
  res.redirect(req.get('referer') || '/');
});

// ---------- SEO ----------
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${res.locals.baseUrl}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const stories = db.prepare('SELECT id FROM stories WHERE published = 1').all();
  const all = [...PAGES.map((p) => p.path), ...stories.map((s) => `/stories/${s.id}`)];
  const urls = all.map((p) => `  <url><loc>${res.locals.baseUrl}${p === '/' ? '' : p}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

module.exports = router;
