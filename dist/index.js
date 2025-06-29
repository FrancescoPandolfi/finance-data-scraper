"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const playwright_1 = require("playwright");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get('/quote', async (req, res) => {
    const isin = req.query.symbol || 'IE00B0M62Q58';
    try {
        const browser = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        const url = `https://www.borsaitaliana.it/borsa/etf/scheda/${isin}.html?lang=it`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        console.log(html); // 👈 utile per capire cosa ha caricato davvero la pagina
        const value = await page.evaluate(() => {
            const el = document.querySelector('span.t-text.-black-warm-60.-formatPrice > strong');
            return el?.textContent || null;
        });
        console.log('Price:', value);
        console.log(value);
        await browser.close();
        if (!value) {
            return res.status(404).json({ error: 'Data not found or blocked' });
        }
        return res.json({
            isin,
            value
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
