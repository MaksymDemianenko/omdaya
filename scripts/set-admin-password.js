// Допоміжний скрипт: генерує bcrypt-хеш для нового пароля адмінки.
//
// Використання:
//   node scripts/set-admin-password.js МійНовийПароль123
//
// Скопіюйте виведений рядок ADMIN_PASSWORD_HASH=... у файл .env
// (і залиште ADMIN_PASSWORD= пустим — хеш має пріоритет).

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Вкажіть пароль: node scripts/set-admin-password.js ВашПароль');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nДодайте цей рядок у .env (замініть існуючий ADMIN_PASSWORD_HASH):\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
