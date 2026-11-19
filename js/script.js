// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const API_URL = 'http://localhost:8080/api';

// Статусы заказа (OrderStatus на бэкенде) по-русски
const STATUS_LABELS = {
    NEW: 'Ожидает водителя',
    ACCEPTED: 'Водитель назначен',
    IN_TRANSIT: 'В пути',
    ARRIVED: 'Прибыл',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён'
};

// Страницы лежат в корне (index.html) и в html/. Пути строим от текущей страницы,
// чтобы сайт работал, даже если открыт не из корня сервера
const ROOT = window.location.pathname.includes('/html/') ? '../' : '';

function pageUrl(page) {
    return page === 'index.html' ? ROOT + 'index.html' : ROOT + 'html/' + page;
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Токен истёк или недействителен: выходим и открываем окно входа на главной
function goToLogin() {
    clearSession();
    window.location.href = pageUrl('index.html') + '#login';
}

// Тело ответа как JSON. Если сервер вернул не JSON (например, HTML-страницу ошибки), будет {}
function readJson(response) {
    return response.json().catch(() => ({}));
}

// Запрос к API с токеном. На 401 сразу уводит на вход: вызывающему коду
// возвращается промис, который никогда не завершится, потому что страница уже уходит
async function apiFetch(path, options = {}) {
    const response = await fetch(API_URL + path, {
        ...options,
        headers: { ...authHeaders(), ...(options.headers || {}) }
    });
    if (response.status === 401) {
        goToLogin();
        return new Promise(() => {});
    }
    return response;
}

// ============================================
// АВТОПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ
// ============================================
function setActiveNavLink() {

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu li a');

    const isMainPage = currentPath === '/' ||
        currentPath === '/index.html' ||
        currentPath.endsWith('index.html');

    if (isMainPage) return;

    const pageName = currentPath.split('/').pop().replace('.html', '');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const linkName = href.replace(/^.*\//, '').replace('.html', '');

        if (pageName === linkName) {
            link.classList.add('active');
        }
    });
}
// ============================================
// АДАПТАЦИЯ МЕНЮ ПОД РОЛЬ
// ============================================
function adaptMenuForRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'DRIVER') return;

    document.querySelectorAll('.navbar-menu li a').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.includes('order.html') ||
            href.includes('order-status.html') ||
            href.includes('feedback.html')) {
            const li = link.closest('li');
            if (li) li.style.display = 'none';
        }
    });
}

// ============================================
// РЕДИРЕКТ ВОДИТЕЛЯ С КЛИЕНТСКИХ СТРАНИЦ
// ============================================
function redirectDriverFromClientPages() {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.role !== 'DRIVER') return;

    const path = window.location.pathname;
    if (path.endsWith('profile.html') ||
        path.endsWith('order-status.html') ||
        path.endsWith('order.html')) {
        window.location.href = 'driver-dashboard.html';
    }
}
// ============================================
// ЗАГОЛОВКИ С ТОКЕНОМ
// ============================================
// Экранирует текст перед вставкой через innerHTML. Без этого адрес вида
// <img src=x onerror="..."> выполнился бы как скрипт и мог прочитать токен из localStorage (XSS).
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function authHeaders() {
    const token = localStorage.getItem('token');
    return token
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
}

// ============================================
// ИКОНКА ПРОФИЛЯ
// ============================================
window.updateProfileIcon = function(isLoggedIn) {
    const profileIcon = document.querySelector('.navbar-profile');
    if (!profileIcon) return;

    if (isLoggedIn) {
        profileIcon.innerHTML = `
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="18" fill="#4CAF50"/>
                <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="white"/>
            </svg>
        `;
        profileIcon.onclick = function(e) {
            e.preventDefault();
            showProfileMenu();
        };
    } else {
        profileIcon.innerHTML = `
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="currentColor"/>
            </svg>
        `;
        profileIcon.onclick = function(e) {
            e.preventDefault();
            openModal('login');
        };
    }
};

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================
function openModal(defaultTab = 'login') {
    const authModal = document.getElementById('authModal');
    if (!authModal) {
        // На этой странице окна входа нет: открываем его на главной
        window.location.href = pageUrl('index.html') + '#' + defaultTab;
        return;
    }
    document.body.style.overflow = 'hidden';
    authModal.style.display = 'block';
    switchTab(defaultTab);
}

