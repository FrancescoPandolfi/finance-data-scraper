import express, { Request, Response } from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/quote', async (req: Request, res: Response): Promise<any> => {
  const symbol = (req.query.symbol as string) || 'SWDA.MI';

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    const url = `https://www.marketwatch.com/investing/fund/${symbol}?countryCode=IT`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const data = await page.evaluate(() => {
      const getMeta = (name: string) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || null;

      return {
        price: getMeta('price'),
        currency: getMeta('priceCurrency'),
        change: getMeta('priceChange'),
        exchangeCountry: getMeta('exchangeCountry')
      };
    });

    await browser.close();

    if (!data.price) {
      return res.status(404).json({ error: 'Data not found or blocked' });
    }

    return res.json({
      symbol,
      ...data
    });

  } catch (error) {
    console.error('Scraping failed:', error);
    return res.status(500).json({ error: 'Failed to scrape MarketWatch' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
