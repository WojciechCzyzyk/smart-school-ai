// Moduł renderowania 5 stref szkoły i obsługi przeciągania Drag & Drop
const ZonesModule = {
    draggedStudentId: null,

    init() {
        AppState.subscribe(() => this.render());
        this.render();
    },

    render() {
        const container = document.getElementById('zones-container');
        if (!container) return;

        container.innerHTML = '';

        SCHOOL_ZONES.forEach(zone => {
            const zoneStudents = AppState.students.filter(s => s.zoneId === zone.id);

            const column = document.createElement('div');
            column.className = 'zone-column' + (zone.isExit ? ' zone-danger-border' : '');
            column.dataset.zoneId = zone.id;

            // Nagłówek strefy z licznikiem uczniów
            const header = document.createElement('div');
            header.className = 'zone-header';
            header.innerHTML = `
                <h3>${zone.name}</h3>
                <span class="zone-count">${zoneStudents.length}</span>
            `;

            // Obszar upuszczania kafelków (Dropzone)
            const dropzone = document.createElement('div');
            dropzone.className = 'zone-dropzone';

            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                const studentId = e.dataTransfer.getData('text/plain') || this.draggedStudentId;
                if (studentId) {
                    AppState.registerScanEvent(studentId, zone.id, 'UHF_GATE');
                    this.draggedStudentId = null;
                }
            });

            // Renderowanie kafelków uczniów w danej strefie
            zoneStudents.forEach(student => {
                const card = this.createStudentCard(student, zone);
                dropzone.appendChild(card);
            });

            column.appendChild(header);
            column.appendChild(dropzone);
            container.appendChild(column);
        });
    },

    createStudentCard(student, zone) {
        const isAlert = zone.isExit && student.noSelfExit && (student.daycareCheckedIn || student.isDaycare);

        const card = document.createElement('div');
        card.className = 'student-card';
        if (student.daycareCheckedIn) card.classList.add('daycare-active');
        if (isAlert) card.classList.add('alert-state');

        card.draggable = true;
        card.dataset.studentId = student.id;

        card.addEventListener('dragstart', (e) => {
            this.draggedStudentId = student.id;
            e.dataTransfer.setData('text/plain', student.id);
        });

        card.addEventListener('click', () => {
            AppState.selectedNfcStudentId = student.id;
            AppState.notify();
        });

        const daycareBadge = student.daycareCheckedIn
            ? '<span class="mini-badge badge-daycare">✔ Na świetlicy</span>'
            : (student.isDaycare
                ? '<span class="mini-badge badge-regular">Świetlica (oczekuje)</span>'
                : '<span class="mini-badge badge-regular">Niezapisany</span>');

        const exitBadge = student.noSelfExit
            ? '<span class="mini-badge badge-lock">🔒 Zakaz wyjścia</span>'
            : '<span class="mini-badge badge-free">🔓 Zgoda na wyjście</span>';

        card.innerHTML = `
            <div class="student-top">
                <span class="student-name">${student.name}</span>
                <span class="rfid-tag-id">${student.tagId}</span>
            </div>
            <div class="student-badges">
                ${daycareBadge}
                ${exitBadge}
            </div>
        `;

        return card;
    }
};
