const axios = require('axios');

const MODEL = 'realisticVisionV51_v51VAE.safetensors';
const NEGATIVE_PROMPT = 'ugly, deformed, blurry, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, cropped, low quality, jpeg artifacts, clothes, clothed, dressed';

function getApiKey() {
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) {
    throw new Error('Explicit mode requires a NovitaAI API key. Add NOVITA_API_KEY in your Render Environment settings.');
  }
  return apiKey;
}

// Text-to-image: generate from prompt only
async function generateExplicitImage(prompt) {
  const apiKey = getApiKey();
  const fullPrompt = `${prompt}, explicit, NSFW, nude, photorealistic, high quality, sharp focus, professional photography, 8k`;

  const response = await axios.post(
    'https://api.novita.ai/v3/sync/txt2img',
    {
      model_name: MODEL,
      prompt: fullPrompt,
      negative_prompt: NEGATIVE_PROMPT,
      width: 512,
      height: 768,
      sampler_name: 'DPM++ 2M Karras',
      cfg_scale: 7,
      steps: 30,
      batch_size: 1,
      n_iter: 1,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 120000,
    }
  );

  const base64 = response.data.data.imgs_bytes?.[0] || response.data.data.images?.[0];
  if (!base64) throw new Error('No image returned from NovitaAI');
  return Buffer.from(base64, 'base64');
}

// Image-to-image: transform an uploaded photo using a prompt
async function transformExplicitImage(imageBuffer, prompt) {
  const apiKey = getApiKey();
  const imageBase64 = imageBuffer.toString('base64');
  const fullPrompt = `${prompt}, explicit, NSFW, nude, photorealistic, high quality, sharp focus, 8k`;

  const response = await axios.post(
    'https://api.novita.ai/v3/sync/img2img',
    {
      model_name: MODEL,
      prompt: fullPrompt,
      negative_prompt: NEGATIVE_PROMPT,
      image_base64: imageBase64,
      strength: 0.75,        // how much to change the image (0=keep original, 1=ignore original)
      width: 512,
      height: 768,
      sampler_name: 'DPM++ 2M Karras',
      cfg_scale: 7,
      steps: 30,
      batch_size: 1,
      n_iter: 1,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 120000,
    }
  );

  const base64 = response.data.data.imgs_bytes?.[0] || response.data.data.images?.[0];
  if (!base64) throw new Error('No image returned from NovitaAI');
  return Buffer.from(base64, 'base64');
}

module.exports = { generateExplicitImage, transformExplicitImage };
