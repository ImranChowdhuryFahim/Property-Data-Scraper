FROM ghcr.io/puppeteer/puppeteer:20.8.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Create app directory
WORKDIR /usr/scraper-service

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

CMD [ "yarn", "start"]