export const formatRequest = (request) => {
  let text = `📝 <b>Заявка #${request.id}</b>\n\n`;
  text += `📂 Категория: ${request.category_name}\n`;
  text += `🏙 Город: ${request.city_name}\n`;
  text += `📱 Телефон: ${request.phone}\n\n`;
  text += `📄 Описание:\n${request.description}\n\n`;
  text += `⏰ Создана: ${new Date(request.created_at).toLocaleString('ru-RU')}`;
  return text;
};

export const formatMaster = (master) => {
  let text = `👨‍🔧 <b>${master.full_name}</b>\n\n`;
  text += `📂 Категория: ${master.category_name}\n`;
  text += `🏙 Город: ${master.city_name}\n`;
  if (master.description) {
    text += `📝 Опыт:\n${master.description}\n\n`;
  }
  text += `⭐️ Рейтинг: ${master.rating || 'Нет отзывов'}\n`;
  text += `💰 Баланс: ${master.balance} сомони\n`;
  text += `📊 Статус: ${getStatusText(master.status)}`;
  return text;
};

export const formatMasterShort = (master) => {
  let text = `👨‍🔧 ${master.full_name}\n`;
  text += `⭐️ ${master.rating || 'Новый'}\n`;
  text += `📱 ${master.phone || 'Не указан'}`;
  return text;
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '⏳ На модерации',
    'approved': '✅ Одобрен',
    'blocked': '🚫 Заблокирован'
  };
  return statusMap[status] || status;
};

export const isValidPhone = (phone) => {
  return /^\+?[0-9]{9,15}$/.test(phone);
};
