let _swRegistration = null;

async function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    try {
        _swRegistration = await navigator.serviceWorker.register('sw.js', { scope: '/' });
    } catch {
        return;
    }
}

export async function initNotifications() {
    if (!('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'granted') {
        await initServiceWorker();
        return;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await initServiceWorker();
        }
    }
}

export function notify(title, body) {
    if (Notification.permission !== 'granted') {
        return;
    }

    if (_swRegistration) {
        _swRegistration.showNotification(title, {
            body,
            icon: 'img/logo-cyber-d20.png'
        });
    } else {
        new Notification(title, {
            body,
            icon: 'img/logo-cyber-d20.png'
        });
    }
}

export function diffOrders(prevMap, nextMap) {
    const changes = [];

    for (const [id, order] of nextMap) {
        if (!prevMap.has(id)) {
            changes.push({ type: 'new', order });
        } else {
            const prevOrder = prevMap.get(id);
            if (prevOrder.status !== order.status) {
                changes.push({ type: 'moved', order });
            }
        }
    }

    return changes;
}

export function getStatusNotification(order) {
    const { title, status } = order;

    switch (status) {
        case 'in-arbeit':
            return { title: '🔧 In Arbeit', body: title };
        case 'versand':
            return { title: '🚚 Versand', body: title };
        case 'abgeschlossen':
            return { title: '✅ Abgeschlossen', body: title };
        default:
            return null;
    }
}
