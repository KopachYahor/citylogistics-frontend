// ============================================
// ПРОФИЛЬ — проверка авторизации и выход
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('Страница профиля загружена');
    console.log('Токен:', token ? 'есть' : 'нет');
    console.log('Пользователь:', user);

    // Если нет токена — на главную
    if (!token) {
        console.log('Нет авторизации, перенаправляем на главную');
        window.location.href = '../index.html';
        return;
    }

    // Обновляем иконку профиля
    if (typeof updateProfileIcon === 'function') {
        updateProfileIcon(true);
    }

    // Кнопка выхода (если нет своего logout — встроенный)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../index.html';
            }
        });
    }
});