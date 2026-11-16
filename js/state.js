// Centralny magazyn stanu systemu Smart School AI (Single Source of Truth)
const AppState = {
    students: [],
    threats: [],
    logs: [],
    selectedNfcStudentId: null,
    latestPopupThreat: null,
    listeners: [],

    // Rejestracja modułów nasłuchujących zmian (wzorzec Observer)
    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.listeners.forEach(fn => fn(this));
    },

    // Inicjalizacja pulą demonstracyjną
    loadDemoData() {
        this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
        this.threats = [];
        this.logs = [];
        this.latestPopupThreat = null;
        this.selectedNfcStudentId = this.students.length > 0 ? this.students[0].id : null;
        this.addLog('SYSTEM', 'Załadowano pulę startową uczniów (Tryb Demo).');
        this.notify();
    },

    // Wyczyszczenie wszystkich danych do zera
    clearAllData() {
        this.students = [];
        this.threats = [];
        this.logs = [];
        this.latestPopupThreat = null;
        this.selectedNfcStudentId = null;
        this.addLog('SYSTEM', 'Wyczyszczono pulę uczniów. Gotowy do ręcznego dodawania.');
        this.notify();
    },

    // Dodanie nowego ucznia z formularza
    addStudent({ name, isDaycare, noSelfExit, parentEmail }) {
        const nextNum = this.students.length + 1;
        const newStudent = {
            id: 'STU-' + Date.now(),
            tagId: 'UHF-' + (9040 + nextNum),
            name: name.trim(),
            zoneId: 'szatnia',
            isDaycare: Boolean(isDaycare),
            daycareCheckedIn: false,
            noSelfExit: Boolean(noSelfExit),
            parentEmail: parentEmail ? parentEmail.trim() : ''
        };
        this.students.push(newStudent);
        this.selectedNfcStudentId = newStudent.id;
        this.addLog('REJESTRACJA', `Dodano ucznia ${newStudent.name} [${newStudent.tagId}] w strefie Szatnia.`);
        this.notify();
        return newStudent;
    },

    // 1. BIURKO NFC: Zatwierdzenie przyjęcia na świetlicę (eliminacja kolejki i Excela)
    approveDaycareCheckIn(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        student.isDaycare = true;
        student.daycareCheckedIn = true;
        student.zoneId = 'swietlica';
        this.addLog('NFC_BIURKO', `✔ Zatwierdzono przyjęcie na świetlicę: ${student.name} [${student.tagId}].`);
        this.notify();
    },

    // 2. BIURKO NFC: Standardowe wypisanie przy biurku
    approveDaycareCheckOut(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        student.daycareCheckedIn = false;
        student.noSelfExit = false;
        this.addLog('NFC_BIURKO', `👋 Zatwierdzono wyjście przy biurku NFC: ${student.name} (może opuścić szkołę).`);
        this.notify();
    },

    // 3. ZDALNE ZWOLNIENIE: Bez cofania dziecka z szatni/wyjścia do biurka
    remoteReleaseFromDaycare(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        student.daycareCheckedIn = false;
        student.noSelfExit = false;
        this.addLog('ZDALNE_ZWOLNIENIE', `🔓 Zdalnie zwolniono ze świetlicy: ${student.name} (brak konieczności powrotu do biurka).`);
        this.notify();
    },

    // Główny Event Bus dla bramek UHF RFID (wspólny dla symulatora i przyszłego ESP32)
    registerScanEvent(studentId, targetZoneId, source = 'UHF_GATE') {
        const student = this.students.find(s => s.id === studentId);
        const zone = SCHOOL_ZONES.find(z => z.id === targetZoneId);
        if (!student || !zone) return;

        const previousZoneId = student.zoneId;
        if (previousZoneId === targetZoneId) return;

        student.zoneId = targetZoneId;
        this.selectedNfcStudentId = student.id;
        this.addLog(source, `${student.name} [${student.tagId}] ➔ ${zone.name}`);

        // Reguła bezpieczeństwa: sprawdzenie nieuprawnionego opuszczenia szkoły
        if (zone.isExit && student.noSelfExit && (student.daycareCheckedIn || student.isDaycare)) {
            const threatEntry = {
                id: 'ALT-' + Date.now(),
                studentId: student.id,
                studentName: student.name,
                tagId: student.tagId,
                time: new Date().toLocaleTimeString('pl-PL'),
                resolved: false
            };
            this.threats.unshift(threatEntry);
            this.latestPopupThreat = threatEntry;
            this.addLog('ALARM', `🚨 KRYTYCZNY ALERT: ${student.name} opuścił szkołę bez zatwierdzenia!`);
        }

        this.notify();
    },

    // Zamknięcie wyskakującego okna alertu
    dismissPopupThreat() {
        this.latestPopupThreat = null;
        this.notify();
    },

    // Oznaczenie incydentu na liście zagrożeń jako opanowanego
    resolveThreat(threatId) {
        const threat = this.threats.find(t => t.id === threatId);
        if (!threat) return;

        threat.resolved = true;
        if (this.latestPopupThreat && this.latestPopupThreat.id === threatId) {
            this.latestPopupThreat = null;
        }
        this.addLog('INTERWENCJA', `🛡️ Wychowawca potwierdził opanowanie alertu dla: ${threat.studentName}.`);
        this.notify();
    },

    // Zapis pojedynczego wpisu do strumienia telemetrii
    addLog(type, message) {
        const timestamp = new Date().toLocaleTimeString('pl-PL');
        this.logs.unshift({ timestamp, type, message });
        if (this.logs.length > 50) {
            this.logs.pop();
        }
    }
};
