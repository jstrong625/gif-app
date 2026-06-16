const axios = require('axios');

const FRAME_SUFFIXES = [
  'candid natural pose',
  'slight smile, relaxed',
  'expressive, dynamic pose',
  'intense gaze, dramatic lighting',
];

const CONTENT_KEYWORDS = {
  sfw: '',
  adult: ', sensual, suggestive, tasteful nudity, artistic',
  explicit: ', explicit, uncensored, NSFW, nude',
};

async function generateImage(prompt, frameIndex = 0, contentLevel = 'sfw') {
  const suffix = FRAME_SUFFIXES[frameIndex % FRAME_SUFFIXES.length];
  const contentTag = CONTENT_KEYWORDS[contentLevel] || '';
  const fullPrompt = `${prompt}, ${suffix}${contentTag}, high quality, detailed`;
  const safe = contentLevel === 'sfw';

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=512&height=512&nologo=true&seed=${frameIndex + 1}&safe=${safe}&model=flux`;

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

module.exports = { generateImage, generateFrames };
