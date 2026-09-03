const express = require('express');
const router = express.Router();
const { db, getSettings } = require('../db');
const { sendMail } = require('../mailer');

router.use((req, res, next) => {
  res.locals.settings = getSettings();
  res.locals.currentPath = req.path;
  next();
});

router.get('/', (req, res) => {
  const stories = db.prepare('SELECT * FROM stories WHERE published = 1 ORDER BY sort_order LIMIT 1').all();
  const programs = db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  const impact = db.prepare('SELECT * FROM impact_amounts ORDER BY sort_order').all();
  res.render('index', { title: 'Головна', story: stories[0], programs, impact });
});

router.get('/about', (req, res) => {
  const team = db.prepare('SELECT * FROM team ORDER BY sort_order').all();
  res.render('about', { title: 'Про нас', team });
});

router.get('/programs', (req, res) => {
  const programs = db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  res.render('programs', { title: 'Напрями роботи', programs });
});

router.get('/stories', (req, res) => {
  const stories = db.prepare('SELECT * FROM stories WHERE published = 1 ORDER BY sort_order').all();
  res.render('stories', { title: 'Реальні справи', stories });
});

router.get('/get-help', (req, res) => {
  res.render('get-help', { title: 'Отримати допомогу' });
});

router.get('/transparency', (req, res) => {
  res.render('transparency', { title: 'Звітність' });
});

router.get('/donate', (req, res) => {
  const impact = db.prepare('SELECT * FROM impact_amounts ORDER BY sort_order').all();
  const fundraisers = db.prepare('SELECT * FROM fundraisers WHERE active = 1 ORDER BY sort_order').all();
  res.render('donate', { title: 'Підтримати', impact, fundraisers });
});

router.get('/faq', (req, res) => {
  const faq = db.prepare('SELECT * FROM faq ORDER BY sort_order').all();
  res.render('faq', { title: 'Питання', faq });
});

router.get('/contacts', (req, res) => {
  res.render('contacts', { title: 'Контакти', sent: false });
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
  const { name, email, message } = req.body;
  if (name && email && message) {
    db.prepare('INSERT INTO messages (name, email, message) VALUES (?,?,?)').run(name, email, message);
    sendMail({
      subject: `Нове повідомлення з сайту від ${name}`,
      text: `Ім'я: ${name}\nEmail: ${email}\n\nПовідомлення:\n${message}`,
    });
  }
  res.render('contacts', { title: 'Контакти', sent: true });
});

router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  if (email) {
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

module.exports = router;
