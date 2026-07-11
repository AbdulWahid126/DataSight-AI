document.addEventListener('DOMContentLoaded', () => {
    // 1. File Upload UI interactions
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-upload');
    const filePreview = document.getElementById('file-preview');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadProgress = document.getElementById('upload-progress-container');
    const browseLabel = document.querySelector('label[for="csv-upload"]');
    
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
                UI.showAlert(result.message, 'success');
                updateDashboard(result.summary, result.preview);
                // Store file_id globally for next phases
                window.currentFileId = result.file_id;
                
                // Phase 4: Trigger Intelligent Analysis
                UI.showAlert('Analyzing dataset patterns...', 'info');
                fetchAnalysis(result.file_id);
                
                // Phase 6: Unhide Generate Chart button
                const btnGen = document.getElementById('btn-generate-chart');
                if(btnGen) btnGen.classList.remove('hidden');
            } else {
                UI.showAlert(result.message || 'Error processing file', 'error');
                resetUploadUI();
            }
        } catch (error) {
            UI.showAlert('Network error. Please try again.', 'error');
            resetUploadUI();
        } finally {
            uploadProgress.classList.add('hidden');
            fileInput.disabled = false;
            browseLabel.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        }
    }

    function resetUploadUI() {
        fileInput.value = '';
        filePreview.classList.add('hidden');
        fileNameDisplay.textContent = '';
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
            resetUploadUI();
            UI.showAlert('File removed.', 'info');
        });
    }
    
    // Chat UI interactions
    const chatForm = document.querySelector('.xl\\:col-span-1 form');
    const chatInput = chatForm?.querySelector('input[type="text"]');
    const chatHistory = document.querySelector('.xl\\:col-span-1 .overflow-y-auto');
    const typingIndicator = document.getElementById('typing-indicator');

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChatSubmit();
        });
        
        const submitBtn = chatForm.querySelector('button');
        if (submitBtn && submitBtn.type === 'button') {
            submitBtn.addEventListener('click', handleChatSubmit);
        }
    }

    async function handleChatSubmit() {
        const question = chatInput.value.trim();
        if (!question) return;
        
        if (!window.currentFileId) {
            UI.showAlert('Please upload a dataset first.', 'warning');
            return;
        }

        // Add user message to UI
        appendUserMessage(question);
        chatInput.value = '';
        
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
            
            if (typingIndicator) {
                typingIndicator.classList.add('hidden');
            }

            if (response.ok) {
                appendBotMessage(result.answer, result.confidence, result.suggestions);
            } else {
                appendBotMessage(result.answer || 'Error processing question.', 0);
            }
        } catch (error) {
            if (typingIndicator) {
                typingIndicator.classList.add('hidden');
            }
            appendBotMessage('Network error. Unable to reach the question engine.', 0);
        }
    }

    function appendUserMessage(text) {
        const msgHtml = `
            <div class="flex gap-3 flex-row-reverse">
                <div class="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    <i class="ph ph-user text-white"></i>
                </div>
                <div class="bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm p-3 text-sm text-white max-w-[90%]">
                    ${text}
                </div>
            </div>
        `;
        if (typingIndicator) {
            typingIndicator.insertAdjacentHTML('beforebegin', msgHtml);
        } else {
            chatHistory.insertAdjacentHTML('beforeend', msgHtml);
        }
        scrollToBottom();
    }

    function appendBotMessage(text, confidence = null, suggestions = null) {
        let confHtml = '';
        if (confidence !== null && confidence > 0) {
            let confColor = confidence > 80 ? 'text-emerald-400' : (confidence > 50 ? 'text-yellow-400' : 'text-orange-400');
            confHtml = '<p class="text-xs ' + confColor + ' mt-2 font-medium"><i class="ph ph-check-circle"></i> ' + confidence + '% confidence match (Rule-based Engine)</p>';
        }
        
        let suggHtml = '';
        if (suggestions && suggestions.length > 0) {
            suggHtml = '<ul class="list-disc pl-5 mt-2 text-primary">';
            suggestions.forEach(s => {
                suggHtml += '<li>' + s + '</li>';
            });
            suggHtml += '</ul>';
        }

        const msgHtml = `
            <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-dark-border flex-shrink-0 flex items-center justify-center mt-1">
                    <i class="ph ph-robot text-slate-300"></i>
                </div>
                <div class="bg-dark-bg/80 border border-dark-border rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 max-w-[90%] shadow-sm">
                    <p>${text}</p>
                    ${suggHtml}
                    ${confHtml}
                    <p class="text-[10px] text-slate-500 mt-1">${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
        
        if (typingIndicator) {
            typingIndicator.insertAdjacentHTML('beforebegin', msgHtml);
        } else {
            chatHistory.insertAdjacentHTML('beforeend', msgHtml);
        }
        scrollToBottom();
    }

    function scrollToBottom() {
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    // QA Suggestion Buttons Logic
    // Target the suggestion buttons inside the right column chat section
    const qaButtons = document.querySelectorAll('#flash-container ~ * button.text-left, .xl\:col-span-1 button.text-left');
    // More reliable: target all rounded-full suggestion buttons directly
    const suggestionButtons = document.querySelectorAll('button.rounded-full.text-left');
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (chatInput) {
                chatInput.value = e.currentTarget.innerText.trim();
                handleChatSubmit();
            }
        });
    });

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
                UI.showAlert('Analysis complete!', 'success');
            } else {
                UI.showAlert(result.message || 'Error generating analysis', 'warning');
            }
        } catch (error) {
            console.error("Analysis error:", error);
            UI.showAlert('Error communicating with analysis engine.', 'error');
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

            // UI Loading state
            btnGenerateChart.disabled = true;
            btnGenerateChart.classList.add('opacity-50', 'cursor-not-allowed');
            chartLoader.classList.remove('hidden');
            
            try {
                const response = await fetch('/api/generate-chart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_id: window.currentFileId })
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Update image with cache busting
                    generatedChartImg.src = result.chart_path + '?t=' + new Date().getTime(); 
                    
                    generatedChartImg.onload = () => {
                        chartLoader.classList.add('hidden');
                        chartPlaceholderBars.classList.add('hidden');
                        generatedChartImg.classList.remove('hidden');
                        
                        // Update info panel
                        chartTypeBadge.textContent = result.chart_type;
                        chartExplanation.textContent = result.explanation;
                        chartTimestamp.textContent = 'Generated at ' + new Date().toLocaleTimeString();
                        chartInfo.classList.remove('hidden');
                        
                        // Setup download button
                        btnDownloadChart.href = result.chart_path;
                        btnDownloadChart.classList.remove('hidden');
                        btnDownloadChart.classList.add('flex'); // override hidden flex conflict
                        
                        // Hide generate button after generation
                        btnGenerateChart.classList.add('hidden');
                        
                        UI.showAlert('Visualization generated successfully!', 'success');
                    };
                    
                    generatedChartImg.onerror = () => {
                        chartLoader.classList.add('hidden');
                        UI.showAlert('Failed to load chart image.', 'error');
                        btnGenerateChart.disabled = false;
                        btnGenerateChart.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                } else {
                    chartLoader.classList.add('hidden');
                    UI.showAlert(result.message || 'Error generating chart.', 'error');
                    btnGenerateChart.disabled = false;
                    btnGenerateChart.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            } catch (error) {
                console.error("Chart generation error:", error);
                chartLoader.classList.add('hidden');
                UI.showAlert('Network error while generating chart.', 'error');
                btnGenerateChart.disabled = false;
                btnGenerateChart.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    // Simulate initial system readiness
    setTimeout(() => {
        UI.showAlert('Ready for data! Upload a CSV file to begin analysis.', 'info');
    }, 1000);
});
