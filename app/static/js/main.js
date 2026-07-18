document.addEventListener('DOMContentLoaded', () => {
    // Initialize currentFileId from sessionStorage
    window.currentFileId = sessionStorage.getItem('currentFileId') || null;

    // ── Request-in-flight guards (prevent duplicate requests) ────────────────
    let isUploadProcessing = false;
    let isChatProcessing   = false;
    let isChartProcessing  = false;

    // ── Footer status bar updater ────────────────────────────────────────────
    function updateFooterStatus(fileName, rows, cols) {
        const elName = document.getElementById('footer-file-name');
        const elRows = document.getElementById('footer-rows');
        const elCols = document.getElementById('footer-cols');
        const elTime = document.getElementById('footer-upload-time');
        const pillRows = document.getElementById('footer-rows-pill');
        const pillCols = document.getElementById('footer-cols-pill');
        const pillTime = document.getElementById('footer-time-pill');

        if (elName && fileName) {
            elName.textContent = fileName;
            if (pillRows && rows) { elRows.textContent = Number(rows).toLocaleString(); pillRows.classList.remove('hidden'); pillRows.classList.add('flex'); }
            if (pillCols && cols) { elCols.textContent = Number(cols).toLocaleString(); pillCols.classList.remove('hidden'); pillCols.classList.add('flex'); }
            if (pillTime) {
                const cached = sessionStorage.getItem('uploadTimestamp');
                elTime.textContent = cached ? 'Uploaded ' + new Date(Number(cached)).toLocaleTimeString() : 'Just now';
                pillTime.classList.remove('hidden');
                pillTime.classList.add('flex');
            }
        }
    }

    // Restore footer from sessionStorage on every page load
    const _sfn = sessionStorage.getItem('currentFileName');
    const _srows = sessionStorage.getItem('currentFileRows');
    const _scols = sessionStorage.getItem('currentFileCols');
    if (_sfn) updateFooterStatus(_sfn, _srows, _scols);


    // ── Session Restore Helpers ─────────────────────────────────────────────
    function saveChatHistory() {
        const chatHistory = document.getElementById('chat-history-area');
        if (!chatHistory) return;
        // Save innerHTML minus the typing indicator which has id
        const clone = chatHistory.cloneNode(true);
        const ti = clone.querySelector('#typing-indicator');
        if (ti) ti.remove();
        sessionStorage.setItem('chatHistory', clone.innerHTML);
    }

    function restoreChatHistory() {
        const chatHistory = document.getElementById('chat-history-area');
        const typingIndicator = document.getElementById('typing-indicator');
        const chatEmptyState  = document.getElementById('chat-empty-state');
        if (!chatHistory) return;
        const cached = sessionStorage.getItem('chatHistory');
        if (!cached || cached.trim() === '') return;
        // Insert cached messages before the typing indicator
        const tmp = document.createElement('div');
        tmp.innerHTML = cached;
        // Clear existing children except typing indicator and empty state
        Array.from(chatHistory.children).forEach(child => {
            if (child.id !== 'typing-indicator' && child.id !== 'chat-empty-state') chatHistory.removeChild(child);
        });
        Array.from(tmp.children).forEach(child => {
            if (typingIndicator) {
                chatHistory.insertBefore(child, typingIndicator);
            } else {
                chatHistory.appendChild(child);
            }
        });
        // Hide empty state if we have restored messages
        if (chatEmptyState && tmp.children.length > 0) chatEmptyState.classList.add('hidden');
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function clearSessionAndResetUI() {
        window.currentFileId = null;
        // Clear all sessionStorage keys
        const keysToClear = [
            'currentFileId', 'currentFileName', 'currentFileRows', 'currentFileCols',
            'dashboardSummary', 'dashboardPreview', 'dashboardAnalysis',
            'chartPath', 'chartType', 'chartExplanation', 'chartTimestamp', 'chartTimestampLabel',
            'chatHistory', 'aiInsightsResult', 'uploadTimestamp', 'suggestedQuestions'
        ];
        keysToClear.forEach(k => sessionStorage.removeItem(k));

        // Hide suggested questions
        populateSuggestedQuestions([]);

        // Clear server session
        fetch('/api/clear-session', { method: 'POST' }).catch(err => console.error(err));

        resetUploadUI();
        resetChartState();
        resetAnalysisUI();

        // Clear chat history, keep only the welcome message
        const chatHistoryEl = document.getElementById('chat-history-area');
        if (chatHistoryEl) {
            Array.from(chatHistoryEl.children).forEach(child => {
                if (child.id !== 'typing-indicator' && child.id !== 'chat-empty-state') {
                    chatHistoryEl.removeChild(child);
                }
            });
            const chatEmptyState = document.getElementById('chat-empty-state');
            if (chatEmptyState) chatEmptyState.classList.remove('hidden');
        }

        // Hide chart buttons
        const btnGen = document.getElementById('btn-generate-chart');
        const btnDown = document.getElementById('btn-download-chart');
        if (btnGen) btnGen.classList.add('hidden');
        if (btnDown) {
            btnDown.classList.add('hidden');
            btnDown.classList.remove('flex');
        }

        // Update footer status
        const elName = document.getElementById('footer-file-name');
        const pillRows = document.getElementById('footer-rows-pill');
        const pillCols = document.getElementById('footer-cols-pill');
        const pillTime = document.getElementById('footer-time-pill');
        if (elName) elName.textContent = 'No dataset loaded';
        if (pillRows) pillRows.classList.add('hidden');
        if (pillCols) pillCols.classList.add('hidden');
        if (pillTime) pillTime.classList.add('hidden');
    }

    async function restoreDashboardFromSession() {
        const fileId = sessionStorage.getItem('currentFileId');
        if (!fileId) return;

        try {
            // Verify with server if the dataset is still active
            const response = await fetch(`/api/dataset/${fileId}`);
            if (!response.ok) {
                clearSessionAndResetUI();
                return;
            }
            const result = await response.json();
            if (!result.success) {
                clearSessionAndResetUI();
                return;
            }

            const summaryRaw = sessionStorage.getItem('dashboardSummary');
            const previewRaw = sessionStorage.getItem('dashboardPreview');
            const analysisRaw = sessionStorage.getItem('dashboardAnalysis');
            const chartPath = sessionStorage.getItem('chartPath');
            const chartType = sessionStorage.getItem('chartType');
            const chartExplanationText = sessionStorage.getItem('chartExplanation');
            const fileName = sessionStorage.getItem('currentFileName');

            // Restore file name badge
            const fileNameDisplay = document.getElementById('file-name');
            const filePreview = document.getElementById('file-preview');
            if (fileNameDisplay && fileName) fileNameDisplay.textContent = fileName;
            if (filePreview && summaryRaw) filePreview.classList.remove('hidden');

            // Restore summary cards + preview table
            if (summaryRaw && previewRaw) {
                try {
                    updateDashboard(JSON.parse(summaryRaw), JSON.parse(previewRaw));
                } catch(e) { console.warn('Could not restore summary/preview', e); }
            }

            // Restore analysis panels
            if (analysisRaw) {
                try {
                    populateAnalysisPanels(JSON.parse(analysisRaw));
                } catch(e) { console.warn('Could not restore analysis', e); }
            }

            // Restore chart
            if (chartPath && chartType && chartExplanationText) {
                const img = document.getElementById('generated-chart-img');
                const bars = document.getElementById('chart-placeholder-bars');
                const chartInfoEl = document.getElementById('chart-info');
                const chartTypeBadgeEl = document.getElementById('chart-type-badge');
                const chartExplanationEl = document.getElementById('chart-explanation');
                const chartTimestampEl = document.getElementById('chart-timestamp');
                const btnGen = document.getElementById('btn-generate-chart');
                const btnDown = document.getElementById('btn-download-chart');

                if (img) {
                    img.src = chartPath + '?t=' + (sessionStorage.getItem('chartTimestamp') || Date.now());
                    img.classList.remove('hidden');
                }
                if (bars) bars.classList.add('hidden');
                if (chartTypeBadgeEl) chartTypeBadgeEl.textContent = chartType;
                if (chartExplanationEl) chartExplanationEl.textContent = chartExplanationText;
                if (chartTimestampEl) chartTimestampEl.textContent = sessionStorage.getItem('chartTimestampLabel') || '';
                if (chartInfoEl) chartInfoEl.classList.remove('hidden');
                if (btnGen) btnGen.classList.add('hidden');
                if (btnDown) {
                    btnDown.href = chartPath;
                    btnDown.classList.remove('hidden');
                    btnDown.classList.add('flex');
                }
            }

            // Restore chat history
            restoreChatHistory();

            // Restore suggested questions
            const savedSuggestions = sessionStorage.getItem('suggestedQuestions');
            if (savedSuggestions) {
                try {
                    populateSuggestedQuestions(JSON.parse(savedSuggestions));
                } catch(e) { console.warn('Could not restore suggestions', e); }
            }
        } catch (err) {
            console.error('Error verifying active dataset session:', err);
            // Do not clear on network errors to prevent losing work due to simple flaky connection
        }
    }

    // Run dashboard restoration immediately on page load
    restoreDashboardFromSession();

    // ── Wire ripple effect on all [data-ripple] buttons ──────────────────────
    document.querySelectorAll('[data-ripple]').forEach(btn => UI.addRipple(btn));


    // 1. File Upload UI interactions
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-upload');
    const filePreview = document.getElementById('file-preview');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadProgress = document.getElementById('upload-progress-container');
    const browseLabel = document.querySelector('label[for="csv-upload"]');
    
    // ── View Sample Button ──────────────────────────────────────────────────
    const btnViewSample = document.getElementById('btn-view-sample');
    if (btnViewSample) {
        btnViewSample.addEventListener('click', async () => {
            if (isUploadProcessing) return;
            isUploadProcessing = true;
            UI.setButtonLoading(btnViewSample, true, 'Loading...');

            try {
                const response = await fetch('/api/load-sample', { method: 'POST' });
                const result = await response.json();

                if (response.ok && result.success) {
                    window.currentFileId = result.file_id;
                    sessionStorage.setItem('currentFileId', result.file_id);
                    sessionStorage.setItem('currentFileName', result.filename || 'sample_sales_data.csv');
                    sessionStorage.setItem('currentFileRows', result.summary.total_rows);
                    sessionStorage.setItem('currentFileCols', result.summary.total_columns);
                    sessionStorage.setItem('uploadTimestamp', Date.now());
                    // Persist dashboard data for cross-navigation restoration
                    sessionStorage.setItem('dashboardSummary', JSON.stringify(result.summary));
                    sessionStorage.setItem('dashboardPreview', JSON.stringify(result.preview));
                    // Clear stale chart/analysis/chat from a previous dataset
                    ['dashboardAnalysis','chartPath','chartType','chartExplanation',
                     'chartTimestamp','chartTimestampLabel','chatHistory','aiInsightsResult'].forEach(k => sessionStorage.removeItem(k));

                    updateDashboard(result.summary, result.preview);
                    fileNameDisplay.textContent = result.filename || 'sample_sales_data.csv';
                    filePreview.classList.remove('hidden');
                    resetChartState();

                    updateFooterStatus(result.filename || 'sample_sales_data.csv', result.summary.total_rows, result.summary.total_columns);

                    // Show generate chart button
                    const btnChart = document.getElementById('btn-generate-chart');
                    if (btnChart) { btnChart.classList.remove('hidden'); btnChart.classList.add('revealed'); }

                    if (typeof SessionManager !== 'undefined') {
                        SessionManager.saveDataset(result.file_id, result.filename || 'sample_sales_data.csv', result.summary.total_rows, result.summary.total_columns);
                    }

                    UI.showAlert('Sample dataset loaded successfully.', 'success');
                    fetchAnalysis(result.file_id);
                } else {
                    UI.showAlert(UI.friendlyError(result.message) || 'Could not load sample dataset.', 'error');
                }
            } catch (e) {
                UI.showAlert(UI.friendlyError(e.message || e), 'error');
            } finally {
                UI.setButtonLoading(btnViewSample, false);
                isUploadProcessing = false;
            }
        });
    }
    
    // ── Upload New Button ───────────────────────────────────────────────────
    const btnUploadNew = document.getElementById('btn-upload-new');
    if (btnUploadNew) {
        btnUploadNew.addEventListener('click', () => {
            // Full session & UI reset
            clearSessionAndResetUI();
            
            // Open file picker
            if (fileInput) {
                fileInput.value = '';
                fileInput.click();
            }
            UI.showAlert('Ready for new dataset. Select a CSV file.', 'info');
        });
    }

    
    if (uploadZone && fileInput) {
        // Drag over
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-active');
        });
        
        // Drag leave
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-active');
        });
        
        // Drop
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-active');
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
        
        // Input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }
    
    function handleFileSelection(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            UI.showAlert('Please select a valid CSV file.', 'error');
            fileInput.value = '';
            return;
        }

        // Validate size (25MB)
        if (file.size > 25 * 1024 * 1024) {
            UI.showAlert('File exceeds the 25MB limit.', 'error');
            fileInput.value = '';
            return;
        }

        fileNameDisplay.textContent = file.name;
        filePreview.classList.remove('hidden');
        
        // Trigger the upload automatically
        uploadFile(file);
    }
    
    async function uploadFile(file) {
        if (isUploadProcessing) return;
        isUploadProcessing = true;

        const formData = new FormData();
        formData.append('file', file);

        // UI Loading State
        uploadProgress.classList.remove('hidden');
        fileInput.disabled = true;
        browseLabel.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                UI.showAlert('Dataset uploaded successfully!', 'success');
                updateDashboard(result.summary, result.preview);

                // Store file_id globally for next phases
                window.currentFileId = result.file_id;
                sessionStorage.setItem('currentFileId', result.file_id);
                sessionStorage.setItem('currentFileName', file.name);
                sessionStorage.setItem('currentFileRows', result.summary.total_rows);
                sessionStorage.setItem('currentFileCols', result.summary.total_columns);
                sessionStorage.setItem('uploadTimestamp', Date.now());
                // Persist dashboard data for cross-navigation restoration
                sessionStorage.setItem('dashboardSummary', JSON.stringify(result.summary));
                sessionStorage.setItem('dashboardPreview', JSON.stringify(result.preview));
                // Clear stale chart/analysis/chat from a previous dataset
                ['dashboardAnalysis','chartPath','chartType','chartExplanation',
                 'chartTimestamp','chartTimestampLabel','chatHistory','aiInsightsResult'].forEach(k => sessionStorage.removeItem(k));

                updateFooterStatus(file.name, result.summary.total_rows, result.summary.total_columns);

                // Show generate chart button
                const btnChart = document.getElementById('btn-generate-chart');
                if (btnChart) { btnChart.classList.remove('hidden'); btnChart.classList.add('revealed'); }

                // Phase 7: Track in Session History
                if (typeof SessionManager !== 'undefined') {
                    SessionManager.saveDataset(result.file_id, file.name, result.summary.total_rows, result.summary.total_columns);
                }

                // Phase 4: Trigger Intelligent Analysis
                UI.showAlert('Analyzing dataset patterns…', 'info');
                fetchAnalysis(result.file_id);

                // Phase 6: Fully reset & re-enable Generate Chart button for this new dataset
                resetChartState();

                // Re-show generate chart after reset
                if (btnChart) { btnChart.classList.remove('hidden'); btnChart.classList.add('revealed'); }
            } else {
                UI.showAlert(UI.friendlyError(result.message) || 'Error processing file', 'error');
                resetUploadUI();
            }
        } catch (error) {
            UI.showAlert(UI.friendlyError(error.message || error), 'error');
            resetUploadUI();
        } finally {
            uploadProgress.classList.add('hidden');
            fileInput.disabled = false;
            browseLabel.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            isUploadProcessing = false;
        }
    }

    function resetUploadUI() {
        if (fileInput) fileInput.value = '';
        if (filePreview) filePreview.classList.add('hidden');
        if (fileNameDisplay) fileNameDisplay.textContent = '';
    }

    function resetAnalysisUI() {
        // Hide analysis panels and numeric stats
        const numericSection = document.getElementById('numeric-stats-section');
        const analysisPanels = document.getElementById('analysis-panels');
        if (numericSection) numericSection.classList.add('hidden');
        if (analysisPanels) analysisPanels.classList.add('hidden');
        
        // Reset summary cards
        const cards = ['val-rows','val-cols','val-missing','val-numeric','val-categorical','val-size'];
        cards.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '0'; });
        
        // Reset preview table
        const thead = document.getElementById('preview-headers');
        const tbody = document.getElementById('preview-body');
        if (thead) thead.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
    }

    // Fully reset visualization state for a new upload
    function resetChartState() {
        const btnGen  = document.getElementById('btn-generate-chart');
        const btnDown = document.getElementById('btn-download-chart');
        const img     = document.getElementById('generated-chart-img');
        const info    = document.getElementById('chart-info');
        const bars    = document.getElementById('chart-placeholder-bars');
        const loader  = document.getElementById('chart-loader');

        if (btnGen) {
            btnGen.classList.remove('hidden', 'opacity-50', 'cursor-not-allowed');
            btnGen.disabled = false;
        }
        if (btnDown)  { btnDown.classList.add('hidden'); btnDown.classList.remove('flex'); btnDown.href = '#'; }
        if (img)      { img.classList.add('hidden'); img.src = ''; }
        if (info)     { info.classList.add('hidden'); }
        if (bars)     { bars.classList.remove('hidden'); }
        if (loader)   { loader.classList.add('hidden'); }

        // Clear persisted chart state so it is not restored after a reset
        ['chartPath','chartType','chartExplanation','chartTimestamp','chartTimestampLabel'].forEach(k => sessionStorage.removeItem(k));
    }

    function updateDashboard(summary, preview) {
        // Update Summary Cards
        document.getElementById('val-rows').textContent = summary.total_rows.toLocaleString();
        document.getElementById('val-cols').textContent = summary.total_columns.toLocaleString();
        document.getElementById('val-missing').textContent = summary.missing_values.toLocaleString();
        document.getElementById('val-numeric').textContent = summary.numeric_columns.toLocaleString();
        document.getElementById('val-categorical').textContent = summary.categorical_columns.toLocaleString();
        document.getElementById('val-size').textContent = summary.memory_usage_mb + ' MB';

        // Update Table
        const thead = document.getElementById('preview-headers');
        const tbody = document.getElementById('preview-body');
        
        if (preview && preview.length > 0) {
            // Generate headers dynamically
            const columns = Object.keys(preview[0]);
            let headerHtml = '<tr>';
            columns.forEach(col => {
                headerHtml += `<th class="px-6 py-3 font-medium truncate max-w-[150px]">${col}</th>`;
            });
            headerHtml += '</tr>';
            thead.innerHTML = headerHtml;

            // Generate rows dynamically
            let bodyHtml = '';
            preview.forEach(row => {
                bodyHtml += '<tr class="hover:bg-dark-card/60 transition-colors">';
                columns.forEach(col => {
                    let val = row[col];
                    if (val === null || val === undefined) {
                        val = '<span class="text-slate-500 italic">null</span>';
                    }
                    bodyHtml += `<td class="px-6 py-4 truncate max-w-[150px]">${val}</td>`;
                });
                bodyHtml += '</tr>';
            });
            tbody.innerHTML = bodyHtml;
        } else {
            thead.innerHTML = '<tr><th class="px-6 py-3">No data to display</th></tr>';
            tbody.innerHTML = '';
        }
    }

    // Preview close button
    const removeFileBtn = filePreview?.querySelector('button');
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            clearSessionAndResetUI();
            UI.showAlert('File removed.', 'info');
        });
    }
    
    // Chat UI interactions — use IDs for reliable targeting
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history-area');
    const typingIndicator = document.getElementById('typing-indicator');

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChatSubmit();
        });
        
        const submitBtn = chatForm.querySelector('button[type="button"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleChatSubmit);
        }
    }

    async function handleChatSubmit() {
        if (!chatInput) return;
        const question = chatInput.value.trim();
        if (!question) return;

        if (!window.currentFileId) {
            UI.showAlert('Please upload a dataset first.', 'warning');
            return;
        }

        if (isChatProcessing) return;
        isChatProcessing = true;

        // Hide empty state on first real message
        const chatEmptyState = document.getElementById('chat-empty-state');
        if (chatEmptyState) chatEmptyState.classList.add('hidden');

        // Add user message to UI
        appendUserMessage(question);
        chatInput.value = '';

        // Disable input & send button while processing
        chatInput.disabled = true;
        const sendBtn = chatForm?.querySelector('button[type="button"]');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.classList.add('opacity-50'); }

        // Show typing indicator
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            scrollToBottom();
        }

        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_id: window.currentFileId,
                    question: question
                })
            });

            const result = await response.json();

            if (typingIndicator) typingIndicator.classList.add('hidden');

            if (response.ok) {
                appendBotMessage(result.answer, result.confidence, result.suggestions, result.confidence_label);
                // Track question in Session History
                if (typeof SessionManager !== 'undefined') {
                    SessionManager.incrementQuestions(window.currentFileId);
                }
            } else {
                appendBotMessage(UI.friendlyError(result.answer || result.message || 'Error processing question.'), 0);
            }
        } catch (error) {
            if (typingIndicator) typingIndicator.classList.add('hidden');
            appendBotMessage(UI.friendlyError(error.message || 'network'), 0);
        } finally {
            isChatProcessing = false;
            chatInput.disabled = false;
            if (sendBtn) { sendBtn.disabled = false; sendBtn.classList.remove('opacity-50'); }
            chatInput.focus();
        }
    }

    function appendUserMessage(text) {
        const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const msgHtml = `
            <div class="flex gap-3 flex-row-reverse mb-4">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex-shrink-0 flex items-center justify-center shadow border border-primary/20">
                    <i class="ph ph-user text-white text-base"></i>
                </div>
                <div class="bg-primary/25 border border-primary/30 rounded-2xl rounded-tr-sm p-3.5 text-sm text-slate-100 max-w-[80%] shadow-sm leading-relaxed">
                    ${escapedText}
                </div>
            </div>
        `;
        if (typingIndicator) {
            typingIndicator.insertAdjacentHTML('beforebegin', msgHtml);
        } else {
            chatHistory.insertAdjacentHTML('beforeend', msgHtml);
        }
        scrollToBottom();
        saveChatHistory();
    }
    function appendBotMessage(text, confidence = null, suggestions = null, confidenceLabel = null) {
        let confHtml = '';
        if (confidence !== null && confidence > 0) {
            let engineName = confidenceLabel || "Rule-based Engine";
            let confColor = confidence > 80 ? 'text-emerald-400' : (confidence > 50 ? 'text-yellow-400' : 'text-orange-400');
            confHtml = `<p class="text-xs ${confColor} mt-2.5 font-medium flex items-center gap-1"><i class="ph ph-check-circle"></i> ${confidence}% confidence match (${engineName})</p>`;
        }
        
        let suggHtml = '';
        if (suggestions && suggestions.length > 0) {
            suggHtml = '<ul class="list-disc pl-5 mt-2 text-primary space-y-1">';
            suggestions.forEach(s => {
                suggHtml += '<li>' + s + '</li>';
            });
            suggHtml += '</ul>';
        }

        // Render Markdown Response
        let renderedText = text;
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            try {
                renderedText = marked.parse(text);
            } catch (e) {
                console.error("Marked parsing error:", e);
            }
        } else {
            renderedText = text
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-dark-bg px-1 rounded">$1</code>');
        }

        const msgHtml = `
            <div class="flex gap-3 mb-4">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-dark-border to-slate-700 flex-shrink-0 flex items-center justify-center border border-dark-border mt-1 shadow">
                    <i class="ph ph-robot text-accent text-base"></i>
                </div>
                <div class="bg-dark-bg/85 border border-dark-border rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 max-w-[80%] shadow-lg leading-relaxed markdown-body">
                    <div class="space-y-2">${renderedText}</div>
                    ${suggHtml}
                    ${confHtml}
                    <div class="flex justify-between items-center mt-3 pt-2 border-t border-dark-border/40 text-[10px] text-slate-500">
                        <span>${new Date().toLocaleTimeString()}</span>
                        <span class="flex items-center gap-0.5"><i class="ph ph-sparkle text-accent text-[9px]"></i> AI Response</span>
                    </div>
                </div>
            </div>
        `;
        
        if (typingIndicator) {
            typingIndicator.insertAdjacentHTML('beforebegin', msgHtml);
        } else {
            chatHistory.insertAdjacentHTML('beforeend', msgHtml);
        }
        scrollToBottom();
        saveChatHistory();
    }

    function scrollToBottom() {
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    // QA Suggestions populator
    function populateSuggestedQuestions(questions) {
        const container = document.getElementById('qa-suggestions-container');
        const chipsArea = document.getElementById('qa-suggestions-chips');
        if (!container || !chipsArea) return;

        chipsArea.innerHTML = '';
        if (questions && questions.length > 0) {
            questions.forEach(q => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'text-xs bg-dark-bg hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white px-3 py-2 rounded-full transition-all text-left truncate max-w-full duration-150 hover:-translate-y-0.5';
                btn.textContent = q;
                btn.setAttribute('data-ripple', '1');
                if (typeof UI !== 'undefined' && typeof UI.addRipple === 'function') {
                    UI.addRipple(btn);
                }
                btn.addEventListener('click', () => {
                    if (chatInput) {
                        chatInput.value = q;
                        handleChatSubmit();
                    }
                });
                chipsArea.appendChild(btn);
            });
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    async function fetchAnalysis(fileId) {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: fileId })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                populateAnalysisPanels(result.analysis);
                // Cache analysis for restoration after navigation
                sessionStorage.setItem('dashboardAnalysis', JSON.stringify(result.analysis));
                
                // Cache and populate suggested questions
                if (result.suggested_questions) {
                    populateSuggestedQuestions(result.suggested_questions);
                    sessionStorage.setItem('suggestedQuestions', JSON.stringify(result.suggested_questions));
                }
                
                UI.showAlert('Analysis complete! Insights ready.', 'success');
            } else {
                UI.showAlert(UI.friendlyError(result.message) || 'Error generating analysis', 'warning');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            UI.showAlert(UI.friendlyError(error.message || 'analysis failed'), 'warning');
        }
    }

    function populateAnalysisPanels(analysis) {
        // Unhide the sections
        document.getElementById('numeric-stats-section').classList.remove('hidden');
        document.getElementById('analysis-panels').classList.remove('hidden');

        // Populate Numeric Statistics Table
        const numericBody = document.getElementById('numeric-stats-body');
        let numHtml = '';
        const numStats = analysis.numeric_analysis;
        for (const col in numStats) {
            const stats = numStats[col];
            numHtml += `
                <tr class="hover:bg-dark-card/60 transition-colors">
                    <td class="px-6 py-4 font-medium text-white">${col}</td>
                    <td class="px-6 py-4">${stats.mean}</td>
                    <td class="px-6 py-4">${stats.median}</td>
                    <td class="px-6 py-4">${stats.min}</td>
                    <td class="px-6 py-4">${stats.max}</td>
                    <td class="px-6 py-4">${stats.missing_count}</td>
                </tr>
            `;
        }
        if (numHtml === '') {
            numHtml = '<tr><td colspan="6" class="px-6 py-4">No numeric columns found.</td></tr>';
        }
        numericBody.innerHTML = numHtml;

        // Populate Intelligent Insights
        const insightsList = document.getElementById('insights-list');
        let insightsHtml = '';
        analysis.insights.forEach(insight => {
            insightsHtml += `
                <li class="flex items-start gap-2">
                    <i class="ph ph-check-circle text-primary mt-1 flex-shrink-0"></i>
                    <span>${insight}</span>
                </li>
            `;
        });
        if (insightsHtml === '') {
            insightsHtml = '<li>No insights generated.</li>';
        }
        insightsList.innerHTML = insightsHtml;

        // Populate Data Quality Report
        const qualityContainer = document.getElementById('quality-report-container');
        const dq = analysis.data_quality;
        let dqHtml = '';

        if (dq.high_missing && dq.high_missing.length > 0) dqHtml += `<p><span class="text-orange-400 font-medium">High Missing (>50%):</span> ${dq.high_missing.join(', ')}</p>`;
        if (dq.constant_columns && dq.constant_columns.length > 0) dqHtml += `<p><span class="text-slate-400 font-medium">Constant Columns:</span> ${dq.constant_columns.join(', ')}</p>`;
        if (dq.potential_ids && dq.potential_ids.length > 0) dqHtml += `<p><span class="text-accent font-medium">Potential ID Columns:</span> ${dq.potential_ids.join(', ')}</p>`;
        if (dq.potential_targets && dq.potential_targets.length > 0) dqHtml += `<p><span class="text-purple-400 font-medium">Potential Targets:</span> ${dq.potential_targets.join(', ')}</p>`;
        if (dq.mixed_types && dq.mixed_types.length > 0) dqHtml += `<p><span class="text-red-400 font-medium">Mixed Types:</span> ${dq.mixed_types.join(', ')}</p>`;
        
        if (dqHtml === '') {
            dqHtml = '<p class="text-emerald-400 flex items-center gap-2"><i class="ph ph-check"></i> Excellent data quality! No major issues detected.</p>';
        }
        qualityContainer.innerHTML = dqHtml;
    }

    // Chart Generation Logic
    const btnGenerateChart = document.getElementById('btn-generate-chart');
    const btnDownloadChart = document.getElementById('btn-download-chart');
    const chartLoader = document.getElementById('chart-loader');
    const chartPlaceholderBars = document.getElementById('chart-placeholder-bars');
    const generatedChartImg = document.getElementById('generated-chart-img');
    const chartInfo = document.getElementById('chart-info');
    const chartTypeBadge = document.getElementById('chart-type-badge');
    const chartExplanation = document.getElementById('chart-explanation');
    const chartTimestamp = document.getElementById('chart-timestamp');

    if (btnGenerateChart) {
        btnGenerateChart.addEventListener('click', async () => {
            if (!window.currentFileId) {
                UI.showAlert('Please upload a dataset first.', 'warning');
                return;
            }
            if (isChartProcessing) return;
            isChartProcessing = true;

            // UI Loading state
            UI.setButtonLoading(btnGenerateChart, true, 'Generating…');
            chartLoader.classList.remove('hidden');

            try {
                const response = await fetch('/api/generate-chart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_id: window.currentFileId })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const ts = new Date().getTime();
                    const tsLabel = 'Generated at ' + new Date().toLocaleTimeString();
                    generatedChartImg.src = result.chart_path + '?t=' + ts;

                    generatedChartImg.onload = () => {
                        chartLoader.classList.add('hidden');
                        chartPlaceholderBars.classList.add('hidden');
                        generatedChartImg.classList.remove('hidden');

                        chartTypeBadge.textContent = result.chart_type;
                        chartExplanation.textContent = result.explanation;
                        chartTimestamp.textContent = tsLabel;
                        chartInfo.classList.remove('hidden');

                        btnDownloadChart.href = result.chart_path;
                        btnDownloadChart.classList.remove('hidden');
                        btnDownloadChart.classList.add('flex');

                        btnGenerateChart.classList.add('hidden');
                        UI.setButtonLoading(btnGenerateChart, false);

                        // Persist chart state for cross-navigation restoration
                        sessionStorage.setItem('chartPath', result.chart_path);
                        sessionStorage.setItem('chartType', result.chart_type);
                        sessionStorage.setItem('chartExplanation', result.explanation);
                        sessionStorage.setItem('chartTimestamp', ts);
                        sessionStorage.setItem('chartTimestampLabel', tsLabel);

                        if (typeof SessionManager !== 'undefined') {
                            SessionManager.incrementCharts(window.currentFileId);
                        }

                        UI.showAlert('Visualization generated successfully!', 'success');
                    };

                    generatedChartImg.onerror = () => {
                        chartLoader.classList.add('hidden');
                        UI.showAlert('Failed to load chart image. Please try again.', 'error');
                        UI.setButtonLoading(btnGenerateChart, false);
                        isChartProcessing = false;
                    };
                } else {
                    chartLoader.classList.add('hidden');
                    UI.showAlert(UI.friendlyError(result.message) || 'Error generating chart.', 'error');
                    UI.setButtonLoading(btnGenerateChart, false);
                    isChartProcessing = false;
                }
            } catch (error) {
                console.error('Chart generation error:', error);
                chartLoader.classList.add('hidden');
                UI.showAlert(UI.friendlyError(error.message || error), 'error');
                UI.setButtonLoading(btnGenerateChart, false);
                isChartProcessing = false;
            }
        });
    }

    // ── AI Insights Page Scripting ──────────────────────────────────────────
    const btnGenInsights = document.getElementById('btn-generate-insights');
    if (btnGenInsights) {
        const fileId = sessionStorage.getItem('currentFileId');
        const fileName = sessionStorage.getItem('currentFileName');
        const fileRows = sessionStorage.getItem('currentFileRows');
        const fileCols = sessionStorage.getItem('currentFileCols');

        const noDatasetWarning = document.getElementById('no-dataset-warning');
        const activeDatasetCard = document.getElementById('active-dataset-card');
        const insightsLoader = document.getElementById('insights-loader');
        const insightsResultContainer = document.getElementById('insights-result-container');

        const populateList = (listId, items) => {
            const list = document.getElementById(listId);
            if (!list) return;
            list.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'flex items-start gap-2 animate-fade-in';
                    let iconColor = 'text-primary';
                    let iconName = 'ph-check-circle';
                    if (listId === 'insight-findings') {
                        iconColor = 'text-emerald-400';
                        iconName = 'ph-chart-line-up';
                    } else if (listId === 'insight-risks') {
                        iconColor = 'text-orange-400';
                        iconName = 'ph-warning-octagon';
                    } else if (listId === 'insight-recommendations') {
                        iconColor = 'text-accent';
                        iconName = 'ph-lightbulb-filament';
                    }
                    li.innerHTML = `<i class="ph ${iconName} ${iconColor} mt-1 flex-shrink-0"></i> <span>${item}</span>`;
                    list.appendChild(li);
                });
            } else {
                list.innerHTML = '<li>No items to display.</li>';
            }
        };

        function renderInsights(data) {
            const execSummary = document.getElementById('insight-exec-summary');
            const explanation = document.getElementById('insight-explanation');
            if (execSummary) execSummary.textContent = data.executive_summary || '';
            populateList('insight-findings', data.key_findings);
            populateList('insight-risks', data.potential_risks);
            populateList('insight-recommendations', data.recommendations);
            if (explanation) explanation.textContent = data.plain_english_explanation || '';
            if (insightsResultContainer) insightsResultContainer.classList.remove('hidden');
        }

        if (!fileId) {
            if (noDatasetWarning) noDatasetWarning.classList.remove('hidden');
            if (activeDatasetCard) activeDatasetCard.classList.add('hidden');
        } else {
            const datasetNameEl = document.getElementById('dataset-name');
            const datasetRowsEl = document.getElementById('dataset-rows');
            const datasetColsEl = document.getElementById('dataset-cols');
            if (datasetNameEl) datasetNameEl.textContent = fileName || 'dataset.csv';
            if (datasetRowsEl) datasetRowsEl.textContent = Number(fileRows).toLocaleString() || '0';
            if (datasetColsEl) datasetColsEl.textContent = Number(fileCols).toLocaleString() || '0';
            if (activeDatasetCard) activeDatasetCard.classList.remove('hidden');
            if (noDatasetWarning) noDatasetWarning.classList.add('hidden');

            // Restore cached AI Insights without re-fetching
            const cachedInsights = sessionStorage.getItem('aiInsightsResult');
            if (cachedInsights) {
                try {
                    renderInsights(JSON.parse(cachedInsights));
                } catch(e) { console.warn('Could not restore cached insights', e); }
            }
        }

        btnGenInsights.addEventListener('click', async () => {
            if (!fileId) {
                UI.showAlert('Please upload a dataset first.', 'warning');
                return;
            }
            btnGenInsights.disabled = true;
            btnGenInsights.classList.add('opacity-50', 'cursor-not-allowed');
            if (insightsLoader) insightsLoader.classList.remove('hidden');
            if (insightsResultContainer) insightsResultContainer.classList.add('hidden');

            try {
                const response = await fetch('/api/ai-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_id: fileId })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const data = result.insights;
                    renderInsights(data);
                    // Cache insights for restoration after navigation
                    sessionStorage.setItem('aiInsightsResult', JSON.stringify(data));
                    UI.showAlert('AI Insights generated successfully!', 'success');
                } else {
                    UI.showAlert(result.message || 'Failed to generate AI insights.', 'error');
                }
            } catch (e) {
                UI.showAlert('Network error generating AI insights.', 'error');
            } finally {
                if (insightsLoader) insightsLoader.classList.add('hidden');
                btnGenInsights.disabled = false;
                btnGenInsights.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    // Show startup notification ONLY once per browser session (not on every navigation)
    if (!sessionStorage.getItem('ds_welcomed')) {
        sessionStorage.setItem('ds_welcomed', '1');
        setTimeout(() => {
            UI.showAlert('Ready for data! Upload a CSV file to begin analysis.', 'info');
        }, 800);
    }
});
