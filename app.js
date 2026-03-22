document.addEventListener('DOMContentLoaded', () => {
    const useCaseGrid = document.getElementById('use-case-grid');
    const modal = document.getElementById('detail-modal');
    const modalContent = modal.querySelector('.modal-content');
    const closeBtn = modal.querySelector('.close-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const scoringContainer = document.querySelector('.scoring-legend-container');

    let allData = null;

    // Fetch and Load Data
    async function loadData() {
        try {
            const response = await fetch('Data/data.json');
            const text = await response.text();
            
            // Robustly handle non-standard JSON tokens that might come from Excel exports
            const cleanedText = text.replace(/:\s*NaN/g, ': null')
                                  .replace(/:\s*nan/g, ': null')
                                  .replace(/:\s*Infinity/g, ': null')
                                  .replace(/:\s*-Infinity/g, ': null');
            
            allData = JSON.parse(cleanedText);
            
            renderUseCases(parseUseCases(allData));
            renderScoringLegend(allData['Scoring Legend']);
            
            // Remove loading state
            const loading = document.querySelector('.loading-state');
            if (loading) loading.remove();
        } catch (error) {
            console.error('Error loading data:', error);
            useCaseGrid.innerHTML = '<p class="error">Error loading dashboard data. Please check console.</p>';
        }
    }

    function parseUseCases(data) {
        const summary = data['Summary Matrix'];
        const details = data['Scoring Detail'];
        
        // Skip header rows
        const useCases = summary.slice(3, -1).filter(row => row['Unnamed: 2'] !== null && row['Unnamed: 2'] !== undefined);
        
        return useCases.map(uc => {
            const name = uc['Tolaram Group \u2014 AI Use Case Prioritization Scoring Matrix'];
            const detailRow = details.find(d => d['Tolaram Group \u2014 AI Use Case Scoring Detail & Full Rationale'] === name);
            
            return {
                name: name,
                domain: uc['Unnamed: 2'],
                type: uc['Unnamed: 3'],
                horizon: uc['Unnamed: 4'],
                impactScore: uc['Unnamed: 5'],
                impactRating: uc['Unnamed: 6'],
                effortScore: uc['Unnamed: 7'],
                effortRating: uc['Unnamed: 8'],
                dataScore: uc['Unnamed: 9'],
                dataRating: uc['Unnamed: 10'],
                // Details
                phase: detailRow ? detailRow['Unnamed: 3'] : '',
                impactRationale: detailRow ? detailRow['Unnamed: 5'] : '',
                impactDrivers: detailRow ? detailRow['Unnamed: 6'] : '',
                effortRationale: detailRow ? detailRow['Unnamed: 9'] : '',
                effortDrivers: detailRow ? detailRow['Unnamed: 10'] : '',
                dataRationale: detailRow ? detailRow['Unnamed: 13'] : '',
                dataSources: detailRow ? detailRow['Unnamed: 14'] : ''
            };
        });
    }

    function renderUseCases(useCases, filter = 'all') {
        useCaseGrid.innerHTML = '';
        
        const filtered = filter === 'all' 
            ? useCases 
            : useCases.filter(uc => uc.domain === filter);

        filtered.forEach((uc, index) => {
            const card = document.createElement('div');
            card.className = 'use-case-card animate-up';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const catColor = getCategoryColor(uc.domain);
            const horizonColor = getHorizonColor(uc.horizon);
            
            card.innerHTML = `
                <div class="card-cat-label" style="background: ${catColor}">${uc.domain}</div>
                <div class="card-top">
                    <div class="phase-title">${uc.phase}</div>
                    <h3>${uc.name}</h3>
                    <div class="horizon-tag" style="background: ${horizonColor}20; color: ${horizonColor}">
                        <i class="far fa-clock"></i> ${uc.horizon}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="sm-metric">
                        <span class="lbl">Impact</span>
                        <span class="val" style="color: ${getRatingColor(uc.impactRating)}">${uc.impactScore}</span>
                    </div>
                    <div class="sm-metric">
                        <span class="lbl">Effort</span>
                        <span class="val" style="color: ${getRatingColor(uc.effortRating, true)}">${uc.effortScore}</span>
                    </div>
                    <div class="sm-metric">
                        <span class="lbl">Data</span>
                        <span class="val" style="color: ${getRatingColor(uc.dataRating)}">${uc.dataScore}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openDetail(uc));
            useCaseGrid.appendChild(card);
        });
    }

    function getCategoryColor(domain) {
        const d = domain.toLowerCase();
        if (d.includes('sales')) return 'var(--cat-sales)';
        if (d.includes('logistics')) return 'var(--cat-logistics)';
        if (d.includes('finance')) return 'var(--cat-finance)';
        if (d.includes('manufacturing')) return 'var(--cat-manufacturing)';
        return 'var(--cat-other)';
    }

    function getHorizonColor(horizon) {
        if (horizon.includes('H1')) return 'var(--hor-h1)';
        if (horizon.includes('H2')) return 'var(--hor-h2)';
        if (horizon.includes('H3')) return 'var(--hor-h3)';
        return 'var(--accent)';
    }

    function renderScoringLegend(legendData) {
        if (!legendData) return;
        
        let html = '<div class="legend-grid">';
        let currentSection = '';
        
        legendData.slice(1).forEach(row => {
            const title = row['Scoring Legend \u2014 How to Read the Prioritization Matrix'];
            if (title && (title.includes('AXIS') || title.includes('Rating'))) {
                // Formatting based on structure
                if (title.includes('AXIS')) {
                    html += `</div><div class="legend-section"><h4>${title}</h4><div class="legend-rows">`;
                }
            } else if (title) {
                html += `
                    <div class="legend-row">
                        <span class="legend-rating ${title.toLowerCase()}">${title}</span>
                        <span class="legend-range">${row['Unnamed: 2'] || ''}</span>
                        <span class="legend-meaning">${row['Unnamed: 3'] || ''}</span>
                    </div>
                `;
            }
        });
        
        html += '</div></div>';
        scoringContainer.innerHTML = html;
    }

    function openDetail(uc) {
        modalContent.innerHTML = `
            <div class="modal-header">
                <span class="domain-badge large" style="background: ${getCategoryColor(uc.domain)}">${uc.domain}</span>
                <div class="phase-title" style="margin-top: 20px;">${uc.phase}</div>
                <h2>${uc.name}</h2>
                <p class="horizon-tag" style="background: ${getHorizonColor(uc.horizon)}20; color: ${getHorizonColor(uc.horizon)}; border-radius: 20px; padding: 6px 15px;">
                    <i class="far fa-clock"></i> ${uc.horizon}
                </p>
            </div>
            
            <div class="modal-grid">
                <div class="modal-section glass">
                    <div class="section-icon impact"><i class="fas fa-bolt"></i></div>
                    <h3>Business Impact</h3>
                    <div class="score-display">
                        <span class="score-num">${uc.impactScore}</span>
                        <span class="score-rating" style="background: ${getRatingColor(uc.impactRating)}">${uc.impactRating}</span>
                    </div>
                    <p class="rationale">${uc.impactRationale}</p>
                    <div class="drivers">
                        <strong>Key Drivers:</strong>
                        <p>${uc.impactDrivers}</p>
                    </div>
                </div>

                <div class="modal-section glass">
                    <div class="section-icon effort"><i class="fas fa-hammer"></i></div>
                    <h3>Implementation Effort</h3>
                    <div class="score-display">
                        <span class="score-num">${uc.effortScore}</span>
                        <span class="score-rating" style="background: ${getRatingColor(uc.effortRating, true)}">${uc.effortRating}</span>
                    </div>
                    <p class="rationale">${uc.effortRationale}</p>
                    <div class="drivers">
                        <strong>Approach / Resource:</strong>
                        <p>${uc.effortDrivers}</p>
                    </div>
                </div>

                <div class="modal-section glass full-width">
                    <div class="section-icon data"><i class="fas fa-database"></i></div>
                    <h3>Data Readiness</h3>
                    <div class="score-display">
                        <span class="score-num">${uc.dataScore}</span>
                        <span class="score-rating" style="background: ${getRatingColor(uc.dataRating)}">${uc.dataRating}</span>
                    </div>
                    <p class="rationale">${uc.dataRationale}</p>
                    <div class="drivers">
                        <strong>Sources & Gaps:</strong>
                        <p>${uc.dataSources}</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn primary" onclick="document.getElementById('detail-modal').classList.remove('active')">Got it</button>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function getRatingColor(rating, isInverted = false) {
        if (!rating) return '#94a3b8';
        const r = rating.toLowerCase();
        if (r.includes('high')) return isInverted ? '#ef4444' : '#22c55e';
        if (r.includes('medium')) return '#f59e0b';
        if (r.includes('low')) return isInverted ? '#22c55e' : '#ef4444';
        return '#94a3b8';
    }

    // Framework Modal Logic
    const frameworkModal = document.getElementById('framework-modal');
    const openFrameworkBtn = document.getElementById('open-framework');
    
    openFrameworkBtn.addEventListener('click', () => {
        renderFrameworkModal(allData['Scoring Legend']);
        frameworkModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    function renderFrameworkModal(legendData) {
        const container = frameworkModal.querySelector('.modal-content');
        if (!legendData) return;
        
        let html = '<div class="legend-grid" style="display: block; padding-bottom: 20px; width: 100%;">';
        let isFirst = true;
        
        legendData.slice(1).forEach(row => {
            const rowValues = Object.values(row);
            const title = rowValues[1]; // Column 2 (Index 1)
            if (!title) return;
            
            // Match AXIS or the main PHASE titles
            const upperTitle = title.toString().toUpperCase();
            const isHeader = upperTitle.includes('AXIS') || upperTitle.includes('PHASE ASSIGNMENT');
            
            if (isHeader) {
                if (!isFirst) {
                    html += '</div></div>'; // Close previous section
                }
                html += `
                    <div class="legend-section" style="width: 100%; margin-top: 40px; display: block;">
                        <h4 style="margin: 0 0 20px; color: #007aff; border-bottom: 3px solid #007aff; padding-bottom: 15px; font-family: 'Outfit', sans-serif; text-transform: uppercase; letter-spacing: 2px; font-size: 1.1rem; width: 100%; display: block;">${title}</h4>
                        <div class="legend-rows" style="display: grid; gap: 15px; width: 100%;">
                `;
                isFirst = false;
            } else if (upperTitle !== 'RATING' && !isFirst) {
                const range = rowValues[2] || '';
                const meaning = rowValues[3] || '';
                
                html += `
                    <div class="legend-row" style="display: grid; grid-template-columns: 120px 100px 1fr; gap: 20px; align-items: center; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 12px; border: 1px solid var(--glass-border); width: 100%;">
                        <span class="legend-rating" style="font-weight: 800; font-size: 0.8rem; text-transform: uppercase; color: #007aff;">${title}</span>
                        <span class="legend-range" style="font-family: monospace; opacity: 0.7; font-size: 0.85rem;">${range}</span>
                        <span class="legend-meaning" style="font-size: 0.9rem; color: var(--text-main);">${meaning}</span>
                    </div>
                `;
            }
        });
        
        if (!isFirst) {
            html += '</div></div>';
        }
        
        html += '</div>'; // Close legend-grid
        
        // Modal Footer with clear close button
        html += `
            <div class="modal-footer" style="padding: 30px 0 10px; border-top: 1px solid var(--glass-border); text-align: right; margin-top: 30px;">
                <button class="btn secondary close-modal-btn" style="padding: 12px 35px; border-radius: 12px; font-weight: 700;">Close Framework</button>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Single listener for the new button
        const closeBtn = container.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                frameworkModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }
    }

    // Modal Close Generic
    document.querySelectorAll('.modal .close-btn, .modal .modal-backdrop').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const m = e.target.closest('.modal');
            m.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUseCases(parseUseCases(allData), btn.dataset.filter);
        });
    });

    // Theme Toggle (Simplified)
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    });

    loadData();
});
