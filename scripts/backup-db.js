// Копіює data.sqlite у папку backups/ з датою у назві.
// Запуск вручну:  node scripts/backup-db.js
// Або постав у планувальник (напр. щодня вночі) — Task Scheduler (Windows) / cron (Linux/Mac).

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', process.env.DB_PATH || 'data.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(DB_PATH)) {
  console.error('Файл бази даних не знайдено:', DB_PATH);
  process.exit(1);
}

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(BACKUP_DIR, `data-${stamp}.sqlite`);

fs.copyFileSync(DB_PATH, dest);
console.log('Бекап створено:', dest);

// залишаємо тільки останні 30 бекапів, щоб папка не росла безкінечно
const files = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('data-') && f.endsWith('.sqlite'))
  .sort();

if (files.length > 30) {
  const toDelete = files.slice(0, files.length - 30);
  for (const f of toDelete) fs.unlinkSync(path.join(BACKUP_DIR, f));
  console.log(`Видалено ${toDelete.length} старих бекапів (залишено останні 30).`);
}
