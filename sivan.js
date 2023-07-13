


const puppeteer = require('puppeteer');

async function scrapeOncoKB() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.oncokb.org/actionableGenes'); // Replace with your target URL

    const genes = {};
    const alterations = {};

    const data = [];

    const rowElements = await page.$$('.rt-tr.-odd');

    for (const rowElement of rowElements) {
        const [genLinks, alterationLinks] = await rowElement.$$('a');

        const geneHref = await (await genLinks.getProperty('href')).jsonValue();
        const geneText = await page.evaluate((link) => link.textContent, genLinks);

        const alterationsHref = await (await alterationLinks.getProperty('href')).jsonValue();
        const alterationsText = await page.evaluate((link) => link.textContent, alterationLinks);

        data.push({
            geneHref,
            geneText,
            alterationsHref,
            alterationsText
        });
    }


    for (const item of data) {
        console.log(`Gene Href: ${item.geneHref}`);
        console.log(`Gene Text: ${item.geneText}`);
        console.log(`Alterations Href: ${item.alterationsHref}`);
        console.log(`Alterations Text: ${item.alterationsText}`);
        console.log('----------------------');
    }

    await browser.close();
}

scrapeOncoKB();

