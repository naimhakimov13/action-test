import 'dotenv/config';
import { Telegraf } from 'telegraf';
import db from './db/database.js';

import {
  handleClientStart,
  handleCreateRequest,
  handleRequestCategory,
  handleRequestCity,
  handleRequestDescription,
  handleRequestPhone,
  handleRequestConfirm,
  handleRequestPhoto,
  handleFindMaster,
  handleSupport,
  requestStates
} from './handlers/client.js';

import {
  handleMasterRegistration,
  handleRegistrationFullName,
  handleRegistrationPhone,
  handleRegistrationCategory,
  handleRegistrationCity,
  handleRegistrationDescription,
  handleRegistrationConfirm,
  handleMasterStart,
  handleMasterBalance,
  handleMasterProfile,
  handleMasterRequests,
  handleMasterResponse,
  registrationStates
} from './handlers/master.js';

import {
  isAdmin,
  handleAdminStart,
  handlePendingMasters,
  handleApproveMaster,
  handleRejectMaster,
  handleStatistics,
  handleCategories,
  handleAddBalance
} from './handlers/admin.js';

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env file');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  const user = db.getOrCreateUser(ctx.from.id, 'client');
  
  if (isAdmin(ctx.from.id)) {
    return handleAdminStart(ctx);
  }
  
  if (user.role === 'master') {
    return handleMasterStart(ctx);
  }
  
  return handleClientStart(ctx);
});

bot.command('register', handleMasterRegistration);
bot.command('admin', handleAdminStart);
bot.command('addbalance', handleAddBalance);

bot.hears('🔍 Найти мастера', handleFindMaster);
bot.hears('📝 Создать заявку', handleCreateRequest);
bot.hears('📞 Связаться с поддержкой', handleSupport);

bot.hears('📋 Мои заявки', handleMasterRequests);
bot.hears('💰 Баланс', handleMasterBalance);
bot.hears('👤 Профиль', handleMasterProfile);

bot.hears('✅ Одобрить мастеров', handlePendingMasters);
bot.hears('📊 Статистика', handleStatistics);
bot.hears('🏷 Категории', handleCategories);

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  
  const regState = registrationStates.get(userId);
  if (regState) {
    switch (regState.step) {
      case 'fullname':
        return handleRegistrationFullName(ctx);
      case 'phone':
        return handleRegistrationPhone(ctx);
      case 'category':
        return handleRegistrationCategory(ctx);
      case 'city':
        return handleRegistrationCity(ctx);
      case 'description':
        return handleRegistrationDescription(ctx);
      case 'confirm':
        return handleRegistrationConfirm(ctx);
    }
  }

  const reqState = requestStates.get(userId);
  if (reqState) {
    switch (reqState.step) {
      case 'category':
        return handleRequestCategory(ctx);
      case 'city':
        return handleRequestCity(ctx);
      case 'description':
        return handleRequestDescription(ctx);
      case 'phone':
        return handleRequestPhone(ctx);
      case 'confirm':
        return handleRequestConfirm(ctx);
    }
  }
});

bot.on('photo', handleRequestPhoto);

bot.action(/^respond_(\d+)$/, handleMasterResponse);
bot.action(/^approve_(\d+)$/, handleApproveMaster);
bot.action(/^reject_(\d+)$/, handleRejectMaster);

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

bot.launch().then(() => {
  console.log('✅ Bot started successfully');
  console.log('📊 Database ready');
  console.log('🚀 Mastera TJ is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
