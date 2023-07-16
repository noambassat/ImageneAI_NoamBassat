const puppeteer = require('puppeteer');

async function scrapeOncoKB() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.oncokb.org/actionableGenes`);
    await page.waitForTimeout(10000);  // wait 10 secs

    const all_data = await page.evaluate(
        ()=> {
            const data = []
            const rows = document.querySelectorAll('.rt-tbody .rt-tr');
            rows.forEach((row, index) => {


                const [geneATag, alterationATag] = row.querySelectorAll('a');
                const current_row = {
                    gene: {text: geneATag.innerText, link: `https://www.oncokb.org${encodeURI(geneATag.getAttribute('href'))}`},
                    alteration:  {text: alterationATag.innerText, link: `https://www.oncokb.org${encodeURI(alterationATag.getAttribute('href'))}`},
                }

                const pattern = /Exon 19 in-frame deletions and (\d+) other alterations/;
                // in order to ignore this pattern of alteration text
                const matchResult = current_row.alteration.text.match(pattern);
                if((data.length === 0 || data[data.length-1].alteration.link !== current_row.alteration.link)
                    &&  !matchResult){

                    data.push(current_row)
                }//pushes: first argument of the data (empty data), avoid duplicates & ignore 'pattern'
                // I chose to ignore the duplicates rows because they use the exact same links.

            })
            return data
        })
    console.log(all_data)
    const combinedJson = {}

    for(const data of all_data) {
        try {
            const alterationLink = data.alteration.link
            await page.goto(alterationLink)
            await page.setDefaultTimeout(10000);// Default timeout for all Puppeteer operations on a page

            const geneResponse = await page.waitForResponse(
                response =>
                    response.url().includes('https://www.oncokb.org/api/private/utils/numbers/gene/') && response.status() === 200
            );
            const geneUrl = geneResponse.url()
            const gene = geneUrl.split('/').pop()
            // Extract gene
            const variantResponse = await page.waitForResponse(
                response =>
                    response.url().includes(`https://www.oncokb.org/api/v1/variants/lookup?hugoSymbol=${encodeURI(gene)}`) && response.status() === 200
            );

            const variantUrl = variantResponse.url()
            const variantUrlSearchParams = new URLSearchParams(variantUrl.split('?').pop());
            // URLSearchParams -> parsing into objects
            const variant = variantUrlSearchParams.get('variant') ? decodeURI(variantUrlSearchParams.get('variant')) : null
            // Extract variant
            combinedJson[alterationLink] = {gene, variant}

        }
        catch (error){

            console.log(error)
        }
    }
    console.log(combinedJson)
    await browser.close();


    // save as Json file
    const fs = require('fs');
    const jsonString = JSON.stringify(combinedJson);
    const filePath = './combinedJson.json';
    fs.writeFile(filePath, jsonString, (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
            return;
        }
        console.log('JSON file has been saved successfully.');
    });

}

scrapeOncoKB();
