import express, { Request, Response } from 'express';
import puppeteer, { Browser } from 'puppeteer';
const app = express();
const PORT = process.env.PORT || 3000;

let browser: Browser | null = null;
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

async function scrapeMarketWatch(symbol: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 800 });

  const url = `https://www.marketwatch.com/investing/fund/${symbol}?countryCode=IT`;

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const data = await page.evaluate(() => {
    const getMeta = (name: string) =>
      document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || null;

    return {
      price: getMeta('price'),
      currency: getMeta('priceCurrency'),
      change: getMeta('priceChange'),
      exchangeCountry: getMeta('exchangeCountry')
    };
  });

  await page.close();

  if (!data.price) {
    throw new Error('Data not found or blocked');
  }

  return data;
}

app.get('/quote', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'SWDA';

  try {
    const data = await scrapeMarketWatch(symbol);
    res.json({ symbol, ...data });
  } catch (error: any) {
    console.error('Scraping failed:', error.message || error);
    res.status(500).json({ error: 'Failed to scrape MarketWatch' });
  }
});

// chiudi browser on exit
process.on('exit', async () => {
  if (browser) await browser.close();
});
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
