let _onSave   = null;
let _onDelete = null;

export function initDialog(onSave, onDelete) {
    _onSave   = onSave;
    _onDelete = onDelete;

    document.getElementById('btn-save').addEventListener('click',   _handleSave);
    document.getElementById('btn-cancel').addEventListener('click', closeDialog);
    document.getElementById('delete-btn').addEventListener('click', _handleDelete);

    const dialog = document.getElementById('order-dialog');
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    dialog.addEventListener('cancel', closeDialog);
}

let _currentId = null;

export function openDialog(mode, order = null) {
    const dialog    = document.getElementById('order-dialog');
    const deleteBtn = document.getElementById('delete-btn');
    const titleEl   = document.getElementById('dialog-title');

    _resetForm();

    if (mode === 'edit' && order) {
        _currentId = order.id;
        titleEl.textContent         = 'Bestellung bearbeiten';
        deleteBtn.style.display     = 'block';

        document.getElementById('input-title').value       = order.title       || '';
        document.getElementById('input-anzahl').value      = order.anzahl      ?? 1;
        document.getElementById('input-priority').value    = order.priority    || 'Low';
        document.getElementById('input-anmerkungen').value = order.anmerkungen || '';
    } else {
        _currentId                  = null;
        titleEl.textContent         = 'Neue Bestellung';
        deleteBtn.style.display     = 'none';
    }

    dialog.showModal();

    requestAnimationFrame(() => {
        document.getElementById('input-title').focus();
    });
}

export function closeDialog() {
    document.getElementById('order-dialog').close();
    _currentId = null;
}

function _resetForm() {
    document.getElementById('input-title').value       = '';
    document.getElementById('input-anzahl').value      = '1';
    document.getElementById('input-priority').value    = 'Low';
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
