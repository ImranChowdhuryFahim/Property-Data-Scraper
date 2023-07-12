import express from 'express';
import scraperController from '../controller/scraper.controller';

const route = express.Router();

route.get('/scrape', scraperController.scrape);
route.get('/test', (req, res) => res.json({ message: "test done" }));

export default route;