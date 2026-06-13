import {
    db,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from './firebase.js';

import { initDialog, openDialog }            from './dialog.js';
import { initDragDrop, refreshCardListeners } from './dragdrop.js';
import { initNotifications, notify, diffOrders, getStatusNotification } from './notifications.js';

const COLUMNS = ['bestellungen', 'in-arbeit', 'fertig-gedruckt', 'versand', 'abgeschlossen'];

let _previousOrders  = new Map();
let _isFirstSnapshot = true;

async function loadHeader() {
    const el = document.getElementById('header-placeholder');
    if (!el) return;
    try {
        const res = await fetch('pages/header.html');
        if (!res.ok) return;
        el.outerHTML = await res.text();
    } catch {
        return;
    }
}

function renderBoard(orders) {
    COLUMNS.forEach((colId) => {
        const container = document.getElementById(`col-${colId}`);
        const countEl   = document.getElementById(`count-${colId}`);
        if (!container) return;

        const colOrders = orders.filter((o) => o.status === colId);

        if (countEl) countEl.textContent = colOrders.length;

        container.innerHTML = '';

        if (colOrders.length === 0) {
            container.innerHTML = '<p class="empty-hint">Noch keine Einträge</p>';
        } else {
            colOrders.forEach((order) => container.appendChild(_createCard(order)));
        }
    });

    updateTabBadges(orders);
    refreshCardListeners();
}

function updateTabBadges(orders) {
    COLUMNS.forEach((colId) => {
        const badge = document.getElementById(`badge-${colId}`);
        if (!badge) return;

        const count = orders.filter((o) => o.status === colId).length;
        badge.textContent = count;

        if (count > 0) {
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    });
}

function _createCard(order) {
    const card = document.createElement('div');
    card.className  = 'card';
    card.draggable  = true;
    card.dataset.id = order.id;

    const prioClass = (order.priority || 'medium').toLowerCase();
    const hasNotes  = order.anmerkungen && order.anmerkungen.trim() !== '';

    card.innerHTML = `
        <div class="card-top">
            <img src="img/icons/drag-handle.svg"
                 class="drag-handle"
                 alt="Verschieben"
                 draggable="false">
            <span class="card-title">${_escapeHtml(order.title || '–')}</span>
        </div>
        <div class="card-footer">
            <span class="card-anzahl">Anz.:&nbsp;${order.anzahl ?? 1}</span>
            <span class="prio-badge ${prioClass}">${_escapeHtml(order.priority || 'Low')}</span>
            ${hasNotes
                ? `<span class="speech-bubble-icon">
                       <img src="img/icons/speech-bubble.svg" alt="Anmerkungen vorhanden">
                   </span>`
                : ''}
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.drag-handle')) return;
        openDialog('edit', order);
    });

    return card;
}

function initMobileNav() {
    setActiveTab('bestellungen');

    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => setActiveTab(btn.dataset.col));
    });
}

function setActiveTab(colId) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.col === colId);
    });

    document.querySelectorAll('.column').forEach((col) => {
        col.classList.toggle('active-mobile', col.dataset.status === colId);
    });
}

async function saveOrder(data, id = null) {
    try {
        if (id) {
            await updateDoc(doc(db, 'orders', id), data);
            showToast('✓ Bestellung aktualisiert');
        } else {
            await addDoc(collection(db, 'orders'), {
                ...data,
                status:    'bestellungen',
                createdAt: serverTimestamp()
            });
            showToast('✓ Bestellung hinzugefügt');
            if (window.innerWidth < 768) {
                setActiveTab('bestellungen');
            }
        }
    } catch (err) {
        console.error('[Prozess Tracker] Fehler beim Speichern:', err);
        showToast('✗ Fehler beim Speichern');
    }
}

async function deleteOrder(id) {
    try {
        await deleteDoc(doc(db, 'orders', id));
        showToast('Bestellung gelöscht');
    } catch (err) {
        console.error('[Prozess Tracker] Fehler beim Löschen:', err);
        showToast('✗ Fehler beim Löschen');
    }
}

async function moveOrder(id, newStatus) {
    try {
        await updateDoc(doc(db, 'orders', id), { status: newStatus });
    } catch (err) {
        console.error('[Prozess Tracker] Fehler beim Verschieben:', err);
        showToast('✗ Fehler beim Verschieben');
    }
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function init() {
    await loadHeader();

    await initNotifications();

    initDialog(saveOrder, deleteOrder);
    initDragDrop(moveOrder);
    initMobileNav();

    document.querySelectorAll('.add-btn').forEach((btn) => {
        btn.addEventListener('click', () => openDialog('create'));
    });

    document.getElementById('fab')?.addEventListener('click', () => openDialog('create'));

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));

    onSnapshot(
        q,
        (snapshot) => {
            const orders   = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const ordersMap = new Map(orders.map((o) => [o.id, o]));

            if (_isFirstSnapshot) {
                _previousOrders  = ordersMap;
                _isFirstSnapshot = false;
            } else {
                const changes = diffOrders(_previousOrders, ordersMap);
                changes.forEach((change) => {
                    if (change.type === 'new') {
                        notify('📦 Neue Bestellung', change.order.title);
                    } else if (change.type === 'moved') {
                        const notifData = getStatusNotification(change.order);
                        if (notifData) notify(notifData.title, notifData.body);
                    }
                });
                _previousOrders = ordersMap;
            }

            renderBoard(orders);
        },
        (err) => {
            console.error('[Prozess Tracker] Firestore-Fehler:', err);
            showToast('✗ Verbindung zu Firebase fehlgeschlagen', 6000);
        }
    );
}

init();
