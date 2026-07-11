/**
 * UI Helper — Enhanced with deduplication and improved toast management
 */
class UI {
    static _activeMessages = new Set();

    static showAlert(message, type = 'info') {
        const container = document.getElementById('flash-container');
        if (!container) return;

        // Deduplicate: never show the same message twice simultaneously
        if (UI._activeMessages.has(message)) return;
        UI._activeMessages.add(message);

        const alertId = 'alert-' + Date.now();
        
        let bgColor, icon;
        switch(type) {
            case 'success':
                bgColor = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                icon = '<i class="ph ph-check-circle text-xl"></i>';
                break;
            case 'error':
                bgColor = 'bg-red-500/10 border-red-500/50 text-red-400';
                icon = '<i class="ph ph-warning-circle text-xl"></i>';
                break;
            case 'warning':
                bgColor = 'bg-orange-500/10 border-orange-500/50 text-orange-400';
                icon = '<i class="ph ph-warning text-xl"></i>';
                break;
            default: // info
                bgColor = 'bg-primary/10 border-primary/50 text-primary';
                icon = '<i class="ph ph-info text-xl"></i>';
        }

        const alertHtml = `
            <div id="${alertId}" class="flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transform transition-all duration-300 translate-x-full opacity-0 ${bgColor} mb-2">
                ${icon}
                <p class="text-sm font-medium flex-grow text-white">${message}</p>
                <button onclick="document.getElementById('${alertId}').remove()" class="text-slate-400 hover:text-white transition-colors focus:outline-none">
                    <i class="ph ph-x"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', alertHtml);
        
        // Animate in
        setTimeout(() => {
            const el = document.getElementById(alertId);
            if(el) {
                el.classList.remove('translate-x-full', 'opacity-0');
            }
        }, 10);

        // Auto remove after 5s
        const dismissDelay = type === 'error' ? 7000 : 5000;
        setTimeout(() => {
            const el = document.getElementById(alertId);
            if(el) {
                el.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    el.remove();
                    UI._activeMessages.delete(message);
                }, 300);
            } else {
                UI._activeMessages.delete(message);
            }
        }, dismissDelay);
    }
}
