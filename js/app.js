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

import { initDialog, openDialog }           from './dialog.js';
import { initDragDrop, refreshCardListeners } from './dragdrop.js';

const COLUMNS = ['bestellungen', 'in-arbeit', 'versand', 'abgeschlossen'];

async function loadHeader() {
    const el = document.getElementById('header-placeholder');
    if (!el) return;
    try {
        const res = await fetch('pages/header.html');
        if (!res.ok) return;
        const html = await res.text();
        el.outerHTML = html;
    } catch {
        return;
    }
}

/* ============================================================
   Board-Rendering
   ============================================================ */

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
            colOrders.forEach((order) => {
                container.appendChild(_createCard(order));
            });
        }
    });

    refreshCardListeners();
}

function _createCard(order) {
    const card = document.createElement('div');
    card.className   = 'card';
    card.draggable   = true;
    card.dataset.id  = order.id;

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

    initDialog(saveOrder, deleteOrder);

    initDragDrop(moveOrder);

    document.querySelectorAll('.add-btn').forEach((btn) => {
        btn.addEventListener('click', () => openDialog('create'));
    });

    const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'asc')
    );

    onSnapshot(
        q,
        (snapshot) => {
            const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            renderBoard(orders);
        },
        (err) => {
            console.error('[Prozess Tracker] Firestore-Fehler:', err);
            showToast('✗ Verbindung zu Firebase fehlgeschlagen', 6000);
        }
    );
}

init();
