import puppeteer from "puppeteer";
import { PropertyData } from "../interfaces";

interface FirstPageData {
    name: string;
    address: string;
    city: string;
    'zip code': string;
    county: string;
    type: string;
    state: string;
    nextLink?: string;
}
interface NextPageData {
    capacity: number;
    phone: string;
}


export const texasScraper = (propertyName: string) => {
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

            await page.goto('https://apps.hhs.texas.gov/LTCSearch');


            const providerNameTabSelector = '.tp3last';
            await page.waitForSelector(providerNameTabSelector);
            await page.click(providerNameTabSelector);


            const inputFieldSelector = '#searchterm';
            await page.focus(inputFieldSelector);
            await page.type(inputFieldSelector, propertyName);


            const searchbuttonSelector = '.ctaButton';
            await page.waitForSelector(searchbuttonSelector);
            const buttonList = await page.$$(searchbuttonSelector);
            const searchButton = buttonList[1];
            await searchButton.click();


            await page.waitForNavigation();

            const propertyData: PropertyData[] = [];

            const nextPagePromise = (url: string) => {
                return new Promise<NextPageData>(async (resolve, reject) => {
                    try {
                        const newPage = await browser.newPage();
                        await newPage.goto(url);

                        const generalTabSelector = '#p7TP3tab1_1';

                        await newPage.waitForSelector(generalTabSelector);

                        await newPage.click(generalTabSelector);

                        const { capacity, phone }: NextPageData = await newPage.evaluate(() => {
                            let capacity, phone;
                            try {
                                const lineContainingCapacityValue = document.querySelectorAll('div[class="p7TP3_content_07 p7TP3content current-panel"]')[0]
                                    .querySelectorAll('ul > li')[1].textContent

                                const words = lineContainingCapacityValue?.split(' ')!;
                                capacity = parseInt(words[words?.length - 1]);
                            }
                            catch (err) {
                                capacity = 0
                            }

                            try {
                                phone = document.querySelectorAll('p')[0].innerText.split('\n')[3];
                            }
                            catch (err) {
                                phone = '';
                            }
                            return { capacity, phone };
                        })

                        resolve({ capacity, phone });
                    }
                    catch (error) {
                        reject({});
                    }

                })
            }



            const firstPageData: FirstPageData[] = await page.evaluate(() => {
                const rows: Element[] = Array.from(document.querySelectorAll('table.sortabletable > tbody > tr'))

                const data = rows.map((row: Element) => {
                    const url: string = row.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href;

                    return {
                        name: row.getElementsByTagName('td')[0].innerText,
                        address: row.getElementsByTagName('td')[1].innerText,
                        city: row.getElementsByTagName('td')[2].innerText,
                        'zip code': row.getElementsByTagName('td')[3].innerText,
                        county: row.getElementsByTagName('td')[4].innerText,
                        type: row.getElementsByTagName('td')[5].innerText,
                        state: 'Texas',
                        nextLink: url,
                    }
                });

                return data;
            });


            for (let property of firstPageData) {
                const { capacity, phone } = await nextPagePromise(property.nextLink!);
                delete property.nextLink;
                propertyData.push({ ...property, capacity, phone })
            }

            await browser.close();

            resolve(propertyData);
        }
        catch (err) {
            console.log(err)
            reject([])
        }
    })

};