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

function headers() {
  return { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' };
}

async function pollResult(taskId) {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await axios.get(
      `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
      { headers: headers(), timeout: 15000 }
    );
    const { status, images } = res.data;
    if (status === 'TASK_STATUS_SUCCEED' && images?.length) {
      const imageUrl = images[0].image_url || images[0].url;
      const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(imgRes.data);
    }
    if (status === 'TASK_STATUS_FAILED') {
      throw new Error('NovitaAI generation failed');
    }
  }
  throw new Error('NovitaAI timed out');
}

async function generateExplicitImage(prompt) {
  const fullPrompt = `${prompt}, explicit, NSFW, nude, photorealistic, high quality, sharp focus, 8k`;

  const res = await axios.post(
    'https://api.novita.ai/v3/async/txt2img',
    {
      extra: { response_image_type: 'png' },
      request: {
        model_name: MODEL,
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 512,
        height: 768,
        image_num: 1,
        steps: 30,
        seed: -1,
        guidance_scale: 7,
        sampler_name: 'DPM++ 2M Karras',
      },
    },
    { headers: headers(), timeout: 30000 }
  );

  return pollResult(res.data.task_id);
}

async function transformExplicitImage(imageBuffer, prompt) {
  const imageBase64 = imageBuffer.toString('base64');
  const fullPrompt = `${prompt}, explicit, NSFW, nude, photorealistic, high quality, sharp focus, 8k`;

  const res = await axios.post(
    'https://api.novita.ai/v3/async/img2img',
    {
      extra: { response_image_type: 'png' },
      request: {
        model_name: MODEL,
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        image_base64: [imageBase64],
        strength: 0.75,
        width: 512,
        height: 768,
        image_num: 1,
        steps: 30,
        seed: -1,
        guidance_scale: 7,
        sampler_name: 'DPM++ 2M Karras',
      },
    },
    { headers: headers(), timeout: 30000 }
  );

  return pollResult(res.data.task_id);
}

module.exports = { generateExplicitImage, transformExplicitImage };
