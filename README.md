# CityLogistics — Frontend

Клиентская часть платформы на Vanilla JS + HTML/CSS. Работает через `fetch` с REST API монолита.

## Ролевая модель (Логика)
После логина фронтенд запрашивает `/api/auth/me` и определяет роль:
- **Клиент (`profile.html`):** Создание заказов, история, отслеживание статусов (`NEW → ACCEPTED → IN_TRANSIT → ARRIVED → DELIVERED`).
- **Водитель (`driver-dashboard.html`):** Свой кабинет с карточками заказов и кнопками смены статуса.
- **Безопасность:** JWT хранится в `localStorage` и передается в заголовке `Authorization`. Ненужные для роли пункты меню скрываются.

## Как запустить
```bash
npx live-server --port=5500