function closeModal() {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;
    document.body.style.overflow = '';
    authModal.style.display = 'none';
    clearForms();
    hideMessage();
}

function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    authForms.forEach(form => {
        form.classList.toggle('active',
            form.id === tabName + 'Form' || form.id === tabName + 'FormElement');
    });

    hideMessage();
}

function checkPasswordStrength(password) {
    let score = 0;
    let text = 'слабый';
    let color = '#ff4444';
    let percent = 0;

    if (!password) return { text, color, percent };

    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 15;
    if (/\d/.test(password)) score += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    if (score >= 80) {
        text = 'сильный'; color = '#4CAF50'; percent = 100;
    } else if (score >= 50) {
        text = 'средний'; color = '#FF9800'; percent = 66;
    } else if (score >= 25) {
        text = 'слабый'; color = '#ff4444'; percent = 33;
    }

    return { text, color, percent };
}

function hideMessage() {
    const authMessage = document.getElementById('authMessage');
    if (authMessage) authMessage.style.display = 'none';
}

function clearForms() {
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.value = '';
    });

    const termsCheckbox = document.getElementById('termsAgree');
    if (termsCheckbox) termsCheckbox.checked = false;

    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (strengthBar) strengthBar.style.width = '0';
    if (strengthText) {
        strengthText.textContent = 'Сложность пароля: слабый';
        strengthText.style.color = '#ff4444';
    }
}

