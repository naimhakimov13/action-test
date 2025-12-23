import { Markup } from 'telegraf';

export const mainClientKeyboard = () => 
  Markup.keyboard([
    ['🔍 Найти мастера', '📝 Создать заявку'],
    ['📞 Связаться с поддержкой']
  ]).resize();

export const mainMasterKeyboard = () =>
  Markup.keyboard([
    ['📋 Мои заявки', '💰 Баланс'],
    ['👤 Профиль']
  ]).resize();

export const mainAdminKeyboard = () =>
  Markup.keyboard([
    ['✅ Одобрить мастеров', '📊 Статистика'],
    ['🏷 Категории', '⚙️ Настройки']
  ]).resize();

export const cancelKeyboard = () =>
  Markup.keyboard([['❌ Отмена']]).resize();

export const backKeyboard = () =>
  Markup.keyboard([['⬅️ Назад']]).resize();

export const categoryButtons = (categories) =>
  Markup.keyboard(
    categories.map(c => [c.name]).concat([['❌ Отмена']])
  ).resize();

export const cityButtons = (cities) =>
  Markup.keyboard(
    cities.map(c => [c.name]).concat([['❌ Отмена']])
  ).resize();

export const requestActionsInline = (requestId) =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ Откликнуться', `respond_${requestId}`)],
    [Markup.button.callback('❌ Закрыть', `close_${requestId}`)]
  ]);

export const masterApprovalInline = (masterId) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Одобрить', `approve_${masterId}`),
      Markup.button.callback('❌ Отклонить', `reject_${masterId}`)
    ]
  ]);

export const confirmKeyboard = () =>
  Markup.keyboard([
    ['✅ Подтвердить'],
    ['❌ Отмена']
  ]).resize();
