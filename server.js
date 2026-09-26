const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;

// Statik Dosyaları Sun (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// --- MOCK DATABASE (Veritabanı yerine şimdilik bu değişkeni kullanıyoruz) ---
const mockStocks = [
    { symbol: 'THYAO', name: 'Türk Hava Yolları', price: 274.50, change: 1.2, type: 'stock' },
    { symbol: 'ASELS', name: 'Aselsan', price: 42.10, change: -0.5, type: 'stock' },
    { symbol: 'GARAN', name: 'Garanti BBVA', price: 68.90, change: 2.1, type: 'stock' },
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 64200, change: 3.5, type: 'crypto' },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 3450, change: 1.8, type: 'crypto' }
];

// --- API ENDPOINTS ---

// 1. Tüm Hisseleri Getir
app.get('/api/market', (req, res) => {
    // Burada gerçek veritabanından veya Borsa API'sinden veri çekilecek
    res.json(mockStocks);
});

// 2. Tekil Hisse Detayı
app.get('/api/quote/:symbol', (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const stock = mockStocks.find(s => s.symbol === symbol);
    if (stock) {
        res.json(stock);
    } else {
        res.status(404).json({ error: 'Hisse bulunamadı' });
    }
});

// 3. Grafik Verisi (OHLCV)
app.get('/api/history/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    // Simüle edilmiş mum verisi döndür
    const history = generateMockHistory(symbol);
    res.json(history);
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`🚀 NOVEX Sunucusu Çalışıyor: http://localhost:${PORT}`);
    console.log(`📊 API Test: http://localhost:${PORT}/api/market`);
});

// --- YARDIMCI FONKSİYONLAR ---
function generateMockHistory(symbol) {
    const data = [];
    let price = 100;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 100; i > 0; i--) {
        const time = now - (i * 3600);
        const open = price;
        const close = price * (1 + (Math.random() - 0.5) * 0.02);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const vol = Math.floor(Math.random() * 10000);
        data.push({ time, open, high, low, close, volume: vol });
        price = close;
    }
    return data;
}
