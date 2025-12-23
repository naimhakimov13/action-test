export const createTables = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'master', 'admin')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS masters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      category_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'blocked')),
      rating REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      master_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(id),
      FOREIGN KEY (master_id) REFERENCES masters(id),
      UNIQUE(request_id, master_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      master_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_id) REFERENCES masters(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_masters_status ON masters(status);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category_id);
  `);
};

export const seedData = (db) => {
  const categories = [
    'Сантехник',
    'Электрик',
    'Ремонт техники',
    'Строитель',
    'Клининг',
    'Мастер по мебели',
    'Автомастер',
    'Компьютерный мастер'
  ];

  const cities = [
    'Душанбе',
    'Худжанд',
    'Куляб',
    'Курган-Тюбе',
    'Хорог',
    'Истаравшан',
    'Турсунзаде',
    'Вахдат'
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const insertCity = db.prepare('INSERT OR IGNORE INTO cities (name) VALUES (?)');

  categories.forEach(cat => insertCategory.run(cat));
  cities.forEach(city => insertCity.run(city));
};
