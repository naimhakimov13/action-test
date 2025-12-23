import db from '../db/database.js';
import { mainAdminKeyboard } from '../keyboards.js';
import { formatMaster } from '../utils/helpers.js';

export const isAdmin = (telegramId) => {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  return adminId && telegramId.toString() === adminId.toString();
};

export const handleAdminStart = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }

  await ctx.reply(
    '👑 <b>Админ-панель</b>\n\nВыберите действие:',
    { 
      parse_mode: 'HTML',
      ...mainAdminKeyboard() 
    }
  );
};

export const handlePendingMasters = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }

  const masters = db.getPendingMasters();

  if (masters.length === 0) {
    return ctx.reply('✅ Нет мастеров на модерации', mainAdminKeyboard());
  }

  await ctx.reply(`👥 Мастеров на модерации: ${masters.length}`, mainAdminKeyboard());

  for (const master of masters) {
    await ctx.reply(formatMaster(master), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Одобрить', callback_data: `approve_${master.id}` },
          { text: '❌ Отклонить', callback_data: `reject_${master.id}` }
        ]]
      }
    });
  }
};

export const handleApproveMaster = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.answerCbQuery('❌ У вас нет прав администратора');
  }

  const masterId = parseInt(ctx.match[1]);
  const master = db.getMasterById(masterId);

  if (!master) {
    return ctx.answerCbQuery('❌ Мастер не найден');
  }

  db.approveMaster(masterId);
  
  await ctx.answerCbQuery('✅ Мастер одобрен');
  await ctx.editMessageText(
    `${formatMaster(master)}\n\n✅ <b>ОДОБРЕН</b>`,
    { parse_mode: 'HTML' }
  );

  await ctx.telegram.sendMessage(
    master.telegram_id,
    '🎉 <b>Поздравляем!</b>\n\nВаша анкета одобрена!\nТеперь вы можете получать заявки от клиентов.\n\n💡 Пополните баланс, чтобы откликаться на заявки.',
    { parse_mode: 'HTML' }
  );
};

export const handleRejectMaster = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.answerCbQuery('❌ У вас нет прав администратора');
  }

  const masterId = parseInt(ctx.match[1]);
  const master = db.getMasterById(masterId);

  if (!master) {
    return ctx.answerCbQuery('❌ Мастер не найден');
  }

  db.rejectMaster(masterId);
  
  await ctx.answerCbQuery('✅ Мастер отклонён');
  await ctx.editMessageText(
    `${formatMaster(master)}\n\n❌ <b>ОТКЛОНЁН</b>`,
    { parse_mode: 'HTML' }
  );

  await ctx.telegram.sendMessage(
    master.telegram_id,
    '❌ К сожалению, ваша анкета не прошла модерацию.\n\nВы можете попробовать зарегистрироваться снова, указав более подробную информацию.',
    { parse_mode: 'HTML' }
  );
};

export const handleStatistics = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }

  const stats = {
    totalUsers: db.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    totalClients: db.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('client').count,
    totalMasters: db.db.prepare('SELECT COUNT(*) as count FROM masters').get().count,
    approvedMasters: db.db.prepare('SELECT COUNT(*) as count FROM masters WHERE status = ?').get('approved').count,
    pendingMasters: db.db.prepare('SELECT COUNT(*) as count FROM masters WHERE status = ?').get('pending').count,
    openRequests: db.db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = ?').get('open').count,
    totalResponses: db.db.prepare('SELECT COUNT(*) as count FROM responses').get().count,
    totalRevenue: db.db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = ?').get('debit').total || 0
  };

  const message = `
📊 <b>Статистика</b>

👥 Всего пользователей: ${stats.totalUsers}
👤 Клиентов: ${stats.totalClients}

👨‍🔧 Всего мастеров: ${stats.totalMasters}
✅ Одобрено: ${stats.approvedMasters}
⏳ На модерации: ${stats.pendingMasters}

📝 Открытых заявок: ${stats.openRequests}
📨 Всего откликов: ${stats.totalResponses}

💰 Общая выручка: ${stats.totalRevenue.toFixed(2)} сомони
  `.trim();

  await ctx.reply(message, { 
    parse_mode: 'HTML',
    ...mainAdminKeyboard() 
  });
};

export const handleCategories = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }

  const categories = db.getCategories(false);

  let message = '🏷 <b>Категории услуг:</b>\n\n';
  categories.forEach(c => {
    const status = c.is_active ? '✅' : '❌';
    message += `${status} ${c.name}\n`;
  });

  await ctx.reply(message, { 
    parse_mode: 'HTML',
    ...mainAdminKeyboard() 
  });
};

export const handleAddBalance = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }

  const args = ctx.message.text.split(' ');
  if (args.length !== 3) {
    return ctx.reply('Использование: /addbalance <telegram_id> <сумма>');
  }

  const telegramId = parseInt(args[1]);
  const amount = parseFloat(args[2]);

  const user = db.getUser(telegramId);
  if (!user || user.role !== 'master') {
    return ctx.reply('❌ Мастер не найден');
  }

  const master = db.getMaster(user.id);
  const newBalance = db.updateMasterBalance(master.id, amount, 'credit', 'Пополнение администратором');

  await ctx.reply(`✅ Баланс мастера пополнен на ${amount} сом.\nНовый баланс: ${newBalance} сом.`);

  await ctx.telegram.sendMessage(
    telegramId,
    `💰 Ваш баланс пополнен на ${amount} сомони!\n\nТекущий баланс: ${newBalance} сомони`,
    { parse_mode: 'HTML' }
  );
};
