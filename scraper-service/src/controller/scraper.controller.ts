import { NextFunction, Request, Response } from "express";
import { scraper } from "../services";

class ScraperController {
    async getFloridaScraper(req: Request, res: Response, next: NextFunction) {
        const result = await scraper.floridaScraper('Banyan Place');
        res.status(200).json(result);
    }

    // async getTexasScraper(req: Request, res: Response) {
    //     const result = await scraper.texasScraper('');
    //     res.status(200).json(result);
    // }
}

export default new ScraperController();
