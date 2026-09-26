class DataService {
    constructor() {
        // "true" yaparsanız aşağıdaki fetch metodları çalışır (Backend kuruluysa)
        this.useBackend = false;
        this.apiBaseUrl = 'http://localhost:3000/api';

        // Mevcut Mock Veriler
        // Expanded Asset List (100+ items simulated)
        // For brevity we include a robust representative set
        this.assets = [
            // INDICES
            { symbol: 'BIST 100', name: 'Borsa İstanbul 100', price: 9120.50, type: 'index', change: 1.2 },
            { symbol: 'USD/TRY', name: 'Amerikan Doları', price: 34.25, type: 'currency', change: 0.15 },
            { symbol: 'EUR/TRY', name: 'Euro', price: 37.40, type: 'currency', change: -0.05 },
            { symbol: 'GAU/TRY', name: 'Gram Altın', price: 2475.00, type: 'currency', change: 0.8 },

            // STOCKS (BIST)
            { symbol: 'THYAO', name: 'Türk Hava Yolları', price: 288.00, type: 'stock', change: 2.1 },
            { symbol: 'GARAN', name: 'Garanti BBVA', price: 86.50, type: 'stock', change: -0.5 },
            { symbol: 'ASELS', name: 'Aselsan', price: 63.10, type: 'stock', change: 0.8 },
            { symbol: 'AKBNK', name: 'Akbank', price: 43.20, type: 'stock', change: 0.2 },
            { symbol: 'KCHOL', name: 'Koç Holding', price: 178.00, type: 'stock', change: 1.1 },
            { symbol: 'EREGL', name: 'Ereğli Demir Çelik', price: 49.50, type: 'stock', change: -0.3 },
            { symbol: 'ISCTR', name: 'İş Bankası (C)', price: 37.10, type: 'stock', change: 0.9 },
            { symbol: 'TUPRS', name: 'Tüpraş', price: 168.00, type: 'stock', change: 0.5 },
            { symbol: 'SASA', name: 'SASA Polyester', price: 41.80, type: 'stock', change: -1.2 },
            { symbol: 'HEKTS', name: 'Hektaş', price: 17.90, type: 'stock', change: -2.1 },
            { symbol: 'BIMAS', name: 'BİM Mağazalar', price: 390.00, type: 'stock', change: 1.5 },
            { symbol: 'FROTO', name: 'Ford Otosan', price: 1050.00, type: 'stock', change: 2.3 },
            { symbol: 'PGSUS', name: 'Pegasus', price: 865.00, type: 'stock', change: 1.8 },
            { symbol: 'TOASO', name: 'Tofaş Oto', price: 275.50, type: 'stock', change: -1.1 },
            { symbol: 'YKBNK', name: 'Yapı Kredi', price: 29.10, type: 'stock', change: 0.4 },
            { symbol: 'PETKM', name: 'Petkim', price: 21.80, type: 'stock', change: -0.6 },
            { symbol: 'SISE', name: 'Şişecam', price: 51.90, type: 'stock', change: -0.2 },
            { symbol: 'TTKOM', name: 'Türk Telekom', price: 33.50, type: 'stock', change: 1.6 },
            { symbol: 'TCELL', name: 'Turkcell', price: 68.20, type: 'stock', change: 1.1 },
            { symbol: 'ARCLK', name: 'Arçelik', price: 155.00, type: 'stock', change: 0.3 },

            // CRYPTO
            { symbol: 'BTC/USD', name: 'Bitcoin', price: 66500.00, type: 'crypto', change: 2.5 },
            { symbol: 'ETH/USD', name: 'Ethereum', price: 3550.00, type: 'crypto', change: 1.8 },
            { symbol: 'SOL/USD', name: 'Solana', price: 148.00, type: 'crypto', change: 4.2 },
            { symbol: 'AVAX/USD', name: 'Avalanche', price: 36.50, type: 'crypto', change: 2.1 },
            { symbol: 'XRP/USD', name: 'Ripple', price: 0.61, type: 'crypto', change: -0.8 },
            { symbol: 'BNB/USD', name: 'Binance Coin', price: 595.00, type: 'crypto', change: 1.1 },
            { symbol: 'DOGE/USD', name: 'Dogecoin', price: 0.13, type: 'crypto', change: 5.5 },

            // COMMODITY
            { symbol: 'XAU/USD', name: 'Ons Altın', price: 2380.00, type: 'commodity', change: 1.2 },
            { symbol: 'XAG/USD', name: 'Ons Gümüş', price: 29.10, type: 'commodity', change: 2.1 },
            { symbol: 'BRENT', name: 'Brent Petrol', price: 86.20, type: 'commodity', change: 0.5 },
            { symbol: 'WTI', name: 'Ham Petrol', price: 82.50, type: 'commodity', change: 0.4 },
            { symbol: 'COPPER', name: 'Bakır', price: 4.60, type: 'commodity', change: 1.5 },

            // FUNDS
            { symbol: 'TTE', name: 'İş Portföy Teknoloji', price: 4.6200, type: 'fund', change: 2.2 },
            { symbol: 'AFT', name: 'Ak Portföy Yeni Tek.', price: 0.8650, type: 'fund', change: 1.9 },
            { symbol: 'GBC', name: 'Garanti Altın Fonu', price: 0.4250, type: 'fund', change: 1.1 },
            { symbol: 'MAC', name: 'Marmara Cap. Hisse', price: 2.1400, type: 'fund', change: -0.8 }
        ];

        this.historyCache = {};

        // Start simulation immediately
        setInterval(() => this.simulateMarket(), 1000);
    }

    getStocks() {
        return this.assets;
    }

    getStock(symbol) {
        return this.assets.find(s => s.symbol === symbol);
    }

    getHistory(symbol, timeframe = '1H') {
        const cacheKey = `${symbol}-${timeframe}`;
        if (this.historyCache[cacheKey]) {
            return this.historyCache[cacheKey];
        }

        const stock = this.getStock(symbol) || { price: 100 };
        const data = [];
        const now = Math.floor(Date.now() / 1000);

        let count = 200; // More history
        let interval = 3600; // 1h

        if (timeframe === '1G') interval = 86400; // Day
        if (timeframe === '1A') interval = 86400 * 30; // Month
        if (timeframe === '1Y') interval = 86400 * 365; // Year

        // Simulation start price
        let currentPrice = stock.price * 0.7; // Start low to trend up

        for (let i = count; i > 0; i--) {
            const time = Math.floor(now - (i * interval));
            const move = (Math.random() - 0.45) * (currentPrice * 0.03); // Slight upward bias
            const open = currentPrice;
            const close = open + move;

            // High/Low logic
            const high = Math.max(open, close) + Math.random() * Math.abs(move);
            const low = Math.min(open, close) - Math.random() * Math.abs(move);

            data.push({
                time: time, // Unix timestamp for lightweight charts
                open: parseFloat(open.toFixed(4)),
                high: parseFloat(high.toFixed(4)),
                low: parseFloat(low.toFixed(4)),
                close: parseFloat(close.toFixed(4)),
            });

            currentPrice = close;
        }

        // Force last candle close to match current price to look consistent
        const lastCandle = data[data.length - 1];
        lastCandle.close = stock.price;
        // Adjust high/low if current price is out of bounds
        if (stock.price > lastCandle.high) lastCandle.high = stock.price;
        if (stock.price < lastCandle.low) lastCandle.low = stock.price;

        this.historyCache[cacheKey] = data;
        return data;
    }

    simulateMarket() {
        this.assets.forEach(asset => {
            // Live price update
            const volatility = asset.price * 0.0005; // 0.05% fluctuation
            const move = (Math.random() - 0.5) * volatility;

            asset.price += move;
            // Recalculate change slightly for effect
            asset.change += (move / asset.price) * 50;

            // Update Cache
            this.updateHistoryCache(asset.symbol, asset.price);
        });

        // Dispatch Update Event
        window.dispatchEvent(new Event('market-update'));
    }

    updateHistoryCache(symbol, newPrice) {
        // ... cache logic unchanged ...
        Object.keys(this.historyCache).forEach(key => {
            if (key.startsWith(symbol)) {
                const data = this.historyCache[key];
                if (data && data.length > 0) {
                    const lastCandle = data[data.length - 1];
                    lastCandle.close = parseFloat(newPrice.toFixed(4));
                    if (newPrice > lastCandle.high) lastCandle.high = parseFloat(newPrice.toFixed(4));
                    if (newPrice < lastCandle.low) lastCandle.low = parseFloat(newPrice.toFixed(4));
                }
            }
        });
    }

    getNews() {
        return [
            {
                id: 1,
                title: "Borsa İstanbul'da Rekor Seviye: BIST 100 10.000 Puanı Zorluyor",
                summary: "Piyasalarda olumlu hava eserken, bankacılık endeksi öncülüğünde BIST 100 endeksi tarihi zirvelerini test ediyor. Yatırımcılar merkez bankası kararını bekliyor.",
                source: "Finans Gündem",
                time: "10 dk önce",
                image: "chart-line"
            },
            {
                id: 2,
                title: "Fed Faiz Kararı Açıklandı: Piyasalar Nasıl Tepki Verdi?",
                summary: "ABD Merkez Bankası (Fed) faizleri sabit tutma kararı aldı. Karar sonrası dolar endeksinde gevşeme görülürken, altın ve kripto paralarda hareketlilik başladı.",
                source: "Global Markets",
                time: "32 dk önce",
                image: "building-columns"
            },
            {
                id: 3,
                title: "Kripto Paralarda Boğa Sezonu mu Başlıyor?",
                summary: "Bitcoin'in 65.000 doları aşmasıyla birlikte altcoinlerde ciddi yükselişler gözlemleniyor. Analistler, ETF onaylarının ardından kurumsal ilginin arttığını belirtiyor.",
                source: "Kripto Bülteni",
                time: "1 saat önce",
                image: "bitcoin-sign"
            },
            {
                id: 4,
                title: "Teknoloji Devinden Yapay Zeka Hamlesi",
                summary: "NVidia ve Microsoft rekabeti kızışıyor. Yeni duyurulan yapay zeka çipleri teknoloji hisselerine ralli yaptırdı.",
                source: "Tech News",
                time: "2 saat önce",
                image: "microchip"
            },
            {
                id: 5,
                title: "Altın Fiyatlarında Son Durum: Gram Altın Ne Kadar?",
                summary: "Ons altındaki yükseliş ve dolar kurundaki hareketlilik gram altını yeni rekorlara taşıdı. Uzmanlar yıl sonu hedeflerini güncelledi.",
                source: "Emtia Analiz",
                time: "3 saat önce",
                image: "coins"
            }
        ];
    }
}
