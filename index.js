const puppeteer = require('puppeteer');

async function scrapeOncoKB() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.oncokb.org/actionableGenes'); // Replace with your target URL

    const genes = {};
    const alterations = {};

    const rowElements = await page.$$('.rt-tr.-odd');

    for (const rowElement of rowElements) {
        const links = await rowElement.$$('a');

        const geneHref = await (await links[0].getProperty('href')).jsonValue();
        const geneText = await page.evaluate((link) => link.textContent, links[0]);

        const alterationsHref = await (await links[1].getProperty('href')).jsonValue();
        const alterationsText = await page.evaluate((link) => link.textContent, links[1]);

        genes[geneText] = geneHref;
        alterations[alterationsText] = alterationsHref


    }

    console.log('Gene Links:', genes);
    console.log('Gene geneTexts:', alterations);


    await browser.close();
}

scrapeOncoKB();