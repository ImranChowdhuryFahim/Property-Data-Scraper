import chromium from "@sparticuz/chromium";
import PuppeteerExtra from "puppeteer-extra";
import stealthPlugin from 'puppeteer-extra-plugin-stealth'
import { ElementHandle } from "puppeteer";

interface PropertyData {
    Name: string;
    Address: string;
    City: string;
    'Zip Code': string;
    County?: string;
    Type: string;
    State: string;
    Capacity: number;
    Phone: string;
    Map?: string;
    nextPageLink?: string;

}

interface nextPagePromise {
    county: string;
    map: string;
}


export const floridaScraper = (propertyName: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            PuppeteerExtra.use(stealthPlugin());


            const browser = await PuppeteerExtra.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });

            const page = await browser.newPage();

            await page.goto('https://quality.healthfinder.fl.gov/facilitylocator/FacilitySearch.aspx');


            const providerTypeSelector = '#ctl00_mainContentPlaceHolder_FacilityType';
            await page.waitForSelector(providerTypeSelector);
            await page.focus(providerTypeSelector);
            await page.select(providerTypeSelector, 'ALL');


            const nameInputFieldSelector = '#ctl00_mainContentPlaceHolder_FacilityName';
            await page.focus(nameInputFieldSelector);
            await page.type(nameInputFieldSelector, propertyName);


            const searchbuttonSelector = '#ctl00_mainContentPlaceHolder_SearchButton';
            await page.waitForSelector(searchbuttonSelector);
            const searchButton: ElementHandle = await page.$(searchbuttonSelector) as ElementHandle;
            await searchButton.click();


            await page.waitForNavigation();


            const nextPagePromise = (url: string) => {
                return new Promise<nextPagePromise>(async (resolve, reject) => {
                    try {
                        const newPage = await browser.newPage();
                        await newPage.goto(url);

                        const countyInfoSelector = '#ctl00_mainContentPlaceHolder_lblStreetCountyText';
                        const mapSelector = '#ctl00_mainContentPlaceHolder_mapIframe';
                        await newPage.waitForSelector(countyInfoSelector);
                        await newPage.waitForSelector(mapSelector);


                        const { county, map }: nextPagePromise = await newPage.evaluate(() => {
                            let county, map;
                            try {
                                county = document.querySelectorAll('#ctl00_mainContentPlaceHolder_lblStreetCounty')[0].textContent!;
                            }
                            catch (err) {
                                county = '';
                            }

                            try {
                                map = (document.querySelectorAll('#ctl00_mainContentPlaceHolder_mapIframe')[0] as HTMLIFrameElement).src as string;
                            }
                            catch (err) {
                                map = '';
                            }

                            return { county, map };
                        })

                        resolve({ county, map });
                    }
                    catch (error) {

                        reject({});
                    }

                })
            }

            const propertyData: PropertyData[] = await page.evaluate(() => {
                const rows: Element[] = Array.from(document.querySelectorAll('table#ctl00_mainContentPlaceHolder_dgFacilities > tbody > tr:not(:first-child)'))

                const data = rows.map((row: Element) => {
                    const url: string = row.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href;

                    return {
                        Name: row.getElementsByTagName('td')[0].innerText,
                        Type: row.getElementsByTagName('td')[1].innerText,
                        Address: row.getElementsByTagName('td')[2].innerText,
                        City: row.getElementsByTagName('td')[3].innerText,
                        State: 'Florida',
                        'Zip Code': row.getElementsByTagName('td')[5].innerText,
                        Phone: row.getElementsByTagName('td')[6].innerText,
                        nextPageLink: row.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href,

                        Capacity: parseInt(row.getElementsByTagName('td')[7].innerText),
                    }
                });

                return data;
            });

            // for (let property of propertyData) {
            //     const { county, map } = await nextPagePromise(property.nextPageLink as string);
            //     property.County = county;
            //     property.Map = map;
            //     delete property.nextPageLink;
            // }

            await browser.close();
            resolve(propertyData);
        }
        catch (err) {
            console.log(err)
            reject([])
        }
    })

};