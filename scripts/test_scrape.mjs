
import * as cheerio from 'cheerio';

async function test() {
    const url = 'https://casadomi.ro/casa-vila-6-camere-de-vanzare-braytim-timisoara-367';
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('Gallery ID exists:', $('#property-main-gallery').length > 0);
    console.log('Gallery items count:', $('.property-main-gallery-item').length);

    // Find the element containing "Nr. camere"
    let specEl = null;
    $(':contains("Nr. camere")').each((i, el) => {
        // We want the most specific one (the one with no children containing it)
        if ($(el).find(':contains("Nr. camere")').length === 0) {
            specEl = $(el);
        }
    });

    if (specEl) {
        console.log('Found Spec Element tag:', specEl.prop('tagName'));
        console.log('Found Spec Element classes:', specEl.attr('class'));
        console.log('Found Spec Element parent tag:', specEl.parent().prop('tagName'));
        console.log('Found Spec Element parent classes:', specEl.parent().attr('class'));
        console.log('Found Spec Element parent parent classes:', specEl.parent().parent().attr('class'));
    } else {
        console.log('Could not find spec element via :contains');
    }

    console.log('Details container exists:', $('.property-show-details').length > 0);
    console.log('Details HTML snippet:', $('.property-show-details').html()?.substring(0, 500));

    if ($('.property-show-details').length === 0) {
        // Search for text in body
        console.log('Body length:', $('body').text().length);
        console.log('Body includes Nr. camere:', $('body').text().includes('Nr. camere'));
    }

    $('.property-show-details li').each((i, el) => {
        const text = $(el).text().trim();
        console.log(`Detail ${i}:`, text);
        if (text.includes('Nr. camere')) console.log('Found Rooms:', text);
        if (text.includes('S. utila')) console.log('Found Area:', text);
        if (text.includes('Regim inaltime')) console.log('Found Floor:', text);
    });

    const images = [];
    $('.property-main-gallery-item img').each((i, el) => {
        images.push($(el).attr('src'));
    });
    console.log('Images Count:', images.length);
}

test();
