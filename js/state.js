// Centralny magazyn stanu systemu Smart School AI (Single Source of Truth)
const AppState = {
    students: [],
    threats: [],
    logs: [],
    selectedNfcStudentId: null,
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
        this.selectedNfcStudentId = this.students.length > 0 ? this.students[0].id : null;
        this.addLog('SYSTEM', 'Załadowano pulę startową uczniów (Tryb Demo).');
        this.notify();
    },

    // Wyczyszczenie wszystkich danych do zera
    clearAllData() {
        this.students = [];
        this.threats = [];
        this.logs = [];
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
        if (!this.selectedNfcStudentId) {
            this.selectedNfcStudentId = newStudent.id;
        }
        this.addLog('REJESTRACJA', `Dodano ucznia ${newStudent.name} [${newStudent.tagId}] w strefie Szatnia.`);
        this.notify();
        return newStudent;
    },

    // Główny Event Bus dla bramek UHF RFID (wspólny dla symulatora i przyszłego ESP32)
    registerScanEvent(studentId, targetZoneId, source = 'UHF_GATE') {
        const student = this.students.find(s => s.id === studentId);
        const zone = SCHOOL_ZONES.find(z => z.id === targetZoneId);
        if (!student || !zone) return;

        const previousZoneId = student.zoneId;
        if (previousZoneId === targetZoneId) return;

        student.zoneId = targetZoneId;
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
            this.addLog('ALARM', `🚨 KRYTYCZNY ALERT: ${student.name} opuścił szkołę bez zatwierdzenia!`);
        }

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
