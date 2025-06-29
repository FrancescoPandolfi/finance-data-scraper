# Usa un'immagine base Node ufficiale, slim per meno peso
FROM node:18-slim

# Installa le dipendenze di sistema richieste da Playwright
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libpangocairo-1.0-0 libgtk-3-0 libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Imposta la cartella di lavoro
WORKDIR /app

# Copia solo i package.json e package-lock.json prima (per cache efficiente)
COPY package*.json ./

# Installa le dipendenze (incluse quelle di sviluppo)
RUN npm install

# Installa i browser di Playwright (essenziali)
RUN npx playwright install

# Copia tutto il codice nel container
COPY . .

# Compila il TypeScript
RUN npm run build

# Espone la porta usata da Express
EXPOSE 3000

# Comando per avviare il server
CMD ["node", "dist/index.js"]
