let _moveCallback = null;
let _draggedId    = null;

export function initDragDrop(onMove) {
    _moveCallback = onMove;
    _attachListeners();
}

export function refreshCardListeners() {
    _attachCardListeners();
}

function _attachListeners() {
    _attachColumnListeners();
    _attachCardListeners();
}

function _attachColumnListeners() {
    document.querySelectorAll('.column').forEach((col) => {
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

function _onDragStart(e) {
    _draggedId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _draggedId);
}

function _onDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.column').forEach((c) => c.classList.remove('drag-over'));
    _draggedId = null;
}

function _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function _onDragLeave(e) {
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
