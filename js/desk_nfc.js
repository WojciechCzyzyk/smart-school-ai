// Moduł obsługi Biurka Świetlicy NFC (13,56 MHz) oraz Panelu Zagrożeń
const DeskNfcModule = {
    init() {
        AppState.subscribe(() => this.render());
        this.render();
    },

    render() {
        this.renderThreatPanel();
        this.renderAlertModal();
        this.renderNfcDesk();
    },

    // 1. Renderowanie Panelu Zagrożeń na górze ekranu
    renderThreatPanel() {
        const panel = document.getElementById('threat-panel');
        const counter = document.getElementById('threat-counter');
        const list = document.getElementById('threat-list');
        if (!panel || !counter || !list) return;

        const activeThreats = AppState.threats.filter(t => !t.resolved);

        if (activeThreats.length > 0) {
            panel.classList.remove('threat-ok');
            panel.classList.add('threat-alarm');
            counter.className = 'status-pill alarm';
            counter.textContent = `🚨 ${activeThreats.length} aktywne`;
        } else {
            panel.classList.remove('threat-alarm');
            panel.classList.add('threat-ok');
            counter.className = 'status-pill ok';
            counter.textContent = '0 incydentów';
        }

        if (AppState.threats.length === 0) {
            list.innerHTML = '<p class="muted-info">Brak naruszeń. Wszystkie dzieci świetlicowe pod nadzorem.</p>';
            return;
        }

        list.innerHTML = AppState.threats.map(threat => {
            if (threat.resolved) {
                return `
                    <div class="threat-item resolved">
                        <span>✔ <strong>${threat.studentName}</strong> (${threat.time}) — interwencja potwierdzona</span>
                    </div>
                `;
            }
            return `
                <div class="threat-item">
                    <span>🚨 <strong>${threat.studentName}</strong> [${threat.tagId}] opuścił szkołę bez zgody o ${threat.time}!</span>
                    <button class="btn-resolve" onclick="AppState.resolveThreat('${threat.id}')">✔ Potwierdź interwencję</button>
                </div>
            `;
        }).join('');
    },

    // 2. Renderowanie wyskakującego okna alertu (Popup / Modal)
    renderAlertModal() {
        const modal = document.getElementById('alert-modal');
        const textBox = document.getElementById('alert-modal-text');
        if (!modal || !textBox) return;

        const threat = AppState.latestPopupThreat;
        if (threat && !threat.resolved) {
            textBox.innerHTML = `Uczeń <strong>${threat.studentName}</strong> (brelok <code>${threat.tagId}</code>) przeszedł przez bramkę wyjściową <strong>Poza Szkołą</strong> o godz. <strong>${threat.time}</strong> bez zatwierdzenia ze świetlicy!`;
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    },

    // 3. Renderowanie stanowiska NFC przy biurku wychowawcy
    renderNfcDesk() {
        const container = document.getElementById('nfc-desk-actions');
        if (!container) return;

        if (AppState.students.length === 0) {
            container.innerHTML = '<p class="muted-info">Brak uczniów w bazie. Dodaj ucznia powyżej lub przywróć pulę demo.</p>';
            return;
        }

        const selected = AppState.students.find(s => s.id === AppState.selectedNfcStudentId) || AppState.students[0];
        const optionsHtml = AppState.students.map(s =>
            `<option value="${s.id}" ${s.id === selected.id ? 'selected' : ''}>${s.name} [${s.tagId}]</option>`
        ).join('');

        const statusText = selected.daycareCheckedIn
            ? '🟢 Zatwierdzony na świetlicy'
            : (selected.isDaycare ? '🟡 Zapisany (oczekuje na przyjęcie NFC)' : '⚪ Niezapisany na świetlicę');

        container.innerHTML = `
            <div class="nfc-reader-box">
                <div class="nfc-student-info">
                    <span class="nfc-label">💳 Zbliżono brelok NFC (kliknij kafelek ucznia lub wybierz):</span>
                    <select id="nfc-student-select" style="background:#161b22; color:#e6edf3; border:1px solid #30363d; padding:0.3rem 0.5rem; border-radius:5px; font-weight:700;">
                        ${optionsHtml}
                    </select>
                    <span style="font-size:0.78rem; color:#8b949e;">Status: ${statusText}</span>
                </div>
                <div class="nfc-buttons">
                    <button class="btn btn-nfc-in" onclick="AppState.approveDaycareCheckIn('${selected.id}')">✔ Zatwierdź przyjęcie</button>
                    <button class="btn btn-nfc-out" onclick="AppState.approveDaycareCheckOut('${selected.id}')">👋 Zatwierdź wyjście (NFC)</button>
                    <button class="btn btn-nfc-remote" onclick="AppState.remoteReleaseFromDaycare('${selected.id}')">🔓 Zwolnij zdalnie</button>
                </div>
            </div>
        `;

        const selectEl = document.getElementById('nfc-student-select');
        if (selectEl) {
            selectEl.addEventListener('change', (e) => {
                AppState.selectedNfcStudentId = e.target.value;
                AppState.notify();
            });
        }
    }
};
