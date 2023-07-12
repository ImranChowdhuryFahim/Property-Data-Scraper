import { NextFunction, Request, Response } from "express";
import { scraper } from "../scraper";
import scraperService from "../services/scraper.service";

class ScraperController {
    async scrape(req: Request, res: Response) {
        const result = await scraperService.scrape();
        res.status(200).json(result);
    }
}

export default new ScraperController();
