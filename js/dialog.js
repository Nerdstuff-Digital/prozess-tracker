/* ============================================================
   DIALOG – Bestellung anlegen & bearbeiten
   Empfängt Callbacks von app.js → keine zirkulären Abhängigkeiten
   ============================================================ */

let _onSave   = null;   // async (data, id|null) => void
let _onDelete = null;   // async (id) => void

/**
 * Initialisiert den Dialog und bindet Event-Listener.
 * Muss einmal beim App-Start aufgerufen werden.
 *
 * @param {Function} onSave   - Callback: Speichern (data, id)
 * @param {Function} onDelete - Callback: Löschen (id)
 */
export function initDialog(onSave, onDelete) {
    _onSave   = onSave;
    _onDelete = onDelete;

    document.getElementById('btn-save').addEventListener('click',   _handleSave);
    document.getElementById('btn-cancel').addEventListener('click', closeDialog);
    document.getElementById('delete-btn').addEventListener('click', _handleDelete);

    // Dialog schließen, wenn Backdrop angeklickt wird
    const dialog = document.getElementById('order-dialog');
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    // Esc-Taste schließt Dialog (nativ via <dialog>, hier als Absicherung)
    dialog.addEventListener('cancel', closeDialog);
}

/** Aktuell bearbeitete Bestellungs-ID (null = Neu-Modus) */
let _currentId = null;

/**
 * Öffnet den Dialog.
 *
 * @param {'create'|'edit'} mode  - Neu-Anlage oder Bearbeiten
 * @param {Object|null}     order - Bestellungs-Objekt (nur im Edit-Modus)
 */
export function openDialog(mode, order = null) {
    const dialog    = document.getElementById('order-dialog');
    const deleteBtn = document.getElementById('delete-btn');
    const titleEl   = document.getElementById('dialog-title');

    // Formular zurücksetzen
    _resetForm();

    if (mode === 'edit' && order) {
        _currentId = order.id;
        titleEl.textContent         = 'Bestellung bearbeiten';
        deleteBtn.style.display     = 'block';

        document.getElementById('input-title').value       = order.title       || '';
        document.getElementById('input-anzahl').value      = order.anzahl      ?? 1;
        document.getElementById('input-priority').value    = order.priority    || 'Medium';
        document.getElementById('input-anmerkungen').value = order.anmerkungen || '';
    } else {
        _currentId                  = null;
        titleEl.textContent         = 'Neue Bestellung';
        deleteBtn.style.display     = 'none';
    }

    dialog.showModal();

    // Fokus auf Titel-Feld setzen
    requestAnimationFrame(() => {
        document.getElementById('input-title').focus();
    });
}

/** Schließt den Dialog und setzt den Zustand zurück. */
export function closeDialog() {
    document.getElementById('order-dialog').close();
    _currentId = null;
}

/* ---- Private Hilfsfunktionen ---- */

function _resetForm() {
    document.getElementById('input-title').value       = '';
    document.getElementById('input-anzahl').value      = '1';
    document.getElementById('input-priority').value    = 'Medium';
    document.getElementById('input-anmerkungen').value = '';
    _clearError();
}

function _clearError() {
    const titleInput = document.getElementById('input-title');
    titleInput.classList.remove('error');
}

async function _handleSave() {
    const titleInput = document.getElementById('input-title');
    const title      = titleInput.value.trim();

    // Validierung: Titel darf nicht leer sein
    if (!title) {
        titleInput.classList.add('error');
        titleInput.focus();
        return;
    }
    _clearError();

    const data = {
        title,
        anzahl:      parseInt(document.getElementById('input-anzahl').value, 10) || 1,
        priority:    document.getElementById('input-priority').value,
        anmerkungen: document.getElementById('input-anmerkungen').value.trim()
    };

    // Button temporär deaktivieren, um Doppelklick zu verhindern
    const saveBtn = document.getElementById('btn-save');
    saveBtn.disabled    = true;
    saveBtn.textContent = '…';

    try {
        if (_onSave) await _onSave(data, _currentId);
        closeDialog();
    } finally {
        saveBtn.disabled    = false;
        saveBtn.textContent = 'Speichern';
    }
}

async function _handleDelete() {
    if (!_currentId) return;

    if (!confirm('Bestellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;

    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.disabled = true;

    try {
        if (_onDelete) await _onDelete(_currentId);
        closeDialog();
    } finally {
        deleteBtn.disabled = false;
    }
}
