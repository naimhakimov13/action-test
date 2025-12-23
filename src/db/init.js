import db from './database.js';

console.log('✅ Database initialized successfully');
console.log('📊 Categories:', db.getCategories().length);
console.log('🏙 Cities:', db.getCities().length);
