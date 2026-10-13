# CityLogistics — Frontend

HTML/CSS/JS фронт платформы CityLogistics. Ходит к двум бэкендам через REST.

## Как запустить

```bash
cd citylogistics-frontend
npx live-server --port=5500
```

Открывается `http://127.0.0.1:5500`.

## Что нужно для работы

Оба бэкенда должны быть запущены:

- `citylogistics-core` на `http://localhost:8080`
- `citylogistics-driver-service` на `http://localhost:8082`

CORS в монолите настроен на origin `http://localhost:5500` и `http://127.0.0.1:5500`.

## Структура

```
├── index.html            — главная
├── html/
│   ├── about.html
│   ├── information.html
│   ├── price.html
│   ├── order.html        — форма создания заказа
│   ├── order-status.html — отслеживание
│   ├── profile.html      — личный кабинет
│   ├── driver-form.html
│   ├── feedback.html
│   └── contacts.html
├── css/style.css
├── js/
│   ├── script.js         — API, авторизация, заказы
│   ├── burger.js         — мобильное меню
│   ├── faq.js
│   └── profile.js
└── img/
```

## Стек

Vanilla JS (без React/Vue). Чистый CSS. Работает через `fetch` к `http://localhost:8080/api` (монолит) и `http://localhost:8082/api` (driver-service).

## Что умеет

- Регистрация и логин (JWT в `localStorage`)
- Создание заказа (`order.html`)
- Просмотр своих заказов (`order-status.html`)
- Отслеживание статуса (полоса прогресса `NEW → PROCESSING → DELIVERED`)
- Меню профиля (dropdown поверх шапки)
- Отзывчивая вёрстка

## Лицензия

MIT