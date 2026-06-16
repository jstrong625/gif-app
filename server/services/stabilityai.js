const axios = require('axios');

const BASE_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

const FRAME_SUFFIXES = [
  'natural expression, candid',
  'slight smile, relaxed',
  'bigger smile, warm expression',
  'laughing, joyful expression',
];

async function generateImage(prompt, frameIndex = 0) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('STABILITY_API_KEY not configured. Add your key to server/.env');
  }

  const fullPrompt = `${prompt}, ${FRAME_SUFFIXES[frameIndex % FRAME_SUFFIXES.length]}, high quality, detailed`;

  const response = await axios.post(
    BASE_URL,
    {
      text_prompts: [
        { text: fullPrompt, weight: 1 },
        { text: 'blurry, low quality, distorted, ugly, bad anatomy', weight: -1 },
      ],
      cfg_scale: 7,
      steps: 30,
      samples: 1,
      width: 512,
      height: 512,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 60000,
    }
  );

  const base64 = response.data.artifacts[0].base64;
  return Buffer.from(base64, 'base64');
}

async function generateFrames(prompt, frameCount = 4) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const buf = await generateImage(prompt, i);
    frames.push(buf);
  }
  return frames;
}

module.exports = { generateImage, generateFrames };
