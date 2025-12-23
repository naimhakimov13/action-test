# 🚀 Развертывание бота

## Варианты развертывания

### 1. VPS (рекомендуется)

#### Требования
- Ubuntu/Debian сервер
- Node.js 18+
- PM2 для управления процессами

#### Шаги установки

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Клонирование проекта
git clone <your-repo-url>
cd mastera-tj-bot

# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env
nano .env

# Инициализация БД
npm run init-db

# Запуск через PM2
pm2 start src/index.js --name mastera-tj
pm2 save
pm2 startup
```

### 2. Docker

```dockerfile
# Используйте готовый Dockerfile в репозитории
docker build -t mastera-tj .
docker run -d --name mastera-tj-bot \
  -e BOT_TOKEN=your_token \
  -e ADMIN_TELEGRAM_ID=your_id \
  -v $(pwd)/mastera_tj.db:/app/mastera_tj.db \
  mastera-tj
```

### 3. Railway.app

1. Создайте аккаунт на railway.app
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Deploy автоматически

### 4. Render.com

1. Создайте Web Service
2. Подключите репозиторий
3. Установите переменные окружения
4. Deploy

## Мониторинг (PM2)

```bash
# Просмотр логов
pm2 logs mastera-tj

# Статус
pm2 status

# Перезапуск
pm2 restart mastera-tj

# Остановка
pm2 stop mastera-tj
```

## Бэкапы

```bash
# Настройте регулярный бэкап БД
0 2 * * * cp /path/to/mastera_tj.db /path/to/backups/mastera_tj_$(date +\%Y\%m\%d).db
```

## SSL для webhook (опционально)

Если хотите использовать webhook вместо polling:

```javascript
// В src/index.js замените bot.launch() на:
bot.telegram.setWebhook(`https://yourdomain.com/bot${process.env.BOT_TOKEN}`);
```

## Безопасность

- Не коммитьте `.env` файл
- Используйте strong bot token
- Регулярно обновляйте зависимости: `npm audit fix`
- Ограничьте доступ к серверу (firewall)
- Используйте HTTPS для webhook

## Troubleshooting

### Бот не отвечает
```bash
pm2 logs mastera-tj --lines 100
```

### База данных заблокирована
```bash
# Проверьте процессы
ps aux | grep node
# Остановите все и перезапустите
pm2 restart mastera-tj
```

### Недостаточно памяти
```bash
# Увеличьте лимит для PM2
pm2 start src/index.js --max-memory-restart 300M
```
