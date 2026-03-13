// ============================================
// КОНФИГУРАЦИЯ
// ============================================

// Для локальной разработки используй localhost
// Для прода замени на URL Render сервера (например: https://твой-сервис.onrender.com/api)
const API_URL = 'https://smartlogistic2026-api.onrender.com/api';

// ============================================
// АВТОМАТИЧЕСКАЯ ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ
// ============================================
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu li a');
    
    // Не подсвечивать на главной странице (index.html или /)
    const isMainPage = currentPath === '/' || 
                       currentPath === '/index.html' || 
                       currentPath.endsWith('index.html');
    
    if (isMainPage) return;
    
    // Получаем имя файла без пути и расширения
    const pageName = currentPath.split('/').pop().replace('.html', '');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Получаем имя файла из href (убираем все пути)
        const linkName = href.replace(/^.*\//, '').replace('.html', '');
        
        // Точное совпадение имен файлов
        if (pageName === linkName) {
            link.classList.add('active');
        }
    });
}

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
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
// МОДАЛЬНОЕ ОКНО И ТАБЫ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Элементы
  const authModal = document.getElementById('authModal');
  const closeModalBtn = document.getElementById('closeModal');
  const profileIcon = document.querySelector('.navbar-profile');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const authForms = document.querySelectorAll('.auth-form');
  const authMessage = document.getElementById('authMessage');
  const successOverlay = document.getElementById('successOverlay');
  
  // Открытие модалки при клике на иконку профиля
  if (profileIcon) {
    profileIcon.addEventListener('click', function(e) {
      e.preventDefault();
      openModal('login');
    });
  }
  
  // Закрытие модалки
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (authModal) {
    authModal.addEventListener('click', function(e) {
      if (e.target === authModal) {
        closeModal();
      }
    });
  }
  
  // Закрытие по Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && authModal && authModal.style.display === 'block') {
      closeModal();
    }
  });
  
  // Переключение между вкладками
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Переключение видимости пароля
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
  
  // Проверка сложности пароля при вводе
  const regPasswordInput = document.getElementById('regPassword');
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');
  
  if (regPasswordInput && strengthBar && strengthText) {
    regPasswordInput.addEventListener('input', function() {
      const password = this.value;
      const strength = checkPasswordStrength(password);
      
      strengthBar.style.width = strength.percent + '%';
      strengthBar.style.background = strength.color;
      strengthBar.style.boxShadow = `0 0 10px ${strength.color}`;
      strengthText.textContent = 'Сложность пароля: ' + strength.text;
      strengthText.style.color = strength.color;
      
      // Добавляем класс для анимации
      strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
      if (strength.text === 'сильный') {
        strengthBar.classList.add('strength-strong');
      } else if (strength.text === 'средний') {
        strengthBar.classList.add('strength-medium');
      } else {
        strengthBar.classList.add('strength-weak');
      }
    });
  }
  
  // Функции модального окна
  function openModal(defaultTab = 'login') {
    if (!authModal) return;
    document.body.style.overflow = 'hidden';
    authModal.style.display = 'block';
    switchTab(defaultTab);
  }
  
  function closeModal() {
    if (!authModal) return;
    document.body.style.overflow = '';
    authModal.style.display = 'none';
    clearForms();
    hideMessage();
  }
  
  function switchTab(tabName) {
    // Обновляем активные кнопки табов
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // Показываем нужную форму
    authForms.forEach(form => {
      form.classList.toggle('active', form.id === tabName + 'Form' || form.id === tabName + 'FormElement');
    });
    
    // Сбрасываем сообщения
    hideMessage();
  }
  
  function checkPasswordStrength(password) {
    let score = 0;
    let text = 'слабый';
    let color = '#ff4444';
    let percent = 0;
    
    if (!password) {
      return { text, color, percent };
    }
    
    // Длина пароля
    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 15;
    
    // Содержит цифры
    if (/\d/.test(password)) score += 20;
    
    // Содержит буквы в разных регистрах
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    
    // Содержит спецсимволы
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    
    // Определяем уровень сложности
    if (score >= 80) {
      text = 'сильный';
      color = '#4CAF50';
      percent = 100;
    } else if (score >= 50) {
      text = 'средний';
      color = '#FF9800';
      percent = 66;
    } else if (score >= 25) {
      text = 'слабый';
      color = '#ff4444';
      percent = 33;
    }
    
    return { text, color, percent };
  }
  
  function hideMessage() {
    if (authMessage) {
      authMessage.style.display = 'none';
    }
  }
  
  function clearForms() {
    document.querySelectorAll('.auth-form input').forEach(input => {
      input.value = '';
    });
    
    const termsCheckbox = document.getElementById('termsAgree');
    if (termsCheckbox) {
      termsCheckbox.checked = false;
    }
    
    if (strengthBar) {
      strengthBar.style.width = '0';
    }
    
    if (strengthText) {
      strengthText.textContent = 'Сложность пароля: слабый';
      strengthText.style.color = '#ff4444';
    }
  }
  
  // Делаем showProfileMenu глобальной
  window.showProfileMenu = function() {
    // Создаем выпадающее меню
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
            <h4>Привет, <span id="profileName">Пользователь</span>!</h4>
            <p id="profileEmail">user@example.com</p>
          </div>
        </div>
        <div class="profile-menu-items">
          <a href="html/profile.html" class="menu-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#888"/>
            </svg>
            <span>Мой профиль</span>
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
      </div>
    `;
    
    // Стили для меню
    const style = document.createElement('style');
    style.textContent = `
      .profile-menu {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 1001;
        animation: slideDown 0.3s ease;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .profile-menu-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
        width: 300px;
        overflow: hidden;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .profile-header {
        padding: 24px;
        background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
        color: white;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .profile-avatar {
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }
      
      .profile-info h4 {
        margin: 0 0 6px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .profile-info p {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }
      
      .profile-menu-items {
        padding: 12px 0;
      }
      
      .menu-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 24px;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: all 0.3s;
        border: none;
        background: none;
        width: 100%;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
      }
      
      .menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
        padding-left: 30px;
      }
      
      .menu-item svg {
        opacity: 0.8;
      }
      
      .logout-btn {
        color: #ff6b6b;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 8px;
        padding-top: 16px;
      }
      
      .logout-btn svg path {
        fill: #ff6b6b;
      }
      
      .logout-btn:hover {
        color: #ff4444;
        background: rgba(255, 107, 107, 0.1);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(menu);
    
    // Загружаем данные пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileName && user.name) profileName.textContent = user.name;
    if (profileEmail && user.email) profileEmail.textContent = user.email;
    
    // Закрытие меню при клике вне его
    setTimeout(() => {
      function closeMenu(e) {
        const profileIcon = document.querySelector('.navbar-profile');
        if (!menu.contains(e.target) && !profileIcon?.contains(e.target)) {
          menu.remove();
          style.remove();
          document.removeEventListener('click', closeMenu);
        }
      }
      document.addEventListener('click', closeMenu);
    }, 0);
    
    // Выход из аккаунта
    const logoutBtn = menu.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        logout();
        menu.remove();
        style.remove();
      });
    }
    
    // Кнопка настроек
    const settingsBtn = menu.querySelector('#menuSettings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        alert('Настройки профиля будут доступны в следующем обновлении');
        menu.remove();
        style.remove();
      });
    }
  }
  
  // Проверяем статус авторизации при загрузке страницы
  function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
      updateProfileIcon(true);
    }
  }
  
  // Инициализация
  checkAuthStatus();
  setActiveNavLink();
});

