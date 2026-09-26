class UIManager {
    constructor(dataService) {
        this.dataService = dataService;
        this.chartManager = new ChartManager();
        this.currentCategory = 'stock';
    }

    init() {
        this.renderTicker();
        this.renderMarketOverview();
        this.renderStockTable();
        // Safe init call for chart
        this.initMainChart();
        this.updateWatchlistUI();
        this.setupTimeframeListeners();

        window.addEventListener('market-update', () => this.updateMarketData());

        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-tab');
                this.switchCategory(category);
            });
        });

        this.setupSidebar();
    }

    setupSidebar() {
        // ... same as before
        const navDashboard = document.getElementById('nav-dashboard');
        const navMarket = document.getElementById('nav-market');
        const navWatchlist = document.getElementById('nav-watchlist');

        this.setupSettings(); // Init settings events

        if (navDashboard) {
            navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('dashboard-view');
                this.setActiveNav('nav-dashboard');
            });
        }
        if (navMarket) {
            navMarket.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('dashboard-view');
                this.setActiveNav('nav-market');
                // Wait for view switch then scroll
                setTimeout(() => {
                    document.querySelector('.stock-list-section')?.scrollIntoView({ behavior: 'smooth' });
                    this.switchCategory('stock');
                }, 50);
            });
        }
        if (navWatchlist) {
            navWatchlist.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('watchlist-view');
                this.setActiveNav('nav-watchlist');
                this.renderWatchlistView();
            });
        }

        // Settings Nav
        const navSettings = document.getElementById('nav-settings');
        if (navSettings) {
            navSettings.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('settings-view');
                this.setActiveNav('nav-settings');
            });
        }

        // News Nav
        const navNews = document.getElementById('nav-news');
        if (navNews) {
            navNews.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('news-view');
                this.setActiveNav('nav-news');
                this.renderNews();
            });
        }
    }

    // Generic View Switcher
    switchView(viewId) {
        const views = ['dashboard-view', 'settings-view', 'news-view', 'watchlist-view'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === viewId) ? 'block' : 'none';
        });

        // Scroll top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Helper to init settings events (Call this in init)
    setupSettings() {
        // Theme Definitions (Complete Palettes)
        const themes = {
            '#6366f1': { // Indigo (Default)
                '--bg-dark': '#020617',
                '--bg-card': '#0f172a',
                '--bg-hover': '#1e293b',
                '--border': '#1e293b',
                '--accent': '#6366f1',
                '--text-primary': '#f8fafc'
            },
            '#3b82f6': { // Ocean Blue
                '--bg-dark': '#020410', // Deep Navy
                '--bg-card': '#0B1121',
                '--bg-hover': '#16203D',
                '--border': '#16203D',
                '--accent': '#3b82f6',
                '--text-primary': '#eff6ff'
            },
            '#10b981': { // Matrix Green
                '--bg-dark': '#000802', // Deep Jungle
                '--bg-card': '#021205',
                '--bg-hover': '#052e12',
                '--border': '#052e12',
                '--accent': '#10b981',
                '--text-primary': '#ecfdf5'
            },
            '#f59e0b': { // Amber Gold
                '--bg-dark': '#0f0a00', // Deep Brown/Black
                '--bg-card': '#1a1100',
                '--bg-hover': '#382500',
                '--border': '#382500',
                '--accent': '#f59e0b',
                '--text-primary': '#fffbeb'
            },
            '#ffffff': { // Light Mode (Aydınlık)
                '--bg-dark': '#f8fafc', // Slate 50 (Sayfa Arka Planı)
                '--bg-card': '#ffffff', // Beyaz (Kartlar)
                '--bg-hover': '#f1f5f9', // Slate 100
                '--border': '#cbd5e1', // Slate 300
                '--accent': '#4f46e5', // Indigo 600 (Koyu İndigo - Kontrast için)
                '--text-primary': '#0f172a', // Slate 900 (Koyu Metin)
                '--text-secondary': '#64748b' // Slate 500 (Gri Metin)
            },
            '#ec4899': { // Cyber Pink
                '--bg-dark': '#0f020a', // Deep Violet
                '--bg-card': '#1a0410',
                '--bg-hover': '#3d0a25',
                '--border': '#3d0a25',
                '--accent': '#ec4899',
                '--text-primary': '#fdf2f8'
            }
        };

        // Color Picker
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                const theme = themes[color];

                if (theme) {
                    // Apply all properties of the theme
                    Object.keys(theme).forEach(key => {
                        document.documentElement.style.setProperty(key, theme[key]);
                    });

                    // Update Chart Background if chart exists (to match new bg)
                    const container = document.querySelector('.chart-container');
                    if (container) container.style.backgroundColor = theme['--bg-dark']; // Or almost black
                }

                // Handle active state
                colorBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    setActiveNav(id) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
    }

    initMainChart() {
        const data = this.dataService.getHistory('BIST 100', '1H');
        this.chartManager.initMainChart('mainChartContainer', data, 'BIST 100');
    }

    updateMainChart(symbol) {
        // Ensure chartManager has fresh data
        const activeBtn = document.querySelector('.filter-btn.active');
        const timeframe = activeBtn ? activeBtn.textContent : '1H';

        const stock = this.dataService.getStock(symbol);
        const data = this.dataService.getHistory(symbol, timeframe);

        if (stock) {
            // Update Title logic...
            const titleEl = document.querySelector('.main-chart-section h2');
            if (titleEl) {
                const isPos = stock.change >= 0;
                const color = isPos ? '#10b981' : '#ef4444';
                titleEl.innerHTML = `${symbol} - ${stock.name} <span style="font-size:0.8em; margin-left:15px; color:${color}">${stock.price.toFixed(2)} %${Math.abs(stock.change).toFixed(2)}</span>`;
            }
        }

        this.chartManager.initMainChart('mainChartContainer', data, symbol);
    }

    setupTimeframeListeners() {
        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const symbol = this.chartManager.currentSymbol || 'BIST 100';
                this.updateMainChart(symbol);
            });
        });

        // Indicator Buttons
        const indBtns = document.querySelectorAll('.indicator-btn');
        indBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ind = e.target.getAttribute('data-ind');
                e.target.classList.toggle('active');
                this.chartManager.toggleIndicator(ind);
            });
        });
    }

    updateMarketData() {
        this.renderTicker();
        this.renderMarketOverview();

        // Live Candle Update
        // Only if no alert is open (impossible to detect, but we proceed)
        try {
            const symbol = this.chartManager.currentSymbol;
            if (symbol) {
                const activeBtn = document.querySelector('.filter-btn.active');
                const timeframe = activeBtn ? activeBtn.textContent : '1H';
                const history = this.dataService.getHistory(symbol, timeframe);
                const lastCandle = history[history.length - 1];
                this.chartManager.updateLastCandle(lastCandle);
            }
        } catch (e) { } // Suppress update errors

        // Table UI updates...
        // ... (keeping previous logic)
    }

    // ... (rest of methods renderTicker, renderMarketOverview, etc) ...
    // Re-implementing compact versions to ensure file integrity

    renderTicker() {
        const el = document.getElementById('ticker-content');
        if (!el) return;
        const stocks = this.dataService.getStocks();
        const items = [...stocks, ...stocks];
        el.innerHTML = items.map(s => `
            <div class="ticker-item">
                <span class="symbol">${s.symbol}</span>
                <span class="price">${s.price.toFixed(2)}</span>
                <span class="change ${s.change >= 0 ? 'text-success' : 'text-danger'}">
                %${Math.abs(s.change).toFixed(2)}</span>
            </div>`).join('');
    }

    renderMarketOverview() {
        const el = document.querySelector('.market-overview');
        if (!el) return;
        const indices = this.dataService.getStocks().slice(0, 4);
        el.innerHTML = indices.map(item => `
            <div class="card">
                <h3>${item.name}</h3>
                <div class="card-price">${item.price.toFixed(2)}</div>
                <div class="card-change ${item.change >= 0 ? 'text-success' : 'text-danger'}">%${Math.abs(item.change).toFixed(2)}</div>
            </div>`).join('');
    }

    switchCategory(cat) {
        this.currentCategory = cat;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${cat}"]`)?.classList.add('active');
        this.renderStockTable();
    }

    handleSearch(query) {
        const term = query.toLowerCase().trim();

        // 1. Get all stocks
        const allStocks = this.dataService.getStocks();

        // 2. Filter
        if (!term) {
            // Reset to current category if empty
            this.renderStockTable();
            return;
        }

        const filtered = allStocks.filter(s =>
            s.symbol.toLowerCase().includes(term) ||
            s.name.toLowerCase().includes(term)
        );

        // 3. Update Table with filtered results (force "Search Results" mode)
        this.renderRows(filtered);

        // 4. Auto-Focus Chart on top result
        if (filtered.length > 0) {
            const topMatch = filtered[0];
            // Debounce chart update slightly to avoid flickering while typing fast
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.updateMainChart(topMatch.symbol);
            }, 300);
        }
    }

    renderStockTable() {
        // Normal category render
        const stocks = this.dataService.getStocks().filter(s => s.type === this.currentCategory);
        this.renderRows(stocks);
    }

    renderNews() {
        const grid = document.getElementById('news-grid');
        if (!grid) return;

        const news = this.dataService.getNews();
        grid.innerHTML = news.map(item => `
            <div class="news-card">
                <div class="news-image">
                    <i class="fa-solid fa-${item.image}"></i>
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span>${item.source}</span>
                        <span>${item.time}</span>
                    </div>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-summary">${item.summary}</p>
                    <a href="#" class="read-more">Devamını Oku <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>
        `).join('');
    }

    updateWatchlistUI() {
        // Just update count or small badge if needed
        // For now, if we are currently VIEWING watchlist, re-render it
        const watchlistView = document.getElementById('watchlist-view');
        if (watchlistView && watchlistView.style.display !== 'none') {
            this.renderWatchlistView();
        }
    }

    showWatchlistOnly() {
        this.switchView('watchlist-view');
        this.renderWatchlistView();
    }

    renderWatchlistView() {
        const tbody = document.getElementById('watchlist-table-body');
        const emptyState = document.getElementById('watchlist-empty');
        if (!tbody) return;

        tbody.innerHTML = '';
        const watchlistIds = JSON.parse(localStorage.getItem('watchlist') || '[]');

        if (watchlistIds.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        const allStocks = this.dataService.getStocks();
        const watchlistStocks = allStocks.filter(s => watchlistIds.includes(s.symbol));

        watchlistStocks.forEach(s => {
            const tr = document.createElement('tr');

            const isPos = s.change >= 0;
            const c = isPos ? 'text-success' : 'text-danger';
            const vol = (Math.random() * 50 + 10).toFixed(1) + 'M';

            tr.innerHTML = `
                <td style="text-align: left; padding-left: 1rem;">
                    <div class="company-info">
                        <span class="company-symbol" style="font-weight:bold; display:block;">${s.symbol}</span>
                        <span class="company-name" style="font-size:0.85em; color:var(--text-secondary);">${s.name}</span>
                    </div>
                </td>
                <td style="text-align: right; font-family: monospace; font-size: 1.1em;">${s.price.toFixed(2)}</td>
                <td class="${c}" style="text-align: right; font-weight: 500;">%${Math.abs(s.change).toFixed(2)}</td>
                <td style="text-align: right; color: var(--text-secondary);">${vol}</td>
                <td style="padding:0; vertical-align: middle;">
                    <div style="width:120px; height:50px; margin: 0 auto;">
                        <canvas class="mini-chart" width="120" height="50" style="width:100%; height:100%; display:block;"></canvas>
                    </div>
                </td>
                <td style="text-align:center; vertical-align: middle;">
                    <button class="remove-btn" style="background:transparent; border:none; color:var(--danger); cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            // Remove Button Logic
            tr.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                let list = JSON.parse(localStorage.getItem('watchlist') || '[]');
                list = list.filter(i => i !== s.symbol);
                localStorage.setItem('watchlist', JSON.stringify(list));
                this.renderWatchlistView(); // Refresh list
            });

            // Click to chart (Switch to dashboard)
            tr.addEventListener('click', (e) => {
                if (e.target.closest('.remove-btn')) return;
                this.switchView('dashboard-view');
                this.setActiveNav('nav-dashboard');
                // Small delay to ensure view is visible
                setTimeout(() => this.updateMainChart(s.symbol), 50);
            });

            tbody.appendChild(tr);

            // Draw Sparkline
            const canvas = tr.querySelector('.mini-chart');
            if (canvas) {
                const history = this.dataService.getHistory(s.symbol, '1H');
                const recentHistory = history.slice(-50);
                this.chartManager.createSparkline(canvas.getContext('2d'), recentHistory, isPos);
            }
        });
    }

    renderRows(stocks) {
        const tbody = document.getElementById('stock-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

        stocks.forEach(s => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-symbol', s.symbol);

            const isPos = s.change >= 0;
            const c = isPos ? 'text-success' : 'text-danger';
            const isStarred = watchlist.includes(s.symbol);
            const starClass = isStarred ? 'fa-solid' : 'fa-regular';
            const starColor = isStarred ? '#f59e0b' : 'var(--text-secondary)';

            // Random volume simulation
            const vol = (Math.random() * 50 + 10).toFixed(1) + 'M';

            tr.innerHTML = `
                <td style="text-align: left; padding-left: 1rem;">
                    <div class="company-info">
                        <span class="company-symbol" style="font-weight:bold; display:block;">${s.symbol}</span>
                        <span class="company-name" style="font-size:0.85em; color:var(--text-secondary);">${s.name}</span>
                    </div>
                </td>
                <td style="text-align: right; font-family: monospace; font-size: 1.1em;">${s.price.toFixed(2)}</td>
                <td class="${c}" style="text-align: right; font-weight: 500;">%${Math.abs(s.change).toFixed(2)}</td>
                <td style="text-align: right; color: var(--text-secondary);">${vol}</td>
                <td style="padding:0; vertical-align: middle;">
                    <div style="width:120px; height:50px; margin: 0 auto;">
                        <canvas class="mini-chart" width="120" height="50" style="width:100%; height:100%; display:block;"></canvas>
                    </div>
                </td>
                <td style="text-align:center; vertical-align: middle;">
                    <i class="${starClass} fa-star star-btn" style="color:${starColor}; cursor:pointer; font-size: 1.2em; transition: transform 0.2s;"></i>
                </td>
            `;

            // Row click for chart
            tr.addEventListener('click', (e) => {
                if (e.target.classList.contains('star-btn')) return; // handled below
                this.updateMainChart(s.symbol);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Star click
            const starBtn = tr.querySelector('.star-btn');
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle logic (simple inline for now or call method)
                let list = JSON.parse(localStorage.getItem('watchlist') || '[]');
                if (list.includes(s.symbol)) list = list.filter(i => i !== s.symbol);
                else list.push(s.symbol);
                localStorage.setItem('watchlist', JSON.stringify(list));
                this.renderStockTable(); // Re-render to update stars
                this.updateWatchlistUI();
            });

            tbody.appendChild(tr);

            // Draw Sparkline
            const canvas = tr.querySelector('.mini-chart');
            if (canvas) {
                // Get small history for sparkline
                const history = this.dataService.getHistory(s.symbol, '1H'); // Last 1H data
                // Limit points for performance
                const recentHistory = history.slice(-50);
                this.chartManager.createSparkline(canvas.getContext('2d'), recentHistory, isPos);
            }
        });
    }
}
