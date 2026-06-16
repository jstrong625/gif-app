const express = require('express');
const multer = require('multer');
const router = express.Router();
const { generateImage } = require('../services/pollinations');
const { txt2img, img2img } = require('../services/novitaai');
const { animateImage, addMemeText } = require('../services/gifmaker');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function getBaseImage(prompt, contentLevel, uploadedBuffer) {
  const hasPrompt = prompt && prompt.trim();
  const needsNovita = contentLevel === 'adult' || contentLevel === 'explicit';

  if (uploadedBuffer && hasPrompt) {
    // Image + prompt: transform the photo with AI
    if (needsNovita) return img2img(uploadedBuffer, prompt, contentLevel);
    // SFW with image + prompt: generate fresh from prompt (Pollinations doesn't do img2img)
    return generateImage(prompt, 0, contentLevel);
  }

  if (uploadedBuffer) {
    // Image only, no prompt: animate as-is
    return uploadedBuffer;
  }

  // No image: generate from text
  if (needsNovita) return txt2img(prompt, contentLevel);
  return generateImage(prompt, 0, contentLevel);
}

router.post('/', upload.single('image'), async (req, res) => {
  const { prompt = '', mode = 'gif', topText = '', bottomText = '', contentLevel = 'sfw' } = req.body;
  const uploadedBuffer = req.file ? req.file.buffer : null;

  if (!uploadedBuffer && !prompt.trim()) {
    return res.status(400).json({ error: 'Provide a prompt or upload an image' });
  }

  try {
    if (mode === 'meme') {
      const imageBuffer = await getBaseImage(prompt, contentLevel, uploadedBuffer);
      const memeBuffer = await addMemeText(imageBuffer, topText, bottomText);
      res.set('Content-Type', 'image/png');
      return res.send(memeBuffer);
    }

    const imageBuffer = await getBaseImage(prompt, contentLevel, uploadedBuffer);
    const gifBuffer = await animateImage(imageBuffer);
    res.set('Content-Type', 'image/gif');
    return res.send(gifBuffer);
  } catch (err) {
    console.error('Generation error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

module.exports = router;
