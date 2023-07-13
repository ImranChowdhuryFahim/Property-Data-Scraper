import { DataTobeScraped, PropertyData } from "../interfaces";
import { scraper } from "../scraper";

class ScraperService {
    async scrape({ name, state }: { name: string; state: string; }) {

        const promises: Promise<PropertyData[]>[] = [];


        if (state === 'Texas') {
            promises.push(scraper.texasScraper(name));
        }
        else if (state === 'Florida') {
            promises.push(scraper.floridaScraper(name))
        }




        try {
            const promiseResponse = await Promise.all(promises);
            const result = ([] as PropertyData[]).concat(...promiseResponse)
            return result;
        } catch (err) {
            throw Error((err as Error).message);
        }


    }
}

export default new ScraperService();