// ============================================
// ВХОД ЧЕРЕЗ KEYCLOAK: Authorization Code + PKCE
// ============================================
// 1. startLogin: придумываем случайный code_verifier, отправляем Keycloak только его хеш
//    (code_challenge) и уходим на страницу входа Keycloak. Пароль вводится там, а не у нас.
// 2. Keycloak возвращает браузер на index.html?code=...&state=...
// 3. handleLoginCallback: меняем code на токены, прикладывая исходный code_verifier.
//    Перехваченный code без verifier бесполезен — в этом смысл PKCE.
// 4. Access token живёт 5 минут; ensureFreshToken обновляет его по refresh token.
// Подключается до script.js; pageUrl и clearSession объявлены там и вызываются уже после загрузки.

const KEYCLOAK_URL = 'http://localhost:8180';
const KEYCLOAK_REALM = 'citylogistics';
const KEYCLOAK_CLIENT_ID = 'citylogistics-frontend';
const OIDC_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;

// Обновляем токен заранее, если до конца его жизни меньше 30 секунд
const TOKEN_REFRESH_MARGIN_MS = 30 * 1000;

// Байты -> base64url (base64 без =, с - и _ вместо + и /), как требует PKCE
function base64UrlEncode(bytes) {
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(byteLength) {
    return base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));
}

// code_challenge = base64url(SHA-256(code_verifier))
async function codeChallengeFor(verifier) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64UrlEncode(new Uint8Array(hash));
}

// Куда Keycloak вернёт браузер. Адрес должен подходить под redirectUris клиента в realm-export.json
function loginRedirectUri() {
    const url = new URL(pageUrl('index.html'), window.location.href);
    return url.origin + url.pathname;
}

// Уходим на страницу входа Keycloak. loginHint подставит email (например, сразу после регистрации)
async function startLogin(loginHint) {
    const verifier = randomString(48);
    // state защищает от подложного ответа: вернуться должен тот же state, что мы отправили
    const state = randomString(16);
    // sessionStorage: живёт только в этой вкладке, после входа удаляется
    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('pkce_state', state);

    const params = new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        redirect_uri: loginRedirectUri(),
        response_type: 'code',
        scope: 'openid',
        code_challenge: await codeChallengeFor(verifier),
        code_challenge_method: 'S256',
        state
    });
    if (loginHint) params.set('login_hint', loginHint);

    window.location.href = `${OIDC_URL}/auth?${params}`;
}

// Вызывается на index.html. Если Keycloak вернул нас с ?code=..., меняем его на токены.
// Возвращает true, если вход только что завершился
async function handleLoginCallback() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) return false;

    const code = params.get('code');
    const state = params.get('state');
    const verifier = sessionStorage.getItem('pkce_verifier');
    const expectedState = sessionStorage.getItem('pkce_state');
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('pkce_state');
    // Убираем code из адресной строки: он одноразовый, и в истории браузера ему не место
    history.replaceState(null, '', window.location.pathname);

    if (params.has('error') || !code || !verifier || state !== expectedState) {
        console.error('Вход не удался:', params.get('error') || 'неверный state');
        return false;
    }

    const response = await fetch(`${OIDC_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KEYCLOAK_CLIENT_ID,
            code,
            redirect_uri: loginRedirectUri(),
            code_verifier: verifier
        })
    });
    if (!response.ok) {
        console.error('Keycloak не выдал токен:', response.status);
        return false;
    }
    storeTokens(await response.json());
    return true;
}

function storeTokens(tokens) {
    localStorage.setItem('token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('id_token', tokens.id_token || localStorage.getItem('id_token') || '');
    localStorage.setItem('token_expires_at', String(Date.now() + tokens.expires_in * 1000));
}

// true — токен есть и годен ещё хотя бы 30 секунд (при необходимости обновлён), false — нужен вход
async function ensureFreshToken() {
    if (!localStorage.getItem('token')) return false;
    const expiresAt = Number(localStorage.getItem('token_expires_at') || 0);
    if (expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) return true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
        const response = await fetch(`${OIDC_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: KEYCLOAK_CLIENT_ID,
                refresh_token: refreshToken
            })
        });
        // Сессия в Keycloak закончилась (по умолчанию 30 минут без действий) — нужен новый вход
        if (!response.ok) return false;
        storeTokens(await response.json());
        return true;
    } catch (e) {
        console.error('Не удалось обновить токен:', e);
        return false;
    }
}

// Данные из токена (имя, email). Подпись здесь не проверяем: это делает бэкенд,
// а странице нужны только данные для показа
function tokenClaims() {
    const token = localStorage.getItem('token');
    if (!token) return {};
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(payload).split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
        return JSON.parse(json);
    } catch {
        return {};
    }
}

// Выход и в приложении, и в Keycloak: иначе следующий «Войти» пустит без пароля
function keycloakLogout() {
    const idToken = localStorage.getItem('id_token');
    clearSession();
    const params = new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        post_logout_redirect_uri: loginRedirectUri()
    });
    if (idToken) params.set('id_token_hint', idToken);
    window.location.href = `${OIDC_URL}/logout?${params}`;
}
