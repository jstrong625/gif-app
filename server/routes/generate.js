const express = require('express');
const router = express.Router();
const { generateImage } = require('../services/pollinations');
const { txt2img, cartoonTxt2img, img2img } = require('../services/novitaai');
const { animateImage, addMemeText } = require('../services/gifmaker');

async function getBaseImage(prompt, contentLevel, style, uploadedBuffer) {
  const hasPrompt = prompt && prompt.trim();
  const isCartoon = style === 'cartoon';

  if (uploadedBuffer && hasPrompt) {
    // Uploaded image + prompt: always use img2img (cartoon style handled by prompt keywords)
    return img2img(uploadedBuffer, prompt, contentLevel);
  }

  if (uploadedBuffer) {
    return uploadedBuffer;
  }

  // Text-only generation
  if (isCartoon) {
    return cartoonTxt2img(prompt, contentLevel);
  }

  const needsNovita = contentLevel === 'adult' || contentLevel === 'explicit';
  if (needsNovita) return txt2img(prompt, contentLevel);
  return generateImage(prompt, 0, contentLevel);
}

router.post('/', async (req, res) => {
  const {
    prompt = '', mode = 'gif', topText = '', bottomText = '',
    contentLevel = 'sfw', style = 'realistic', imageBase64 = null,
  } = req.body;
  const uploadedBuffer = imageBase64 ? Buffer.from(imageBase64, 'base64') : null;

  console.log('Request — prompt:', JSON.stringify(prompt), 'contentLevel:', contentLevel, 'style:', style, 'hasImage:', !!uploadedBuffer);

  if (!uploadedBuffer && !prompt.trim()) {
    return res.status(400).json({ error: 'Provide a prompt or upload an image' });
  }

  try {
    if (mode === 'meme') {
      const imageBuffer = await getBaseImage(prompt, contentLevel, style, uploadedBuffer);
      const memeBuffer = await addMemeText(imageBuffer, topText, bottomText);
      res.set('Content-Type', 'image/png');
      return res.send(memeBuffer);
    }

    const imageBuffer = await getBaseImage(prompt, contentLevel, style, uploadedBuffer);
    const gifBuffer = await animateImage(imageBuffer);
    res.set('Content-Type', 'image/gif');
    return res.send(gifBuffer);
  } catch (err) {
    console.error('Generation error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

module.exports = router;
