const axios = require('axios');

const MODEL_ADULT = 'realisticVisionV51_v51VAE.safetensors';
const MODEL_EXPLICIT = 'epicrealism_naturalSinRC1VAE.safetensors';

const NEGATIVE_SFW = 'ugly, deformed, blurry, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, cropped, low quality, jpeg artifacts';
const NEGATIVE_ADULT = NEGATIVE_SFW + ', clothes, clothed, dressed, bikini, underwear, bra, panties';

function getApiKey() {
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) throw new Error('Add NOVITA_API_KEY in your Render Environment settings.');
  return apiKey;
}

function authHeaders() {
  return { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' };
}

async function pollResult(taskId) {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await axios.get(
      `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
      { headers: authHeaders(), timeout: 15000 }
    );
    const status = res.data.task?.status;
    const images = res.data.images;
    console.log('Poll:', status, JSON.stringify(res.data).slice(0, 150));
    if (status === 'TASK_STATUS_SUCCEED' && images?.length) {
      const imgRes = await axios.get(images[0].image_url, { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(imgRes.data);
    }
    if (status === 'TASK_STATUS_FAILED') throw new Error('NovitaAI failed: ' + JSON.stringify(res.data));
  }
  throw new Error('NovitaAI timed out');
}

async function txt2img(prompt, contentLevel) {
  const isExplicit = contentLevel === 'explicit';
  const tag = isExplicit ? ', fully nude, naked, no clothes, NSFW, explicit' : ', sensual, suggestive, tasteful nudity';
  const body = {
    model_name: isExplicit ? MODEL_EXPLICIT : MODEL_ADULT,
    prompt: `${prompt}${tag}, photorealistic, high quality, 8k`,
    negative_prompt: NEGATIVE_ADULT,
    width: 512, height: 768, image_num: 1, steps: 30,
    seed: -1, guidance_scale: 7, sampler_name: 'DPM++ 2M Karras',
  };
  const res = await axios.post('https://api.novita.ai/v3/async/txt2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI txt2img: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });
  console.log('txt2img submitted, task_id:', res.data.task_id);
  return pollResult(res.data.task_id);
}

async function img2img(imageBuffer, prompt, contentLevel) {
  const isSfw = contentLevel === 'sfw';
  const isExplicit = contentLevel === 'explicit';
  let tag, negativePrompt, denoisingStrength;

  if (isSfw) {
    tag = ', artistic, clothed, natural lighting, high quality, 8k';
    negativePrompt = NEGATIVE_SFW;
    denoisingStrength = 0.65;
  } else if (isExplicit) {
    tag = ', fully nude, naked, no clothes, NSFW, explicit';
    negativePrompt = NEGATIVE_ADULT;
    denoisingStrength = 0.95;
  } else {
    tag = ', sensual, suggestive, tasteful nudity';
    negativePrompt = NEGATIVE_ADULT;
    denoisingStrength = 0.75;
  }

  const body = {
    model_name: isExplicit ? MODEL_EXPLICIT : MODEL_ADULT,
    prompt: `${prompt}${tag}, photorealistic, high quality, 8k`,
    negative_prompt: negativePrompt,
    image_base64: imageBuffer.toString('base64'),
    denoising_strength: denoisingStrength,
    width: 512, height: 768, image_num: 1, steps: 30,
    seed: -1, guidance_scale: 7, sampler_name: 'DPM++ 2M Karras',
  };
  console.log('img2img submitting, contentLevel:', contentLevel, 'model:', body.model_name, 'denoising_strength:', denoisingStrength);
  const res = await axios.post('https://api.novita.ai/v3/async/img2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI img2img: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });
  console.log('img2img submitted, task_id:', res.data.task_id);
  return pollResult(res.data.task_id);
}

module.exports = { txt2img, img2img };
