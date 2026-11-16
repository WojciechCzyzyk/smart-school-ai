// Moduł szkolnego radiowęzła głosowego (Web Audio API + Web Speech API)
const TtsAudioModule = {
    // Przyjemny dwutonowy gong przed komunikatem głosowym
    playChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();

            const playTone = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            playTone(659.25, now, 0.35);        // Dźwięk E5
            playTone(523.25, now + 0.32, 0.55); // Dźwięk C5
        } catch (e) {
            console.warn('Brak wsparcia Web Audio API:', e);
        }
    },

    // Sygnał ostrzegawczy przy naruszeniu bezpieczeństwa
    playAlarm() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            [0, 0.25, 0.5].forEach(offset => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now + offset);
                gain.gain.setValueAtTime(0.18, now + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + offset);
                osc.stop(now + offset + 0.2);
            });
        } catch (e) {
            console.warn('Brak wsparcia Web Audio API:', e);
        }
    },

    // Wywołanie ucznia przez radiowęzeł szkolny
    announceStudent(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Zamiana "Bartek C. (5B)" na naturalny tekst dla lektora
        const cleanName = student.name.replace(/\(([^)]+)\)/, ', klasa $1,');
        const messageText = `${cleanName} proszony do wyjścia na recepcję.`;

        AppState.addLog('RADIOWĘZEŁ_TTS', `🔊 Komunikat głosowy: "${messageText}"`);
        AppState.notify();

        this.playChime();

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(messageText);
            utterance.lang = 'pl-PL';
            utterance.rate = 0.96;
            utterance.pitch = 1.02;
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 650);
        }
    }
};
