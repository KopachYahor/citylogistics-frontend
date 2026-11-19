// Ждем, когда загрузится страница
document.addEventListener('DOMContentLoaded', function() {

    // Находим кнопку и меню
    const burger = document.getElementById('burgerButton');
    const navMenu = document.getElementById('navbar');

    // Проверяем, нашли ли мы их
    if (burger && navMenu) {

        // Вешаем обработчик клика на кнопку
        burger.addEventListener('click', function() {
            // Переключаем классы
            this.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        // Закрываем меню, если кликнули на ссылку внутри него
        navMenu.addEventListener('click', function(event) {
            // Проверяем, кликнули ли на ссылку
            if (event.target.tagName === 'A') {
                // Убираем классы open
                burger.classList.remove('open');
                navMenu.classList.remove('open');
            }
        });

        // Закрываем меню при изменении размера экрана (если стали больше 1000px)
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1000) {
                burger.classList.remove('open');
                navMenu.classList.remove('open');
            }
        });
    }
});