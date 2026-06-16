const axios = require('axios');

const FRAME_SUFFIXES = [
  'natural expression, candid moment',
  'slight smile, relaxed pose',
  'expressive look, dynamic pose',
  'intense gaze, dramatic lighting',
];

const CONTENT_TAGS = {
  sfw: 'tasteful, elegant, artistic',
  adult: 'sensual, alluring, suggestive, tasteful nudity, artistic boudoir',
};

async function generateImage(prompt, frameIndex = 0, contentLevel = 'sfw') {
  const suffix = FRAME_SUFFIXES[frameIndex % FRAME_SUFFIXES.length];
  const contentTag = CONTENT_TAGS[contentLevel] || CONTENT_TAGS.sfw;
  const fullPrompt = `${prompt}, ${suffix}, ${contentTag}, photorealistic, high quality, sharp focus, professional photography, 8k`;
  const safe = contentLevel === 'sfw';

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=768&height=768&nologo=true&seed=${Date.now() + frameIndex}&safe=${safe}&model=flux-realism&enhance=true`;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
  });

  return Buffer.from(response.data);
}

async function generateCartoon(prompt, contentLevel = 'sfw') {
  const isAdult = contentLevel !== 'sfw';
  const styleTag = 'cartoon, comic art, colorful illustration, funny, exaggerated, animated style, bold outlines, vibrant colors';
  const adultTag = isAdult ? ', adult cartoon, NSFW, explicit cartoon, uncensored' : '';
  const fullPrompt = `${prompt}, ${styleTag}${adultTag}`;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=768&height=768&nologo=true&seed=${Date.now()}&safe=false&model=flux&enhance=true`;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
  });

  return Buffer.from(response.data);
}

async function generateFrames(prompt, frameCount = 4, contentLevel = 'sfw') {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const buf = await generateImage(prompt, i, contentLevel);
    frames.push(buf);
  }
  return frames;
}

module.exports = { generateImage, generateCartoon, generateFrames };
