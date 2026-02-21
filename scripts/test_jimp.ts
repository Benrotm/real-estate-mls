import { Jimp } from 'jimp';
import fs from 'fs';

async function run() {
    const buf = fs.readFileSync('phone_debug.png');

    try {
        const image = await Jimp.read(buf);
        image.resize({ w: image.bitmap.width * 3, h: image.bitmap.height * 3 });
        image.invert();

        const out = await image.getBuffer('image/png');
        fs.writeFileSync('phone_debug_out.png', out);
        console.log('Processed image saved.');
    } catch (e) {
        console.error(e);
    }
}
run();