// ============================================
// ФУНКЦИИ ДЛЯ СООБЩЕНИЙ
// ============================================

// Функция показа сообщений
function showMessage(message, type = 'info') {
    let messageContainer = document.getElementById('messageContainer');
    
    if (!messageContainer) {
        messageContainer = document.getElementById('authMessage');
    }
    
    if (!messageContainer) return;
    
    messageContainer.innerHTML = `<div class="message message-${type}">${message}</div>`;
    messageContainer.className = `message-${type}`;
    messageContainer.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }
}

// ============================================
// ОБРАБОТКА РЕГИСТРАЦИИ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Получаем данные формы
            const name = document.getElementById('regUsername')?.value;
            const email = document.getElementById('regEmail')?.value;
            const password = document.getElementById('regPassword')?.value;
            const confirmPassword = document.getElementById('regConfirmPassword')?.value;
            
            console.log('📝 Регистрация:', { name, email, password });
            
            // Проверки
            if (!name || !email || !password) {
                showMessage('Заполните все поля!', 'error');
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
            
            // Показываем загрузку
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.querySelector('.btn-text')?.textContent || 'Зарегистрироваться';
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                console.log('✅ Ответ сервера:', data);
                
                if (response.ok) {
                    showMessage('Регистрация успешна!', 'success');
                    
                    // Сохраняем данные
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    
                    console.log('💾 Данные сохранены:', {
                        token: data.data.token,
                        user: data.data.user
                    });
                    
                    // Показываем оверлей успеха
                    const successOverlay = document.getElementById('successOverlay');
                    if (successOverlay) {
                        successOverlay.style.display = 'flex';
                    }
                    
                    // Закрываем модалку и перенаправляем
                    setTimeout(() => {
                        const authModal = document.getElementById('authModal');
                        if (authModal) {
                            authModal.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                        if (successOverlay) {
                            successOverlay.style.display = 'none';
                        }
                        
                        // Обновляем иконку
                        const profileIcon = document.querySelector('.navbar-profile');
                        if (profileIcon) {
                            // Триггерим обновление иконки
                            const event = new CustomEvent('authChange', { detail: { isLoggedIn: true } });
                            document.dispatchEvent(event);
                        }
                        
                        // Перенаправляем
                        window.location.href = 'html/profile.html';
                    }, 2000);
                    
                } else {
                    showMessage(data.message || 'Ошибка регистрации', 'error');
                }
            } catch (error) {
                console.error('❌ Ошибка:', error);
                showMessage('Ошибка подключения к серверу. Проверьте, запущен ли сервер на порту 5000', 'error');
            } finally {
                if (btnText) btnText.style.display = 'block';
                if (btnLoader) btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }
    
    // ============================================
    // ОБРАБОТКА ВХОДА
    // ============================================
    
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Получаем данные формы
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            console.log('📝 Вход:', { email, password });
            
            if (!email || !password) {
                showMessage('Заполните все поля!', 'error');
                return;
            }
            
            // Показываем загрузку
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.querySelector('.btn-text')?.textContent || 'Войти';
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                console.log('✅ Ответ сервера:', data);
                
                if (response.ok) {
                    showMessage('Вход выполнен успешно!', 'success');
                    
                    // Сохраняем данные
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    
                    console.log('💾 Данные сохранены:', {
                        token: data.data.token,
                        user: data.data.user
                    });
                    
                    // Закрываем модалку
                    setTimeout(() => {
                        const authModal = document.getElementById('authModal');
                        if (authModal) {
                            authModal.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                        
                        // Обновляем иконку
                        const profileIcon = document.querySelector('.navbar-profile');
                        if (profileIcon) {
                            const event = new CustomEvent('authChange', { detail: { isLoggedIn: true } });
                            document.dispatchEvent(event);
                        }
                        
                        // Перенаправляем
                        window.location.href = '/html/profile.html';
                    }, 1500);
                    
                } else {
                    showMessage(data.message || 'Неверный email или пароль', 'error');
                }
            } catch (error) {
                console.error('❌ Ошибка:', error);
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
// СЛУШАТЕЛЬ СОБЫТИЯ АВТОРИЗАЦИИ
// ============================================

document.addEventListener('authChange', function(e) {
    const profileIcon = document.querySelector('.navbar-profile');
    if (!profileIcon) return;
    
    if (e.detail.isLoggedIn) {
        profileIcon.innerHTML = `
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="18" fill="#4CAF50"/>
                <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="white"/>
            </svg>
        `;
    } else {
        profileIcon.innerHTML = `
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="currentColor"/>
            </svg>
        `;
    }
});

// ============================================
// ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Если мы на главной странице и пользователь уже авторизован
    if (token && (window.location.pathname === '/index.html' || window.location.pathname === '/')) {
        console.log('👤 Пользователь уже авторизован');
        const profileIcon = document.querySelector('.navbar-profile');
        if (profileIcon) {
            profileIcon.innerHTML = `
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="18" fill="#4CAF50"/>
                    <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="white"/>
                </svg>
            `;
        }
    }
});

