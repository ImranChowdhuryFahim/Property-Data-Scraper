import express from 'express';
import scraperController from '../controller/scraper.controller';

const route = express.Router();

route.get('/scrape',scraperController.getFloridaScraper);

export default route;