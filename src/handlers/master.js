import db from '../db/database.js';
import { 
  mainMasterKeyboard, 
  categoryButtons, 
  cityButtons, 
  cancelKeyboard,
  confirmKeyboard 
} from '../keyboards.js';
import { formatMaster, formatRequest, isValidPhone } from '../utils/helpers.js';

const registrationStates = new Map();

export const handleMasterRegistration = async (ctx) => {
  const user = db.getUser(ctx.from.id);
  
  if (user && user.role === 'master') {
    const master = db.getMaster(user.id);
    if (master) {
      return ctx.reply('Вы уже зарегистрированы как мастер', mainMasterKeyboard());
    }
  }

  registrationStates.set(ctx.from.id, { step: 'fullname' });
  
  await ctx.reply(
    '👨‍🔧 <b>Регистрация мастера</b>\n\nУкажите ваше ФИО:',
    { 
      parse_mode: 'HTML',
      ...cancelKeyboard() 
    }
  );
};

export const handleRegistrationFullName = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'fullname') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  state.fullName = ctx.message.text;
  state.step = 'phone';

  await ctx.reply('📱 Укажите контактный телефон:', cancelKeyboard());
};

export const handleRegistrationPhone = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'phone') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  if (!isValidPhone(ctx.message.text)) {
    return ctx.reply('❌ Неверный формат телефона. Попробуйте снова:');
  }

  state.phone = ctx.message.text;
  state.step = 'category';

  const categories = db.getCategories();
  await ctx.reply('📂 Выберите вашу категорию:', categoryButtons(categories));
};

export const handleRegistrationCategory = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'category') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  const categories = db.getCategories();
  const category = categories.find(c => c.name === ctx.message.text);

  if (!category) {
    return ctx.reply('Пожалуйста, выберите категорию из списка');
  }

  state.categoryId = category.id;
  state.categoryName = category.name;
  state.step = 'city';

  const cities = db.getCities();
  await ctx.reply('🏙 Выберите город работы:', cityButtons(cities));
};

export const handleRegistrationCity = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'city') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  const cities = db.getCities();
  const city = cities.find(c => c.name === ctx.message.text);

  if (!city) {
    return ctx.reply('Пожалуйста, выберите город из списка');
  }

  state.cityId = city.id;
  state.cityName = city.name;
  state.step = 'description';

  await ctx.reply(
    '📝 Расскажите о своём опыте работы:\n\n(укажите стаж, основные услуги и т.д.)',
    cancelKeyboard()
  );
};

export const handleRegistrationDescription = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'description') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  state.description = ctx.message.text;
  state.step = 'confirm';

  const preview = `
📋 <b>Проверьте данные:</b>

👤 ФИО: ${state.fullName}
📱 Телефон: ${state.phone}
📂 Категория: ${state.categoryName}
🏙 Город: ${state.cityName}

📝 Опыт:
${state.description}
  `.trim();

  await ctx.reply(preview, { 
    parse_mode: 'HTML',
    ...confirmKeyboard() 
  });
};

export const handleRegistrationConfirm = async (ctx) => {
  const state = registrationStates.get(ctx.from.id);
  if (!state || state.step !== 'confirm') return;

  if (ctx.message.text === '❌ Отмена') {
    registrationStates.delete(ctx.from.id);
    return ctx.reply('Регистрация отменена');
  }

  if (ctx.message.text !== '✅ Подтвердить') {
    return ctx.reply('Нажмите кнопку "Подтвердить" или "Отмена"');
  }

  let user = db.getUser(ctx.from.id);
  if (!user) {
    db.createUser(ctx.from.id, 'master', state.phone);
    user = db.getUser(ctx.from.id);
  } else {
    db.db.prepare('UPDATE users SET role = ?, phone = ? WHERE id = ?')
      .run('master', state.phone, user.id);
  }

  db.createMaster(
    user.id,
    state.categoryId,
    state.cityId,
    state.fullName,
    state.description
  );

  registrationStates.delete(ctx.from.id);

  await ctx.reply(
    '✅ Регистрация отправлена!\n\n⏳ Ваша анкета на проверке у администратора.\nМы уведомим вас о результате.',
    { remove_keyboard: true }
  );

  await notifyAdminNewMaster(ctx, user.id);
};

