const puppeteer = require('puppeteer');
const axios = require('axios');

async function scrapeOncoKB() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.oncokb.org/actionableGenes');

    const genes = {};
    const alterations = {};

    const rowElements = await page.$$('.rt-tr.-odd');

    for (const rowElement of rowElements) {
        const genesLinks = await rowElement.$$('a');

        const geneHref = await (await genesLinks[0].getProperty('href')).jsonValue();
        const geneText = await page.evaluate((link) => link.textContent, genesLinks[0]);

        const alterationsHref = await (await genesLinks[1].getProperty('href')).jsonValue();
        const alterationsText = await page.evaluate((link) => link.textContent, genesLinks[1]);

        if (alterationsText.startsWith('Exon')) {
            continue; // Skip alterations starting with 'Exon'
        }

        genes[geneText] = geneHref;
        alterations[alterationsText] = alterationsHref;
    }

    const combinedData = [];

    for (const alterationText in alterations) {
        const geneHref = genes[alterationText];
        const alterationHref = alterations[alterationText];

        try {
            const geneResponse = await axios.get(`https://www.oncokb.org/api/private/utils/numbers${geneHref}`);
            const variantResponse = await axios.get(`https://www.oncokb.org/api/v1/variants/lookup${alterationHref}`);

            const geneData = geneResponse.data;
            const variantData = variantResponse.data;

            const combinedItem = {
                gene: geneData,
                variant: variantData,
            };

            combinedData.push(combinedItem);
        } catch (error) {
            console.error('Error fetching gene or variant data:', error);
        }
    }

    console.log('Combined Data:', combinedData);

    await browser.close();
}

scrapeOncoKB();