// Konfiguracja stref szkoły (bramki UHF RFID oraz stanowisko świetlicy)
const SCHOOL_ZONES = [
    { id: 'szatnia', name: '🏫 Wejście / Szatnia', isExit: false },
    { id: 'swietlica', name: '🧸 Świetlica Szkolna', isExit: false },
    { id: 'korytarz', name: '🚶 Korytarz / Sale', isExit: false },
    { id: 'podworko', name: '🌳 Podwórko / Boisko', isExit: false },
    { id: 'poza_szkola', name: '🚪 Poza Szkołą (Wyjście)', isExit: true }
];

// Pula startowa uczniów (Demo Zero-Click gotowe od razu po otwarciu strony)
const INITIAL_STUDENTS = [
    {
        id: 'STU-01',
        tagId: 'UHF-9041',
        name: 'Bartek C. (5B)',
        zoneId: 'swietlica',
        isDaycare: true,
        daycareCheckedIn: true,
        noSelfExit: true,
        parentEmail: ''
    },
    {
        id: 'STU-02',
        tagId: 'UHF-9042',
        name: 'Zuzia K. (2A)',
        zoneId: 'swietlica',
        isDaycare: true,
        daycareCheckedIn: true,
        noSelfExit: true,
        parentEmail: ''
    },
    {
        id: 'STU-03',
        tagId: 'UHF-9043',
        name: 'Ola W. (1C)',
        zoneId: 'szatnia',
        isDaycare: true,
        daycareCheckedIn: false,
        noSelfExit: true,
        parentEmail: ''
    },
    {
        id: 'STU-04',
        tagId: 'UHF-9044',
        name: 'Igor M. (5B)',
        zoneId: 'korytarz',
        isDaycare: false,
        daycareCheckedIn: false,
        noSelfExit: false,
        parentEmail: ''
    },
    {
        id: 'STU-05',
        tagId: 'UHF-9045',
        name: 'Staś K. (3A)',
        zoneId: 'podworko',
        isDaycare: true,
        daycareCheckedIn: true,
        noSelfExit: false,
        parentEmail: ''
    }
];

// Otwarte furtki pod przyszłe rozszerzenia sprzętowe i chmurowe
const SYSTEM_CONFIG = {
    makeWebhookUrl: '',        // Miejsce na URL z Make.com do wysyłki e-maili
    hardwareBridgeEnabled: false // Flaga pod przyszłe podpięcie ESP32 (WebSerial/MQTT)
};
