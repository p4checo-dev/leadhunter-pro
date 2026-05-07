const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'leads.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    address TEXT,
    category TEXT,
    status TEXT DEFAULT 'NOVO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function addLead(lead) {
  try {
    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, address, category)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(lead.name, lead.phone, lead.address, lead.category);
    return { success: true, status: 'ADDED' };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: true, status: 'ALREADY_EXISTS' };
    }
    throw err;
  }
}

function isPhoneListed(phone) {
  const stmt = db.prepare('SELECT id FROM leads WHERE phone = ?');
  const result = stmt.get(phone);
  return !!result;
}

function getAllLeads() {
  return db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
}

module.exports = {
  addLead,
  isPhoneListed,
  getAllLeads
};
