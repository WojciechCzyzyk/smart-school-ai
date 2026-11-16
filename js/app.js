// Główny punkt uruchomieniowy kokpitu Smart School AI
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicjalizacja wszystkich modułów systemu
    ZonesModule.init();
    DeskNfcModule.init();
    TelemetryAiModule.init();

    // 2. Przyciski sterujące pulą uczniów w nagłówku
    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) {
        btnReset.addEventListener('click', () => AppState.loadDemoData());
    }

    const btnClear = document.getElementById('btn-clear-all');
    if (btnClear) {
        btnClear.addEventListener('click', () => AppState.clearAllData());
    }

    // 3. Szybki formularz dodawania nowego ucznia
    const quickForm = document.getElementById('quick-add-form');
    if (quickForm) {
        quickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('student-name');
            const daycareInput = document.getElementById('student-daycare');
            const noExitInput = document.getElementById('student-no-exit');
            const emailInput = document.getElementById('student-email');

            if (!nameInput.value.trim()) return;

            AppState.addStudent({
                name: nameInput.value,
                isDaycare: daycareInput.checked,
                noSelfExit: noExitInput.checked,
                parentEmail: emailInput.value
            });

            nameInput.value = '';
            emailInput.value = '';
        });
    }

    // 4. Załadowanie puli startowej na otwarcie aplikacji
    AppState.loadDemoData();
});
