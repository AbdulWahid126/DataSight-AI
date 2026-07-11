/**
 * SessionManager 
 * Handles browser-based local storage for history and settings
 */
const SessionManager = {
    init() {
        if (!localStorage.getItem('dataSightHistory')) {
            localStorage.setItem('dataSightHistory', JSON.stringify([]));
        }
        if (!localStorage.getItem('dataSightSettings')) {
            localStorage.setItem('dataSightSettings', JSON.stringify({
                theme: 'dark',
                notifications: true,
                autoSave: true
            }));
        }
    },

    getHistory() {
        this.init();
        return JSON.parse(localStorage.getItem('dataSightHistory'));
    },

    getSettings() {
        this.init();
        return JSON.parse(localStorage.getItem('dataSightSettings'));
    },

    saveSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        localStorage.setItem('dataSightSettings', JSON.stringify(settings));
    },

    saveDataset(fileId, name, rows, cols) {
        const history = this.getHistory();
        // Check if exists
        const existingIndex = history.findIndex(h => h.id === fileId);
        if (existingIndex >= 0) {
            history[existingIndex] = { ...history[existingIndex], name, rows, cols };
        } else {
            history.unshift({
                id: fileId,
                name: name,
                uploadDate: new Date().toISOString(),
                rows: rows,
                cols: cols,
                questions: 0,
                charts: 0
            });
        }
        localStorage.setItem('dataSightHistory', JSON.stringify(history));
    },

    incrementQuestions(fileId) {
        if (!fileId) return;
        const history = this.getHistory();
        const existing = history.find(h => h.id === fileId);
        if (existing) {
            existing.questions += 1;
            localStorage.setItem('dataSightHistory', JSON.stringify(history));
        }
    },

    incrementCharts(fileId) {
        if (!fileId) return;
        const history = this.getHistory();
        const existing = history.find(h => h.id === fileId);
        if (existing) {
            existing.charts += 1;
            localStorage.setItem('dataSightHistory', JSON.stringify(history));
        }
    },

    clearHistory() {
        localStorage.setItem('dataSightHistory', JSON.stringify([]));
    },
    
    resetApplication() {
        localStorage.removeItem('dataSightHistory');
        localStorage.removeItem('dataSightSettings');
        this.init();
    }
};

// Auto-init on load
SessionManager.init();
