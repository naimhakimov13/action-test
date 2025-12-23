import Database from 'better-sqlite3';
import { createTables, seedData } from './schema.js';

class DB {
  constructor() {
    this.db = new Database('mastera_tj.db');
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  init() {
    createTables(this.db);
    seedData(this.db);
  }

  getUser(telegramId) {
    return this.db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  }

  createUser(telegramId, role, phone = null) {
    return this.db.prepare('INSERT INTO users (telegram_id, role, phone) VALUES (?, ?, ?)').run(telegramId, role, phone);
  }

  getOrCreateUser(telegramId, role = 'client') {
    let user = this.getUser(telegramId);
    if (!user) {
      this.createUser(telegramId, role);
      user = this.getUser(telegramId);
    }
    return user;
  }

  getCategories(activeOnly = true) {
    const query = activeOnly 
      ? 'SELECT * FROM categories WHERE is_active = 1 ORDER BY name'
      : 'SELECT * FROM categories ORDER BY name';
    return this.db.prepare(query).all();
  }

  getCities() {
    return this.db.prepare('SELECT * FROM cities ORDER BY name').all();
  }

  createRequest(clientId, categoryId, cityId, description, photoUrl, phone) {
    return this.db.prepare(`
      INSERT INTO requests (client_id, category_id, city_id, description, photo_url, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clientId, categoryId, cityId, description, photoUrl, phone);
  }

  getRequest(requestId) {
    return this.db.prepare(`
      SELECT r.*, c.name as category_name, ci.name as city_name, u.telegram_id as client_telegram_id
      FROM requests r
      JOIN categories c ON r.category_id = c.id
      JOIN cities ci ON r.city_id = ci.id
      JOIN users u ON r.client_id = u.id
      WHERE r.id = ?
    `).get(requestId);
  }

  getOpenRequests(categoryId = null, cityId = null) {
    let query = `
      SELECT r.*, c.name as category_name, ci.name as city_name
      FROM requests r
      JOIN categories c ON r.category_id = c.id
      JOIN cities ci ON r.city_id = ci.id
      WHERE r.status = 'open'
    `;
    const params = [];

    if (categoryId) {
      query += ' AND r.category_id = ?';
      params.push(categoryId);
    }
    if (cityId) {
      query += ' AND r.city_id = ?';
      params.push(cityId);
    }

    query += ' ORDER BY r.created_at DESC';
    return this.db.prepare(query).all(...params);
  }

  createMaster(userId, categoryId, cityId, fullName, description) {
    return this.db.prepare(`
      INSERT INTO masters (user_id, category_id, city_id, full_name, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, categoryId, cityId, fullName, description);
  }

  getMaster(userId) {
    return this.db.prepare(`
      SELECT m.*, c.name as category_name, ci.name as city_name, u.telegram_id
      FROM masters m
      JOIN categories c ON m.category_id = c.id
      JOIN cities ci ON m.city_id = ci.id
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = ?
    `).get(userId);
  }

  getMasterById(masterId) {
    return this.db.prepare(`
      SELECT m.*, c.name as category_name, ci.name as city_name, u.telegram_id, u.phone
      FROM masters m
      JOIN categories c ON m.category_id = c.id
      JOIN cities ci ON m.city_id = ci.id
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(masterId);
  }

  getPendingMasters() {
    return this.db.prepare(`
      SELECT m.*, c.name as category_name, ci.name as city_name, u.telegram_id
      FROM masters m
      JOIN categories c ON m.category_id = c.id
      JOIN cities ci ON m.city_id = ci.id
      JOIN users u ON m.user_id = u.id
      WHERE m.status = 'pending'
      ORDER BY m.created_at DESC
    `).all();
  }

  approveMaster(masterId) {
    return this.db.prepare('UPDATE masters SET status = ? WHERE id = ?').run('approved', masterId);
  }

  rejectMaster(masterId) {
    return this.db.prepare('DELETE FROM masters WHERE id = ?').run(masterId);
  }

  updateMasterBalance(masterId, amount, type, comment) {
    const transaction = this.db.transaction(() => {
      const master = this.db.prepare('SELECT balance FROM masters WHERE id = ?').get(masterId);
      const newBalance = type === 'credit' ? master.balance + amount : master.balance - amount;
      
      this.db.prepare('UPDATE masters SET balance = ? WHERE id = ?').run(newBalance, masterId);
      this.db.prepare(`
        INSERT INTO transactions (master_id, amount, type, comment)
        VALUES (?, ?, ?, ?)
      `).run(masterId, amount, type, comment);

      return newBalance;
    });

    return transaction();
  }

  createResponse(requestId, masterId, responsePrice) {
    const transaction = this.db.transaction(() => {
      const master = this.getMasterById(masterId);
      
      if (master.balance < responsePrice) {
        throw new Error('Insufficient balance');
      }

      const existing = this.db.prepare('SELECT id FROM responses WHERE request_id = ? AND master_id = ?')
        .get(requestId, masterId);
      
      if (existing) {
        throw new Error('Already responded');
      }

      this.db.prepare('INSERT INTO responses (request_id, master_id) VALUES (?, ?)').run(requestId, masterId);
      this.updateMasterBalance(masterId, responsePrice, 'debit', `Отклик на заявку #${requestId}`);

      return true;
    });

    return transaction();
  }

  getRequestResponses(requestId) {
    return this.db.prepare(`
      SELECT r.*, m.full_name, m.rating, u.telegram_id, u.phone
      FROM responses r
      JOIN masters m ON r.master_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE r.request_id = ?
      ORDER BY r.created_at DESC
    `).all(requestId);
  }

  closeRequest(requestId) {
    return this.db.prepare('UPDATE requests SET status = ? WHERE id = ?').run('closed', requestId);
  }
}

export default new DB();
