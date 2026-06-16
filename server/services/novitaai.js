const axios = require('axios');

// Adult-content capable model on NovitaAI
const MODEL = 'realisticVisionV51_v51VAE.safetensors';

const NEGATIVE_PROMPT = 'ugly, deformed, blurry, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, cropped, low quality, jpeg artifacts';

async function generateExplicitImage(prompt) {
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) {
    throw new Error('Explicit mode requires a NovitaAI API key. Add NOVITA_API_KEY to your Render environment variables. Sign up free at novita.ai');
  }

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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  const base64 = response.data.data.imgs_bytes?.[0] || response.data.data.images?.[0];
  if (!base64) throw new Error('No image returned from NovitaAI');
  return Buffer.from(base64, 'base64');
}

module.exports = { generateExplicitImage };