// ============================================
// ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Функция выхода
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Обновляем иконку
    const profileIcon = document.querySelector('.navbar-profile');
    if (profileIcon) {
        profileIcon.innerHTML = `
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 6C19.5913 6 21.1174 6.63214 22.2426 7.75736C23.3679 8.88258 24 10.4087 24 12C24 13.5913 23.3679 15.1174 22.2426 16.2426C21.1174 17.3679 19.5913 18 18 18C16.4087 18 14.8826 17.3679 13.7574 16.2426C12.6321 15.1174 12 13.5913 12 12C12 10.4087 12.6321 8.88258 13.7574 7.75736C14.8826 6.63214 16.4087 6 18 6ZM18 21C24.63 21 30 23.685 30 27V30H6V27C6 23.685 11.37 21 18 21Z" fill="currentColor"/>
            </svg>
        `;
    }
    
    window.location.href = '/index.html';
}

// Функция получения данных пользователя
async function getUserData() {
    const token = localStorage.getItem('token');
    
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_URL}/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data.user;
        } else {
            // Токен недействителен
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        }
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return null;
    }
}
// ============================================
// СПЕЦИАЛЬНЫЙ КОД ДЛЯ profile.html
// ============================================

// Если мы на странице профиля
if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('/html/profile.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Проверяем авторизацию
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('Страница профиля загружена');
        console.log('Токен:', token);
        console.log('Пользователь:', user);
        
        if (!token || !user.name) {
            console.log('Нет авторизации, перенаправляем на главную');
            window.location.href = '/index.html';
            return;
        }
        
        // Заполняем данные (если функция уже определена в profile.html, то не выполнять)
        if (typeof fillUserData === 'function') {
            fillUserData(user);
        }
        
        // Обновляем иконку профиля
        updateProfileIcon(true);
    });
}











