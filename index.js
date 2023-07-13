const puppeteer = require('puppeteer');
const axios = require('axios');

const API_KEY = '3e751cb2-8ed2-4dfd-ac3a-d3f42605ca17';

async function scrapeOncoKB() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.oncokb.org/actionableGenes');

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

        // Add code to make API requests and combine JSON object
        const geneResponse = await axios.get(`https://www.oncokb.org/api/private/utils/numbers/gene/${item.geneHref}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const variantResponse = await axios.get(`https://www.oncokb.org/api/v1/variants/lookup?hugoSymbol=${item.geneHref}&variant=${item.alterationsHref}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const geneData = geneResponse.data;
        const variantData = variantResponse.data;

        // Combine gene and variant data into a single JSON object
        const combinedItem = {
            gene: geneData,
            variant: variantData
        };

        console.log('Combined Data:', combinedItem);
    }

    await browser.close();
}

scrapeOncoKB();
