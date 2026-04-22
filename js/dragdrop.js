/* ============================================================
   DRAG & DROP – Karten zwischen Spalten verschieben
   Empfängt einen Move-Callback → keine zirkulären Abhängigkeiten
   ============================================================ */

let _moveCallback = null;  // async (id, newStatus) => void
let _draggedId    = null;

/**
 * Initialisiert Drag & Drop.
 * Wird nach jedem Board-Render erneut aufgerufen.
 *
 * @param {Function} onMove - Callback: async (id, newStatus)
 */
export function initDragDrop(onMove) {
    _moveCallback = onMove;
    _attachListeners();
}

/**
 * Aktualisiert nur die Drag-Listener auf Karten
 * (wird nach jedem Re-Render aufgerufen).
 */
export function refreshCardListeners() {
    _attachCardListeners();
}

/* ---- Private Funktionen ---- */

function _attachListeners() {
    _attachColumnListeners();
    _attachCardListeners();
}

function _attachColumnListeners() {
    document.querySelectorAll('.column').forEach((col) => {
        // Alte Listener entfernen (verhindert Duplikate)
        col.removeEventListener('dragover',  _onDragOver);
        col.removeEventListener('dragleave', _onDragLeave);
        col.removeEventListener('drop',      _onDrop);

        col.addEventListener('dragover',  _onDragOver);
        col.addEventListener('dragleave', _onDragLeave);
        col.addEventListener('drop',      _onDrop);
    });
}

function _attachCardListeners() {
    document.querySelectorAll('.card').forEach((card) => {
        card.removeEventListener('dragstart', _onDragStart);
        card.removeEventListener('dragend',   _onDragEnd);

        card.addEventListener('dragstart', _onDragStart);
        card.addEventListener('dragend',   _onDragEnd);
    });
}

/* ---- Event Handler ---- */

function _onDragStart(e) {
    _draggedId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // ID als Fallback im dataTransfer speichern
    e.dataTransfer.setData('text/plain', _draggedId);
}

function _onDragEnd() {
    this.classList.remove('dragging');
    // Alle Highlight-Klassen entfernen
    document.querySelectorAll('.column').forEach((c) => c.classList.remove('drag-over'));
    _draggedId = null;
}

function _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function _onDragLeave(e) {
    // Nur entfernen, wenn das Maus-Ziel wirklich die Spalte verlässt
    // (nicht bei Kinderelementen)
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

async function _onDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const id        = e.dataTransfer.getData('text/plain') || _draggedId;
    const newStatus = this.dataset.status;

    if (id && newStatus && _moveCallback) {
        await _moveCallback(id, newStatus);
    }
}
