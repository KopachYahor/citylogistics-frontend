// ============================================
// КАБИНЕТ ВОДИТЕЛЯ
// ============================================

document.addEventListener('DOMContentLoaded', async function () {

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '../index.html'; return; }

    let me;
    try {
        const resp = await fetch('http://localhost:8080/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) {
            localStorage.removeItem('token'); localStorage.removeItem('user');
            window.location.href = '../index.html';
            return;
        }
        me = await resp.json();
    } catch (e) { console.error('Ошибка /auth/me:', e); return; }

    if (me.role !== 'DRIVER') { window.location.href = 'profile.html'; return; }

    // Заполняем шапку (с фиксом дублирования)
    const driverName = document.getElementById('driverName');
    const driverEmail = document.getElementById('driverEmail');
    if (driverName) driverName.textContent = 'Водитель #' + (me.driverId || me.id);
    if (driverEmail) driverEmail.textContent = me.email;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token'); localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadOrders);

    await loadOrders();

    async function loadOrders() {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        try {
            const resp = await fetch('http://localhost:8080/api/orders/assigned', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                if (resp.status === 401 || resp.status === 403) {
                    localStorage.removeItem('token'); localStorage.removeItem('user');
                    window.location.href = '../index.html';
                    return;
                }
                container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Ошибка: ${resp.status}</p></div>`;
                return;
            }
            renderOrders(await resp.json());
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            container.innerHTML = `<div class="empty-state"><div class="icon">🔌</div><p>Ошибка подключения</p></div>`;
        }
    }

    function renderOrders(orders) {
        const container = document.getElementById('ordersContainer');
        document.getElementById('statTotal').textContent = orders.length;
        document.getElementById('statActive').textContent = orders.filter(o =>
            ['ACCEPTED','IN_TRANSIT','ARRIVED'].includes(o.status)).length;
        document.getElementById('statDone').textContent = orders.filter(o => o.status === 'DELIVERED').length;

        if (!orders.length) {
            container.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>У вас пока нет назначенных заказов</p></div>`;
            return;
        }

        container.innerHTML = orders.map(o => {
            const next = getNextStatus(o.status);
            const label = getActionLabel(o.status);
            return `
                <div class="order-card">
                    <div>
                        <h3>Заказ #${o.id}</h3>
                        <div class="order-route">📦 ${escapeHtml(o.fromAddress)} → ${escapeHtml(o.toAddress)}</div>
                        <div class="order-price">${o.price ? o.price + ' BYN' : '—'}</div>
                    </div>
                    <div class="order-card-actions">
                        <span class="order-status-badge status-${o.status}">${o.status}</span>
                        ${next ? `<button class="status-action-btn" data-order-id="${o.id}" data-next-status="${next}">${label}</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.status-action-btn').forEach(btn =>
            btn.addEventListener('click', onStatusChange));
    }

    function getNextStatus(s) {
        return { NEW:'ACCEPTED', ACCEPTED:'IN_TRANSIT', IN_TRANSIT:'ARRIVED', ARRIVED:'DELIVERED' }[s] || null;
    }
    function getActionLabel(s) {
        return { NEW:'Принять', ACCEPTED:'В путь', IN_TRANSIT:'Прибыл', ARRIVED:'Доставлено' }[s] || '';
    }

    async function onStatusChange(e) {
        const btn = e.currentTarget;
        const orderId = btn.getAttribute('data-order-id');
        const nextStatus = btn.getAttribute('data-next-status');

        btn.disabled = true;
        const oldLabel = btn.textContent;
        btn.textContent = 'Обновление...';

        try {
            const resp = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: nextStatus })
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                alert('Ошибка: ' + (data.error || data.message || resp.status));
                btn.disabled = false; btn.textContent = oldLabel;
                return;
            }
            await loadOrders();
        } catch (err) {
            console.error(err);
            alert('Ошибка подключения');
            btn.disabled = false; btn.textContent = oldLabel;
        }
    }

    function escapeHtml(s) {
        if (!s) return '';
        return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }
});