const notifyAdminNewMaster = async (ctx, userId) => {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId) return;

  const master = db.getMaster(userId);
  const message = `🔔 <b>Новый мастер на модерации!</b>\n\n${formatMaster(master)}`;

  try {
    await ctx.telegram.sendMessage(adminId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Одобрить', callback_data: `approve_${master.id}` },
          { text: '❌ Отклонить', callback_data: `reject_${master.id}` }
        ]]
      }
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
};

export const handleMasterStart = async (ctx) => {
  const user = db.getUser(ctx.from.id);
  const master = db.getMaster(user.id);

  if (!master) {
    return ctx.reply('Мастер не найден. Используйте /register для регистрации');
  }

  if (master.status === 'pending') {
    return ctx.reply('⏳ Ваша анкета на проверке. Ожидайте одобрения администратора.');
  }

  if (master.status === 'blocked') {
    return ctx.reply('🚫 Ваш профиль заблокирован. Обратитесь в поддержку.');
  }

  await ctx.reply(
    `👋 Добро пожаловать, ${master.full_name}!\n\n💰 Баланс: ${master.balance} сомони`,
    mainMasterKeyboard()
  );
};

export const handleMasterBalance = async (ctx) => {
  const user = db.getUser(ctx.from.id);
  const master = db.getMaster(user.id);

  const transactions = db.db.prepare(`
    SELECT * FROM transactions 
    WHERE master_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(master.id);

  let message = `💰 <b>Баланс: ${master.balance} сомони</b>\n\n`;
  message += '📊 Последние операции:\n\n';

  if (transactions.length === 0) {
    message += 'Пока операций нет';
  } else {
    transactions.forEach(t => {
      const sign = t.type === 'credit' ? '+' : '-';
      const date = new Date(t.created_at).toLocaleDateString('ru-RU');
      message += `${sign}${t.amount} сом. - ${t.comment}\n${date}\n\n`;
    });
  }

  await ctx.reply(message, { 
    parse_mode: 'HTML',
    ...mainMasterKeyboard() 
  });
};

export const handleMasterProfile = async (ctx) => {
  const user = db.getUser(ctx.from.id);
  const master = db.getMaster(user.id);

  await ctx.reply(
    formatMaster(master),
    { 
      parse_mode: 'HTML',
      ...mainMasterKeyboard() 
    }
  );
};

export const handleMasterRequests = async (ctx) => {
  const user = db.getUser(ctx.from.id);
  const master = db.getMaster(user.id);

  const requests = db.getOpenRequests(master.category_id, master.city_id);

  if (requests.length === 0) {
    return ctx.reply('📋 Пока нет открытых заявок в вашей категории', mainMasterKeyboard());
  }

  await ctx.reply(`Найдено заявок: ${requests.length}`, mainMasterKeyboard());

  for (const request of requests.slice(0, 10)) {
    await ctx.reply(formatRequest(request), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Откликнуться', callback_data: `respond_${request.id}` }
        ]]
      }
    });
  }
};

export const handleMasterResponse = async (ctx) => {
  const requestId = parseInt(ctx.match[1]);
  const user = db.getUser(ctx.from.id);
  const master = db.getMaster(user.id);

  if (master.status !== 'approved') {
    return ctx.answerCbQuery('❌ Ваш профиль не одобрен');
  }

  const responsePrice = parseFloat(process.env.RESPONSE_PRICE || 5);

  if (master.balance < responsePrice) {
    return ctx.answerCbQuery(
      `❌ Недостаточно средств. Нужно ${responsePrice} сом., у вас ${master.balance} сом.`,
      { show_alert: true }
    );
  }

  try {
    db.createResponse(requestId, master.id, responsePrice);
    
    const request = db.getRequest(requestId);
    
    await ctx.answerCbQuery('✅ Отклик отправлен! Клиент получит ваш контакт.');
    
    await ctx.telegram.sendMessage(
      request.client_telegram_id,
      `🔔 <b>Мастер откликнулся на вашу заявку #${requestId}!</b>\n\n${formatMaster(master)}\n\n📱 Телефон: ${master.phone}`,
      { parse_mode: 'HTML' }
    );

  } catch (error) {
    if (error.message === 'Already responded') {
      return ctx.answerCbQuery('❌ Вы уже откликнулись на эту заявку');
    }
    return ctx.answerCbQuery('❌ Ошибка при отклике. Попробуйте позже.');
  }
};

export { registrationStates };
