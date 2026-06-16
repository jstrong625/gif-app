const axios = require('axios');

const MODEL_ADULT = 'realisticVisionV51_v51VAE.safetensors';
const MODEL_EXPLICIT = 'epicrealism_naturalSinRC1VAE.safetensors';
const MODEL_CARTOON = 'dreamshaper_8.safetensors';

const NEGATIVE_QUALITY = 'ugly, deformed, blurry, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, cropped, low quality, jpeg artifacts';
const NEGATIVE_CLOTHES = NEGATIVE_QUALITY + ', clothes, clothed, dressed, bikini, underwear, bra, panties';
const NEGATIVE_CARTOON = 'ugly, deformed, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, low quality, realistic, photograph, 3d render';

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
  const tag = isExplicit ? ', fully nude, naked, no clothes, NSFW' : ', sensual, suggestive, tasteful nudity';
  const enriched = prompt.trim().split(' ').length < 4
    ? `beautiful woman, ${prompt}, close up, detailed`
    : prompt;
  const body = {
    model_name: isExplicit ? MODEL_EXPLICIT : MODEL_ADULT,
    prompt: `${enriched}${tag}, high quality`,
    negative_prompt: NEGATIVE_CLOTHES,
    width: 512, height: 768, image_num: 1, steps: 30,
    seed: -1, guidance_scale: 7, sampler_name: 'DPM++ 2M Karras',
  };
  const res = await axios.post('https://api.novita.ai/v3/async/txt2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI txt2img: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });
  console.log('txt2img submitted, task_id:', res.data.task_id);
  return pollResult(res.data.task_id);
}

async function cartoonTxt2img(prompt, contentLevel) {
  const isExplicit = contentLevel !== 'sfw';
  const nsfwTag = isExplicit ? ', explicit, NSFW, adult content' : '';
  const body = {
    model_name: MODEL_CARTOON,
    prompt: `(cartoon:1.4), (illustration:1.3), (comic book art:1.2), colorful, bold outlines, funny, exaggerated, ${prompt}${nsfwTag}, masterpiece, best quality`,
    negative_prompt: NEGATIVE_CARTOON,
    width: 512, height: 768, image_num: 1, steps: 30,
    seed: -1, guidance_scale: 7.5, sampler_name: 'DPM++ 2M Karras',
  };
  console.log('cartoonTxt2img submitting, prompt:', body.prompt.slice(0, 100));
  const res = await axios.post('https://api.novita.ai/v3/async/txt2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI cartoon: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });
  console.log('cartoon submitted, task_id:', res.data.task_id);
  return pollResult(res.data.task_id);
}

async function img2img(imageBuffer, prompt, contentLevel) {
  const isSfw = contentLevel === 'sfw';
  const isExplicit = contentLevel === 'explicit';

  let nudityTag, negativePrompt;
  if (isSfw) {
    nudityTag = '';
    negativePrompt = NEGATIVE_QUALITY;
  } else if (isExplicit) {
    nudityTag = ', nude, naked, no clothes, NSFW';
    negativePrompt = NEGATIVE_CLOTHES;
  } else {
    nudityTag = ', topless, no top, nude';
    negativePrompt = NEGATIVE_CLOTHES;
  }

  const body = {
    model_name: isExplicit ? MODEL_EXPLICIT : MODEL_ADULT,
    prompt: `${prompt}${nudityTag}`,
    negative_prompt: negativePrompt,
    image_base64: imageBuffer.toString('base64'),
    denoising_strength: 0.5,
    width: 512, height: 768, image_num: 1, steps: 30,
    seed: -1, guidance_scale: 7, sampler_name: 'DPM++ 2M Karras',
  };
  console.log('img2img submitting, contentLevel:', contentLevel, 'prompt:', body.prompt);
  const res = await axios.post('https://api.novita.ai/v3/async/img2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI img2img: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });
  console.log('img2img submitted, task_id:', res.data.task_id);
  return pollResult(res.data.task_id);
}

module.exports = { txt2img, cartoonTxt2img, img2img };
