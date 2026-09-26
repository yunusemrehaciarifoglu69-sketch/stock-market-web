/**
 * NOVEX Helper Bot Logic (v3 - Advanced)
 * Site Kontrolü, Portföy Takibi ve Bağlam Yönetimi
 */

class NovexBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];

        // Bağlam (Context) Yönetimi: Son konuşulan konu/hisse
        this.context = {
            lastSymbol: null,
            state: 'idle'
        };

        // Mock Portföy Verisi
        this.userPortfolio = {
            cash: 25400.50,
            assets: [
                { symbol: 'THYAO', amount: 100, avgCost: 240.00 },
                { symbol: 'GARAN', amount: 500, avgCost: 55.40 },
                { symbol: 'BTCUSDT', amount: 0.05, avgCost: 58000 }
            ]
        };

        this.init();
    }

    init() {
        this.injectHTML();
        this.cacheDOM();
        this.bindEvents();
        this.addMessage('bot', 'Merhaba! Ben NOVEX Asistan v3. Siteyi yönetebilir, portföyünüzü sorabilir veya analiz isteyebilirsiniz. 👋');
    }

    injectHTML() {
        const html = `
            <div class="bot-widget">
                <div class="bot-chat-window" id="botWindow">
                    <div class="bot-header">
                        <div class="bot-avatar">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="bot-info">
                            <h3>NOVEX Asistan</h3>
                            <span>Çevrimiçi (v3)</span>
                        </div>
                    </div>
                    
                    <div class="bot-messages" id="botMessages">
                        <!-- Mesajlar buraya gelecek -->
                    </div>

                    <div class="bot-suggestions">
                        <span class="chip" onclick="bot.handleQuickReply('Portföyüm')">💼 Portföy</span>
                        <span class="chip" onclick="bot.handleQuickReply('Grafiği Aç')">📈 Grafik</span>
                        <span class="chip" onclick="bot.handleQuickReply('Bakiye')">💰 Bakiye</span>
                    </div>

                    <div class="bot-input-area">
                        <input type="text" id="botInput" placeholder="Bir komut yazın..." autocomplete="off">
                        <button class="bot-send-btn" id="botSendBtn"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>

                <button class="bot-toggle-btn" id="botToggleBtn">
                    <i class="fa-solid fa-robot"></i>
                    <span>Asistan</span>
                </button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    cacheDOM() {
        this.window = document.getElementById('botWindow');
        this.toggleBtn = document.getElementById('botToggleBtn');
        this.input = document.getElementById('botInput');
        this.sendBtn = document.getElementById('botSendBtn');
        this.messagesContainer = document.getElementById('botMessages');
        this.toggleIcon = this.toggleBtn.querySelector('i');
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.window.style.display = 'flex';
            this.toggleBtn.classList.add('open');
            this.toggleIcon.classList.remove('fa-message');
            this.toggleIcon.classList.add('fa-xmark');
            this.scrollToBottom();
            this.input.focus();
        } else {
            this.window.style.display = 'none';
            this.toggleBtn.classList.remove('open');
            this.toggleIcon.classList.remove('fa-xmark');
            this.toggleIcon.classList.add('fa-message');
        }
    }

    addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML = `${text}<span class="message-time">${time}</span>`;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    handleQuickReply(text) {
        this.input.value = text;
        this.sendMessage();
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        this.input.value = '';

        // Bot düşünme simülasyonu
        setTimeout(() => this.processCommand(text), 600);
    }

    // --- GELİŞMİŞ NLP VE KOMUT İŞLEME ---
    async processCommand(text) {
        const lowText = text.toLowerCase();
        let response = '';

        // 1. Hisse/Sembol Tespiti (Bağlam Güncelleme)
        const symbol = this.extractSymbol(text);
        if (symbol) {
            this.context.lastSymbol = symbol;
        }

        // --- SOHBET VE KİŞİLİK (SMALL TALK) ---
        const chatResponse = this.handleSmallTalk(lowText);
        if (chatResponse) {
            response = chatResponse;
        }

        // --- SİTE KONTROLÜ (UI ACTIONS) ---
        else if (lowText.includes('ayarlar') && lowText.includes('aç')) {
            this.triggerAction('openSettings');
            response = 'Ayarlar menüsünü açtım. Renk temasını buradan değiştirebilirsiniz.';
        }
        else if (lowText.includes('haberler') || lowText.includes('gündem')) {
            this.triggerAction('openNews');
            response = 'Piyasa haberlerini görüntülüyorsunuz. Gündem yoğun!';
        }
        else if (lowText.includes('izleme') || lowText.includes('liste')) {
            this.triggerAction('openWatchlist');
            response = 'İzleme listesine geçiş yapıldı. Favori hisseleriniz burada.';
        }
        else if (lowText.includes('grafik') || (lowText.includes('aç') && symbol)) {
            // "THYAO aç" veya "Grafiği aç" (Context varsa)
            const target = symbol || this.context.lastSymbol;
            if (target) {
                this.triggerAction('openChart', target);
                response = `<b>${target}</b> grafiği ana ekrana yüklendi.`;
            } else {
                response = 'Hangi hissenin grafiğini açmamı istersiniz? Örn: "THYAO aç"';
            }
        }

        // --- PORTFÖY SORGULARI ---
        else if (lowText.includes('portföy') || lowText.includes('varlıklarım')) {
            response = this.getPortfolioSummary();
        }
        else if (lowText.includes('bakiye') || lowText.includes('param')) {
            response = `Güncel nakit bakiyeniz: <b>${this.formatCurrency(this.userPortfolio.cash)} ₺</b>. Alım fırsatlarını değerlendirebilirsiniz.`;
        }

        // --- ANALİZ VE FİYAT ---
        else if (lowText.includes('fiyat')) {
            const target = symbol || this.context.lastSymbol;
            if (target) {
                response = await this.fetchPrice(target);
            } else {
                response = 'Hangi hissenin fiyatı?';
            }
        }
        else if (lowText.includes('sinyal') || lowText.includes('analiz')) {
            const target = symbol || this.context.lastSymbol;
            if (target) {
                response = this.generateSignal(target);
            } else {
                response = 'Analiz için bir hisse belirtmelisiniz.';
            }
        }

        // --- YARDIM ---
        else if (lowText.includes('yardım')) {
            response = `
                <b>Neler Yapabilirim?</b><br>
                - <b>"THYAO aç"</b>: Grafiği değiştirir.<br>
                - <b>"Portföyüm"</b>: Varlıklarınızı listeler.<br>
                - <b>"Sinyal"</b>: Son baktığınız hisse için analiz yapar.<br>
                - <b>"Borsa ne olur?"</b>: Piyasa yorumu alabilirsiniz.<br>
            `;
        }

        else {
            response = 'Bunu tam anlayamadım. "Yardım" yazarak komutları görebilirsiniz.';
        }

        this.addMessage('bot', response);
    }

    // --- GELİŞMİŞ SOHBET MODÜLÜ ---
    handleSmallTalk(text) {
        // Kimlik
        if (text.includes('kimsin') || text.includes('nasilsin') || text.includes('nasılsın') || text.includes('naber')) {
            const answers = [
                'Ben NOVEX, sizin kişisel borsa asistanınızım. 7/24 piyasaları izliyorum! 😎',
                'Harikayım! Piyasalar hareketli, ben hazırım. Siz nasılsınız?',
                'Kodlarım tıkır tıkır çalışıyor. Portföyünüzü katlamaya geldim! 🚀'
            ];
            return answers[Math.floor(Math.random() * answers.length)];
        }

        if (text.includes('merhaba') || text.includes('selam')) {
            return 'Merhabalar! Bugün bol kazançlı bir gün olsun. Size nasıl yardım edebilirim?';
        }

        if (text.includes('teşekkür') || text.includes('sağol') || text.includes('adamsın')) {
            return 'Rica ederim! Her zaman buradayım. Bol kazançlar. 💰';
        }

        // Borsa ve Yatırım
        if (text.includes('borsa') || text.includes('yatırım') || text.includes('tavsiye') || text.includes('ne olur') || text.includes('düşer') || text.includes('çıkar')) {
            const comments = [
                'Piyasa şu an dalgalı görünüyor. "Düşüşler alım fırsatıdır" derler ama stop-loss koymayı unutmayın! (YTD) 😉',
                'Trend yukarı yönlü gibi ama temkinli olmakta fayda var. Nakitte kalmak da bir pozisyondur.',
                'Korku ve açgözlülük endeksine dikkat edin. Herkes satarken alan kazanır! 🦁',
                'Ben bir botum ama grafikler "Yükseliş" diye bağırıyor sanki... Tabi son karar sizin.',
                'Uzun vadeli düşünüyorsanız günlük dalgalanmalara takılmayın. Temettü candır! 💧'
            ];
            return comments[Math.floor(Math.random() * comments.length)];
        }

        // Şaka ve Eğlence
        if (text.includes('şaka') || text.includes('güldür') || text.includes('fıkra') || text.includes('söz')) {
            const jokes = [
                'Borsacıya sormuşlar "Neden uyumuyorsun?" diye. "Gözümü kapatırsam piyasa düşer diye korkuyorum" demiş. 😂',
                'İki hisse senedi konuşuyormuş. Biri diğerine: "Abi sen niye bu kadar düştün?" Diğeri cevap vermiş: "Beni alan herkes sattı, sahipsiz kaldım!"',
                'En iyi yatırım tavsiyesi: "Eşinin haberi olmadan kripto alma!" 🤫',
                'Borsa sabırsızların sabırlılara para aktardığı bir mekanizmadır. - Warren Buffett (Bu ciddiliydi ama olsun)',
                'Hisse senedi gibisin, seni alan pişman satan pişman... Şaka şaka, değerlisin! 💎'
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        return null; // Small talk değilse normal komutlara devam et
    }

    // --- AKSİYONLAR ---
    triggerAction(action, payload) {
        if (!window.uiManager) {
            console.error('UIManager bulunamadı!');
            return;
        }

        switch (action) {
            case 'openSettings':
                // Settings view yoksa implemente edilmeli, şimdilik varsayım
                const settingsBtn = document.getElementById('nav-settings');
                if (settingsBtn) settingsBtn.click();
                break;
            case 'openNews':
                const newsBtn = document.getElementById('nav-news');
                if (newsBtn) newsBtn.click();
                break;
            case 'openWatchlist':
                const wlBtn = document.getElementById('nav-watchlist');
                if (wlBtn) wlBtn.click();
                break;
            case 'openChart':
                // Main chart update
                window.uiManager.updateMainChart(payload);
                // Dashboard'a dön
                const dashBtn = document.getElementById('nav-dashboard');
                if (dashBtn) dashBtn.click();
                break;
        }
    }

    // --- YARDIMCILAR ---
    getPortfolioSummary() {
        let html = '<b>💼 Portföyünüz:</b><br><ul style="margin:5px 0 5px 15px; padding:0;">';
        let totalVal = this.userPortfolio.cash;

        this.userPortfolio.assets.forEach(asset => {
            // Mock anlık fiyat (maliyetin %5 altı veya üstü)
            const currentPrice = asset.avgCost * (1 + (Math.random() * 0.1 - 0.05));
            const val = currentPrice * asset.amount;
            totalVal += val;

            html += `<li><b>${asset.symbol}</b>: ${asset.amount} adet (₺${Math.floor(val)})</li>`;
        });

        html += `</ul>Nakdie: <b>${this.formatCurrency(this.userPortfolio.cash)} ₺</b><br>`;
        html += `Toplam Değer: <b>${this.formatCurrency(totalVal)} ₺</b>`;
        return html;
    }

    extractSymbol(text) {
        const words = text.split(' ');
        const keywords = ['fiyat', 'sinyal', 'analiz', 'grafik', 'aç'];
        for (let i = 0; i < words.length; i++) {
            // Özel durum: "THYAO aç"
            if (words[i] === words[i].toUpperCase() && words[i].length >= 3 && !keywords.includes(words[i].toLowerCase())) {
                return words[i];
            }
        }
        return null; // Basit tutuyoruz
    }

    formatCurrency(val) {
        return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    async fetchPrice(symbol) {
        // Mock Response
        const mockPrice = (Math.random() * 500 + 10).toFixed(2);
        const mockChange = (Math.random() * 10 - 5).toFixed(2);
        const color = mockChange >= 0 ? '#10b981' : '#ef4444';
        return `<b>${symbol}</b>: ${mockPrice} ₺ <span style="color:${color}">(%${mockChange})</span>`;
    }

    generateSignal(symbol) {
        const signals = ['GÜÇLÜ AL', 'AL', 'TUT', 'SAT'];
        const signal = signals[Math.floor(Math.random() * signals.length)];
        return `<b>${symbol}</b> Teknik Analiz: <b>${signal}</b> (Güven: %${Math.floor(Math.random() * 40 + 60)})`;
    }
}

const bot = new NovexBot();
