import { DataTobeScraped, PropertyData } from "../interfaces";
import { scraper } from "../scraper";

class ScraperService {
    async scrape() {
        const list: DataTobeScraped[] = [
            { name: 'Brookdale Creekside', state: 'Texas' }
            // , { name: 'The Delaney At Georgetown Village', state: 'Texas' },
            // { name: 'The Isle At Watermere', state: 'Florida' }
            // , { name: 'Emerald Park of Hollywood', state: 'Florida' },
            // { name: 'Banyan Place', state: 'Florida' }
        ]
        const promises: Promise<PropertyData[]>[] = [];

            for (let property of list) {
                if (property.state === 'Texas') {
                    promises.push(scraper.texasScraper(property.name));
                }
                else if (property.state === 'Florida') {
                    promises.push(scraper.floridaScraper(property.name))
                }
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