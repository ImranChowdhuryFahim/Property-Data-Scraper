import express from 'express';
import scraperController from '../controller/scraper.controller';

const route = express.Router();

route.get('/scrape', scraperController.getFloridaScraper);
route.get('test', (req, res) => res.json("test done"));

export default route;