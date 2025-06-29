"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get('/quote', async (req, res) => {
    const symbol = req.query.symbol || 'SWDA';
    try {
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // 👉 Imposta uno user-agent realistico per evitare blocchi
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        const url = `https://www.marketwatch.com/investing/fund/${symbol}?countryCode=IT`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // 👉 Salva l'intero HTML per debug (opzionale)
        const html = await page.content();
        console.log(html); // ← utile per capire se è stato bloccato o se c'è un CAPTCHA
        const data = await page.evaluate(() => {
            const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || null;
            return {
                price: getMeta('price'),
                currency: getMeta('priceCurrency'),
                change: getMeta('priceChange'),
                exchangeCountry: getMeta('exchangeCountry')
            };
        });
        await browser.close();
        if (!data.price) {
            return void res.status(404).json({ error: 'Data not found or blocked' });
        }
        return void res.json({
            symbol,
            ...data
        });
    }
    catch (error) {
        console.error('Scraping failed:', error);
        return res.status(500).json({ error: 'Failed to scrape MarketWatch' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
