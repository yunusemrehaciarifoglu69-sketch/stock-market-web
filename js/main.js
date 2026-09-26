document.addEventListener('DOMContentLoaded', () => {
    try {
        // Classes are now global
        const dataService = new DataService();
        const uiManager = new UIManager(dataService);
        window.uiManager = uiManager; // Bot erişimi için global yapıyoruz
        uiManager.init();
        console.log('Borsa Takip Uygulaması Başlatıldı (Offline Mod)');
    } catch (error) {
        console.error(error);
        alert('Uygulama başlatılırken hata oluştu: ' + error.message);
    }
});