// ============================================
// МЕНЮ ПРОФИЛЯ (dropdown)
// ============================================
window.showProfileMenu = function() {
    const existingMenu = document.querySelector('.profile-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.innerHTML = `
  <div class="profile-menu-content">
    <div class="profile-header">
      <div class="profile-avatar">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#667eea"/>
          <path d="M20 10C23.31 10 26 12.69 26 16C26 19.31 23.31 22 20 22C16.69 22 14 19.31 14 16C14 12.69 16.69 10 20 10ZM20 25C26.63 25 32 27.685 32 31V34H8V31C8 27.685 13.37 25 20 25Z" fill="white"/>
        </svg>
      </div>
      <div class="profile-info">
        <h4>Привет, <span class="profile-menu-name">Пользователь</span>!</h4>
        <p class="profile-menu-email"></p>
      </div>
    </div>
    <div class="profile-menu-items">
      <a href="${pageUrl('profile.html')}" class="menu-item profile-menu-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#888"/>
        </svg>
        <span class="profile-menu-label">Мой профиль</span>
      </a>
      <button class="menu-item" id="menuSettings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19.14 12.94C19.18 12.74 19.2 12.54 19.2 12.34C19.2 12.14 19.18 11.94 19.14 11.74L21.16 9.98C21.3 9.85 21.34 9.65 21.26 9.48L19.38 6.19C19.3 6.02 19.12 5.92 18.94 5.95L16.64 6.49C16.24 6.1 15.78 5.78 15.28 5.54L14.94 3.18C14.92 3.01 14.78 2.88 14.6 2.88H9.4C9.22 2.88 9.08 3.01 9.06 3.18L8.72 5.54C8.22 5.78 7.76 6.1 7.36 6.49L5.06 5.95C4.88 5.92 4.7 6.02 4.62 6.19L2.74 9.48C2.66 9.65 2.7 9.85 2.84 9.98L4.86 11.74C4.82 11.94 4.8 12.14 4.8 12.34C4.8 12.54 4.82 12.74 4.86 12.94L2.84 14.7C2.7 14.83 2.66 15.03 2.74 15.2L4.62 18.49C4.7 18.66 4.88 18.76 5.06 18.73L7.36 18.19C7.76 18.58 8.22 18.9 8.72 19.14L9.06 21.5C9.08 21.67 9.22 21.8 9.4 21.8H14.6C14.78 21.8 14.92 21.67 14.94 21.5L15.28 19.14C15.78 18.9 16.24 18.58 16.64 18.19L18.94 18.73C19.12 18.76 19.3 18.66 19.38 18.49L21.26 15.2C21.34 15.03 21.3 14.83 21.16 14.7L19.14 12.94ZM12 15.6C10.06 15.6 8.48 14.02 8.48 12.08C8.48 10.14 10.06 8.56 12 8.56C13.94 8.56 15.52 10.14 15.52 12.08C15.52 14.02 13.94 15.6 12 15.6Z" fill="#888"/>
        </svg>
        <span>Настройки</span>
      </button>
      <button class="menu-item logout-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="#888"/>
        </svg>
        <span>Выйти</span>
      </button>
    </div>
  </div>`;

    document.body.appendChild(menu);

    // Ищем внутри меню, а не по id: на странице профиля id="profileEmail" уже занят полем формы
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) menu.querySelector('.profile-menu-name').textContent = user.name;
    menu.querySelector('.profile-menu-email').textContent = user.email || '';

    // Подменяем пункт под роль
    if (user.role === 'DRIVER') {
        menu.querySelector('.profile-menu-link').href = pageUrl('driver-dashboard.html');
        menu.querySelector('.profile-menu-label').textContent = 'Кабинет водителя';
    }

    setTimeout(() => {
        function closeMenu(e) {
            const profileIcon = document.querySelector('.navbar-profile');
            if (!menu.contains(e.target) && !profileIcon?.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        }
        document.addEventListener('click', closeMenu);
    }, 0);

    const logoutBtn = menu.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
            menu.remove();
        });
    }

    const settingsBtn = menu.querySelector('#menuSettings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            alert('Настройки профиля будут доступны в следующем обновлении');
            menu.remove();
        });
    }
};
// ============================================
// СООБЩЕНИЯ
// ============================================
function showMessage(message, type = 'info') {
    const authMessage = document.getElementById('authMessage');
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            authMessage.style.display = 'none';
        }, 3000);
    }
}

// ============================================
// РЕГИСТРАЦИЯ И ВХОД
// ============================================

// Сохраняет токен, узнаёт роль через /api/auth/me и возвращает страницу,
// куда перейти: кабинет водителя или профиль клиента
async function saveSession(token, name) {
    localStorage.setItem('token', token);
    try {
        const meResp = await apiFetch('/auth/me');
        if (meResp.ok) {
            const me = await meResp.json();
            localStorage.setItem('user', JSON.stringify({
                email: me.email,
                name: name || me.email.split('@')[0],
                role: me.role,
                driverId: me.driverId
            }));
            return pageUrl(me.role === 'DRIVER' ? 'driver-dashboard.html' : 'profile.html');
        }
    } catch (e) {
        console.error('Не удалось получить /auth/me:', e);
    }
    // Роль узнать не удалось: профиль сам проверит её и при необходимости перенаправит
    return pageUrl('profile.html');
}
document.addEventListener('DOMContentLoaded', function() {

    // --- Регистрация ---
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        // Поле телефона показываем только водителю: API требует phone для роли DRIVER
        const roleSelect = document.getElementById('regRole');
        const phoneGroup = document.getElementById('regPhoneGroup');
        if (roleSelect && phoneGroup) {
            roleSelect.addEventListener('change', () => {
                phoneGroup.style.display = roleSelect.value === 'DRIVER' ? '' : 'none';
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('regUsername')?.value;
            const email = document.getElementById('regEmail')?.value;
            const password = document.getElementById('regPassword')?.value;
            const confirmPassword = document.getElementById('regConfirmPassword')?.value;
            const role = document.getElementById('regRole')?.value || 'CLIENT';
            const phone = document.getElementById('regPhone')?.value?.trim();

            if (!name || !email || !password) {
                showMessage('Заполните все поля!', 'error');
                return;
            }
            if (role === 'DRIVER' && !phone) {
                showMessage('Водителю нужно указать телефон!', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Пароли не совпадают!', 'error');
                return;
            }
            if (password.length < 6) {
                showMessage('Пароль должен быть минимум 6 символов!', 'error');
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');

            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';
            submitBtn.disabled = true;

            try {
                // 1) Регистрация
                const registerResp = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // API ждёт name, email, password, role, а для водителя ещё phone (RegisterRequest)
                    body: JSON.stringify({ name, email, password, role, phone: role === 'DRIVER' ? phone : null })
                });
                const registerData = await readJson(registerResp);

                if (!registerResp.ok) {
                    // ошибки API приходят в поле error
                    showMessage(registerData.error || 'Ошибка регистрации', 'error');
                    return;
                }

                // 2) Логин (бэк при регистрации токен не возвращает)
                const loginResp = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginData = await readJson(loginResp);

                if (!loginResp.ok || !loginData.token) {
                    showMessage(loginData.error || 'Вход не удался', 'error');
                    return;
                }

                showMessage('Регистрация успешна!', 'success');

                const successOverlay = document.getElementById('successOverlay');
                if (successOverlay) successOverlay.style.display = 'flex';

                // Имя бэкенд не возвращает, поэтому сохраняем введённое при регистрации
                const redirectUrl = await saveSession(loginData.token, name);

                setTimeout(() => {
                    const authModal = document.getElementById('authModal');
                    if (authModal) {
                        authModal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                    if (successOverlay) successOverlay.style.display = 'none';
                    window.location.href = redirectUrl;
                }, 2000);

            } catch (error) {
                console.error('Ошибка:', error);
                showMessage('Ошибка подключения к серверу. Проверьте, что Spring Boot работает на 8080', 'error');
            } finally {
                if (btnText) btnText.style.display = 'block';
                if (btnLoader) btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // --- Вход ---
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;

            if (!email || !password) {
                showMessage('Заполните все поля!', 'error');
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');

            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await readJson(response);
                if (response.ok && data.token) {
                    showMessage('Вход выполнен успешно!', 'success');

                    const redirectUrl = await saveSession(data.token);

                    setTimeout(() => {
                        const authModal = document.getElementById('authModal');
                        if (authModal) {
                            authModal.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    showMessage(data.error || 'Неверный email или пароль', 'error');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showMessage('Ошибка подключения к серверу', 'error');
            } finally {
                if (btnText) btnText.style.display = 'block';
                if (btnLoader) btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================
document.addEventListener('DOMContentLoaded', function() {

    // --- Иконка профиля ---
    const profileIcon = document.querySelector('.navbar-profile');
    const token = localStorage.getItem('token');

    if (profileIcon) {
        if (token) {
            updateProfileIcon(true);
        } else {
            profileIcon.addEventListener('click', function(e) {
                e.preventDefault();
                openModal('login');
            });
        }
    }

    // --- Закрытие модалки ---
    const authModal = document.getElementById('authModal');
    const closeModalBtn = document.getElementById('closeModal');

    // Пришли с другой страницы за входом или регистрацией (index.html#login)
    const hashTab = window.location.hash.slice(1);
    if (authModal && (hashTab === 'login' || hashTab === 'register')) {
        history.replaceState(null, '', window.location.pathname);
        openModal(hashTab);
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) closeModal();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.style.display === 'block') {
            closeModal();
        }
    });

    // --- Табы ---
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // --- Показать/скрыть пароль ---
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('svg');

            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.innerHTML = '<path d="M12 6C7.03 6 3 10.03 3 15C3 19.97 7.03 24 12 24C16.97 24 21 19.97 21 15C21 10.03 16.97 6 12 6ZM12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="#888"/>';
                } else {
                    input.type = 'password';
                    icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#888"/>';
                }
            }
        });
    });

    // --- Сложность пароля ---
    const regPasswordInput = document.getElementById('regPassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (regPasswordInput && strengthBar && strengthText) {
        regPasswordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);

            strengthBar.style.width = strength.percent + '%';
            strengthBar.style.background = strength.color;
            strengthText.textContent = 'Сложность пароля: ' + strength.text;
            strengthText.style.color = strength.color;
        });
    }
    // --- Подсветка активного меню ---
    setActiveNavLink();

    // --- Адаптация меню под роль ---
    adaptMenuForRole();

    // --- Редирект водителя с клиентских страниц ---
    redirectDriverFromClientPages();
});


// ============================================
// ВЫХОД
// ============================================
function logout() {
    clearSession();
    window.location.href = pageUrl('index.html');
}
// ============================================
// ЛОГИКА СТРАНИЦЫ ПРОФИЛЯ (profile.html)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const isProfilePage = document.body.classList.contains('page-profile');
    if (!isProfilePage) return;


    // Загрузка статистики заказов
    (async function loadOrderStats() {
        const ordersCount = document.getElementById('ordersCount');
        const completedOrders = document.getElementById('completedOrders');
        const activeOrders = document.getElementById('activeOrders');
        if (!ordersCount) return;

        try {
            const resp = await apiFetch('/orders/my');
            if (!resp.ok) return;
            const orders = await resp.json();
            if (!Array.isArray(orders)) return;

            ordersCount.textContent = orders.length;
            completedOrders.textContent = orders.filter(o => o.status === 'DELIVERED').length;
            activeOrders.textContent = orders.filter(o =>
                ['NEW','ACCEPTED','IN_TRANSIT','ARRIVED'].includes(o.status)).length;
        } catch (e) {
            console.error('Ошибка статистики:', e);
        }
    })();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Если нет токена — на главную
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    // --- Заполнение шапки профиля ---
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const avatarInitial = document.getElementById('avatarInitial');

    if (userName) userName.textContent = user.name || 'Пользователь';
    if (userEmail) userEmail.textContent = user.email || '';
    if (avatarInitial) {
        avatarInitial.textContent = (user.name || user.email || 'П').charAt(0).toUpperCase();
    }

    // --- Заполнение полей формы ---
    const parts = (user.name || '').split(' ');
    const firstNameInput = document.getElementById('profileFirstName');
    const lastNameInput = document.getElementById('profileLastName');
    const middleNameInput = document.getElementById('profileMiddleName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const birthdayInput = document.getElementById('profileBirthday');

    if (firstNameInput) firstNameInput.value = parts[0] || '';
    if (lastNameInput) lastNameInput.value = parts[1] || '';
    if (middleNameInput) middleNameInput.value = parts[2] || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (birthdayInput && user.birthday) birthdayInput.value = user.birthday;

    // --- Редактирование профиля ---
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveDataBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const inputs = document.querySelectorAll('.page-profile .form-input');
    const consentCheckbox = document.getElementById('consent');

    if (editBtn) {
        editBtn.addEventListener('click', function() {
            inputs.forEach(i => i.disabled = false);
            if (consentCheckbox) consentCheckbox.disabled = false;
            editBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'block';
            if (cancelBtn) cancelBtn.style.display = 'block';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            inputs.forEach(i => i.disabled = true);
            if (consentCheckbox) consentCheckbox.disabled = true;
            editBtn.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const updatedUser = {
                ...user,
                name: `${firstNameInput.value} ${lastNameInput.value}`.trim(),
                phone: phoneInput.value,
                birthday: birthdayInput.value
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            if (userName) userName.textContent = updatedUser.name || 'Пользователь';
            alert('Данные сохранены!');

            inputs.forEach(i => i.disabled = true);
            if (consentCheckbox) consentCheckbox.disabled = true;
            editBtn.style.display = 'block';
            saveBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
        });
    }

    // --- Кнопка "Выйти" ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }

    // --- История заказов ---
    const historyBtn = document.getElementById('historyBtn');
    const orderHistory = document.getElementById('orderHistory');
    if (historyBtn && orderHistory) {
        let loaded = false;

        historyBtn.addEventListener('click', async function() {
            const isHidden = orderHistory.style.display === 'none' || !orderHistory.style.display;
            orderHistory.style.display = isHidden ? 'block' : 'none';
            historyBtn.querySelector('span').textContent = isHidden ? 'Скрыть историю' : 'История заказов';

            // Загружаем один раз при первом открытии
            if (isHidden && !loaded) {
                loaded = true;
                const list = document.getElementById('orderHistoryList');
                try {
                    const resp = await apiFetch('/orders/my');
                    if (!resp.ok) throw new Error('status ' + resp.status);
                    const orders = await resp.json();

                    if (!Array.isArray(orders) || orders.length === 0) {
                        list.innerHTML = `<div class="order-history-empty"><p>У вас пока нет заказов</p></div>`;
                        return;
                    }

                    const statusMap = {
                        'NEW':        { label: 'Ожидает', cls: 'status-pending' },
                        'ACCEPTED':   { label: 'Принят',  cls: 'status-pending' },
                        'IN_TRANSIT': { label: 'В пути',  cls: 'status-in-transit' },
                        'ARRIVED':    { label: 'Прибыл',  cls: 'status-in-transit' },
                        'DELIVERED':  { label: 'Доставлен', cls: 'status-delivered' },
                        'CANCELLED':  { label: 'Отменён', cls: 'status-pending' }
                    };

                    list.innerHTML = orders.map(o => {
                        const info = statusMap[o.status] || { label: o.status, cls: 'status-pending' };
                        const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU') : '';
                        return `
                        <div class="order-item">
                            <div class="order-info">
                                <h3>Заказ №${o.id}</h3>
                                <p>${escapeHtml(o.fromAddress)} → ${escapeHtml(o.toAddress)}${date ? ' • ' + date : ''}</p>
                            </div>
                            <span class="order-status ${info.cls}">${info.label}</span>
                        </div>
                    `;
                    }).join('');
                } catch (e) {
                    console.error('Ошибка загрузки истории:', e);
                    list.innerHTML = `<div class="order-history-empty"><p>Не удалось загрузить историю</p></div>`;
                }
            }
        });
    }

    // --- Повторить заказ ---
    const repeatBtn = document.getElementById('repeatOrderBtn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', function() {
            window.location.href = '../html/order.html';
        });
    }

    // --- Мои адреса ---
    const addressesBtn = document.getElementById('addressesBtn');
    if (addressesBtn) {
        addressesBtn.addEventListener('click', function() {
            alert('Функция "Мои адреса" будет доступна soon!');
        });
    }

    // --- Настройки ---
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            alert('Настройки профиля будут доступны в следующем обновлении');
        });
    }
});

// ============================================
// ЛОГИКА СТРАНИЦЫ ЗАКАЗА (order.html)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const isOrderPage = document.body.classList.contains('page-order');
    if (!isOrderPage) return;

    // --- Модалка отслеживания ---
    const openModalBtn = document.getElementById('open-track-modal-btn');
    const closeModalBtn = document.getElementById('close-track-modal');
    const modalOverlay = document.getElementById('track-modal-overlay');

    if (openModalBtn && modalOverlay) {
        openModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // --- Кнопка "Сохранить данные" → POST /api/orders ---
    const saveBtn = document.getElementById('saveOrderBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Пожалуйста, войдите в систему');
                openModal('login');
                return;
            }

            const pickupAddress = document.getElementById('pickupAddress')?.value?.trim();
            const deliveryAddress = document.getElementById('deliveryAddress')?.value?.trim();
            const recipientPhone = document.getElementById('recipientPhone')?.value?.trim();
            const cargoType = document.getElementById('cargoType')?.value?.trim();

            if (!pickupAddress || !deliveryAddress) {
                alert('Заполните адреса отправления и доставки');
                return;
            }

            // Бэк ждёт такой формат (см. CreateOrderRequest.java)
            const orderData = {
                fromAddress: pickupAddress,
                toAddress: deliveryAddress,
                price: 300,
                cargoType: cargoType || 'прочее',
                recipientPhone: recipientPhone || '',
                deliveryDate: document.getElementById('deliveryDate')?.value || null,
                deliveryTime: document.getElementById('deliveryTime')?.value || null,
                weight: document.getElementById('weight')?.value || null,
                places: document.getElementById('places')?.value || null,
                conditions: document.getElementById('conditions')?.value || null
            };

            saveBtn.disabled = true;
            saveBtn.textContent = 'Сохранение...';

            try {
                const response = await apiFetch('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });

                const data = await readJson(response);

                if (response.ok) {
                    alert('Заказ сохранён!');
                    window.location.href = '../html/order-status.html';
                } else {
                    alert('Ошибка: ' + (data.error || 'не удалось сохранить заказ'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Ошибка подключения к серверу');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Сохранить данные';
            }
        });
    }
});

// ============================================
// ЛОГИКА СТРАНИЦЫ ОТСЛЕЖИВАНИЯ (order-status.html)
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    const isStatusPage = document.body.classList.contains('page-order-status');
    if (!isStatusPage) return;

    const orderSelect = document.getElementById('orderSelect');
    const noOrders = document.getElementById('noOrders');
    const orderSelector = document.getElementById('orderSelector');
    const orderDetails = document.getElementById('orderDetails');

    if (!orderSelect) return;

    const token = localStorage.getItem('token');
    if (!token) {
        if (orderSelector) orderSelector.style.display = 'none';
        if (noOrders) {
            noOrders.style.display = 'block';
            noOrders.innerHTML = '<p>Пожалуйста, войдите в систему</p><p><a href="../index.html#login">Войти</a></p>';
        }
        return;
    }

    try {
        const response = await apiFetch('/orders/my');
        if (!response.ok) {
            if (noOrders) {
                noOrders.style.display = 'block';
                noOrders.innerHTML = '<p>Не удалось загрузить заказы</p>';
            }
            if (orderSelector) orderSelector.style.display = 'none';
            return;
        }

        const orders = await response.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            if (orderSelector) orderSelector.style.display = 'none';
            if (noOrders) noOrders.style.display = 'block';
            return;
        }

        // Заполняем select
        orderSelect.innerHTML = '<option value="">Выберите заказ</option>';
        orders.forEach(o => {
            const option = document.createElement('option');
            option.value = o.id;
            option.textContent = `Заказ #${o.id} — ${o.fromAddress} → ${o.toAddress}`;
            orderSelect.appendChild(option);
        });

        if (orderDetails) orderDetails.style.display = 'block';

        // Обработка выбора
        orderSelect.addEventListener('change', function() {
            const orderId = this.value;
            if (!orderId) return;

            const order = orders.find(o => String(o.id) === String(orderId));
            if (!order) return;

            const startInput = document.getElementById('start-point');
            const endInput = document.getElementById('end-point');
            const statusText = document.getElementById('status-text');
            const progressText = document.getElementById('progress-text');
            const progressFill = document.querySelector('.progress-fill');

            if (startInput) startInput.value = order.fromAddress || '';
            if (endInput) endInput.value = order.toAddress || '';

            const statusMap = {
                'NEW':        { label: 'Ожидает водителя', percent: 10 },
                'ACCEPTED':   { label: 'Водитель назначен', percent: 25 },
                'IN_TRANSIT': { label: 'В пути',            percent: 50 },
                'ARRIVED':    { label: 'Прибыл',            percent: 75 },
                'DELIVERED':  { label: 'Доставлен',         percent: 100 },
                'CANCELLED':  { label: 'Отменён',           percent: 0 }
            };

            const info = statusMap[order.status] || { label: 'Статус неизвестен', percent: 0 };

            if (statusText) statusText.textContent = 'Заказ ' + info.label.toLowerCase();
            if (progressText) progressText.textContent = info.label;
            if (progressFill) progressFill.style.width = info.percent + '%';
        });

        // ★★★ НОВОЕ: автовыбор первого заказа при загрузке страницы ★★★
        if (orders.length > 0) {
            orderSelect.value = orders[0].id;
            orderSelect.dispatchEvent(new Event('change'));
        }

    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
});

// ============================================
// ЛОГИКА СТРАНИЦЫ INFORMATION (createCabinetBtn)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const createBtn = document.getElementById('createCabinetBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('register');
        });
    }
});