import db from '../db/database.js';
import { 
  mainClientKeyboard, 
  categoryButtons, 
  cityButtons, 
  cancelKeyboard,
  confirmKeyboard 
} from '../keyboards.js';
import { formatRequest, isValidPhone } from '../utils/helpers.js';

const requestStates = new Map();

export const handleClientStart = async (ctx) => {
  const user = db.getOrCreateUser(ctx.from.id, 'client');
  
  await ctx.reply(
    `👋 Добро пожаловать в <b>Мастера TJ</b>!\n\nВыберите действие:`,
    { 
      parse_mode: 'HTML',
      ...mainClientKeyboard() 
    }
  );
};

export const handleCreateRequest = async (ctx) => {
  const categories = db.getCategories();
  
  requestStates.set(ctx.from.id, { step: 'category' });
  
  await ctx.reply(
    '📂 Выберите категорию услуги:',
    categoryButtons(categories)
  );
};

export const handleRequestCategory = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'category') return;

  if (ctx.message.text === '❌ Отмена') {
    requestStates.delete(ctx.from.id);
    return ctx.reply('Создание заявки отменено', mainClientKeyboard());
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
  await ctx.reply('🏙 Выберите город:', cityButtons(cities));
};

export const handleRequestCity = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'city') return;

  if (ctx.message.text === '❌ Отмена') {
    requestStates.delete(ctx.from.id);
    return ctx.reply('Создание заявки отменено', mainClientKeyboard());
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
    '📝 Опишите вашу проблему или задачу:\n\n(можете прикрепить фото)',
    cancelKeyboard()
  );
};

export const handleRequestDescription = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'description') return;

  if (ctx.message.text === '❌ Отмена') {
    requestStates.delete(ctx.from.id);
    return ctx.reply('Создание заявки отменено', mainClientKeyboard());
  }

  state.description = ctx.message.text;
  state.step = 'phone';

  await ctx.reply(
    '📱 Укажите контактный телефон:\n\n(например: +992901234567)',
    cancelKeyboard()
  );
};

export const handleRequestPhoto = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'description') return;

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  state.photoUrl = photo.file_id;
  state.description = ctx.message.caption || 'Без описания';
  state.step = 'phone';

  await ctx.reply(
    '📱 Укажите контактный телефон:\n\n(например: +992901234567)',
    cancelKeyboard()
  );
};

export const handleRequestPhone = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'phone') return;

  if (ctx.message.text === '❌ Отмена') {
    requestStates.delete(ctx.from.id);
    return ctx.reply('Создание заявки отменено', mainClientKeyboard());
  }

  if (!isValidPhone(ctx.message.text)) {
    return ctx.reply('❌ Неверный формат телефона. Попробуйте снова:');
  }

  state.phone = ctx.message.text;
  state.step = 'confirm';

  const preview = `
📋 <b>Проверьте данные заявки:</b>

📂 Категория: ${state.categoryName}
🏙 Город: ${state.cityName}
📱 Телефон: ${state.phone}

📝 Описание:
${state.description}
${state.photoUrl ? '\n📷 Фото прикреплено' : ''}
  `.trim();

  await ctx.reply(preview, { 
    parse_mode: 'HTML',
    ...confirmKeyboard() 
  });
};

export const handleRequestConfirm = async (ctx) => {
  const state = requestStates.get(ctx.from.id);
  if (!state || state.step !== 'confirm') return;

  if (ctx.message.text === '❌ Отмена') {
    requestStates.delete(ctx.from.id);
    return ctx.reply('Создание заявки отменено', mainClientKeyboard());
  }

  if (ctx.message.text !== '✅ Подтвердить') {
    return ctx.reply('Нажмите кнопку "Подтвердить" или "Отмена"');
  }

  const user = db.getUser(ctx.from.id);
  const result = db.createRequest(
    user.id,
    state.categoryId,
    state.cityId,
    state.description,
    state.photoUrl || null,
    state.phone
  );

  requestStates.delete(ctx.from.id);

  await ctx.reply(
    `✅ Заявка #${result.lastInsertRowid} создана!\n\nМастера получат уведомление. Ожидайте откликов.`,
    mainClientKeyboard()
  );

  await notifyMasters(ctx, result.lastInsertRowid, state.categoryId, state.cityId);
};

const notifyMasters = async (ctx, requestId, categoryId, cityId) => {
  const request = db.getRequest(requestId);
  const masters = db.db.prepare(`
    SELECT u.telegram_id FROM masters m
    JOIN users u ON m.user_id = u.id
    WHERE m.status = 'approved' 
    AND m.category_id = ? 
    AND m.city_id = ?
  `).all(categoryId, cityId);

  const message = `🔔 <b>Новая заявка!</b>\n\n${formatRequest(request)}`;

  for (const master of masters) {
    try {
      await ctx.telegram.sendMessage(master.telegram_id, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Откликнуться', callback_data: `respond_${requestId}` }
          ]]
        }
      });
    } catch (error) {
      console.error(`Failed to notify master ${master.telegram_id}:`, error);
    }
  }
};

export const handleFindMaster = async (ctx) => {
  await ctx.reply(
    '🔍 Функция поиска мастеров в разработке.\n\nВы можете создать заявку, и мастера откликнутся сами!',
    mainClientKeyboard()
  );
};

export const handleSupport = async (ctx) => {
  await ctx.reply(
    '📞 <b>Поддержка</b>\n\nПо всем вопросам:\n📧 Email: support@masteratj.com\n📱 Telegram: @masteratj_support',
    { 
      parse_mode: 'HTML',
      ...mainClientKeyboard() 
    }
  );
};

export { requestStates };
