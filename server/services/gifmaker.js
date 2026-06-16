const GIFEncoder = require('gifencoder');
const Jimp = require('jimp-compact');

const GIF_SIZE = 512;
const WORK_SIZE = 640;
const FRAME_COUNT = 16;
const FRAME_DELAY = 80;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

async function imageToPixels(img) {
  const pixelData = Buffer.alloc(GIF_SIZE * GIF_SIZE * 4);
  for (let y = 0; y < GIF_SIZE; y++) {
    for (let x = 0; x < GIF_SIZE; x++) {
      const rgba = Jimp.intToRGBA(img.getPixelColor(x, y));
      const idx = (y * GIF_SIZE + x) * 4;
      pixelData[idx] = rgba.r;
      pixelData[idx + 1] = rgba.g;
      pixelData[idx + 2] = rgba.b;
      pixelData[idx + 3] = rgba.a;
    }
  }
  return pixelData;
}

async function animateImage(imageBuffer) {
  const base = await Jimp.read(imageBuffer);
  base.resize(WORK_SIZE, WORK_SIZE);

  const encoder = new GIFEncoder(GIF_SIZE, GIF_SIZE);
  const chunks = [];
  encoder.createReadStream().on('data', (chunk) => chunks.push(chunk));
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY);
  encoder.setQuality(10);

  // zoom in from 100% → 80% then back out (smooth loop)
  const minScale = 0.78;
  for (let i = 0; i < FRAME_COUNT; i++) {
    const half = FRAME_COUNT / 2;
    const t = i < half ? i / half : (FRAME_COUNT - i) / half;
    const scale = 1 - easeInOut(t) * (1 - minScale);

    const cropSize = Math.round(WORK_SIZE * scale);
    const offset = Math.round((WORK_SIZE - cropSize) / 2);

    const frame = base.clone().crop(offset, offset, cropSize, cropSize).resize(GIF_SIZE, GIF_SIZE);
    encoder.addFrame(await imageToPixels(frame));
  }

  encoder.finish();
  await new Promise((resolve) => setTimeout(resolve, 100));
  return Buffer.concat(chunks);
}

async function addMemeText(imageBuffer, topText, bottomText) {
  const img = await Jimp.read(imageBuffer);
  img.resize(GIF_SIZE, GIF_SIZE);

  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

  if (topText) {
    img.print(font, 10, 10, { text: topText.toUpperCase(), alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 492, 50);
  }
  if (bottomText) {
    img.print(font, 10, 450, { text: bottomText.toUpperCase(), alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 492, 50);
  }

  return img.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = { animateImage, addMemeText };
