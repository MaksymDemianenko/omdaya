require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const pagesRouter = require('./routes/pages');
const adminRouter = require('./routes/admin');

const app = express();
app.set('trust proxy', 1); // Render працює за проксі — потрібно для коректного https у посиланнях

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

app.use('/admin', adminRouter);
app.use('/', pagesRouter);

app.use((req, res) => {
  res.status(404).send('Сторінку не знайдено — <a href="/">на головну</a>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OM DAYA site running: http://localhost:${PORT}`);
  console.log(`Admin panel:          http://localhost:${PORT}/admin`);
});
