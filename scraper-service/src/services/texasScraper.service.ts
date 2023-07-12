import puppeteer from "puppeteer";

interface PropertyData {
    Name: string;
    Address: string;
    City: string;
    'Zip Code': string;
    County: string;
    Type: string;
    State: string;
    Capacity: number;
    nextLink?: string;
    Phone?: string;
    Map?: String;
}

interface Bundle {
    capacity?: number;
    phone?: string;
    map?: string;
}

export const texasScraper = (propertyName: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({
                headless: true
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

            const nextPagePromise = (url: string) => {
                return new Promise<Bundle>(async (resolve, reject) => {
                    try {
                        const newPage = await browser.newPage();
                        await newPage.goto(url);

                        const generalTabSelector = '#p7TP3tab1_1';

                        await newPage.waitForSelector(generalTabSelector);

                        await newPage.click(generalTabSelector);

                        const { capacity, phone, map }: Bundle = await newPage.evaluate(() => {
                            let capacity, phone, map;
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

                            try {
                                map = document.querySelectorAll('p')[0].getElementsByTagName('a')[0].href;
                            }
                            catch (err) {
                                map = ''
                            }


                            return { capacity, phone, map };
                        })

                        resolve({ capacity, phone, map } as Bundle);
                    }
                    catch (error) {
                        reject({} as Bundle);
                    }

                })
            }



            const propertyData: PropertyData[] = await page.evaluate(() => {
                const rows: Element[] = Array.from(document.querySelectorAll('table.sortabletable > tbody > tr'))

                const data = rows.map((row: Element) => {
                    const url: string = row.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href;

                    return {
                        Name: row.getElementsByTagName('td')[0].innerText,
                        Address: row.getElementsByTagName('td')[1].innerText,
                        City: row.getElementsByTagName('td')[2].innerText,
                        'Zip Code': row.getElementsByTagName('td')[3].innerText,
                        County: row.getElementsByTagName('td')[4].innerText,
                        Type: row.getElementsByTagName('td')[5].innerText,
                        State: 'Texas',
                        Capacity: 0,
                        nextLink: url,
                    }
                });

                return data;
            });


            for (let property of propertyData) {
                const { capacity, phone, map } = await nextPagePromise(property.nextLink!);
                property.Capacity = capacity as number;
                property.Phone = phone;
                property.Map = map;
                delete property.nextLink;
            }

            console.log(propertyData)


            await browser.close();

            resolve(propertyData);
        }
        catch (err) {
            console.log(err)
            reject([])
        }
    })

};