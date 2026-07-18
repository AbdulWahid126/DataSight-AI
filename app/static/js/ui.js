/**
 * UI Helper — Phase 8 Production Polish
 * Premium toast notifications, button loading states, ripple effects, error formatting.
 */
class UI {
    static _activeMessages = new Set();
    static _toastCount = 0;
    static MAX_TOASTS = 4;

    // ── Toast Notifications ──────────────────────────────────────────────────
    static showAlert(message, type = 'info') {
        const container = document.getElementById('flash-container');
        if (!container) return;

        // Deduplicate — never show the same message twice simultaneously
        if (UI._activeMessages.has(message)) return;

        // Limit total visible toasts
        const existing = container.querySelectorAll('[data-toast]');
        if (existing.length >= UI.MAX_TOASTS) {
            // Remove the oldest one immediately
            existing[0].remove();
            UI._toastCount = Math.max(0, UI._toastCount - 1);
        }

        UI._activeMessages.add(message);
        UI._toastCount++;

        const alertId = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const dismissDelay = type === 'error' ? 7000 : (type === 'warning' ? 6000 : 5000);

        const config = {
            success: {
                bar:  'bg-emerald-500',
                ring: 'border-emerald-500/40',
                bg:   'bg-emerald-500/10',
                text: 'text-emerald-300',
                icon: 'ph-check-circle',
                label: 'Success',
            },
            error: {
                bar:  'bg-red-500',
                ring: 'border-red-500/40',
                bg:   'bg-red-500/10',
                text: 'text-red-300',
                icon: 'ph-x-circle',
                label: 'Error',
            },
            warning: {
                bar:  'bg-amber-500',
                ring: 'border-amber-500/40',
                bg:   'bg-amber-500/10',
                text: 'text-amber-300',
                icon: 'ph-warning',
                label: 'Warning',
            },
            info: {
                bar:  'bg-blue-500',
                ring: 'border-blue-500/40',
                bg:   'bg-blue-500/10',
                text: 'text-blue-300',
                icon: 'ph-info',
                label: 'Info',
            },
        };

        const c = config[type] || config.info;

        const html = `
            <div id="${alertId}" data-toast
                 class="relative overflow-hidden flex items-start gap-3 p-4 pr-10 rounded-xl border backdrop-blur-md shadow-xl
                        transform transition-all duration-300 translate-x-full opacity-0
                        ${c.bg} ${c.ring} mb-2 max-w-sm w-full">

                <!-- Coloured left accent bar -->
                <div class="absolute left-0 top-0 bottom-0 w-1 ${c.bar} rounded-l-xl"></div>

                <!-- Icon -->
                <i class="ph ${c.icon} text-xl mt-0.5 flex-shrink-0 ${c.text}"></i>

                <!-- Text -->
                <div class="flex-grow min-w-0">
                    <p class="text-xs font-semibold ${c.text} mb-0.5 uppercase tracking-wide">${c.label}</p>
                    <p class="text-sm text-slate-200 leading-snug break-words">${message}</p>
                </div>

                <!-- Close button -->
                <button
                    onclick="UI._dismissToast('${alertId}')"
                    class="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors focus:outline-none"
                    aria-label="Dismiss">
                    <i class="ph ph-x text-sm"></i>
                </button>

                <!-- Progress bar -->
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-border/50">
                    <div class="${c.bar} h-full toast-progress"
                         style="animation: toastProgress ${dismissDelay}ms linear forwards"></div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);

        // Animate in on next tick
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(alertId);
                if (el) el.classList.remove('translate-x-full', 'opacity-0');
            });
        });

        // Auto-dismiss
        setTimeout(() => UI._dismissToast(alertId, message), dismissDelay);
    }

    static _dismissToast(id, message) {
        const el = document.getElementById(id);
        if (!el) {
            if (message) UI._activeMessages.delete(message);
            return;
        }
        el.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            el.remove();
            UI._toastCount = Math.max(0, UI._toastCount - 1);
            if (message) UI._activeMessages.delete(message);
        }, 350);
    }

    // ── Button Loading State ─────────────────────────────────────────────────
    /**
     * Put a button into a loading / normal state.
     * @param {HTMLElement} btn
     * @param {boolean} loading
     * @param {string} [loadingText]  Text shown while loading (preserves original via data-attr)
     */
    static setButtonLoading(btn, loading, loadingText = 'Processing...') {
        if (!btn) return;
        if (loading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="ph ph-spinner-gap animate-spin text-base"></i><span>${loadingText}</span>`;
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed');
        } else {
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }

    // ── Ripple Effect ────────────────────────────────────────────────────────
    /**
     * Add a material-style ripple on click.
     * Call this once on a button element to wire it up.
     * @param {HTMLElement} btn
     */
    static addRipple(btn) {
        if (!btn || btn.dataset.rippleWired) return;
        btn.dataset.rippleWired = '1';
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.addEventListener('click', (e) => {
            if (btn.disabled) return;
            const rect  = btn.getBoundingClientRect();
            const size  = Math.max(rect.width, rect.height);
            const x     = e.clientX - rect.left - size / 2;
            const y     = e.clientY - rect.top  - size / 2;
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            Object.assign(ripple.style, {
                width:  size + 'px',
                height: size + 'px',
                left:   x + 'px',
                top:    y + 'px',
            });
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    // ── Friendly Error Messages ──────────────────────────────────────────────
    /**
     * Convert raw error / status codes into human-readable messages.
     * Never exposes stack traces.
     * @param {string|number|Error} err
     * @returns {string}
     */
    static friendlyError(err) {
        const s = String(err).toLowerCase();
        if (s.includes('networkerror') || s.includes('failed to fetch') || s.includes('network error')) {
            return 'Network error — please check your connection and try again.';
        }
        if (s.includes('413'))  return 'File is too large. Please upload a CSV under 25 MB.';
        if (s.includes('404'))  return 'Resource not found. The dataset may have expired — please re-upload.';
        if (s.includes('500'))  return 'Server error occurred. Please try again in a moment.';
        if (s.includes('missing api key') || s.includes('missingapikey')) {
            return 'Gemini API key is not configured. Please add it in Settings.';
        }
        if (s.includes('invalid api key') || s.includes('invalidapikey')) {
            return 'Gemini API key is invalid. Please update it in Settings.';
        }
        if (s.includes('rate limit') || s.includes('ratelimit') || s.includes('quota')) {
            return 'AI rate limit reached. Please wait a moment and try again.';
        }
        if (s.includes('connection') || s.includes('socket') || s.includes('dns') || s.includes('no internet')) {
            return 'No internet connection. Please check your network.';
        }
        if (s.includes('dataset not found') || s.includes('session expired')) {
            return 'Session expired. Please re-upload your dataset.';
        }
        if (s.includes('invalid') && s.includes('csv')) {
            return 'Invalid CSV file. Please check the file format and try again.';
        }
        // Default: show truncated message, no internal details
        if (typeof err === 'string' && err.length < 120) return err;
        return 'An unexpected error occurred. Please try again.';
    }
}
