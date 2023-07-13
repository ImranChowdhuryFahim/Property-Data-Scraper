import puppeteer, { ElementHandle } from "puppeteer";
import { PropertyData } from "../interfaces";

interface FirstPageData {
    name: string;
    address: string;
    city: string;
    'zip code': string;
    type: string;
    state: string;
    capacity: number;
    phone: string;
    nextPageLink?: string;
}

interface NextPageData {
    county: string;
}

export const floridaScraper = (propertyName: string) => {
    return new Promise<PropertyData[]>(async (resolve, reject) => {
        try {


            const browser = await puppeteer.launch({
                args: [
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                    "--no-zygote",
                ],
                executablePath: puppeteer.executablePath(),
                headless: "new",
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

            const propertyData: PropertyData[] = [];


            const nextPagePromise = (url: string) => {
                return new Promise<NextPageData>(async (resolve, reject) => {
                    try {
                        const newPage = await browser.newPage();
                        await newPage.goto(url);

                        const countyInfoSelector = '#ctl00_mainContentPlaceHolder_lblStreetCountyText';
                        const mapSelector = '#ctl00_mainContentPlaceHolder_mapIframe';
                        await newPage.waitForSelector(countyInfoSelector);
                        await newPage.waitForSelector(mapSelector);


                        const { county } = await newPage.evaluate(() => {
                            let county;
                            try {
                                county = document.querySelectorAll('#ctl00_mainContentPlaceHolder_lblStreetCounty')[0].textContent as string;
                            }
                            catch (err) {
                                county = '';
                            }



                            return { county };
                        })

                        resolve({ county });
                    }
                    catch (error) {

                        reject({});
                    }

                })
            }

            const firstPageData: FirstPageData[] = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('table#ctl00_mainContentPlaceHolder_dgFacilities > tbody > tr:not(:first-child)'))

                const data = rows.map((row) => {
                    return {
                        name: row.getElementsByTagName('td')[0].innerText,
                        type: row.getElementsByTagName('td')[1].innerText,
                        address: row.getElementsByTagName('td')[2].innerText,
                        city: row.getElementsByTagName('td')[3].innerText,
                        state: 'Florida',
                        'zip code': row.getElementsByTagName('td')[5].innerText,
                        phone: row.getElementsByTagName('td')[6].innerText,
                        nextPageLink: row.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href,
                        capacity: parseInt(row.getElementsByTagName('td')[7].innerText),
                    }
                });

                return data;
            });


            for (let property of firstPageData) {
                const { county } = await nextPagePromise(property.nextPageLink as string);
                delete property.nextPageLink;
                propertyData.push({ ...property, county });

            }

            await browser.close();
            resolve(propertyData);
        }
        catch (err) {
            reject(err)
        }
    })

};