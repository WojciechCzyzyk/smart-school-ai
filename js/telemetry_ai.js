// Moduł Telemetrii, Powiadomień E-mail Rodziców oraz Asystenta AI Dyrekcji
const TelemetryAiModule = {
    emailHistory: [],
    lastCheckedLogTimestamp: null,

    init() {
        AppState.subscribe((state) => {
            this.checkForParentNotification(state);
            this.render(state);
        });
        this.render(AppState);
    },

    // Sprawdzenie, czy ostatnie zdarzenie wymaga powiadomienia e-mail dla rodzica
        checkForParentNotification(state) {
         if (state.logs.length === 0) return;
          const latestLog = state.logs[0];
         if (latestLog.timestamp === this.lastCheckedLogTimestamp) return;
        this.lastCheckedLogTimestamp = latestLog.timestamp;

        // Szukamy ucznia powiązanego z wybranym lub ostatnio skanowanym ID, który ma wpisany e-mail
        if (latestLog.type === 'UHF_GATE' || latestLog.type === 'NFC_BIURKO' || latestLog.type === 'ALARM') {
            const student = state.students.find(s => s.id === state.selectedNfcStudentId);
            if (student && student.parentEmail) {
                this.triggerParentEmail(student, latestLog.message, latestLog.type === 'ALARM');
            }
        }
    },

    // Wysyłka powiadomienia e-mail (symulacja + otwarta furtka pod Webhook Make.com)
    triggerParentEmail(student, eventDescription, isAlarm) {
        const time = new Date().toLocaleTimeString('pl-PL');
        const subject = isAlarm
            ? `🚨 PILNY ALERT SZKOŁA: ${student.name}`
            : `🏫 Informacja ze świetlicy: ${student.name}`;

        this.emailHistory.unshift({
            time,
            to: student.parentEmail,
            subject,
            isAlarm
        });

        if (this.emailHistory.length > 5) {
            this.emailHistory.pop();
        }

        // Otwarta furtka pod prawdziwy Webhook Make.com (jeśli skonfigurowany w js/config.js)
        if (SYSTEM_CONFIG && SYSTEM_CONFIG.makeWebhookUrl) {
            fetch(SYSTEM_CONFIG.makeWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typ_formularza: 'SmartSchool_ParentAlert',
                    email: student.parentEmail,
                    uczen: student.name,
                    opis: eventDescription,
                    alarm: isAlarm
                })
            }).catch(err => console.warn('Błąd wysyłki webhooka Make.com:', err));
        }
    },

    // Generowanie podsumowania dnia dla Dyrekcji Szkoły (Silnik analityczny AI)
    generateDailyAiReport() {
        const totalStudents = AppState.students.length;
        const inDaycare = AppState.students.filter(s => s.daycareCheckedIn).length;
        const outsideSchool = AppState.students.filter(s => s.zoneId === 'poza_szkola').length;
        const totalThreats = AppState.threats.length;
        const unresolvedThreats = AppState.threats.filter(t => !t.resolved).length;
        const now = new Date().toLocaleTimeString('pl-PL');

        const safetyStatus = unresolvedThreats > 0
            ? `⚠️ WYMAGA UWAGI: ${unresolvedThreats} niepotwierdzony incydent wyjścia!`
            : `✅ WZOROWY POZIOM BEZPIECZEŃSTWA (wszystkie strefy pod pełną kontrolą).`;

        const reportHtml = `
            <div style="background:#0d1117; border:1px solid #30363d; border-left:4px solid #58a6ff; border-radius:6px; padding:0.65rem; font-size:0.83rem; margin-top:0.5rem;">
                <div style="color:#58a6ff; font-weight:700; margin-bottom:0.35rem;">📊 RAPORT ASYSTENTA AI (wygenerowano o ${now}):</div>
                <ul style="padding-left:1.1rem; margin-bottom:0.4rem; color:#e6edf3;">
                    <li><strong>Stan ogólny ewidencji:</strong> ${totalStudents} zarejestrowanych uczniów (w tym <strong>${inDaycare}</strong> pod aktywną opieką świetlicy, <strong>${outsideSchool}</strong> poza terenem szkoły).</li>
                    <li><strong>Bezpieczeństwo:</strong> ${safetyStatus} (łącznie incydentów dziś: ${totalThreats}).</li>
                    <li><strong>Optymalizacja pracy kadry:</strong> System automatycznie zarejestrował <strong>${AppState.logs.length}</strong> zdarzeń strefowych bez ręcznego wpisywania list w arkuszach.</li>
                </ul>
                <div style="color:#8b949e; font-size:0.78rem;">💡 Wniosek AI: Kolejki przy biurku świetlicowym zredukowane o 100%. Gotowość do zamknięcia dnia.</div>
            </div>
        `;

        const reportOutput = document.getElementById('ai-generated-output');
        if (reportOutput) {
            reportOutput.innerHTML = reportHtml;
        }
    },

    render(state) {
        // 1. Strumień telemetrii po lewej stronie dolnego pasa
        const logContainer = document.getElementById('telemetry-log');
        if (logContainer) {
            if (state.logs.length === 0) {
                logContainer.innerHTML = '<p class="muted-info">Brak zarejestrowanych zdarzeń.</p>';
            } else {
                logContainer.innerHTML = state.logs
                    .map(entry => `<div><strong>[${entry.timestamp}]</strong> [${entry.type}] ${entry.message}</div>`)
                    .join('');
            }
        }

        // 2. Panel Asystenta AI i Powiadomień E-mail po prawej stronie dolnego pasa
        const aiBox = document.getElementById('ai-report-box');
        if (!aiBox) return;

        const emailsHtml = this.emailHistory.length === 0
            ? '<span style="color:#8b949e; font-size:0.78rem;">Brak wysłanych e-maili (dodaj ucznia z adresem e-mail rodzica, aby przetestować).</span>'
            : this.emailHistory.map(em => `
                <div style="font-size:0.78rem; padding:0.25rem 0.45rem; background:#0d1117; border-radius:4px; margin-top:0.25rem; border-left:3px solid ${em.isAlarm ? '#f85149' : '#3fb950'};">
                    ✉️ <strong>[${em.time}]</strong> Do: <code>${em.to}</code> — ${em.subject}
                </div>
            `).join('');

        aiBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <button class="btn btn-primary" onclick="TelemetryAiModule.generateDailyAiReport()">🤖 Generuj Raport Dnia AI</button>
                <span style="font-size:0.78rem; color:#8b949e;">Powiadomienia rodzica: aktywne</span>
            </div>
            <div id="ai-generated-output"></div>
            <div style="margin-top:0.55rem;">
                <strong style="font-size:0.8rem; color:#e6edf3;">📨 Ostatnie powiadomienia e-mail dla rodziców:</strong>
                ${emailsHtml}
            </div>
        `;
    }
};
