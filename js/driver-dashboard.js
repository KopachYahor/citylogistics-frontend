// ============================================
// КАБИНЕТ ВОДИТЕЛЯ
// Общие функции (apiFetch, escapeHtml, STATUS_LABELS, logout) — в script.js
// ============================================

document.addEventListener('DOMContentLoaded', async function () {

    if (!localStorage.getItem('token')) { goToLogin(); return; }

    let me;
    try {
        const resp = await apiFetch('/auth/me');
        if (!resp.ok) { goToLogin(); return; }
        me = await resp.json();
    } catch (e) {
        console.error('Ошибка /auth/me:', e);
        showError('🔌', 'Ошибка подключения к серверу');
        return;
    }

    if (me.role !== 'DRIVER') { window.location.href = pageUrl('profile.html'); return; }

    const driverName = document.getElementById('driverName');
    const driverEmail = document.getElementById('driverEmail');
    if (driverName) driverName.textContent = 'Водитель #' + (me.driverId || me.id);
    if (driverEmail) driverEmail.textContent = me.email;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadOrders);

    await loadOrders();

    async function loadOrders() {
        try {
            const resp = await apiFetch('/orders/assigned');
            if (!resp.ok) {
                showError('⚠️', 'Не удалось загрузить заказы (код ' + resp.status + ')');
                return;
            }
            renderOrders(await resp.json());
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            showError('🔌', 'Ошибка подключения к серверу');
        }
    }

    function renderOrders(orders) {
        const container = document.getElementById('ordersContainer');
        document.getElementById('statTotal').textContent = orders.length;
        document.getElementById('statActive').textContent = orders.filter(o =>
            ['ACCEPTED', 'IN_TRANSIT', 'ARRIVED'].includes(o.status)).length;
        document.getElementById('statDone').textContent = orders.filter(o => o.status === 'DELIVERED').length;

        if (!orders.length) {
            container.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>У вас пока нет назначенных заказов</p></div>`;
            return;
        }

        // Новые сверху
        orders.sort((a, b) => b.id - a.id);

        container.innerHTML = orders.map(o => {
            const next = NEXT_STATUS[o.status];
            const status = escapeHtml(o.status);
            return `
                <div class="order-card">
                    <div>
                        <h3>Заказ #${escapeHtml(o.id)}</h3>
                        <div class="order-route">📦 ${escapeHtml(o.fromAddress)} → ${escapeHtml(o.toAddress)}</div>
                        <div class="order-price">${o.price ? escapeHtml(o.price) + ' BYN' : '—'}</div>
                    </div>
                    <div class="order-card-actions">
                        <span class="order-status-badge status-${status}">${escapeHtml(STATUS_LABELS[o.status] || o.status)}</span>
                        ${next ? `<button class="status-action-btn" data-order-id="${escapeHtml(o.id)}" data-next-status="${next.status}">${next.label}</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.status-action-btn').forEach(btn =>
            btn.addEventListener('click', onStatusChange));
    }

    async function onStatusChange(e) {
        const btn = e.currentTarget;
        const orderId = btn.dataset.orderId;
        const nextStatus = btn.dataset.nextStatus;

        btn.disabled = true;
        const oldLabel = btn.textContent;
        btn.textContent = 'Обновление...';

        try {
            const resp = await apiFetch(`/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: nextStatus })
            });
            if (!resp.ok) {
                const data = await readJson(resp);
                alert('Ошибка: ' + (data.error || resp.status));
                btn.disabled = false; btn.textContent = oldLabel;
                return;
            }
            await loadOrders();
        } catch (err) {
            console.error(err);
            alert('Ошибка подключения к серверу');
            btn.disabled = false; btn.textContent = oldLabel;
        }
    }

    function showError(icon, text) {
        const container = document.getElementById('ordersContainer');
        if (container) {
            container.innerHTML = `<div class="empty-state"><div class="icon">${icon}</div><p>${escapeHtml(text)}</p></div>`;
        }
    }
});

// Следующий шаг водителя (как в OrderStatus.canTransitionTo на бэкенде).
// NEW здесь нет: заказ получает водителя и статус ACCEPTED автоматически через Kafka
const NEXT_STATUS = {
    ACCEPTED:   { status: 'IN_TRANSIT', label: 'В путь' },
    IN_TRANSIT: { status: 'ARRIVED',    label: 'Прибыл' },
    ARRIVED:    { status: 'DELIVERED',  label: 'Доставлено' }
};
