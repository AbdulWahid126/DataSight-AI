/**
 * SessionManager - Phase 8 Production Polish
 * Handles temporary browser state (sessionStorage) for history, and
 * permanent browser state (localStorage) for harmless UI preferences only.
 */
const SessionManager = {
    init() {
        if (!sessionStorage.getItem('dataSightHistory')) {
            sessionStorage.setItem('dataSightHistory', JSON.stringify([]));
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
        return JSON.parse(sessionStorage.getItem('dataSightHistory'));
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
        sessionStorage.setItem('dataSightHistory', JSON.stringify(history));
    },

    incrementQuestions(fileId) {
        if (!fileId) return;
        const history = this.getHistory();
        const existing = history.find(h => h.id === fileId);
        if (existing) {
            existing.questions += 1;
            sessionStorage.setItem('dataSightHistory', JSON.stringify(history));
        }
    },

    incrementCharts(fileId) {
        if (!fileId) return;
        const history = this.getHistory();
        const existing = history.find(h => h.id === fileId);
        if (existing) {
            existing.charts += 1;
            sessionStorage.setItem('dataSightHistory', JSON.stringify(history));
        }
    },

    clearHistory() {
        sessionStorage.setItem('dataSightHistory', JSON.stringify([]));
    },
    
    resetApplication() {
        // Clear history in sessionStorage
        sessionStorage.removeItem('dataSightHistory');
        // Clear all temporary sessionStorage cache
        const keysToClear = [
            'currentFileId', 'currentFileName', 'currentFileRows', 'currentFileCols',
            'dashboardSummary', 'dashboardPreview', 'dashboardAnalysis',
            'chartPath', 'chartType', 'chartExplanation', 'chartTimestamp', 'chartTimestampLabel',
            'chatHistory', 'aiInsightsResult', 'uploadTimestamp'
        ];
        keysToClear.forEach(k => sessionStorage.removeItem(k));
        
        // Reset default settings
        localStorage.removeItem('dataSightSettings');
        this.init();

        // Clear server session asynchronously
        fetch('/api/clear-session', { method: 'POST' }).catch(err => console.error(err));
    }
};

// Auto-init on load
SessionManager.init();
