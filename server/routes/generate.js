const express = require('express');
const multer = require('multer');
const router = express.Router();
const { generateImage } = require('../services/pollinations');
const { generateExplicitImage } = require('../services/novitaai');
const { animateImage, addMemeText } = require('../services/gifmaker');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function getBaseImage(prompt, contentLevel) {
  if (contentLevel === 'explicit') {
    return generateExplicitImage(prompt);
  }
  return generateImage(prompt, 0, contentLevel);
}

router.post('/', upload.single('image'), async (req, res) => {
  const { prompt = '', mode = 'gif', topText = '', bottomText = '', contentLevel = 'sfw' } = req.body;
  const hasImage = !!req.file;

  if (!hasImage && !prompt.trim()) {
    return res.status(400).json({ error: 'Provide a prompt or upload an image' });
  }

  try {
    if (mode === 'meme') {
      const imageBuffer = hasImage ? req.file.buffer : await getBaseImage(prompt, contentLevel);
      const memeBuffer = await addMemeText(imageBuffer, topText, bottomText);
      res.set('Content-Type', 'image/png');
      return res.send(memeBuffer);
    }

    const imageBuffer = hasImage ? req.file.buffer : await getBaseImage(prompt, contentLevel);
    const gifBuffer = await animateImage(imageBuffer);
    res.set('Content-Type', 'image/gif');
    return res.send(gifBuffer);
  } catch (err) {
    console.error('Generation error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

module.exports = router;
